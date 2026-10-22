"""Provider contract and deterministic mock implementation."""

from typing import Any, Protocol

from ai.mock_analyzer import MockAnalyzer
from ai.schemas import AnalysisResult, AnalysisRisk, AnalysisScenario, DecisionInterpretation, ScoreComponents


class DecisionAnalyzer(Protocol):
    def analyze(self, title: str, description: str | None, context: dict[str, Any]) -> AnalysisResult:
        """Return validated, versioned decision support analysis."""


_LIKELIHOOD_PROBABILITY = {"LOW": 0.2, "MEDIUM": 0.5, "HIGH": 0.8}
_SCORE_WEIGHTS = {
    "implementation_feasibility": 0.6,
    "stakeholder_protection": 0.3,
    "reversibility": 0.1,
}


def _scenario_key_changes(scenario: dict[str, Any]) -> list[str]:
    """Return clearly illustrative planning steps for deterministic mock results."""
    scenario_text = f"{scenario.get('title', '')} {scenario.get('description', '')}".casefold()
    if any(term in scenario_text for term in ("pilot", "trial", "limited rollout")):
        return [
            "Agree the pilot scope, success criteria, and review owner before starting.",
            "Collect baseline and follow-up measures that match the stated objectives.",
            "Review outcomes and risks with affected stakeholders before deciding whether to expand.",
        ]
    if any(term in scenario_text for term in ("exemption", "exception", "protect")):
        return [
            "Define eligible protections or exceptions from the supplied constraints and get owner approval.",
            "Assign responsible teams and communicate the approved process to affected groups.",
            "Monitor whether the protections work and review reported impacts after implementation.",
        ]
    return [
        "Confirm scope, affected groups, and implementation criteria with the decision owner.",
        "Assign responsible teams and communicate the approved change before implementation.",
        "Review outcomes and reported risks at agreed checkpoints; adjust if evidence warrants it.",
    ]


def _interpret_decision(title: str, description: str | None) -> DecisionInterpretation:
    source_text = f"{title} {description or ''}".strip()
    normalized = source_text.casefold()
    decision_type = next(
        (
            kind
            for kind, terms in (
                ("attendance", ("attendance", "in-person", "on-campus")),
                ("budget", ("budget", "cost", "spending", "tuition")),
                ("staffing", ("staff", "faculty hiring", "workforce")),
                ("facilities", ("facility", "facilities", "laborator", "building")),
                ("student_services", ("student service", "counseling", "advising", "housing")),
                ("technology", ("technology", "software", "platform", "digital")),
            )
            if any(term in normalized for term in terms)
        ),
        "academic_policy",
    )
    change_type = next(
        (
            action
            for action, terms in (
                ("reduce", ("reduce", "decrease", "cut", "lower")),
                ("increase", ("increase", "raise", "add more")),
                ("expand", ("expand", "broaden", "extend")),
                ("create", ("create", "establish", "introduce", "implement")),
                ("replace", ("replace", "repeal", "remove")),
                ("modify", ("modify", "change", "revise", "transition")),
            )
            if any(term in normalized for term in terms)
        ),
        "unspecified",
    )
    return DecisionInterpretation(
        decision_type=decision_type,
        change_type=change_type,
        subject=title.strip(),
        source_text=source_text[:1000],
    )


class DeterministicMockProvider:
    """Adapt the existing deterministic rules into the versioned provider contract."""

    def __init__(self, analyzer: MockAnalyzer | None = None) -> None:
        self.analyzer = analyzer or MockAnalyzer()

    def analyze(
        self, title: str, description: str | None = None, context: dict[str, Any] | None = None
    ) -> AnalysisResult:
        context = context or {}
        baseline = self.analyzer.analyze(title=title, description=description, context=context)
        raw = baseline.to_dict()

        scenario_protection = {1: 0.35, 2: 0.95, 3: 0.75}
        scenario_reversibility = {1: 0.3, 2: 0.65, 3: 0.95}
        scoring_method = (
            "Weighted heuristic: feasibility × 0.60 + stakeholder protection × 0.30 + "
            "reversibility × 0.10. Components are qualitative estimates, not measured outcomes."
        )
        scenarios = []
        for scenario in raw["scenarios"]:
            number = scenario["scenario_number"]
            feasibility = scenario["feasibility_score"]
            protection = scenario_protection[number]
            reversibility = scenario_reversibility[number]
            score = round(
                feasibility * _SCORE_WEIGHTS["implementation_feasibility"]
                + protection * _SCORE_WEIGHTS["stakeholder_protection"]
                + reversibility * _SCORE_WEIGHTS["reversibility"],
                3,
            )
            scenarios.append(
                AnalysisScenario(
                    **{
                        **scenario,
                        "feasibility_score": score,
                        "rationale": (
                            "This option is included to compare a distinct implementation path for the decision. "
                            "Its relative fit depends on the context and constraints supplied by the user. "
                            "The comparative score combines "
                            f"implementation feasibility ({feasibility:.2f}), stakeholder protection "
                            f"({protection:.2f}), and reversibility ({reversibility:.2f}) using weights "
                            "0.60, 0.30, and 0.10. These are qualitative estimates, not measured outcomes. "
                            f"Key trade-off: {scenario['tradeoff_summary']}"
                        ),
                        "key_changes": _scenario_key_changes(scenario),
                        "score_components": ScoreComponents(
                            implementation_feasibility=feasibility,
                            stakeholder_protection=protection,
                            reversibility=reversibility,
                        ),
                        "score_method": scoring_method,
                        "is_recommended": number == raw["recommendation"]["selected_scenario_number"],
                    }
                )
            )

        risks = [
            AnalysisRisk(
                **{
                    **risk,
                    "probability": _LIKELIHOOD_PROBABILITY[risk["likelihood"]],
                }
            )
            for risk in raw["risks"]
        ]
        transit_rate = context.get("transit_dependency_rate")
        fairness_concerns = [
            "Review schedule, accessibility, childcare, and employment constraints across different student groups."
        ]
        if transit_rate is not None:
            fairness_concerns.append(
                "Validate transit impacts for commuter students; the supplied dependency estimate may not represent all groups."
            )

        return AnalysisResult(
            interpretation=_interpret_decision(title, description),
            assumptions=raw["assumptions"],
            stakeholders=raw["stakeholders"],
            scenarios=scenarios,
            impacts=raw["impacts"],
            risks=risks,
            fairness={
                "potential_concerns": fairness_concerns,
                "affected_groups_to_review": ["students", "faculty", "staff", "commuters", "people with disabilities"],
                "note": "Fairness notes identify questions for human review and do not measure group outcomes.",
            },
            recommendation=raw["recommendation"],
            confidence=raw["confidence"]["score"],
            confidence_rationale=raw["confidence"]["rationale"],
            limitations=raw["limitations"],
        )


default_analyzer: DecisionAnalyzer = DeterministicMockProvider()


def create_configured_analyzer(settings: Any) -> DecisionAnalyzer:
    """Construct the configured provider chain without checking remote services at startup."""
    from ai.remote_providers import create_analyzer

    return create_analyzer(settings, DeterministicMockProvider())
