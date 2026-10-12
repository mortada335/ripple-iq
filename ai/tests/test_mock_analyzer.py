"""
Unit tests for deterministic AI Mock Analyzer
"""

from ai.mock_analyzer import MockAnalyzer


def test_analyzer_demo_decision_stakeholders():
    analyzer = MockAnalyzer()
    decision_title = "Reduce in-person university attendance from five days to four days per week"
    context = {
        "student_population": 28000,
        "active_laboratories": 85,
        "transit_dependency_rate": 68.5,
    }

    result = analyzer.analyze(title=decision_title, context=context)

    # 1. Verify estimation and human review flags
    assert result.is_estimate is True
    assert result.human_review_required is True

    # 2. Verify exact 5 stakeholders
    stakeholder_keys = [s.key for s in result.stakeholders]
    assert "students" in stakeholder_keys
    assert "faculty" in stakeholder_keys
    assert "laboratories" in stakeholder_keys
    assert "administration" in stakeholder_keys
    assert "transportation" in stakeholder_keys
    assert len(result.stakeholders) == 5


def test_analyzer_demo_decision_scenarios():
    analyzer = MockAnalyzer()
    decision_title = "Reduce in-person university attendance from five days to four days per week"

    result = analyzer.analyze(title=decision_title)

    # Verify exactly 3 scenarios
    assert len(result.scenarios) == 3

    scenario_1 = result.scenarios[0]
    scenario_2 = result.scenarios[1]
    scenario_3 = result.scenarios[2]

    assert scenario_1.scenario_number == 1
    assert "Apply the decision as written" in scenario_1.title

    assert scenario_2.scenario_number == 2
    assert "protects laboratories" in scenario_2.title.lower()
    assert scenario_2.is_recommended is True

    assert scenario_3.scenario_number == 3
    assert "pilot" in scenario_3.title.lower()


def test_analyzer_determinism():
    """Verify that multiple consecutive runs with identical inputs return identical outputs."""
    analyzer = MockAnalyzer()
    decision_title = "Reduce in-person university attendance from five days to four days per week"
    context = {"student_population": 30000}

    run1 = analyzer.analyze(title=decision_title, context=context).to_dict()
    run2 = analyzer.analyze(title=decision_title, context=context).to_dict()

    assert run1 == run2


def test_analyzer_recommendation_and_risks():
    analyzer = MockAnalyzer()
    decision_title = "Reduce in-person university attendance from five days to four days per week"

    result = analyzer.analyze(title=decision_title)

    assert result.recommendation is not None
    assert result.recommendation.selected_scenario_number == 2
    assert len(result.risks) >= 3
    assert any("laboratory" in r.title.lower() or "experiment" in r.title.lower() for r in result.risks)
    assert len(result.assumptions) >= 3
    assert len(result.limitations) >= 2
    assert result.confidence.score > 0.7


def test_generic_decision_fallback():
    analyzer = MockAnalyzer()
    generic_title = "Implement campus-wide solar panel installation on student dormitories"

    result = analyzer.analyze(title=generic_title)

    assert result.is_estimate is True
    assert result.human_review_required is True
    assert len(result.scenarios) == 3
    assert len(result.stakeholders) >= 4
