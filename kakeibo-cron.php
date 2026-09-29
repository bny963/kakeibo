#!/usr/local/bin/php
<?php

/**
 * ロリポップの cron 設定から、1日1回呼び出すためのスクリプト。
 * routes/console.php の Schedule 登録と同じ処理を、schedule:run の毎分実行なしで行う。
 *
 * - 毎日: 支払い日を過ぎた固定費・サブスクを次回発生日へ更新
 * - 月曜: 先週分の貯金箱記録を確定（ポイントの元になる）
 *
 * ロリポップの cron は公開フォルダ(web)配下のファイルしか指定できないため web 直下に置くが、
 * CLI 以外（ブラウザ）からのアクセスは 403 で拒否する。
 * バックエンド本体は公開フォルダの外（web の1つ上の kakeibo/backend）にある前提。
 * cron 設定では 毎日 0:05 に実行するよう登録する。
 */

if (PHP_SAPI !== 'cli') {
    http_response_code(403);
    exit('forbidden');
}

$backend = dirname(__DIR__).'/kakeibo/backend';

if (! is_file($backend.'/artisan')) {
    fwrite(STDERR, "バックエンドが見つかりません: {$backend}\n");
    exit(1);
}

require $backend.'/vendor/autoload.php';

$app = require_once $backend.'/bootstrap/app.php';
/** @var \Illuminate\Contracts\Console\Kernel $kernel */
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

function run(\Illuminate\Contracts\Console\Kernel $kernel, string $command): void
{
    $exitCode = $kernel->call($command);
    echo '['.now()->toDateTimeString()."] {$command} (exit code: {$exitCode})\n".$kernel->output();
}

run($kernel, 'app:update-overdue-recurring-rules');

// APP_TIMEZONE=Asia/Tokyo 前提で、日本時間の月曜かどうかを判定する
if (now()->isMonday()) {
    run($kernel, 'app:finalize-piggy-bank-week');
}
