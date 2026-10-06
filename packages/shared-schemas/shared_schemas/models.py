from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import Any, Optional

from pydantic import BaseModel, EmailStr, Field, model_validator


class SupportedLanguage(str, Enum):
    EN = "EN"
    HI = "HI"
    MR = "MR"


class LegalCategory(str, Enum):
    RENTAL = "rental"
    FAMILY = "family"
    PROPERTY = "property"
    LABOR = "labor"
    CRIMINAL = "criminal"
    CIVIL = "civil"
    OTHER = "other"


class RiskLevel(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"


class PredictionStatus(str, Enum):
    PREDICTED = "predicted"
    ABSTAINED = "abstained"


class DocumentUploadResponse(BaseModel):
    doc_id: str
    filename: str
    chunks_indexed: int
    status: str


class SummarizeRequest(BaseModel):
    text: str = Field(min_length=20)
    language: SupportedLanguage = SupportedLanguage.EN


class SummarizeResponse(BaseModel):
    summary_bullets: list[str]
    obligations: list[str]
    deadlines: list[str]
    language: SupportedLanguage
    disclaimer: str


class LegalHealthRequest(BaseModel):
    text: str = Field(min_length=20)
    language: SupportedLanguage = SupportedLanguage.EN


class LegalHealthResponse(BaseModel):
    risk_score: float = Field(ge=0.0, le=1.0)
    risk_level: RiskLevel
    risky_clauses: list[str]
    missing_sections: list[str]
    suspicious_phrases: list[str]
    plain_explanation: list[str]


class NoticeVerifyRequest(BaseModel):
    text: str = Field(min_length=20)


class NoticeVerifyResponse(BaseModel):
    fraud_risk_score: float = Field(ge=0.0, le=1.0)
    risk_level: RiskLevel
    reasons: list[str]
    suggested_next_steps: list[str]


class DisputePredictRequest(BaseModel):
    case_type: LegalCategory
    court: str = Field(min_length=2)
    jurisdiction: str = Field(min_length=2)
    evidence_strength: float = Field(ge=0.0, le=1.0)
    opponent_type: str = Field(min_length=2)


class DisputePredictResponse(BaseModel):
    status: PredictionStatus
    win_probability: Optional[float] = Field(default=None, ge=0.0, le=1.0)
    confidence: float = Field(ge=0.0, le=1.0)
    confidence_band: str
    reasons: list[str]
    disclaimer: str


class SpeechAnalyzeRequest(BaseModel):
    transcript: str = Field(min_length=5)
    language: SupportedLanguage = SupportedLanguage.EN


class SpeechAnalyzeResponse(BaseModel):
    detected_intent: str
    legal_category: LegalCategory
    rights_explanation: str
    suggested_actions: list[str]


class QAAskRequest(BaseModel):
    question: str = Field(min_length=3)
    session_id: Optional[str] = None
    top_k: int = Field(default=5, ge=1, le=20)


class EvidenceItem(BaseModel):
    source: str
    score: float
    snippet: str


class QAAskResponse(BaseModel):
    session_id: str
    answer: str
    confidence: float = Field(ge=0.0, le=1.0)
    sources: list[EvidenceItem]


class LawyerProfile(BaseModel):
    lawyer_id: str
    name: str
    city: str
    state: str
    practice_areas: list[str]
    languages: list[str]
    years_experience: int
    fee_range: str
    rating: float
    latitude: Optional[float] = None
    longitude: Optional[float] = None


class LawyerSearchResponse(BaseModel):
    total: int
    lawyers: list[LawyerProfile]


class BookingCreateRequest(BaseModel):
    full_name: str = Field(min_length=2)
    phone: Optional[str] = None
    email: Optional[EmailStr] = None
    city: str = Field(min_length=2)
    state: str = Field(min_length=2)
    legal_category: LegalCategory
    issue_summary: str = Field(min_length=20)
    preferred_language: SupportedLanguage
    budget_range: str = Field(min_length=2)
    preferred_contact_time: str = Field(min_length=2)
    consent_to_contact: bool

    @model_validator(mode="after")
    def validate_contact_and_consent(self) -> "BookingCreateRequest":
        if not self.phone and not self.email:
            raise ValueError("At least one contact method is required: phone or email.")
        if not self.consent_to_contact:
            raise ValueError("consent_to_contact must be true.")
        return self


class BookingResponse(BaseModel):
    booking_id: str
    status: str
    created_at: datetime
    matched_lawyer_ids: list[str]
    message: str


class BookingRecord(BaseModel):
    booking_id: str
    full_name: str
    phone: Optional[str]
    email: Optional[str]
    city: str
    state: str
    legal_category: LegalCategory
    issue_summary: str
    preferred_language: SupportedLanguage
    budget_range: str
    preferred_contact_time: str
    consent_to_contact: bool
    status: str
    matched_lawyer_ids: list[str]
    created_at: datetime


class FraudReportRequest(BaseModel):
    report_text: str = Field(min_length=10)
    phone_number: Optional[str] = None
    email: Optional[str] = None
    city: Optional[str] = None
    channel: str = Field(default="unknown")


class FraudAlert(BaseModel):
    key: str
    count: int
    risk_level: RiskLevel
    sample_signals: list[str]


class FraudAlertsResponse(BaseModel):
    alerts: list[FraudAlert]


class HealthResponse(BaseModel):
    status: str
    indexed_chunks: int
    bookings_count: int
    fraud_reports_count: int


class StatsResponse(BaseModel):
    model_versions: dict[str, str]
    counts: dict[str, int]
    storage: dict[str, str]
    worker: dict[str, Any]
