<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * スタッフ／オーナー用のPOS項目を users に追加。
     * staff はメール無しでPIN入店、owner はPC分析用にメール+パスワードでログイン。
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->enum('role', ['staff', 'owner'])->default('staff')->after('id');
            // 筆文字アバター用の頭文字（例: 店 / み / そ）
            $table->string('display_initial', 4)->nullable()->after('name');
            // 4桁PINのハッシュ（レジ入店・管理者ログイン用）
            $table->string('pin_hash')->nullable()->after('password');
            $table->boolean('is_active')->default(true)->after('pin_hash');
            // staff はメール無しのため email を null 許可に変更（unique索引は維持）
            $table->string('email')->nullable()->change();
            // staff は PIN 認証のみのため password も null 許可
            $table->string('password')->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['role', 'display_initial', 'pin_hash', 'is_active']);
        });
    }
};
