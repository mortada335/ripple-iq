"""
Tests for Decision CRUD and Context Attachment Endpoints
"""


def test_create_decision_success(client):
    payload = {
        "title": "Reduce in-person university attendance from five days to four days per week",
        "description": "Evaluate transition to 4-day condensed on-campus schedule with Fridays asynchronous.",
        "department": "Office of the Provost",
        "time_horizon": "1 Academic Year",
        "priority": "HIGH",
    }
    response = client.post("/api/v1/decisions", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["id"] > 0
    assert data["title"] == payload["title"]
    assert data["status"] == "DRAFT"
    assert data["context_attached"] is False
    assert data["simulation_ready"] is False


def test_create_decision_validation_failure(client):
    # Missing required title
    response = client.post("/api/v1/decisions", json={"description": "Short description"})
    assert response.status_code == 422
    data = response.json()
    assert "error" in data
    assert data["error"]["code"] == "VALIDATION_ERROR"


def test_get_decision_by_id(client):
    # 1. Create decision
    create_resp = client.post(
        "/api/v1/decisions",
        json={
            "title": "Test Decision for Retrieval",
            "description": "Comprehensive description for retrieval testing purposes.",
        },
    )
    decision_id = create_resp.json()["id"]

    # 2. Retrieve decision
    get_resp = client.get(f"/api/v1/decisions/{decision_id}")
    assert get_resp.status_code == 200
    assert get_resp.json()["id"] == decision_id


def test_get_nonexistent_decision_returns_404(client):
    response = client.get("/api/v1/decisions/99999")
    assert response.status_code == 404
    data = response.json()
    assert "error" in data
    assert data["error"]["code"] == "DECISION_NOT_FOUND"


def test_attach_context_data(client):
    # 1. Create decision
    create_resp = client.post(
        "/api/v1/decisions",
        json={
            "title": "Decision with Context Data",
            "description": "Testing attaching student and lab context.",
        },
    )
    decision_id = create_resp.json()["id"]

    # 2. Attach context
    context_payload = {
        "student_population": 28000,
        "faculty_count": 1400,
        "active_laboratories": 85,
        "transit_dependency_rate": 68.5,
        "key_assumptions": ["Friday asynchronous instruction", "Accreditation preserved"],
        "constraints": "Wet labs cannot be shut down.",
    }
    context_resp = client.post(f"/api/v1/decisions/{decision_id}/context", json=context_payload)
    assert context_resp.status_code == 200
    data = context_resp.json()
    assert data["decision_id"] == decision_id
    assert data["student_population"] == 28000
    assert data["active_laboratories"] == 85
    assert len(data["key_assumptions"]) == 2

    # 3. Verify decision shows context_attached = True
    get_resp = client.get(f"/api/v1/decisions/{decision_id}")
    assert get_resp.json()["context_attached"] is True
