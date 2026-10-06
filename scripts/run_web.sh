#!/usr/bin/env bash
set -euo pipefail

cd apps/web

if [ ! -d node_modules ]; then
  echo "[run_web] node_modules not found. Installing npm dependencies..."
  npm install
fi

WEB_HOST="${WEB_HOST:-127.0.0.1}"
WEB_PORT="${WEB_PORT:-3000}"
npm run dev -- --hostname "$WEB_HOST" --port "$WEB_PORT"
