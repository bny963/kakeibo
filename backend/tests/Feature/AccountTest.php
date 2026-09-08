<?php

namespace Tests\Feature;

use App\Models\Account;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AccountTest extends TestCase
{
    use RefreshDatabase;

    public function test_duplicate_account_name_is_rejected(): void
    {
        $user = User::factory()->create();
        Account::factory()->for($user)->create(['name' => '現金']);

        $response = $this->actingAs($user)->postJson('/api/accounts', [
            'name' => '現金',
            'type' => 'cash',
            'balance' => 0,
        ]);

        $response->assertStatus(422)->assertJsonValidationErrors('name');
    }

    public function test_same_account_name_is_allowed_for_different_users(): void
    {
        $other = User::factory()->create();
        Account::factory()->for($other)->create(['name' => '現金']);

        $user = User::factory()->create();
        $response = $this->actingAs($user)->postJson('/api/accounts', [
            'name' => '現金',
            'type' => 'cash',
            'balance' => 0,
        ]);

        $response->assertCreated();
    }

    public function test_updating_an_account_without_changing_its_name_is_allowed(): void
    {
        $user = User::factory()->create();
        $account = Account::factory()->for($user)->create(['name' => '現金']);

        $response = $this->actingAs($user)->putJson("/api/accounts/{$account->id}", [
            'name' => '現金',
            'type' => 'cash',
            'balance' => 500,
        ]);

        $response->assertOk();
    }

    public function test_extremely_large_balance_is_rejected_instead_of_erroring(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->postJson('/api/accounts', [
            'name' => '現金',
            'type' => 'cash',
            'balance' => 123456789012345,
        ]);

        $response->assertStatus(422)->assertJsonValidationErrors('balance');
    }
}
