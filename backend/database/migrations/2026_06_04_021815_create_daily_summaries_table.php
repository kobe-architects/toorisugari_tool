<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * 日次集計（cronバッチで生成）。PC分析の高速化用。
     * 明細はordersから随時集計できるが、期間分析の負荷軽減にキャッシュとして保持。
     */
    public function up(): void
    {
        Schema::create('daily_summaries', function (Blueprint $table) {
            $table->id();
            $table->date('business_date')->unique();
            $table->unsignedInteger('total_sales')->default(0); // 売上合計（税込）
            $table->unsignedInteger('order_count')->default(0); // 会計件数
            $table->unsignedInteger('item_count')->default(0);  // 販売点数
            $table->unsignedInteger('avg_price')->default(0);   // 客単価
            $table->json('by_category')->nullable();            // カテゴリ別構成
            $table->json('by_hour')->nullable();                // 時間帯別売上
            $table->timestamp('computed_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('daily_summaries');
    }
};
