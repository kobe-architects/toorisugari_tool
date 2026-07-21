<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * カテゴリ「物販」を追加（既存DBへの反映用。シーダーにも同カテゴリあり）。
     */
    public function up(): void
    {
        if (DB::table('categories')->where('slug', 'goods')->exists()) {
            return;
        }

        DB::table('categories')->insert([
            'slug' => 'goods',
            'label' => '物販',
            'sub' => 'Goods',
            'sort_order' => (int) DB::table('categories')->max('sort_order') + 1,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    public function down(): void
    {
        DB::table('categories')->where('slug', 'goods')->delete();
    }
};
