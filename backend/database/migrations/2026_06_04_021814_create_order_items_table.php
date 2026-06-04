<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * 会計明細。商品名・価格は会計時点のスナップショットを保持
     * （後で商品マスタを変更しても過去伝票が変わらないように）。
     */
    public function up(): void
    {
        Schema::create('order_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->constrained()->cascadeOnDelete();
            $table->foreignId('product_id')->nullable()->constrained()->nullOnDelete();
            $table->enum('temperature', ['hot', 'ice'])->nullable(); // ホット/アイス
            $table->string('name');               // 商品名スナップショット（温度サフィックス含む）
            $table->unsignedInteger('price');     // 単価スナップショット（税込）
            $table->unsignedInteger('qty');       // 数量
            $table->unsignedInteger('line_total');// price * qty
            $table->timestamps();

            $table->index('order_id');
            $table->index('product_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('order_items');
    }
};
