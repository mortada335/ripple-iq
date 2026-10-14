"""Human review and refinement of persisted recommendations."""

from sqlalchemy.orm import Session

from ai.schemas import AnalysisResult
from app.models.models import AnalysisRun, Decision, RecommendationRefinement
from app.schemas.schemas import (
    RecommendationRefinementResponse,
    RecommendationRefineRequest,
    RecommendationResponse,
    RecommendationViewResponse,
)
from app.services.audit_service import record_audit_event


class RecommendationService:
    @staticmethod
    def get_recommendation(db: Session, decision_id: int) -> RecommendationViewResponse:
        run = RecommendationService._latest_completed_run(db, decision_id)
        result = AnalysisResult.model_validate(run.result_json)
        original = RecommendationResponse(**result.recommendation.model_dump())
        refinement = (
            db.query(RecommendationRefinement)
            .filter(RecommendationRefinement.analysis_run_id == run.id)
            .order_by(RecommendationRefinement.created_at.desc(), RecommendationRefinement.id.desc())
            .first()
        )
        if refinement is None:
            return RecommendationViewResponse(decision_id=decision_id, original=original, current=original)
        current = RecommendationResponse(
            selected_scenario_number=refinement.selected_scenario_number,
            title=refinement.title,
            summary=refinement.summary,
            rationale=refinement.rationale,
        )
        return RecommendationViewResponse(
            decision_id=decision_id,
            original=original,
            current=current,
            refinement=RecommendationRefinementResponse.model_validate(refinement),
        )

    @staticmethod
    def refine(
        db: Session,
        decision: Decision,
        actor_user_id: int,
        request: RecommendationRefineRequest,
    ) -> RecommendationViewResponse:
        run = RecommendationService._latest_completed_run(db, decision.id)
        result = AnalysisResult.model_validate(run.result_json)
        feedback = request.feedback.strip()
        if len(feedback) < 3:
            raise ValueError("Feedback must contain at least three non-space characters.")
        scenario_number = request.selected_scenario_number or result.recommendation.selected_scenario_number
        scenario = next((item for item in result.scenarios if item.scenario_number == scenario_number), None)
        if scenario is None:
            raise ValueError("The selected scenario is not part of the completed analysis.")

        refinement = RecommendationRefinement(
            analysis_run_id=run.id,
            actor_user_id=actor_user_id,
            selected_scenario_number=scenario_number,
            title=scenario.title,
            summary=f"Human-reviewed option: {scenario.title}. {scenario.tradeoff_summary}",
            rationale=(
                f"Original analysis rationale: {result.recommendation.rationale}\n\n"
                f"Human review feedback to consider: {feedback}"
            ),
            feedback=feedback,
        )
        db.add(refinement)
        db.flush()
        if decision.organization_id is not None:
            record_audit_event(
                db,
                organization_id=decision.organization_id,
                actor_user_id=actor_user_id,
                decision_id=decision.id,
                action="recommendation.refined",
                resource_type="recommendation_refinement",
                resource_id=refinement.id,
                details={"selected_scenario_number": scenario_number},
            )
        db.commit()
        db.refresh(refinement)
        return RecommendationService.get_recommendation(db, decision.id)

    @staticmethod
    def _latest_completed_run(db: Session, decision_id: int) -> AnalysisRun:
        run = (
            db.query(AnalysisRun)
            .filter(AnalysisRun.decision_id == decision_id)
            .order_by(AnalysisRun.created_at.desc(), AnalysisRun.id.desc())
            .first()
        )
        if run is None or run.status != "completed" or run.result_json is None:
            raise ValueError("A completed analysis is required before retrieving a recommendation.")
        return run
