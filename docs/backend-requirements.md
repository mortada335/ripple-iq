# RippleIQ — Backend Requirements Specification (MVP)

## Implementation plan (2026-10-14)

### Repository baseline

- The existing frontend is in `frontend/` (identified from the root repository
  documentation and directory presence). It is outside the scope of backend
  changes; frontend files and configuration are not to be edited.
- Backend code is in `backend/app/`, with an existing SQLAlchemy model module,
  FastAPI endpoints, services, Alembic setup, and tests. The deterministic mock
  analyzer is in `ai/mock_analyzer.py`.
- The current implementation includes basic health, decision/context creation,
  simulation, result, and report flows. It does not yet provide registration,
  JWT authentication, organization memberships/roles, full decision/context
  CRUD, or persisted analysis lifecycle records.
- The current database helper creates tables at application startup and defaults
  to SQLite. The target is PostgreSQL with Alembic migrations; any SQLite use
  will be limited to isolated tests/development where appropriate.
- The repository already has `backend/full-mvp-implementation` checked out and
  a configured `origin` remote at `https://github.com/mortada335/ripple-iq`.

### Planned module structure

Preserve existing conventions and evolve the current modules instead of
duplicating them. Add only the modules needed to keep responsibilities clear:

```text
backend/app/
  main.py, config.py, database.py, dependencies.py
  api/v1/                 versioned routers (migrate existing endpoints safely)
  models/                 existing entities plus membership, audit, analysis
  schemas/                request/response and validated analysis schemas
  repositories/           organization-scoped persistence queries as needed
  services/               auth, organizations, decisions, simulation, reports
  ai/                     analyzer provider interface/adapter
  reports/                Markdown rendering helpers
  security/               password hashing and JWT helpers
backend/migrations/       retain existing Alembic layout unless migration
                          configuration requires a compatibility-safe move
backend/tests/            API, service, auth, isolation, and integration tests
ai/                       deterministic analyzer and its schemas/tests
docs/                     requirements, API, database, security, testing, progress
```

### Delivery phases

Implement in the requested sequence, with focused verification, documentation,
one phase commit, and a push before starting the next phase:

0. Record repository baseline and plan (documentation only).
1. Harden the FastAPI foundation, environment configuration, logging, CORS,
   common errors, and local setup instructions.
2. Complete PostgreSQL SQLAlchemy models and Alembic migrations.
3. Add registration/login, JWT, organization membership, roles, and access
   enforcement.
4. Add scoped decision/context CRUD and audit records.
5. Define versioned analysis schemas and deterministic provider interface.
6. Persist analysis lifecycle/results and expose scoped simulation endpoints.
7. Add recommendation/refinement and downloadable Markdown reports.
8. Review authorization, validation, errors, logging, and production basics.
9. Complete tests and API/setup documentation.
10. Perform clean-environment final verification and record its outcome.

### Decisions and known conflicts

- The target specification requires PostgreSQL, while current root/backend
  documentation describes SQLite as the default local runtime. PostgreSQL will
  become the documented runtime default; a test-only SQLite option may remain
  if it provides equivalent isolated test coverage.
- The current integer identifiers can remain if applied consistently; Phase 2
  will avoid an unnecessary ID migration unless existing relationships require
  one. Organization membership must become explicit, and data access must be
  scoped through that membership.
- Existing endpoint paths should be retained where compatible. New routes will
  follow the requested `/api/v1` paths and use common validation/error shapes.
- The configured GitHub remote is known, but authentication and remote write
  access must be verified by the first push. If unavailable, stop after the
  local phase commit and report the exact push command; do not change remotes.
- No product-scope decision is currently blocking Phase 0 or the planned MVP.

> **Document Version:** 1.0.0 (MVP)  
> **Status:** Approved for Implementation  
> **Target Audience:** Backend Engineers, System Architects, API Consumers  

---

## 1. System Overview & Architecture

RippleIQ backend is a high-reliability, deterministic decision intelligence service designed to model the cascading effects of strategic university administrative policies. 

### 1.1 Architectural Principles
- **Layered Clean Architecture:** Strict separation of API presentation (`app/api`), business logic and orchestration (`app/services`), data validation (`app/schemas`), database persistence (`app/models`), and the AI simulation engine (`ai/`).
- **Deterministic by Default:** In the MVP stage, simulations run through a reproducible, testable rule-based mock analyzer (`ai/mock_analyzer.py`), eliminating external API rate limits, non-determinism, and network failures.
- **Fail-Safe & Non-Destructive:** Missing or partial context gracefully falls back to sensible institutional baseline parameters.
- **Human-in-the-Loop Governance:** Every simulation result and generated report explicitly flags `human_review_required: true`.

```text
       ┌───────────────────────────────┐
       │     FastAPI Presentation      │
       │    (/api/v1/*, Swagger UI)    │
       └──────────────┬────────────────┘
                      │
       ┌──────────────▼────────────────┐
       │     Pydantic Schemas Layer    │
       │   (Strict I/O Validation)     │
       └──────────────┬────────────────┘
                      │
       ┌──────────────▼────────────────┐
       │        Services Layer         │
       │ (Decision, Sim, Report Svcs)  │
       └──────┬─────────────────┬──────┘
              │                 │
    ┌─────────▼────────┐   ┌────▼───────────────────────┐
    │  SQLAlchemy ORM  │   │  Deterministic AI Analyzer │
    │   Data Models    │   │     (ai/mock_analyzer.py)  │
    └─────────┬────────┘   └────────────────────────────┘
              │
    ┌─────────▼────────┐
    │  PostgreSQL /    │
    │  SQLite Engine   │
    └──────────────────┘
```

---

## 2. Core Domain Specifications

### 2.1 Decisions
- **Purpose:** Represents the core institutional policy or administrative decision under evaluation.
- **Key Attributes:**
  - `id`: UUID or Auto-increment Integer primary key.
  - `title`: Concise policy statement (e.g., *"Reduce in-person university attendance from five days to four days per week"*).
  - `description`: Detailed description of the proposed operational shift.
  - `status`: Enum (`DRAFT`, `CONTEXT_ATTACHED`, `SIMULATED`, `ARCHIVED`).
  - `department`: Originating governing unit (e.g., *"Office of the Provost"*).
  - `time_horizon`: Evaluation horizon (e.g., *"1 Academic Year"*).
  - `created_at`, `updated_at`: UTC timestamps.
- **Requirements:**
  - Must support idempotent creation via `POST /api/v1/decisions`.
  - Must reject empty or whitespace-only titles.
  - Must prevent duplicate re-simulation collisions.

---

### 2.2 Context Data
- **Purpose:** Anchors the simulation in specific institutional reality (e.g., student population, laboratory density, transit habits).
- **Key Attributes:**
  - `id`: Primary key.
  - `decision_id`: Foreign key reference to `Decision`.
  - `student_population`: Total enrolled student body count.
  - `faculty_count`: Total academic and adjunct faculty count.
  - `active_laboratories`: Number of wet/dry continuous research facilities.
  - `transit_dependency_rate`: Estimated percentage of students/staff dependent on transit/commuting.
  - `key_assumptions`: Array of explicit initial administrative assumptions.
  - `constraints`: Specific accreditation, legal, or physical bounds.
  - `raw_metadata`: Flexible JSON field for custom institutional indicators.
- **Requirements:**
  - Attachable via `POST /api/v1/decisions/{id}/context`.
  - Merges into the simulation pipeline to inform stakeholder impact magnitudes.

---

### 2.3 Stakeholders
- **Purpose:** Institutional groups impacted directly or indirectly by the decision.
- **Key Attributes:**
  - `id`: Primary key.
  - `decision_id`: Foreign key reference to `Decision`.
  - `key`: Normalized slug (e.g., `students`, `faculty`, `laboratories`, `administration`, `transportation`).
  - `name`: Human-readable name (e.g., *"Laboratory Researchers & PIs"*).
  - `category`: Classification (`ACADEMIC`, `OPERATIONAL`, `COMMUNITY`, `GOVERNANCE`).
  - `influence_level`: Estimated institutional influence (`HIGH`, `MEDIUM`, `LOW`).
  - `vulnerability_score`: Vulnerability to schedule disruption (Scale: 1-10).
- **Demo Decision Stakeholders:**
  For the demo decision, the engine must identify at minimum:
  1. **Students**
  2. **Faculty**
  3. **Laboratories**
  4. **Administration**
  5. **Transportation**

---

### 2.4 Scenarios
- **Purpose:** Alternative policy execution pathways generated by the simulation engine to provide comparative trade-offs.
- **Requirements:** The system must generate exactly **three alternative scenarios** for the decision:
  1. **Scenario 1 — Apply As Written:** Direct implementation of the 4-day compression across all university operations.
  2. **Scenario 2 — Protect Laboratories:** Modified implementation maintaining continuous laboratory and clinical operations while compressing standard classroom lectures.
  3. **Scenario 3 — Limited Pilot:** A bounded, single-semester pilot implemented in one or two selected faculties prior to campus-wide rollout.
- **Key Attributes:**
  - `id`: Primary key.
  - `decision_id`: Foreign key reference to `Decision`.
  - `scenario_number`: Sequence (1, 2, 3).
  - `title`: Short scenario name.
  - `description`: Detailed description of the operational path.
  - `feasibility_score`: Estimated implementation viability (0.00 to 1.00).
  - `is_recommended`: Boolean indicating whether this scenario was chosen as the primary recommendation.

---

### 2.5 Impacts
- **Purpose:** Quantified or qualified ripples caused by a specific scenario on a stakeholder group.
- **Key Attributes:**
  - `id`: Primary key.
  - `scenario_id`: Foreign key reference to `Scenario`.
  - `stakeholder_key`: Identifier of affected group.
  - `category`: Domain (`FINANCIAL`, `ACADEMIC`, `WELLBEING`, `LOGISTICS`, `FACILITIES`).
  - `direction`: Enum (`POSITIVE`, `NEGATIVE`, `NEUTRAL`).
  - `magnitude`: Magnitude scale (`LOW`, `MEDIUM`, `HIGH`).
  - `description`: Detailed narrative of the consequence.
  - `metric_estimate`: Optional numerical estimate (e.g., *"20% reduction in campus carbon emissions"*).

---

### 2.6 Risks
- **Purpose:** Potential failure modes, compliance breaches, or severe unintended consequences.
- **Key Attributes:**
  - `id`: Primary key.
  - `decision_id`: Foreign key reference to `Decision`.
  - `scenario_id`: Foreign key to `Scenario` (optional or cross-scenario).
  - `title`: Risk summary.
  - `severity`: (`CRITICAL`, `HIGH`, `MEDIUM`, `LOW`).
  - `likelihood`: (`HIGH`, `MEDIUM`, `LOW`).
  - `affected_stakeholders`: List of vulnerable groups.
  - `mitigation_strategy`: Recommended proactive countermeasure.
- **Requirements:**
  - High and Critical risks must always include actionable mitigation strategies.

---

### 2.7 Recommendations
- **Purpose:** Synthesized decision advisory directing leadership to the optimal pathway with transparent rationale.
- **Key Attributes:**
  - `id`: Primary key.
  - `decision_id`: Foreign key reference to `Decision`.
  - `selected_scenario_number`: Integer indicating recommended scenario.
  - `summary`: High-level executive recommendation.
  - `rationale`: Detailed logical justification explaining trade-offs.
  - `confidence_score`: Float between 0.00 and 1.00 (e.g., 0.85).
  - `assumptions`: Array of foundational assumptions.
  - `limitations`: Array of blind spots or unmodeled factors.
  - `human_review_required`: Boolean, strictly set to `true`.
- **Requirements:**
  - Must never present certainty when assumptions are unresolved.

---

### 2.8 Reports
- **Purpose:** Compile an audit-ready, executive-grade Markdown document summarizing the entire decision dossier.
- **Key Attributes:**
  - `id`: Primary key.
  - `decision_id`: Foreign key reference to `Decision`.
  - `content_markdown`: Full UTF-8 Markdown text.
  - `generated_at`: Timestamp.
  - `checksum`: SHA-256 hash for document auditability.
- **Requirements:**
  - Accessible via `GET /api/v1/decisions/{id}/report`.
  - Formatted with structured Markdown headers, callout alert blocks, summary tables, and human review notices.

---

## 3. Error Handling and Resilience

### 3.1 Standard Error Format
All 4xx and 5xx API responses must adhere to a standardized JSON error envelope:
```json
{
  "error": {
    "code": "ENTITY_NOT_FOUND",
    "message": "Decision with ID 42 was not found.",
    "details": null,
    "timestamp": "2026-10-12T18:15:00Z"
  }
}
```

### 3.2 Sanity & Security Constraints
- Internal SQLAlchemy database errors or driver connection failures must be caught by custom exception handlers and wrapped in generic HTTP 500 error envelopes without exposing database connection strings, passwords, or raw stack traces.
- All request parameters validated using Pydantic v2 with custom descriptive error messages.
