<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /** 開店時に選択したイベント（null=イベントなし・通常営業）。 */
    public function up(): void
    {
        Schema::table('operating_days', function (Blueprint $table) {
            $table->foreignId('event_id')->nullable()->after('source')->constrained()->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('operating_days', function (Blueprint $table) {
            $table->dropConstrainedForeignId('event_id');
        });
    }
};
