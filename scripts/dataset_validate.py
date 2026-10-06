#!/usr/bin/env python3
from __future__ import annotations

from pathlib import Path

import yaml


manifest = Path("datasets/registry/dataset_manifest.yaml")
if not manifest.exists():
    raise SystemExit("dataset_manifest.yaml missing")

data = yaml.safe_load(manifest.read_text(encoding="utf-8"))
missing = []
for item in data.get("datasets", []):
    p = Path(item["path"])
    if not p.exists():
        missing.append(str(p))

if missing:
    raise SystemExit(f"Missing dataset paths: {missing}")

print("Dataset manifest validation passed.")
