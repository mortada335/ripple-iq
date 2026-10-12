"""
RippleIQ Pydantic v2 Schemas
============================
Defines request and response schemas for decisions, context, simulation results,
reports, health checks, and standardized error envelopes.
"""

from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field

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
    description: str = Field(..., min_length=10, description="Detailed narrative and operational scope")
    department: str | None = Field(None, max_length=255, description="Governing university department")
    time_horizon: str | None = Field("1 Academic Year", max_length=100)
    priority: str | None = Field("HIGH", max_length=50)


class DecisionResponse(BaseModel):
    id: int
    title: str
    description: str
    department: str | None = None
    time_horizon: str | None = None
    priority: str
    status: str
    context_attached: bool = False
    simulation_ready: bool = False
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ==========================================
# Context Data Schemas
# ==========================================


class ContextDataCreate(BaseModel):
    student_population: int | None = Field(None, ge=1, description="Total enrolled student body")
    faculty_count: int | None = Field(None, ge=1, description="Total faculty members")
    active_laboratories: int | None = Field(None, ge=0, description="Continuous research/wet laboratories")
    transit_dependency_rate: float | None = Field(None, ge=0.0, le=100.0, description="Commuter transit percentage")
    key_assumptions: list[str] = Field(default_factory=list, description="Explicit administrative assumptions")
    constraints: str | None = Field(None, description="Regulatory, accreditation, or union bounds")
    raw_metadata: dict[str, Any] = Field(default_factory=dict, description="Custom institutional metadata")


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

    model_config = ConfigDict(from_attributes=True)


# ==========================================
# Simulation & Result Schemas
# ==========================================


class SimulateResponse(BaseModel):
    decision_id: int
    status: str
    message: str
    simulated_at: datetime


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
    is_recommended: bool
    tradeoff_summary: str | None = None

    model_config = ConfigDict(from_attributes=True)


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


class SimulationResultResponse(BaseModel):
    decision_id: int
    decision_title: str
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
