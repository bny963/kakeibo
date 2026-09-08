<?php

namespace App\Providers;

use App\Models\Transaction;
use App\Observers\TransactionObserver;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Support\ServiceProvider;

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

        // パスワードリセットメールのリンク先はLaravelのBladeビューではなく
        // React SPAの再設定画面（PG10）を指すようにする
        ResetPassword::createUrlUsing(function (object $notifiable, string $token) {
            $email = urlencode($notifiable->getEmailForPasswordReset());

            return sprintf('%s/reset-password?token=%s&email=%s', config('app.frontend_url'), $token, $email);
        });
    }
}
