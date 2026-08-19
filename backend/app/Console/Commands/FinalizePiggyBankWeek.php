<?php

namespace App\Console\Commands;

use App\Models\User;
use App\Services\PiggyBankService;
use Illuminate\Console\Command;

/**
 * 週次プラン確定処理（トランザクション設計 No.8 / 状態遷移設計④「進行中の週→確定済みの週」）。
 * 本番サーバーを持たないローカル開発のみの想定のため、Cronスケジューラではなく
 * 「簡易なコマンド実行で可」という設計方針の通り、artisanコマンドとして実装する。
 * routes/console.php でスケジュール登録もしているが、実行にはスケジューラのworker起動が必要。
 */
class FinalizePiggyBankWeek extends Command
{
    protected $signature = 'app:finalize-piggy-bank-week';

    protected $description = '先週分の利用可能額・支出・貯金額をpiggy_bank_recordsへ確定として記録する';

    public function handle(PiggyBankService $piggyBankService): int
    {
        $count = 0;

        User::query()->chunkById(50, function ($users) use ($piggyBankService, &$count) {
            foreach ($users as $user) {
                $piggyBankService->finalizeWeek($user);
                $count++;
            }
        });

        $this->info("先週分の貯金箱記録を確定しました（対象ユーザー: {$count}人）");

        return self::SUCCESS;
    }
}
