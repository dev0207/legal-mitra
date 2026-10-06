from __future__ import annotations

from shared_schemas.models import DisputePredictResponse, PredictionStatus

from .config import CONFIDENCE_GATE


def dispute_prediction(
    case_type: str,
    evidence_strength: float,
    opponent_type: str,
    court: str,
    jurisdiction: str,
) -> DisputePredictResponse:
    base = 0.45

    if case_type in {"rental", "labor", "civil"}:
        base += 0.05
    if "government" in opponent_type.lower():
        base -= 0.08
    if "supreme" in court.lower() or "high" in court.lower():
        base -= 0.04

    score = max(0.0, min(1.0, base + (evidence_strength - 0.5) * 0.7))
    confidence = max(0.2, min(0.95, 0.35 + evidence_strength * 0.6))

    if confidence < CONFIDENCE_GATE:
        return DisputePredictResponse(
            status=PredictionStatus.ABSTAINED,
            win_probability=None,
            confidence=round(confidence, 3),
            confidence_band="low",
            reasons=[
                "Available case inputs are insufficient for a reliable prediction.",
                f"Jurisdiction considered: {jurisdiction}",
            ],
            disclaimer="This is AI-generated guidance, not legal advice.",
        )

    band = "high" if confidence >= 0.8 else "medium"
    return DisputePredictResponse(
        status=PredictionStatus.PREDICTED,
        win_probability=round(score, 3),
        confidence=round(confidence, 3),
        confidence_band=band,
        reasons=[
            f"Evidence strength contributed significantly ({evidence_strength:.2f}).",
            f"Opponent profile ({opponent_type}) and forum ({court}) were factored.",
        ],
        disclaimer="This is AI-generated guidance, not legal advice.",
    )
