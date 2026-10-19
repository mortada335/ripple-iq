import {
  Decision,
  ContextData,
  SimulationResult,
} from "@/types/decision";

export const DEMO_DECISION: Decision = {
  id: 1,
  title: "Reduce in-person university attendance from five days to four days per week",
  description:
    "Evaluate institutional shift from traditional 5-day on-campus instruction to a 4-day condensed week (Monday through Thursday) with Friday designated for asynchronous digital learning, grading, and faculty research.",
  decision_type: "attendance",
  department: "Academic Affairs",
  time_horizon: "1 Academic Year",
  priority: "HIGH",
  status: "COMPLETED",
  context_attached: true,
  simulation_ready: true,
  created_at: "2026-10-12T09:00:00Z",
  updated_at: "2026-10-12T10:15:00Z",
};

export const DEMO_CONTEXT: ContextData = {
  id: 1,
  decision_id: 1,
  student_population: 28000,
  faculty_count: 1400,
  active_laboratories: 85,
  transit_dependency_rate: 68.5,
  key_assumptions: [
    "Fridays designated as asynchronous remote learning day",
    "Campus dining and auxiliary services operate on a reduced footprint on remote days",
    "Total accreditation contact hours per course remain unchanged via 15% longer class periods",
  ],
  constraints:
    "Wet laboratories, live animal research facilities, and biosafety level 2/3 labs require continuous daily temperature controls, monitoring, and researcher physical access.",
  raw_metadata: {
    campus_acres: 420,
    commuter_parking_spaces: 12000,
    annual_facilities_energy_budget_usd: 18500000,
  },
  created_at: "2026-10-12T09:10:00Z",
};

export const DEMO_SIMULATION_RESULT: SimulationResult = {
  decision_id: 1,
  decision_title: "Reduce in-person university attendance from five days to four days per week",
  schema_version: "0.1.0",
  analysis_status: "completed",
  interpretation: {},
  fairness: {
    potential_concerns: [],
    affected_groups_to_review: [],
    note: "Demo example only. Review fairness with institutional evidence.",
  },
  is_estimate: true,
  human_review_required: true,
  confidence: {
    score: 0.82,
    level: "HIGH",
    rationale:
      "High confidence based on structured operational context and verified university scheduling precedents.",
    is_calibrated_probability: false,
  },
  stakeholders: [
    {
      key: "students",
      name: "Students",
      category: "ACADEMIC",
      summary:
        "Impacted by compressed class schedules, reduced commuting costs, and altered study rhythms.",
    },
    {
      key: "faculty",
      name: "Faculty & Instructors",
      category: "ACADEMIC",
      summary:
        "Impacted by intensive 4-day instructional load, revised office hours, and consolidated research time.",
    },
    {
      key: "laboratories",
      name: "Laboratories & Research Teams",
      category: "OPERATIONAL",
      summary:
        "Severely vulnerable to multi-day laboratory shutdowns, cell culture upkeep, and specialized equipment maintenance.",
    },
    {
      key: "administration",
      name: "Administration & Facilities",
      category: "OPERATIONAL",
      summary:
        "Impacted by campus energy savings, classroom reassignment complexity, and service contract renegotiations.",
    },
    {
      key: "transportation",
      name: "Transportation & Parking",
      category: "COMMUNITY",
      summary:
        "Impacted by reduced daily peak-hour congestion, shuttle route rescheduling, and lost parking revenue.",
    },
  ],
  scenarios: [
    {
      scenario_number: 1,
      title: "Apply the decision as written (Direct 4-day compression)",
      description:
        "Full compression of campus operations into Monday through Thursday. Campus facilities completely closed Friday through Sunday.",
      feasibility_score: 0.65,
      is_recommended: false,
      tradeoff_summary:
        "Maximizes energy and commute savings but creates acute operational jeopardy for continuous scientific research laboratories.",
      implementation_horizon: "Fall Semester",
      key_changes: [
        "Campus closed Friday-Sunday",
        "Classes lengthened by 15-20 minutes Mon-Thu",
        "HVAC switched to weekend setbacks on Fridays",
      ],
      assumptions: [
        "All instruction can be compressed into 4 days",
        "No continuous research activities require weekend prep",
      ],
    },
    {
      scenario_number: 2,
      title: "Apply a modified version that protects laboratories (Hybrid Exemption)",
      description:
        "Compress general classroom instruction to 4 days while keeping wet laboratories, scientific research, and specialized clinical facilities open 5-7 days with dedicated support staffing.",
      feasibility_score: 0.88,
      is_recommended: true,
      tradeoff_summary:
        "Balances 80% of energy and commuting gains while safeguarding multimillion-dollar sponsored research grants and continuous biological cultures.",
      implementation_horizon: "Academic Year Phased",
      key_changes: [
        "Lectures & seminars 4 days (Mon-Thu)",
        "Laboratory facilities remain fully staffed 5-7 days",
        "Dedicated Friday transit shuttle for lab researchers",
      ],
      assumptions: [
        "Facilities team can partition building energy zones",
        "Research grant funding covers isolated Friday building ops",
      ],
    },
    {
      scenario_number: 3,
      title: "Run a limited pilot first (Single Faculty Trial)",
      description:
        "Pilot the 4-day schedule within the Faculty of Humanities and Social Sciences for one full academic semester before institution-wide expansion.",
      feasibility_score: 0.78,
      is_recommended: false,
      tradeoff_summary:
        "Lowest operational disruption and provides empirical empirical data, but creates inter-departmental scheduling friction during the trial period.",
      implementation_horizon: "Single Semester Pilot",
      key_changes: [
        "One faculty only (Humanities & Social Sciences)",
        "Cross-department course scheduling conflicts flagged manually",
        "Empirical survey after 16 weeks",
      ],
      assumptions: [
        "Students enrolled in multiple faculties can manage hybrid schedules",
      ],
    },
  ],
  impacts: [
    {
      stakeholder_key: "students",
      scenario_number: 1,
      category: "FINANCIAL",
      direction: "POSITIVE",
      magnitude: "HIGH",
      description:
        "Estimated 20% reduction in weekly commuting and transit expenses for commuter students.",
    },
    {
      stakeholder_key: "students",
      scenario_number: 1,
      category: "ACADEMIC",
      direction: "NEGATIVE",
      magnitude: "MEDIUM",
      description:
        "Classroom fatigue from 75-minute compressed lecture blocks across 4 consecutive days.",
    },
    {
      stakeholder_key: "faculty",
      scenario_number: 2,
      category: "ACADEMIC",
      direction: "POSITIVE",
      magnitude: "HIGH",
      description:
        "Consolidated uninterrupted Friday research, grant drafting, and postgraduate supervision blocks.",
    },
    {
      stakeholder_key: "laboratories",
      scenario_number: 1,
      category: "OPERATIONAL",
      direction: "NEGATIVE",
      magnitude: "HIGH",
      description:
        "Risk of continuous biological culture degradation due to restricted Friday facility access.",
    },
    {
      stakeholder_key: "laboratories",
      scenario_number: 2,
      category: "OPERATIONAL",
      direction: "POSITIVE",
      magnitude: "HIGH",
      description:
        "Continuous lab continuity maintained via exemption protocol while non-lab classes condense.",
    },
    {
      stakeholder_key: "administration",
      scenario_number: 2,
      category: "FINANCIAL",
      direction: "POSITIVE",
      magnitude: "MEDIUM",
      description:
        "Campus HVAC and lighting energy savings of approximately 14-17% overall ($2.8M annual impact).",
    },
    {
      stakeholder_key: "transportation",
      scenario_number: 2,
      category: "LOGISTICS",
      direction: "POSITIVE",
      magnitude: "HIGH",
      description:
        "20% drop in Friday peak vehicular congestion and reduced demand on shuttle fleets.",
    },
  ],
  risks: [
    {
      id: "risk-1",
      title: "Continuous Research Experiment Interruption",
      severity: "CRITICAL",
      likelihood: "HIGH",
      affected_stakeholders: ["laboratories", "faculty"],
      mitigation_strategy:
        "Establish explicit laboratory access exemptions and essential research personnel building credentials.",
      acknowledged: false,
    },
    {
      id: "risk-2",
      title: "Instructional Schedule Overcrowding",
      severity: "MEDIUM",
      likelihood: "HIGH",
      affected_stakeholders: ["students", "faculty"],
      mitigation_strategy:
        "Extend daily instructional bands by 45 minutes and implement block scheduling algorithms.",
      acknowledged: true,
    },
    {
      id: "risk-3",
      title: "Student Auxiliary Service Worker Wage Loss",
      severity: "HIGH",
      likelihood: "MEDIUM",
      affected_stakeholders: ["students", "administration"],
      mitigation_strategy:
        "Reallocate hourly campus student workers to asynchronous administrative or peer tutoring roles on Fridays.",
      acknowledged: false,
    },
  ],
  assumptions: [
    "Instructional accreditation requirements permit lengthened daily class sessions.",
    "Public transit agencies will maintain adequate Monday-Thursday peak dispatch frequencies.",
    "Digital infrastructure and LMS can absorb Friday peak concurrent online usage without degradation.",
  ],
  limitations: [
    "Simulation does not model individual faculty collective bargaining agreements.",
    "Local municipal road construction schedules not accounted for in transit ripple projections.",
  ],
  recommendation: {
    selected_scenario_number: 2,
    title: "Adopt Modified 4-Day Model with Laboratory and Clinical Exemptions (Scenario 2)",
    summary:
      "Proceed with Scenario 2: Compress general lecture courses into a 4-day block (Mon-Thu) while designating Friday as dedicated asynchronous study, while granting full operational exemption and dedicated staffing for wet research laboratories and clinical facilities.",
    rationale:
      "Scenario 2 achieves 88% of intended energy, commuting, and student satisfaction benefits while completely mitigating the critical risk of research grant disruption and experiment spoilage.",
  },
  provenance: {
    provider: "deterministic_mock",
    model: null,
    attempt_count: 1,
    fallback_used: false,
    is_mock: true,
  },
};

export const DEMO_REPORT_MARKDOWN = `# RippleIQ University Decision Brief
## Reduce in-person university attendance from five days to four days per week

> [!WARNING]
> **DECISION SUPPORT ONLY — MANDATORY HUMAN REVIEW REQUIRED**
> This report contains predictive impact estimates generated by the RippleIQ simulation engine.
> This analysis is advisory. University leadership and affected academic teams make the final decision.

### Executive Metadata
- **Decision Reference ID:** \`D-0001\`
- **Sponsoring Department:** Academic Affairs
- **Evaluation Time Horizon:** 1 Academic Year
- **Analysis Status:** \`COMPLETED\` (Deterministic Estimate)
- **Analytical Confidence:** \`82%\` (HIGH)
- **Generated At:** 2026-10-12 10:15:00 UTC

---

## 1. Executive Summary & Strategic Recommendation
**Recommended Policy Alternative:** Scenario 2 — Adopt Modified 4-Day Model with Laboratory and Clinical Exemptions

### Strategic Rationale
Scenario 2 achieves 88% of intended energy, commuting, and student satisfaction benefits while completely mitigating the critical risk of research grant disruption and experiment spoilage.

---

## 2. Institutional Baseline Parameters
- **Student Enrollment:** 28,000 students
- **Instructional Faculty:** 1,400 faculty members
- **Active Research Laboratories:** 85 wet/dry laboratories
- **Transit Commuter Dependency:** 68.5%

---

## 3. Comparative Scenario Analysis
| Scenario | Feasibility | Recommendation | Core Trade-off |
| :--- | :---: | :---: | :--- |
| **1. Apply As Written** | 65% | Alternative | Maximizes energy savings but jeopardizes wet labs |
| **2. Protect Laboratories** | 88% | **Recommended** | Preserves research continuity while compressing classes |
| **3. Limited Pilot** | 78% | Alternative | Low operational risk, potential scheduling friction |

---

## 4. Key Stakeholder Ripple Effects
- **Students (+HIGH):** Estimated 20% reduction in weekly commuting and transit expenses.
- **Laboratories (-CRITICAL under Scenario 1, +HIGH under Scenario 2):** Safeguarded by exemption protocols.
- **Administration (+MEDIUM):** Annual energy and facilities savings estimated at $2.8M.
- **Transportation (+HIGH):** 20% drop in Friday peak vehicular congestion.

---

## 5. Risk Assessment & Mitigations
1. **Continuous Research Experiment Interruption (CRITICAL):**
   *Mitigation:* Establish explicit laboratory access exemptions and essential personnel credentials.
2. **Instructional Schedule Overcrowding (MEDIUM):**
   *Mitigation:* Extend daily instructional bands by 45 minutes and implement block scheduling algorithms.
3. **Student Auxiliary Service Worker Wage Loss (HIGH):**
   *Mitigation:* Reallocate hourly campus student workers to asynchronous peer tutoring and LMS operations.

---

## 6. Analytical Assumptions & Limitations
- Instructional accreditation requirements permit lengthened daily class sessions.
- LMS infrastructure can absorb Friday peak concurrent online usage.
- *Limitation:* Collective bargaining agreements for faculty unions must be negotiated separately.
`;

const LOCAL_STORAGE_KEY_DECISIONS = "rippleiq_decisions";
const LOCAL_STORAGE_KEY_CONTEXTS = "rippleiq_contexts";
const LOCAL_STORAGE_KEY_RESULTS = "rippleiq_results";

export function getLocalDecisions(): Decision[] {
  if (typeof window === "undefined") return [DEMO_DECISION];
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY_DECISIONS);
    if (!raw) {
      localStorage.setItem(LOCAL_STORAGE_KEY_DECISIONS, JSON.stringify([DEMO_DECISION]));
      return [DEMO_DECISION];
    }
    return JSON.parse(raw);
  } catch {
    return [DEMO_DECISION];
  }
}

export function saveLocalDecision(decision: Decision): void {
  if (typeof window === "undefined") return;
  const list = getLocalDecisions();
  const idx = list.findIndex((d) => d.id === decision.id);
  if (idx >= 0) {
    list[idx] = decision;
  } else {
    list.unshift(decision);
  }
  localStorage.setItem(LOCAL_STORAGE_KEY_DECISIONS, JSON.stringify(list));
}

export function getLocalDecision(id: number): Decision | null {
  const list = getLocalDecisions();
  return list.find((d) => d.id === id) || null;
}

export function saveLocalContext(context: ContextData): void {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY_CONTEXTS);
    const map = raw ? JSON.parse(raw) : {};
    map[context.decision_id] = context;
    localStorage.setItem(LOCAL_STORAGE_KEY_CONTEXTS, JSON.stringify(map));
  } catch (e) {
    console.error("Failed to save local context", e);
  }
}

export function getLocalContext(decisionId: number): ContextData | null {
  if (decisionId === 1) return DEMO_CONTEXT;
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY_CONTEXTS);
    if (!raw) return null;
    const map = JSON.parse(raw);
    return map[decisionId] || null;
  } catch {
    return null;
  }
}

export function getLocalSimulationResult(decisionId: number): SimulationResult {
  if (typeof window === "undefined" || decisionId === 1) return DEMO_SIMULATION_RESULT;
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY_RESULTS);
    if (raw) {
      const map = JSON.parse(raw);
      if (map[decisionId]) return map[decisionId];
    }
  } catch {
    // fallback
  }

  const dec = getLocalDecision(decisionId);
  return {
    ...DEMO_SIMULATION_RESULT,
    decision_id: decisionId,
    decision_title: dec?.title || DEMO_SIMULATION_RESULT.decision_title,
  };
}

export function saveLocalSimulationResult(decisionId: number, result: SimulationResult): void {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY_RESULTS);
    const map = raw ? JSON.parse(raw) : {};
    map[decisionId] = result;
    localStorage.setItem(LOCAL_STORAGE_KEY_RESULTS, JSON.stringify(map));
  } catch (e) {
    console.error("Failed to save local simulation result", e);
  }
}

export function archiveLocalDecision(id: number): void {
  if (typeof window === "undefined") return;
  const list = getLocalDecisions();
  const item = list.find((d) => d.id === id);
  if (item) {
    item.status = item.status === "ARCHIVED" ? "COMPLETED" : "ARCHIVED";
    saveLocalDecision(item);
  }
}

export function deleteLocalDecision(id: number): void {
  if (typeof window === "undefined") return;
  const list = getLocalDecisions().filter((d) => d.id !== id);
  localStorage.setItem(LOCAL_STORAGE_KEY_DECISIONS, JSON.stringify(list));
}
