#!/usr/bin/env bash
set -euo pipefail

export PYTHONPATH="apps/api:packages/ml-core:packages/shared-schemas:packages/domain-rules:${PYTHONPATH:-}"
if [ -x ".venv/bin/python3" ]; then
  PYTHON_BIN=".venv/bin/python3"
else
  PYTHON_BIN="python3"
fi

"$PYTHON_BIN" apps/worker/worker.py
