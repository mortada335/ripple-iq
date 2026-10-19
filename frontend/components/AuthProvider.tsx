"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { ApiRequestError, getCurrentUser, getOrganizations } from "@/lib/api";
import {
  clearAuthSession, clearDemoSession, getActiveOrganizationId, getAuthSession,
  isDemoSession, setActiveOrganizationId, startDemoSession,
  SESSION_CHANGED_EVENT, ORGANIZATION_CHANGED_EVENT,
} from "@/lib/session";
import type { Organization, UserAccount } from "@/types/auth";

type AuthState = {
  user: UserAccount | null;
  organizations: Organization[];
  activeOrganizationId: number | null;
  isDemo: boolean;
  loading: boolean;
  authError: string | null;
  refresh: () => Promise<boolean>;
  selectOrganization: (id: number) => void;
  startDemo: () => void;
  signOut: () => void;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserAccount | null>(null);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [activeOrganizationId, setActiveId] = useState<number | null>(null);
  const [isDemo, setIsDemo] = useState(false);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setAuthError(null);
    const demo = isDemoSession();
    setIsDemo(demo);
    if (demo) {
      setUser(null);
      setOrganizations([]);
      setActiveId(null);
      setLoading(false);
      return false;
    }
    if (!getAuthSession()) {
      setUser(null);
      setOrganizations([]);
      setActiveId(null);
      setLoading(false);
      return false;
    }
    try {
      const [currentUser, orgs] = await Promise.all([getCurrentUser(), getOrganizations()]);
      const storedId = getActiveOrganizationId();
      const activeId = orgs.some((org) => org.id === storedId) ? storedId : orgs[0]?.id ?? null;
      setUser(currentUser);
      setOrganizations(orgs);
      setActiveId(activeId);
      if (activeId !== storedId) setActiveOrganizationId(activeId);
      return orgs.length > 0;
    } catch (cause) {
      if (cause instanceof ApiRequestError && cause.status === 401) {
        clearAuthSession();
        setUser(null);
        setOrganizations([]);
        setActiveId(null);
        return false;
      }
      setAuthError(cause instanceof Error ? cause.message : "Could not verify the saved session.");
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    const run = async () => {
      await Promise.resolve();
      if (active) {
        void refresh();
      }
    };
    void run();
    const sync = () => void refresh();
    window.addEventListener(SESSION_CHANGED_EVENT, sync);
    window.addEventListener(ORGANIZATION_CHANGED_EVENT, sync);
    return () => {
      active = false;
      window.removeEventListener(SESSION_CHANGED_EVENT, sync);
      window.removeEventListener(ORGANIZATION_CHANGED_EVENT, sync);
    };
  }, [refresh]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.dispatchEvent(new Event("rippleiq:active-organization-updated"));
  }, [activeOrganizationId]);

  const value = useMemo<AuthState>(() => ({
    user, organizations, activeOrganizationId, isDemo, loading, authError, refresh,
    selectOrganization(id) {
      if (organizations.some((org) => org.id === id)) {
        setActiveId(id);
        setActiveOrganizationId(id);
      }
    },
    startDemo() { startDemoSession(); },
    signOut() { clearAuthSession(); clearDemoSession(); setActiveOrganizationId(null); },
  }), [user, organizations, activeOrganizationId, isDemo, loading, authError, refresh]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside AuthProvider");
  return value;
}
