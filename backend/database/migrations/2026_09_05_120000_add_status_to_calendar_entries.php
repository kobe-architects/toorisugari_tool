<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /** 予定の種別ステータス。null=通常の予定 / applying=出店応募中 / confirmed=出店確定。 */
    public function up(): void
    {
        Schema::table('calendar_entries', function (Blueprint $table) {
            $table->string('status', 20)->nullable()->after('title');
        });
    }

    public function down(): void
    {
        Schema::table('calendar_entries', function (Blueprint $table) {
            $table->dropColumn('status');
        });
    }
};
