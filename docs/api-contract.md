# RippleIQ — REST API Contract (v1)

> **Document Version:** 1.0.0 (MVP)  
> **Base URL:** `http://localhost:8000`  
> **API v1 Prefix:** `/api/v1`  
> **Content-Type:** `application/json`

---

## 1. Global Specifications

### 1.1 Error Handling Envelope
In the event of client (4xx) or server (5xx) errors, the API guarantees a consistent JSON payload:

```json
{
  "error": {
    "code": "DECISION_NOT_FOUND",
    "message": "Decision with ID 1 was not found.",
    "details": null,
    "timestamp": "2026-10-12T18:20:00Z"
  }
}
```

#### Standard Error Codes
| HTTP Status | Code | Meaning |
| :--- | :--- | :--- |
| `422` | `VALIDATION_ERROR` | Request body failed Pydantic validation |
| `401` | `AUTHENTICATION_REQUIRED` / `INVALID_CREDENTIALS` | Missing or invalid bearer token or credentials |
| `403` | `INSUFFICIENT_ROLE` | Organization role does not permit the requested action |
| `404` | `NOT_FOUND` | Requested entity (Decision, Result, etc.) does not exist |
| `409` | `STATE_CONFLICT` | Action invalid in current state (e.g., retrieving result before simulation) |
| `500` | `INTERNAL_SERVER_ERROR` | Sanitized server error (no stack traces leaked) |

---

### Authentication and Organizations

`POST /api/v1/auth/register` accepts `{ "email": "person@university.edu",
"full_name": "Campus Analyst", "password": "at-least-12-characters" }` and
returns `201` with `{ "id": 7, "email": "person@university.edu",
"full_name": "Campus Analyst", "created_at": "2026-10-14T12:00:00Z" }`.
Password fields and hashes are never returned. Passwords must be 12–128 characters.
`POST /api/v1/auth/login` accepts email and password and returns
`{ "access_token": "...", "token_type": "bearer", "expires_in": 1800 }`.
Invalid credentials return `401 INVALID_CREDENTIALS`.
Pass this token as `Authorization: Bearer <access_token>` to private routes.
`GET /api/v1/auth/me` returns the current user's id, email, name, and creation
timestamp.

`POST /api/v1/organizations` accepts `{ "name": "University Name",
"country": "Iraq" }` and makes the caller an owner. `GET /api/v1/organizations`
lists organizations the caller belongs to. `GET /api/v1/organizations/{id}`
returns the organization and its member roles. Owners and admins may add an
already registered user with `POST /api/v1/organizations/{id}/members`, using
`{ "email": "reviewer@university.edu", "role": "reviewer" }`. Only an owner
may grant owner/admin roles.

Decision, context, simulation, result, and report routes require a member token.
Creating decisions, attaching context, and simulating require owner, admin, or
decision-maker. If the caller belongs to multiple organizations, include
`X-Organization-ID` on decision creation. An inaccessible decision returns
404.

---

## 2. Endpoints

### Decision and context management (Phase 4)

- `GET /api/v1/decisions?offset=0&limit=50` lists decisions for the caller's
  selected organization (`limit` is 1–100).
- `PATCH /api/v1/decisions/{id}` accepts any subset of `title`, `description`,
  `decision_type`, `department`, `time_horizon`, and `priority`.
- `DELETE /api/v1/decisions/{id}` archives the decision and returns `204`.
- `GET /api/v1/decisions/{id}/context` reads attached context;
  `PATCH /api/v1/context/{context_id}` updates supplied context fields;
  `DELETE /api/v1/context/{context_id}` deletes context and returns `204`.
- Decision types: `academic_policy`, `attendance`, `budget`, `staffing`,
  `facilities`, `student_services`, `technology`, `other`. New decisions begin
  as `DRAFT`; adding context sets `READY_FOR_ANALYSIS`. Changing decision or
  context inputs clears stored simulation-derived records and returns the
  decision to the appropriate preparation status. Important mutations create
  audit-log entries.
- All routes require a bearer token and organization membership. Attempts to
  modify an archived decision return `409 DECISION_ARCHIVED`; validation errors
  use the standard error envelope in section 1.1.

### Simulation and persisted analysis (Phase 6)

- `POST /api/v1/decisions/{id}/simulate` runs synchronously and returns a run ID
  and completed status. Validated results and normalized child records are
  persisted.
- `GET /api/v1/decisions/{id}/analysis` returns the latest status, timestamps,
  schema version, safe error code, and `human_review_required: true`.
  A completed example is `{ "decision_id": 1, "analysis_run_id": 1,
  "analysis_status": "completed", "schema_version": "0.1.0",
  "error_code": null, "human_review_required": true, ... }`.
- `GET /api/v1/decisions/{id}/result` serves the persisted completed result,
  including schema version, fairness notes, confidence, score components, and
  limitations. A missing or failed run returns `409 SIMULATION_NOT_RUN`.
- `POST /api/v1/decisions/{id}/analysis/retry` starts a fresh run only when the
  latest run failed. Provider errors return a generic `500 ANALYSIS_FAILED`;
  diagnostic details are not sent to the caller.
- `GET /api/v1/scenarios/{scenario_id}`, `/impacts`, and `/risks` return the
  selected scenario, its impacts, and decision-level risks. All reads enforce
  organization access.

### Recommendations and reports (Phase 7)

- `GET /api/v1/decisions/{id}/recommendation` returns both the original
  recommendation and the latest human-reviewed refinement, if present.
- `POST /api/v1/decisions/{id}/refine` accepts `feedback` (3–4000 characters)
  and an optional `selected_scenario_number` (1–3). It stores a new refinement
  linked to the completed analysis and leaves its original result unchanged.
- `GET /api/v1/decisions/{id}/report` returns report metadata and Markdown in
  JSON, or raw Markdown when `Accept: text/markdown` is set.
- `GET /api/v1/decisions/{id}/report.md` downloads the same report as a Markdown
  attachment. Reports contain decision/context, assumptions, stakeholders,
  scenarios, impact comparison, risks and mitigations, fairness review,
  recommendation history, confidence, limitations, and the human-review notice.

### 2.1 Health Check (Root)
Provides rapid uptime checks for container orchestrators and load balancers.

- **Method / Path:** `GET /health`
- **Headers:** None
- **Response `200 OK`:**
```json
{
  "status": "healthy",
  "app_name": "RippleIQ",
  "version": "0.1.0"
}
```

---

### 2.2 Health Check (API v1)
Detailed system health verifying database connectivity and configuration readiness.

- **Method / Path:** `GET /api/v1/health`
- **Headers:** None
- **Response `200 OK`:**
```json
{
  "status": "healthy",
  "environment": "development",
  "database": "connected",
  "analyzer_mode": "mock_deterministic",
  "timestamp": "2026-10-12T18:20:00Z"
}
```

---

### 2.3 Create Decision
Initiates a new university policy proposal.

- **Method / Path:** `POST /api/v1/decisions`
- **Request Body:**
```json
{
  "title": "Reduce in-person university attendance from five days to four days per week",
  "description": "Evaluate transition to a 4-day condensed on-campus schedule with Fridays designated for asynchronous remote study or research.",
  "department": "Office of the Provost",
  "time_horizon": "1 Academic Year",
  "priority": "HIGH"
}
```
- **Response `201 Created`:**
```json
{
  "id": 1,
  "title": "Reduce in-person university attendance from five days to four days per week",
  "description": "Evaluate transition to a 4-day condensed on-campus schedule with Fridays designated for asynchronous remote study or research.",
  "department": "Office of the Provost",
  "time_horizon": "1 Academic Year",
  "priority": "HIGH",
  "status": "DRAFT",
  "created_at": "2026-10-12T18:20:00Z",
  "updated_at": "2026-10-12T18:20:00Z"
}
```

---

### 2.4 Retrieve Decision
Retrieves a specific decision's metadata and current progress status.

- **Method / Path:** `GET /api/v1/decisions/{id}`
- **Parameters:** `id` (integer, Path)
- **Response `200 OK`:**
```json
{
  "id": 1,
  "title": "Reduce in-person university attendance from five days to four days per week",
  "description": "Evaluate transition to a 4-day condensed on-campus schedule with Fridays designated for asynchronous remote study or research.",
  "department": "Office of the Provost",
  "time_horizon": "1 Academic Year",
  "priority": "HIGH",
  "status": "SIMULATED",
  "context_attached": true,
  "simulation_ready": true,
  "created_at": "2026-10-12T18:20:00Z",
  "updated_at": "2026-10-12T18:22:00Z"
}
```
- **Response `404 Not Found`:**
```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Decision with ID 999 was not found.",
    "details": null,
    "timestamp": "2026-10-12T18:20:00Z"
  }
}
```

---

### 2.5 Add Context Data
Attaches university operational parameters to ground the simulation model.

- **Method / Path:** `POST /api/v1/decisions/{id}/context`
- **Parameters:** `id` (integer, Path)
- **Request Body:**
```json
{
  "student_population": 28000,
  "faculty_count": 1400,
  "active_laboratories": 85,
  "transit_dependency_rate": 68.5,
  "key_assumptions": [
    "Fridays designated as asynchronous remote learning",
    "Campus dining halls operate on reduced staff on remote days",
    "Accreditation contact hours must be preserved"
  ],
  "constraints": "Wet lab experiments requiring continuous daily monitoring cannot be interrupted without regulatory and biosafety approval.",
  "raw_metadata": {
    "campus_acres": 420,
    "commuter_parking_permits": 14500
  }
}
```
- **Response `200 OK`:**
```json
{
  "id": 1,
  "decision_id": 1,
  "student_population": 28000,
  "faculty_count": 1400,
  "active_laboratories": 85,
  "transit_dependency_rate": 68.5,
  "key_assumptions": [
    "Fridays designated as asynchronous remote learning",
    "Campus dining halls operate on reduced staff on remote days",
    "Accreditation contact hours must be preserved"
  ],
  "constraints": "Wet lab experiments requiring continuous daily monitoring cannot be interrupted without regulatory and biosafety approval.",
  "raw_metadata": {
    "campus_acres": 420,
    "commuter_parking_permits": 14500
  },
  "created_at": "2026-10-12T18:21:00Z"
}
```

---

### 2.6 Run Simulation
Executes the deterministic AI simulation engine across the decision and context.

- **Method / Path:** `POST /api/v1/decisions/{id}/simulate`
- **Parameters:** `id` (integer, Path)
- **Request Body:** Empty `{}` (Optional parameter overrides)
- **Response `200 OK`:**
```json
{
  "decision_id": 1,
  "status": "COMPLETED",
  "analysis_run_id": 1,
  "analysis_status": "completed",
  "message": "Analysis completed for 5 stakeholder groups and 3 scenarios.",
  "simulated_at": "2026-10-12T18:22:00Z"
}
```

---

### 2.7 Get Simulation Result
Retrieves the full structured simulation result including stakeholders, 3 scenarios, impacts, risks, assumptions, confidence score, limitations, and the mandatory human review flag.

- **Method / Path:** `GET /api/v1/decisions/{id}/result`
- **Parameters:** `id` (integer, Path)
- **Response `200 OK`:**
```json
{
  "decision_id": 1,
  "decision_title": "Reduce in-person university attendance from five days to four days per week",
  "schema_version": "0.1.0",
  "analysis_status": "completed",
  "interpretation": {
    "decision_type": "attendance",
    "change_type": "reduce",
    "subject": "Reduce in-person university attendance from five days to four days per week",
    "source_text": "Reduce in-person university attendance from five days to four days per week"
  },
  "fairness": {
    "potential_concerns": ["Review schedule, accessibility, childcare, and employment constraints across student groups."],
    "affected_groups_to_review": ["students", "faculty", "staff", "commuters", "people with disabilities"],
    "note": "Fairness notes identify questions for human review and do not measure group outcomes."
  },
  "is_estimate": true,
  "human_review_required": true,
  "confidence": {
    "score": 0.82,
    "level": "HIGH",
    "rationale": "High confidence based on structured operational context and verified university scheduling precedents."
  },
  "stakeholders": [
    {
      "key": "students",
      "name": "Students",
      "category": "ACADEMIC",
      "summary": "Impacted by compressed class schedules, reduced commuting costs, and altered study rhythms."
    },
    {
      "key": "faculty",
      "name": "Faculty & Instructors",
      "category": "ACADEMIC",
      "summary": "Impacted by intensive 4-day instructional load, revised office hours, and consolidated research time."
    },
    {
      "key": "laboratories",
      "name": "Laboratories & Research Teams",
      "category": "OPERATIONAL",
      "summary": "Severely vulnerable to multi-day laboratory shutdowns, cell culture upkeep, and specialized equipment maintenance."
    },
    {
      "key": "administration",
      "name": "Administration & Facilities",
      "category": "OPERATIONAL",
      "summary": "Impacted by campus energy savings, classroom reassignment complexity, and service contract renegotiations."
    },
    {
      "key": "transportation",
      "name": "Transportation & Parking",
      "category": "COMMUNITY",
      "summary": "Impacted by reduced daily peak-hour congestion, shuttle route rescheduling, and lost parking revenue."
    }
  ],
  "scenarios": [
    {
      "scenario_number": 1,
      "title": "Apply the decision as written",
      "description": "Full compression of campus operations into Monday through Thursday. Campus facilities closed Friday through Sunday.",
      "feasibility_score": 0.525,
      "score_components": {
        "implementation_feasibility": 0.65,
        "stakeholder_protection": 0.35,
        "reversibility": 0.3
      },
      "score_method": "Weighted heuristic: feasibility × 0.60 + stakeholder protection × 0.30 + reversibility × 0.10. Components are qualitative estimates, not measured outcomes.",
      "is_recommended": false,
      "tradeoff_summary": "Maximizes energy and commute savings but creates acute operational jeopardy for continuous scientific research laboratories."
    },
    {
      "scenario_number": 2,
      "title": "Apply a modified version that protects laboratories",
      "description": "Compress classroom instruction to 4 days while keeping wet laboratories, scientific research, and specialized clinical facilities open 5-7 days with dedicated support staffing.",
      "feasibility_score": 0.878,
      "is_recommended": true,
      "tradeoff_summary": "Balances 80% of energy and commuting gains while safeguarding multimillion-dollar sponsored research grants and continuous biological cultures."
    },
    {
      "scenario_number": 3,
      "title": "Run a limited pilot first",
      "description": "Pilot the 4-day schedule within the Faculty of Humanities and Social Sciences for one full academic semester before institution-wide expansion.",
      "feasibility_score": 0.788,
      "is_recommended": false,
      "tradeoff_summary": "Lowest operational disruption and provides empirical empirical data, but creates inter-departmental scheduling friction during the trial period."
    }
  ],
  "impacts": [
    {
      "stakeholder_key": "students",
      "scenario_number": 1,
      "category": "FINANCIAL",
      "direction": "POSITIVE",
      "magnitude": "HIGH",
      "description": "Estimated 20% reduction in weekly commuting and transit expenses for commuter students."
    },
    {
      "stakeholder_key": "laboratories",
      "scenario_number": 1,
      "category": "OPERATIONAL",
      "direction": "NEGATIVE",
      "magnitude": "HIGH",
      "description": "Risk of continuous biological culture degradation due to restricted Friday facility access."
    },
    {
      "stakeholder_key": "laboratories",
      "scenario_number": 2,
      "category": "OPERATIONAL",
      "direction": "POSITIVE",
      "magnitude": "HIGH",
      "description": "Continuous lab continuity maintained via exemption protocol while non-lab classes condense."
    },
    {
      "stakeholder_key": "administration",
      "scenario_number": 2,
      "category": "FINANCIAL",
      "direction": "POSITIVE",
      "magnitude": "MEDIUM",
      "description": "Campus HVAC and lighting energy savings of approximately 14-17% overall."
    },
    {
      "stakeholder_key": "transportation",
      "scenario_number": 2,
      "category": "LOGISTICS",
      "direction": "POSITIVE",
      "magnitude": "HIGH",
      "description": "20% drop in Friday peak vehicular congestion and reduced demand on shuttle fleets."
    }
  ],
  "risks": [
    {
      "title": "Continuous Research Experiment Interruption",
      "severity": "CRITICAL",
      "likelihood": "HIGH",
      "probability": 0.8,
      "affected_stakeholders": ["laboratories", "faculty"],
      "mitigation_strategy": "Establish explicit laboratory access exemptions and essential research personnel building credentials."
    },
    {
      "title": "Instructional Schedule Overcrowding",
      "severity": "MEDIUM",
      "likelihood": "HIGH",
      "affected_stakeholders": ["students", "faculty"],
      "mitigation_strategy": "Extend daily instructional bands by 45 minutes and implement block scheduling algorithms."
    },
    {
      "title": "Student Auxiliary Service Worker Wage Loss",
      "severity": "HIGH",
      "likelihood": "MEDIUM",
      "affected_stakeholders": ["students", "administration"],
      "mitigation_strategy": "Reallocate hourly campus student workers to asynchronous administrative or peer tutoring roles on Fridays."
    }
  ],
  "assumptions": [
    "Instructional accreditation requirements permit lengthened daily class sessions.",
    "Public transit agencies will maintain adequate Monday-Thursday peak dispatch frequencies.",
    "Digital infrastructure and LMS can absorb Friday peak concurrent online usage without degradation."
  ],
  "limitations": [
    "Simulation does not model individual faculty collective bargaining agreements.",
    "Local municipal road construction schedules not accounted for in transit ripple projections."
  ],
  "recommendation": {
    "selected_scenario_number": 2,
    "title": "Adopt Modified 4-Day Model with Laboratory and Clinical Exemptions (Scenario 2)",
    "summary": "Proceed with Scenario 2: Compress general lecture courses into a 4-day block (Mon-Thu) while designating Friday as dedicated asynchronous study, while granting full operational exemption and dedicated staffing for wet research laboratories and clinical facilities.",
    "rationale": "Scenario 2 achieves 88% of intended energy, commuting, and student satisfaction benefits while completely mitigating the critical risk of research grant disruption and experiment spoilage."
  }
}
```

---

### 2.8 Get Markdown Report
Retrieves a formatted, audit-ready Markdown document summarizing the decision analysis.

- **Method / Path:** `GET /api/v1/decisions/{id}/report`
- **Parameters:** `id` (integer, Path)
- **Response `200 OK`:**
```json
{
  "decision_id": 1,
  "filename": "rippleiq-decision-1-report.md",
  "content_markdown": "# RippleIQ Decision Memorandum: Reduce in-person university attendance...\n\n...",
  "generated_at": "2026-10-12T18:22:30Z",
  "checksum": "3b4f93a1029c9918a243..."
}
```
*(Also supports `Accept: text/markdown` returning the raw `.md` stream directly).*
