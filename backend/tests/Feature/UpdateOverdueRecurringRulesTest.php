<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\RecurringRule;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * 状態遷移設計⑤（固定費・サブスクのリマインド状態）の
 * 「支払い日超過→通常（バッチ処理で次月更新）」に対応。
 */
class UpdateOverdueRecurringRulesTest extends TestCase
{
    use RefreshDatabase;

    public function test_overdue_next_date_is_rolled_forward_to_next_month(): void
    {
        $user = User::factory()->create();
        $category = Category::factory()->for($user)->expense()->create(['name' => '家賃']);

        $rule = RecurringRule::query()->create([
            'user_id' => $user->id,
            'category_id' => $category->id,
            'name' => '家賃',
            'amount' => 80000,
            'day_of_month' => 1,
            'next_date' => now()->subDays(5)->startOfDay(),
        ]);

        $this->artisan('app:update-overdue-recurring-rules')->assertSuccessful();

        $rule->refresh();
        $expected = RecurringRule::calculateNextDate($rule->day_of_month, now()->subDays(5)->startOfDay()->toImmutable());

        $this->assertTrue($rule->next_date->greaterThanOrEqualTo(now()->startOfDay()));
        $this->assertSame($expected->toDateString(), $rule->next_date->toDateString());
    }

    public function test_upcoming_next_date_is_left_untouched(): void
    {
        $user = User::factory()->create();
        $category = Category::factory()->for($user)->expense()->create(['name' => 'Netflix']);

        $futureDate = now()->addDays(10)->startOfDay();

        $rule = RecurringRule::query()->create([
            'user_id' => $user->id,
            'category_id' => $category->id,
            'name' => 'Netflix',
            'amount' => 1980,
            'day_of_month' => $futureDate->day,
            'next_date' => $futureDate,
        ]);

        $this->artisan('app:update-overdue-recurring-rules')->assertSuccessful();

        $rule->refresh();
        $this->assertSame($futureDate->toDateString(), $rule->next_date->toDateString());
    }
}
