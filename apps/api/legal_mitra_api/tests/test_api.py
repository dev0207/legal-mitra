from __future__ import annotations

from fastapi.testclient import TestClient

from legal_mitra_api.main import app


client = TestClient(app)


def test_health_endpoint() -> None:
    resp = client.get("/v1/health")
    assert resp.status_code == 200
    assert resp.json()["status"] == "ok"


def test_predictor_abstains_on_low_confidence() -> None:
    payload = {
        "case_type": "civil",
        "court": "District Court",
        "jurisdiction": "Pune",
        "evidence_strength": 0.2,
        "opponent_type": "Private Company",
    }
    resp = client.post("/v1/dispute/predict", json=payload)
    assert resp.status_code == 200
    body = resp.json()
    assert body["status"] == "abstained"
    assert body["win_probability"] is None


def test_booking_validation_requires_contact() -> None:
    payload = {
        "full_name": "A User",
        "city": "Pune",
        "state": "Maharashtra",
        "legal_category": "rental",
        "issue_summary": "My landlord has not returned my deposit for four months now.",
        "preferred_language": "EN",
        "budget_range": "2000-5000",
        "preferred_contact_time": "Evening",
        "consent_to_contact": True,
    }
    resp = client.post("/v1/lawyers/bookings", json=payload)
    assert resp.status_code == 422


def test_booking_create_and_track() -> None:
    payload = {
        "full_name": "A User",
        "phone": "9999999999",
        "city": "Pune",
        "state": "Maharashtra",
        "legal_category": "rental",
        "issue_summary": "My landlord has not returned my deposit for four months now.",
        "preferred_language": "EN",
        "budget_range": "2000-5000",
        "preferred_contact_time": "Evening",
        "consent_to_contact": True,
    }
    create_resp = client.post("/v1/lawyers/bookings", json=payload)
    assert create_resp.status_code == 200
    booking_id = create_resp.json()["booking_id"]

    track_resp = client.get(f"/v1/lawyers/bookings/{booking_id}?phone=9999999999")
    assert track_resp.status_code == 200
    assert track_resp.json()["booking_id"] == booking_id
