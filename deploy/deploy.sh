#!/usr/bin/env bash
set -euo pipefail

APP_DIR="/var/www/prism"
cd "$APP_DIR"

echo "[deploy] pulling latest main..."
if ! GIT_TERMINAL_PROMPT=0 git fetch origin main; then
  echo "[deploy] origin fetch failed; retrying with public HTTPS remote"
  git remote set-url origin https://github.com/gaurang-py/prism.git
  GIT_TERMINAL_PROMPT=0 git fetch origin main
fi
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
