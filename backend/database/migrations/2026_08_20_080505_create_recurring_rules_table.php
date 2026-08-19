<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('recurring_rules', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('category_id')->constrained()->restrictOnDelete();
            $table->string('name', 100); // 固定費/サブスク名（例：家賃、Netflix）
            $table->decimal('amount', 12, 2);
            $table->unsignedTinyInteger('day_of_month'); // 毎月何日（1〜31）
            $table->date('next_date'); // 次回登録予定日
            $table->timestamps();

            $table->index(['user_id', 'next_date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('recurring_rules');
    }
};
