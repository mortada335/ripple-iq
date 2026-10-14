"""
RippleIQ Pydantic v2 Schemas
============================
Defines request and response schemas for decisions, context, simulation results,
reports, health checks, and standardized error envelopes.
"""

import json
import re
from datetime import datetime
from typing import Annotated, Any, Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator

OrganizationRole = Literal["owner", "admin", "decision_maker", "reviewer", "viewer"]
DecisionType = Literal[
    "academic_policy",
    "attendance",
    "budget",
    "staffing",
    "facilities",
    "student_services",
    "technology",
    "other",
]
ContextAssumption = Annotated[str, Field(min_length=1, max_length=500)]


class UserRegister(BaseModel):
    email: str = Field(min_length=3, max_length=255)
    full_name: str = Field(min_length=1, max_length=255)
    password: str = Field(min_length=12, max_length=128)

    @field_validator("email")
    @classmethod
    def normalize_email(cls, value: str) -> str:
        normalized = value.strip().casefold()
        if not re.fullmatch(r"[^\s@]+@[^\s@]+\.[^\s@]+", normalized):
            raise ValueError("Enter a valid email address.")
        return normalized


class LoginRequest(BaseModel):
    email: str = Field(min_length=3, max_length=255)
    password: str = Field(min_length=1, max_length=128)

    @field_validator("email")
    @classmethod
    def normalize_email(cls, value: str) -> str:
        normalized = value.strip().casefold()
        if not re.fullmatch(r"[^\s@]+@[^\s@]+\.[^\s@]+", normalized):
            raise ValueError("Enter a valid email address.")
        return normalized


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int


class UserResponse(BaseModel):
    id: int
    email: str
    full_name: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class OrganizationCreate(BaseModel):
    name: str = Field(min_length=2, max_length=255)
    country: str | None = Field(default=None, max_length=100)


class OrganizationResponse(BaseModel):
    id: int
    name: str
    slug: str
    country: str | None
    role: OrganizationRole
    created_at: datetime


class OrganizationMemberCreate(BaseModel):
    email: str = Field(min_length=3, max_length=255)
    role: OrganizationRole

    @field_validator("email")
    @classmethod
    def normalize_email(cls, value: str) -> str:
        normalized = value.strip().casefold()
        if not re.fullmatch(r"[^\s@]+@[^\s@]+\.[^\s@]+", normalized):
            raise ValueError("Enter a valid email address.")
        return normalized


class OrganizationMemberResponse(BaseModel):
    user_id: int
    email: str
    full_name: str
    role: OrganizationRole
    created_at: datetime


class OrganizationDetailResponse(OrganizationResponse):
    members: list[OrganizationMemberResponse]


# ==========================================
# Health Check Schemas
# ==========================================


class RootHealthResponse(BaseModel):
    status: str = "healthy"
    app_name: str = "RippleIQ"
    version: str = "0.1.0"


class ApiV1HealthResponse(BaseModel):
    status: str = "healthy"
    environment: str
    database: str
    analyzer_mode: str
    timestamp: datetime


# ==========================================
# Error Response Schemas
# ==========================================


class ErrorBody(BaseModel):
    code: str
    message: str
    details: Any | None = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)


class ErrorEnvelope(BaseModel):
    error: ErrorBody


# ==========================================
# Decision Schemas
# ==========================================


class DecisionCreate(BaseModel):
    title: str = Field(..., min_length=5, max_length=500, description="Concise university policy proposal")
    description: str = Field(
        ..., min_length=10, max_length=10000, description="Detailed narrative and operational scope"
    )
    decision_type: DecisionType = "other"
    department: str | None = Field(None, max_length=255, description="Governing university department")
    time_horizon: str | None = Field("1 Academic Year", max_length=100)
    priority: str | None = Field("HIGH", max_length=50)


class DecisionResponse(BaseModel):
    id: int
    title: str
    description: str
    decision_type: DecisionType = "other"
    department: str | None = None
    time_horizon: str | None = None
    priority: str
    status: str
    context_attached: bool = False
    simulation_ready: bool = False
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class DecisionUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=5, max_length=500)
    description: str | None = Field(default=None, min_length=10, max_length=10000)
    decision_type: DecisionType | None = None
    department: str | None = Field(default=None, max_length=255)
    time_horizon: str | None = Field(default=None, max_length=100)
    priority: str | None = Field(default=None, max_length=50)


# ==========================================
# Context Data Schemas
# ==========================================


def _validate_context_metadata(value: dict[str, Any]) -> dict[str, Any]:
    if len(value) > 50:
        raise ValueError("Custom metadata may contain at most 50 top-level fields.")
    try:
        encoded = json.dumps(value, ensure_ascii=False, allow_nan=False)
    except (TypeError, ValueError):
        raise ValueError("Custom metadata must contain valid JSON values.") from None
    if len(encoded) > 10000:
        raise ValueError("Custom metadata may not exceed 10,000 characters when serialized.")
    return value


class ContextDataCreate(BaseModel):
    student_population: int | None = Field(None, ge=1, description="Total enrolled student body")
    faculty_count: int | None = Field(None, ge=1, description="Total faculty members")
    active_laboratories: int | None = Field(None, ge=0, description="Continuous research/wet laboratories")
    transit_dependency_rate: float | None = Field(None, ge=0.0, le=100.0, description="Commuter transit percentage")
    key_assumptions: list[ContextAssumption] = Field(
        default_factory=list, max_length=50, description="Explicit administrative assumptions"
    )
    constraints: str | None = Field(None, max_length=4000, description="Regulatory, accreditation, or union bounds")
    raw_metadata: dict[str, Any] = Field(default_factory=dict, description="Custom institutional metadata")

    @field_validator("raw_metadata")
    @classmethod
    def validate_metadata_size(cls, value: dict[str, Any]) -> dict[str, Any]:
        return _validate_context_metadata(value)


class ContextDataUpdate(BaseModel):
    student_population: int | None = Field(default=None, ge=1)
    faculty_count: int | None = Field(default=None, ge=1)
    active_laboratories: int | None = Field(default=None, ge=0)
    transit_dependency_rate: float | None = Field(default=None, ge=0.0, le=100.0)
    key_assumptions: list[ContextAssumption] | None = Field(default=None, max_length=50)
    constraints: str | None = Field(default=None, max_length=4000)
    raw_metadata: dict[str, Any] | None = None

    @field_validator("raw_metadata")
    @classmethod
    def validate_metadata_size(cls, value: dict[str, Any] | None) -> dict[str, Any] | None:
        if value is None:
            return value
        return _validate_context_metadata(value)


class ContextDataResponse(BaseModel):
    id: int
    decision_id: int
    student_population: int | None = None
    faculty_count: int | None = None
    active_laboratories: int | None = None
    transit_dependency_rate: float | None = None
    key_assumptions: list[str] = Field(default_factory=list)
    constraints: str | None = None
    raw_metadata: dict[str, Any] = Field(default_factory=dict)
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ==========================================
# Simulation & Result Schemas
# ==========================================


class SimulateResponse(BaseModel):
    decision_id: int
    status: str
    analysis_run_id: int | None = None
    analysis_status: Literal["completed"] = "completed"
    message: str
    simulated_at: datetime


class AnalysisStatusResponse(BaseModel):
    decision_id: int
    analysis_run_id: int | None
    analysis_status: Literal["pending", "running", "completed", "failed"]
    schema_version: str | None = None
    error_code: str | None = None
    started_at: datetime | None = None
    finished_at: datetime | None = None
    human_review_required: Literal[True] = True


class StakeholderResponse(BaseModel):
    key: str
    name: str
    category: str
    summary: str | None = None

    model_config = ConfigDict(from_attributes=True)


class ScenarioResponse(BaseModel):
    scenario_number: int
    title: str
    description: str
    feasibility_score: float
    score_components: dict[str, float] = Field(default_factory=dict)
    score_method: str | None = None
    is_recommended: bool
    tradeoff_summary: str | None = None

    model_config = ConfigDict(from_attributes=True)


class ScenarioDetailResponse(ScenarioResponse):
    id: int
    decision_id: int


class ImpactResponse(BaseModel):
    stakeholder_key: str
    scenario_number: int
    category: str
    direction: str  # POSITIVE | NEGATIVE | NEUTRAL
    magnitude: str  # LOW | MEDIUM | HIGH
    description: str
    metric_estimate: str | None = None

    model_config = ConfigDict(from_attributes=True)


class RiskResponse(BaseModel):
    title: str
    severity: str  # CRITICAL | HIGH | MEDIUM | LOW
    likelihood: str  # HIGH | MEDIUM | LOW
    probability: float | None = None
    affected_stakeholders: list[str] = Field(default_factory=list)
    mitigation_strategy: str

    model_config = ConfigDict(from_attributes=True)


class ConfidenceResponse(BaseModel):
    score: float
    level: str
    rationale: str


class RecommendationResponse(BaseModel):
    selected_scenario_number: int
    title: str
    summary: str
    rationale: str

    model_config = ConfigDict(from_attributes=True)


class RecommendationRefineRequest(BaseModel):
    feedback: str = Field(min_length=3, max_length=4000)
    selected_scenario_number: int | None = Field(default=None, ge=1, le=3)


class RecommendationRefinementResponse(BaseModel):
    id: int
    selected_scenario_number: int
    title: str
    summary: str
    rationale: str
    feedback: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class RecommendationViewResponse(BaseModel):
    decision_id: int
    original: RecommendationResponse
    current: RecommendationResponse
    refinement: RecommendationRefinementResponse | None = None


class SimulationResultResponse(BaseModel):
    decision_id: int
    decision_title: str
    schema_version: str = "0.1.0"
    analysis_status: Literal["completed"] = "completed"
    interpretation: dict[str, Any] = Field(default_factory=dict)
    fairness: dict[str, Any] = Field(default_factory=dict)
    is_estimate: bool = True
    human_review_required: bool = True
    confidence: ConfidenceResponse
    stakeholders: list[StakeholderResponse]
    scenarios: list[ScenarioResponse]
    impacts: list[ImpactResponse]
    risks: list[RiskResponse]
    assumptions: list[str]
    limitations: list[str]
    recommendation: RecommendationResponse | None = None


# ==========================================
# Report Schemas
# ==========================================


class ReportResponse(BaseModel):
    decision_id: int
    filename: str
    content_markdown: str
    checksum: str
    generated_at: datetime

    model_config = ConfigDict(from_attributes=True)
