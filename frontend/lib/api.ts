import {
  Decision,
  DecisionCreate,
  ContextData,
  SimulationResult,
  ReportResponse,
  HealthResponse,
} from "@/types/decision";
import {
  DEMO_DECISION,
  DEMO_REPORT_MARKDOWN,
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

export const API_BASE_URL = 
process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// Detect if we should attempt real API or fallback seamlessly
async function fetchWithFallback<T>(
  url: string,
  options?: RequestInit,
  fallback?: () => T | Promise<T>
): Promise<T> {
  const isMockOnly = process.env.NEXT_PUBLIC_USE_MOCK === "true" || isDemoSession();
  const session = getAuthSession();

  if (!isMockOnly) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);
    let res: Response;
    try {
      res = await fetch(`${API_BASE_URL}${url}`, {
        ...options,
        signal: controller.signal,
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          ...(session ? { Authorization: `Bearer ${session.accessToken}` } : {}),
          ...(getActiveOrganizationId() ? { "X-Organization-ID": String(getActiveOrganizationId()) } : {}),
          ...options?.headers,
        },
      });
    } catch {
      // Never show mock organization data in an authenticated session.
      if (fallback && !session) return await fallback();
      throw new Error(`Could not reach the API for ${url}.`);
    } finally {
      clearTimeout(timeoutId);
    }

    if (!res.ok) {
      if (res.status === 401) clearAuthSession();
      throw new Error(`API request failed (${res.status}) for ${url}.`);
    }
    return (await res.json()) as T;
  }

  if (fallback) {
    return await fallback();
  }

  throw new Error(`Failed to request ${url} and no fallback provided.`);
}

async function requestJson<T>(path: string, options: RequestInit = {}, authenticated = true): Promise<T> {
  const session = authenticated ? getAuthSession() : null;
  const organizationId = authenticated ? getActiveOrganizationId() : null;
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      Accept: "application/json",
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...(session ? { Authorization: `Bearer ${session.accessToken}` } : {}),
      ...(organizationId ? { "X-Organization-ID": String(organizationId) } : {}),
      ...options.headers,
    },
    cache: "no-store",
  });
  if (!response.ok) {
    if (response.status === 401 && authenticated) clearAuthSession();
    let message = `Request failed (${response.status}).`;
    try {
      const body = await response.json();
      message = body?.detail?.message ?? body?.error?.message ?? body?.detail ?? message;
      if (typeof message !== "string") message = `Request failed (${response.status}).`;
    } catch {
      // Keep the status-based message for non-JSON errors.
    }
    throw new Error(message);
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export async function registerAccount(data: { email: string; full_name: string; password: string }): Promise<UserAccount> {
  return requestJson<UserAccount>("/api/v1/auth/register", { method: "POST", body: JSON.stringify(data) }, false);
}

export async function loginAccount(email: string, password: string): Promise<UserAccount> {
  const token = await requestJson<LoginResponse>("/api/v1/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  }, false);
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
    const res = await fetch(`${API_BASE_URL}/api/v1/health`, {
      method: "GET",
      headers: { Accept: "application/json" },
      cache: "no-store",
      signal: AbortSignal.timeout(3000),
    });
    if (res.ok) {
      const data = await res.json();
      return {
        status: data.status === "healthy" ? "healthy" : "degraded",
        environment: data.environment || "connected",
        database: data.database || "connected",
        analyzer_mode: data.analyzer_mode || "mock_deterministic",
        version: "0.1.0",
      };
    }
  } catch {
    // Offline
  }

  return {
    status: "disconnected",
    environment: "demo-client-mode",
    database: "offline",
    analyzer_mode: "browser-mock-engine",
    version: "0.1.0 (local demo)",
  };
}

export async function getDecisions(offset = 0, limit = 20): Promise<Decision[]> {
  return fetchWithFallback<Decision[]>(
    `/api/v1/decisions?offset=${offset}&limit=${limit}`,
    { method: "GET" },
    () => getLocalDecisions().slice(offset, offset + limit)
  );
}

export async function getDecision(id: number): Promise<Decision> {
  return fetchWithFallback<Decision>(
    `/api/v1/decisions/${id}`,
    { method: "GET" },
    () => {
      const dec = getLocalDecision(id);
      if (!dec) {
        return {
          ...DEMO_DECISION,
          id,
        };
      }
      return dec;
    }
  );
}

export async function createDecision(data: DecisionCreate): Promise<Decision> {
  return fetchWithFallback<Decision>(
    "/api/v1/decisions",
    {
      method: "POST",
      body: JSON.stringify(data),
    },
    () => {
      const current = getLocalDecisions();
      const newId = current.length > 0 ? Math.max(...current.map((d) => d.id)) + 1 : 2;
      const newDecision: Decision = {
        id: newId,
        title: data.title,
        description: data.description,
        department: data.department,
        time_horizon: data.time_horizon,
        priority: data.priority,
        status: "DRAFT",
        context_attached: false,
        simulation_ready: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      saveLocalDecision(newDecision);
      return newDecision;
    }
  );
}

export async function attachDecisionContext(
  decisionId: number,
  data: Partial<ContextData>
): Promise<ContextData> {
  return fetchWithFallback<ContextData>(
    `/api/v1/decisions/${decisionId}/context`,
    {
      method: "POST",
      body: JSON.stringify(data),
    },
    () => {
      const context: ContextData = {
        decision_id: decisionId,
        student_population: data.student_population ?? null,
        faculty_count: data.faculty_count ?? null,
        active_laboratories: data.active_laboratories ?? null,
        transit_dependency_rate: data.transit_dependency_rate ?? null,
        key_assumptions: data.key_assumptions ?? [],
        constraints: data.constraints ?? null,
        raw_metadata: data.raw_metadata,
        created_at: new Date().toISOString(),
      };
      saveLocalContext(context);

      const dec = getLocalDecision(decisionId);
      if (dec) {
        dec.context_attached = true;
        saveLocalDecision(dec);
      }
      return context;
    }
  );
}

export async function runSimulation(decisionId: number): Promise<{ message: string }> {
  return fetchWithFallback<{ message: string }>(
    `/api/v1/decisions/${decisionId}/simulate`,
    {
      method: "POST",
      body: JSON.stringify({}),
    },
    () => {
      const dec = getLocalDecision(decisionId);
      if (dec) {
        dec.status = "COMPLETED";
        dec.simulation_ready = true;
        saveLocalDecision(dec);
      }
      const sim = getLocalSimulationResult(decisionId);
      saveLocalSimulationResult(decisionId, sim);
      return { message: "Simulation executed successfully across 5 stakeholder groups and 3 scenarios." };
    }
  );
}

export async function getSimulationResult(decisionId: number): Promise<SimulationResult> {
  return fetchWithFallback<SimulationResult>(
    `/api/v1/decisions/${decisionId}/result`,
    { method: "GET" },
    () => getLocalSimulationResult(decisionId)
  );
}

export async function getReport(decisionId: number): Promise<ReportResponse> {
  return fetchWithFallback<ReportResponse>(
    `/api/v1/decisions/${decisionId}/report`,
    { method: "GET" },
    () => {
      const dec = getLocalDecision(decisionId) || DEMO_DECISION;
      return {
        decision_id: decisionId,
        filename: `rippleiq-decision-${decisionId}-report.md`,
        content_markdown: DEMO_REPORT_MARKDOWN.replace(
          "Reduce in-person university attendance from five days to four days per week",
          dec.title
        ),
        generated_at: new Date().toISOString(),
        checksum: "sha256-3b4f93a1029c9918a243d9319e8cf1902",
      };
    }
  );
}

export async function toggleArchiveDecision(id: number): Promise<Decision | null> {
  if (process.env.NEXT_PUBLIC_USE_MOCK === "true" || isDemoSession()) {
    const { archiveLocalDecision, getLocalDecision } = await import("./mock-data");
    archiveLocalDecision(id);
    return getLocalDecision(id);
  }
  await requestJson<void>(`/api/v1/decisions/${id}`, { method: "DELETE" });
  return null;
}

export async function deleteDecision(id: number): Promise<void> {
  if (!isDemoSession() && process.env.NEXT_PUBLIC_USE_MOCK !== "true") {
    throw new Error("Permanent deletion is not available in the organization API.");
  }
  const { deleteLocalDecision } = await import("./mock-data");
  deleteLocalDecision(id);
}
