"""
Domain rules — rule-based legal analysis with optional LLM enhancement.

Each function works standalone with regex/heuristics and can be optionally
augmented with LLM results when available.
"""
from __future__ import annotations

import re
from collections import Counter
from typing import TYPE_CHECKING, Optional

from shared_schemas.models import LegalCategory, RiskLevel

if TYPE_CHECKING:
    from ml_core.llm import LLMService


# ── Risk patterns ──

RISK_PATTERNS = {
    "heavy_penalty": re.compile(r"\bpenalt(y|ies)\b|liquidated damages|forfeit", re.IGNORECASE),
    "no_notice": re.compile(r"without notice|immediate termination", re.IGNORECASE),
    "unilateral_change": re.compile(r"sole discretion|may modify at any time", re.IGNORECASE),
    "arbitration_lock": re.compile(r"binding arbitration only|waive.*court", re.IGNORECASE),
}

MISSING_SECTION_PATTERNS = {
    "notice_period": re.compile(r"notice period|prior notice", re.IGNORECASE),
    "dispute_resolution": re.compile(r"dispute resolution|jurisdiction|arbitration", re.IGNORECASE),
    "termination": re.compile(r"termination", re.IGNORECASE),
    "payment_terms": re.compile(r"payment terms|fees|amount payable", re.IGNORECASE),
}

SCAM_PATTERNS = {
    "urgent_threat": re.compile(r"final warning|urgent legal action|immediate arrest", re.IGNORECASE),
    "instant_payment": re.compile(r"pay now|upi|wallet|gift card|crypto", re.IGNORECASE),
    "missing_signature": re.compile(r"without signature|unsigned", re.IGNORECASE),
    "fake_court_format": re.compile(r"suprem court|district cort|legal departmnt", re.IGNORECASE),
}

DEADLINE_PATTERN = re.compile(
    r"(?:within\s+\d+\s+days|by\s+\d{1,2}[/-]\d{1,2}[/-]\d{2,4}|on\s+\d{1,2}\s+[A-Za-z]+\s+\d{4})",
    re.IGNORECASE,
)


# ── Summarization ──

def summarise_text(text: str, llm: Optional["LLMService"] = None) -> dict:
    """
    Summarize legal text. Returns dict with summary_bullets, obligations, deadlines.
    Uses LLM when available; falls back to regex extraction.
    """
    if llm and llm.available:
        result = llm.summarize(text)
        if result and "summary_bullets" in result:
            return {
                "summary_bullets": result.get("summary_bullets", []),
                "obligations": result.get("obligations", []) or _extract_obligations(text),
                "deadlines": result.get("deadlines", []) or _extract_deadlines(text),
            }

    # Fallback: rule-based
    return {
        "summary_bullets": _rule_summarize(text),
        "obligations": _extract_obligations(text) or ["No explicit obligations detected."],
        "deadlines": _extract_deadlines(text) or ["No explicit deadlines detected."],
    }


def _rule_summarize(text: str) -> list[str]:
    lines = [ln.strip() for ln in re.split(r"[\n\r]+", text) if ln.strip()]
    if not lines:
        return ["No meaningful content detected."]
    sentences = re.split(r"(?<=[.!?])\s+", " ".join(lines))
    selected: list[str] = []
    for sentence in sentences:
        s = sentence.strip()
        if 20 <= len(s) <= 200:
            selected.append(s)
        if len(selected) == 6:
            break
    return selected or [lines[0][:200]]


# Keep old function signature for backward compatibility
def extract_obligations(text: str) -> list[str]:
    return _extract_obligations(text)


def extract_deadlines(text: str) -> list[str]:
    return _extract_deadlines(text)


def _extract_obligations(text: str) -> list[str]:
    obligations: list[str] = []
    for sentence in re.split(r"(?<=[.!?])\s+", text):
        s = sentence.strip()
        if re.search(r"\b(must|shall|required to|obliged to)\b", s, re.IGNORECASE):
            obligations.append(s[:220])
    return obligations[:8]


def _extract_deadlines(text: str) -> list[str]:
    return DEADLINE_PATTERN.findall(text)[:8]


# ── Legal Health Check ──

def legal_health_check(text: str, llm: Optional["LLMService"] = None) -> dict:
    """
    Analyze document for risks. LLM enhances explanations when available.
    """
    risky = [name for name, pattern in RISK_PATTERNS.items() if pattern.search(text)]
    missing = [name for name, pattern in MISSING_SECTION_PATTERNS.items() if not pattern.search(text)]

    suspicious_phrases = []
    for pattern in RISK_PATTERNS.values():
        for match in pattern.findall(text):
            suspicious_phrases.append(str(match))

    risk_score = min(1.0, 0.18 * len(risky) + 0.07 * len(missing))

    # Try LLM enhancement for better explanations
    explanation = []
    if llm and llm.available:
        llm_result = llm.health_check(text, risky, missing)
        if llm_result:
            explanation = llm_result.get("plain_explanation", [])
            # Merge any additional risks LLM found
            for extra in llm_result.get("additional_risks", []):
                if extra not in risky:
                    suspicious_phrases.append(extra)
            # Adjust score based on LLM assessment
            llm_level = llm_result.get("risk_level", "").upper()
            if llm_level == "HIGH" and risk_score < 0.7:
                risk_score = max(risk_score, 0.7)
            elif llm_level == "MEDIUM" and risk_score < 0.35:
                risk_score = max(risk_score, 0.35)

    if not explanation:
        explanation = [
            "Potentially one-sided clauses detected." if risky else "No major one-sided clause patterns detected.",
            "Some important legal sections appear missing." if missing else "Core legal sections appear present.",
        ]

    if risk_score >= 0.7:
        risk_level = RiskLevel.HIGH
    elif risk_score >= 0.35:
        risk_level = RiskLevel.MEDIUM
    else:
        risk_level = RiskLevel.LOW

    return {
        "risk_score": round(risk_score, 3),
        "risk_level": risk_level,
        "risky_clauses": risky,
        "missing_sections": missing,
        "suspicious_phrases": suspicious_phrases[:10],
        "plain_explanation": explanation,
    }


# ── Fake Notice Detection ──

def fake_notice_check(text: str, llm: Optional["LLMService"] = None) -> dict:
    """
    Detect fraudulent legal notices. LLM provides deeper analysis when available.
    """
    triggered = [name for name, pattern in SCAM_PATTERNS.items() if pattern.search(text)]
    score = min(1.0, 0.22 * len(triggered))

    if re.search(r"advocate", text, re.IGNORECASE) and re.search(r"enrolment", text, re.IGNORECASE):
        score = max(0.0, score - 0.15)

    reasons = [f"Signal detected: {item}" for item in triggered] or ["No strong fraud pattern detected."]

    # LLM enhancement
    if llm and llm.available:
        llm_result = llm.verify_notice(text, triggered)
        if llm_result:
            if llm_result.get("reasons"):
                reasons = llm_result["reasons"]
            llm_prob = llm_result.get("fraud_probability")
            if llm_prob is not None:
                # Blend rule score with LLM probability
                score = (score + float(llm_prob)) / 2
            verdict = llm_result.get("verdict")
            if verdict:
                reasons.insert(0, verdict)

    if score >= 0.65:
        level = RiskLevel.HIGH
    elif score >= 0.35:
        level = RiskLevel.MEDIUM
    else:
        level = RiskLevel.LOW

    next_steps = [
        "Verify advocate enrollment number with Bar Council records.",
        "Cross-check case reference on official court portals.",
        "Do not make urgent payment before legal verification.",
    ]

    return {
        "fraud_risk_score": round(score, 3),
        "risk_level": level,
        "reasons": reasons,
        "suggested_next_steps": next_steps,
    }


# ── Speech Intent Classification ──

def classify_intent(
    transcript: str, llm: Optional["LLMService"] = None
) -> tuple[str, LegalCategory, list[str], str]:
    """
    Classify user intent from transcript. LLM provides richer classification.
    """
    # Try LLM first
    if llm and llm.available:
        result = llm.classify_speech_intent(transcript)
        if result:
            cat_str = result.get("legal_category", "other").lower()
            try:
                category = LegalCategory(cat_str)
            except ValueError:
                category = LegalCategory.OTHER
            return (
                result.get("detected_intent", "General legal guidance request"),
                category,
                result.get("suggested_actions", ["Consult a lawyer."]),
                result.get("rights_explanation", "You have the right to seek legal counsel."),
            )

    # Fallback: rule-based classification
    text = transcript.lower()

    mapping = {
        LegalCategory.RENTAL: ["landlord", "rent", "deposit", "tenant"],
        LegalCategory.FAMILY: ["divorce", "maintenance", "custody", "marriage"],
        LegalCategory.PROPERTY: ["property", "registry", "sale deed", "land"],
        LegalCategory.LABOR: ["labor", "salary", "termination", "employment", "company"],
        LegalCategory.CRIMINAL: ["fir", "police", "arrest", "threat"],
        LegalCategory.CIVIL: ["notice", "agreement", "dispute", "compensation"],
    }

    category = LegalCategory.OTHER
    for cat, keys in mapping.items():
        if any(k in text for k in keys):
            category = cat
            break

    if category == LegalCategory.RENTAL:
        intent = "Rental deposit or tenancy dispute"
        rights = "Tenants generally have rights around deposit return, notice period, and lawful eviction process."
        actions = ["Collect rent agreement and payment proofs.", "Send written notice requesting refund.", "Approach local rent authority if unresolved."]
    elif category == LegalCategory.CRIMINAL:
        intent = "Potential criminal complaint"
        rights = "You may file or follow up on FIR status and seek legal representation for immediate protection."
        actions = ["Preserve evidence and communication records.", "Record FIR/complaint number.", "Consult criminal lawyer urgently."]
    else:
        intent = "General legal guidance request"
        rights = "You are entitled to seek legal explanation and document review before responding to notices."
        actions = ["Gather relevant documents.", "Create timeline of events.", "Consult a specialized lawyer if risk is high."]

    return intent, category, actions, rights


# ── Fraud Alerts (unchanged — no LLM needed) ──

def generate_fraud_alerts(rows: list[dict]) -> list[dict]:
    buckets: dict[str, list[dict]] = {}
    for row in rows:
        key = row.get("phone_number") or row.get("email") or "anonymous"
        buckets.setdefault(key, []).append(row)

    alerts: list[dict] = []
    for key, items in buckets.items():
        if len(items) < 2:
            continue

        counter = Counter()
        for item in items:
            text = (item.get("report_text") or "").lower()
            for token in ["upi", "arrest", "urgent", "court", "payment"]:
                if token in text:
                    counter[token] += 1

        risk = RiskLevel.HIGH if len(items) >= 5 else RiskLevel.MEDIUM
        alerts.append(
            {
                "key": key,
                "count": len(items),
                "risk_level": risk,
                "sample_signals": [sig for sig, _ in counter.most_common(3)],
            }
        )

    return sorted(alerts, key=lambda x: x["count"], reverse=True)
