<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * 月別の原価・経費。損益管理（営業利益）の計算に使用。
     */
    public function up(): void
    {
        Schema::create('expenses', function (Blueprint $table) {
            $table->id();
            $table->unsignedSmallInteger('year');
            $table->unsignedTinyInteger('month'); // 1-12
            $table->string('category', 40);       // 原価 / 人件費 / 家賃 など
            $table->integer('amount');            // 円
            $table->string('note')->nullable();
            $table->timestamps();

            $table->index(['year', 'month']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('expenses');
    }
};
