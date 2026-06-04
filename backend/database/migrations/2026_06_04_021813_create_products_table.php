<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * 商品マスタ。価格は税込・円単位の整数で保持。
     */
    public function up(): void
    {
        Schema::create('products', function (Blueprint $table) {
            $table->id();
            $table->foreignId('category_id')->constrained()->cascadeOnUpdate()->restrictOnDelete();
            $table->string('name');
            $table->string('sub')->nullable();              // サブ説明（静岡 べにふうき 等）
            $table->unsignedInteger('price');               // 税込価格（円）
            $table->decimal('tax_rate', 4, 2)->default(10.00); // 税率%（軽減税率8%対応）
            $table->string('icon', 32)->nullable();         // 手描きアイコンキー（cup/ice/latte…）
            $table->string('stamp', 4)->nullable();         // ハンコ札（新 / 推 / 季）
            $table->boolean('is_sold_out')->default(false); // 売切
            $table->boolean('is_visible')->default(true);   // レジ表示
            $table->boolean('has_temperature')->default(false); // ホット/アイス選択あり
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();

            $table->index(['category_id', 'sort_order']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('products');
    }
};
