# とおりすがりの和紅茶 — POS / 分析システム 開発メモ

## 構成

```
toorisugari_tool/
├── backend/          Laravel 13 (API専用 + Sanctum / MySQL)
│   └── public/
│       ├── pos/      ← frontend/pos のビルド出力（本番配信先）
│       └── pc/       ← frontend/pc のビルド出力（本番配信先）
├── frontend/         npm workspaces
│   ├── shared/       共有: theme.css / 型(types.ts) / APIクライアント(api.ts)
│   ├── pos/          スマホレジ SPA (React+TS, base=/pos/)
│   └── pc/           PC分析 SPA   (React+TS, base=/pc/)
└── pos_regi_design/  元デザイン案（参照用・React Babelプロト）
```

## URL（ディレクトリ分離）

| URL | 役割 |
|-----|------|
| `/pos/` | スマホレジ（注文〜会計） |
| `/pc/`  | PC分析（外部アクセス可・要ログイン） |
| `/api/` | JSON API (Laravel) |

## ローカル開発（推奨ワークフロー）

開発は **Vite dev サーバ（HMR）＋ Laravel API** の2プロセスで行う。

**1. API サーバ（Laravel）**
```powershell
cd backend
php artisan serve            # http://127.0.0.1:8000
```

**2. フロント dev サーバ（別ターミナル）**
```powershell
cd frontend
npm run dev:pos              # http://localhost:5173/pos/  （スマホレジ）
# または
npm run dev:pc               # http://localhost:5174/pc/   （PC分析）
```
`/api/*` は Vite proxy が自動で Laravel(:8000) へ転送する。

> 注意: `php artisan serve`（PHP組み込みサーバ）はSPAサブディレクトリの
> 静的配信が不安定なため、**ローカルのSPA確認は必ず Vite dev サーバ**を使う。
> 本番 Apache では `.htaccess`→`index.php`→Laravelキャッチオールで正しく配信される。

## 本番ビルド

```powershell
cd frontend
npm run build                # pos・pc を backend/public/{pos,pc} に出力
```
Laravel の `routes/web.php` が `/pos`・`/pc` をビルド済み index.html にフォールバック配信する。

## DB

- ローカル: MySQL `toorisugari` / user `toori_app` / pass `toori_dev_pw`
- マイグレーション＆シード: `cd backend && php artisan migrate:fresh --seed`
- シードログイン:
  - オーナー（PC分析）: `owner@toorisugari.test` / `password`（PIN `1234`）
  - スタッフ（レジPIN）: みどり `1111` / そう `2222` / はる `3333`

## API（フェーズ2時点）

| メソッド | パス | 内容 |
|---|---|---|
| GET | `/api/health` | 疎通確認 |
| GET | `/api/products` | カテゴリ＋商品一覧（注文画面用） |
| GET | `/api/user` | 認証ユーザー（Sanctum） |
