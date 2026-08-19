<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('monthly_plans', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->char('month', 7); // YYYY-MM
            $table->decimal('income', 12, 2); // 手取り月収
            $table->decimal('fixed_costs', 12, 2); // 固定費合計
            $table->decimal('savings_goal', 12, 2); // 貯金目標額
            $table->timestamps();

            // (user_id, month) の一意制約（トランザクション設計 No.6）
            $table->unique(['user_id', 'month']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('monthly_plans');
    }
};
