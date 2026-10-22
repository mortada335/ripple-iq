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

from fastapi import APIRouter, Depends, HTTPException, Query, Request, Response, status
from fastapi.responses import PlainTextResponse
from sqlalchemy import text
from sqlalchemy.orm import Session
from starlette.concurrency import run_in_threadpool

from app.config import settings
from app.core.cache import memory_cache
from app.database import get_db
from app.dependencies import (
    get_current_user,
    organization_header,
    require_decision_access,
    require_role,
    resolve_membership,
)
from app.models import User
from app.models.models import Impact, KnowledgeSubmission, Scenario
from app.schemas.schemas import (
    AnalysisStatusResponse,
    ApiV1HealthResponse,
    ContextDataCreate,
    ContextDataResponse,
    ContextDataUpdate,
    DecisionCreate,
    DecisionResponse,
    DecisionUpdate,
    ExtractedDocumentResponse,
    ImpactResponse,
    KnowledgeSubmissionCreate,
    KnowledgeSubmissionDetail,
    KnowledgeSubmissionResponse,
    KnowledgeSubmissionReview,
    ProviderStatusResponse,
    RecommendationRefineRequest,
    RecommendationViewResponse,
    ReportResponse,
    RiskResponse,
    RootHealthResponse,
    ScenarioDetailResponse,
    SimulateResponse,
    SimulationResultResponse,
    VoiceTranscriptionResponse,
)
from app.services.audit_service import record_audit_event
from app.services.decision_service import DecisionService
from app.services.document_processing import DocumentProcessingError, process_document
from app.services.rate_limiting import (
    analysis_rules,
    document_rules,
    enforce_limits,
    voice_rules,
)
from app.services.recommendation_service import RecommendationService
from app.services.report_service import ReportService
from app.services.simulation_service import AnalysisExecutionError, SimulationService
from app.services.voice_transcription import TranscriptionError, transcribe_audio

router = APIRouter()


@router.post("/api/v1/voice/transcribe", response_model=VoiceTranscriptionResponse, tags=["Voice"])
async def transcribe_voice(
    request: Request,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
    organization_id: int | None = Depends(organization_header),
):
    """Transcribe a short recording after confirming the caller belongs to an organization."""
    resolve_membership(db, user, organization_id)
    enforce_limits(db, voice_rules(request, user))
    mime_type = request.headers.get("content-type", "").split(";", maxsplit=1)[0].strip().lower()
    if mime_type not in {"audio/webm", "audio/ogg", "audio/mp4", "audio/mpeg", "audio/mp3", "audio/wav", "audio/aac"}:
        raise HTTPException(
            status_code=415,
            detail={"code": "UNSUPPORTED_AUDIO_TYPE", "message": "This audio format is not supported."},
        )
    audio = bytearray()
    async for chunk in request.stream():
        audio.extend(chunk)
        if len(audio) > settings.VOICE_TRANSCRIPTION_MAX_BYTES:
            raise HTTPException(
                status_code=413,
                detail={"code": "AUDIO_TOO_LARGE", "message": "The recording exceeds the size limit."},
            )
    language = request.headers.get("x-transcription-language", "en-US")
    try:
        return await run_in_threadpool(
            transcribe_audio,
            bytes(audio),
            mime_type,
            language,
            config=settings,
        )
    except TranscriptionError as error:
        raise HTTPException(
            status_code=error.status_code,
            detail={"code": error.code, "message": error.message},
        ) from None


@router.post(
    "/api/v1/knowledge-submissions",
    response_model=KnowledgeSubmissionResponse,
    status_code=status.HTTP_201_CREATED,
    tags=["Knowledge"],
    summary="Submit institutional knowledge for human review",
)
def submit_knowledge(
    data: KnowledgeSubmissionCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
    organization_id: int | None = Depends(organization_header),
):
    membership = resolve_membership(db, user, organization_id)
    submission = KnowledgeSubmission(
        organization_id=membership.organization_id,
        submitted_by_user_id=user.id,
        scenario_key=data.scenario_key.strip(),
        contributor_role=data.contributor_role.strip(),
        answers=data.answers,
        source_name=data.source_name.strip() if data.source_name else None,
        source_date=data.source_date.strip() if data.source_date else None,
        consent_to_review=True,
        status="pending",
    )
    db.add(submission)
    db.commit()
    db.refresh(submission)
    return submission


@router.get("/api/v1/knowledge-submissions", response_model=list[KnowledgeSubmissionDetail], tags=["Knowledge"])
def list_knowledge_submissions(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
    organization_id: int | None = Depends(organization_header),
):
    membership = resolve_membership(db, user, organization_id)
    require_role(membership, {"owner", "admin", "reviewer"})
    return (
        db.query(KnowledgeSubmission)
        .filter(KnowledgeSubmission.organization_id == membership.organization_id)
        .order_by(KnowledgeSubmission.created_at.desc())
        .limit(200)
        .all()
    )


@router.patch(
    "/api/v1/knowledge-submissions/{submission_id}", response_model=KnowledgeSubmissionResponse, tags=["Knowledge"]
)
def review_knowledge_submission(
    submission_id: int,
    data: KnowledgeSubmissionReview,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
    organization_id: int | None = Depends(organization_header),
):
    membership = resolve_membership(db, user, organization_id)
    require_role(membership, {"owner", "admin", "reviewer"})
    submission = (
        db.query(KnowledgeSubmission)
        .filter(
            KnowledgeSubmission.id == submission_id,
            KnowledgeSubmission.organization_id == membership.organization_id,
        )
        .first()
    )
    if submission is None:
        raise HTTPException(
            status_code=404, detail={"code": "SUBMISSION_NOT_FOUND", "message": "Submission was not found."}
        )
    submission.status = data.status
    db.commit()
    db.refresh(submission)
    return submission


@router.get("/api/v1/ai/status", response_model=ProviderStatusResponse, tags=["AI"])
def get_ai_status():
    """Expose provider configuration readiness without probing or revealing credentials."""
    candidates = [
        ("openai_compatible_proxy", bool(settings.LLM_PRIMARY_API_KEY and settings.LLM_PRIMARY_MODEL)),
        ("google_gemini_key_1", bool(settings.GEMINI_API_KEY_1 and settings.GEMINI_MODEL)),
        ("google_gemini_key_2", bool(settings.GEMINI_API_KEY_2 and settings.GEMINI_MODEL)),
    ]
    return ProviderStatusResponse(
        mode=settings.ANALYZER_BACKEND,
        providers=[{"name": name, "configured": configured} for name, configured in candidates],
        failover_enabled=settings.LLM_FAILOVER_ENABLED,
        degraded_mode_enabled=settings.LLM_DEGRADED_MODE_ENABLED,
        note="Configuration status only; provider reachability is checked during analysis.",
    )


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
    database_backend = db.get_bind().dialect.name
    db_status = "connected"
    database_message = None
    try:
        db.execute(text("SELECT 1"))
    except Exception:  # noqa: BLE001
        db_status = "disconnected"
        database_message = (
            "Unable to reach the configured database. Check DATABASE_URL, DNS/network access, "
            "PostgreSQL SSL settings, and credentials."
        )

    return ApiV1HealthResponse(
        status="healthy" if db_status == "connected" else "degraded",
        environment=settings.ENVIRONMENT,
        database=db_status,
        database_backend=database_backend,
        database_message=database_message,
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
    memory_cache.invalidate_prefix("decisions:list")
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
    cache_key = f"decisions:list:{membership.organization_id}:{offset}:{limit}"
    cached = memory_cache.get(cache_key)
    if cached is not None:
        return cached

    decisions = DecisionService.list_decisions(db, membership.organization_id, offset=offset, limit=limit)
    response_list = [decision_response(decision) for decision in decisions]
    memory_cache.set(cache_key, response_list, ttl=20)
    return response_list


@router.get(
    "/api/v1/decisions/{id}",
    response_model=DecisionResponse,
    tags=["Decisions"],
    summary="Retrieve Decision by ID",
)
def get_decision(id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    """Retrieves decision metadata, status, and attached context flags."""
    require_decision_access(db, user, id)
    cache_key = f"decision:detail:{id}"
    cached = memory_cache.get(cache_key)
    if cached is not None:
        return cached

    decision = DecisionService.get_decision(db, id)
    if not decision:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "DECISION_NOT_FOUND", "message": f"Decision with ID {id} was not found."},
        )

    result = decision_response(decision)
    memory_cache.set(cache_key, result, ttl=30)
    return result


@router.patch("/api/v1/decisions/{id}", response_model=DecisionResponse, tags=["Decisions"])
def update_decision(
    id: int,
    data: DecisionUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    decision = require_decision_access(db, user, id, write=True)
    try:
        updated = decision_response(DecisionService.update_decision(db, decision, data, user.id))
        memory_cache.invalidate_prefix("decisions:list")
        memory_cache.delete(f"decision:detail:{id}")
        return updated
    except ValueError as error:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={"code": "INVALID_DECISION_UPDATE", "message": str(error)},
        ) from error


@router.delete("/api/v1/decisions/{id}", status_code=status.HTTP_204_NO_CONTENT, tags=["Decisions"])
def archive_decision(id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    decision = require_decision_access(db, user, id, write=True)
    DecisionService.archive_decision(db, decision, user.id)
    memory_cache.invalidate_prefix("decisions:list")
    memory_cache.delete(f"decision:detail:{id}")
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
# Organization-scoped local document extraction
# ==========================================


@router.post(
    "/api/v1/decisions/{id}/documents/extract",
    response_model=ExtractedDocumentResponse,
    tags=["Documents"],
    summary="Extract text from a document after decision access is verified",
)
async def extract_decision_document(
    id: int,
    request: Request,
    source_document_id: str = Query(min_length=1, max_length=200),
    source_version: str = Query(min_length=1, max_length=100),
    filename: str = Query(min_length=1, max_length=255),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    decision = require_decision_access(db, user, id)
    enforce_limits(db, document_rules(request, user))
    content = bytearray()
    content_length = request.headers.get("content-length")
    if content_length and content_length.isdigit() and int(content_length) > settings.OCR_MAX_FILE_SIZE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail={"code": "FILE_TOO_LARGE", "message": "The document exceeds the configured size limit."},
        )
    async for chunk in request.stream():
        if len(content) + len(chunk) > settings.OCR_MAX_FILE_SIZE_BYTES:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail={"code": "FILE_TOO_LARGE", "message": "The document exceeds the configured size limit."},
            )
        content.extend(chunk)
    try:
        extracted = await run_in_threadpool(
            process_document,
            bytes(content),
            source_document_id=source_document_id,
            organization_id=decision.organization_id,
            source_version=source_version,
            source_name=filename,
        )
    except DocumentProcessingError as error:
        status_code = {
            "OCR_CAPACITY_EXCEEDED": status.HTTP_503_SERVICE_UNAVAILABLE,
            "OCR_BACKEND_UNAVAILABLE": status.HTTP_503_SERVICE_UNAVAILABLE,
            "PDF_EXTRACTION_UNAVAILABLE": status.HTTP_503_SERVICE_UNAVAILABLE,
            "PROCESSING_TIMEOUT": status.HTTP_408_REQUEST_TIMEOUT,
            "FILE_TOO_LARGE": status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
        }.get(error.code, status.HTTP_422_UNPROCESSABLE_ENTITY)
        raise HTTPException(
            status_code=status_code,
            detail={"code": error.code, "message": str(error)},
        ) from error
    record_audit_event(
        db,
        organization_id=decision.organization_id,
        actor_user_id=user.id,
        decision_id=decision.id,
        action="document.text_extracted",
        resource_type="document",
        resource_id=source_document_id,
        details={"source_version": source_version, "page_count": len(extracted.pages)},
    )
    return ExtractedDocumentResponse(
        source_document_id=extracted.source_document_id,
        organization_id=extracted.organization_id,
        source_version=extracted.source_version,
        source_name=extracted.source_name,
        extracted_at=extracted.extracted_at,
        pages=[page.__dict__ for page in extracted.pages],
    )


# ==========================================
# Simulation Endpoints
# ==========================================


@router.post(
    "/api/v1/decisions/{id}/simulate",
    response_model=SimulateResponse,
    tags=["Simulation"],
    summary="Execute Decision Impact Simulation",
)
def simulate_decision(
    id: int,
    request: Request,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """
    Runs the deterministic AI Mock Analyzer across the decision and context data,
    generating 5 stakeholder profiles, 3 comparative scenarios, risks, and recommendation.
    """
    require_decision_access(db, user, id, write=True)
    enforce_limits(db, analysis_rules(request, user))
    try:
        sim_res = SimulationService.run_simulation(db, id, actor_user_id=user.id)
        memory_cache.delete(f"decision:result:{id}")
        memory_cache.delete(f"decision:report:{id}")
        memory_cache.delete(f"decision:recommendation:{id}")
        memory_cache.delete(f"decision:detail:{id}")
        memory_cache.invalidate_prefix("decisions:list")
        return sim_res
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "DECISION_NOT_FOUND", "message": str(e)},
        ) from e
    except AnalysisExecutionError as error:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "code": "ANALYSIS_FAILED",
                "message": "Analysis could not be completed. Check its status and retry.",
            },
        ) from error


@router.get("/api/v1/decisions/{id}/analysis", response_model=AnalysisStatusResponse, tags=["Simulation"])
def get_analysis_status(id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    require_decision_access(db, user, id)
    return SimulationService.analysis_status(db, id)


@router.post("/api/v1/decisions/{id}/analysis/retry", response_model=SimulateResponse, tags=["Simulation"])
def retry_analysis(
    id: int,
    request: Request,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    require_decision_access(db, user, id, write=True)
    enforce_limits(db, analysis_rules(request, user, retry=True))
    try:
        return SimulationService.retry_failed_analysis(db, id, user.id)
    except ValueError as error:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={"code": "ANALYSIS_NOT_RETRYABLE", "message": str(error)},
        ) from error
    except AnalysisExecutionError as error:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "code": "ANALYSIS_FAILED",
                "message": "Analysis could not be completed. Check its status and retry.",
            },
        ) from error


@router.get("/api/v1/scenarios/{scenario_id}", response_model=ScenarioDetailResponse, tags=["Simulation"])
def get_scenario(scenario_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    scenario = db.get(Scenario, scenario_id)
    if scenario is None:
        raise HTTPException(
            status_code=404, detail={"code": "SCENARIO_NOT_FOUND", "message": "Scenario was not found."}
        )
    require_decision_access(db, user, scenario.decision_id)
    run = SimulationService.latest_run(db, scenario.decision_id)
    analysis = run.result_json if run is not None and run.status == "completed" else {}
    item = next(
        (
            candidate
            for candidate in analysis.get("scenarios", [])
            if candidate["scenario_number"] == scenario.scenario_number
        ),
        {},
    )
    return ScenarioDetailResponse(
        id=scenario.id,
        decision_id=scenario.decision_id,
        scenario_number=scenario.scenario_number,
        title=scenario.title,
        description=scenario.description,
        rationale=item.get("rationale"),
        key_changes=item.get("key_changes", []),
        feasibility_score=scenario.feasibility_score,
        score_components=item.get("score_components", {}),
        score_method=item.get("score_method"),
        is_recommended=scenario.is_recommended,
        tradeoff_summary=scenario.tradeoff_summary,
    )


@router.get("/api/v1/scenarios/{scenario_id}/impacts", response_model=list[ImpactResponse], tags=["Simulation"])
def get_scenario_impacts(scenario_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    scenario = db.get(Scenario, scenario_id)
    if scenario is None:
        raise HTTPException(
            status_code=404, detail={"code": "SCENARIO_NOT_FOUND", "message": "Scenario was not found."}
        )
    require_decision_access(db, user, scenario.decision_id)
    return [
        ImpactResponse(
            stakeholder_key=impact.stakeholder_key,
            scenario_number=scenario.scenario_number,
            category=impact.category,
            direction=impact.direction,
            magnitude=impact.magnitude,
            description=impact.description,
            metric_estimate=impact.metric_estimate,
        )
        for impact in db.query(Impact).filter(Impact.scenario_id == scenario.id).all()
    ]


@router.get("/api/v1/scenarios/{scenario_id}/risks", response_model=list[RiskResponse], tags=["Simulation"])
def get_scenario_risks(scenario_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    scenario = db.get(Scenario, scenario_id)
    if scenario is None:
        raise HTTPException(
            status_code=404, detail={"code": "SCENARIO_NOT_FOUND", "message": "Scenario was not found."}
        )
    require_decision_access(db, user, scenario.decision_id)
    run = SimulationService.latest_run(db, scenario.decision_id)
    risks = run.result_json.get("risks", []) if run is not None and run.status == "completed" else []
    return [RiskResponse(**risk) for risk in risks]


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


@router.get("/api/v1/decisions/{id}/report.md", tags=["Reports"])
def download_report_markdown(id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    decision = require_decision_access(db, user, id)
    try:
        report = ReportService.generate_report(db, id)
    except ValueError as error:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={
                "code": "REPORT_NOT_AVAILABLE",
                "message": "A completed analysis is required to generate a report.",
            },
        ) from error
    audit_report_download(db, decision, user)
    return PlainTextResponse(
        content=report.content_markdown,
        media_type="text/markdown",
        headers={"Content-Disposition": f'attachment; filename="{report.filename}"'},
    )


@router.get(
    "/api/v1/decisions/{id}/recommendation",
    response_model=RecommendationViewResponse,
    tags=["Recommendations"],
)
def get_recommendation(id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    require_decision_access(db, user, id)
    try:
        return RecommendationService.get_recommendation(db, id)
    except ValueError as error:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={"code": "RECOMMENDATION_NOT_AVAILABLE", "message": str(error)},
        ) from error


@router.post(
    "/api/v1/decisions/{id}/refine",
    response_model=RecommendationViewResponse,
    tags=["Recommendations"],
)
def refine_recommendation(
    id: int,
    data: RecommendationRefineRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    decision = require_decision_access(db, user, id, write=True)
    try:
        return RecommendationService.refine(db, decision, user.id, data)
    except ValueError as error:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={"code": "INVALID_REFINEMENT", "message": str(error)},
        ) from error


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
    decision = require_decision_access(db, user, id)
    try:
        report = ReportService.generate_report(db, id)
        audit_report_download(db, decision, user)
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


def audit_report_download(db: Session, decision, user: User) -> None:
    if decision.organization_id is None:
        return
    record_audit_event(
        db,
        organization_id=decision.organization_id,
        actor_user_id=user.id,
        decision_id=decision.id,
        action="report.downloaded",
        resource_type="report",
        resource_id=decision.id,
    )
    db.commit()
