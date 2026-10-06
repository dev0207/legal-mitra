#!/usr/bin/env python3
from __future__ import annotations

import argparse
from pathlib import Path

import yaml


parser = argparse.ArgumentParser(description="Append dataset metadata to manifest")
parser.add_argument("--name", required=True)
parser.add_argument("--path", required=True)
parser.add_argument("--type", default="unknown")
parser.add_argument("--notes", default="")
args = parser.parse_args()

manifest_path = Path("datasets/registry/dataset_manifest.yaml")
manifest = yaml.safe_load(manifest_path.read_text(encoding="utf-8"))
manifest.setdefault("datasets", []).append(
    {
        "name": args.name,
        "path": args.path,
        "type": args.type,
        "immutable": True,
        "notes": args.notes,
    }
)
manifest_path.write_text(yaml.safe_dump(manifest, sort_keys=False), encoding="utf-8")
print(f"Dataset registered: {args.name}")
