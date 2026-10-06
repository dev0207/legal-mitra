from __future__ import annotations

import uuid
from pathlib import Path
from typing import Any, Optional

from fastapi import APIRouter, BackgroundTasks, File, HTTPException, Query, UploadFile
from fastapi.responses import FileResponse

from legal_mitra_api.core import bootstrap  # noqa: F401
from legal_mitra_api.services.registry import db, index_store, lawyer_directory, llm

from domain_rules.rules import (
    classify_intent,
    extract_deadlines,
    extract_obligations,
    fake_notice_check,
    generate_fraud_alerts,
    legal_health_check,
    summarise_text,
)
from ml_core.config import DUCKDB_PATH, FAISS_INDEX_PATH, ROOT_DIR, UPLOADS_DIR
from ml_core.documents import chunk_text, file_sha256, read_text_from_file
from ml_core.predictors import dispute_prediction
from ml_core.qa import compose_contextual_answer
from shared_schemas.models import (
    BookingCreateRequest,
    BookingResponse,
    DisputePredictRequest,
    DisputePredictResponse,
    FraudAlertsResponse,
    FraudReportRequest,
    HealthResponse,
    LegalHealthRequest,
    LegalHealthResponse,
    LawyerSearchResponse,
    NoticeVerifyRequest,
    NoticeVerifyResponse,
    QAAskRequest,
    QAAskResponse,
    SpeechAnalyzeRequest,
    SpeechAnalyzeResponse,
    StatsResponse,
    SummarizeRequest,
    SummarizeResponse,
)


router = APIRouter(prefix="/v1")

DISCLAIMER = "This is AI-generated guidance, not a substitute for a qualified lawyer."


def _translate_lines(lines: list[str], language: str) -> list[str]:
    if language == "EN":
        return lines
    return [f"[{language}] {line}" for line in lines]


def _quick_analysis(text: str, language: str = "EN") -> dict[str, Any]:
    """Run all analysis modules on text (used during upload)."""
    summary_data = summarise_text(text, llm=llm)
    health = legal_health_check(text, llm=llm)
    fraud = fake_notice_check(text, llm=llm)

    lang = language.upper()
    return {
        "summary": {
            "summary_bullets": _translate_lines(
                [f"- {x}" for x in summary_data.get("summary_bullets", [])], lang
            ),
            "obligations": _translate_lines(
                summary_data.get("obligations", ["No explicit obligations detected."]), lang
            ),
            "deadlines": _translate_lines(
                summary_data.get("deadlines", ["No explicit deadlines detected."]), lang
            ),
            "language": lang,
            "disclaimer": DISCLAIMER,
        },
        "legal_health": health,
        "notice_verification": fraud,
    }


def _process_upload(doc_id: str, filename: str, save_path: Path, raw: bytes) -> dict[str, Any]:
    text = read_text_from_file(save_path, raw)
    chunks = chunk_text(text)
    inserted = index_store.add_chunks(chunks, source=filename, doc_id=doc_id)
    db.upsert_document(
        doc_id=doc_id,
        filename=filename,
        file_hash=file_sha256(raw),
        chunk_count=inserted,
        extracted_text=text,
    )
    if not text.strip():
        return {
            "doc_id": doc_id,
            "filename": filename,
            "chunks_indexed": inserted,
            "status": "indexed",
            "text_chars": 0,
            "warning": "No extractable text found in PDF. OCR may be required.",
        }
    analysis = _quick_analysis(text, language="EN")
    return {
        "doc_id": doc_id,
        "filename": filename,
        "chunks_indexed": inserted,
        "status": "indexed",
        "text_chars": len(text),
        "text_preview": text[:1500],
        "analysis": analysis,
    }


@router.get("/health", response_model=HealthResponse)
def health() -> HealthResponse:
    return HealthResponse(
        status="ok",
        indexed_chunks=index_store.count,
        bookings_count=db.count_bookings(),
        fraud_reports_count=db.count_fraud_reports(),
    )


@router.get("/stats", response_model=StatsResponse)
def stats() -> StatsResponse:
    llm_status = f"{llm.model} via Ollama" if llm.available else "rule-based fallback (Ollama offline)"
    return StatsResponse(
        model_versions={
            "llm": llm_status,
            "summarizer": f"LLM ({llm.model})" if llm.available else "rule-based extraction",
            "health_check": f"rules + LLM ({llm.model})" if llm.available else "rules only",
            "notice_detector": f"rules + LLM ({llm.model})" if llm.available else "rules + heuristics",
            "predictor": "rule-calibrated heuristic v1",
            "speech": f"LLM ({llm.model})" if llm.available else "keyword classifier",
            "qa_retrieval": "FAISS + hash embeddings → LLM" if llm.available else "FAISS + hash embeddings → template",
        },
        counts={
            "documents": db.count_documents(),
            "indexed_chunks": index_store.count,
            "lawyers": lawyer_directory.count,
            "bookings": db.count_bookings(),
            "fraud_reports": db.count_fraud_reports(),
        },
        storage={
            "duckdb": str(DUCKDB_PATH),
            "faiss": str(FAISS_INDEX_PATH),
            "repo_root": str(ROOT_DIR),
        },
        worker={"mode": "background_tasks", "queue": "duckdb.tasks"},
    )


@router.post("/docs/upload")
async def docs_upload(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    async_mode: bool = Query(default=False),
) -> dict[str, Any]:
    suffix = Path(file.filename).suffix.lower()
    if suffix not in {".pdf", ".txt"}:
        raise HTTPException(status_code=400, detail="Only PDF and TXT files are supported.")

    raw = await file.read()
    doc_id = str(uuid.uuid4())
    save_path = UPLOADS_DIR / f"{doc_id}_{file.filename}"
    save_path.write_bytes(raw)

    if async_mode:
        task_id = db.create_task("docs_upload")

        def _run() -> None:
            try:
                result = _process_upload(doc_id, file.filename, save_path, raw)
                db.update_task(task_id, "COMPLETED", result=result)
            except Exception as exc:  # noqa: BLE001
                db.update_task(task_id, "FAILED", result={"error": str(exc)})

        background_tasks.add_task(_run)
        return {"task_id": task_id, "status": "PENDING", "doc_id": doc_id}

    return _process_upload(doc_id, file.filename, save_path, raw)


@router.get("/tasks/{task_id}")
def task_status(task_id: str) -> dict[str, Any]:
    record = db.get_task(task_id)
    if not record:
        raise HTTPException(status_code=404, detail="Task not found")
    return record


@router.get("/docs/{doc_id}/analysis")
def document_analysis(doc_id: str, language: str = Query(default="EN")) -> dict[str, Any]:
    doc = db.get_document(doc_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    text = (doc.get("extracted_text") or "").strip()
    if not text:
        return {
            "doc_id": doc_id,
            "filename": doc.get("filename"),
            "text_chars": 0,
            "warning": "No extractable text found in PDF. OCR may be required.",
        }
    analysis = _quick_analysis(text, language=language.upper())
    return {
        "doc_id": doc_id,
        "filename": doc.get("filename"),
        "text_chars": len(text),
        "text_preview": text[:1500],
        "analysis": analysis,
    }


@router.post("/summarize", response_model=SummarizeResponse)
def summarize(payload: SummarizeRequest) -> SummarizeResponse:
    result = summarise_text(payload.text, llm=llm)
    lang = payload.language.value
    return SummarizeResponse(
        summary_bullets=_translate_lines(
            [f"- {x}" for x in result.get("summary_bullets", [])], lang
        ),
        obligations=_translate_lines(
            result.get("obligations", ["No explicit obligations detected."]), lang
        ),
        deadlines=_translate_lines(
            result.get("deadlines", ["No explicit deadlines detected."]), lang
        ),
        language=payload.language,
        disclaimer=DISCLAIMER,
    )


@router.post("/legal-health/analyze", response_model=LegalHealthResponse)
def legal_health(payload: LegalHealthRequest) -> LegalHealthResponse:
    result = legal_health_check(payload.text, llm=llm)
    return LegalHealthResponse(**result)


@router.post("/notice/verify", response_model=NoticeVerifyResponse)
def notice_verify(payload: NoticeVerifyRequest) -> NoticeVerifyResponse:
    result = fake_notice_check(payload.text, llm=llm)
    return NoticeVerifyResponse(**result)


@router.post("/dispute/predict", response_model=DisputePredictResponse)
def dispute_predict(payload: DisputePredictRequest):
    return dispute_prediction(
        case_type=payload.case_type.value,
        evidence_strength=payload.evidence_strength,
        opponent_type=payload.opponent_type,
        court=payload.court,
        jurisdiction=payload.jurisdiction,
    )


@router.post("/speech/analyze", response_model=SpeechAnalyzeResponse)
def speech_analyze(payload: SpeechAnalyzeRequest) -> SpeechAnalyzeResponse:
    intent, category, actions, rights = classify_intent(payload.transcript, llm=llm)
    return SpeechAnalyzeResponse(
        detected_intent=intent,
        legal_category=category,
        rights_explanation=rights,
        suggested_actions=actions,
    )


@router.post("/qa/ask", response_model=QAAskResponse)
def qa_ask(payload: QAAskRequest) -> QAAskResponse:
    session_id = payload.session_id or str(uuid.uuid4())
    history = db.get_recent_qa_messages(session_id=session_id)

    hits = index_store.search(payload.question, top_k=payload.top_k)
    answer, conf = compose_contextual_answer(payload.question, hits, history, llm=llm)

    db.add_qa_message(session_id, "user", payload.question)
    db.add_qa_message(session_id, "assistant", answer)

    return QAAskResponse(
        session_id=session_id,
        answer=answer,
        confidence=round(conf, 3),
        sources=[
            {"source": h.source, "score": round(h.score, 3), "snippet": h.snippet}
            for h in hits
        ],
    )


@router.get("/lawyers/search", response_model=LawyerSearchResponse)
def lawyers_search(
    city: Optional[str] = None,
    state: Optional[str] = None,
    practice_area: Optional[str] = None,
    language: Optional[str] = None,
    max_fee: Optional[str] = None,
    limit: int = Query(default=20, ge=1, le=50),
) -> LawyerSearchResponse:
    lawyers = lawyer_directory.search(
        city=city,
        state=state,
        practice_area=practice_area,
        language=language,
        max_fee=max_fee,
        limit=limit,
    )
    return LawyerSearchResponse(total=len(lawyers), lawyers=lawyers)


@router.post("/lawyers/bookings", response_model=BookingResponse)
def create_booking(payload: BookingCreateRequest) -> BookingResponse:
    matches = lawyer_directory.search(
        city=payload.city,
        state=payload.state,
        practice_area=payload.legal_category.value,
        language=payload.preferred_language.value,
        limit=3,
    )
    matched_ids = [item.lawyer_id for item in matches]

    record = db.create_booking(payload.model_dump(), matched_ids)
    return BookingResponse(
        booking_id=record["booking_id"],
        status=record["status"],
        created_at=record["created_at"],
        matched_lawyer_ids=record["matched_lawyer_ids"],
        message="Booking submitted successfully. You can track your request with booking ID.",
    )


@router.get("/lawyers/bookings/{booking_id}")
def track_booking(booking_id: str, phone: Optional[str] = None, email: Optional[str] = None) -> dict[str, Any]:
    booking = db.get_booking(booking_id)
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    if phone or email:
        if phone and booking.get("phone") != phone:
            raise HTTPException(status_code=403, detail="Contact verification failed")
        if email and booking.get("email") != email:
            raise HTTPException(status_code=403, detail="Contact verification failed")

    booking["disclaimer"] = DISCLAIMER
    return booking


@router.get("/admin/lawyer-bookings")
def admin_list_bookings(limit: int = Query(default=100, ge=1, le=500), offset: int = Query(default=0, ge=0)) -> dict[str, Any]:
    records = db.list_bookings(limit=limit, offset=offset)
    return {"total": len(records), "bookings": records, "internal_use_only": True}


@router.get("/admin/lawyer-bookings/export.csv")
def admin_export_bookings() -> FileResponse:
    path = db.export_bookings_csv()
    return FileResponse(path=str(path), media_type="text/csv", filename=path.name)


@router.post("/fraud/report")
def report_fraud(payload: FraudReportRequest) -> dict[str, Any]:
    report_id = db.add_fraud_report(payload.model_dump())
    return {"status": "received", "report_id": report_id}


@router.get("/fraud/alerts", response_model=FraudAlertsResponse)
def fraud_alerts() -> FraudAlertsResponse:
    alerts = generate_fraud_alerts(db.list_fraud_reports())
    return FraudAlertsResponse(alerts=alerts)
