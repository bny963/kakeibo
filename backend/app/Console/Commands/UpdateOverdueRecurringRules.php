<?php

namespace App\Console\Commands;

use App\Models\RecurringRule;
use Illuminate\Console\Command;

/**
 * 固定費・サブスクのnext_date自動更新処理（状態遷移設計⑤「支払い日超過→通常」）。
 * next_dateが本日より過去の固定費を対象に、day_of_monthを基準に次回発生日を再計算する。
 * FinalizePiggyBankWeekと同様、ローカル開発のみの想定のためartisanコマンドとして実装し、
 * routes/console.phpのスケジューラで日次実行する。
 */
class UpdateOverdueRecurringRules extends Command
{
    protected $signature = 'app:update-overdue-recurring-rules';

    protected $description = '支払い予定日を過ぎた固定費・サブスクのnext_dateを次回発生日へ更新する';

    public function handle(): int
    {
        $count = 0;

        RecurringRule::query()
            ->whereDate('next_date', '<', now()->startOfDay())
            ->chunkById(50, function ($rules) use (&$count) {
                foreach ($rules as $rule) {
                    $rule->update([
                        'next_date' => RecurringRule::calculateNextDate($rule->day_of_month),
                    ]);
                    $count++;
                }
            });

        $this->info("支払い日超過の固定費・サブスクのnext_dateを更新しました（対象件数: {$count}件）");

        return self::SUCCESS;
    }
}
