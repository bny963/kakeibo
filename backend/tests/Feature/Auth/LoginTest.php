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
        $this->assertSame('メールアドレスまたはパスワードが正しくありません', $response->json('errors.email.0'));
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

    public function test_login_attempts_are_limited_per_email_and_ip(): void
    {
        User::factory()->create([
            'email' => 'satsuki@example.com',
            'password' => Hash::make('correct-password'),
        ]);

        for ($i = 0; $i < 5; $i++) {
            $this->postJson('/api/login', [
                'email' => 'satsuki@example.com',
                'password' => 'wrong-password',
            ])->assertStatus(422);
        }

        // 6回目は正しいパスワードでも429（総当たりで当たりを引いても通さない）
        $response = $this->postJson('/api/login', [
            'email' => 'satsuki@example.com',
            'password' => 'correct-password',
        ]);

        $response->assertStatus(429);
        $this->assertSame('しばらく時間をおいて再度お試しください', $response->json('message'));
        $this->assertGuest();
    }

    public function test_login_limit_for_one_email_does_not_block_another_email(): void
    {
        User::factory()->create([
            'email' => 'other@example.com',
            'password' => Hash::make('correct-password'),
        ]);

        for ($i = 0; $i < 5; $i++) {
            $this->postJson('/api/login', ['email' => 'satsuki@example.com', 'password' => 'wrong-password']);
        }

        $this->postJson('/api/login', [
            'email' => 'other@example.com',
            'password' => 'correct-password',
        ])->assertOk();
    }
}
