import re
import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user, get_membership, require_role
from app.models import Organization, OrganizationMember, User
from app.schemas.schemas import (
    OrganizationCreate,
    OrganizationDetailResponse,
    OrganizationMemberCreate,
    OrganizationMemberResponse,
    OrganizationResponse,
)

router = APIRouter(prefix="/api/v1/organizations", tags=["Organizations"])


def make_slug(name: str, db: Session | None = None) -> str:
    clean = re.sub(r"[^a-z0-9]+", "-", name.casefold()).strip("-")[:80]
    if not clean:
        clean = f"org-{uuid.uuid4().hex[:8]}"
    base_slug = clean
    slug = base_slug
    if db:
        if db.query(Organization).filter(Organization.slug == slug).first() is not None:
            slug = f"{base_slug[:70]}-{uuid.uuid4().hex[:6]}"
    return slug


@router.post("", response_model=OrganizationResponse, status_code=status.HTTP_201_CREATED)
def create_organization(
    data: OrganizationCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> OrganizationResponse:
    name_clean = data.name.strip()
    if not name_clean:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={"code": "INVALID_NAME", "message": "Organization name cannot be empty."},
        )
    slug = make_slug(name_clean, db=db)
    organization = Organization(name=name_clean, slug=slug, country=data.country)
    db.add(organization)
    try:
        db.flush()
        membership = OrganizationMember(organization=organization, user=user, role="owner")
        db.add(membership)
        if user.organization_id is None:
            user.organization = organization
        db.commit()
    except IntegrityError:
        db.rollback()
        # If organization already exists, attach user to it or reuse
        existing = db.query(Organization).filter(Organization.name == name_clean).first()
        if existing:
            existing_member = (
                db.query(OrganizationMember)
                .filter(OrganizationMember.organization_id == existing.id, OrganizationMember.user_id == user.id)
                .first()
            )
            if not existing_member:
                membership = OrganizationMember(organization=existing, user=user, role="owner")
                db.add(membership)
            if user.organization_id is None:
                user.organization = existing
            db.commit()
            db.refresh(existing)
            return OrganizationResponse(
                id=existing.id,
                name=existing.name,
                slug=existing.slug,
                country=existing.country,
                role="owner",
                created_at=existing.created_at,
            )
        # If slug collided, retry with random unique uuid slug
        slug = f"org-{uuid.uuid4().hex[:12]}"
        organization = Organization(name=name_clean, slug=slug, country=data.country)
        db.add(organization)
        db.flush()
        membership = OrganizationMember(organization=organization, user=user, role="owner")
        db.add(membership)
        if user.organization_id is None:
            user.organization = organization
        db.commit()
    db.refresh(organization)
    return OrganizationResponse(
        id=organization.id,
        name=organization.name,
        slug=organization.slug,
        country=organization.country,
        role="owner",
        created_at=organization.created_at,
    )


@router.get("", response_model=list[OrganizationResponse])
def list_organizations(
    db: Session = Depends(get_db), user: User = Depends(get_current_user)
) -> list[OrganizationResponse]:
    rows = (
        db.query(Organization, OrganizationMember.role)
        .join(OrganizationMember, OrganizationMember.organization_id == Organization.id)
        .filter(OrganizationMember.user_id == user.id)
        .order_by(Organization.name)
        .all()
    )
    return [
        OrganizationResponse(
            id=organization.id,
            name=organization.name,
            slug=organization.slug,
            country=organization.country,
            role=role,
            created_at=organization.created_at,
        )
        for organization, role in rows
    ]


@router.get("/{organization_id}", response_model=OrganizationDetailResponse)
def get_organization(
    organization_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> OrganizationDetailResponse:
    membership = get_membership(db, user.id, organization_id)
    organization = db.get(Organization, organization_id) if membership else None
    if organization is None or membership is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "ORGANIZATION_NOT_FOUND", "message": "Organization was not found."},
        )
    members = (
        db.query(OrganizationMember, User)
        .join(User, User.id == OrganizationMember.user_id)
        .filter(OrganizationMember.organization_id == organization_id)
        .order_by(User.email)
        .all()
    )
    return OrganizationDetailResponse(
        id=organization.id,
        name=organization.name,
        slug=organization.slug,
        country=organization.country,
        role=membership.role,
        created_at=organization.created_at,
        members=[
            OrganizationMemberResponse(
                user_id=member_user.id,
                email=member_user.email,
                full_name=member_user.full_name,
                role=member.role,
                created_at=member.created_at,
            )
            for member, member_user in members
        ],
    )


@router.post(
    "/{organization_id}/members", response_model=OrganizationMemberResponse, status_code=status.HTTP_201_CREATED
)
def add_organization_member(
    organization_id: int,
    data: OrganizationMemberCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> OrganizationMemberResponse:
    inviter = get_membership(db, user.id, organization_id)
    if inviter is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "ORGANIZATION_NOT_FOUND", "message": "Organization was not found."},
        )
    require_role(inviter, {"owner", "admin"})
    if inviter.role == "admin" and data.role in {"owner", "admin"}:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"code": "INSUFFICIENT_ROLE", "message": "Admins cannot grant owner or admin roles."},
        )
    member_user = db.query(User).filter(User.email == data.email).first()
    if member_user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "USER_NOT_FOUND", "message": "Register this user before adding them to the organization."},
        )
    membership = OrganizationMember(organization_id=organization_id, user_id=member_user.id, role=data.role)
    db.add(membership)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={"code": "MEMBER_ALREADY_EXISTS", "message": "This user is already a member of the organization."},
        ) from None
    db.refresh(membership)
    return OrganizationMemberResponse(
        user_id=member_user.id,
        email=member_user.email,
        full_name=member_user.full_name,
        role=membership.role,
        created_at=membership.created_at,
    )
