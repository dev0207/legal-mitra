#!/usr/bin/env python3
from __future__ import annotations

from pathlib import Path

stamp = Path("datasets/registry/FROZEN")
stamp.write_text("Dataset snapshots frozen for model training\n", encoding="utf-8")
print(f"Created {stamp}")
