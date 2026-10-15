from datetime import UTC, datetime

import pytest
from app.models import Decision, Organization, OrganizationMember, User
from app.security.tokens import create_access_token
from app.services.document_processing import ExtractedDocument, ExtractedPage


def test_document_extract_checks_decision_scope_and_returns_provenance(client, db_session, monkeypatch):
    created = client.post(
        "/api/v1/decisions",
        json={"title": "Review attendance policy", "description": "Review documents for schedule impact."},
    )
    decision_id = created.json()["id"]
    called = {}

    def extract(content, **kwargs):
        called["content"] = content
        called["kwargs"] = kwargs
        return ExtractedDocument(
            source_document_id=kwargs["source_document_id"],
            organization_id=kwargs["organization_id"],
            source_version=kwargs["source_version"],
            source_name=kwargs["source_name"],
            extracted_at=datetime.now(UTC),
            pages=(ExtractedPage(1, "Extracted policy text", "pymupdf"),),
        )

    monkeypatch.setattr("app.api.endpoints.process_document", extract)
    response = client.post(
        f"/api/v1/decisions/{decision_id}/documents/extract",
        params={"source_document_id": "policy-1", "source_version": "v2", "filename": "policy.pdf"},
        content=b"pdf bytes",
        headers={"Content-Type": "application/pdf"},
    )
    assert response.status_code == 200, response.text
    payload = response.json()
    assert payload["source_document_id"] == "policy-1"
    assert payload["source_version"] == "v2"
    assert payload["pages"][0]["page_number"] == 1
    assert payload["pages"][0]["text"] == "Extracted policy text"
    assert payload["human_verification_required"] is True
    assert called["content"] == b"pdf bytes"
    decision = db_session.get(Decision, decision_id)
    assert called["kwargs"]["organization_id"] == decision.organization_id


def test_document_extract_hides_foreign_decisions(client, db_session, monkeypatch):
    created = client.post(
        "/api/v1/decisions",
        json={"title": "Review attendance policy", "description": "Review documents for schedule impact."},
    )
    other_org = Organization(name="Other University", slug="other-university")
    other_user = User(email="other@example.edu", full_name="Other User", password_hash="unused")
    db_session.add_all([other_org, other_user])
    db_session.flush()
    db_session.add(OrganizationMember(organization_id=other_org.id, user_id=other_user.id, role="owner"))
    foreign_decision = Decision(
        organization_id=other_org.id,
        created_by_user_id=other_user.id,
        title="Foreign decision",
        description="Private decision document processing.",
        decision_type="other",
    )
    db_session.add(foreign_decision)
    db_session.commit()
    client.headers["Authorization"] = f"Bearer {create_access_token(other_user.id)}"
    monkeypatch.setattr("app.api.endpoints.process_document", lambda *_args, **_kwargs: AssertionError("must not run"))
    response = client.post(
        f"/api/v1/decisions/{created.json()['id']}/documents/extract",
        params={"source_document_id": "foreign", "source_version": "1", "filename": "private.pdf"},
        content=b"private bytes",
    )
    assert response.status_code == 404
    assert response.json()["error"]["code"] == "DECISION_NOT_FOUND"


def test_ai_status_does_not_expose_credentials(client, monkeypatch):
    from app.config import settings

    monkeypatch.setattr(settings, "LLM_PRIMARY_API_KEY", "secret-test-value")
    response = client.get("/api/v1/ai/status")
    assert response.status_code == 200
    assert "secret-test-value" not in response.text
    assert response.json()["note"].startswith("Configuration status only")


def test_real_local_digital_pdf_extraction_through_api(client):
    fitz = pytest.importorskip("pymupdf")
    created = client.post(
        "/api/v1/decisions",
        json={"title": "Review attendance policy", "description": "Review documents for schedule impact."},
    )
    document = fitz.open()
    page = document.new_page()
    page.insert_text(
        (72, 72),
        "RippleIQ local PDF extraction test. The source text must remain traceable to this page.",
    )
    pdf_bytes = document.tobytes()
    document.close()
    response = client.post(
        f"/api/v1/decisions/{created.json()['id']}/documents/extract",
        params={"source_document_id": "local-pdf-check", "source_version": "test-1", "filename": "policy.pdf"},
        content=pdf_bytes,
        headers={"Content-Type": "application/pdf"},
    )
    assert response.status_code == 200, response.text
    result = response.json()
    assert result["pages"][0]["backend"] == "pymupdf"
    assert "traceable to this page" in result["pages"][0]["text"]
    assert result["human_verification_required"] is True
