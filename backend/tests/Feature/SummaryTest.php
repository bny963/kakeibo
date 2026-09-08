<?php

namespace Tests\Feature;

use App\Models\Account;
use App\Models\Category;
use App\Models\Transaction;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * レポートの円グラフが描画されない不具合（APIのtotalが文字列のままPieに渡っている）の修正に対応。
 */
class SummaryTest extends TestCase
{
    use RefreshDatabase;

    public function test_category_summary_total_is_returned_as_a_number_not_a_string(): void
    {
        $user = User::factory()->create();
        $account = Account::factory()->for($user)->create();
        $category = Category::factory()->for($user)->expense()->create();

        Transaction::factory()->for($user)->create([
            'account_id' => $account->id,
            'category_id' => $category->id,
            'type' => 'expense',
            'amount' => 1200,
            'date' => '2026-08-10',
        ]);

        $response = $this->actingAs($user)->getJson('/api/summary/category?month=2026-08&type=expense');

        $response->assertOk();
        // PieChartが数値として扱えるよう、totalは文字列ではなくJSONの数値型で返る必要がある
        $this->assertIsNotString($response->json('categories.0.total'));
        $this->assertSame(1200.0, (float) $response->json('categories.0.total'));
    }
}
