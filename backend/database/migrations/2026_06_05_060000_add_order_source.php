<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * 注文経路（直注文 / 試飲から）。
     * - products.has_order_source: 注文時に経路を選べる商品か
     * - order_items.order_source: 会計時の経路（既定 direct=直注文）
     */
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->boolean('has_order_source')->default(false)->after('has_temperature');
        });
        Schema::table('order_items', function (Blueprint $table) {
            $table->enum('order_source', ['direct', 'tasting'])->default('direct')->after('temperature');
        });
    }

    public function down(): void
    {
        Schema::table('products', fn (Blueprint $t) => $t->dropColumn('has_order_source'));
        Schema::table('order_items', fn (Blueprint $t) => $t->dropColumn('order_source'));
    }
};
