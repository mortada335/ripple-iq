def test_knowledge_submission_requires_consent_and_can_be_reviewed(client):
    payload = {
        "scenario_key": "university-four-day-campus-week",
        "contributor_role": "campus transport planner",
        "answers": {
            "affected_groups": "Commuter students and shuttle staff",
            "observed_effects": "Peak demand may shift to four days",
        },
        "source_name": "Aggregate shuttle counts",
        "source_date": "2026-09-01",
        "consent_to_review": True,
    }

    created = client.post("/api/v1/knowledge-submissions", json=payload)
    assert created.status_code == 201
    submission = created.json()
    assert submission["status"] == "pending"
    assert submission["scenario_key"] == payload["scenario_key"]

    queue = client.get("/api/v1/knowledge-submissions")
    assert queue.status_code == 200
    assert queue.json()[0]["answers"] == payload["answers"]
    assert queue.json()[0]["source_name"] == payload["source_name"]

    reviewed = client.patch(f"/api/v1/knowledge-submissions/{submission['id']}", json={"status": "approved"})
    assert reviewed.status_code == 200
    assert reviewed.json()["status"] == "approved"


def test_knowledge_submission_requires_explicit_consent(client):
    response = client.post(
        "/api/v1/knowledge-submissions",
        json={
            "scenario_key": "university-four-day-campus-week",
            "contributor_role": "faculty",
            "answers": {"effects": "Schedule changes may affect office hours."},
            "consent_to_review": False,
        },
    )
    assert response.status_code == 422
