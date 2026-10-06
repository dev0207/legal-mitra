from __future__ import annotations

import csv
from pathlib import Path
from typing import Optional

from shared_schemas.models import LawyerProfile

from .config import ROOT_DIR

LAWYERS_DATA_PATH = ROOT_DIR / "datasets" / "raw" / "lawyers" / "lawyers_v1.csv"


class LawyerDirectory:
    def __init__(self, path: Path = LAWYERS_DATA_PATH):
        self.path = path
        self._cache: list[LawyerProfile] = []
        self._load()

    def _load(self) -> None:
        if not self.path.exists():
            self._cache = []
            return

        rows: list[LawyerProfile] = []
        with self.path.open("r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                lat = row.get("latitude")
                lng = row.get("longitude")
                rows.append(
                    LawyerProfile(
                        lawyer_id=row["lawyer_id"],
                        name=row["name"],
                        city=row["city"],
                        state=row["state"],
                        practice_areas=[x.strip() for x in row["practice_areas"].split("|") if x.strip()],
                        languages=[x.strip().upper() for x in row["languages"].split("|") if x.strip()],
                        years_experience=int(row["years_experience"]),
                        fee_range=row["fee_range"],
                        rating=float(row["rating"]),
                        latitude=float(lat) if lat else None,
                        longitude=float(lng) if lng else None,
                    )
                )
        self._cache = rows

    @property
    def count(self) -> int:
        return len(self._cache)

    def search(
        self,
        city: Optional[str] = None,
        state: Optional[str] = None,
        practice_area: Optional[str] = None,
        language: Optional[str] = None,
        max_fee: Optional[str] = None,
        limit: int = 20,
    ) -> list[LawyerProfile]:
        city = (city or "").strip().lower()
        state = (state or "").strip().lower()
        practice_area = (practice_area or "").strip().lower()
        language = (language or "").strip().upper()

        scored: list[tuple[float, LawyerProfile]] = []
        for lawyer in self._cache:
            score = 0.0
            if city and lawyer.city.lower() == city:
                score += 0.35
            if state and lawyer.state.lower() == state:
                score += 0.2
            if practice_area and any(practice_area in area.lower() for area in lawyer.practice_areas):
                score += 0.3
            if language and language in lawyer.languages:
                score += 0.25

            score += min(0.2, lawyer.years_experience / 100.0)
            score += min(0.2, lawyer.rating / 25.0)

            if max_fee and max_fee.lower() not in lawyer.fee_range.lower():
                score -= 0.1

            scored.append((score, lawyer))

        scored.sort(key=lambda x: x[0], reverse=True)
        return [lawyer for _, lawyer in scored[:limit]]
