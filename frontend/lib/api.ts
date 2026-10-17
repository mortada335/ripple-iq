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

export const API_BASE_URL = 
process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// Detect if we should attempt real API or fallback seamlessly
async function fetchWithFallback<T>(
  url: string,
  options?: RequestInit,
  fallback?: () => T | Promise<T>
): Promise<T> {
  const isMockOnly = process.env.NEXT_PUBLIC_USE_MOCK === "true";

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
          ...options?.headers,
        },
      });
    } catch {
      // An unreachable API can use local demo data. HTTP errors below are
      // returned to the caller so auth/validation failures are not hidden.
      if (fallback) return await fallback();
      throw new Error(`Could not reach the API for ${url}.`);
    } finally {
      clearTimeout(timeoutId);
    }

    if (!res.ok) {
      throw new Error(`API request failed (${res.status}) for ${url}.`);
    }
    return (await res.json()) as T;
  }

  if (fallback) {
    return await fallback();
  }

  throw new Error(`Failed to request ${url} and no fallback provided.`);
}

export async function checkApiHealth(): Promise<HealthResponse> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/v1/health`, {
      method: "GET",
      headers: { Accept: "application/json" },
      cache: "no-store",
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

export async function getDecisions(): Promise<Decision[]> {
  return fetchWithFallback<Decision[]>(
    "/api/v1/decisions",
    { method: "GET" },
    () => getLocalDecisions()
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
        student_population: Number(data.student_population) || 28000,
        faculty_count: Number(data.faculty_count) || 1400,
        active_laboratories: Number(data.active_laboratories) || 85,
        transit_dependency_rate: Number(data.transit_dependency_rate) || 68.5,
        key_assumptions: data.key_assumptions || [
          "Friday designated as remote asynchronous day",
        ],
        constraints: data.constraints || "Wet lab continuous operation required",
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
  const { archiveLocalDecision, getLocalDecision } = await import("./mock-data");
  archiveLocalDecision(id);
  return getLocalDecision(id);
}

export async function deleteDecision(id: number): Promise<void> {
  const { deleteLocalDecision } = await import("./mock-data");
  deleteLocalDecision(id);
}
