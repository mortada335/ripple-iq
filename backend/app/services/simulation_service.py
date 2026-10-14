"""Run, persist, and retrieve decision analyses."""

from datetime import UTC, datetime
from typing import Any

from sqlalchemy.orm import Session

from ai.provider import DecisionAnalyzer, default_analyzer
from ai.schemas import AnalysisResult
from app.models.models import (
    AnalysisRun,
    ContextData,
    Decision,
    Impact,
    Recommendation,
    Risk,
    Scenario,
    Stakeholder,
)
from app.schemas.schemas import (
    AnalysisStatusResponse,
    ConfidenceResponse,
    ImpactResponse,
    RecommendationResponse,
    RiskResponse,
    ScenarioResponse,
    SimulateResponse,
    SimulationResultResponse,
    StakeholderResponse,
)
from app.services.audit_service import record_audit_event


class AnalysisExecutionError(Exception):
    """Safe public signal when a provider run fails."""


class SimulationService:
    @staticmethod
    def run_simulation(
        db: Session,
        decision_id: int,
        actor_user_id: int | None = None,
        analyzer: DecisionAnalyzer | None = None,
    ) -> SimulateResponse:
        decision = db.get(Decision, decision_id)
        if decision is None:
            raise ValueError(f"Decision with ID {decision_id} not found.")

        SimulationService._clear_persisted_artifacts(db, decision_id)
        run = AnalysisRun(decision_id=decision_id, status="pending")
        db.add(run)
        db.flush()
        run.status = "running"
        run.started_at = datetime.now(UTC)
        db.commit()
        run_id = run.id
        savepoint = db.begin_nested()

        try:
            analysis = (analyzer or default_analyzer).analyze(
                title=decision.title,
                description=decision.description,
                context=SimulationService._context_dict(db, decision_id),
            )
            analysis = AnalysisResult.model_validate(analysis)
            SimulationService._persist_legacy_records(db, decision, analysis)
            run = db.get(AnalysisRun, run_id)
            assert run is not None
            run.status = "completed"
            run.schema_version = analysis.schema_version
            run.result_json = analysis.model_dump(mode="json")
            run.error_code = None
            run.finished_at = datetime.now(UTC)
            decision.status = "SIMULATED"
            if actor_user_id is not None and decision.organization_id is not None:
                record_audit_event(
                    db,
                    organization_id=decision.organization_id,
                    actor_user_id=actor_user_id,
                    decision_id=decision.id,
                    action="decision.simulated",
                    resource_type="analysis",
                    resource_id=run.id,
                    details={"analysis_status": run.status, "schema_version": run.schema_version},
                )
            db.commit()
            return SimulateResponse(
                decision_id=decision_id,
                analysis_run_id=run_id,
                status="COMPLETED",
                analysis_status="completed",
                message=f"Analysis completed for {len(analysis.stakeholders)} stakeholder groups and 3 scenarios.",
                simulated_at=run.finished_at,
            )
        except Exception as error:
            savepoint.rollback()
            run = db.get(AnalysisRun, run_id)
            decision = db.get(Decision, decision_id)
            if run is not None:
                run.status = "failed"
                run.error_code = "ANALYSIS_FAILED"
                run.result_json = None
                run.finished_at = datetime.now(UTC)
            if decision is not None:
                decision.status = "ANALYSIS_FAILED"
                if actor_user_id is not None and decision.organization_id is not None:
                    record_audit_event(
                        db,
                        organization_id=decision.organization_id,
                        actor_user_id=actor_user_id,
                        decision_id=decision.id,
                        action="decision.analysis_failed",
                        resource_type="analysis",
                        resource_id=run_id,
                        details={"error_code": "ANALYSIS_FAILED"},
                    )
            db.commit()
            raise AnalysisExecutionError("Analysis could not be completed.") from error

    @staticmethod
    def retry_failed_analysis(db: Session, decision_id: int, actor_user_id: int | None = None) -> SimulateResponse:
        latest = SimulationService.latest_run(db, decision_id)
        if latest is None or latest.status != "failed":
            raise ValueError("Only a failed analysis can be retried.")
        return SimulationService.run_simulation(db, decision_id, actor_user_id=actor_user_id)

    @staticmethod
    def latest_run(db: Session, decision_id: int) -> AnalysisRun | None:
        return (
            db.query(AnalysisRun)
            .filter(AnalysisRun.decision_id == decision_id)
            .order_by(AnalysisRun.created_at.desc(), AnalysisRun.id.desc())
            .first()
        )

    @staticmethod
    def analysis_status(db: Session, decision_id: int) -> AnalysisStatusResponse:
        run = SimulationService.latest_run(db, decision_id)
        if run is None:
            return AnalysisStatusResponse(decision_id=decision_id, analysis_run_id=None, analysis_status="pending")
        return AnalysisStatusResponse(
            decision_id=decision_id,
            analysis_run_id=run.id,
            analysis_status=run.status,
            schema_version=run.schema_version,
            error_code=run.error_code,
            started_at=run.started_at,
            finished_at=run.finished_at,
        )

    @staticmethod
    def get_simulation_result(db: Session, decision_id: int) -> SimulationResultResponse:
        decision = db.get(Decision, decision_id)
        if decision is None:
            raise ValueError(f"Decision with ID {decision_id} not found.")
        run = SimulationService.latest_run(db, decision_id)
        if run is None or run.status != "completed" or run.result_json is None:
            raise KeyError("A completed analysis is not available for this decision.")
        analysis = AnalysisResult.model_validate(run.result_json)
        return SimulationResultResponse(
            decision_id=decision.id,
            decision_title=decision.title,
            schema_version=analysis.schema_version,
            analysis_status="completed",
            interpretation=analysis.interpretation.model_dump(),
            fairness=analysis.fairness.model_dump(),
            is_estimate=True,
            human_review_required=True,
            confidence=ConfidenceResponse(
                score=analysis.confidence,
                level=SimulationService._confidence_level(analysis.confidence),
                rationale=analysis.confidence_rationale,
            ),
            stakeholders=[StakeholderResponse(**item.model_dump()) for item in analysis.stakeholders],
            scenarios=[
                ScenarioResponse(
                    **item.model_dump(exclude={"score_components", "score_method"}),
                    score_components=item.score_components.model_dump(),
                    score_method=item.score_method,
                )
                for item in analysis.scenarios
            ],
            impacts=[ImpactResponse(**item.model_dump()) for item in analysis.impacts],
            risks=[RiskResponse(**item.model_dump()) for item in analysis.risks],
            assumptions=analysis.assumptions,
            limitations=analysis.limitations,
            recommendation=RecommendationResponse(**analysis.recommendation.model_dump()),
        )

    @staticmethod
    def _context_dict(db: Session, decision_id: int) -> dict[str, Any]:
        context = db.query(ContextData).filter(ContextData.decision_id == decision_id).first()
        if context is None:
            return {}
        return {
            key: value
            for key, value in {
                "student_population": context.student_population,
                "faculty_count": context.faculty_count,
                "active_laboratories": context.active_laboratories,
                "transit_dependency_rate": context.transit_dependency_rate,
                "key_assumptions": context.key_assumptions,
                "constraints": context.constraints,
                "raw_metadata": context.raw_metadata,
            }.items()
            if value is not None
        }

    @staticmethod
    def _persist_legacy_records(db: Session, decision: Decision, analysis: AnalysisResult) -> None:
        decision_id = decision.id
        for stakeholder in analysis.stakeholders:
            db.add(Stakeholder(decision_id=decision_id, **stakeholder.model_dump()))
        scenario_map: dict[int, Scenario] = {}
        for item in analysis.scenarios:
            scenario = Scenario(
                decision_id=decision_id,
                scenario_number=item.scenario_number,
                title=item.title,
                description=item.description,
                feasibility_score=item.feasibility_score,
                is_recommended=item.is_recommended,
                tradeoff_summary=item.tradeoff_summary,
            )
            db.add(scenario)
            db.flush()
            scenario_map[item.scenario_number] = scenario
        for impact in analysis.impacts:
            scenario = scenario_map[impact.scenario_number]
            db.add(Impact(scenario_id=scenario.id, **impact.model_dump(exclude={"scenario_number"})))
        for risk in analysis.risks:
            db.add(
                Risk(
                    decision_id=decision_id,
                    title=risk.title,
                    severity=risk.severity,
                    likelihood=risk.likelihood,
                    affected_stakeholders=risk.affected_stakeholders,
                    mitigation_strategy=risk.mitigation_strategy,
                )
            )
        db.add(
            Recommendation(
                decision_id=decision_id,
                selected_scenario_number=analysis.recommendation.selected_scenario_number,
                title=analysis.recommendation.title,
                summary=analysis.recommendation.summary,
                rationale=analysis.recommendation.rationale,
                confidence_score=analysis.confidence,
                confidence_level=SimulationService._confidence_level(analysis.confidence),
                assumptions=analysis.assumptions,
                limitations=analysis.limitations,
                human_review_required=True,
            )
        )

    @staticmethod
    def _clear_persisted_artifacts(db: Session, decision_id: int) -> None:
        scenario_ids = db.query(Scenario.id).filter(Scenario.decision_id == decision_id)
        db.query(Impact).filter(Impact.scenario_id.in_(scenario_ids)).delete(synchronize_session=False)
        db.query(Recommendation).filter(Recommendation.decision_id == decision_id).delete()
        db.query(Risk).filter(Risk.decision_id == decision_id).delete()
        db.query(Stakeholder).filter(Stakeholder.decision_id == decision_id).delete()
        db.query(Scenario).filter(Scenario.decision_id == decision_id).delete()
        db.flush()

    @staticmethod
    def _confidence_level(score: float) -> str:
        return "HIGH" if score >= 0.8 else "MODERATE" if score >= 0.55 else "LOW"
