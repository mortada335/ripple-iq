"""Versioned and validated contract for decision analysis providers."""

from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, model_validator


class AnalysisStakeholder(BaseModel):
    model_config = ConfigDict(extra="forbid")

    key: str = Field(min_length=1, max_length=80)
    name: str = Field(min_length=1, max_length=200)
    category: str = Field(min_length=1, max_length=50)
    summary: str = Field(min_length=1, max_length=2000)


class DecisionInterpretation(BaseModel):
    model_config = ConfigDict(extra="forbid")

    decision_type: Literal[
        "academic_policy", "attendance", "budget", "staffing", "facilities", "student_services", "technology", "other"
    ]
    change_type: Literal["reduce", "increase", "expand", "create", "replace", "modify", "unspecified"]
    subject: str = Field(min_length=1, max_length=500)
    source_text: str = Field(min_length=1, max_length=1000)


class ScoreComponents(BaseModel):
    model_config = ConfigDict(extra="forbid")

    implementation_feasibility: float = Field(ge=0, le=1)
    stakeholder_protection: float = Field(ge=0, le=1)
    reversibility: float = Field(ge=0, le=1)


class AnalysisScenario(BaseModel):
    model_config = ConfigDict(extra="forbid")

    scenario_number: int = Field(ge=1)
    title: str = Field(min_length=1, max_length=300)
    description: str = Field(min_length=1, max_length=4000)
    # Optional for compatibility with analyses persisted before scenario reasoning was added.
    rationale: str | None = Field(default=None, max_length=3000)
    # Optional for compatibility with results saved before implementation steps were added.
    key_changes: list[str] = Field(default_factory=list, max_length=10)
    feasibility_score: float = Field(ge=0, le=1)
    score_components: ScoreComponents
    score_method: str = Field(min_length=1, max_length=1000)
    is_recommended: bool
    tradeoff_summary: str = Field(min_length=1, max_length=2000)


class AnalysisImpact(BaseModel):
    model_config = ConfigDict(extra="forbid")

    stakeholder_key: str
    scenario_number: int = Field(ge=1)
    category: str
    direction: Literal["POSITIVE", "NEGATIVE", "NEUTRAL"]
    magnitude: Literal["LOW", "MEDIUM", "HIGH"]
    description: str = Field(min_length=1, max_length=2000)
    metric_estimate: str | None = None


class AnalysisRisk(BaseModel):
    model_config = ConfigDict(extra="forbid")

    title: str = Field(min_length=1, max_length=300)
    probability: float = Field(ge=0, le=1)
    severity: Literal["CRITICAL", "HIGH", "MEDIUM", "LOW"]
    likelihood: Literal["HIGH", "MEDIUM", "LOW"]
    affected_stakeholders: list[str]
    mitigation_strategy: str = Field(min_length=1, max_length=2000)


class AnalysisRecommendation(BaseModel):
    model_config = ConfigDict(extra="forbid")

    selected_scenario_number: int = Field(ge=1)
    title: str = Field(min_length=1, max_length=300)
    summary: str = Field(min_length=1, max_length=3000)
    rationale: str = Field(min_length=1, max_length=3000)


class AnalysisProvenance(BaseModel):
    """Non-secret metadata describing the engine that generated an analysis."""

    model_config = ConfigDict(extra="forbid")

    provider: Literal["deterministic_mock", "openai_compatible_proxy", "google_gemini"] = "deterministic_mock"
    model: str | None = Field(default=None, max_length=120)
    attempt_count: int = Field(default=1, ge=1, le=20)
    fallback_used: bool = False
    is_mock: bool = True


class FairnessAssessment(BaseModel):
    model_config = ConfigDict(extra="forbid")

    potential_concerns: list[str] = Field(max_length=30)
    affected_groups_to_review: list[str] = Field(max_length=30)
    note: str = Field(min_length=1, max_length=2000)


class AnalysisResult(BaseModel):
    """Provider output contract; never implies certainty or replaces review."""

    model_config = ConfigDict(extra="forbid")

    schema_version: Literal["0.1.0"] = "0.1.0"
    analysis_status: Literal["completed"] = "completed"
    interpretation: DecisionInterpretation
    assumptions: list[str] = Field(max_length=100)
    stakeholders: list[AnalysisStakeholder] = Field(min_length=1, max_length=100)
    scenarios: list[AnalysisScenario] = Field(min_length=3, max_length=3)
    impacts: list[AnalysisImpact] = Field(max_length=500)
    risks: list[AnalysisRisk] = Field(max_length=100)
    fairness: FairnessAssessment
    recommendation: AnalysisRecommendation
    confidence: float = Field(ge=0, le=1)
    confidence_rationale: str = Field(min_length=1, max_length=2000)
    limitations: list[str] = Field(min_length=1, max_length=100)
    human_review_required: Literal[True] = True
    provenance: AnalysisProvenance = Field(default_factory=AnalysisProvenance)

    @model_validator(mode="after")
    def validate_scenario_references(self) -> "AnalysisResult":
        scenario_numbers = {scenario.scenario_number for scenario in self.scenarios}
        if len(scenario_numbers) != len(self.scenarios):
            raise ValueError("Scenario numbers must be unique.")
        if self.recommendation.selected_scenario_number not in scenario_numbers:
            raise ValueError("Recommendation must reference an existing scenario.")
        if sum(scenario.is_recommended for scenario in self.scenarios) != 1:
            raise ValueError("Exactly one scenario must be marked recommended.")
        return self
