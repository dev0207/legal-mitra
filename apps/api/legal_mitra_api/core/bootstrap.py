from __future__ import annotations

import sys
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[4]
for rel in ["packages/shared-schemas", "packages/domain-rules", "packages/ml-core"]:
    p = REPO_ROOT / rel
    if str(p) not in sys.path:
        sys.path.insert(0, str(p))
