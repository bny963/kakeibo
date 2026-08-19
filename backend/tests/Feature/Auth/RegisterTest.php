<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * テストケース一覧 No.1（会員登録機能）に対応。
 */
class RegisterTest extends TestCase
{
    use RefreshDatabase;

    public function test_name_is_required(): void
    {
        $response = $this->postJson('/api/register', [
            'email' => 'satsuki@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ]);

        $response->assertStatus(422)->assertJsonValidationErrors('name');
        $this->assertSame('お名前を入力してください', $response->json('errors.name.0'));
    }

    public function test_email_is_required(): void
    {
        $response = $this->postJson('/api/register', [
            'name' => '田中さつき',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ]);

        $response->assertStatus(422)->assertJsonValidationErrors('email');
        $this->assertSame('メールアドレスを入力してください', $response->json('errors.email.0'));
    }

    public function test_password_must_be_at_least_8_characters(): void
    {
        $response = $this->postJson('/api/register', [
            'name' => '田中さつき',
            'email' => 'satsuki@example.com',
            'password' => 'short12',
            'password_confirmation' => 'short12',
        ]);

        $response->assertStatus(422)->assertJsonValidationErrors('password');
        $this->assertSame('パスワードは8文字以上で入力してください', $response->json('errors.password.0'));
    }

    public function test_duplicate_email_is_rejected(): void
    {
        User::factory()->create(['email' => 'satsuki@example.com']);

        $response = $this->postJson('/api/register', [
            'name' => '田中さつき',
            'email' => 'satsuki@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ]);

        $response->assertStatus(422)->assertJsonValidationErrors('email');
        $this->assertSame('このメールアドレスはすでに登録されています', $response->json('errors.email.0'));
    }

    public function test_successful_registration_logs_the_user_in(): void
    {
        $response = $this->postJson('/api/register', [
            'name' => '田中さつき',
            'email' => 'satsuki@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ]);

        $response->assertCreated();
        $this->assertDatabaseHas('users', ['email' => 'satsuki@example.com']);

        // 登録直後に自動ログインされ、ダッシュボードで使うユーザー情報が取得できる（FN005）
        $this->getJson('/api/user')->assertOk()->assertJsonFragment(['email' => 'satsuki@example.com']);
    }
}
