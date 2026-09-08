<?php

namespace Tests\Feature;

use App\Models\Account;
use App\Models\Category;
use App\Models\Transaction;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * テストケース一覧 No.8（予算設定機能）に対応。
 */
class BudgetTest extends TestCase
{
    use RefreshDatabase;

    public function test_budget_can_be_set_and_shows_progress(): void
    {
        $user = User::factory()->create();
        $category = Category::factory()->for($user)->expense()->create(['name' => '食費']);

        $response = $this->actingAs($user)->postJson('/api/budgets', [
            'category_id' => $category->id,
            'amount' => 20000,
            'month' => '2026-08',
        ]);

        $response->assertCreated();
        $this->assertDatabaseHas('budgets', [
            'user_id' => $user->id,
            'category_id' => $category->id,
            'month' => '2026-08',
            'amount' => 20000,
        ]);

        // 同じカテゴリ・月で再度POSTするとupsertされ、重複行が作られない
        $this->actingAs($user)->postJson('/api/budgets', [
            'category_id' => $category->id,
            'amount' => 25000,
            'month' => '2026-08',
        ])->assertCreated();

        $this->assertDatabaseCount('budgets', 1);

        $index = $this->actingAs($user)->getJson('/api/budgets?month=2026-08');
        $index->assertOk()->assertJsonFragment(['usage_rate' => 0.0]);
    }

    /** 使用率が100%で頭打ちになり超過幅が分からない不具合の修正に対応。 */
    public function test_usage_rate_is_not_capped_at_100_percent_when_over_budget(): void
    {
        $user = User::factory()->create();
        $account = Account::factory()->for($user)->create();
        $category = Category::factory()->for($user)->expense()->create();

        $this->actingAs($user)->postJson('/api/budgets', [
            'category_id' => $category->id,
            'amount' => 10000,
            'month' => '2026-08',
        ])->assertCreated();

        Transaction::factory()->for($user)->create([
            'account_id' => $account->id,
            'category_id' => $category->id,
            'type' => 'expense',
            'amount' => 15000,
            'date' => '2026-08-10',
        ]);

        $index = $this->actingAs($user)->getJson('/api/budgets?month=2026-08');

        $index->assertOk()->assertJsonFragment(['usage_rate' => 150.0, 'status' => 'over']);
    }
}
