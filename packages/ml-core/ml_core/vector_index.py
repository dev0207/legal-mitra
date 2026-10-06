from __future__ import annotations

import pickle
import re
from dataclasses import dataclass
from pathlib import Path
from typing import Optional

import numpy as np

from .config import EMBEDDING_DIM, FAISS_INDEX_PATH, FAISS_META_PATH

try:
    import faiss  # type: ignore
    _FAISS_AVAILABLE = True
except Exception:  # noqa: BLE001
    faiss = None  # type: ignore
    _FAISS_AVAILABLE = False


@dataclass
class SearchHit:
    chunk_id: str
    source: str
    score: float
    snippet: str


class HashEmbeddingService:
    """Lightweight multilingual-safe hashing embeddings for local-first setup."""

    def __init__(self, dim: int = EMBEDDING_DIM):
        self.dim = dim

    def encode(self, texts: list[str]) -> np.ndarray:
        vecs = np.zeros((len(texts), self.dim), dtype=np.float32)
        for i, text in enumerate(texts):
            tokens = re.findall(r"\w+", text.lower())
            if not tokens:
                continue
            for token in tokens:
                idx = hash(token) % self.dim
                vecs[i, idx] += 1.0
            norm = np.linalg.norm(vecs[i])
            if norm > 0:
                vecs[i] = vecs[i] / norm
        return vecs


class FaissIndexStore:
    def __init__(self, index_path: Path = FAISS_INDEX_PATH, meta_path: Path = FAISS_META_PATH):
        self.index_path = Path(index_path)
        self.meta_path = Path(meta_path)
        self.embedder = HashEmbeddingService()
        self._emb_matrix: Optional[np.ndarray] = None

        if _FAISS_AVAILABLE:
            if self.index_path.exists():
                self.index = faiss.read_index(str(self.index_path))
            else:
                self.index = faiss.IndexFlatIP(EMBEDDING_DIM)
        else:
            self.index = None

        if self.meta_path.exists():
            with self.meta_path.open("rb") as f:
                self.metadata = pickle.load(f)
        else:
            self.metadata = []

        if not _FAISS_AVAILABLE:
            self._rebuild_numpy_matrix()

    @property
    def count(self) -> int:
        if _FAISS_AVAILABLE and self.index is not None:
            return int(self.index.ntotal)
        return len(self.metadata)

    def _rebuild_numpy_matrix(self) -> None:
        if not self.metadata:
            self._emb_matrix = np.zeros((0, EMBEDDING_DIM), dtype=np.float32)
            return
        texts = [item["text"] for item in self.metadata]
        self._emb_matrix = self.embedder.encode(texts)

    def save(self) -> None:
        if _FAISS_AVAILABLE and self.index is not None:
            faiss.write_index(self.index, str(self.index_path))
        with self.meta_path.open("wb") as f:
            pickle.dump(self.metadata, f)

    def add_chunks(self, chunks: list[str], source: str, doc_id: str) -> int:
        if not chunks:
            return 0

        emb = self.embedder.encode(chunks)
        if _FAISS_AVAILABLE and self.index is not None:
            self.index.add(emb)
        for idx, chunk in enumerate(chunks):
            self.metadata.append(
                {
                    "chunk_id": f"{doc_id}_chunk_{idx}",
                    "doc_id": doc_id,
                    "source": source,
                    "text": chunk,
                }
            )
        if not _FAISS_AVAILABLE:
            if self._emb_matrix is None or self._emb_matrix.shape[0] == 0:
                self._emb_matrix = emb
            else:
                self._emb_matrix = np.vstack([self._emb_matrix, emb])
        self.save()
        return len(chunks)

    def search(self, query: str, top_k: int = 5) -> list[SearchHit]:
        if self.count == 0:
            return []

        q_vec = self.embedder.encode([query])
        if _FAISS_AVAILABLE and self.index is not None:
            scores, indices = self.index.search(q_vec, min(top_k, self.count))
        else:
            if self._emb_matrix is None:
                self._rebuild_numpy_matrix()
            assert self._emb_matrix is not None
            sims = (self._emb_matrix @ q_vec[0]).astype(np.float32)
            order = np.argsort(-sims)[: min(top_k, len(sims))]
            scores = np.array([sims[order]], dtype=np.float32)
            indices = np.array([order], dtype=np.int64)

        hits: list[SearchHit] = []
        for score, idx in zip(scores[0], indices[0]):
            if idx < 0:
                continue
            meta = self.metadata[idx]
            hits.append(
                SearchHit(
                    chunk_id=meta["chunk_id"],
                    source=meta["source"],
                    score=float(max(0.0, min(1.0, score))),
                    snippet=meta["text"][:260],
                )
            )
        return hits
