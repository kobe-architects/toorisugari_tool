<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Product;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    public function run(): void
    {
        $this->seedUsers();
        $this->seedCatalog();
    }

    /**
     * スタッフ（PIN入店）とオーナー（PC分析用メールログイン）。
     */
    private function seedUsers(): void
    {
        // オーナー（店長）— PC分析はメール+パスワード、レジ・管理はPIN
        User::updateOrCreate(
            ['email' => 'owner@toorisugari.test'],
            [
                'role' => 'owner',
                'name' => '店長',
                'display_initial' => '店',
                'password' => Hash::make('password'),
                'pin_hash' => Hash::make('1234'),
                'is_active' => true,
            ],
        );

        // スタッフ — PINのみ（ゲストのみ）
        $staff = [
            ['name' => 'ゲスト', 'initial' => 'ゲ', 'pin' => '1111'],
        ];
        foreach ($staff as $s) {
            User::updateOrCreate(
                ['name' => $s['name'], 'role' => 'staff'],
                [
                    'display_initial' => $s['initial'],
                    'pin_hash' => Hash::make($s['pin']),
                    'is_active' => true,
                ],
            );
        }
    }

    /**
     * カテゴリ＆商品（既存デザイン data.jsx の MENU を移植）。
     */
    private function seedCatalog(): void
    {
        $categories = [
            ['slug' => 'drink',   'label' => 'ドリンク', 'sub' => 'Drink'],
            ['slug' => 'tasting', 'label' => '飲み比べ', 'sub' => 'Tasting'],
        ];
        $catId = [];
        foreach ($categories as $i => $c) {
            $cat = Category::updateOrCreate(
                ['slug' => $c['slug']],
                ['label' => $c['label'], 'sub' => $c['sub'], 'sort_order' => $i],
            );
            $catId[$c['slug']] = $cat->id;
        }

        // [cat, name, sub, price, icon, stamp, sold, has_temperature]
        // 料金はすべて仮で600円・全品ホット/アイス選択あり
        $menu = [
            ['drink',   'みなみさやか', '宮崎 or 五ヶ瀬', 600, 'cup',  null, false, true],
            ['drink',   'やまなみ',     '宮崎 or 五ヶ瀬', 600, 'cup',  null, false, true],
            ['drink',   'べにひかり',   '静岡',           600, 'cup',  null, false, true],
            ['drink',   'ゆず紅茶',     '',               600, 'cup',  null, false, true],
            ['drink',   '烏龍茶',       '',               600, 'leaf', null, false, true],

            ['tasting', '飲み比べ', 'みなみさやか・やまなみ・べにひかり 各50ml', 600, 'pot', '推', false, true],
        ];

        // 旧メニューが残っている場合は一旦掃除（このシードのもののみ残す）
        $keepNames = array_map(fn ($m) => $m[1], $menu);
        Product::whereNotIn('name', $keepNames)->delete();

        foreach ($menu as $i => $m) {
            [$cat, $name, $sub, $price, $icon, $stamp, $sold, $temp] = $m;
            Product::updateOrCreate(
                ['name' => $name],
                [
                    'category_id' => $catId[$cat],
                    'sub' => $sub ?: null,
                    'price' => $price,
                    'tax_rate' => 10.00,
                    'icon' => $icon,
                    'stamp' => $stamp,
                    'is_sold_out' => $sold,
                    'is_visible' => true,
                    'has_temperature' => $temp,
                    'sort_order' => $i,
                ],
            );
        }
    }
}
