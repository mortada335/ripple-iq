"""
Tests for Decision Simulation Flow and Simulation Result Retrieval
"""

from app.models import AnalysisRun, Organization, OrganizationMember, Scenario, User
from app.security.tokens import create_access_token

from ai.provider import DeterministicMockProvider


def test_full_simulation_flow_for_demo_decision(client, db_session):
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
    assert res["confidence"]["is_calibrated_probability"] is False
    assert res["schema_version"] == "0.1.0"
    assert res["analysis_status"] == "completed"
    assert res["fairness"]["potential_concerns"]
    assert all(scenario["score_components"] for scenario in res["scenarios"])

    # Analysis and result reads use the persisted run, not a second analyzer call.
    analysis_status = client.get(f"/api/v1/decisions/{decision_id}/analysis")
    assert analysis_status.status_code == 200
    assert analysis_status.json()["analysis_status"] == "completed"
    assert analysis_status.json()["human_review_required"] is True
    assert client.get(f"/api/v1/decisions/{decision_id}/result").json() == res

    scenario_id = db_session.query(Scenario).filter_by(decision_id=decision_id).first().id
    scenario = client.get(f"/api/v1/scenarios/{scenario_id}")
    assert scenario.status_code == 200
    assert scenario.json()["score_method"]
    assert client.get(f"/api/v1/scenarios/{scenario.json()['id']}/impacts").json()
    assert client.get(f"/api/v1/scenarios/{scenario.json()['id']}/risks").json()


def test_failed_analysis_can_be_safely_retried(client, monkeypatch, db_session):
    created = client.post(
        "/api/v1/decisions",
        json={"title": "Review student support services", "description": "Assess service capacity and access."},
    )
    decision_id = created.json()["id"]

    class FailingAnalyzer:
        def analyze(self, title, description, context):
            raise RuntimeError("private provider failure detail")

    import app.services.simulation_service as simulation_service

    monkeypatch.setattr(simulation_service, "default_analyzer", FailingAnalyzer())
    failed = client.post(f"/api/v1/decisions/{decision_id}/simulate")
    assert failed.status_code == 500
    assert "private provider failure detail" not in failed.text
    status_response = client.get(f"/api/v1/decisions/{decision_id}/analysis")
    assert status_response.status_code == 200, status_response.text
    assert status_response.json()["analysis_status"] == "failed"
    assert status_response.json()["error_code"] == "ANALYSIS_FAILED"
    assert client.get(f"/api/v1/decisions/{decision_id}/result").status_code == 409
    assert db_session.query(AnalysisRun).filter_by(decision_id=decision_id).one().result_json is None

    monkeypatch.setattr(simulation_service, "default_analyzer", DeterministicMockProvider())
    retried = client.post(f"/api/v1/decisions/{decision_id}/analysis/retry")
    assert retried.status_code == 200
    assert retried.json()["analysis_status"] == "completed"
    assert client.get(f"/api/v1/decisions/{decision_id}/result").status_code == 200


def test_retry_only_accepts_failed_analysis(client):
    created = client.post(
        "/api/v1/decisions",
        json={"title": "Review student advising", "description": "Consider advising access and capacity."},
    )
    response = client.post(f"/api/v1/decisions/{created.json()['id']}/analysis/retry")
    assert response.status_code == 409


def test_scenario_routes_enforce_organization_access(client, db_session):
    created = client.post(
        "/api/v1/decisions",
        json={"title": "Review student advising", "description": "Consider advising access and capacity."},
    )
    decision_id = created.json()["id"]
    client.post(f"/api/v1/decisions/{decision_id}/simulate")
    scenario = db_session.query(Scenario).filter_by(decision_id=decision_id).first()

    foreign_org = Organization(name="Different University", slug="different-university")
    foreign_user = User(email="foreign@example.edu", full_name="Foreign User", password_hash="unused")
    db_session.add_all([foreign_org, foreign_user])
    db_session.flush()
    db_session.add(OrganizationMember(organization_id=foreign_org.id, user_id=foreign_user.id, role="owner"))
    db_session.commit()

    client.headers["Authorization"] = f"Bearer {create_access_token(foreign_user.id)}"
    assert client.get(f"/api/v1/scenarios/{scenario.id}").status_code == 404
    assert client.get(f"/api/v1/scenarios/{scenario.id}/impacts").status_code == 404
    assert client.get(f"/api/v1/scenarios/{scenario.id}/risks").status_code == 404
