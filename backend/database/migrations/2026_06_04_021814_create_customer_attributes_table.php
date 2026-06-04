<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * 会計時にスタッフがタップ入力する客層（性別・年代）。
     * 1会計につき1レコード。PCの顧客分析の供給源。
     */
    public function up(): void
    {
        Schema::create('customer_attributes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->unique()->constrained()->cascadeOnDelete();
            $table->enum('gender', ['female', 'male', 'other'])->nullable();
            $table->enum('age_band', ['10s', '20s', '30s', '40s', '50s', '60plus'])->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('customer_attributes');
    }
};
