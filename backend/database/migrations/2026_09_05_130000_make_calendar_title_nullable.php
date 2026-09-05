<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /** ステータスのみの予定（出店応募中／出店確定）は予定名なしで登録できるようにする。 */
    public function up(): void
    {
        Schema::table('calendar_entries', function (Blueprint $table) {
            $table->string('title', 120)->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('calendar_entries', function (Blueprint $table) {
            $table->string('title', 120)->nullable(false)->change();
        });
    }
};
