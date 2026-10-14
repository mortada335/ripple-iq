"""Exercise the full MVP decision-support flow through the HTTP API."""


def test_registration_to_markdown_report_flow(client):
    registered = client.post(
        "/api/v1/auth/register",
        json={
            "email": "integration.analyst@example.edu",
            "full_name": "Integration Analyst",
            "password": "integration-test-passphrase",
        },
    )
    assert registered.status_code == 201

    login = client.post(
        "/api/v1/auth/login",
        json={"email": "integration.analyst@example.edu", "password": "integration-test-passphrase"},
    )
    assert login.status_code == 200
    client.headers["Authorization"] = f"Bearer {login.json()['access_token']}"

    organization = client.post("/api/v1/organizations", json={"name": "Integration University"})
    assert organization.status_code == 201

    decision = client.post(
        "/api/v1/decisions",
        json={
            "title": "Reduce in-person attendance to four days",
            "description": "Evaluate a four-day in-person university schedule with a limited pilot.",
            "decision_type": "attendance",
        },
    )
    assert decision.status_code == 201
    decision_id = decision.json()["id"]

    context = client.post(
        f"/api/v1/decisions/{decision_id}/context",
        json={
            "student_population": 18000,
            "active_laboratories": 24,
            "transit_dependency_rate": 55.0,
            "key_assumptions": ["Laboratory access remains available during any pilot."],
        },
    )
    assert context.status_code == 200

    simulation = client.post(f"/api/v1/decisions/{decision_id}/simulate")
    assert simulation.status_code == 200
    assert simulation.json()["analysis_status"] == "completed"

    result = client.get(f"/api/v1/decisions/{decision_id}/result")
    assert result.status_code == 200
    assert result.json()["human_review_required"] is True
    assert result.json()["schema_version"] == "0.1.0"
    assert len(result.json()["scenarios"]) == 3

    report = client.get(f"/api/v1/decisions/{decision_id}/report.md")
    assert report.status_code == 200
    assert report.headers["content-type"].startswith("text/markdown")
    assert "Reduce in-person attendance to four days" in report.text
    assert "Fairness Review Questions" in report.text
    assert "MANDATORY HUMAN REVIEW REQUIRED" in report.text
