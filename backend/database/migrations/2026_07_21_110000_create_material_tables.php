<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * 茶葉在庫・仕入・原価自動計上のためのテーブル群。
     * - materials:             茶葉マスタ（現在残量と移動平均g単価を保持）
     * - material_purchases:    仕入履歴（登録時点では原価に計上しない）
     * - product_materials:     商品⇔茶葉の紐付け（1杯あたり使用g）
     * - material_consumptions: 販売時の消費記録（販売時点の単価スナップショット＝自動原価）
     */
    public function up(): void
    {
        Schema::create('materials', function (Blueprint $table) {
            $table->id();
            $table->string('name', 80)->unique();
            $table->decimal('stock_g', 10, 1)->default(0);        // 現在残量(g)。マイナス許容（登録漏れ検知用）
            $table->decimal('avg_unit_price', 10, 2)->default(0); // 移動平均g単価(円/g)
            $table->decimal('low_stock_g', 10, 1)->nullable();    // 残量警告の閾値(g)
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();
        });

        Schema::create('material_purchases', function (Blueprint $table) {
            $table->id();
            $table->foreignId('material_id')->constrained()->cascadeOnDelete();
            $table->date('purchased_on');
            $table->decimal('quantity_g', 10, 1);       // 仕入量(g)
            $table->unsignedInteger('total_price');     // 仕入額(円・税込)
            $table->string('note')->nullable();
            $table->timestamps();
            $table->index(['material_id', 'purchased_on']);
        });

        Schema::create('product_materials', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')->constrained()->cascadeOnDelete();
            $table->foreignId('material_id')->constrained()->restrictOnDelete();
            $table->decimal('grams', 8, 1);             // 1杯（1個）あたり使用g
            $table->timestamps();
            $table->unique(['product_id', 'material_id']);
        });

        Schema::create('material_consumptions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_item_id')->constrained()->cascadeOnDelete();
            $table->foreignId('material_id')->nullable()->constrained()->nullOnDelete();
            $table->string('material_name', 80);        // 茶葉名スナップショット
            $table->decimal('grams', 10, 1);            // 消費g（qty込み）
            $table->decimal('unit_price', 10, 2);       // 販売時点の移動平均g単価
            $table->decimal('amount', 12, 2);           // 自動原価 = grams × unit_price
            $table->date('consumed_on');                // 会計日（月次集計用）
            $table->timestamps();
            $table->index('consumed_on');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('material_consumptions');
        Schema::dropIfExists('product_materials');
        Schema::dropIfExists('material_purchases');
        Schema::dropIfExists('materials');
    }
};
