# さくらレンタルサーバ デプロイ手順（SSH手動・初期ドメイン）

対象: スタンダード以上（SSH可）／初期ドメイン `XXXX.sakura.ne.jp`（公開フォルダ `~/www`）／MySQL作成済み。

> 置換する値:
> - `USER` … さくらのアカウント名（SSHユーザー／ホーム `/home/USER`）
> - `XXXX.sakura.ne.jp` … 初期ドメイン
> - MySQL接続情報（DBサーバ名・DB名・ユーザー・パスワード）

構成（共有ホスティングのLaravel定石）:
```
/home/USER/
├── toorisugari/        ← Laravelアプリ本体（= リポジトリの backend/ の中身。Web非公開）
│   ├── app/ bootstrap/ config/ database/ routes/ vendor/ storage/ ...
│   └── public/         ← 公開ルート（index.php, .htaccess, pos/, pc/, storage→）
└── www/                ← 初期ドメインの公開フォルダ（固定）→ public への symlink にする
```
フロント（pos/pc）は **Node常駐不可のためローカルでビルド**して `backend/public/{pos,pc}` を一緒にアップします。

---

## 0. 事前準備（さくらコントロールパネル）
1. **PHPバージョン**を 8.2 以上に設定（Laravel 13要件）。
2. **無料SSL（Let's Encrypt）**を初期ドメインに設定 → `https://XXXX.sakura.ne.jp` を有効化。
3. **MySQL** のDB名／DBサーバ名／ユーザー／パスワードを控える。

## 1. ローカルでフロントをビルド
```powershell
cd C:\Apache24\htdocs\toorisugari_tool\frontend
npm install
npm run build      # backend/public/pos, backend/public/pc に出力
```

## 2. アップロード（WinSCP などのSFTP）
`backend/` の中身を **`/home/USER/toorisugari/`** へアップロード。
- **含める**: app, bootstrap, config, database, public（pos/pc込み）, resources, routes, artisan, composer.json, composer.lock など
- **除外**: `node_modules`（無い）, `.env`（サーバ側で作成）, `.git`
- `vendor/` は「アップロードしてもよい」が、手順3でサーバ生成するなら除外でOK
- `storage/` はアップロード可。ただし `storage/logs/*.log` や `storage/framework/{cache,sessions,views}/` の中身は不要（空でよい）

> SFTP例: WinSCP で `/home/USER/` に接続し、ローカル `backend\*` を `toorisugari` フォルダへドラッグ。

## 3. サーバ初期設定（SSH）
```bash
ssh USER@XXXX.sakura.ne.jp

# PHP 8.2+ を確認。古ければバージョン付きパスを使う（例を確認）
php -v
ls /usr/local/php/             # 例: 8.3 があれば /usr/local/php/8.3/bin/php
# 以降 php が8.2未満なら、php を /usr/local/php/8.3/bin/php に読み替え

cd ~/toorisugari

# Composer 導入（未導入なら）
curl -sS https://getcomposer.org/installer | php
php composer.phar install --no-dev --optimize-autoloader

# .env を作成して編集
cp .env.production.example .env
vi .env          # APP_URL, DB_* を実値に。DB_PASSWORD もここに記入
php artisan key:generate

# DBスキーマ作成（本番データで初期化）
php artisan migrate --force
php artisan db:seed --class=DatabaseSeeder --force   # 商品・ユーザーの初期投入（デモ会計は入れない）

# 画像公開用シンボリックリンク
php artisan storage:link

# 本番最適化（設定・ビューのキャッシュ）
# ※ route:cache はクロージャルートがあるため使わない（エラーになる）
php artisan config:cache
php artisan view:cache

# 権限（storage/ と bootstrap/cache を書込可に）
chmod -R 775 storage bootstrap/cache
```

## 4. 公開フォルダを public に向ける（初期ドメイン ~/www）
既定の `~/www` を Laravel の `public` への **シンボリックリンク**に置き換えます。
```bash
cd ~
# 既存wwwを退避（初回のみ）
mv www www_default_backup
ln -s ~/toorisugari/public www
```
> これで `https://XXXX.sakura.ne.jp/` → `~/toorisugari/public/index.php`（Laravel）に届きます。
> `public/.htaccess`（Laravel標準）が存在せずパスが通らない場合は、Laravelの `public/.htaccess` がアップされているか確認してください。

**代替（symlinkが使えない場合）**: `~/www` を残し、`public/` の中身を `~/www/` にコピー＋ `~/www/index.php` の require パスを `~/toorisugari` 向けに修正、`ln -s ~/toorisugari/storage/app/public ~/www/storage`。

## 5. 動作確認
- `https://XXXX.sakura.ne.jp/api/health` → `{"ok":true,...}`（JSON）
- `https://XXXX.sakura.ne.jp/pos/` → スマホレジ（ゲスト `1111` でログイン）
- `https://XXXX.sakura.ne.jp/pc/` → PC分析（オーナーでログイン）
- 会計を1件通して `/pc/` 売上に反映されるか

## 6. セキュリティ（公開前に必須）
初期シードの資格情報を**必ず変更**してください。
```bash
cd ~/toorisugari
php artisan tinker
>>> $u = App\Models\User::where('email','owner@toorisugari.test')->first();
>>> $u->email = 'あなたのメール'; $u->password = Hash::make('強いパスワード'); $u->pin_hash = Hash::make('新しい4桁'); $u->save();
>>> // ゲスト等のPINも同様に Hash::make('xxxx')
```
- `.env` の `APP_DEBUG=false` を確認。
- `.env` がWeb公開されていないこと（publicの外にあるのでOK）。

## 7. 更新デプロイ（2回目以降）
```powershell
# ローカル: フロント再ビルド
cd frontend; npm run build
```
```bash
# 変更分を再アップ（public/pos, public/pc, app配下など）後、サーバで:
cd ~/toorisugari
php composer.phar install --no-dev --optimize-autoloader   # 依存変更時のみ
php artisan migrate --force                                # マイグレーション追加時のみ
php artisan config:clear && php artisan config:cache && php artisan view:cache
```

## 8. トラブルシュート
- **500エラー**: `storage/logs/laravel.log` を確認。`chmod -R 775 storage bootstrap/cache`、`APP_KEY` 未設定、`.env` のDB値を確認。
- **/pos/ が真っ白**: `public/pos/index.html` がアップされているか、`base:/pos/` のビルドか確認。
- **画像が出ない**: `php artisan storage:link` 済みか、`~/toorisugari/storage/app/public/products` に画像があるか。
- **PHPが古い**: コントロールパネルのPHP設定と、CLIの `php -v`（composer/artisanで使うphp）が両方8.2+か。
- **設定変更が反映されない**: `php artisan config:clear` 後に再 `config:cache`。
