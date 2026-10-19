export type Priority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type DecisionStatus = "DRAFT" | "SIMULATING" | "COMPLETED" | "ARCHIVED";

export interface Decision {
  id: number;
  title: string;
  description: string;
  department: string;
  time_horizon: string;
  priority: Priority;
  status: DecisionStatus;
  context_attached?: boolean;
  simulation_ready?: boolean;
  created_at: string;
  updated_at: string;
}

export interface DecisionCreate {
  title: string;
  description: string;
  department: string;
  time_horizon: string;
  priority: Priority;
}

export interface ContextData {
  id?: number;
  decision_id: number;
  student_population: number | null;
  faculty_count: number | null;
  active_laboratories: number | null;
  transit_dependency_rate: number | null;
  key_assumptions: string[];
  constraints: string | null;
  raw_metadata?: Record<string, unknown>;
  created_at?: string;
}

export type ContextDataCreate = Omit<ContextData, "id" | "created_at">;

export interface Stakeholder {
  key: string;
  name: string;
  category: "ACADEMIC" | "OPERATIONAL" | "COMMUNITY" | "FINANCIAL";
  summary: string;
}

export interface Scenario {
  scenario_number: number;
  title: string;
  description: string;
  feasibility_score: number; // 0.0 - 1.0
  is_recommended: boolean;
  tradeoff_summary: string;
  implementation_horizon?: string;
  key_changes?: string[];
  assumptions?: string[];
}

export interface Impact {
  stakeholder_key: string;
  scenario_number: number;
  category: string;
  direction: "POSITIVE" | "NEGATIVE" | "NEUTRAL";
  magnitude: "LOW" | "MEDIUM" | "HIGH";
  description: string;
  metric_estimate?: string | null;
}

export interface RiskItem {
  id?: string;
  title: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  likelihood: "LOW" | "MEDIUM" | "HIGH";
  affected_stakeholders: string[];
  mitigation_strategy: string;
  acknowledged?: boolean;
}

export interface ConfidenceRating {
  score: number; // 0.0 - 1.0
  level: "LOW" | "MODERATE" | "HIGH";
  rationale: string;
}

export interface Recommendation {
  selected_scenario_number: number;
  title: string;
  summary: string;
  rationale: string;
}

export interface SimulationResult {
  decision_id: number;
  decision_title: string;
  is_estimate: boolean;
  human_review_required: boolean;
  confidence: ConfidenceRating;
  stakeholders: Stakeholder[];
  scenarios: Scenario[];
  impacts: Impact[];
  risks: RiskItem[];
  assumptions: string[];
  limitations: string[];
  recommendation: Recommendation;
}

export interface ReportResponse {
  decision_id: number;
  filename: string;
  content_markdown: string;
  generated_at: string;
  checksum: string;
}

export interface HealthResponse {
  status: "healthy" | "degraded" | "disconnected";
  environment?: string;
  database?: string;
  analyzer_mode?: string;
  timestamp?: string;
  version?: string;
}
