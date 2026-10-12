"""
RippleIQ Decision Service
=========================
Business logic for managing university decisions and attaching institutional context.
"""


from app.models.models import ContextData, Decision
from app.schemas.schemas import ContextDataCreate, DecisionCreate
from sqlalchemy.orm import Session


class DecisionService:
    @staticmethod
    def create_decision(db: Session, data: DecisionCreate) -> Decision:
        decision = Decision(
            title=data.title,
            description=data.description,
            department=data.department,
            time_horizon=data.time_horizon,
            priority=data.priority,
            status="DRAFT",
        )
        db.add(decision)
        db.commit()
        db.refresh(decision)
        return decision

    @staticmethod
    def get_decision(db: Session, decision_id: int) -> Decision | None:
        return db.query(Decision).filter(Decision.id == decision_id).first()

    @staticmethod
    def attach_context(db: Session, decision_id: int, data: ContextDataCreate) -> ContextData:
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
            db.commit()
            db.refresh(existing_context)
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
            if decision.status == "DRAFT":
                decision.status = "CONTEXT_ATTACHED"
            db.commit()
            db.refresh(context)

        return context

    @staticmethod
    def get_context(db: Session, decision_id: int) -> ContextData | None:
        return db.query(ContextData).filter(ContextData.decision_id == decision_id).first()
