<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('piggy_bank_records', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->date('week_start_date'); // 週の開始日（月曜日など）
            $table->decimal('weekly_allowance', 12, 2); // 1週間の利用可能額
            $table->decimal('spent_amount', 12, 2); // その週の支出合計
            $table->decimal('saved_amount', 12, 2); // 差額（貯金可能額-支出額）。プラスなら貯金箱に加算
            $table->timestamps();

            $table->unique(['user_id', 'week_start_date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('piggy_bank_records');
    }
};
