export type Priority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type DecisionStatus = "DRAFT" | "READY_FOR_ANALYSIS" | "SIMULATING" | "COMPLETED" | "ARCHIVED";
export type DecisionType =
  | "academic_policy"
  | "attendance"
  | "budget"
  | "staffing"
  | "facilities"
  | "student_services"
  | "technology"
  | "other";

export interface Decision {
  id: number;
  title: string;
  description: string;
  decision_type: DecisionType;
  department: string | null;
  time_horizon: string | null;
  priority: string;
  status: DecisionStatus;
  context_attached?: boolean;
  simulation_ready?: boolean;
  created_at: string;
  updated_at: string;
}

export interface DecisionCreate {
  title: string;
  description: string;
  decision_type?: DecisionType;
  department?: string | null;
  time_horizon?: string | null;
  priority?: string | null;
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
  updated_at?: string;
}

export interface ContextDataCreate {
  student_population?: number | null;
  faculty_count?: number | null;
  active_laboratories?: number | null;
  transit_dependency_rate?: number | null;
  key_assumptions?: string[];
  constraints?: string | null;
  raw_metadata?: Record<string, unknown>;
}

export type ContextDataUpdate = ContextDataCreate;

export interface Stakeholder {
  key: string;
  name: string;
  category: string;
  summary: string | null;
}

export interface Scenario {
  scenario_number: number;
  title: string;
  description: string;
  rationale?: string | null;
  feasibility_score: number; // 0.0 - 1.0
  score_components?: Record<string, number>;
  score_method?: string | null;
  is_recommended: boolean;
  tradeoff_summary: string | null;
  // Present only in legacy browser demo fixtures; the backend does not return these fields.
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
  id?: number | string;
  title: string;
  severity: string;
  likelihood: string;
  probability?: number | null;
  affected_stakeholders: string[];
  mitigation_strategy: string;
  // Local demo review state only; no backend acknowledgement endpoint exists.
  acknowledged?: boolean;
}

export interface ConfidenceRating {
  score: number; // 0.0 - 1.0
  level: string;
  rationale: string;
  is_calibrated_probability: false;
}

export interface FairnessAssessment {
  potential_concerns: string[];
  affected_groups_to_review: string[];
  note: string;
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
  schema_version: string;
  analysis_status: "completed";
  interpretation: Record<string, unknown>;
  fairness: FairnessAssessment;
  is_estimate: boolean;
  human_review_required: boolean;
  confidence: ConfidenceRating;
  stakeholders: Stakeholder[];
  scenarios: Scenario[];
  impacts: Impact[];
  risks: RiskItem[];
  assumptions: string[];
  limitations: string[];
  recommendation: Recommendation | null;
  provenance: AnalysisProvenance;
}

export interface AnalysisProvenance {
  provider: "deterministic_mock" | "openai_compatible_proxy" | "google_gemini";
  model: string | null;
  attempt_count: number;
  fallback_used: boolean;
  is_mock: boolean;
}

export interface SimulateResponse {
  decision_id: number;
  status: string;
  analysis_run_id: number | null;
  analysis_status: "completed";
  message: string;
  simulated_at: string;
}

export interface AnalysisStatus {
  decision_id: number;
  analysis_run_id: number | null;
  analysis_status: "pending" | "running" | "completed" | "failed";
  schema_version: string | null;
  error_code: string | null;
  started_at: string | null;
  finished_at: string | null;
  human_review_required: true;
}

export interface RecommendationRefinement {
  id: number;
  selected_scenario_number: number;
  title: string;
  summary: string;
  rationale: string;
  feedback: string;
  created_at: string;
}

export interface RecommendationView {
  decision_id: number;
  original: Recommendation;
  current: Recommendation;
  refinement: RecommendationRefinement | null;
}

export interface ExtractedDocumentPage {
  page_number: number;
  text: string;
  backend: string;
  quality_warning: string | null;
}

export interface ExtractedDocument {
  source_document_id: string;
  organization_id: number;
  source_version: string;
  source_name: string;
  extracted_at: string;
  human_verification_required: true;
  pages: ExtractedDocumentPage[];
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
