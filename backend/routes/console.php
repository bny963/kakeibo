<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// トランザクション設計 No.8: 週の切り替わり（月曜0時）に先週分を確定させる
Schedule::command('app:finalize-piggy-bank-week')->weeklyOn(1, '00:05');

// 状態遷移設計⑤: 支払い日超過の固定費・サブスクを次回発生日へ日次で自動更新する
Schedule::command('app:update-overdue-recurring-rules')->dailyAt('00:10');
