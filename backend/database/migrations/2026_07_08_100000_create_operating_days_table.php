<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * 営業日ごとの地域（POSレジのログイン時に設定）。
 * この地域を元に、売上管理（日次）でその日の天気・気温を表示する。
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('operating_days', function (Blueprint $table) {
            $table->id();
            $table->date('date')->unique();       // 営業日（Asia/Tokyo）
            $table->json('region');               // {name,label,latitude,longitude,timezone}
            $table->string('source', 16)->nullable(); // gps / default / search / manual
            $table->foreignId('set_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('operating_days');
    }
};
