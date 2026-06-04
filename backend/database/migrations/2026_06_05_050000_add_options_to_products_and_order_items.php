<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * 商品ごとの任意選択肢（例: 産地＝宮崎/五ヶ瀬）。
     * products.options: [{ "name": "産地", "choices": ["宮崎","五ヶ瀬"] }, ...]
     * order_items.options: [{ "name": "産地", "value": "宮崎" }, ...]（会計時の選択スナップショット）
     */
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->json('options')->nullable()->after('image_path');
        });
        Schema::table('order_items', function (Blueprint $table) {
            $table->json('options')->nullable()->after('temperature');
        });
    }

    public function down(): void
    {
        Schema::table('products', fn (Blueprint $t) => $t->dropColumn('options'));
        Schema::table('order_items', fn (Blueprint $t) => $t->dropColumn('options'));
    }
};
