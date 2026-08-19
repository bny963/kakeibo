<?php

use Illuminate\Auth\AuthenticationException;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Exceptions\ThrottleRequestsException;
use Illuminate\Http\Request;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        // Sanctum SPA(Cookie)認証: config/sanctum.php の stateful ドメインからの
        // リクエストにEnsureFrontendRequestsAreStatefulミドルウェアを適用する
        $middleware->statefulApi();
    })
    ->withExceptions(function (Exceptions $exceptions) {
        // 例外設計シートの方針をAPI向けに一元的に適用する。
        // message(ユーザー向け文言) と errors(バリデーションエラー時のみ) を持つJSONで統一する。
        // 4xx系（ModelNotFoundException/AuthenticationException/ValidationException等）は
        // Laravelの $internalDontReport によりデフォルトで報告(ログ)されない。
        // 5xx系（予期しない例外）のみ後述の通りerrorレベルでログし、詳細はレスポンスに含めない。

        // ModelNotFoundExceptionはprepareException()でNotFoundHttpExceptionに変換された後に
        // レンダリングされるため、ここではNotFoundHttpExceptionを対象にする。
        // ルーティング自体が存在しない場合の404も同じ経路になるが、いずれの場合も
        // 「リソースの存在自体を推測されないようにする」という権限設計の方針上、
        // 同じ中立的な文言で問題ない（例外設計 No.1 / エラーメッセージ設計 No.7）。
        $exceptions->render(function (NotFoundHttpException $e, Request $request) {
            if ($request->is('api/*')) {
                return response()->json([
                    'message' => 'お探しのデータが見つかりませんでした',
                ], 404);
            }
        });

        // 未認証状態でauth:sanctum配下のAPIにアクセスした場合（例外設計 No.2）
        $exceptions->render(function (AuthenticationException $e, Request $request) {
            if ($request->is('api/*')) {
                return response()->json([
                    'message' => 'セッションの有効期限が切れました。もう一度ログインしてください',
                ], 401);
            }
        });

        // ログイン試行等の短時間の大量リクエスト（例外設計 No.6）
        $exceptions->render(function (ThrottleRequestsException $e, Request $request) {
            if ($request->is('api/*')) {
                return response()->json([
                    'message' => 'しばらく時間をおいて再度お試しください',
                ], 429);
            }
        });

        // 上記のいずれにも該当しない予期しない例外（例外設計 No.7）。
        // スタックトレースはstorage/logs/laravel.logにerrorレベルで記録し、
        // レスポンスには一切含めない（本番運用がないローカル開発からこの方針を徹底する）。
        $exceptions->render(function (Throwable $e, Request $request) {
            if (! $request->is('api/*')) {
                return null;
            }

            // 上記で個別にハンドリング済みの型、およびバリデーション(422)・HTTPException系は
            // Laravel標準のレンダリングに委ねる（この分岐は「本当に予期しない例外」専用）。
            if ($e instanceof \Symfony\Component\HttpKernel\Exception\HttpExceptionInterface
                || $e instanceof \Illuminate\Validation\ValidationException
                || $e instanceof AuthenticationException) {
                return null;
            }

            report($e);

            return response()->json([
                'message' => '一時的に接続できませんでした。時間をおいて再度お試しください',
            ], 500);
        });
    })->create();
