from app.models import Decision, Organization, OrganizationMember, User


def test_register_login_and_current_user(client):
    registration = client.post(
        "/api/v1/auth/register",
        json={"email": " Analyst@Example.edu ", "full_name": "Campus Analyst", "password": "a-strong-passphrase"},
    )
    assert registration.status_code == 201
    user = registration.json()
    assert user["email"] == "analyst@example.edu"
    assert "password_hash" not in user
    assert "password" not in user

    login = client.post(
        "/api/v1/auth/login",
        json={"email": "ANALYST@example.edu", "password": "a-strong-passphrase"},
    )
    assert login.status_code == 200
    token = login.json()["access_token"]
    assert login.json()["token_type"] == "bearer"

    current_user = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert current_user.status_code == 200
    assert current_user.json()["id"] == user["id"]
    assert "password_hash" not in current_user.json()


def test_invalid_credentials_and_duplicate_registration(client):
    payload = {"email": "owner@example.edu", "password": "wrong-password"}
    response = client.post("/api/v1/auth/login", json=payload)
    assert response.status_code == 401
    assert response.json()["error"]["code"] == "INVALID_CREDENTIALS"

    duplicate = client.post(
        "/api/v1/auth/register",
        json={"email": "OWNER@example.edu", "full_name": "Duplicate", "password": "a-strong-passphrase"},
    )
    assert duplicate.status_code == 409


def test_authentication_is_required_for_private_routes(client):
    response = client.get("/api/v1/auth/me", headers={"Authorization": ""})
    assert response.status_code == 401
    assert response.json()["error"]["code"] == "AUTHENTICATION_REQUIRED"

    malformed = client.get("/api/v1/auth/me", headers={"Authorization": "Bearer not-a-token"})
    assert malformed.status_code == 401


def test_create_list_and_read_organization(client):
    created = client.post("/api/v1/organizations", json={"name": "North Valley University", "country": "Iraq"})
    assert created.status_code == 201
    organization = created.json()
    assert organization["slug"] == "north-valley-university"
    assert organization["role"] == "owner"

    listed = client.get("/api/v1/organizations")
    assert listed.status_code == 200
    assert organization["id"] in {item["id"] for item in listed.json()}
    assert len(listed.json()) == 2

    detail = client.get(f"/api/v1/organizations/{organization['id']}")
    assert detail.status_code == 200
    assert detail.json()["members"][0]["role"] == "owner"


def test_organization_member_roles_and_duplicate_membership(client):
    registered = client.post(
        "/api/v1/auth/register",
        json={"email": "reviewer@example.edu", "full_name": "Reviewer", "password": "a-strong-passphrase"},
    )
    assert registered.status_code == 201
    added = client.post(
        "/api/v1/organizations/1/members",
        json={"email": "reviewer@example.edu", "role": "reviewer"},
    )
    assert added.status_code == 201
    assert added.json()["role"] == "reviewer"

    duplicate = client.post(
        "/api/v1/organizations/1/members",
        json={"email": "reviewer@example.edu", "role": "viewer"},
    )
    assert duplicate.status_code == 409


def test_users_cannot_read_another_organizations_decision(client, db_session):
    other_organization = Organization(name="Other University", slug="other-university")
    other_user = User(
        email="other@example.edu",
        full_name="Other User",
        password_hash="test-only-password-hash",
    )
    db_session.add_all([other_organization, other_user])
    db_session.flush()
    other_membership = OrganizationMember(organization_id=other_organization.id, user_id=other_user.id, role="owner")
    decision = Decision(
        organization_id=other_organization.id,
        created_by_user_id=other_user.id,
        title="Other organization's decision",
        description="This record must stay organization scoped.",
    )
    db_session.add_all([other_membership, decision])
    db_session.flush()

    response = client.get(f"/api/v1/decisions/{decision.id}")
    assert response.status_code == 404
    assert response.json()["error"]["code"] == "DECISION_NOT_FOUND"


def test_viewer_cannot_create_decisions(client, db_session):
    user = db_session.query(User).filter_by(email="owner@example.edu").one()
    membership = db_session.query(OrganizationMember).filter_by(organization_id=user.organization_id).one()
    membership.role = "viewer"
    db_session.flush()

    response = client.post(
        "/api/v1/decisions",
        json={"title": "A viewer proposal", "description": "Viewers must not create decision proposals."},
    )
    assert response.status_code == 403
    assert response.json()["error"]["code"] == "INSUFFICIENT_ROLE"
