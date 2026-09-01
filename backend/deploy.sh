#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"

git pull --ff-only
composer install --no-dev --optimize-autoloader
php artisan migrate --force
php artisan config:cache
php artisan route:cache
php artisan view:cache
