<?php

namespace Tests\Feature;

use App\Models\Account;
use App\Models\Category;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

/**
 * 金額はすべて整数円で扱う。小数・負数は別の金額に変換して登録せず、422で拒否すること。
 * （画面側の入力処理で「1.5 → 15」「-100 → 100」と変換されていた不具合の、API側の防御）
 */
class IntegerAmountValidationTest extends TestCase
{
    use RefreshDatabase;

    /** @return array<string, array{mixed}> */
    public static function invalidAmounts(): array
    {
        return [
            '小数' => [1.5],
            '小数（文字列）' => ['1234.56'],
            '負数' => [-100],
        ];
    }

    #[DataProvider('invalidAmounts')]
    public function test_transaction_amount_must_be_a_positive_integer(mixed $amount): void
    {
        $user = User::factory()->create();
        $account = Account::factory()->for($user)->create();
        $category = Category::factory()->for($user)->expense()->create();

        $this->actingAs($user)->postJson('/api/transactions', [
            'type' => 'expense',
            'account_id' => $account->id,
            'category_id' => $category->id,
            'amount' => $amount,
            'date' => now()->toDateString(),
        ])->assertUnprocessable()->assertJsonValidationErrors('amount');

        $this->assertDatabaseCount('transactions', 0);
    }

    #[DataProvider('invalidAmounts')]
    public function test_budget_amount_must_be_a_non_negative_integer(mixed $amount): void
    {
        $user = User::factory()->create();
        $category = Category::factory()->for($user)->expense()->create();

        $this->actingAs($user)->postJson('/api/budgets', [
            'category_id' => $category->id,
            'amount' => $amount,
            'month' => '2026-10',
        ])->assertUnprocessable()->assertJsonValidationErrors('amount');
    }

    #[DataProvider('invalidAmounts')]
    public function test_account_balance_must_be_a_non_negative_integer(mixed $balance): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)->postJson('/api/accounts', [
            'name' => '財布',
            'type' => 'cash',
            'balance' => $balance,
        ])->assertUnprocessable()->assertJsonValidationErrors('balance');
    }

    #[DataProvider('invalidAmounts')]
    public function test_monthly_plan_income_must_be_a_non_negative_integer(mixed $income): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)->postJson('/api/monthly-plans', [
            'month' => '2026-10',
            'income' => $income,
            'fixed_costs' => 0,
            'savings_goal' => 0,
        ])->assertUnprocessable()->assertJsonValidationErrors('income');
    }
}
