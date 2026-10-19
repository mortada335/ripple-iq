export type AuthSession = {
  accessToken: string;
  expiresAt: number;
};

const SESSION_KEY = "rippleiq_auth_session";
const DEMO_KEY = "rippleiq_demo_mode";
const ORGANIZATION_KEY = "rippleiq_active_organization";
export const SESSION_CHANGED_EVENT = "rippleiq:session-changed";
export const ORGANIZATION_CHANGED_EVENT = "rippleiq:active-organization-changed";

function readSessionValue(key: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

export function getAuthSession(): AuthSession | null {
  const raw = readSessionValue(SESSION_KEY);
  if (!raw) return null;
  try {
    const session = JSON.parse(raw) as Partial<AuthSession>;
    if (
      typeof session.accessToken !== "string" ||
      typeof session.expiresAt !== "number" ||
      session.expiresAt <= Date.now()
    ) {
      clearAuthSession();
      return null;
    }
    return session as AuthSession;
  } catch {
    clearAuthSession();
    return null;
  }
}

export function saveAuthSession(accessToken: string, expiresIn: number) {
  try {
    window.sessionStorage.setItem(
      SESSION_KEY,
      JSON.stringify({ accessToken, expiresAt: Date.now() + expiresIn * 1000 }),
    );
    window.sessionStorage.removeItem(DEMO_KEY);
    window.dispatchEvent(new Event(SESSION_CHANGED_EVENT));
  } catch {
    throw new Error("Browser session storage is unavailable. Enable it and try again.");
  }
}

export function clearAuthSession() {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(SESSION_KEY);
  } catch {
    // State is still cleared in memory when storage is unavailable.
  }
  window.dispatchEvent(new Event(SESSION_CHANGED_EVENT));
}

export function startDemoSession() {
  try {
    window.sessionStorage.setItem(DEMO_KEY, "true");
    window.sessionStorage.removeItem(SESSION_KEY);
  } catch {
    throw new Error("Browser session storage is unavailable. Enable it and try again.");
  }
  window.dispatchEvent(new Event(SESSION_CHANGED_EVENT));
}

export function clearDemoSession() {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(DEMO_KEY);
  } catch {
    // State is still cleared in memory when storage is unavailable.
  }
  window.dispatchEvent(new Event(SESSION_CHANGED_EVENT));
}

export function isDemoSession() {
  return readSessionValue(DEMO_KEY) === "true";
}

export function getActiveOrganizationId(): number | null {
  const raw = readSessionValue(ORGANIZATION_KEY);
  const id = raw ? Number(raw) : NaN;
  return Number.isInteger(id) && id > 0 ? id : null;
}

export function setActiveOrganizationId(id: number | null) {
  try {
    if (id === null) window.sessionStorage.removeItem(ORGANIZATION_KEY);
    else window.sessionStorage.setItem(ORGANIZATION_KEY, String(id));
  } catch {
    throw new Error("Could not save the selected organization for this tab.");
  }
  window.dispatchEvent(new Event(ORGANIZATION_CHANGED_EVENT));
}
