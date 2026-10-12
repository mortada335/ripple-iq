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
from app.schemas.schemas import (
    ApiV1HealthResponse,
    ContextDataCreate,
    ContextDataResponse,
    DecisionCreate,
    DecisionResponse,
    ReportResponse,
    RootHealthResponse,
    SimulateResponse,
    SimulationResultResponse,
)
from app.services.decision_service import DecisionService
from app.services.report_service import ReportService
from app.services.simulation_service import SimulationService
from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.responses import PlainTextResponse
from sqlalchemy import text
from sqlalchemy.orm import Session

router = APIRouter()


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
def create_decision(data: DecisionCreate, db: Session = Depends(get_db)):
    """Creates a new decision entity in DRAFT status."""
    decision = DecisionService.create_decision(db, data)
    return DecisionResponse(
        id=decision.id,
        title=decision.title,
        description=decision.description,
        department=decision.department,
        time_horizon=decision.time_horizon,
        priority=decision.priority,
        status=decision.status,
        context_attached=False,
        simulation_ready=False,
        created_at=decision.created_at,
        updated_at=decision.updated_at,
    )


@router.get(
    "/api/v1/decisions/{id}",
    response_model=DecisionResponse,
    tags=["Decisions"],
    summary="Retrieve Decision by ID",
)
def get_decision(id: int, db: Session = Depends(get_db)):
    """Retrieves decision metadata, status, and attached context flags."""
    decision = DecisionService.get_decision(db, id)
    if not decision:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "DECISION_NOT_FOUND", "message": f"Decision with ID {id} was not found."},
        )

    context_attached = decision.context_data is not None
    simulation_ready = decision.recommendation is not None

    return DecisionResponse(
        id=decision.id,
        title=decision.title,
        description=decision.description,
        department=decision.department,
        time_horizon=decision.time_horizon,
        priority=decision.priority,
        status=decision.status,
        context_attached=context_attached,
        simulation_ready=simulation_ready,
        created_at=decision.created_at,
        updated_at=decision.updated_at,
    )


# ==========================================
# Context Data Endpoints
# ==========================================


@router.post(
    "/api/v1/decisions/{id}/context",
    response_model=ContextDataResponse,
    tags=["Decisions"],
    summary="Attach Institutional Context Data to Decision",
)
def attach_context(id: int, data: ContextDataCreate, db: Session = Depends(get_db)):
    """Attaches or updates operational context (enrollment, labs, transit, assumptions)."""
    try:
        context = DecisionService.attach_context(db, id, data)
        return ContextDataResponse.model_validate(context)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "DECISION_NOT_FOUND", "message": str(e)},
        ) from e


# ==========================================
# Simulation Endpoints
# ==========================================


@router.post(
    "/api/v1/decisions/{id}/simulate",
    response_model=SimulateResponse,
    tags=["Simulation"],
    summary="Execute Decision Impact Simulation",
)
def simulate_decision(id: int, db: Session = Depends(get_db)):
    """
    Runs the deterministic AI Mock Analyzer across the decision and context data,
    generating 5 stakeholder profiles, 3 comparative scenarios, risks, and recommendation.
    """
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
def get_simulation_result(id: int, db: Session = Depends(get_db)):
    """
    Returns full structured simulation analysis:
    stakeholders, 3 scenarios, impacts, risks, assumptions, confidence, limitations, and recommendation.
    """
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
def get_report(id: int, request: Request, db: Session = Depends(get_db)):
    """
    Compiles an executive-grade Markdown decision memorandum.
    Supports JSON response or raw Markdown via 'Accept: text/markdown'.
    """
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
