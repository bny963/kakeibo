<?php

namespace Tests;

use Illuminate\Foundation\Testing\TestCase as BaseTestCase;

abstract class TestCase extends BaseTestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        // Sanctum の EnsureFrontendRequestsAreStateful は Origin/Referer が
        // config(sanctum.stateful) のドメインと一致した場合のみ session
        // ミドルウェアを有効化する。実際のSPAはブラウザがRefererを自動送信するため
        // 本番相当だが、テストでは明示しないと "Session store not set" になるため設定する。
        $this->withHeader('Referer', config('app.frontend_url'));
    }
}
