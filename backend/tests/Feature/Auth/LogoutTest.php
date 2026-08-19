<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * テストケース一覧 No.3（ログアウト機能）に対応。
 */
class LogoutTest extends TestCase
{
    use RefreshDatabase;

    public function test_logout_ends_the_session(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)->postJson('/api/logout')->assertNoContent();

        // ログアウト後は保護APIが401になり、フロントエンドはPG07へリダイレクトする
        $this->getJson('/api/user')->assertUnauthorized();
    }

    public function test_unauthenticated_request_is_rejected(): void
    {
        $this->getJson('/api/user')->assertUnauthorized();
    }
}
