"""
RippleIQ SQLAlchemy ORM Models
==============================
Defines relational models for User, Organization, Decision, ContextData,
Stakeholder, Scenario, Impact, Risk, Recommendation, and Report.
"""

from datetime import UTC, datetime

from sqlalchemy import (
    JSON,
    Boolean,
    CheckConstraint,
    Column,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.orm import relationship

from app.database import Base


def utc_now():
    return datetime.now(UTC)


class Organization(Base):
    __tablename__ = "organizations"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(255), nullable=False, unique=True)
    slug = Column(String(100), nullable=False, unique=True, index=True)
    country = Column(String(100), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)

    users = relationship("User", back_populates="organization", cascade="all, delete-orphan")
    memberships = relationship("OrganizationMember", back_populates="organization", cascade="all, delete-orphan")
    decisions = relationship("Decision", back_populates="organization", cascade="all, delete-orphan")
    audit_logs = relationship("AuditLog", back_populates="organization")


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    organization_id = Column(Integer, ForeignKey("organizations.id", ondelete="CASCADE"), nullable=True)
    email = Column(String(255), nullable=False, unique=True, index=True)
    full_name = Column(String(255), nullable=False)
    password_hash = Column(String(255), nullable=True)
    role = Column(String(50), nullable=False, default="ADMIN")
    is_active = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime(timezone=True), default=utc_now)

    organization = relationship("Organization", back_populates="users")
    memberships = relationship("OrganizationMember", back_populates="user", cascade="all, delete-orphan")
    decisions = relationship("Decision", back_populates="creator")
    audit_logs = relationship("AuditLog", back_populates="actor")


class OrganizationMember(Base):
    __tablename__ = "organization_members"
    __table_args__ = (
        UniqueConstraint("organization_id", "user_id", name="uq_organization_members_org_user"),
        CheckConstraint(
            "role IN ('owner', 'admin', 'decision_maker', 'reviewer', 'viewer')",
            name="ck_organization_members_role",
        ),
    )

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    organization_id = Column(Integer, ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    role = Column(String(50), nullable=False, default="viewer")
    created_at = Column(DateTime(timezone=True), nullable=False, default=utc_now)

    organization = relationship("Organization", back_populates="memberships")
    user = relationship("User", back_populates="memberships")


class Decision(Base):
    __tablename__ = "decisions"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    organization_id = Column(Integer, ForeignKey("organizations.id", ondelete="SET NULL"), nullable=True)
    created_by_user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    title = Column(String(500), nullable=False)
    description = Column(Text, nullable=False)
    decision_type = Column(String(50), nullable=False, default="other", server_default="other")
    department = Column(String(255), nullable=True)
    time_horizon = Column(String(100), nullable=True)
    priority = Column(String(50), default="HIGH")
    status = Column(String(50), default="DRAFT", index=True)  # DRAFT, CONTEXT_ATTACHED, SIMULATED, ARCHIVED

    created_at = Column(DateTime(timezone=True), default=utc_now)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)

    # Relationships
    organization = relationship("Organization", back_populates="decisions")
    creator = relationship("User", back_populates="decisions")
    context_data = relationship("ContextData", back_populates="decision", uselist=False, cascade="all, delete-orphan")
    stakeholders = relationship("Stakeholder", back_populates="decision", cascade="all, delete-orphan")
    scenarios = relationship("Scenario", back_populates="decision", cascade="all, delete-orphan")
    risks = relationship("Risk", back_populates="decision", cascade="all, delete-orphan")
    recommendation = relationship(
        "Recommendation", back_populates="decision", uselist=False, cascade="all, delete-orphan"
    )
    reports = relationship("Report", back_populates="decision", cascade="all, delete-orphan")
    audit_logs = relationship("AuditLog", back_populates="decision")
    analysis_runs = relationship("AnalysisRun", back_populates="decision", cascade="all, delete-orphan")


class ContextData(Base):
    __tablename__ = "context_data"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    decision_id = Column(
        Integer, ForeignKey("decisions.id", ondelete="CASCADE"), nullable=False, unique=True, index=True
    )

    student_population = Column(Integer, nullable=True)
    faculty_count = Column(Integer, nullable=True)
    active_laboratories = Column(Integer, nullable=True)
    transit_dependency_rate = Column(Float, nullable=True)
    key_assumptions = Column(JSON, default=list)
    constraints = Column(Text, nullable=True)
    raw_metadata = Column(JSON, default=dict)
    created_at = Column(DateTime(timezone=True), default=utc_now)
    updated_at = Column(
        DateTime(timezone=True), nullable=False, default=utc_now, onupdate=utc_now, server_default=func.now()
    )

    decision = relationship("Decision", back_populates="context_data")


class Stakeholder(Base):
    __tablename__ = "stakeholders"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    decision_id = Column(Integer, ForeignKey("decisions.id", ondelete="CASCADE"), nullable=False, index=True)

    key = Column(String(100), nullable=False)
    name = Column(String(255), nullable=False)
    category = Column(String(100), nullable=False)  # ACADEMIC, OPERATIONAL, COMMUNITY
    summary = Column(Text, nullable=True)

    decision = relationship("Decision", back_populates="stakeholders")


class Scenario(Base):
    __tablename__ = "scenarios"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    decision_id = Column(Integer, ForeignKey("decisions.id", ondelete="CASCADE"), nullable=False, index=True)

    scenario_number = Column(Integer, nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    feasibility_score = Column(Float, nullable=False, default=0.7)
    is_recommended = Column(Boolean, nullable=False, default=False)
    tradeoff_summary = Column(Text, nullable=True)

    decision = relationship("Decision", back_populates="scenarios")
    impacts = relationship("Impact", back_populates="scenario", cascade="all, delete-orphan")


class Impact(Base):
    __tablename__ = "impacts"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    scenario_id = Column(Integer, ForeignKey("scenarios.id", ondelete="CASCADE"), nullable=False, index=True)

    stakeholder_key = Column(String(100), nullable=False)
    category = Column(String(100), nullable=False)
    direction = Column(String(50), nullable=False)  # POSITIVE, NEGATIVE, NEUTRAL
    magnitude = Column(String(50), nullable=False)  # LOW, MEDIUM, HIGH
    description = Column(Text, nullable=False)
    metric_estimate = Column(String(255), nullable=True)

    scenario = relationship("Scenario", back_populates="impacts")


class Risk(Base):
    __tablename__ = "risks"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    decision_id = Column(Integer, ForeignKey("decisions.id", ondelete="CASCADE"), nullable=False, index=True)

    title = Column(String(255), nullable=False)
    severity = Column(String(50), nullable=False)  # CRITICAL, HIGH, MEDIUM, LOW
    likelihood = Column(String(50), nullable=False)  # HIGH, MEDIUM, LOW
    affected_stakeholders = Column(JSON, default=list)
    mitigation_strategy = Column(Text, nullable=False)

    decision = relationship("Decision", back_populates="risks")


class Recommendation(Base):
    __tablename__ = "recommendations"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    decision_id = Column(
        Integer, ForeignKey("decisions.id", ondelete="CASCADE"), nullable=False, unique=True, index=True
    )

    selected_scenario_number = Column(Integer, nullable=False)
    title = Column(String(255), nullable=False)
    summary = Column(Text, nullable=False)
    rationale = Column(Text, nullable=False)
    confidence_score = Column(Float, nullable=False, default=0.8)
    confidence_level = Column(String(50), nullable=False, default="HIGH")
    assumptions = Column(JSON, default=list)
    limitations = Column(JSON, default=list)
    human_review_required = Column(Boolean, nullable=False, default=True)

    decision = relationship("Decision", back_populates="recommendation")


class Report(Base):
    __tablename__ = "reports"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    decision_id = Column(Integer, ForeignKey("decisions.id", ondelete="CASCADE"), nullable=False, index=True)

    filename = Column(String(255), nullable=False)
    content_markdown = Column(Text, nullable=False)
    checksum = Column(String(64), nullable=False)
    generated_at = Column(DateTime(timezone=True), default=utc_now)

    decision = relationship("Decision", back_populates="reports")


class AnalysisRun(Base):
    __tablename__ = "analysis_runs"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    decision_id = Column(Integer, ForeignKey("decisions.id", ondelete="CASCADE"), nullable=False, index=True)
    status = Column(String(20), nullable=False, default="pending", index=True)
    schema_version = Column(String(20), nullable=True)
    result_json = Column(JSON, nullable=True)
    error_code = Column(String(50), nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=False, default=utc_now)
    started_at = Column(DateTime(timezone=True), nullable=True)
    finished_at = Column(DateTime(timezone=True), nullable=True)

    decision = relationship("Decision", back_populates="analysis_runs")
    refinements = relationship("RecommendationRefinement", back_populates="analysis_run", cascade="all, delete-orphan")


class RecommendationRefinement(Base):
    __tablename__ = "recommendation_refinements"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    analysis_run_id = Column(Integer, ForeignKey("analysis_runs.id", ondelete="CASCADE"), nullable=False, index=True)
    actor_user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    selected_scenario_number = Column(Integer, nullable=False)
    title = Column(String(300), nullable=False)
    summary = Column(Text, nullable=False)
    rationale = Column(Text, nullable=False)
    feedback = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), nullable=False, default=utc_now)

    analysis_run = relationship("AnalysisRun", back_populates="refinements")


class KnowledgeSubmission(Base):
    """User-contributed institutional knowledge awaiting human review."""

    __tablename__ = "knowledge_submissions"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    organization_id = Column(Integer, ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True)
    submitted_by_user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    scenario_key = Column(String(100), nullable=False, index=True)
    contributor_role = Column(String(100), nullable=False)
    answers = Column(JSON, nullable=False)
    source_name = Column(String(255), nullable=True)
    source_date = Column(String(30), nullable=True)
    consent_to_review = Column(Boolean, nullable=False)
    status = Column(String(20), nullable=False, default="pending", index=True)
    created_at = Column(DateTime(timezone=True), nullable=False, default=utc_now)


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    organization_id = Column(Integer, ForeignKey("organizations.id", ondelete="SET NULL"), nullable=True, index=True)
    actor_user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    decision_id = Column(Integer, ForeignKey("decisions.id", ondelete="SET NULL"), nullable=True, index=True)
    action = Column(String(100), nullable=False)
    resource_type = Column(String(100), nullable=False)
    resource_id = Column(String(100), nullable=True)
    details = Column(JSON, nullable=False, default=dict)
    created_at = Column(DateTime(timezone=True), nullable=False, default=utc_now, index=True)

    organization = relationship("Organization", back_populates="audit_logs")
    actor = relationship("User", back_populates="audit_logs")
    decision = relationship("Decision", back_populates="audit_logs")
