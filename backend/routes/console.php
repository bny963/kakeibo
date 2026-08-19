<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// トランザクション設計 No.8: 週の切り替わり（月曜0時）に先週分を確定させる
Schedule::command('app:finalize-piggy-bank-week')->weeklyOn(1, '00:05');
