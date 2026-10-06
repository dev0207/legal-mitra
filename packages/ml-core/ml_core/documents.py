from __future__ import annotations

import hashlib
import re
from pathlib import Path


def file_sha256(raw: bytes) -> str:
    return hashlib.sha256(raw).hexdigest()


def read_text_from_file(path: Path, raw: bytes) -> str:
    suffix = path.suffix.lower()
    if suffix == ".txt":
        return raw.decode("utf-8", errors="replace")
    if suffix == ".pdf":
        try:
            from pypdf import PdfReader
        except Exception as exc:  # noqa: BLE001
            raise RuntimeError("PDF support requires 'pypdf'. Install dependencies first.") from exc
        reader = PdfReader(str(path))
        pages = [page.extract_text() or "" for page in reader.pages]
        text = "\n\n".join(pages).strip()
        if text:
            return text
        # Fallback for PDFs where pypdf extraction is weak.
        try:
            import fitz  # PyMuPDF

            doc = fitz.open(str(path))
            fallback_pages = [page.get_text("text") or "" for page in doc]
            doc.close()
            return "\n\n".join(fallback_pages)
        except Exception:
            return ""
    raise ValueError(f"Unsupported file type: {suffix}")


def chunk_text(text: str, chunk_size: int = 1000, overlap: int = 200) -> list[str]:
    normalised = re.sub(r"\s+", " ", text).strip()
    if not normalised:
        return []

    chunks: list[str] = []
    start = 0
    n = len(normalised)
    while start < n:
        end = min(n, start + chunk_size)
        chunks.append(normalised[start:end])
        if end == n:
            break
        start = max(0, end - overlap)
    return chunks
