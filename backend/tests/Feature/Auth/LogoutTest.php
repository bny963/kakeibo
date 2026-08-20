<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

/**
 * テストケース一覧 No.3（ログアウト機能）に対応。
 */
class LogoutTest extends TestCase
{
    use RefreshDatabase;

    public function test_logout_ends_the_session(): void
    {
        // actingAs()はセッションを経由せずガードへ直接ユーザーをセットするため、
        // 「ログアウトで本当にセッションが終わるか」を検証するには実際のログインAPIを通す。
        User::factory()->create([
            'email' => 'satsuki@example.com',
            'password' => Hash::make('password123'),
        ]);

        $this->postJson('/api/login', [
            'email' => 'satsuki@example.com',
            'password' => 'password123',
        ])->assertOk();

        $this->postJson('/api/logout')->assertNoContent();

        // PHPUnitは1テスト内の複数リクエストを同一プロセスで処理するため、
        // Sanctumの'sanctum'ガード(RequestGuard)が最初のリクエストで解決したユーザーを
        // プロセス内でキャッシュし続けてしまう（本番では各リクエストが別プロセスのため
        // 発生しない、テスト実行環境特有の挙動）。実際にセッションのlogin_web_*キーが
        // 消えていることは別途確認済みのため、ここではAuth::forgetGuards()で
        // キャッシュされたガードを破棄し、次のリクエストで再解決させる。
        Auth::forgetGuards();

        // ログアウト後は保護APIが401になり、フロントエンドはPG07へリダイレクトする
        $this->getJson('/api/user')->assertUnauthorized();
    }

    public function test_unauthenticated_request_is_rejected(): void
    {
        $this->getJson('/api/user')->assertUnauthorized();
    }
}
