<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

/**
 * PG11（プロフィール設定）: 名前・パスワード変更。
 */
class ProfileUpdateTest extends TestCase
{
    use RefreshDatabase;

    public function test_name_can_be_updated(): void
    {
        $user = User::factory()->create(['name' => '旧名前']);

        $response = $this->actingAs($user)->putJson('/api/user', ['name' => '新しい名前']);

        $response->assertOk()->assertJsonFragment(['name' => '新しい名前']);
        $this->assertDatabaseHas('users', ['id' => $user->id, 'name' => '新しい名前']);
    }

    public function test_password_change_requires_correct_current_password(): void
    {
        $user = User::factory()->create(['password' => Hash::make('old-password')]);

        $response = $this->actingAs($user)->putJson('/api/user', [
            'name' => $user->name,
            'current_password' => 'wrong-password',
            'password' => 'new-password123',
            'password_confirmation' => 'new-password123',
        ]);

        $response->assertStatus(422)->assertJsonValidationErrors('current_password');
    }

    public function test_password_can_be_changed_with_correct_current_password(): void
    {
        $user = User::factory()->create(['password' => Hash::make('old-password')]);

        $response = $this->actingAs($user)->putJson('/api/user', [
            'name' => $user->name,
            'current_password' => 'old-password',
            'password' => 'new-password123',
            'password_confirmation' => 'new-password123',
        ]);

        $response->assertOk();
        $this->assertTrue(Hash::check('new-password123', $user->fresh()->password));
    }
}
