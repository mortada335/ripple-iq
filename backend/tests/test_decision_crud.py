from app.models import AuditLog, Decision, Organization, OrganizationMember, User


def create_decision(client):
    return client.post(
        "/api/v1/decisions",
        json={
            "title": "Move campus attendance to four days",
            "description": "Evaluate a four-day on-campus instructional week.",
            "decision_type": "attendance",
        },
    )


def test_decision_list_update_archive_and_audit(client, db_session):
    created = create_decision(client)
    assert created.status_code == 201
    decision_id = created.json()["id"]
    assert created.json()["decision_type"] == "attendance"

    listed = client.get("/api/v1/decisions?limit=1")
    assert listed.status_code == 200
    assert [item["id"] for item in listed.json()] == [decision_id]

    updated = client.patch(
        f"/api/v1/decisions/{decision_id}",
        json={"title": "Move campus attendance to four weekdays", "department": "Provost"},
    )
    assert updated.status_code == 200, updated.text
    assert updated.json()["title"] == "Move campus attendance to four weekdays"
    assert updated.json()["department"] == "Provost"

    empty_update = client.patch(f"/api/v1/decisions/{decision_id}", json={})
    assert empty_update.status_code == 422
    assert empty_update.json()["error"]["code"] == "INVALID_DECISION_UPDATE"

    archived = client.delete(f"/api/v1/decisions/{decision_id}")
    assert archived.status_code == 204
    detail = client.get(f"/api/v1/decisions/{decision_id}")
    assert detail.json()["status"] == "ARCHIVED"

    blocked_update = client.patch(f"/api/v1/decisions/{decision_id}", json={"priority": "LOW"})
    assert blocked_update.status_code == 409
    assert blocked_update.json()["error"]["code"] == "DECISION_ARCHIVED"

    actions = {row.action for row in db_session.query(AuditLog).filter_by(decision_id=decision_id).all()}
    assert {"decision.created", "decision.updated", "decision.archived"} <= actions


def test_context_crud_invalidates_simulation_and_records_audit(client, db_session):
    created = create_decision(client)
    decision_id = created.json()["id"]
    attached = client.post(
        f"/api/v1/decisions/{decision_id}/context",
        json={"student_population": 18000, "active_laboratories": 20, "key_assumptions": ["Pilot term"]},
    )
    assert attached.status_code == 200
    context_id = attached.json()["id"]
    assert attached.json()["updated_at"]
    assert client.get(f"/api/v1/decisions/{decision_id}").json()["status"] == "READY_FOR_ANALYSIS"

    fetched = client.get(f"/api/v1/decisions/{decision_id}/context")
    assert fetched.status_code == 200
    assert fetched.json()["student_population"] == 18000

    patched = client.patch(f"/api/v1/context/{context_id}", json={"active_laboratories": 24})
    assert patched.status_code == 200
    assert patched.json()["active_laboratories"] == 24

    simulated = client.post(f"/api/v1/decisions/{decision_id}/simulate")
    assert simulated.status_code == 200
    updated = client.patch(f"/api/v1/context/{context_id}", json={"student_population": 19000})
    assert updated.status_code == 200, updated.text
    stale_result = client.get(f"/api/v1/decisions/{decision_id}/result")
    assert stale_result.status_code == 409

    deleted = client.delete(f"/api/v1/context/{context_id}")
    assert deleted.status_code == 204
    assert client.get(f"/api/v1/decisions/{decision_id}").json()["status"] == "DRAFT"
    assert client.get(f"/api/v1/decisions/{decision_id}/context").status_code == 404

    actions = {row.action for row in db_session.query(AuditLog).filter_by(decision_id=decision_id).all()}
    assert {"context.created", "context.updated", "context.deleted"} <= actions


def test_decision_list_is_scoped_to_selected_organization(client, db_session):
    other_organization = Organization(name="Isolated University", slug="isolated-university")
    other_user = User(
        email="isolated@example.edu",
        full_name="Isolated Owner",
        password_hash="test-only-password-hash",
    )
    db_session.add_all([other_organization, other_user])
    db_session.flush()
    db_session.add(OrganizationMember(organization_id=other_organization.id, user_id=other_user.id, role="owner"))
    other_decision = Decision(
        organization_id=other_organization.id,
        created_by_user_id=other_user.id,
        title="Private university proposal",
        description="This decision belongs to another institution.",
        decision_type="academic_policy",
    )
    db_session.add(other_decision)
    db_session.flush()

    listed = client.get("/api/v1/decisions")
    assert listed.status_code == 200
    assert all(item["id"] != other_decision.id for item in listed.json())
    hidden = client.get(f"/api/v1/decisions/{other_decision.id}")
    assert hidden.status_code == 404


def test_context_text_and_metadata_limits_use_standard_errors(client):
    decision_id = create_decision(client).json()["id"]
    response = client.post(
        f"/api/v1/decisions/{decision_id}/context",
        json={"key_assumptions": ["x" * 501]},
    )
    assert response.status_code == 422
    assert response.json()["error"]["code"] == "VALIDATION_ERROR"

    oversized = client.post(
        f"/api/v1/decisions/{decision_id}/context",
        json={"raw_metadata": {"notes": "x" * 10001}},
    )
    assert oversized.status_code == 422
    assert oversized.json()["error"]["code"] == "VALIDATION_ERROR"
