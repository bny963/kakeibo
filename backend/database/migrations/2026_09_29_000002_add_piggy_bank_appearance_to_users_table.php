<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * 現在装着中の貯金箱ビジュアル（色・柄・キャラクター）。
     * nullは初期スキン（無料・常に解禁済み）を装着している状態を表す。
     * この3カラムは見た目のみに使われ、貯金箱の計算・アプリ本来の機能には一切参照されない。
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('piggy_bank_color', 50)->nullable()->after('password');
            $table->string('piggy_bank_pattern', 50)->nullable()->after('piggy_bank_color');
            $table->string('piggy_bank_character', 50)->nullable()->after('piggy_bank_pattern');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['piggy_bank_color', 'piggy_bank_pattern', 'piggy_bank_character']);
        });
    }
};
