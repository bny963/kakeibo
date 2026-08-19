<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

/**
 * テストケース一覧 No.2（ログイン機能）に対応。
 */
class LoginTest extends TestCase
{
    use RefreshDatabase;

    public function test_email_is_required(): void
    {
        $response = $this->postJson('/api/login', ['password' => 'password123']);

        $response->assertStatus(422)->assertJsonValidationErrors('email');
        $this->assertSame('メールアドレスを入力してください', $response->json('errors.email.0'));
    }

    public function test_wrong_credentials_are_rejected_without_specifying_which_field(): void
    {
        User::factory()->create([
            'email' => 'satsuki@example.com',
            'password' => Hash::make('correct-password'),
        ]);

        $response = $this->postJson('/api/login', [
            'email' => 'satsuki@example.com',
            'password' => 'wrong-password',
        ]);

        $response->assertStatus(422)->assertJsonValidationErrors('email');
        $this->assertSame('ログイン情報が登録されていません', $response->json('errors.email.0'));
    }

    public function test_correct_credentials_log_the_user_in(): void
    {
        User::factory()->create([
            'email' => 'satsuki@example.com',
            'password' => Hash::make('correct-password'),
        ]);

        $response = $this->postJson('/api/login', [
            'email' => 'satsuki@example.com',
            'password' => 'correct-password',
        ]);

        $response->assertOk();
        $this->getJson('/api/user')->assertOk()->assertJsonFragment(['email' => 'satsuki@example.com']);
    }
}
