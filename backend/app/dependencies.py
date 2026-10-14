import jwt
from app.config import settings
from app.database import get_db
from app.models import Decision, OrganizationMember, User
from app.schemas.schemas import OrganizationRole
from app.security.tokens import ALGORITHM
from fastapi import Depends, Header, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jwt import InvalidTokenError
from sqlalchemy.orm import Session

bearer_scheme = HTTPBearer(auto_error=False)


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> User:
    unauthorized = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail={"code": "AUTHENTICATION_REQUIRED", "message": "A valid access token is required."},
        headers={"WWW-Authenticate": "Bearer"},
    )
    if credentials is None:
        raise unauthorized
    try:
        payload = jwt.decode(
            credentials.credentials,
            settings.SECRET_KEY,
            algorithms=[ALGORITHM],
            options={"require": ["exp", "sub"]},
        )
        user_id = int(payload["sub"])
    except (InvalidTokenError, KeyError, TypeError, ValueError):
        raise unauthorized from None

    user = db.get(User, user_id)
    if user is None or not user.is_active:
        raise unauthorized
    return user


def get_membership(
    db: Session,
    user_id: int,
    organization_id: int,
) -> OrganizationMember | None:
    return (
        db.query(OrganizationMember)
        .filter(
            OrganizationMember.user_id == user_id,
            OrganizationMember.organization_id == organization_id,
        )
        .first()
    )


def resolve_membership(
    db: Session,
    user: User,
    organization_id: int | None = None,
) -> OrganizationMember:
    query = db.query(OrganizationMember).filter(OrganizationMember.user_id == user.id)
    if organization_id is not None:
        membership = query.filter(OrganizationMember.organization_id == organization_id).first()
        if membership is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={"code": "ORGANIZATION_NOT_FOUND", "message": "Organization was not found."},
            )
        return membership

    memberships = query.limit(2).all()
    if not memberships:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"code": "ORGANIZATION_REQUIRED", "message": "Join an organization before using this endpoint."},
        )
    if len(memberships) > 1:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "ORGANIZATION_SELECTION_REQUIRED", "message": "Set the X-Organization-ID header."},
        )
    return memberships[0]


def require_role(membership: OrganizationMember, allowed: set[OrganizationRole]) -> None:
    if membership.role not in allowed:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"code": "INSUFFICIENT_ROLE", "message": "Your organization role cannot perform this action."},
        )


def require_decision_access(
    db: Session,
    user: User,
    decision_id: int,
    *,
    write: bool = False,
) -> Decision:
    decision = db.get(Decision, decision_id)
    if decision is None or decision.organization_id is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "DECISION_NOT_FOUND", "message": "Decision was not found."},
        )
    membership = get_membership(db, user.id, decision.organization_id)
    if membership is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "DECISION_NOT_FOUND", "message": "Decision was not found."},
        )
    if write:
        require_role(membership, {"owner", "admin", "decision_maker"})
        if decision.status == "ARCHIVED":
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail={"code": "DECISION_ARCHIVED", "message": "Archived decisions cannot be changed."},
            )
    return decision


def organization_header(x_organization_id: int | None = Header(default=None, alias="X-Organization-ID")) -> int | None:
    return x_organization_id
