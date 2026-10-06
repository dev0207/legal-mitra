from __future__ import annotations

import time

from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[2]
for rel in ["packages/ml-core", "packages/shared-schemas", "packages/domain-rules"]:
    p = ROOT / rel
    if str(p) not in sys.path:
        sys.path.insert(0, str(p))

from ml_core.storage import DuckDBStore


def run() -> None:
    db = DuckDBStore()
    print("Worker started. Polling tasks table...")
    while True:
        # Placeholder worker loop for future queued tasks.
        time.sleep(2)
        # no-op by design in v1: API uses FastAPI BackgroundTasks.


if __name__ == "__main__":
    run()
