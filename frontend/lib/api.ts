import type {
  AnalysisStatus,
  ContextData,
  ContextDataCreate,
  Decision,
  DecisionCreate,
  ExtractedDocument,
  HealthResponse,
  RecommendationView,
  ReportResponse,
  SimulationResult,
  SimulateResponse,
} from "@/types/decision";
import {
  DEMO_DECISION,
  DEMO_REPORT_MARKDOWN,
  getLocalContext,
  getLocalDecision,
  getLocalDecisions,
  getLocalSimulationResult,
  saveLocalContext,
  saveLocalDecision,
  saveLocalSimulationResult,
} from "./mock-data";
import {
  clearAuthSession,
  getActiveOrganizationId,
  getAuthSession,
  isDemoSession,
  saveAuthSession,
} from "./session";
import type { LoginResponse, Organization, OrganizationCreate, UserAccount } from "@/types/auth";

export const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000").replace(/\/+$/, "");

type ErrorEnvelope = {
  error?: {
    code?: string;
    message?: string;
    details?: unknown;
  };
};

export class ApiRequestError extends Error {
  constructor(
    message: string,
    readonly status: number | null,
    readonly code?: string,
  ) {
    super(message);
    this.name = "ApiRequestError";
  }
}

function getErrorMessage(payload: unknown, status: number): { message: string; code?: string } {
  const body = payload && typeof payload === "object" ? (payload as ErrorEnvelope) : {};
  const error = body.error;
  const message = typeof error?.message === "string" ? error.message : `The API request failed (${status}).`;
  const code = typeof error?.code === "string" ? error.code : undefined;
  const details = error?.details;
  const validationDetails = Array.isArray(details)
    ? details
        .map((item) => {
          if (!item || typeof item !== "object") return "";
          const field = "field" in item && typeof item.field === "string" ? item.field : "";
          const detail = "message" in item && typeof item.message === "string" ? item.message : "";
          return field && detail ? `${field}: ${detail}` : detail;
        })
        .filter(Boolean)
        .join(" ")
    : "";
  return { message: validationDetails ? `${message} ${validationDetails}` : message, code };
}

async function requestJson<T>(
  path: string,
  options: RequestInit = {},
  authenticated = true,
  timeoutMs = 20_000,
): Promise<T> {
  const session = authenticated ? getAuthSession() : null;
  if (authenticated && !session) {
    throw new ApiRequestError("Your session has expired. Sign in again to continue.", 401, "AUTHENTICATION_REQUIRED");
  }
  const organizationId = authenticated ? getActiveOrganizationId() : null;
  const headers = new Headers(options.headers);
  headers.set("Accept", "application/json");
  if (typeof options.body === "string") headers.set("Content-Type", "application/json");
  if (session) headers.set("Authorization", `Bearer ${session.accessToken}`);
  if (organizationId) headers.set("X-Organization-ID", String(organizationId));

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers,
      signal: controller.signal,
      cache: "no-store",
    });
  } catch (cause) {
    if (cause instanceof Error && cause.name === "AbortError") {
      throw new ApiRequestError("The API request timed out. Please try again.", null, "REQUEST_TIMEOUT");
    }
    throw new ApiRequestError("Could not reach the RippleIQ API. Check the backend connection and try again.", null, "NETWORK_ERROR");
  } finally {
    clearTimeout(timeoutId);
  }

  if (response.status === 204) {
    if (!response.ok) throw new ApiRequestError(`The API request failed (${response.status}).`, response.status);
    return undefined as T;
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }
  if (!response.ok) {
    if (response.status === 401 && authenticated) clearAuthSession();
    const error = getErrorMessage(payload, response.status);
    throw new ApiRequestError(error.message, response.status, error.code);
  }
  if (payload === null) {
    throw new ApiRequestError("The API returned an unreadable response.", response.status, "INVALID_API_RESPONSE");
  }
  return payload as T;
}

async function requestWithDemoFallback<T>(
  path: string,
  options: RequestInit,
  fallback: () => T | Promise<T>,
  timeoutMs = 20_000,
): Promise<T> {
  if (process.env.NEXT_PUBLIC_USE_MOCK === "true" || isDemoSession()) return fallback();
  return requestJson<T>(path, options, true, timeoutMs);
}

export async function registerAccount(data: { email: string; full_name: string; password: string }): Promise<UserAccount> {
  return requestJson<UserAccount>("/api/v1/auth/register", { method: "POST", body: JSON.stringify(data) }, false);
}

export async function loginAccount(email: string, password: string): Promise<UserAccount> {
  const token = await requestJson<LoginResponse>(
    "/api/v1/auth/login",
    { method: "POST", body: JSON.stringify({ email, password }) },
    false,
  );
  saveAuthSession(token.access_token, token.expires_in);
  return getCurrentUser();
}

export async function getCurrentUser(): Promise<UserAccount> {
  return requestJson<UserAccount>("/api/v1/auth/me");
}

export async function getOrganizations(): Promise<Organization[]> {
  return requestJson<Organization[]>("/api/v1/organizations");
}

export async function createOrganization(data: OrganizationCreate): Promise<Organization> {
  return requestJson<Organization>("/api/v1/organizations", { method: "POST", body: JSON.stringify(data) });
}

export async function checkApiHealth(): Promise<HealthResponse> {
  try {
    const data = await requestJson<{
      status: string;
      environment: string;
      database: string;
      analyzer_mode: string;
      timestamp: string;
    }>("/api/v1/health", { method: "GET" }, false, 3_000);
    return {
      status: data.status === "healthy" ? "healthy" : "degraded",
      environment: data.environment,
      database: data.database,
      analyzer_mode: data.analyzer_mode,
      timestamp: data.timestamp,
      version: "0.1.0",
    };
  } catch {
    return {
      status: "disconnected",
      environment: "unavailable",
      database: "offline",
      analyzer_mode: "unknown",
      version: "0.1.0",
    };
  }
}

export type AIProviderStatus = {
  mode: "mock_deterministic" | "multi_provider";
  providers: Array<{ name: string; configured: boolean }>;
  failover_enabled: boolean;
  degraded_mode_enabled: boolean;
  note: string;
};

export async function getAIProviderStatus(): Promise<AIProviderStatus> {
  return requestJson<AIProviderStatus>("/api/v1/ai/status", { method: "GET" }, false);
}

export async function getDecisions(offset = 0, limit = 20): Promise<Decision[]> {
  return requestWithDemoFallback(
    `/api/v1/decisions?offset=${offset}&limit=${limit}`,
    { method: "GET" },
    () => getLocalDecisions().slice(offset, offset + limit),
  );
}

export async function getDecision(id: number): Promise<Decision> {
  return requestWithDemoFallback(`/api/v1/decisions/${id}`, { method: "GET" }, () => {
    const decision = getLocalDecision(id);
    return decision ?? { ...DEMO_DECISION, id };
  });
}

export async function createDecision(data: DecisionCreate): Promise<Decision> {
  return requestWithDemoFallback("/api/v1/decisions", { method: "POST", body: JSON.stringify(data) }, () => {
    const current = getLocalDecisions();
    const id = current.length > 0 ? Math.max(...current.map((decision) => decision.id)) + 1 : 2;
    const decision: Decision = {
      id,
      title: data.title,
      description: data.description,
      decision_type: data.decision_type ?? "other",
      department: data.department ?? null,
      time_horizon: data.time_horizon ?? null,
      priority: data.priority ?? "HIGH",
      status: "DRAFT",
      context_attached: false,
      simulation_ready: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    saveLocalDecision(decision);
    return decision;
  });
}

export async function getDecisionContext(decisionId: number): Promise<ContextData | null> {
  try {
    return await requestWithDemoFallback(`/api/v1/decisions/${decisionId}/context`, { method: "GET" }, () =>
      getLocalContext(decisionId),
    );
  } catch (error) {
    if (error instanceof ApiRequestError && error.status === 404) return null;
    throw error;
  }
}

export async function attachDecisionContext(decisionId: number, data: ContextDataCreate): Promise<ContextData> {
  return requestWithDemoFallback(
    `/api/v1/decisions/${decisionId}/context`,
    { method: "POST", body: JSON.stringify(data) },
    () => {
      const context: ContextData = {
        decision_id: decisionId,
        student_population: data.student_population ?? null,
        faculty_count: data.faculty_count ?? null,
        active_laboratories: data.active_laboratories ?? null,
        transit_dependency_rate: data.transit_dependency_rate ?? null,
        key_assumptions: data.key_assumptions ?? [],
        constraints: data.constraints ?? null,
        raw_metadata: data.raw_metadata ?? {},
        created_at: new Date().toISOString(),
      };
      saveLocalContext(context);
      const decision = getLocalDecision(decisionId);
      if (decision) {
        decision.context_attached = true;
        decision.status = "READY_FOR_ANALYSIS";
        saveLocalDecision(decision);
      }
      return context;
    },
  );
}

export async function runSimulation(decisionId: number): Promise<SimulateResponse> {
  return requestWithDemoFallback(
    `/api/v1/decisions/${decisionId}/simulate`,
    { method: "POST" },
    () => {
      const decision = getLocalDecision(decisionId);
      if (decision) {
        decision.status = "COMPLETED";
        decision.simulation_ready = true;
        saveLocalDecision(decision);
      }
      saveLocalSimulationResult(decisionId, getLocalSimulationResult(decisionId));
      return {
        decision_id: decisionId,
        status: "completed",
        analysis_run_id: null,
        analysis_status: "completed",
        message: "Demo analysis completed in this browser.",
        simulated_at: new Date().toISOString(),
      };
    },
    120_000,
  );
}

export async function getAnalysisStatus(decisionId: number): Promise<AnalysisStatus> {
  return requestWithDemoFallback(`/api/v1/decisions/${decisionId}/analysis`, { method: "GET" }, () => ({
    decision_id: decisionId,
    analysis_run_id: 1,
    analysis_status: "completed",
    schema_version: "0.1.0",
    error_code: null,
    started_at: null,
    finished_at: new Date().toISOString(),
    human_review_required: true,
  }));
}

export async function retryFailedAnalysis(decisionId: number): Promise<SimulateResponse> {
  return requestWithDemoFallback(
    `/api/v1/decisions/${decisionId}/analysis/retry`,
    { method: "POST" },
    () => runSimulation(decisionId),
    120_000,
  );
}

export async function getSimulationResult(decisionId: number): Promise<SimulationResult> {
  return requestWithDemoFallback(`/api/v1/decisions/${decisionId}/result`, { method: "GET" }, () =>
    getLocalSimulationResult(decisionId),
  );
}

export async function getRecommendation(decisionId: number): Promise<RecommendationView> {
  return requestWithDemoFallback(`/api/v1/decisions/${decisionId}/recommendation`, { method: "GET" }, () => {
    const original = getLocalSimulationResult(decisionId).recommendation;
    if (!original) throw new ApiRequestError("A recommendation is not available yet.", 409, "RECOMMENDATION_NOT_AVAILABLE");
    return { decision_id: decisionId, original, current: original, refinement: null };
  });
}

export async function refineRecommendation(
  decisionId: number,
  data: { feedback: string; selected_scenario_number?: number },
): Promise<RecommendationView> {
  return requestWithDemoFallback(
    `/api/v1/decisions/${decisionId}/refine`,
    { method: "POST", body: JSON.stringify(data) },
    () => {
      const result = getLocalSimulationResult(decisionId);
      if (!result.recommendation) throw new ApiRequestError("A recommendation is not available yet.", 409, "RECOMMENDATION_NOT_AVAILABLE");
      const selected = data.selected_scenario_number ?? result.recommendation.selected_scenario_number;
      const scenario = result.scenarios.find((item) => item.scenario_number === selected);
      const current = {
        ...result.recommendation,
        selected_scenario_number: selected,
        title: `Preferred scenario: ${scenario?.title ?? result.recommendation.title}`,
        summary: data.feedback,
      };
      const updated = { ...result, recommendation: current };
      saveLocalSimulationResult(decisionId, updated);
      return { decision_id: decisionId, original: result.recommendation, current, refinement: null };
    },
  );
}

export async function getReport(decisionId: number): Promise<ReportResponse> {
  return requestWithDemoFallback(`/api/v1/decisions/${decisionId}/report`, { method: "GET" }, () => {
    const decision = getLocalDecision(decisionId) ?? DEMO_DECISION;
    return {
      decision_id: decisionId,
      filename: `rippleiq-decision-${decisionId}-report.md`,
      content_markdown: DEMO_REPORT_MARKDOWN.replace(
        "Reduce in-person university attendance from five days to four days per week",
        decision.title,
      ),
      generated_at: new Date().toISOString(),
      checksum: "",
    };
  });
}

export async function extractDecisionDocument(
  decisionId: number,
  file: File,
  sourceDocumentId: string,
  sourceVersion = "1",
): Promise<ExtractedDocument> {
  const query = new URLSearchParams({
    source_document_id: sourceDocumentId,
    source_version: sourceVersion,
    filename: file.name,
  });
  return requestJson<ExtractedDocument>(
    `/api/v1/decisions/${decisionId}/documents/extract?${query.toString()}`,
    { method: "POST", body: file, headers: { "Content-Type": file.type || "application/octet-stream" } },
    true,
    45_000,
  );
}

export async function toggleArchiveDecision(id: number): Promise<Decision | null> {
  return requestWithDemoFallback(`/api/v1/decisions/${id}`, { method: "DELETE" }, async () => {
    const { archiveLocalDecision, getLocalDecision } = await import("./mock-data");
    archiveLocalDecision(id);
    return getLocalDecision(id);
  });
}

export async function getDecisionScenarios(decisionId: number) {
  return requestWithDemoFallback(
    `/api/v1/decisions/${decisionId}/scenarios`,
    { method: "GET" },
    async () => {
      const res = await getSimulationResult(decisionId);
      return res.scenarios;
    },
  );
}

export async function getDecisionConsequences(decisionId: number) {
  return requestWithDemoFallback(
    `/api/v1/decisions/${decisionId}/consequences`,
    { method: "GET" },
    async () => {
      const res = await getSimulationResult(decisionId);
      return res.impacts;
    },
  );
}

export async function getDecisionRisks(decisionId: number) {
  return requestWithDemoFallback(
    `/api/v1/decisions/${decisionId}/risks`,
    { method: "GET" },
    async () => {
      const res = await getSimulationResult(decisionId);
      return res.risks;
    },
  );
}

export async function submitKnowledgeFeedback(data: {
  decision_id: number;
  category: string;
  notes: string;
  proposed_mitigation?: string;
}) {
  return requestWithDemoFallback(
    "/api/v1/knowledge-submissions",
    { method: "POST", body: JSON.stringify(data) },
    () => ({
      id: Date.now(),
      decision_id: data.decision_id,
      status: "pending_review",
      message: "Knowledge feedback logged in demo session.",
      created_at: new Date().toISOString(),
    }),
  );
}

export async function deleteDecision(id: number): Promise<void> {
  if (!isDemoSession() && process.env.NEXT_PUBLIC_USE_MOCK !== "true") {
    throw new Error("Permanent deletion is not available. The organization API archives decisions instead.");
  }
  const { deleteLocalDecision } = await import("./mock-data");
  deleteLocalDecision(id);
}
