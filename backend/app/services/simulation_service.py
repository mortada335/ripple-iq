"""
RippleIQ Simulation Service
===========================
Orchestrates simulation execution by delegating to the deterministic AI Mock Analyzer,
persisting the resulting stakeholders, scenarios, impacts, and recommendations,
and returning structured simulation outputs.
"""

import sys
from datetime import UTC, datetime
from pathlib import Path
from typing import Any

from sqlalchemy.orm import Session

# Ensure project root is available for ai package import
_project_root = Path(__file__).resolve().parent.parent.parent.parent
if str(_project_root) not in sys.path:
    sys.path.insert(0, str(_project_root))

from app.models.models import (
    ContextData,
    Decision,
    Impact,
    Recommendation,
    Risk,
    Scenario,
    Stakeholder,
)
from app.schemas.schemas import (
    ConfidenceResponse,
    ImpactResponse,
    RecommendationResponse,
    RiskResponse,
    ScenarioResponse,
    SimulateResponse,
    SimulationResultResponse,
    StakeholderResponse,
)

from ai.mock_analyzer import SimulationResultData, default_mock_analyzer


class SimulationService:
    @staticmethod
    def run_simulation(db: Session, decision_id: int) -> SimulateResponse:
        decision = db.query(Decision).filter(Decision.id == decision_id).first()
        if not decision:
            raise ValueError(f"Decision with ID {decision_id} not found.")

        # Gather context data if available
        context_record = db.query(ContextData).filter(ContextData.decision_id == decision_id).first()
        context_dict: dict[str, Any] = {}
        if context_record:
            if context_record.student_population is not None:
                context_dict["student_population"] = context_record.student_population
            if context_record.faculty_count is not None:
                context_dict["faculty_count"] = context_record.faculty_count
            if context_record.active_laboratories is not None:
                context_dict["active_laboratories"] = context_record.active_laboratories
            if context_record.transit_dependency_rate is not None:
                context_dict["transit_dependency_rate"] = context_record.transit_dependency_rate
            if context_record.key_assumptions:
                context_dict["key_assumptions"] = context_record.key_assumptions
            if context_record.constraints:
                context_dict["constraints"] = context_record.constraints

        # Execute deterministic AI simulation
        sim_data: SimulationResultData = default_mock_analyzer.analyze(
            title=decision.title,
            description=decision.description,
            context=context_dict,
        )

        # Clear any prior simulation run data for this decision to prevent duplication
        db.query(Recommendation).filter(Recommendation.decision_id == decision_id).delete()
        db.query(Risk).filter(Risk.decision_id == decision_id).delete()
        db.query(Stakeholder).filter(Stakeholder.decision_id == decision_id).delete()
        # Deleting scenarios also cascades to impacts
        db.query(Scenario).filter(Scenario.decision_id == decision_id).delete()
        db.flush()

        # 1. Insert Stakeholders
        for s in sim_data.stakeholders:
            stakeholder = Stakeholder(
                decision_id=decision_id,
                key=s.key,
                name=s.name,
                category=s.category,
                summary=s.summary,
            )
            db.add(stakeholder)

        # 2. Insert Scenarios and map impacts
        scenario_model_map: dict[int, Scenario] = {}
        for sc in sim_data.scenarios:
            scenario = Scenario(
                decision_id=decision_id,
                scenario_number=sc.scenario_number,
                title=sc.title,
                description=sc.description,
                feasibility_score=sc.feasibility_score,
                is_recommended=sc.is_recommended,
                tradeoff_summary=sc.tradeoff_summary,
            )
            db.add(scenario)
            db.flush()
            scenario_model_map[sc.scenario_number] = scenario

        # 3. Insert Impacts
        for imp in sim_data.impacts:
            linked_scenario = scenario_model_map.get(imp.scenario_number)
            if linked_scenario:
                impact = Impact(
                    scenario_id=linked_scenario.id,
                    stakeholder_key=imp.stakeholder_key,
                    category=imp.category,
                    direction=imp.direction,
                    magnitude=imp.magnitude,
                    description=imp.description,
                    metric_estimate=imp.metric_estimate,
                )
                db.add(impact)

        # 4. Insert Risks
        for r in sim_data.risks:
            risk = Risk(
                decision_id=decision_id,
                title=r.title,
                severity=r.severity,
                likelihood=r.likelihood,
                affected_stakeholders=r.affected_stakeholders,
                mitigation_strategy=r.mitigation_strategy,
            )
            db.add(risk)

        # 5. Insert Recommendation
        if sim_data.recommendation:
            rec = Recommendation(
                decision_id=decision_id,
                selected_scenario_number=sim_data.recommendation.selected_scenario_number,
                title=sim_data.recommendation.title,
                summary=sim_data.recommendation.summary,
                rationale=sim_data.recommendation.rationale,
                confidence_score=sim_data.confidence.score,
                confidence_level=sim_data.confidence.level,
                assumptions=sim_data.assumptions,
                limitations=sim_data.limitations,
                human_review_required=True,
            )
            db.add(rec)

        decision.status = "SIMULATED"
        db.commit()

        now = datetime.now(UTC)
        return SimulateResponse(
            decision_id=decision_id,
            status="COMPLETED",
            message=f"Simulation executed successfully across {len(sim_data.stakeholders)} stakeholder groups and {len(sim_data.scenarios)} scenarios.",
            simulated_at=now,
        )

    @staticmethod
    def get_simulation_result(db: Session, decision_id: int) -> SimulationResultResponse:
        decision = db.query(Decision).filter(Decision.id == decision_id).first()
        if not decision:
            raise ValueError(f"Decision with ID {decision_id} not found.")

        recommendation = db.query(Recommendation).filter(Recommendation.decision_id == decision_id).first()
        if not recommendation:
            raise KeyError(f"Simulation has not yet been executed for decision {decision_id}. Call /simulate first.")

        stakeholders_db = db.query(Stakeholder).filter(Stakeholder.decision_id == decision_id).all()
        scenarios_db = (
            db.query(Scenario).filter(Scenario.decision_id == decision_id).order_by(Scenario.scenario_number).all()
        )
        risks_db = db.query(Risk).filter(Risk.decision_id == decision_id).all()

        scenario_ids = [s.id for s in scenarios_db]
        impacts_db = db.query(Impact).filter(Impact.scenario_id.in_(scenario_ids)).all() if scenario_ids else []

        # Map scenario_id back to scenario_number for each impact
        sc_id_to_num = {s.id: s.scenario_number for s in scenarios_db}

        impact_responses: list[ImpactResponse] = [
            ImpactResponse(
                stakeholder_key=i.stakeholder_key,
                scenario_number=sc_id_to_num.get(i.scenario_id, 1),
                category=i.category,
                direction=i.direction,
                magnitude=i.magnitude,
                description=i.description,
                metric_estimate=i.metric_estimate,
            )
            for i in impacts_db
        ]

        return SimulationResultResponse(
            decision_id=decision.id,
            decision_title=decision.title,
            is_estimate=True,
            human_review_required=True,
            confidence=ConfidenceResponse(
                score=recommendation.confidence_score,
                level=recommendation.confidence_level,
                rationale="High confidence based on structured operational context and verified university scheduling precedents.",
            ),
            stakeholders=[
                StakeholderResponse(
                    key=s.key,
                    name=s.name,
                    category=s.category,
                    summary=s.summary,
                )
                for s in stakeholders_db
            ],
            scenarios=[
                ScenarioResponse(
                    scenario_number=sc.scenario_number,
                    title=sc.title,
                    description=sc.description,
                    feasibility_score=sc.feasibility_score,
                    is_recommended=sc.is_recommended,
                    tradeoff_summary=sc.tradeoff_summary,
                )
                for sc in scenarios_db
            ],
            impacts=impact_responses,
            risks=[
                RiskResponse(
                    title=r.title,
                    severity=r.severity,
                    likelihood=r.likelihood,
                    affected_stakeholders=r.affected_stakeholders or [],
                    mitigation_strategy=r.mitigation_strategy,
                )
                for r in risks_db
            ],
            assumptions=recommendation.assumptions or [],
            limitations=recommendation.limitations or [],
            recommendation=RecommendationResponse(
                selected_scenario_number=recommendation.selected_scenario_number,
                title=recommendation.title,
                summary=recommendation.summary,
                rationale=recommendation.rationale,
            ),
        )
