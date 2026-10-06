#!/usr/bin/env bash
set -euo pipefail

export PYTHONPATH="apps/api:packages/ml-core:packages/shared-schemas:packages/domain-rules:${PYTHONPATH:-}"

if [ -x ".venv/bin/python3" ]; then
  PYTHON_BIN=".venv/bin/python3"
else
  PYTHON_BIN="python3"
fi

if ! "$PYTHON_BIN" -c "import uvicorn, fastapi, duckdb" >/dev/null 2>&1; then
  echo "[run_api] Missing backend dependencies for $PYTHON_BIN."
  echo "[run_api] Run: $PYTHON_BIN -m pip install -r requirements.txt"
  exit 1
fi

API_HOST="${API_HOST:-127.0.0.1}"
API_PORT="${API_PORT:-8000}"
if [ "${API_RELOAD:-0}" = "1" ]; then
  "$PYTHON_BIN" -m uvicorn legal_mitra_api.main:app --app-dir apps/api --reload --host "$API_HOST" --port "$API_PORT"
else
  "$PYTHON_BIN" -m uvicorn legal_mitra_api.main:app --app-dir apps/api --host "$API_HOST" --port "$API_PORT"
fi
