<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /** カレンダー（予定）。PC管理コンソールとスマホ版カレンダー(/cal/)で共用。 */
    public function up(): void
    {
        Schema::create('calendar_entries', function (Blueprint $table) {
            $table->id();
            $table->date('date')->index();               // 予定日
            $table->string('title', 120);                // 予定名
            $table->string('start_time', 5)->nullable(); // 'HH:MM'（終日はnull）
            $table->string('end_time', 5)->nullable();   // 'HH:MM'
            $table->string('memo', 500)->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('calendar_entries');
    }
};
