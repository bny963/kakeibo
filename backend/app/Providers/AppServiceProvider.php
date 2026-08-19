<?php

namespace App\Providers;

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
        // パスワードリセットメールのリンク先はLaravelのBladeビューではなく
        // React SPAの再設定画面（PG10）を指すようにする
        ResetPassword::createUrlUsing(function (object $notifiable, string $token) {
            $email = urlencode($notifiable->getEmailForPasswordReset());

            return sprintf('%s/reset-password?token=%s&email=%s', config('app.frontend_url'), $token, $email);
        });
    }
}
