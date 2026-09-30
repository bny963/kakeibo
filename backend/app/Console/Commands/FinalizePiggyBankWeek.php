<?php

namespace App\Console\Commands;

use App\Models\User;
use App\Services\PiggyBankService;
use Carbon\CarbonImmutable;
use Illuminate\Console\Command;

/**
 * 週次プラン確定処理（トランザクション設計 No.8 / 状態遷移設計④「進行中の週→確定済みの週」）。
 * routes/console.php でスケジュール登録しているほか、本番（ロリポップ）では kakeibo-cron.php から
 * 毎週月曜に呼び出す。定期実行が動かなかった週は --from で手動回復する（README 参照）。
 */
class FinalizePiggyBankWeek extends Command
{
    protected $signature = 'app:finalize-piggy-bank-week
        {--from= : 定期実行が動かなかった週を回復する場合の開始週（YYYY-MM-DD）。指定した日を含む週から先週までを確定する}';

    protected $description = '先週分（--from 指定時はその週から先週まで）の利用可能額・支出・貯金額をpiggy_bank_recordsへ確定として記録する';

    /**
     * 確定済みの週は上書きしないため、同じ週を何度実行しても結果は変わらない（回復手順で重複実行しても安全）。
     * 利用者の登録日より前に終わった週は対象にしない。
     */
    public function handle(PiggyBankService $piggyBankService): int
    {
        $lastWeek = CarbonImmutable::now()->subWeek()->startOfWeek(CarbonImmutable::MONDAY);
        $from = $this->option('from');
        $firstWeek = $from === null ? $lastWeek : CarbonImmutable::parse($from)->startOfWeek(CarbonImmutable::MONDAY);

        if ($firstWeek->greaterThan($lastWeek)) {
            $this->error('--from には先週以前の日付を指定してください（進行中の週は確定できません）');

            return self::FAILURE;
        }

        $count = 0;

        User::query()->chunkById(50, function ($users) use ($piggyBankService, $firstWeek, $lastWeek, &$count) {
            foreach ($users as $user) {
                $userFirstWeek = $user->created_at->toImmutable()->startOfWeek(CarbonImmutable::MONDAY);
                for ($week = $firstWeek->max($userFirstWeek); $week->lessThanOrEqualTo($lastWeek); $week = $week->addWeek()) {
                    $piggyBankService->finalizeWeek($user, $week);
                    $count++;
                }
            }
        });

        $this->info("{$firstWeek->toDateString()} 〜 {$lastWeek->toDateString()} の週の貯金箱記録を確定しました（のべ {$count} 件、確定済みの週は変更なし）");

        return self::SUCCESS;
    }
}
