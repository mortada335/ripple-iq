"""
Tests for Markdown Report Generation Endpoint
"""

def test_generate_and_retrieve_markdown_report(client):
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

    # 4. Request raw markdown via Accept header
    raw_resp = client.get(
        f"/api/v1/decisions/{decision_id}/report",
        headers={"Accept": "text/markdown"},
    )
    assert raw_resp.status_code == 200
    assert raw_resp.headers["content-type"].startswith("text/markdown")
    assert "# RippleIQ Institutional Decision Memorandum" in raw_resp.text
