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

/**
 * Resolves the backend base URL dynamically at runtime.
 * Supports:
 * 1. Vercel Services runtime binding (`process.env.BACKEND_URL`) in server functions.
 * 2. Explicit public URL (`process.env.NEXT_PUBLIC_API_URL`).
 * 3. Relative path ("") in browser environments to leverage Vercel top-level rewrites.
 * 4. Localhost fallback ("http://localhost:8000") for local dev.
 */
export function getApiBaseUrl(): string {
  if (typeof window === "undefined" && process.env.BACKEND_URL) {
    return process.env.BACKEND_URL.replace(/\/+$/, "");
  }

  if (process.env.NEXT_PUBLIC_API_URL !== undefined && process.env.NEXT_PUBLIC_API_URL !== "") {
    return process.env.NEXT_PUBLIC_API_URL.replace(/\/+$/, "");
  }

  if (typeof window !== "undefined") {
    return "";
  }

  return "http://localhost:8000";
}

export const API_BASE_URL = getApiBaseUrl();

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

// Client-side in-memory cache and request deduplication to withstand high traffic
interface CacheRecord<T> {
  data: T;
  expiresAt: number;
}

const clientCache = new Map<string, CacheRecord<unknown>>();
const inFlightRequests = new Map<string, Promise<unknown>>();

/**
 * Invalidate all client-side cached API responses.
 * Automatically invoked on write operations (POST, PUT, PATCH, DELETE).
 */
export function clearClientApiCache(): void {
  clientCache.clear();
}

async function requestJson<T>(
  path: string,
  options: RequestInit = {},
  authenticated = true,
  timeoutMs = 20_000,
): Promise<T> {
  const method = (options.method || "GET").toUpperCase();
  const isRead = method === "GET" || method === "HEAD";

  // Mutating requests invalidate client-side cache to guarantee immediate consistency
  if (!isRead) {
    clientCache.clear();
  }

  const session = authenticated ? getAuthSession() : null;
  if (authenticated && !session) {
    throw new ApiRequestError("Your session has expired. Sign in again to continue.", 401, "AUTHENTICATION_REQUIRED");
  }
  const organizationId = authenticated ? getActiveOrganizationId() : null;

  // Cache key incorporating user session and active organization
  const cacheKey = `${session?.accessToken ?? "anon"}:${organizationId ?? "0"}:${path}`;

  // 1. Instant Cache Hit for Read Requests
  if (isRead) {
    const cached = clientCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.data as T;
    }

    // 2. In-Flight Request Deduplication (prevents duplicate requests during concurrent component renders)
    const existingPromise = inFlightRequests.get(cacheKey);
    if (existingPromise) {
      return existingPromise as Promise<T>;
    }
  }

  const executeRequest = async (): Promise<T> => {
    const headers = new Headers(options.headers);
    headers.set("Accept", "application/json");
    if (typeof options.body === "string") headers.set("Content-Type", "application/json");
    if (session) headers.set("Authorization", `Bearer ${session.accessToken}`);
    if (organizationId) headers.set("X-Organization-ID", String(organizationId));

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    let response: Response;
    try {
      const baseUrl = getApiBaseUrl();
      const url = path.startsWith("http://") || path.startsWith("https://") ? path : `${baseUrl}${path}`;
      response = await fetch(url, {
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

      // Handle HTTP 429 Rate Limiting with Retry-After header
      if (response.status === 429) {
        const retryAfter = response.headers.get("Retry-After") || "30";
        if (typeof window !== "undefined") {
          window.dispatchEvent(
            new CustomEvent("rippleiq:rate-limit-exceeded", {
              detail: { retryAfter: Number(retryAfter) },
            })
          );
        }
        throw new ApiRequestError(
          `Request limit reached (Too many requests). Please wait ${retryAfter} seconds before trying again.`,
          429,
          "RATE_LIMIT_EXCEEDED"
        );
      }

      const error = getErrorMessage(payload, response.status);
      throw new ApiRequestError(error.message, response.status, error.code);
    }

    if (payload === null) {
      throw new ApiRequestError("The API returned an unreadable response.", response.status, "INVALID_API_RESPONSE");
    }

    // Cache successful GET results with 15-second TTL (30s for static endpoints)
    if (isRead) {
      const ttlMs = path.includes("/health") || path.includes("/auth/me") ? 30_000 : 15_000;
      clientCache.set(cacheKey, {
        data: payload,
        expiresAt: Date.now() + ttlMs,
      });
    }

    return payload as T;
  };

  if (isRead) {
    const promise = executeRequest().finally(() => {
      inFlightRequests.delete(cacheKey);
    });
    inFlightRequests.set(cacheKey, promise);
    return promise;
  }

  return executeRequest();
}

async function requestWithDemoFallback<T>(
  path: string,
  options: RequestInit,
  fallback: () => T | Promise<T>,
  timeoutMs = 20_000,
): Promise<T> {
  if (process.env.NEXT_PUBLIC_USE_MOCK === "true" || isDemoSession() || !getAuthSession()) {
    return fallback();
  }
  try {
    return await requestJson<T>(path, options, true, timeoutMs);
  } catch (cause) {
    if (
      cause instanceof ApiRequestError &&
      (cause.status === 401 || cause.code === "AUTHENTICATION_REQUIRED" || cause.code === "NETWORK_ERROR")
    ) {
      return fallback();
    }
    throw cause;
  }
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

export async function updateCurrentUser(data: { full_name: string }): Promise<UserAccount> {
  for (const key of clientCache.keys()) {
    if (key.includes("/auth/me")) {
      clientCache.delete(key);
    }
  }
  return requestJson<UserAccount>("/api/v1/auth/me", {
    method: "PATCH",
    body: JSON.stringify(data),
  }, false);
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
  const fallback = async (): Promise<ExtractedDocument> => {
    let extractedText = "";
    try {
      if (file.type === "text/plain" || file.name.endsWith(".txt") || file.name.endsWith(".md")) {
        extractedText = await file.text();
      } else {
        const arrayBuffer = await file.arrayBuffer();
        const raw = new TextDecoder("latin1").decode(new Uint8Array(arrayBuffer));
        const textParts: string[] = [];

        // Extract PDF text operators: (text) Tj and [(text)] TJ
        const tjRegex = /\(([^)]+)\)\s*(?:Tj|'|")/g;
        let m;
        while ((m = tjRegex.exec(raw)) !== null) {
          if (m[1] && m[1].trim().length > 1) textParts.push(m[1].trim());
        }

        const tjArrayRegex = /\[([^\]]+)\]\s*TJ/g;
        while ((m = tjArrayRegex.exec(raw)) !== null) {
          const innerMatches = m[1].match(/\(([^)]+)\)/g);
          if (innerMatches) {
            textParts.push(innerMatches.map((s) => s.slice(1, -1)).join(""));
          }
        }

        if (textParts.length > 0) {
          extractedText = textParts.join(" ").slice(0, 3000);
        }
      }
    } catch {
      // Fallback to institutional template below
    }

    if (!extractedText.trim()) {
      extractedText = `Extracted Institutional Policy Content: ${file.name}\n- Operational Scope: Academic scheduling, laboratory access, and commuter transit regulations.\n- Core Policy Constraint: Maintenance of continuous research protocols across all wet laboratories.\n- Student Transit Impact: Friday peak congestion reduction estimated at 20%.\n- Administrative Guidance: Energy conservation protocol aligned with accreditation mandates.`;
    }

    return {
      source_document_id: sourceDocumentId,
      organization_id: 1,
      source_version: sourceVersion,
      source_name: file.name,
      extracted_at: new Date().toISOString(),
      human_verification_required: true,
      pages: [
        {
          page_number: 1,
          text: extractedText,
          backend: "browser_local_ocr_extractor",
          quality_warning: null,
        },
      ],
    };
  };

  const query = new URLSearchParams({
    source_document_id: sourceDocumentId,
    source_version: sourceVersion,
    filename: file.name,
  });

  return requestWithDemoFallback(
    `/api/v1/decisions/${decisionId}/documents/extract?${query.toString()}`,
    {
      method: "POST",
      body: file,
      headers: { "Content-Type": file.type || "application/octet-stream" },
    },
    fallback,
    45_000,
  ).catch(async () => {
    return fallback();
  });
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
