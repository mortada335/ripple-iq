"""
RippleIQ — Deterministic Mock Analyzer
======================================
Rule-based simulation engine providing deterministic decision impact analysis
for higher education administration.

Key Characteristics:
- Pure Python, zero external API keys or LLM calls required.
- Fully deterministic and reproducible.
- Clearly marked as an estimate (is_estimate = True).
- Mandatory human review enforcement (human_review_required = True).
"""

from dataclasses import asdict, dataclass, field
from typing import Any, ClassVar


@dataclass
class StakeholderData:
    key: str
    name: str
    category: str
    summary: str


@dataclass
class ScenarioData:
    scenario_number: int
    title: str
    description: str
    feasibility_score: float
    is_recommended: bool
    tradeoff_summary: str


@dataclass
class ImpactData:
    stakeholder_key: str
    scenario_number: int
    category: str
    direction: str  # POSITIVE | NEGATIVE | NEUTRAL
    magnitude: str  # LOW | MEDIUM | HIGH
    description: str
    metric_estimate: str | None = None


@dataclass
class RiskData:
    title: str
    severity: str  # CRITICAL | HIGH | MEDIUM | LOW
    likelihood: str  # HIGH | MEDIUM | LOW
    affected_stakeholders: list[str]
    mitigation_strategy: str


@dataclass
class RecommendationData:
    selected_scenario_number: int
    title: str
    summary: str
    rationale: str


@dataclass
class ConfidenceData:
    score: float
    level: str  # HIGH | MODERATE | LOW
    rationale: str


@dataclass
class SimulationResultData:
    decision_title: str
    is_estimate: bool = True
    human_review_required: bool = True
    confidence: ConfidenceData = field(
        default_factory=lambda: ConfidenceData(0.82, "HIGH", "Determined via baseline rules")
    )
    stakeholders: list[StakeholderData] = field(default_factory=list)
    scenarios: list[ScenarioData] = field(default_factory=list)
    impacts: list[ImpactData] = field(default_factory=list)
    risks: list[RiskData] = field(default_factory=list)
    assumptions: list[str] = field(default_factory=list)
    limitations: list[str] = field(default_factory=list)
    recommendation: RecommendationData | None = None

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


class MockAnalyzer:
    """
    Deterministic Mock Analyzer for RippleIQ decision simulations.
    Produces structured, audit-ready impact scenarios for higher education policy proposals.
    """

    DEMO_DECISION_TRIGGER_KEYWORDS: ClassVar[list[str]] = [
        "attendance",
        "four days",
        "4 days",
        "five days",
        "5 days",
        "in-person",
        "reduce in-person",
    ]

    def is_demo_university_decision(self, title: str, description: str | None = None) -> bool:
        combined = f"{title} {description or ''}".lower()
        return any(keyword in combined for keyword in self.DEMO_DECISION_TRIGGER_KEYWORDS)

    def analyze(
        self,
        title: str,
        description: str | None = None,
        context: dict[str, Any] | None = None,
    ) -> SimulationResultData:
        """
        Executes deterministic simulation on the decision and context.
        """
        if self.is_demo_university_decision(title, description):
            return self._analyze_demo_decision(title, description, context)
        return self._analyze_generic_university_decision(title, description, context)

    def _analyze_demo_decision(
        self,
        title: str,
        description: str | None = None,
        context: dict[str, Any] | None = None,
    ) -> SimulationResultData:
        """
        Specialized deterministic simulation for the university attendance demo decision:
        'Reduce in-person university attendance from five days to four days per week.'
        """
        context = context or {}
        student_pop = context.get("student_population", 28000)
        labs_count = context.get("active_laboratories", 85)
        transit_pct = context.get("transit_dependency_rate", 68.5)

        stakeholders = [
            StakeholderData(
                key="students",
                name="Students",
                category="ACADEMIC",
                summary=f"Impacted across {student_pop:,} enrolled students by schedule compression, transit savings (affecting ~{transit_pct}% commuters), and altered weekly study rhythms.",
            ),
            StakeholderData(
                key="faculty",
                name="Faculty & Instructors",
                category="ACADEMIC",
                summary="Impacted by intensive 4-day instructional load, revised office hours, and consolidated research time.",
            ),
            StakeholderData(
                key="laboratories",
                name="Laboratories & Research Teams",
                category="OPERATIONAL",
                summary=f"Severely vulnerable across {labs_count} continuous experimental facilities requiring uninterrupted daily environmental controls and protocol maintenance.",
            ),
            StakeholderData(
                key="administration",
                name="Administration & Facilities",
                category="OPERATIONAL",
                summary="Impacted by campus energy savings, classroom reassignment complexity, and service contract renegotiations.",
            ),
            StakeholderData(
                key="transportation",
                name="Transportation & Parking",
                category="COMMUNITY",
                summary="Impacted by 20% reduction in weekly peak-hour commuting load, shuttle route rescheduling, and lost parking permit revenue.",
            ),
        ]

        scenarios = [
            ScenarioData(
                scenario_number=1,
                title="Apply the decision as written",
                description="Apply direct institutional compression of campus operations into Monday through Thursday. Campus facilities closed Friday through Sunday.",
                feasibility_score=0.65,
                is_recommended=False,
                tradeoff_summary="Maximizes campus-wide energy and commute savings but creates acute operational jeopardy for continuous scientific research laboratories.",
            ),
            ScenarioData(
                scenario_number=2,
                title="Apply a modified version that protects laboratories",
                description="Compress classroom lecture courses to a 4-day block (Monday through Thursday) while granting explicit full operational exemptions and dedicated support staff for wet research laboratories, clinical suites, and graduate research facilities.",
                feasibility_score=0.88,
                is_recommended=True,
                tradeoff_summary="Captures ~80% of energy and commuting gains while safeguarding multimillion-dollar sponsored research grants and continuous biological cultures.",
            ),
            ScenarioData(
                scenario_number=3,
                title="Run a limited pilot first",
                description="Pilot the 4-day attendance model within a single academic division (e.g., Faculty of Humanities and Social Sciences) for one academic semester prior to campus-wide rollout.",
                feasibility_score=0.78,
                is_recommended=False,
                tradeoff_summary="Lowest systemic risk and provides empirical institutional data, but creates inter-faculty scheduling conflicts and dual campus operating overhead during the trial.",
            ),
        ]

        impacts = [
            ImpactData(
                stakeholder_key="students",
                scenario_number=1,
                category="FINANCIAL",
                direction="POSITIVE",
                magnitude="HIGH",
                description="Estimated 20% weekly reduction in commuting transit and fuel expenses for student commuters.",
                metric_estimate="~$350 saved per commuter student annually",
            ),
            ImpactData(
                stakeholder_key="students",
                scenario_number=1,
                category="ACADEMIC",
                direction="NEGATIVE",
                magnitude="MEDIUM",
                description="Daily fatigue increased due to lengthened lecture durations and congested 4-day timetables.",
                metric_estimate="+45 mins instructional time per day",
            ),
            ImpactData(
                stakeholder_key="laboratories",
                scenario_number=1,
                category="OPERATIONAL",
                direction="NEGATIVE",
                magnitude="HIGH",
                description="Risk of continuous cell culture and specimen loss due to restricted Friday facility access.",
                metric_estimate="Severe threat to active sponsored grants",
            ),
            ImpactData(
                stakeholder_key="laboratories",
                scenario_number=2,
                category="OPERATIONAL",
                direction="POSITIVE",
                magnitude="HIGH",
                description="Continuous lab continuity and animal care maintained via targeted lab exemption protocol.",
                metric_estimate="100% compliance with biosafety protocols",
            ),
            ImpactData(
                stakeholder_key="administration",
                scenario_number=2,
                category="FINANCIAL",
                direction="POSITIVE",
                magnitude="MEDIUM",
                description="Campus HVAC, chilled water, and lighting power reductions on non-lab buildings on Fridays.",
                metric_estimate="~14-17% reduction in campus utility costs",
            ),
            ImpactData(
                stakeholder_key="transportation",
                scenario_number=2,
                category="LOGISTICS",
                direction="POSITIVE",
                magnitude="HIGH",
                description="20% drop in Friday peak vehicular congestion and reduced demand on shuttle fleets.",
                metric_estimate="~18% decrease in local arterial traffic",
            ),
            ImpactData(
                stakeholder_key="faculty",
                scenario_number=2,
                category="ACADEMIC",
                direction="POSITIVE",
                magnitude="MEDIUM",
                description="Designated Friday block provides unbroken time for research, grant writing, and grading.",
                metric_estimate="+6 hours uninterrupted scholarship per week",
            ),
            ImpactData(
                stakeholder_key="administration",
                scenario_number=3,
                category="LOGISTICS",
                direction="NEGATIVE",
                magnitude="MEDIUM",
                description="Split operational model requires running dual facility schedules across different departments.",
                metric_estimate="Administrative scheduling friction",
            ),
        ]

        risks = [
            RiskData(
                title="Continuous Research Experiment Interruption",
                severity="CRITICAL",
                likelihood="HIGH",
                affected_stakeholders=["laboratories", "faculty"],
                mitigation_strategy="Establish explicit laboratory access exemptions and automated 24/7 researcher keycard access.",
            ),
            RiskData(
                title="Instructional Schedule Overcrowding",
                severity="MEDIUM",
                likelihood="HIGH",
                affected_stakeholders=["students", "faculty"],
                mitigation_strategy="Extend daily instructional bands into early evening and implement automated conflict-free block scheduling.",
            ),
            RiskData(
                title="Auxiliary & Dining Service Hourly Wage Loss",
                severity="HIGH",
                likelihood="MEDIUM",
                affected_stakeholders=["students", "administration"],
                mitigation_strategy="Reallocate hourly campus student workers to asynchronous administrative, maintenance, or peer tutoring roles on Fridays.",
            ),
            RiskData(
                title="Accreditation Contact Hour Non-Compliance",
                severity="HIGH",
                likelihood="LOW",
                affected_stakeholders=["faculty", "administration"],
                mitigation_strategy="Audit all course syllabi to confirm instructional minutes meet regional accreditation thresholds before term begins.",
            ),
        ]

        assumptions = [
            "Regional academic accreditation bodies accept 4-day condensed instructional minute configurations.",
            "Municipal transit networks maintain standard peak frequency on compressed instructional days (Mon-Thu).",
            "Campus learning management system (LMS) and cloud infrastructure can support peak Friday remote activity.",
            "Continuous wet laboratories can be operated independently of general campus classroom HVAC zones.",
        ]

        limitations = [
            "Model does not account for unionized faculty collective bargaining agreements currently under negotiation.",
            "Municipal road construction projects outside university perimeter are not integrated into transit estimates.",
            "Impact on intercollegiate athletic training and competition travel schedules requires separate review.",
        ]

        recommendation = RecommendationData(
            selected_scenario_number=2,
            title="Adopt Modified 4-Day Model with Laboratory and Clinical Exemptions (Scenario 2)",
            summary="Proceed with Scenario 2: Compress general lecture courses into a 4-day block (Monday through Thursday) with Friday designated for asynchronous study, while granting full operational exemption and dedicated staffing for research laboratories and clinical facilities.",
            rationale="Scenario 2 achieves 88% of intended energy, commuting, and student satisfaction benefits while completely mitigating the critical risk of research grant disruption and experiment spoilage that would occur under Scenario 1.",
        )

        confidence = ConfidenceData(
            score=0.82,
            level="HIGH",
            rationale="High confidence based on structured operational context, high enrollment data completeness, and verified higher-education scheduling precedents.",
        )

        return SimulationResultData(
            decision_title=title,
            is_estimate=True,
            human_review_required=True,
            confidence=confidence,
            stakeholders=stakeholders,
            scenarios=scenarios,
            impacts=impacts,
            risks=risks,
            assumptions=assumptions,
            limitations=limitations,
            recommendation=recommendation,
        )

    def _analyze_generic_university_decision(
        self,
        title: str,
        description: str | None = None,
        context: dict[str, Any] | None = None,
    ) -> SimulationResultData:
        """
        Deterministic fallback analysis for arbitrary university policy proposals.
        """
        context = context or {}
        stakeholders = [
            StakeholderData(
                key="students",
                name="Students",
                category="ACADEMIC",
                summary="Primary recipient of curriculum delivery, campus experience, and learning outcomes.",
            ),
            StakeholderData(
                key="faculty",
                name="Faculty & Academic Staff",
                category="ACADEMIC",
                summary="Directly responsible for academic delivery, research productivity, and governance.",
            ),
            StakeholderData(
                key="administration",
                name="Administration & Operations",
                category="OPERATIONAL",
                summary="Tasked with budgetary management, policy enforcement, and infrastructure maintenance.",
            ),
            StakeholderData(
                key="laboratories",
                name="Research & Laboratory Facilities",
                category="OPERATIONAL",
                summary="Scientific and specialized facilities subject to physical access and compliance requirements.",
            ),
            StakeholderData(
                key="community",
                name="Surrounding Community & Transit",
                category="COMMUNITY",
                summary="Impacted by campus traffic flows, regional economic activity, and service coordination.",
            ),
        ]

        scenarios = [
            ScenarioData(
                scenario_number=1,
                title="Apply the decision as written",
                description=f"Direct implementation of '{title}' across all institutional divisions without procedural modifications.",
                feasibility_score=0.62,
                is_recommended=False,
                tradeoff_summary="Immediate execution with rapid intended policy outcomes, but elevated risk of operational resistance.",
            ),
            ScenarioData(
                scenario_number=2,
                title="Apply a phased transition with stakeholder exemptions",
                description=f"Implement '{title}' with explicit protective carve-outs for critical research, clinical, and vulnerable student units.",
                feasibility_score=0.84,
                is_recommended=True,
                tradeoff_summary="Balances policy intent with stakeholder protection, minimizing severe second-order disruptions.",
            ),
            ScenarioData(
                scenario_number=3,
                title="Run a limited pilot first",
                description=f"Deploy '{title}' on a trial basis within one representative academic division for an initial evaluation semester.",
                feasibility_score=0.76,
                is_recommended=False,
                tradeoff_summary="Gathers empirical governance data with minimal downside, but prolongs full policy realization.",
            ),
        ]

        impacts = [
            ImpactData(
                stakeholder_key="students",
                scenario_number=1,
                category="ACADEMIC",
                direction="POSITIVE",
                magnitude="MEDIUM",
                description="Initial policy alignment begins across primary student cohorts.",
            ),
            ImpactData(
                stakeholder_key="faculty",
                scenario_number=1,
                category="OPERATIONAL",
                direction="NEGATIVE",
                magnitude="MEDIUM",
                description="Requires immediate adaptation of teaching and administrative schedules.",
            ),
            ImpactData(
                stakeholder_key="administration",
                scenario_number=2,
                category="FINANCIAL",
                direction="POSITIVE",
                magnitude="MEDIUM",
                description="Controlled operational budget utilization through phased rollout.",
            ),
            ImpactData(
                stakeholder_key="laboratories",
                scenario_number=2,
                category="OPERATIONAL",
                direction="POSITIVE",
                magnitude="HIGH",
                description="Protective exemptions prevent operational research bottlenecks.",
            ),
        ]

        risks = [
            RiskData(
                title="Stakeholder Adoption Friction",
                severity="HIGH",
                likelihood="MEDIUM",
                affected_stakeholders=["faculty", "students"],
                mitigation_strategy="Conduct structured town hall consultations and issue clear transition guidelines 60 days before launch.",
            ),
            RiskData(
                title="Operational Resource Misallocation",
                severity="MEDIUM",
                likelihood="MEDIUM",
                affected_stakeholders=["administration"],
                mitigation_strategy="Establish bi-weekly administrative milestone reviews during initial 90 days.",
            ),
        ]

        assumptions = [
            "Institutional governance body grants preliminary policy approval.",
            "Necessary digital infrastructure and staffing are in place to support transition.",
        ]

        limitations = [
            "Institutional historical precedent data is based on estimated sector baselines.",
        ]

        recommendation = RecommendationData(
            selected_scenario_number=2,
            title="Adopt Phased Transition with Stakeholder Exemptions (Scenario 2)",
            summary=f"Implement '{title}' through a phased execution framework with designated stakeholder exemptions.",
            rationale="Protects essential research and student welfare while achieving core strategic policy goals.",
        )

        confidence = ConfidenceData(
            score=0.75,
            level="MODERATE",
            rationale="Moderate confidence based on heuristic higher-education policy models.",
        )

        return SimulationResultData(
            decision_title=title,
            is_estimate=True,
            human_review_required=True,
            confidence=confidence,
            stakeholders=stakeholders,
            scenarios=scenarios,
            impacts=impacts,
            risks=risks,
            assumptions=assumptions,
            limitations=limitations,
            recommendation=recommendation,
        )


# Global singleton instance for easy import
default_mock_analyzer = MockAnalyzer()
