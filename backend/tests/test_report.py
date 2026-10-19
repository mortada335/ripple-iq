"""
Tests for Markdown Report Generation Endpoint
"""

from app.models import AuditLog


def test_generate_and_retrieve_markdown_report(client, db_session):
    # 1. Create demo decision
    decision_payload = {
        "title": "Reduce in-person university attendance from five days to four days per week",
        "description": "Evaluate transition to a 4-day condensed on-campus schedule.",
        "department": "Office of the Provost",
    }
    create_resp = client.post("/api/v1/decisions", json=decision_payload)
    decision_id = create_resp.json()["id"]

    # 2. Attach context
    client.post(
        f"/api/v1/decisions/{decision_id}/context",
        json={"student_population": 28000, "active_laboratories": 85},
    )

    # 3. Request report JSON format
    report_resp = client.get(f"/api/v1/decisions/{decision_id}/report")
    assert report_resp.status_code == 200
    data = report_resp.json()

    assert data["decision_id"] == decision_id
    assert "content_markdown" in data
    assert "checksum" in data
    assert len(data["checksum"]) == 64  # SHA-256 hash length

    md_content = data["content_markdown"]
    assert "# RippleIQ Institutional Decision Memorandum" in md_content
    assert "Reduce in-person university attendance" in md_content
    assert "MANDATORY HUMAN REVIEW REQUIRED" in md_content
    assert "Students" in md_content
    assert "Laboratories" in md_content
    assert "Scenario 1" in md_content
    assert "Scenario 2" in md_content
    assert "Scenario 3" in md_content
    assert "Scenario rationale" in md_content
    assert "Fairness Review Questions" in md_content
    assert "not measured outcomes" in md_content
    assert "MANDATORY HUMAN REVIEW REQUIRED" in md_content

    original_result = client.get(f"/api/v1/decisions/{decision_id}/result").json()
    refinement = client.post(
        f"/api/v1/decisions/{decision_id}/refine",
        json={
            "feedback": "Pilot with commuter students before full rollout.",
            "selected_scenario_number": 3,
        },
    )
    assert refinement.status_code == 200
    assert refinement.json()["original"]["selected_scenario_number"] == 2
    assert refinement.json()["current"]["selected_scenario_number"] == 3
    assert client.get(f"/api/v1/decisions/{decision_id}/result").json() == original_result

    refreshed_report = client.get(f"/api/v1/decisions/{decision_id}/report").json()["content_markdown"]
    assert "Original recommendation preserved" in refreshed_report
    assert "Scenario 2" in refreshed_report
    assert "Human review feedback" in refreshed_report
    assert "Pilot with commuter students" in refreshed_report

    # 4. Request raw markdown via Accept header
    raw_resp = client.get(
        f"/api/v1/decisions/{decision_id}/report",
        headers={"Accept": "text/markdown"},
    )
    assert raw_resp.status_code == 200
    assert raw_resp.headers["content-type"].startswith("text/markdown")
    assert "# RippleIQ Institutional Decision Memorandum" in raw_resp.text
    downloadable = client.get(f"/api/v1/decisions/{decision_id}/report.md")
    assert downloadable.status_code == 200
    assert downloadable.headers["content-disposition"].endswith(f'rippleiq-decision-{decision_id}-report.md"')
    assert db_session.query(AuditLog).filter_by(decision_id=decision_id, action="report.downloaded").count() >= 3
