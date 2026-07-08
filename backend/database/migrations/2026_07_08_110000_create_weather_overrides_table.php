<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * 天気の手動登録（オーバーライド）。売上管理・日次から日ごとに登録でき、
 * 自動取得（Open-Meteo）より優先して表示する。
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('weather_overrides', function (Blueprint $table) {
            $table->id();
            $table->date('date')->unique();
            $table->string('icon', 16); // sunny/partly/cloudy/rain/snow/thunder
            $table->decimal('tmax', 4, 1)->nullable();
            $table->decimal('tmin', 4, 1)->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('weather_overrides');
    }
};
