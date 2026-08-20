# Kakeibo backend

Laravel 11 API for Kakeibo（Sanctum SPA Cookie認証）。セットアップ手順・ER図・画面一覧は
[リポジトリルートのREADME](../README.md)を参照してください。

## よく使うコマンド

```bash
# ローカル（Dockerコンテナ内）
php artisan migrate        # マイグレーション実行
php artisan db:seed        # ダミーデータ投入（KakeiboDemoSeeder）
php artisan test           # PHPUnitテスト実行
php artisan route:list     # ルート一覧確認

# 固定費・サブスクの週次確定処理（トランザクション設計 No.8）
php artisan app:finalize-piggy-bank-week
```

## デモアカウント

`db:seed` 実行後、以下のアカウントでログインできます。

| メールアドレス | パスワード |
|---|---|
| demo@kakeibo.test | password |
