<?php

namespace App\Providers;

use App\Models\Transaction;
use App\Observers\TransactionObserver;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Str;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // 取引の登録・編集・削除に連動して口座残高を再計算する
        Transaction::observe(TransactionObserver::class);

        // 認証系APIの試行回数制限（例外設計 No.6）。超過時は bootstrap/app.php で429の共通メッセージを返す。
        // ログインは自前の Auth::attempt 実装で、Breeze/Fortify の標準制限を使っていないためここで定義する。
        // 「メールアドレス+IP」で総当たりを、「IPのみ」で多数のアカウントへの横断的な試行を抑える。
        RateLimiter::for('login', fn (Request $request) => [
            Limit::perMinute(5)->by('login:'.Str::lower((string) $request->input('email')).'|'.$request->ip()),
            Limit::perMinute(30)->by('login-ip:'.$request->ip()),
        ]);
        // パスワード再設定メールの送信・再設定、会員登録（メール送信やアカウント作成の大量実行を防ぐ）
        RateLimiter::for('auth-sensitive', fn (Request $request) => [
            Limit::perMinute(3)->by('auth-sensitive:'.Str::lower((string) $request->input('email')).'|'.$request->ip()),
            Limit::perMinute(10)->by('auth-sensitive-ip:'.$request->ip()),
        ]);

        // パスワードリセットメールのリンク先はLaravelのBladeビューではなく
        // React SPAの再設定画面（PG10）を指すようにする
        ResetPassword::createUrlUsing(function (object $notifiable, string $token) {
            $email = urlencode($notifiable->getEmailForPasswordReset());

            return sprintf('%s/reset-password?token=%s&email=%s', config('app.frontend_url'), $token, $email);
        });
    }
}
