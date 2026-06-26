<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * 客層（性別・年代）を明細単位に持たせる。
     * 商品ごとに客層をタップ入力する方式に変更したため、会計単位の
     * customer_attributes ではなく order_items に保持する。
     * （PCの顧客分析・商品別客層分析の供給源）
     */
    public function up(): void
    {
        Schema::table('order_items', function (Blueprint $table) {
            $table->enum('gender', ['female', 'male', 'other'])->nullable()->after('order_source');
            $table->enum('age_band', ['10s', '20s', '30s', '40s', '50s', '60plus'])->nullable()->after('gender');
        });
    }

    public function down(): void
    {
        Schema::table('order_items', function (Blueprint $table) {
            $table->dropColumn(['gender', 'age_band']);
        });
    }
};
