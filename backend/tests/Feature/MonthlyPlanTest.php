<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * テストケース一覧 No.10（月次プラン設定機能）に対応。
 */
class MonthlyPlanTest extends TestCase
{
    use RefreshDatabase;

    public function test_plan_is_saved_and_weekly_allowance_is_calculated(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->postJson('/api/monthly-plans', [
            'month' => '2026-08',
            'income' => 250000,
            'fixed_costs' => 90000,
            'savings_goal' => 20000,
        ]);

        $response->assertCreated();
        // (250000 - 90000 - 20000) / 4.3 = 32558.14 (小数第2位四捨五入)
        $this->assertEqualsWithDelta(32558.14, $response->json('weekly_allowance'), 0.01);
    }

    public function test_savings_goal_exceeding_income_is_rejected(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->postJson('/api/monthly-plans', [
            'month' => '2026-08',
            'income' => 200000,
            'fixed_costs' => 0,
            'savings_goal' => 250000,
        ]);

        $response->assertStatus(422)->assertJsonValidationErrors('savings_goal');
        $this->assertDatabaseMissing('monthly_plans', ['user_id' => $user->id]);
    }

    public function test_fixed_costs_plus_savings_goal_exceeding_income_is_rejected(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->postJson('/api/monthly-plans', [
            'month' => '2026-08',
            'income' => 200000,
            'fixed_costs' => 150000,
            'savings_goal' => 100000,
        ]);

        $response->assertStatus(422)->assertJsonValidationErrors('fixed_costs');
        $this->assertDatabaseMissing('monthly_plans', ['user_id' => $user->id]);
    }
}
