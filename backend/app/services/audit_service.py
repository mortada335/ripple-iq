from sqlalchemy.orm import Session

from app.models import AuditLog


def record_audit_event(
    db: Session,
    *,
    organization_id: int | None,
    actor_user_id: int | None,
    decision_id: int | None,
    action: str,
    resource_type: str,
    resource_id: int | None,
    details: dict[str, object] | None = None,
) -> None:
    db.add(
        AuditLog(
            organization_id=organization_id,
            actor_user_id=actor_user_id,
            decision_id=decision_id,
            action=action,
            resource_type=resource_type,
            resource_id=str(resource_id) if resource_id is not None else None,
            details=details or {},
        )
    )
