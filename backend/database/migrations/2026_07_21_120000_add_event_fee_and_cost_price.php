<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * - operating_days: イベント出店料（開店時に必須登録。経費へ自動計上し expense_id で紐付け）
     * - products: 物販カテゴリ用の原価（1個あたり・販売時に自動計上）
     */
    public function up(): void
    {
        Schema::table('operating_days', function (Blueprint $table) {
            $table->unsignedInteger('event_fee')->nullable()->after('source');       // 出店料(円)。null=未登録
            $table->foreignId('event_fee_expense_id')->nullable()->after('event_fee')
                ->constrained('expenses')->nullOnDelete();                            // 計上した経費行
        });

        Schema::table('products', function (Blueprint $table) {
            $table->unsignedInteger('cost_price')->nullable()->after('price');       // 原価(円/個)。物販のみ
        });
    }

    public function down(): void
    {
        Schema::table('operating_days', function (Blueprint $table) {
            $table->dropConstrainedForeignId('event_fee_expense_id');
            $table->dropColumn('event_fee');
        });
        Schema::table('products', function (Blueprint $table) {
            $table->dropColumn('cost_price');
        });
    }
};
