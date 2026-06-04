<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * 原価・経費の名目マスタ。type で原価(cost)／経費(expense)を区別。
     */
    public function up(): void
    {
        Schema::create('expense_categories', function (Blueprint $table) {
            $table->id();
            $table->string('name', 40);
            $table->enum('type', ['cost', 'expense'])->default('expense'); // 原価 / 経費
            $table->unsignedInteger('sort_order')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        // 既定の名目を投入
        $now = now();
        $defaults = [
            ['name' => '原価', 'type' => 'cost'],
            ['name' => '仕入れ', 'type' => 'cost'],
            ['name' => '人件費', 'type' => 'expense'],
            ['name' => '家賃', 'type' => 'expense'],
            ['name' => '水道光熱費', 'type' => 'expense'],
            ['name' => '消耗品費', 'type' => 'expense'],
            ['name' => '広告宣伝費', 'type' => 'expense'],
            ['name' => '通信費', 'type' => 'expense'],
            ['name' => 'その他', 'type' => 'expense'],
        ];
        $rows = [];
        foreach ($defaults as $i => $d) {
            $rows[] = [...$d, 'sort_order' => $i, 'is_active' => true, 'created_at' => $now, 'updated_at' => $now];
        }
        DB::table('expense_categories')->insert($rows);
    }

    public function down(): void
    {
        Schema::dropIfExists('expense_categories');
    }
};
