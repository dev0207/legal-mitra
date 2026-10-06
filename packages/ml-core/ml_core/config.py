from __future__ import annotations

import os
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parents[3]
ARTIFACTS_DIR = ROOT_DIR / "artifacts"
INDICES_DIR = ARTIFACTS_DIR / "indices"
DUCKDB_DIR = ARTIFACTS_DIR / "duckdb"
UPLOADS_DIR = ARTIFACTS_DIR / "uploads"
EXPORTS_DIR = ARTIFACTS_DIR / "exports"

for path in (INDICES_DIR, DUCKDB_DIR, UPLOADS_DIR, EXPORTS_DIR):
    path.mkdir(parents=True, exist_ok=True)

DUCKDB_PATH = DUCKDB_DIR / "legal_mitra.duckdb"
FAISS_INDEX_PATH = INDICES_DIR / "legal_mitra.index"
FAISS_META_PATH = INDICES_DIR / "legal_mitra_metadata.pkl"

EMBEDDING_DIM = int(os.getenv("LEGAL_MITRA_EMBEDDING_DIM", "384"))
CONFIDENCE_GATE = float(os.getenv("LEGAL_MITRA_CONFIDENCE_GATE", "0.65"))
