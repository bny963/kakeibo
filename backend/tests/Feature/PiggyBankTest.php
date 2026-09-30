<?php

namespace Tests\Feature;

use App\Models\Account;
use App\Models\Category;
use App\Models\MonthlyPlan;
use App\Models\Transaction;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Date;
use Tests\TestCase;

/**
 * テストケース一覧 No.11（貯金箱UI表示機能）に対応。
 * saved_amountは常に0円以上（赤字表示をしない）で計算されることを確認する。
 */
class PiggyBankTest extends TestCase
{
    use RefreshDatabase;

    protected function tearDown(): void
    {
        Date::setTestNow();
        parent::tearDown();
    }

    private function setUpWeekPlan(User $user): CarbonImmutable
    {
        $now = CarbonImmutable::parse('2026-08-19 12:00:00');
        Date::setTestNow($now);

        MonthlyPlan::factory()->for($user)->create([
            'month' => $now->format('Y-m'),
            'income' => 250000,
            'fixed_costs' => 90000,
            'savings_goal' => 20000,
        ]);

        return $now->startOfWeek(CarbonImmutable::MONDAY);
    }

    public function test_spending_less_than_allowance_produces_positive_saved_amount(): void
    {
        $user = User::factory()->create();
        $weekStart = $this->setUpWeekPlan($user);

        $account = Account::factory()->for($user)->create();
        $category = Category::factory()->for($user)->expense()->create();

        Transaction::factory()->for($user)->create([
            'account_id' => $account->id,
            'category_id' => $category->id,
            'type' => 'expense',
            'amount' => 5000,
            'date' => $weekStart->addDay()->toDateString(),
        ]);

        $response = $this->actingAs($user)->getJson('/api/piggy-bank/this-week');

        $response->assertOk();
        // JSONは整数値の浮動小数を5000のように出力するため、assertEqualsで数値比較する
        $this->assertEquals(5000.0, $response->json('spent_amount'));
        $this->assertGreaterThan(0, $response->json('saved_amount'));
        $this->assertFalse($response->json('is_over_budget'));
    }

    public function test_overspending_never_shows_a_negative_saved_amount(): void
    {
        $user = User::factory()->create();
        $weekStart = $this->setUpWeekPlan($user);

        $account = Account::factory()->for($user)->create();
        $category = Category::factory()->for($user)->expense()->create();

        // 週の利用可能額（約32,558円）を大きく超える支出を記録する
        Transaction::factory()->for($user)->create([
            'account_id' => $account->id,
            'category_id' => $category->id,
            'type' => 'expense',
            'amount' => 100000,
            'date' => $weekStart->addDay()->toDateString(),
        ]);

        $response = $this->actingAs($user)->getJson('/api/piggy-bank/this-week');

        $response->assertOk();
        $this->assertEquals(0.0, $response->json('saved_amount'));
        $this->assertTrue($response->json('is_over_budget'));
    }

    /**
     * 月をまたぐ週は、週の木曜日が属する月のプランを参照する。
     * 2026-10-01(木) に10月のプランを初めて設定したケース: その週(9/28〜10/4)は10月のプランで計算され、
     * 設定画面が開くべき月として plan_month=2026-10 が返る。
     */
    public function test_week_spanning_months_uses_the_plan_of_the_month_containing_thursday(): void
    {
        $user = User::factory()->create();
        Date::setTestNow(CarbonImmutable::parse('2026-10-01 09:00:00'));

        MonthlyPlan::factory()->for($user)->create([
            'month' => '2026-10',
            'income' => 250000,
            'fixed_costs' => 90000,
            'savings_goal' => 20000,
        ]);

        $response = $this->actingAs($user)->getJson('/api/piggy-bank/this-week');

        $response->assertOk()
            ->assertJsonPath('week_start_date', '2026-09-28')
            ->assertJsonPath('plan_month', '2026-10')
            ->assertJsonPath('has_plan', true);
        $this->assertEqualsWithDelta(32558.14, $response->json('weekly_allowance'), 0.01);
    }

    public function test_week_whose_thursday_is_in_the_previous_month_uses_that_months_plan(): void
    {
        $user = User::factory()->create();
        // 週(7/27〜8/2)の木曜は 7/30 のため、8/1(土)に見ても7月のプランを使う
        Date::setTestNow(CarbonImmutable::parse('2026-08-01 09:00:00'));

        MonthlyPlan::factory()->for($user)->create(['month' => '2026-07', 'income' => 100000, 'fixed_costs' => 0, 'savings_goal' => 0]);

        $this->actingAs($user)->getJson('/api/piggy-bank/this-week')
            ->assertOk()
            ->assertJsonPath('week_start_date', '2026-07-27')
            ->assertJsonPath('plan_month', '2026-07')
            ->assertJsonPath('has_plan', true);
    }
}
