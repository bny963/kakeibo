<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * 貯金箱のビジュアル（色・柄・キャラクター）をポイントで解禁した履歴。
     * これらはコスメティック要素のみを対象とし、記録・集計・レポート等の本来機能には影響しない。
     */
    public function up(): void
    {
        Schema::create('piggy_bank_skin_unlocks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('skin_key', 50);
            $table->unsignedInteger('points_spent'); // 解禁時に消費したポイント（カタログの価格が後で変わっても履歴は不変）
            $table->timestamp('unlocked_at');
            $table->timestamps();

            $table->unique(['user_id', 'skin_key']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('piggy_bank_skin_unlocks');
    }
};
