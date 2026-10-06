from __future__ import annotations

import csv
import json
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Optional

import duckdb

from .config import DUCKDB_PATH, EXPORTS_DIR


class DuckDBStore:
    def __init__(self, db_path: Path = DUCKDB_PATH):
        self.db_path = str(db_path)
        self._init_db()

    def _connect(self):
        return duckdb.connect(self.db_path)

    def _init_db(self) -> None:
        with self._connect() as con:
            con.execute(
                """
                CREATE TABLE IF NOT EXISTS documents (
                    doc_id VARCHAR PRIMARY KEY,
                    filename VARCHAR,
                    file_hash VARCHAR,
                    chunk_count INTEGER,
                    extracted_text TEXT,
                    created_at TIMESTAMP
                )
                """
            )
            # Backward-compatible migration for existing DBs.
            try:
                con.execute("ALTER TABLE documents ADD COLUMN extracted_text TEXT")
            except Exception:
                pass
            con.execute(
                """
                CREATE TABLE IF NOT EXISTS qa_messages (
                    id VARCHAR PRIMARY KEY,
                    session_id VARCHAR,
                    role VARCHAR,
                    content TEXT,
                    created_at TIMESTAMP
                )
                """
            )
            con.execute(
                """
                CREATE TABLE IF NOT EXISTS fraud_reports (
                    id VARCHAR PRIMARY KEY,
                    report_text TEXT,
                    phone_number VARCHAR,
                    email VARCHAR,
                    city VARCHAR,
                    channel VARCHAR,
                    created_at TIMESTAMP
                )
                """
            )
            con.execute(
                """
                CREATE TABLE IF NOT EXISTS bookings (
                    booking_id VARCHAR PRIMARY KEY,
                    payload JSON,
                    status VARCHAR,
                    matched_lawyer_ids JSON,
                    created_at TIMESTAMP
                )
                """
            )
            con.execute(
                """
                CREATE TABLE IF NOT EXISTS tasks (
                    task_id VARCHAR PRIMARY KEY,
                    task_type VARCHAR,
                    status VARCHAR,
                    result JSON,
                    created_at TIMESTAMP,
                    updated_at TIMESTAMP
                )
                """
            )

    @staticmethod
    def _utcnow() -> datetime:
        return datetime.now(timezone.utc)

    def upsert_document(
        self,
        doc_id: str,
        filename: str,
        file_hash: str,
        chunk_count: int,
        extracted_text: str,
    ) -> None:
        with self._connect() as con:
            con.execute(
                """
                INSERT INTO documents (doc_id, filename, file_hash, chunk_count, extracted_text, created_at)
                VALUES (?, ?, ?, ?, ?, ?)
                ON CONFLICT (doc_id) DO UPDATE SET
                    filename = excluded.filename,
                    file_hash = excluded.file_hash,
                    chunk_count = excluded.chunk_count,
                    extracted_text = excluded.extracted_text
                """,
                [doc_id, filename, file_hash, chunk_count, extracted_text, self._utcnow()],
            )

    def get_document(self, doc_id: str) -> Optional[dict[str, Any]]:
        with self._connect() as con:
            row = con.execute(
                """
                SELECT doc_id, filename, file_hash, chunk_count, extracted_text, created_at
                FROM documents
                WHERE doc_id = ?
                """,
                [doc_id],
            ).fetchone()
        if not row:
            return None
        return {
            "doc_id": row[0],
            "filename": row[1],
            "file_hash": row[2],
            "chunk_count": row[3],
            "extracted_text": row[4] or "",
            "created_at": row[5].isoformat() if row[5] else None,
        }

    def count_documents(self) -> int:
        with self._connect() as con:
            return con.execute("SELECT COUNT(*) FROM documents").fetchone()[0]

    def add_qa_message(self, session_id: str, role: str, content: str) -> None:
        with self._connect() as con:
            con.execute(
                "INSERT INTO qa_messages (id, session_id, role, content, created_at) VALUES (?, ?, ?, ?, ?)",
                [str(uuid.uuid4()), session_id, role, content, self._utcnow()],
            )

    def get_recent_qa_messages(self, session_id: str, limit: int = 8) -> list[dict[str, Any]]:
        with self._connect() as con:
            rows = con.execute(
                """
                SELECT role, content, created_at
                FROM qa_messages
                WHERE session_id = ?
                ORDER BY created_at DESC
                LIMIT ?
                """,
                [session_id, limit],
            ).fetchall()
        return [
            {"role": role, "content": content, "created_at": created_at.isoformat() if created_at else None}
            for role, content, created_at in reversed(rows)
        ]

    def add_fraud_report(self, payload: dict[str, Any]) -> str:
        report_id = str(uuid.uuid4())
        with self._connect() as con:
            con.execute(
                """
                INSERT INTO fraud_reports (id, report_text, phone_number, email, city, channel, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?)
                """,
                [
                    report_id,
                    payload.get("report_text"),
                    payload.get("phone_number"),
                    payload.get("email"),
                    payload.get("city"),
                    payload.get("channel"),
                    self._utcnow(),
                ],
            )
        return report_id

    def list_fraud_reports(self) -> list[dict[str, Any]]:
        with self._connect() as con:
            rows = con.execute(
                "SELECT id, report_text, phone_number, email, city, channel, created_at FROM fraud_reports ORDER BY created_at DESC"
            ).fetchall()
        return [
            {
                "id": row[0],
                "report_text": row[1],
                "phone_number": row[2],
                "email": row[3],
                "city": row[4],
                "channel": row[5],
                "created_at": row[6].isoformat() if row[6] else None,
            }
            for row in rows
        ]

    def count_fraud_reports(self) -> int:
        with self._connect() as con:
            return con.execute("SELECT COUNT(*) FROM fraud_reports").fetchone()[0]

    def create_booking(self, payload: dict[str, Any], matched_lawyer_ids: list[str]) -> dict[str, Any]:
        booking_id = str(uuid.uuid4())
        created_at = self._utcnow()
        with self._connect() as con:
            con.execute(
                """
                INSERT INTO bookings (booking_id, payload, status, matched_lawyer_ids, created_at)
                VALUES (?, ?, ?, ?, ?)
                """,
                [
                    booking_id,
                    json.dumps(payload),
                    "submitted",
                    json.dumps(matched_lawyer_ids),
                    created_at,
                ],
            )
        return {
            "booking_id": booking_id,
            "status": "submitted",
            "created_at": created_at,
            "matched_lawyer_ids": matched_lawyer_ids,
        }

    def get_booking(self, booking_id: str) -> Optional[dict[str, Any]]:
        with self._connect() as con:
            row = con.execute(
                "SELECT booking_id, payload, status, matched_lawyer_ids, created_at FROM bookings WHERE booking_id = ?",
                [booking_id],
            ).fetchone()
        if not row:
            return None
        payload = json.loads(row[1]) if row[1] else {}
        return {
            "booking_id": row[0],
            "status": row[2],
            "matched_lawyer_ids": json.loads(row[3]) if row[3] else [],
            "created_at": row[4],
            **payload,
        }

    def list_bookings(self, limit: int = 100, offset: int = 0) -> list[dict[str, Any]]:
        with self._connect() as con:
            rows = con.execute(
                """
                SELECT booking_id, payload, status, matched_lawyer_ids, created_at
                FROM bookings
                ORDER BY created_at DESC
                LIMIT ? OFFSET ?
                """,
                [limit, offset],
            ).fetchall()
        records = []
        for row in rows:
            payload = json.loads(row[1]) if row[1] else {}
            records.append(
                {
                    "booking_id": row[0],
                    "status": row[2],
                    "matched_lawyer_ids": json.loads(row[3]) if row[3] else [],
                    "created_at": row[4],
                    **payload,
                }
            )
        return records

    def export_bookings_csv(self) -> Path:
        path = EXPORTS_DIR / f"lawyer_bookings_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
        rows = self.list_bookings(limit=100000, offset=0)
        fields = [
            "booking_id",
            "full_name",
            "phone",
            "email",
            "city",
            "state",
            "legal_category",
            "preferred_language",
            "budget_range",
            "preferred_contact_time",
            "status",
            "matched_lawyer_ids",
            "created_at",
        ]
        with path.open("w", newline="", encoding="utf-8") as f:
            writer = csv.DictWriter(f, fieldnames=fields)
            writer.writeheader()
            for row in rows:
                out = {k: row.get(k) for k in fields}
                out["matched_lawyer_ids"] = ",".join(row.get("matched_lawyer_ids", []))
                writer.writerow(out)
        return path

    def count_bookings(self) -> int:
        with self._connect() as con:
            return con.execute("SELECT COUNT(*) FROM bookings").fetchone()[0]

    def create_task(self, task_type: str, status: str = "PENDING", result: Optional[dict[str, Any]] = None) -> str:
        task_id = str(uuid.uuid4())
        now = self._utcnow()
        with self._connect() as con:
            con.execute(
                "INSERT INTO tasks (task_id, task_type, status, result, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)",
                [task_id, task_type, status, json.dumps(result or {}), now, now],
            )
        return task_id

    def update_task(self, task_id: str, status: str, result: Optional[dict[str, Any]] = None) -> None:
        with self._connect() as con:
            con.execute(
                "UPDATE tasks SET status = ?, result = ?, updated_at = ? WHERE task_id = ?",
                [status, json.dumps(result or {}), self._utcnow(), task_id],
            )

    def get_task(self, task_id: str) -> Optional[dict[str, Any]]:
        with self._connect() as con:
            row = con.execute(
                "SELECT task_id, task_type, status, result, created_at, updated_at FROM tasks WHERE task_id = ?",
                [task_id],
            ).fetchone()
        if not row:
            return None
        return {
            "task_id": row[0],
            "task_type": row[1],
            "status": row[2],
            "result": json.loads(row[3]) if row[3] else {},
            "created_at": row[4].isoformat() if row[4] else None,
            "updated_at": row[5].isoformat() if row[5] else None,
        }
