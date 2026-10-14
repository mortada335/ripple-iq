"""
RippleIQ Decision Service
=========================
Business logic for managing university decisions and attaching institutional context.
"""

from app.models.models import AnalysisRun, ContextData, Decision, Impact, Recommendation, Risk, Scenario, Stakeholder
from app.schemas.schemas import ContextDataCreate, DecisionCreate, DecisionUpdate
from app.services.audit_service import record_audit_event
from sqlalchemy.orm import Session


class DecisionService:
    @staticmethod
    def create_decision(
        db: Session,
        data: DecisionCreate,
        organization_id: int | None = None,
        created_by_user_id: int | None = None,
    ) -> Decision:
        decision = Decision(
            organization_id=organization_id,
            created_by_user_id=created_by_user_id,
            title=data.title,
            description=data.description,
            decision_type=data.decision_type,
            department=data.department,
            time_horizon=data.time_horizon,
            priority=data.priority,
            status="DRAFT",
        )
        db.add(decision)
        db.flush()
        if organization_id is not None and created_by_user_id is not None:
            record_audit_event(
                db,
                organization_id=organization_id,
                actor_user_id=created_by_user_id,
                decision_id=decision.id,
                action="decision.created",
                resource_type="decision",
                resource_id=decision.id,
                details={"decision_type": decision.decision_type},
            )
        db.commit()
        db.refresh(decision)
        return decision

    @staticmethod
    def list_decisions(db: Session, organization_id: int, *, offset: int = 0, limit: int = 50) -> list[Decision]:
        return (
            db.query(Decision)
            .filter(Decision.organization_id == organization_id)
            .order_by(Decision.created_at.desc(), Decision.id.desc())
            .offset(offset)
            .limit(limit)
            .all()
        )

    @staticmethod
    def update_decision(
        db: Session,
        decision: Decision,
        data: DecisionUpdate,
        actor_user_id: int,
    ) -> Decision:
        changes = data.model_dump(exclude_unset=True)
        if not changes:
            raise ValueError("At least one decision field must be supplied.")
        if any(key in changes and changes[key] is None for key in ("title", "description", "decision_type")):
            raise ValueError("Title, description, and decision type cannot be null.")
        changed_fields = []
        for field, value in changes.items():
            if getattr(decision, field) != value:
                setattr(decision, field, value)
                changed_fields.append(field)
        if changed_fields:
            DecisionService._invalidate_simulation(db, decision.id)
            decision.status = "READY_FOR_ANALYSIS" if decision.context_data is not None else "DRAFT"
            record_audit_event(
                db,
                organization_id=decision.organization_id,
                actor_user_id=actor_user_id,
                decision_id=decision.id,
                action="decision.updated",
                resource_type="decision",
                resource_id=decision.id,
                details={"changed_fields": changed_fields},
            )
        db.commit()
        db.refresh(decision)
        return decision

    @staticmethod
    def archive_decision(db: Session, decision: Decision, actor_user_id: int) -> None:
        decision.status = "ARCHIVED"
        record_audit_event(
            db,
            organization_id=decision.organization_id,
            actor_user_id=actor_user_id,
            decision_id=decision.id,
            action="decision.archived",
            resource_type="decision",
            resource_id=decision.id,
        )
        db.commit()

    @staticmethod
    def get_decision(db: Session, decision_id: int) -> Decision | None:
        return db.query(Decision).filter(Decision.id == decision_id).first()

    @staticmethod
    def attach_context(
        db: Session,
        decision_id: int,
        data: ContextDataCreate,
        actor_user_id: int | None = None,
    ) -> ContextData:
        decision = db.query(Decision).filter(Decision.id == decision_id).first()
        if not decision:
            raise ValueError(f"Decision with ID {decision_id} not found.")

        # If context already exists, update it; otherwise create new
        existing_context = db.query(ContextData).filter(ContextData.decision_id == decision_id).first()
        if existing_context:
            existing_context.student_population = data.student_population
            existing_context.faculty_count = data.faculty_count
            existing_context.active_laboratories = data.active_laboratories
            existing_context.transit_dependency_rate = data.transit_dependency_rate
            existing_context.key_assumptions = data.key_assumptions
            existing_context.constraints = data.constraints
            existing_context.raw_metadata = data.raw_metadata
            action = "context.updated"
            context = existing_context
        else:
            context = ContextData(
                decision_id=decision_id,
                student_population=data.student_population,
                faculty_count=data.faculty_count,
                active_laboratories=data.active_laboratories,
                transit_dependency_rate=data.transit_dependency_rate,
                key_assumptions=data.key_assumptions,
                constraints=data.constraints,
                raw_metadata=data.raw_metadata,
            )
            db.add(context)
            action = "context.created"
        db.flush()
        decision.status = "READY_FOR_ANALYSIS"
        DecisionService._invalidate_simulation(db, decision_id)
        if actor_user_id is not None and decision.organization_id is not None:
            record_audit_event(
                db,
                organization_id=decision.organization_id,
                actor_user_id=actor_user_id,
                decision_id=decision_id,
                action=action,
                resource_type="context",
                resource_id=context.id,
            )
        db.commit()
        if not existing_context:
            db.refresh(context)
        return context

    @staticmethod
    def update_context(
        db: Session, context: ContextData, changes: dict[str, object], actor_user_id: int
    ) -> ContextData:
        if not changes:
            raise ValueError("At least one context field must be supplied.")
        for field, value in changes.items():
            if value is None and field in {"key_assumptions", "raw_metadata"}:
                raise ValueError(f"{field} cannot be null.")
            setattr(context, field, value)
        decision = context.decision
        decision.status = "READY_FOR_ANALYSIS"
        DecisionService._invalidate_simulation(db, decision.id)
        record_audit_event(
            db,
            organization_id=decision.organization_id,
            actor_user_id=actor_user_id,
            decision_id=decision.id,
            action="context.updated",
            resource_type="context",
            resource_id=context.id,
            details={"changed_fields": sorted(changes)},
        )
        db.commit()
        db.refresh(context)
        return context

    @staticmethod
    def delete_context(db: Session, context: ContextData, actor_user_id: int) -> None:
        decision = context.decision
        db.delete(context)
        decision.status = "DRAFT"
        DecisionService._invalidate_simulation(db, decision.id)
        record_audit_event(
            db,
            organization_id=decision.organization_id,
            actor_user_id=actor_user_id,
            decision_id=decision.id,
            action="context.deleted",
            resource_type="context",
            resource_id=context.id,
        )
        db.commit()

    @staticmethod
    def get_context(db: Session, decision_id: int) -> ContextData | None:
        return db.query(ContextData).filter(ContextData.decision_id == decision_id).first()

    @staticmethod
    def get_context_by_id(db: Session, context_id: int) -> ContextData | None:
        return db.get(ContextData, context_id)

    @staticmethod
    def _invalidate_simulation(db: Session, decision_id: int) -> None:
        db.query(AnalysisRun).filter(AnalysisRun.decision_id == decision_id).delete(synchronize_session=False)
        scenario_ids = db.query(Scenario.id).filter(Scenario.decision_id == decision_id)
        db.query(Impact).filter(Impact.scenario_id.in_(scenario_ids)).delete(synchronize_session=False)
        db.query(Recommendation).filter(Recommendation.decision_id == decision_id).delete(synchronize_session=False)
        db.query(Risk).filter(Risk.decision_id == decision_id).delete(synchronize_session=False)
        db.query(Stakeholder).filter(Stakeholder.decision_id == decision_id).delete(synchronize_session=False)
        db.query(Scenario).filter(Scenario.decision_id == decision_id).delete(synchronize_session=False)
