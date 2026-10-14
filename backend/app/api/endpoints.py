"""
RippleIQ REST API Endpoints
===========================
Implements the v1 API contract:
- GET    /health
- GET    /api/v1/health
- POST   /api/v1/decisions
- GET    /api/v1/decisions/{id}
- POST   /api/v1/decisions/{id}/context
- POST   /api/v1/decisions/{id}/simulate
- GET    /api/v1/decisions/{id}/result
- GET    /api/v1/decisions/{id}/report
"""

from datetime import UTC, datetime

from app.config import settings
from app.database import get_db
from app.dependencies import (
    get_current_user,
    organization_header,
    require_decision_access,
    resolve_membership,
)
from app.models import User
from app.schemas.schemas import (
    ApiV1HealthResponse,
    ContextDataCreate,
    ContextDataResponse,
    ContextDataUpdate,
    DecisionCreate,
    DecisionResponse,
    DecisionUpdate,
    ReportResponse,
    RootHealthResponse,
    SimulateResponse,
    SimulationResultResponse,
)
from app.services.decision_service import DecisionService
from app.services.report_service import ReportService
from app.services.simulation_service import SimulationService
from fastapi import APIRouter, Depends, HTTPException, Query, Request, Response, status
from fastapi.responses import PlainTextResponse
from sqlalchemy import text
from sqlalchemy.orm import Session

router = APIRouter()


def decision_response(decision) -> DecisionResponse:
    return DecisionResponse(
        id=decision.id,
        title=decision.title,
        description=decision.description,
        decision_type=decision.decision_type,
        department=decision.department,
        time_horizon=decision.time_horizon,
        priority=decision.priority,
        status=decision.status,
        context_attached=decision.context_data is not None,
        simulation_ready=decision.recommendation is not None,
        created_at=decision.created_at,
        updated_at=decision.updated_at,
    )


# ==========================================
# Health Check Endpoints
# ==========================================


@router.get(
    "/health",
    response_model=RootHealthResponse,
    tags=["Health"],
    summary="Root Liveness Health Check",
)
def root_health():
    """Returns basic system uptime and service identity."""
    return RootHealthResponse(
        status="healthy",
        app_name=settings.APP_NAME,
        version=settings.APP_VERSION,
    )


@router.get(
    "/api/v1/health",
    response_model=ApiV1HealthResponse,
    tags=["Health"],
    summary="Detailed API v1 Health Check",
)
def api_v1_health(db: Session = Depends(get_db)):
    """Verifies API status, environment configuration, and active database connectivity."""
    db_status = "connected"
    try:
        db.execute(text("SELECT 1"))
    except Exception:  # noqa: BLE001
        db_status = "disconnected"

    return ApiV1HealthResponse(
        status="healthy" if db_status == "connected" else "degraded",
        environment=settings.ENVIRONMENT,
        database=db_status,
        analyzer_mode=settings.ANALYZER_BACKEND,
        timestamp=datetime.now(UTC),
    )


# ==========================================
# Decision Management Endpoints
# ==========================================


@router.post(
    "/api/v1/decisions",
    response_model=DecisionResponse,
    status_code=status.HTTP_201_CREATED,
    tags=["Decisions"],
    summary="Create a New University Decision Proposal",
)
def create_decision(
    data: DecisionCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
    organization_id: int | None = Depends(organization_header),
):
    """Creates a new decision entity in DRAFT status."""
    membership = resolve_membership(db, user, organization_id)
    if membership.role not in {"owner", "admin", "decision_maker"}:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"code": "INSUFFICIENT_ROLE", "message": "Your organization role cannot create decisions."},
        )
    decision = DecisionService.create_decision(db, data, membership.organization_id, user.id)
    return decision_response(decision)


@router.get("/api/v1/decisions", response_model=list[DecisionResponse], tags=["Decisions"])
def list_decisions(
    offset: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=100),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
    organization_id: int | None = Depends(organization_header),
):
    membership = resolve_membership(db, user, organization_id)
    decisions = DecisionService.list_decisions(db, membership.organization_id, offset=offset, limit=limit)
    return [decision_response(decision) for decision in decisions]


@router.get(
    "/api/v1/decisions/{id}",
    response_model=DecisionResponse,
    tags=["Decisions"],
    summary="Retrieve Decision by ID",
)
def get_decision(id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    """Retrieves decision metadata, status, and attached context flags."""
    require_decision_access(db, user, id)
    decision = DecisionService.get_decision(db, id)
    if not decision:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "DECISION_NOT_FOUND", "message": f"Decision with ID {id} was not found."},
        )

    return decision_response(decision)


@router.patch("/api/v1/decisions/{id}", response_model=DecisionResponse, tags=["Decisions"])
def update_decision(
    id: int,
    data: DecisionUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    decision = require_decision_access(db, user, id, write=True)
    try:
        return decision_response(DecisionService.update_decision(db, decision, data, user.id))
    except ValueError as error:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={"code": "INVALID_DECISION_UPDATE", "message": str(error)},
        ) from error


@router.delete("/api/v1/decisions/{id}", status_code=status.HTTP_204_NO_CONTENT, tags=["Decisions"])
def archive_decision(id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    decision = require_decision_access(db, user, id, write=True)
    DecisionService.archive_decision(db, decision, user.id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


# ==========================================
# Context Data Endpoints
# ==========================================


@router.post(
    "/api/v1/decisions/{id}/context",
    response_model=ContextDataResponse,
    tags=["Decisions"],
    summary="Attach Institutional Context Data to Decision",
)
def attach_context(
    id: int,
    data: ContextDataCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Attaches or updates operational context (enrollment, labs, transit, assumptions)."""
    require_decision_access(db, user, id, write=True)
    try:
        context = DecisionService.attach_context(db, id, data, actor_user_id=user.id)
        return ContextDataResponse.model_validate(context)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "DECISION_NOT_FOUND", "message": str(e)},
        ) from e


@router.get("/api/v1/decisions/{id}/context", response_model=ContextDataResponse, tags=["Decisions"])
def get_decision_context(id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    require_decision_access(db, user, id)
    context = DecisionService.get_context(db, id)
    if context is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "CONTEXT_NOT_FOUND", "message": "Context data was not found."},
        )
    return ContextDataResponse.model_validate(context)


@router.patch("/api/v1/context/{context_id}", response_model=ContextDataResponse, tags=["Decisions"])
def update_context(
    context_id: int,
    data: ContextDataUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    context = DecisionService.get_context_by_id(db, context_id)
    if context is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "CONTEXT_NOT_FOUND", "message": "Context data was not found."},
        )
    require_decision_access(db, user, context.decision_id, write=True)
    try:
        context = DecisionService.update_context(db, context, data.model_dump(exclude_unset=True), user.id)
    except ValueError as error:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={"code": "INVALID_CONTEXT_UPDATE", "message": str(error)},
        ) from error
    return ContextDataResponse.model_validate(context)


@router.delete("/api/v1/context/{context_id}", status_code=status.HTTP_204_NO_CONTENT, tags=["Decisions"])
def delete_context(context_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    context = DecisionService.get_context_by_id(db, context_id)
    if context is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "CONTEXT_NOT_FOUND", "message": "Context data was not found."},
        )
    require_decision_access(db, user, context.decision_id, write=True)
    DecisionService.delete_context(db, context, user.id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


# ==========================================
# Simulation Endpoints
# ==========================================


@router.post(
    "/api/v1/decisions/{id}/simulate",
    response_model=SimulateResponse,
    tags=["Simulation"],
    summary="Execute Decision Impact Simulation",
)
def simulate_decision(id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    """
    Runs the deterministic AI Mock Analyzer across the decision and context data,
    generating 5 stakeholder profiles, 3 comparative scenarios, risks, and recommendation.
    """
    require_decision_access(db, user, id, write=True)
    try:
        return SimulationService.run_simulation(db, id)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "DECISION_NOT_FOUND", "message": str(e)},
        ) from e


@router.get(
    "/api/v1/decisions/{id}/result",
    response_model=SimulationResultResponse,
    tags=["Simulation"],
    summary="Retrieve Full Simulation Results",
)
def get_simulation_result(id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    """
    Returns full structured simulation analysis:
    stakeholders, 3 scenarios, impacts, risks, assumptions, confidence, limitations, and recommendation.
    """
    require_decision_access(db, user, id)
    try:
        return SimulationService.get_simulation_result(db, id)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "DECISION_NOT_FOUND", "message": str(e)},
        ) from e
    except KeyError as e:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={"code": "SIMULATION_NOT_RUN", "message": str(e)},
        ) from e


# ==========================================
# Report Generation Endpoints
# ==========================================


@router.get(
    "/api/v1/decisions/{id}/report",
    response_model=ReportResponse,
    tags=["Reports"],
    summary="Generate and Retrieve Audit-Ready Markdown Report",
)
def get_report(
    id: int,
    request: Request,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """
    Compiles an executive-grade Markdown decision memorandum.
    Supports JSON response or raw Markdown via 'Accept: text/markdown'.
    """
    require_decision_access(db, user, id)
    try:
        report = ReportService.generate_report(db, id)
        accept_header = request.headers.get("accept", "")
        if "text/markdown" in accept_header or "text/plain" in accept_header:
            return PlainTextResponse(
                content=report.content_markdown,
                media_type="text/markdown",
                headers={"Content-Disposition": f'attachment; filename="{report.filename}"'},
            )
        return report
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "DECISION_NOT_FOUND", "message": str(e)},
        ) from e
