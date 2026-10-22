from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.dependencies import get_current_user
from app.models import User
from app.schemas.schemas import LoginRequest, TokenResponse, UserRegister, UserResponse, UserUpdate
from app.security.passwords import hash_password, verify_password
from app.security.tokens import create_access_token
from app.services.audit_service import record_audit_event
from app.services.rate_limiting import enforce_limits, login_rules, registration_rules

router = APIRouter(prefix="/api/v1/auth", tags=["Authentication"])


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(data: UserRegister, request: Request, response: Response, db: Session = Depends(get_db)) -> User:
    enforce_limits(db, registration_rules(request))
    user = User(email=data.email, full_name=data.full_name, password_hash=hash_password(data.password))
    db.add(user)
    try:
        db.flush()
        record_audit_event(
            db,
            organization_id=None,
            actor_user_id=user.id,
            decision_id=None,
            action="auth.registered",
            resource_type="user",
            resource_id=user.id,
        )
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={"code": "EMAIL_ALREADY_REGISTERED", "message": "An account with this email already exists."},
        ) from None
    db.refresh(user)
    token = create_access_token(user.id)
    response.set_cookie(
        key="rippleiq_session",
        value=token,
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        httponly=True,
        samesite="lax",
        secure=settings.ENVIRONMENT == "production",
        path="/",
    )
    return user


@router.post("/login", response_model=TokenResponse)
def login(data: LoginRequest, request: Request, response: Response, db: Session = Depends(get_db)) -> TokenResponse:
    enforce_limits(db, login_rules(request, data.email))
    user = db.query(User).filter(User.email == data.email).first()
    if (
        user is None
        or not user.is_active
        or not user.password_hash
        or not verify_password(data.password, user.password_hash)
    ):
        record_audit_event(
            db,
            organization_id=None,
            actor_user_id=user.id if user is not None else None,
            decision_id=None,
            action="auth.login_failed",
            resource_type="authentication",
            resource_id=None,
        )
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": "INVALID_CREDENTIALS", "message": "Email or password is incorrect."},
            headers={"WWW-Authenticate": "Bearer"},
        )
    record_audit_event(
        db,
        organization_id=None,
        actor_user_id=user.id,
        decision_id=None,
        action="auth.login_succeeded",
        resource_type="user",
        resource_id=user.id,
    )
    db.commit()
    token = create_access_token(user.id)
    expires_seconds = settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
    response.set_cookie(
        key="rippleiq_session",
        value=token,
        max_age=expires_seconds,
        httponly=True,
        samesite="lax",
        secure=settings.ENVIRONMENT == "production",
        path="/",
    )
    return TokenResponse(
        access_token=token,
        expires_in=expires_seconds,
    )


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout(response: Response) -> Response:
    """Clear session cookie and invalidate active browser session."""
    response.delete_cookie(key="rippleiq_session", path="/")
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("/me", response_model=UserResponse)
def me(user: User = Depends(get_current_user)) -> User:
    return user


@router.patch("/me", response_model=UserResponse)
def update_me(
    data: UserUpdate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> User:
    if data.full_name is not None and data.full_name.strip():
        user.full_name = data.full_name.strip()
        db.commit()
        db.refresh(user)
    return user
