<?php

namespace Tests\Feature;

use App\Models\Account;
use App\Models\Category;
use App\Models\MonthlyPlan;
use App\Models\Transaction;
use App\Models\User;
use App\Services\PiggyBankService;
use App\Services\PiggyBankSkinService;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Date;
use Tests\TestCase;

/**
 * 仕様整理（固定費の扱い・週次確定後の訂正）に対応するテスト。
 *
 * 前提: 2026-10 のプランは (250000 - 90000 - 20000) / 4.3 = 32558.14円/週。
 */
class PiggyBankSpecTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    private Account $account;

    private Category $category;

    protected function setUp(): void
    {
        parent::setUp();

        Date::setTestNow(CarbonImmutable::parse('2026-10-14 12:00:00')); // 水曜。週は 10/12〜10/18

        $this->user = User::factory()->create(['created_at' => '2026-09-01 00:00:00']);
        $this->account = Account::factory()->for($this->user)->create(['balance' => 300000]);
        $this->category = Category::factory()->for($this->user)->expense()->create();

        MonthlyPlan::factory()->for($this->user)->create([
            'month' => '2026-10',
            'income' => 250000,
            'fixed_costs' => 90000,
            'savings_goal' => 20000,
        ]);
    }

    protected function tearDown(): void
    {
        Date::setTestNow();
        parent::tearDown();
    }

    private function postExpense(int $amount, string $date, bool $isRecurring = false): void
    {
        $this->actingAs($this->user)->postJson('/api/transactions', [
            'type' => 'expense',
            'account_id' => $this->account->id,
            'category_id' => $this->category->id,
            'amount' => $amount,
            'date' => $date,
            'is_recurring' => $isRecurring,
        ])->assertCreated();
    }

    public function test_fixed_cost_expense_is_not_counted_in_weekly_spending(): void
    {
        // 家賃は月次プランの「固定費」に含めて差し引き済み。取引にも固定費として記録する
        $this->postExpense(80000, '2026-10-13', isRecurring: true);
        $this->postExpense(5000, '2026-10-13');

        $response = $this->actingAs($this->user)->getJson('/api/piggy-bank/this-week')->assertOk();

        // 週の支出は固定費を除いた 5000円のみ（二重に控除しない）
        $this->assertEquals(5000, $response->json('spent_amount'));
        $this->assertEqualsWithDelta(27558.14, $response->json('saved_amount'), 0.01);
    }

    public function test_fixed_cost_expense_is_still_reflected_in_account_balance_and_monthly_summary(): void
    {
        $this->postExpense(80000, '2026-10-13', isRecurring: true);

        $this->assertSame('220000.00', $this->account->fresh()->balance);
        $this->actingAs($this->user)->getJson('/api/summary/monthly?month=2026-10')
            ->assertOk()
            ->assertJsonPath('expense', 80000);
    }

    public function test_fixed_cost_flag_is_ignored_for_income(): void
    {
        $incomeCategory = Category::factory()->for($this->user)->income()->create();

        $this->actingAs($this->user)->postJson('/api/transactions', [
            'type' => 'income',
            'account_id' => $this->account->id,
            'category_id' => $incomeCategory->id,
            'amount' => 1000,
            'date' => '2026-10-13',
            'is_recurring' => true,
        ])->assertCreated()->assertJsonPath('is_recurring', false);
    }

    public function test_finalized_week_is_not_changed_by_later_corrections_and_points_do_not_decrease(): void
    {
        $service = app(PiggyBankService::class);
        $lastWeek = CarbonImmutable::parse('2026-10-05');

        $this->postExpense(12558, '2026-10-06'); // 先週: 32558.14 - 12558 = 20000.14円
        $record = $service->finalizeWeek($this->user, $lastWeek);
        $this->assertEqualsWithDelta(20000.14, (float) $record->saved_amount, 0.01);
        $this->assertSame(2000, app(PiggyBankSkinService::class)->pointsBalance($this->user));

        // 確定後に先週の支出を追加で記録（記録し忘れの訂正）し、再度確定処理が走っても
        $this->postExpense(10000, '2026-10-07');
        $again = $service->finalizeWeek($this->user, $lastWeek);

        // 家計簿の記録・残高には反映される
        $this->assertSame('277442.00', $this->account->fresh()->balance);
        // 貯金箱の確定額・ポイントは変わらない
        $this->assertSame($record->id, $again->id);
        $this->assertEqualsWithDelta(20000.14, (float) $record->fresh()->saved_amount, 0.01);
        $this->assertSame(2000, app(PiggyBankSkinService::class)->pointsBalance($this->user));
    }

    public function test_current_week_cannot_be_finalized(): void
    {
        $this->expectException(\InvalidArgumentException::class);

        app(PiggyBankService::class)->finalizeWeek($this->user, CarbonImmutable::parse('2026-10-12'));
    }

    public function test_missed_weeks_can_be_recovered_with_the_from_option(): void
    {
        // 9/28〜10/4 の週と 10/5〜10/11 の週が、定期実行されずに未確定のまま
        $this->artisan('app:finalize-piggy-bank-week', ['--from' => '2026-09-28'])->assertSuccessful();

        $weeks = $this->user->piggyBankRecords()->orderBy('week_start_date')->pluck('week_start_date')
            ->map(fn ($date) => $date->toDateString())->all();
        $this->assertSame(['2026-09-28', '2026-10-05'], $weeks);

        // 同じ手順をもう一度実行しても、確定済みの週は増えも変わりもしない
        $this->artisan('app:finalize-piggy-bank-week', ['--from' => '2026-09-28'])->assertSuccessful();
        $this->assertSame(2, $this->user->piggyBankRecords()->count());
    }

    public function test_recovery_does_not_create_weeks_before_the_user_registered(): void
    {
        $this->artisan('app:finalize-piggy-bank-week', ['--from' => '2026-08-03'])->assertSuccessful();

        // 登録日 2026-09-01(火) を含む週(8/31〜)から先週(10/5〜)まで
        $first = $this->user->piggyBankRecords()->orderBy('week_start_date')->first();
        $this->assertSame('2026-08-31', $first->week_start_date->toDateString());
    }

    public function test_from_option_rejects_the_current_week(): void
    {
        $this->artisan('app:finalize-piggy-bank-week', ['--from' => '2026-10-12'])->assertFailed();
        $this->assertSame(0, $this->user->piggyBankRecords()->count());
    }
}
