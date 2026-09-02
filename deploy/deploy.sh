#!/usr/bin/env bash
set -euo pipefail

APP_DIR="/var/www/prism"
cd "$APP_DIR"

echo "[deploy] pulling latest main..."
git fetch origin main
git reset --hard origin/main

echo "[deploy] installing dependencies..."
bun install --frozen-lockfile

echo "[deploy] running migrations..."
bun run db:migrate

echo "[deploy] building app..."
bun run build

echo "[deploy] restarting pm2 processes..."
pm2 startOrReload ecosystem.config.cjs --update-env
pm2 save

echo "[deploy] done"
