from app.models import OrganizationMember, User
from app.services import rate_limiting
from app.services.rate_limiting import RateLimitRule, enforce_limits
from fastapi import HTTPException
from fastapi.testclient import TestClient
from sqlalchemy.exc import OperationalError

from ai.provider import DeterministicMockProvider


def test_fixed_window_allows_limit_then_returns_standard_429_and_retry_after(client, monkeypatch):
    from app.config import settings

    monkeypatch.setattr(settings, "RATE_LIMIT_LOGIN_IP_MAX", 100)
    monkeypatch.setattr(settings, "RATE_LIMIT_LOGIN_ACCOUNT_IP_MAX", 1)
    first = client.post(
        "/api/v1/auth/login",
        json={"email": "owner@example.edu", "password": "wrong-password"},
    )
    assert first.status_code == 401

    limited = client.post(
        "/api/v1/auth/login",
        json={"email": "OWNER@example.edu", "password": "wrong-password"},
    )
    assert limited.status_code == 429
    assert limited.json()["error"]["code"] == "RATE_LIMIT_EXCEEDED"
    assert limited.json()["error"]["message"] == "Too many requests. Try again later."
    assert 1 <= int(limited.headers["retry-after"]) <= settings.RATE_LIMIT_LOGIN_WINDOW_SECONDS


def test_login_identity_limit_is_paired_with_ip_and_does_not_lock_account(client, monkeypatch):
    from app.config import settings

    monkeypatch.setattr(settings, "RATE_LIMIT_LOGIN_IP_MAX", 100)
    monkeypatch.setattr(settings, "RATE_LIMIT_LOGIN_ACCOUNT_IP_MAX", 1)
    client.client = ("192.0.2.10", 5000)
    first = client.post(
        "/api/v1/auth/login",
        json={"email": "owner@example.edu", "password": "wrong-password"},
    )
    assert first.status_code == 401

    with TestClient(client.app, client=("192.0.2.11", 5000)) as other_ip_client:
        second_ip = other_ip_client.post(
            "/api/v1/auth/login",
            json={"email": "owner@example.edu", "password": "test-fixture-password"},
        )
    assert second_ip.status_code == 200


def test_registration_limit_ignores_untrusted_forwarded_ip(client, monkeypatch):
    from app.config import settings

    monkeypatch.setattr(settings, "RATE_LIMIT_REGISTER_IP_MAX", 1)
    monkeypatch.setattr(settings, "RATE_LIMIT_REGISTER_WINDOW_SECONDS", 3600)
    payload = {"email": "first@example.edu", "full_name": "First User", "password": "strong-password-123"}
    first = client.post("/api/v1/auth/register", json=payload)
    assert first.status_code == 201

    second = client.post(
        "/api/v1/auth/register",
        json={"email": "second@example.edu", "full_name": "Second User", "password": "strong-password-123"},
        headers={"X-Forwarded-For": "203.0.113.200"},
    )
    assert second.status_code == 429
    assert second.headers["retry-after"]


def test_analysis_is_limited_per_user_and_authorization_runs_before_limiter(client, db_session, monkeypatch):
    from app.config import settings

    monkeypatch.setattr(settings, "RATE_LIMIT_ANALYSIS_USER_MAX", 1)
    monkeypatch.setattr(settings, "RATE_LIMIT_ANALYSIS_IP_MAX", 100)
    created = client.post(
        "/api/v1/decisions",
        json={"title": "Review schedule", "description": "Compare schedule options."},
    )
    decision_id = created.json()["id"]
    assert client.post(f"/api/v1/decisions/{decision_id}/simulate").status_code == 200

    limited = client.post(f"/api/v1/decisions/{decision_id}/simulate")
    assert limited.status_code == 429
    assert limited.json()["error"]["code"] == "RATE_LIMIT_EXCEEDED"

    owner = db_session.query(User).filter_by(email="owner@example.edu").one()
    membership = db_session.query(OrganizationMember).filter_by(user_id=owner.id).one()
    membership.role = "viewer"
    db_session.commit()
    forbidden = client.post(f"/api/v1/decisions/{decision_id}/simulate")
    assert forbidden.status_code == 403
    assert forbidden.json()["error"]["code"] == "INSUFFICIENT_ROLE"


def test_user_scoped_rules_are_isolated(db_session):
    user_one = RateLimitRule("analysis.user", "1", 1, 3600)
    user_two = RateLimitRule("analysis.user", "2", 1, 3600)
    enforce_limits(db_session, [user_one])
    enforce_limits(db_session, [user_two])
    try:
        enforce_limits(db_session, [user_one])
    except HTTPException as error:
        assert error.status_code == 429
    else:
        raise AssertionError("the exhausted user bucket should be limited")


def test_document_limit_applies_after_organization_access(client, monkeypatch):
    from app.config import settings

    monkeypatch.setattr(settings, "RATE_LIMIT_DOCUMENT_USER_MAX", 1)
    created = client.post(
        "/api/v1/decisions",
        json={"title": "Review a policy", "description": "Extract policy text."},
    )
    url = f"/api/v1/decisions/{created.json()['id']}/documents/extract"
    params = {"source_document_id": "source", "source_version": "v1", "filename": "policy.pdf"}
    first = client.post(url, params=params, content=b"not a pdf", headers={"Content-Type": "application/pdf"})
    assert first.status_code == 422
    second = client.post(url, params=params, content=b"not a pdf", headers={"Content-Type": "application/pdf"})
    assert second.status_code == 429


def test_voice_transcription_limit_is_enforced_without_external_provider(client, monkeypatch):
    from app.config import settings

    monkeypatch.setattr(settings, "RATE_LIMIT_VOICE_USER_MAX", 1)
    monkeypatch.setattr(
        "app.api.endpoints.transcribe_audio",
        lambda *_args, **_kwargs: {"transcript": "test transcript", "provider": "test", "model": "test"},
    )
    headers = {"Content-Type": "audio/webm"}
    first = client.post("/api/v1/voice/transcribe", content=b"test audio", headers=headers)
    assert first.status_code == 200
    second = client.post("/api/v1/voice/transcribe", content=b"test audio", headers=headers)
    assert second.status_code == 429


def test_rate_limit_storage_failure_fails_closed(client, monkeypatch):
    from app.config import settings

    monkeypatch.setattr(settings, "RATE_LIMIT_LOGIN_IP_MAX", 100)

    def unavailable(*_args, **_kwargs):
        raise OperationalError("statement", {}, RuntimeError("private database details"))

    monkeypatch.setattr(rate_limiting, "_consume_rule", unavailable)
    response = client.post(
        "/api/v1/auth/login",
        json={"email": "owner@example.edu", "password": "wrong-password"},
    )
    assert response.status_code == 503
    assert response.json()["error"]["code"] == "RATE_LIMIT_UNAVAILABLE"
    assert response.headers["retry-after"] == "5"
    assert "private database details" not in response.text


def test_retry_route_has_separate_policy(client, monkeypatch):
    from app.config import settings
    from app.services import simulation_service

    monkeypatch.setattr(settings, "RATE_LIMIT_RETRY_USER_MAX", 1)
    created = client.post(
        "/api/v1/decisions",
        json={"title": "Review advising", "description": "Review student support."},
    )
    decision_id = created.json()["id"]

    class FailingAnalyzer:
        def analyze(self, *_args, **_kwargs):
            raise RuntimeError("expected test failure")

    monkeypatch.setattr(simulation_service, "default_analyzer", FailingAnalyzer())
    assert client.post(f"/api/v1/decisions/{decision_id}/simulate").status_code == 500
    monkeypatch.setattr(simulation_service, "default_analyzer", DeterministicMockProvider())

    first = client.post(f"/api/v1/decisions/{decision_id}/analysis/retry")
    assert first.status_code == 200
    second = client.post(f"/api/v1/decisions/{decision_id}/analysis/retry")
    assert second.status_code == 429
