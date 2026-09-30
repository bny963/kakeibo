<?php

namespace Tests\Feature;

use App\Models\Account;
use App\Models\Category;
use App\Models\Transaction;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use RuntimeException;
use Tests\TestCase;

/**
 * 取引の保存と、TransactionObserver による口座残高の更新が一体として成功・取り消しされること。
 *
 * 失敗の注入には、TransactionObserver より後に登録したモデルイベントで例外を投げる方法を使う。
 * これにより「取引の保存も残高の更新も済んだ直後に失敗した」状況を再現し、両方が元に戻ることを確認する。
 */
class TransactionAtomicityTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    private Account $account;

    private Category $category;

    protected function setUp(): void
    {
        parent::setUp();

        $this->user = User::factory()->create();
        $this->account = Account::factory()->for($this->user)->create(['balance' => 10000]);
        $this->category = Category::factory()->for($this->user)->expense()->create();
    }

    public function test_failed_create_rolls_back_both_the_transaction_and_the_balance(): void
    {
        Transaction::created(fn () => throw new RuntimeException('injected failure'));

        $this->actingAs($this->user)->postJson('/api/transactions', [
            'type' => 'expense',
            'account_id' => $this->account->id,
            'category_id' => $this->category->id,
            'amount' => 3000,
            'date' => now()->toDateString(),
        ])->assertStatus(500);

        $this->assertSame(0, Transaction::count());
        $this->assertSame('10000.00', $this->account->fresh()->balance);
    }

    public function test_failed_update_rolls_back_both_the_transaction_and_the_balance(): void
    {
        $transaction = $this->createExpense(1000); // 残高 10000 → 9000
        Transaction::updated(fn () => throw new RuntimeException('injected failure'));

        $this->actingAs($this->user)->putJson("/api/transactions/{$transaction->id}", [
            'type' => 'expense',
            'account_id' => $this->account->id,
            'category_id' => $this->category->id,
            'amount' => 4000,
            'date' => now()->toDateString(),
        ])->assertStatus(500);

        $this->assertSame('1000.00', $transaction->fresh()->amount);
        $this->assertSame('9000.00', $this->account->fresh()->balance);
    }

    public function test_failed_delete_rolls_back_both_the_transaction_and_the_balance(): void
    {
        $transaction = $this->createExpense(1000); // 残高 10000 → 9000
        Transaction::deleted(fn () => throw new RuntimeException('injected failure'));

        $this->actingAs($this->user)
            ->deleteJson("/api/transactions/{$transaction->id}")
            ->assertStatus(500);

        $this->assertNotNull($transaction->fresh());
        $this->assertSame('9000.00', $this->account->fresh()->balance);
    }

    private function createExpense(int $amount): Transaction
    {
        return Transaction::factory()->for($this->user)->create([
            'account_id' => $this->account->id,
            'category_id' => $this->category->id,
            'type' => 'expense',
            'amount' => $amount,
            'date' => now()->toDateString(),
        ]);
    }
}
