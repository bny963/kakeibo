<?php

namespace Database\Seeders;

use App\Models\Account;
use App\Models\Category;
use App\Models\MonthlyPlan;
use App\Models\PiggyBankRecord;
use App\Models\RecurringRule;
use App\Models\Transaction;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Database\Seeder;

/**
 * 開発プロセスシートの要件（Seederでダミーデータの作成が可能であること：
 * 1.ユーザー情報 2.口座情報 3.カテゴリ情報 4.取引情報）を満たすデモデータ投入。
 */
class KakeiboDemoSeeder extends Seeder
{
    public function run(): void
    {
        $user = User::factory()->create([
            'name' => '田中さつき',
            'email' => 'demo@kakeibo.test',
            'password' => 'password',
        ]);

        $accounts = collect([
            Account::factory()->for($user)->create(['name' => '財布', 'type' => 'cash', 'balance' => 8000]),
            Account::factory()->for($user)->create(['name' => '普通預金', 'type' => 'bank', 'balance' => 152000]),
            Account::factory()->for($user)->create(['name' => 'メインカード', 'type' => 'credit', 'balance' => 0]),
        ]);

        $expenseCategories = collect(\Database\Factories\CategoryFactory::$expenseCategories)
            ->map(fn (array $c) => Category::factory()->for($user)->create([...$c, 'type' => 'expense']));

        $incomeCategories = collect(\Database\Factories\CategoryFactory::$incomeCategories)
            ->map(fn (array $c) => Category::factory()->for($user)->create([...$c, 'type' => 'income']));

        $salaryCategory = $incomeCategories->first();
        $rentCategory = $expenseCategories->firstWhere('name', '家賃');
        $telecomCategory = $expenseCategories->firstWhere('name', '通信費');

        // 過去90日分の取引をランダムに生成
        for ($i = 90; $i >= 0; $i--) {
            $date = CarbonImmutable::now()->subDays($i);

            // 月初に給与を計上
            if ($date->day === 25) {
                Transaction::factory()->for($user)->create([
                    'account_id' => $accounts->firstWhere('type', 'bank')->id,
                    'category_id' => $salaryCategory->id,
                    'type' => 'income',
                    'amount' => 250000,
                    'date' => $date->toDateString(),
                    'note' => '給与',
                ]);
            }

            // 7割の日に支出を1〜2件記録（記録しない日があることを再現）
            if (fake()->boolean(70)) {
                $count = fake()->numberBetween(1, 2);
                for ($j = 0; $j < $count; $j++) {
                    $category = $expenseCategories->random();
                    Transaction::factory()->for($user)->create([
                        'account_id' => $accounts->random()->id,
                        'category_id' => $category->id,
                        'type' => 'expense',
                        'date' => $date->toDateString(),
                    ]);
                }
            }
        }

        // 固定費・サブスク
        RecurringRule::query()->create([
            'user_id' => $user->id,
            'category_id' => $rentCategory->id,
            'name' => '家賃',
            'amount' => 68000,
            'day_of_month' => 27,
            'next_date' => $this->nextOccurrence(27),
        ]);
        RecurringRule::query()->create([
            'user_id' => $user->id,
            'category_id' => $telecomCategory->id,
            'name' => 'Netflix',
            'amount' => 1980,
            'day_of_month' => 5,
            'next_date' => $this->nextOccurrence(5),
        ]);

        // 今月の月次プラン（手取り-固定費-貯金目標）
        MonthlyPlan::query()->create([
            'user_id' => $user->id,
            'month' => CarbonImmutable::now()->format('Y-m'),
            'income' => 250000,
            'fixed_costs' => 90000,
            'savings_goal' => 20000,
        ]);

        // 直近4週分の貯金箱履歴
        $weeklyAllowance = round((250000 - 90000 - 20000) / MonthlyPlan::WEEKS_PER_MONTH, 2);
        for ($w = 4; $w >= 1; $w--) {
            $weekStart = CarbonImmutable::now()->startOfWeek()->subWeeks($w);
            $spent = fake()->randomFloat(2, $weeklyAllowance * 0.5, $weeklyAllowance * 1.1);
            $saved = max($weeklyAllowance - $spent, 0);

            PiggyBankRecord::query()->create([
                'user_id' => $user->id,
                'week_start_date' => $weekStart->toDateString(),
                'weekly_allowance' => $weeklyAllowance,
                'spent_amount' => $spent,
                'saved_amount' => $saved,
            ]);
        }

        // 他ユーザーのデータが混在しないことを確認するための別ユーザー
        $otherUser = User::factory()->create([
            'name' => '鈴木一郎',
            'email' => 'other@kakeibo.test',
            'password' => 'password',
        ]);
        $otherAccount = Account::factory()->for($otherUser)->create(['name' => '財布', 'type' => 'cash']);
        $otherCategory = Category::factory()->for($otherUser)->expense()->create();
        Transaction::factory()->for($otherUser)->create([
            'account_id' => $otherAccount->id,
            'category_id' => $otherCategory->id,
        ]);
    }

    private function nextOccurrence(int $dayOfMonth): string
    {
        $today = CarbonImmutable::now();
        $candidate = $today->day($dayOfMonth);

        if ($candidate->lessThan($today)) {
            $candidate = $candidate->addMonthNoOverflow();
        }

        return $candidate->toDateString();
    }
}
