# RippleIQ — AI Simulation Module

> **Package:** `ai`  
> **Primary Component:** `ai/mock_analyzer.py`  
> **Status:** Active MVP Implementation

---

## Overview

The `ai` package provides the decision intelligence simulation core for RippleIQ. For the MVP, it implements a deterministic, rule-based simulation engine (`MockAnalyzer`) rather than invoking external non-deterministic LLM APIs.

### Key Objectives
1. **Zero External Dependency:** Does not require OpenAI, Anthropic, or other third-party API keys or internet access.
2. **Reproducibility & Determinism:** Identical policy inputs yield identical scenario breakdowns and impact vectors, making automated regression testing fully deterministic.
3. **Safety & Governance Transparency:** Every simulation output is flagged with:
   - `is_estimate: true`
   - `human_review_required: true`
   - Explicit confidence scores, foundational assumptions, and analytical limitations.

---

## Demo Decision Specification

When presented with the canonical university policy proposal:
> *"Reduce in-person university attendance from five days to four days per week"*

The `MockAnalyzer` automatically surfaces:

### 1. The 5 Core Stakeholders
- `students` (schedule compression, commuting costs, mental health)
- `faculty` (curriculum pacing, office hour load, research flexibility)
- `laboratories` (continuous wet/dry experiment disruption, culture upkeep)
- `administration` (facility utilization, energy costs, scheduling complexity)
- `transportation` (shuttle dispatching, parking revenue, traffic congestion)

### 2. Three Comparative Scenarios
1. **Scenario 1 — Apply as written:** Direct institutional 4-day compression.
2. **Scenario 2 — Protect laboratories:** Modified hybrid model granting explicit exemptions for laboratory and clinical operations. *(Recommended)*
3. **Scenario 3 — Run a limited pilot first:** Semester-long pilot restricted to one academic faculty.

---

## Running AI Tests

To execute the unit tests for the mock analyzer independently:

```bash
pytest ai/tests/ -v
```

---

## Architecture for Future Real LLM Integration

The provider boundary is defined by `DecisionAnalyzer` in `ai/provider.py`.
The default `DeterministicMockProvider` returns the versioned Pydantic contract
in `ai/schemas.py` (`schema_version: 0.1.0`). Provider output is validated before
the application can persist or return it. No API key is needed.

Scenario scores expose implementation-feasibility, stakeholder-protection, and
reversibility components. The heuristic is `0.60 × feasibility + 0.30 ×
protection + 0.10 × reversibility`; these are qualitative estimates, not
measured outcomes. The schema also includes assumptions, limitations,
stakeholder impacts, risk probability/severity/mitigation, fairness review
questions, confidence, and the mandatory human-review flag.

When migrating beyond the MVP to real LLM engines (e.g. Gemini, Claude, GPT), adhere to the following adapter pattern:

1. Implement the `DecisionAnalyzer` protocol and return the validated `AnalysisResult` contract.
2. Implement an `LLMAnalyzer` conforming to the same interface:
   ```python
   class BaseAnalyzer(ABC):
       @abstractmethod
       def analyze(
           self, title: str, description: Optional[str] = None, context: Optional[dict] = None
       ) -> SimulationResultData: ...
   ```
3. Control the active analyzer via the `ANALYZER_BACKEND` environment variable (`mock_deterministic` vs `gemini` vs `claude`).
