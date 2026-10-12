# RippleIQ — Frontend Requirements Specification (MVP)

> **Document Version:** 1.0.0 (MVP)  
> **Status:** Approved for Implementation  
> **Target Audience:** Frontend Engineers, UX/UI Designers, Product Managers  
> **Important:** This document specifies the frontend architecture and user interfaces. No frontend source files are modified as part of backend foundation setup.

---

## 1. Executive Summary & Design Philosophy

RippleIQ provides university executives, deans, and academic governance boards with foresight into the cascading consequences of institutional policies prior to implementation. 

### Core Product Tenets
1. **Decision Support, Not Decision Automation:** Every recommendation clearly displays `human_review_required: true`. The UI must reinforce that human leadership retains ultimate accountability.
2. **Clarity of Uncertainty & Risk:** Assumptions, confidence ratings, and limitations must be visualized prominently, not hidden in fine print.
3. **Institutional Trust:** Clean, calm typography, academic-grade palette (deep navy, slate, warm white, with controlled semantic accents), and scannable executive summaries.
4. **Accessible & Inclusive:** Built according to WCAG 2.1 AA standards, responsive across desktop and mobile devices, English-first with architectural readiness for Arabic (RTL) localization.

---

## 2. Global Design & Technical Foundations

### 2.1 Color Semantics & Tokens
- **Primary / Brand:** Deep Navy (`#0F172A`), Institutional Slate (`#334155`), Crisp White (`#FFFFFF`).
- **Positive Impacts:** Emerald Green (`#059669` / light `#ECFDF5`).
- **Negative Impacts:** Rose / Crimson (`#DC2626` / light `#FEF2F2`).
- **Neutral / Moderate Impacts:** Amber / Bronze (`#D97706` / light `#FFFBEB`).
- **Confidence & Estimates:** Violet / Indigo (`#4F46E5` / light `#EEF2FF`).
- **Human Review Banner:** Amber Alert Badge with persistent warning icon: *"Decision Support Only — Human Review Required"*.

### 2.2 Global Layout & Navigation Shell
- **Top Bar:** Institution Brand Logo ("RippleIQ"), Active University Switcher ("Al-Mustaqbal University"), Current User Profile, Language Toggle (English [EN] / Arabic [AR - Future]).
- **Sidebar Navigation:**
  - Dashboard (`/dashboard`)
  - New Decision (`/decisions/new`)
  - Historical Decisions (`/decisions`)
  - Institutional Settings (`/settings`)
- **Breadcrumbs:** Contextual pathing throughout the decision workflow (e.g., `Decisions > Reduce In-Person Attendance > Scenarios`).

### 2.3 Internationalization & RTL Architectural Readiness
- **Language Direction:** Default `dir="ltr"` for English. Design system variables must use CSS Logical Properties (`padding-inline-start`, `margin-inline-end`, `border-inline-start`) instead of `left`/`right`.
- **Typography:** High-legibility sans-serif for Latin characters (Inter/system-ui) paired with Noto Sans Arabic or Cairo for future Arabic RTL layout.
- **RTL Mirroring:** Icons indicating direction (arrows, chevrons) must flip horizontally under `[dir="rtl"]`, while temporal charts and numerical percentage bars flip according to standard RTL conventions.

### 2.4 Accessibility (WCAG 2.1 AA)
- Minimum contrast ratio of 4.5:1 for normal text and 3:1 for large text / graphic controls.
- Keyboard navigation: Full tab order traversal, visible focus rings (`focus-visible: ring-2 ring-primary`), accessible ARIA roles (`role="alert"`, `aria-live="polite"` for simulation progress).
- Screen-reader text for all icon-only buttons (`aria-label`).

---

## 3. Detailed Page Specifications

### 3.1 Login Page
- **Route:** `/login`
- **Purpose:** Securely authenticate university administrators, institutional researchers, and department chairs.
- **Fields:**
  - `email` (Type: Email, Required, Placeholder: `provost@university.edu`)
  - `password` (Type: Password, Required, Min length: 8)
  - `remember_me` (Type: Checkbox, Optional)
- **Actions:**
  - Submit login credentials ("Sign In")
  - "Forgot Password?" trigger
  - SSO Integration trigger ("Continue with University SSO")
- **Validation:**
  - Valid institutional email format required.
  - Password must not be empty.
  - Inline error feedback on invalid submission.
- **Loading State:** Sign-in button shows spinning loader; form inputs disabled.
- **Empty State:** Clean login form with university branding and welcome copy.
- **Error State:** Red alert banner: *"Invalid institutional credentials. Please try again or contact IT support."*
- **API Endpoint:** `POST /api/v1/auth/login` (Mocked in MVP)
- **Acceptance Criteria:**
  - User can submit credentials and on success is redirected to `/dashboard`.
  - Errors prevent submission and announce accessible error message.

---

### 3.2 Dashboard Page
- **Route:** `/dashboard`
- **Purpose:** Central command center displaying ongoing decision simulations, recent impact summaries, institutional health metrics, and quick actions.
- **Fields:**
  - Search filter (Filter decisions by title or tag)
  - Status filter (Draft, Simulating, Completed, Archived)
- **Actions:**
  - Primary button: "+ Create New Decision" (Navigates to `/decisions/new`)
  - Card click: Opens decision details (`/decisions/{id}`)
  - Download Report: Generates instant Markdown download
  - Archive Decision: Soft-archives a past decision
- **Validation:** Search query sanitized; pagination constraints.
- **Loading State:** Skeleton cards matching the grid of decision cards (3-4 pulsing rectangular skeletons).
- **Empty State:** Illustration of institutional decision map with call-to-action: *"No decisions analyzed yet. Start by creating your first university decision simulation."* with button "+ Create Decision".
- **Error State:** Banner: *"Failed to load recent decisions. [Retry]"*.
- **API Endpoint:** `GET /api/v1/decisions`
- **Acceptance Criteria:**
  - Renders decision cards showing title, target stakeholder count, date, and confidence badge.
  - Clicking "+ Create New Decision" moves directly to creation flow.

---

### 3.3 Create Decision Page
- **Route:** `/decisions/new`
- **Purpose:** Capture the proposed university policy, its scope, rationale, and responsible governance department.
- **Fields:**
  - `title` (Text, Required, e.g., *"Reduce in-person university attendance from five days to four days per week"*)
  - `description` (Textarea, Required, Detailed context and proposed timeline)
  - `department` (Dropdown/Select, Required, e.g., Academic Affairs, Facilities, Provost Office)
  - `time_horizon` (Select: 1 Semester, 1 Academic Year, 3 Years, 5 Years)
  - `priority` (Radio: Low, Medium, High, Critical)
- **Actions:**
  - "Save Draft"
  - "Next: Add Institutional Context ->"
  - "Cancel" (Confirmation prompt if dirty)
- **Validation:**
  - Title: Min 5 characters, Max 255 characters.
  - Description: Min 20 characters.
  - Department: Must select an active unit.
- **Loading State:** "Saving decision..." overlay with spinner.
- **Empty State:** Pre-populated with placeholder prompt guiding the administrator with best-practice decision framing.
- **Error State:** Inline validation highlighting missing fields with red borders and helper text.
- **API Endpoint:** `POST /api/v1/decisions`
- **Acceptance Criteria:**
  - Successfully creates a Decision entity in the backend.
  - Returns `decision_id` and navigates to `/decisions/{id}/context`.

---

### 3.4 Add Context Page
- **Route:** `/decisions/{id}/context`
- **Purpose:** Attach essential university operational parameters (e.g., student enrollment, lab counts, commuting transit patterns) that ground the simulation.
- **Fields:**
  - `student_population` (Number, e.g., 28,000)
  - `faculty_count` (Number, e.g., 1,400)
  - `active_laboratories` (Number, e.g., 85 wet/dry continuous research labs)
  - `transit_dependency_rate` (Percentage, e.g., 68% commuter student body)
  - `key_assumptions` (Multi-line text / tags, e.g., *"Friday designated as remote asynchronous day"*)
  - `constraints` (Textarea: e.g., *"Accreditation laboratory hours cannot drop below statutory minimum"*)
- **Actions:**
  - "Attach Context Data"
  - "Launch Impact Simulation ->"
  - "Back to Decision Details"
- **Validation:** Numeric fields must be positive integers; percentage must be 0-100.
- **Loading State:** Progress spinner with disabled inputs.
- **Empty State:** Provides an option to "Load Demo Institutional Profile" prefilling university attendance context data.
- **Error State:** Alert notification if context fails to persist.
- **API Endpoint:** `POST /api/v1/decisions/{id}/context`
- **Acceptance Criteria:**
  - Context data is persisted and associated with the decision ID.
  - Clicking "Launch Impact Simulation" triggers simulation execution and transitions to `/decisions/{id}/progress`.

---

### 3.5 Analysis Progress Page
- **Route:** `/decisions/{id}/progress`
- **Purpose:** Provide reassuring, transparent feedback while the deterministic simulation model parses stakeholders, scenarios, impacts, and recommendations.
- **Fields:** None (Display only).
- **Actions:**
  - "Cancel Simulation" (Returns to decision draft)
- **Validation:** Polling interval or reactive state listener on simulation completion.
- **Loading State:** Multi-step animated progress stepper:
  1. *Analyzing institutional context...* [Done]
  2. *Mapping affected stakeholders (Students, Faculty, Labs, Admin, Transit)...* [In Progress]
  3. *Generating 3 comparative policy scenarios...* [Pending]
  4. *Synthesizing risks and explainable recommendation...* [Pending]
- **Empty State:** N/A (Transient screen).
- **Error State:** Error dialog: *"Simulation encountered an unexpected issue. [Retry Simulation]"*.
- **API Endpoint:** `POST /api/v1/decisions/{id}/simulate` & `GET /api/v1/decisions/{id}`
- **Acceptance Criteria:**
  - Progress updates smoothly through each milestone.
  - Automatically transitions to `/decisions/{id}/scenarios` upon successful completion.

---

### 3.6 Scenario Comparison Page
- **Route:** `/decisions/{id}/scenarios`
- **Purpose:** Present an executive side-by-side comparison of the three generated alternatives to evaluate trade-offs at a glance.
- **Fields / Columns:**
  - Column 1: **Scenario A — Apply As Written** (Direct 4-day compression)
  - Column 2: **Scenario B — Protect Laboratories** (Modified hybrid policy with lab exemption)
  - Column 3: **Scenario C — Limited Pilot** (One-faculty single-semester pilot)
- **Display Matrix:**
  - Feasibility Score (0-100%)
  - Primary Beneficiaries vs. Disadvantaged Groups
  - Estimated Budget & Facilities Impact
  - Risk Severity Level (Low / Moderate / High)
  - Recommended Tag on top-performing option
- **Actions:**
  - "View Full Scenario Breakdown" (Per scenario card)
  - "Inspect Cross-Stakeholder Impacts" (`/decisions/{id}/consequences`)
  - "Review Final Recommendation" (`/decisions/{id}/recommendation`)
- **Validation:** Selected scenario highlighted.
- **Loading State:** Three skeleton cards with side-by-side placeholder columns.
- **Empty State:** Message: *"No simulation scenarios generated yet. [Run Simulation]"*.
- **Error State:** Banner: *"Could not load scenario matrix. [Reload]"*.
- **API Endpoint:** `GET /api/v1/decisions/{id}/result`
- **Acceptance Criteria:**
  - Renders all three scenarios with distinct comparative metrics.
  - Clear visual demarcation of differences in risk and stakeholder satisfaction.

---

### 3.7 Scenario Details Page
- **Route:** `/decisions/{id}/scenarios/{scenario_id}`
- **Purpose:** Deep-dive into a single scenario's operational implementation, specific assumptions, and second-order ripple effects.
- **Fields:**
  - Scenario Title & Overview
  - Implementation Horizon & Milestones
  - Explicit Policy Modifications
  - Core Assumptions & Caveats
  - Granular Risk Breakdown
- **Actions:**
  - "Back to Comparison Matrix"
  - "Set as Preferred Institutional Path"
  - "Export Scenario Breakdown"
- **Validation:** Scenario ID exists within decision simulation.
- **Loading State:** Detailed page skeleton.
- **Empty State:** *"Scenario not found."*
- **Error State:** Not found alert with link back to `/decisions/{id}/scenarios`.
- **API Endpoint:** `GET /api/v1/decisions/{id}/result`
- **Acceptance Criteria:**
  - Accurately displays all scenario attributes, constraints, and assumptions.

---

### 3.8 Consequences & Stakeholders Page
- **Route:** `/decisions/{id}/consequences`
- **Purpose:** Map positive and negative ripples across the five identified university stakeholder groups: Students, Faculty, Laboratories, Administration, and Transportation.
- **Fields:**
  - Stakeholder Filter Tabs: `All` | `Students` | `Faculty` | `Laboratories` | `Administration` | `Transportation`
  - Impact Nature Filter: `All` | `Positive` | `Negative` | `Neutral`
- **Display Components:**
  - Stakeholder Card with Sentiment & Impact Meter (-100 to +100).
  - Positive Ripple Cards (marked in Emerald Green with `+` tags).
  - Negative Ripple Cards (marked in Crimson Red with `!` tags).
  - Magnitude Badge: Low, Medium, High.
- **Actions:**
  - Expand/collapse impact item details.
  - "View Risk Mitigations ->"
- **Validation:** Responsive filter handling.
- **Loading State:** Grid skeleton for 5 stakeholder sections.
- **Empty State:** *"No stakeholder impacts identified for this filter."*
- **Error State:** Error banner with retry button.
- **API Endpoint:** `GET /api/v1/decisions/{id}/result`
- **Acceptance Criteria:**
  - Displays all 5 core stakeholder groups for the demo decision.
  - Clear separation of positive and negative impacts with explicit magnitude indicators.

---

### 3.9 Risks Page
- **Route:** `/decisions/{id}/risks`
- **Purpose:** Comprehensive institutional risk register detailing severity, probability, affected stakeholders, and recommended mitigations.
- **Fields:**
  - Risk Matrix / Grid:
    - Risk Description
    - Severity (Critical, High, Medium, Low)
    - Likelihood (High, Medium, Low)
    - Vulnerable Stakeholder Group
    - Proposed Countermeasure / Mitigation Strategy
- **Actions:**
  - Sort by Severity / Likelihood
  - Acknowledge Risk (Checkbox for audit tracking)
  - Export Risk Register
- **Validation:** Sorting state preserved in URL query params.
- **Loading State:** Table skeleton with 4 rows.
- **Empty State:** *"No elevated risks detected for this decision."*
- **Error State:** *"Failed to retrieve risk profile."*
- **API Endpoint:** `GET /api/v1/decisions/{id}/result`
- **Acceptance Criteria:**
  - Highlights critical institutional risks (e.g., biological research specimen loss from unattended labs, classroom overcrowding on 4 compressed days).
  - Each risk features actionable mitigation strategies.

---

### 3.10 Recommendation Page
- **Route:** `/decisions/{id}/recommendation`
- **Purpose:** Present the synthesized executive recommendation, explainable rationale, confidence score, and clear human-review disclaimer.
- **Fields / Display Elements:**
  - **Human Review Notice:** Bold alert stating *"This recommendation is generated for decision support. Final authorization resides with the University Provost and Board of Trustees."*
  - **Recommended Policy Option:** Highlight of the winning scenario (Scenario 2 or Scenario 3).
  - **Explainability Breakdown:** Key factors driving the recommendation (e.g., preservation of research grants vs. student commute savings).
  - **Confidence Gauge:** Visual percentage meter (e.g., `78% Confidence`) with explanation of uncertainty factors.
  - **Explicit Limitations & Unknowns:** List of variables not captured (e.g., unmodeled union collective bargaining agreement nuances).
- **Actions:**
  - "Proceed to Report Generation ->" (`/decisions/{id}/report`)
  - "Review Other Scenarios"
- **Validation:** Read-only executive synthesis.
- **Loading State:** Card skeleton with gauge placeholder.
- **Empty State:** *"Simulation pending. Run simulation to view recommendation."*
- **Error State:** Notice with retry trigger.
- **API Endpoint:** `GET /api/v1/decisions/{id}/result`
- **Acceptance Criteria:**
  - Prominently displays `human_review_required: true`.
  - Confidence rating is accompanied by transparent assumptions and limitations.

---

### 3.11 Report Preview Page
- **Route:** `/decisions/{id}/report`
- **Purpose:** Preview, copy, and export the standardized executive Markdown decision memorandum ready for committee review.
- **Fields:**
  - Markdown Preview Box (Formatted HTML view of Markdown output).
  - Raw Markdown Tab (Monospace text view).
  - Metadata Sidebar (Decision date, author, version, checksum).
- **Actions:**
  - "Copy Markdown to Clipboard" (Toast confirmation: *"Report copied to clipboard!"*)
  - "Download .md File" (Triggers local browser download)
  - "Return to Dashboard"
- **Validation:** Valid UTF-8 markdown parsing.
- **Loading State:** Document reader skeleton.
- **Empty State:** *"Report not yet compiled. Click 'Generate Report' to compile."*
- **Error State:** *"Unable to compile report preview. [Retry]"*
- **API Endpoint:** `GET /api/v1/decisions/{id}/report`
- **Acceptance Criteria:**
  - Markdown report contains full structured memorandum: Title, Executive Summary, Stakeholders, 3 Scenarios, Impacts, Risks, Assumptions, Limitations, and Human Review clause.
  - Copy and download actions function reliably without page reloads.

---

### 3.12 Settings Page
- **Route:** `/settings`
- **Purpose:** Manage university institutional profile, user preferences, API status, and localization settings.
- **Fields:**
  - Institution Name (e.g., *"Al-Mustaqbal University"*)
  - Default Currency & Academic Calendar Format
  - Language Preference (`English (en-US)` [Active], `العربية (ar)` [Planned])
  - Analysis Engine Mode (Deterministic Mock Analyzer [Active] / LLM Gateway [Future])
- **Actions:**
  - "Save Settings"
  - "Check Backend API Health" (Pings `/api/v1/health` and displays green ping badge)
- **Validation:** Required institution name; valid selection.
- **Loading State:** Form button spinner.
- **Empty State:** Populated with default environment settings.
- **Error State:** Banner indicating settings save failure.
- **API Endpoint:** `GET /api/v1/health` & Mocked user preference storage
- **Acceptance Criteria:**
  - Displays live API health status.
  - Allows toggling preferences.

---

## 4. UI Patterns for Transparency & Trust

### 4.1 Displaying Assumptions
- Assumptions must never be buried. Every scenario card includes an **"Assumptions Made"** expandable drawer or tag list.
- Example: *"Assumes campus dining and transit services reduce operational schedules synchronously."*

### 4.2 Displaying Uncertainty & Confidence
- Visual Confidence Pill:
  - **High (80-100%):** Solid Indigo pill with checkmark.
  - **Moderate (60-79%):** Amber pill with info icon.
  - **Low (<60%):** Orange pill with alert icon and explainer tooltip.
- Each confidence badge must include a tooltip explaining the confidence calculation basis (e.g., data completeness, historical precedent).

### 4.3 Visualizing Positive vs. Negative Impacts
- Clean color-coded badge tokens:
  - Positive: Emerald badge `+85% Commute Cost Reduction`
  - Negative: Red badge `-60% Wet Lab Operating Continuity`
- Balanced delta layout ensuring both benefits and detriments are given equal visual prominence to avoid bias.

### 4.4 Mandatory Human Review Notice
- A persistent, unmissable banner on top of all simulation and recommendation pages:
  > **Institutional Governance Notice:** RippleIQ outputs are algorithmic decision support models intended to inform leadership deliberation. Final policy approval requires formal administrative review and committee authorization.
