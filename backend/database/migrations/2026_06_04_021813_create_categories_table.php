<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * 商品カテゴリ（ドリンク / 茶葉 / お菓子 / セット）。
     */
    public function up(): void
    {
        Schema::create('categories', function (Blueprint $table) {
            $table->id();
            $table->string('slug', 32)->unique();   // drink / leaf / sweet / set
            $table->string('label');                 // 表示名（ドリンク 等）
            $table->string('sub')->nullable();       // 英字サブ（Drink 等）
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('categories');
    }
};
