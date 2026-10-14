from app.models import AuditLog, Decision, Organization, OrganizationMember, User


def test_organization_membership_and_audit_log_relationships(db_session):
    organization = Organization(name="North Campus University", slug="north-campus")
    user = User(email="reviewer@example.edu", full_name="Campus Reviewer", password_hash="test-only-password-hash")
    decision = Decision(
        organization=organization,
        creator=user,
        title="Reduce campus attendance to four days",
        description="Evaluate a four-day on-campus schedule.",
    )
    membership = OrganizationMember(organization=organization, user=user, role="reviewer")
    audit_log = AuditLog(
        organization=organization,
        actor=user,
        decision=decision,
        action="decision.created",
        resource_type="decision",
        details={"source": "test"},
    )
    db_session.add_all([membership, decision, audit_log])
    db_session.commit()

    stored_member = db_session.query(OrganizationMember).one()
    stored_audit = db_session.query(AuditLog).one()

    assert stored_member.organization.slug == "north-campus"
    assert stored_member.user.email == "reviewer@example.edu"
    assert stored_member.role == "reviewer"
    assert stored_audit.decision.title == "Reduce campus attendance to four days"
    assert stored_audit.details == {"source": "test"}
