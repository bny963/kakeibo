<?php

namespace Tests\Feature;

use App\Models\Account;
use App\Models\Category;
use App\Models\Transaction;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * テストケース一覧 No.4〜7（取引登録・一覧・編集・削除機能）に対応。
 */
class TransactionTest extends TestCase
{
    use RefreshDatabase;

    private function createOwnedResources(User $user): array
    {
        return [
            Account::factory()->for($user)->create(),
            Category::factory()->for($user)->expense()->create(),
        ];
    }

    public function test_amount_is_required(): void
    {
        $user = User::factory()->create();
        [$account, $category] = $this->createOwnedResources($user);

        $response = $this->actingAs($user)->postJson('/api/transactions', [
            'type' => 'expense',
            'account_id' => $account->id,
            'category_id' => $category->id,
            'date' => '2026-08-15',
        ]);

        $response->assertStatus(422)->assertJsonValidationErrors('amount');
        $this->assertSame('金額を入力してください', $response->json('errors.amount.0'));
    }

    public function test_transaction_is_created_and_listed(): void
    {
        $user = User::factory()->create();
        [$account, $category] = $this->createOwnedResources($user);

        $response = $this->actingAs($user)->postJson('/api/transactions', [
            'type' => 'expense',
            'account_id' => $account->id,
            'category_id' => $category->id,
            'amount' => 1500,
            'date' => '2026-08-15',
            'note' => 'ランチ',
        ]);

        $response->assertCreated();

        $this->actingAs($user)
            ->getJson('/api/transactions')
            ->assertOk()
            ->assertJsonFragment(['note' => 'ランチ']);
    }

    public function test_users_only_see_their_own_transactions(): void
    {
        $me = User::factory()->create();
        $other = User::factory()->create();

        [$myAccount, $myCategory] = $this->createOwnedResources($me);
        [$otherAccount, $otherCategory] = $this->createOwnedResources($other);

        Transaction::factory()->for($me)->create([
            'account_id' => $myAccount->id,
            'category_id' => $myCategory->id,
        ]);
        Transaction::factory()->for($other)->create([
            'account_id' => $otherAccount->id,
            'category_id' => $otherCategory->id,
        ]);

        $response = $this->actingAs($me)->getJson('/api/transactions');

        $response->assertOk();
        $this->assertCount(1, $response->json('data'));
    }

    public function test_updating_another_users_transaction_returns_404(): void
    {
        $me = User::factory()->create();
        $other = User::factory()->create();
        [$otherAccount, $otherCategory] = $this->createOwnedResources($other);

        $otherTransaction = Transaction::factory()->for($other)->create([
            'account_id' => $otherAccount->id,
            'category_id' => $otherCategory->id,
        ]);

        [$myAccount, $myCategory] = $this->createOwnedResources($me);

        $response = $this->actingAs($me)->putJson("/api/transactions/{$otherTransaction->id}", [
            'type' => 'expense',
            'account_id' => $myAccount->id,
            'category_id' => $myCategory->id,
            'amount' => 500,
            'date' => '2026-08-15',
        ]);

        $response->assertNotFound();
        $this->assertSame('お探しのデータが見つかりませんでした', $response->json('message'));
    }

    public function test_own_transaction_can_be_updated(): void
    {
        $user = User::factory()->create();
        [$account, $category] = $this->createOwnedResources($user);
        $transaction = Transaction::factory()->for($user)->create([
            'account_id' => $account->id,
            'category_id' => $category->id,
            'amount' => 1000,
        ]);

        $response = $this->actingAs($user)->putJson("/api/transactions/{$transaction->id}", [
            'type' => 'expense',
            'account_id' => $account->id,
            'category_id' => $category->id,
            'amount' => 2000,
            'date' => '2026-08-15',
        ]);

        $response->assertOk();
        $this->assertDatabaseHas('transactions', ['id' => $transaction->id, 'amount' => 2000]);
    }

    public function test_own_transaction_can_be_deleted(): void
    {
        $user = User::factory()->create();
        [$account, $category] = $this->createOwnedResources($user);
        $transaction = Transaction::factory()->for($user)->create([
            'account_id' => $account->id,
            'category_id' => $category->id,
        ]);

        $this->actingAs($user)->deleteJson("/api/transactions/{$transaction->id}")->assertNoContent();

        $this->assertDatabaseMissing('transactions', ['id' => $transaction->id]);
    }
}
