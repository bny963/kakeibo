<?php

namespace Tests\Feature;

use App\Models\Account;
use App\Models\Category;
use App\Models\Transaction;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * 取引の登録・編集・削除が口座残高に反映されない不具合の修正に対応。
 */
class AccountBalanceTest extends TestCase
{
    use RefreshDatabase;

    public function test_creating_an_expense_decreases_account_balance(): void
    {
        $user = User::factory()->create();
        $account = Account::factory()->for($user)->create(['balance' => 10000]);
        $category = Category::factory()->for($user)->expense()->create();

        $this->actingAs($user)->postJson('/api/transactions', [
            'type' => 'expense',
            'account_id' => $account->id,
            'category_id' => $category->id,
            'amount' => 3000,
            'date' => '2026-08-15',
        ])->assertCreated();

        $this->assertSame('7000.00', $account->fresh()->balance);
    }

    public function test_creating_an_income_increases_account_balance(): void
    {
        $user = User::factory()->create();
        $account = Account::factory()->for($user)->create(['balance' => 10000]);
        $category = Category::factory()->for($user)->income()->create();

        $this->actingAs($user)->postJson('/api/transactions', [
            'type' => 'income',
            'account_id' => $account->id,
            'category_id' => $category->id,
            'amount' => 5000,
            'date' => '2026-08-15',
        ])->assertCreated();

        $this->assertSame('15000.00', $account->fresh()->balance);
    }

    public function test_updating_a_transaction_amount_adjusts_balance_by_the_difference(): void
    {
        $user = User::factory()->create();
        $account = Account::factory()->for($user)->create(['balance' => 10000]);
        $category = Category::factory()->for($user)->expense()->create();
        // factory()->create() 自体もTransactionObserverを発火させるため、この時点で残高は9000になる
        $transaction = Transaction::factory()->for($user)->create([
            'account_id' => $account->id,
            'category_id' => $category->id,
            'type' => 'expense',
            'amount' => 1000,
        ]);

        $this->actingAs($user)->putJson("/api/transactions/{$transaction->id}", [
            'type' => 'expense',
            'account_id' => $account->id,
            'category_id' => $category->id,
            'amount' => 4000,
            'date' => '2026-08-15',
        ])->assertOk();

        // 旧-1000が打ち消され(10000)、新-4000が反映される(6000)
        $this->assertSame('6000.00', $account->fresh()->balance);
    }

    public function test_moving_a_transaction_to_another_account_updates_both_balances(): void
    {
        $user = User::factory()->create();
        $accountA = Account::factory()->for($user)->create(['balance' => 10000]);
        $accountB = Account::factory()->for($user)->create(['balance' => 10000]);
        $category = Category::factory()->for($user)->expense()->create();
        $transaction = Transaction::factory()->for($user)->create([
            'account_id' => $accountA->id,
            'category_id' => $category->id,
            'type' => 'expense',
            'amount' => 1000,
        ]);

        $this->actingAs($user)->putJson("/api/transactions/{$transaction->id}", [
            'type' => 'expense',
            'account_id' => $accountB->id,
            'category_id' => $category->id,
            'amount' => 1000,
            'date' => '2026-08-15',
        ])->assertOk();

        $this->assertSame('10000.00', $accountA->fresh()->balance);
        $this->assertSame('9000.00', $accountB->fresh()->balance);
    }

    public function test_deleting_a_transaction_reverses_its_effect_on_balance(): void
    {
        $user = User::factory()->create();
        $account = Account::factory()->for($user)->create(['balance' => 10000]);
        $category = Category::factory()->for($user)->expense()->create();
        $transaction = Transaction::factory()->for($user)->create([
            'account_id' => $account->id,
            'category_id' => $category->id,
            'type' => 'expense',
            'amount' => 1000,
        ]);

        $this->actingAs($user)->deleteJson("/api/transactions/{$transaction->id}")->assertNoContent();

        $this->assertSame('10000.00', $account->fresh()->balance);
    }
}
