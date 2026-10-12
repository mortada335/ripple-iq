"""
Tests for Decision Simulation Flow and Simulation Result Retrieval
"""


def test_full_simulation_flow_for_demo_decision(client):
    # 1. Create the canonical demo decision
    decision_payload = {
        "title": "Reduce in-person university attendance from five days to four days per week",
        "description": "Evaluate transition to a 4-day condensed on-campus schedule with Fridays asynchronous.",
        "department": "Office of the Provost",
        "time_horizon": "1 Academic Year",
        "priority": "HIGH",
    }
    create_resp = client.post("/api/v1/decisions", json=decision_payload)
    assert create_resp.status_code == 201
    decision_id = create_resp.json()["id"]

    # 2. Attach institutional context
    context_payload = {
        "student_population": 28000,
        "faculty_count": 1400,
        "active_laboratories": 85,
        "transit_dependency_rate": 68.5,
        "key_assumptions": [
            "Fridays designated as asynchronous remote learning day",
            "Campus dining operating on reduced footprint",
            "Accreditation hours preserved",
        ],
        "constraints": "Continuous wet lab experiments cannot be disrupted.",
    }
    context_resp = client.post(f"/api/v1/decisions/{decision_id}/context", json=context_payload)
    assert context_resp.status_code == 200

    # 3. Before simulation, /result should return 409 STATE_CONFLICT / SIMULATION_NOT_RUN
    unsim_resp = client.get(f"/api/v1/decisions/{decision_id}/result")
    assert unsim_resp.status_code == 409
    assert unsim_resp.json()["error"]["code"] == "SIMULATION_NOT_RUN"

    # 4. Trigger simulation
    sim_resp = client.post(f"/api/v1/decisions/{decision_id}/simulate")
    assert sim_resp.status_code == 200
    sim_data = sim_resp.json()
    assert sim_data["decision_id"] == decision_id
    assert sim_data["status"] == "COMPLETED"

    # 5. Retrieve structured simulation result
    result_resp = client.get(f"/api/v1/decisions/{decision_id}/result")
    assert result_resp.status_code == 200
    res = result_resp.json()

    # Verify decision governance & estimate attributes
    assert res["is_estimate"] is True
    assert res["human_review_required"] is True

    # Verify stakeholders
    stakeholder_keys = [s["key"] for s in res["stakeholders"]]
    assert "students" in stakeholder_keys
    assert "faculty" in stakeholder_keys
    assert "laboratories" in stakeholder_keys
    assert "administration" in stakeholder_keys
    assert "transportation" in stakeholder_keys
    assert len(res["stakeholders"]) == 5

    # Verify 3 scenarios
    assert len(res["scenarios"]) == 3
    sc_titles = [sc["title"] for sc in res["scenarios"]]
    assert any("as written" in t.lower() for t in sc_titles)
    assert any("protects laboratories" in t.lower() for t in sc_titles)
    assert any("pilot" in t.lower() for t in sc_titles)

    # Verify impacts, risks, recommendation, assumptions
    assert len(res["impacts"]) >= 5
    assert len(res["risks"]) >= 3
    assert len(res["assumptions"]) >= 3
    assert len(res["limitations"]) >= 2
    assert res["recommendation"] is not None
    assert res["recommendation"]["selected_scenario_number"] == 2
    assert res["confidence"]["score"] >= 0.7
