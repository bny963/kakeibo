<?php

namespace Tests\Feature;

use App\Models\PiggyBankRecord;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * 貯金箱のビジュアル（色・柄・キャラクター）をポイントで解禁・着せ替えする機能のテスト。
 * ポイントは確定済みの週（piggy_bank_records.saved_amount）の累計からのみ算出され、
 * この機能を一切使わなくても他の機能に影響しないことを確認する。
 */
class PiggyBankSkinTest extends TestCase
{
    use RefreshDatabase;

    private function givenSavedAmount(User $user, float $amount): void
    {
        PiggyBankRecord::factory()->for($user)->create([
            'week_start_date' => '2026-08-17',
            'weekly_allowance' => $amount,
            'spent_amount' => 0,
            'saved_amount' => $amount,
        ]);
    }

    public function test_index_returns_zero_points_and_only_default_skins_owned_when_nothing_saved(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->getJson('/api/piggy-bank/skins');

        $response->assertOk();
        $this->assertSame(0, $response->json('points_balance'));

        $owned = collect($response->json('skins'))->where('owned', true)->pluck('key');
        $this->assertEqualsCanonicalizing(
            ['color_pink', 'pattern_none', 'character_pig'],
            $owned->all(),
        );
    }

    public function test_saved_amount_converts_to_points_at_10_yen_per_point(): void
    {
        $user = User::factory()->create();
        $this->givenSavedAmount($user, 1234); // 1234円 -> 123ポイント（端数切り捨て）

        $response = $this->actingAs($user)->getJson('/api/piggy-bank/skins');

        $response->assertOk();
        $this->assertSame(123, $response->json('points_balance'));
    }

    public function test_can_unlock_a_skin_when_points_are_sufficient(): void
    {
        $user = User::factory()->create();
        $this->givenSavedAmount($user, 1000); // 100ポイント

        $response = $this->actingAs($user)->postJson('/api/piggy-bank/skins/color_mint/unlock');

        $response->assertCreated();
        // color_mintのコストは80ポイントのため、残高は20になる
        $this->assertSame(20, $response->json('points_balance'));

        $mint = collect($response->json('skins'))->firstWhere('key', 'color_mint');
        $this->assertTrue($mint['owned']);
    }

    public function test_unlocking_fails_with_422_when_points_are_insufficient(): void
    {
        $user = User::factory()->create();
        $this->givenSavedAmount($user, 100); // 10ポイントしかない

        $response = $this->actingAs($user)->postJson('/api/piggy-bank/skins/color_mint/unlock'); // 80ポイント必要

        $response->assertStatus(422);
        $this->assertDatabaseCount('piggy_bank_skin_unlocks', 0);
    }

    public function test_unlocking_the_same_skin_twice_fails_and_does_not_double_spend_points(): void
    {
        $user = User::factory()->create();
        $this->givenSavedAmount($user, 1000);

        $this->actingAs($user)->postJson('/api/piggy-bank/skins/color_mint/unlock')->assertCreated();
        $response = $this->actingAs($user)->postJson('/api/piggy-bank/skins/color_mint/unlock');

        $response->assertStatus(422);
        $this->assertDatabaseCount('piggy_bank_skin_unlocks', 1);
    }

    public function test_can_equip_an_owned_skin(): void
    {
        $user = User::factory()->create();
        $this->givenSavedAmount($user, 1000);
        $this->actingAs($user)->postJson('/api/piggy-bank/skins/color_mint/unlock')->assertCreated();

        $response = $this->actingAs($user)->postJson('/api/piggy-bank/skins/color_mint/equip');

        $response->assertOk();
        $this->assertSame('color_mint', $response->json('appearance.color'));
    }

    public function test_equipping_an_unowned_skin_fails_with_422(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->postJson('/api/piggy-bank/skins/color_mint/equip');

        $response->assertStatus(422);
        $this->assertNull($user->fresh()->piggy_bank_color);
    }

    public function test_a_user_cannot_see_or_affect_another_users_points_or_appearance(): void
    {
        $owner = User::factory()->create();
        $this->givenSavedAmount($owner, 1000);
        $this->actingAs($owner)->postJson('/api/piggy-bank/skins/color_mint/unlock')->assertCreated();
        $this->actingAs($owner)->postJson('/api/piggy-bank/skins/color_mint/equip')->assertOk();

        $other = User::factory()->create();
        $response = $this->actingAs($other)->getJson('/api/piggy-bank/skins');

        $response->assertOk();
        $this->assertSame(0, $response->json('points_balance'));
        $this->assertSame('color_pink', $response->json('appearance.color'));
    }

    public function test_ignoring_this_feature_entirely_does_not_break_the_this_week_endpoint(): void
    {
        // ポイント・見た目機能を一切使わないユーザーでも、貯金箱の本来機能（今週の状況）は
        // 通常どおり動作することを確認する（コスメティック層が本来機能をロックしないことの担保）。
        $user = User::factory()->create();

        $response = $this->actingAs($user)->getJson('/api/piggy-bank/this-week');

        $response->assertOk();
    }
}
