<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * 会計（伝票）。金額はすべて税込・円単位の整数。
     * MVPは現金のみ。payment_method は将来のQR/IC/カード拡張前提で文字列保持。
     */
    public function up(): void
    {
        Schema::create('orders', function (Blueprint $table) {
            $table->id();
            $table->string('order_no', 16);                 // 伝票番号（日次でリセットする表示用 No.）
            $table->foreignId('staff_id')->nullable()->constrained('users')->nullOnDelete();
            $table->enum('dine_type', ['dine_in', 'takeout'])->default('dine_in'); // 店内 / 持帰
            $table->unsignedInteger('subtotal');            // 小計（税込）
            $table->unsignedInteger('tax');                 // 内税額
            $table->unsignedInteger('total');               // 合計（税込）
            $table->string('payment_method', 16)->default('cash'); // cash / qr / ic / card
            $table->unsignedInteger('received')->nullable();// お預かり
            $table->integer('change')->nullable();          // おつり
            $table->enum('status', ['completed', 'voided'])->default('completed');
            $table->timestamp('completed_at')->nullable();  // 会計確定時刻
            $table->timestamps();

            $table->index('completed_at');
            $table->index(['status', 'completed_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('orders');
    }
};
