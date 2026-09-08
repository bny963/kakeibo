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

    public function test_csv_rows_are_ordered_newest_first_like_the_transaction_list(): void
    {
        $user = User::factory()->create();
        $account = Account::factory()->for($user)->create();
        $category = Category::factory()->for($user)->expense()->create(['name' => '食費']);

        Transaction::factory()->for($user)->create([
            'account_id' => $account->id,
            'category_id' => $category->id,
            'type' => 'expense',
            'amount' => 1000,
            'date' => '2026-08-01',
            'note' => '古い方',
        ]);
        Transaction::factory()->for($user)->create([
            'account_id' => $account->id,
            'category_id' => $category->id,
            'type' => 'expense',
            'amount' => 2000,
            'date' => '2026-08-20',
            'note' => '新しい方',
        ]);

        $csv = $this->actingAs($user)
            ->get('/api/transactions/export?from=2026-08-01&to=2026-08-31')
            ->streamedContent();

        $this->assertGreaterThan(
            strpos($csv, '新しい方'),
            strpos($csv, '古い方'),
            '新しい取引が先頭に来る順序でCSVが出力されるべき',
        );
    }

    public function test_csv_injection_payloads_are_neutralized(): void
    {
        $user = User::factory()->create();
        $account = Account::factory()->for($user)->create();
        $category = Category::factory()->for($user)->expense()->create(['name' => '=HYPERLINK("http://evil.example")']);

        Transaction::factory()->for($user)->create([
            'account_id' => $account->id,
            'category_id' => $category->id,
            'type' => 'expense',
            'amount' => 1000,
            'date' => '2026-08-10',
            'note' => '@SUM(1+1)',
        ]);

        $csv = $this->actingAs($user)
            ->get('/api/transactions/export?from=2026-08-01&to=2026-08-31')
            ->streamedContent();

        $this->assertStringNotContainsString(',=HYPERLINK', $csv);
        $this->assertStringContainsString("'=HYPERLINK", $csv);
        $this->assertStringContainsString("'@SUM(1+1)", $csv);
    }
}
