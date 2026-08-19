<?php

namespace Tests\Feature;

use App\Models\Account;
use App\Models\Category;
use App\Models\Transaction;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * テストケース一覧 No.9（CSV出力機能）に対応。
 */
class TransactionExportTest extends TestCase
{
    use RefreshDatabase;

    public function test_csv_export_contains_only_the_requested_period(): void
    {
        $user = User::factory()->create();
        $account = Account::factory()->for($user)->create();
        $category = Category::factory()->for($user)->expense()->create(['name' => '食費']);

        Transaction::factory()->for($user)->create([
            'account_id' => $account->id,
            'category_id' => $category->id,
            'type' => 'expense',
            'amount' => 1200,
            'date' => '2026-08-10',
            'note' => '対象期間内',
        ]);
        Transaction::factory()->for($user)->create([
            'account_id' => $account->id,
            'category_id' => $category->id,
            'type' => 'expense',
            'amount' => 3000,
            'date' => '2026-06-01',
            'note' => '対象期間外',
        ]);

        $response = $this->actingAs($user)->get('/api/transactions/export?from=2026-08-01&to=2026-08-31');

        $response->assertOk();
        $response->assertHeader('Content-Type', 'text/csv; charset=UTF-8');

        $csv = $response->streamedContent();
        $this->assertStringContainsString('対象期間内', $csv);
        $this->assertStringNotContainsString('対象期間外', $csv);
    }
}
