"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Archive,
  Building2,
  ChevronDown,
  Compass,
  LayoutDashboard,
  LogOut,
  Menu,
  PlusCircle,
  RefreshCw,
  ShieldCheck,
  Sliders,
  UserRound,
} from "lucide-react";
import { checkApiHealth } from "@/lib/api";
import type { HealthResponse } from "@/types/decision";
import { useAuth } from "@/components/AuthProvider";
import { CharterModal } from "@/components/CharterModal";
import { ThemeToggle } from "@/components/ThemeToggle";
import { translate, type Locale } from "@/lib/locale";

export function Header({ onOpenNavigation }: { onOpenNavigation: () => void }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, organizations, activeOrganizationId, isDemo, selectOrganization, signOut } = useAuth();
  const activeOrganization = organizations.find((item) => item.id === activeOrganizationId);
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [refreshingHealth, setRefreshingHealth] = useState(true);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [charterOpen, setCharterOpen] = useState(false);
  const [locale, setLocale] = useState<Locale>("en");
  const profileRef = useRef<HTMLDivElement>(null);

  const refreshHealth = () => {
    setRefreshingHealth(true);
    checkApiHealth()
      .then(setHealth)
      .catch(() => setHealth(null))
      .finally(() => setRefreshingHealth(false));
  };

  useEffect(() => {
    let isMounted = true;
    checkApiHealth()
      .then((data) => {
        if (isMounted) setHealth(data);
      })
      .catch(() => {
        if (isMounted) setHealth(null);
      })
      .finally(() => {
        if (isMounted) setRefreshingHealth(false);
      });

    const readLocale = () => {
      try {
        const settings = JSON.parse(localStorage.getItem("rippleiq_settings") ?? "{}") as { language?: string };
        setLocale(settings.language === "ar" ? "ar" : "en");
      } catch {
        setLocale("en");
      }
    };
    readLocale();
    window.addEventListener("rippleiq:locale-updated", readLocale);
    window.addEventListener("storage", readLocale);

    const closeOnOutsideClick = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", closeOnOutsideClick);
    return () => {
      isMounted = false;
      window.removeEventListener("rippleiq:locale-updated", readLocale);
      window.removeEventListener("storage", readLocale);
      document.removeEventListener("mousedown", closeOnOutsideClick);
    };
  }, []);

  const t = (key: Parameters<typeof translate>[1]) => translate(locale, key);

  const isDashboardActive = pathname === "/dashboard";
  const isNewDecisionActive = pathname === "/decisions/new";
  const isDecisionsActive = pathname === "/decisions" || (pathname.startsWith("/decisions/") && pathname !== "/decisions/new");
  const isSettingsActive = pathname === "/settings" || pathname === "/onboarding";

  return (
    <>
      <header className="sticky top-0 z-40 flex h-16 w-full items-center justify-between border-b border-slate-200/80 bg-white/95 px-3 backdrop-blur-md dark:border-slate-800/80 dark:bg-slate-950/95 sm:px-6 lg:px-8">
        {/* Left: Mobile menu toggle + Brand + Org Selector + Desktop Navigation */}
        <div className="flex min-w-0 items-center gap-2 sm:gap-4 lg:gap-6">
          <button
            type="button"
            onClick={onOpenNavigation}
            aria-label="Open navigation menu"
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-700 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 dark:text-slate-200 dark:hover:bg-slate-800 md:hidden"
          >
            <Menu className="h-5 w-5" aria-hidden="true" />
          </button>

          <Link href="/dashboard" className="group flex shrink-0 items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm ring-2 ring-indigo-500/20 transition-transform group-hover:scale-105">
              <Compass className="h-5 w-5 text-white transition-transform group-hover:rotate-45" aria-hidden="true" />
            </span>
            <span className="flex flex-col">
              <span className="text-base font-extrabold tracking-tight text-slate-950 dark:text-white">
                Ripple<span className="text-indigo-600 dark:text-indigo-400">IQ</span>
              </span>
              <span className="hidden text-[9px] font-semibold uppercase tracking-wider text-slate-500 sm:block">
                Decision Intelligence
              </span>
            </span>
          </Link>

          {/* Org Selector Pill - Hidden on smaller screens to prevent collision */}
          <div className="hidden xl:flex items-center">
            {isDemo ? (
              <Link
                href="/onboarding"
                className="inline-flex items-center gap-1.5 rounded-full border border-amber-200/80 bg-amber-50/80 px-2.5 py-1 text-xs font-semibold text-amber-900 transition hover:bg-amber-100 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-200"
              >
                <Building2 className="h-3.5 w-3.5 text-amber-700 dark:text-amber-400" aria-hidden="true" />
                <span className="max-w-28 truncate">Demo Workspace</span>
                <span className="rounded-full bg-amber-200/80 px-1.5 py-0.2 text-[9px] font-bold uppercase text-amber-900 dark:bg-amber-900 dark:text-amber-200">
                  Demo
                </span>
              </Link>
            ) : organizations.length > 1 ? (
              <label className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50/80 px-2.5 py-1 text-xs font-semibold text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
                <Building2 className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" aria-hidden="true" />
                <select
                  aria-label="Active organization"
                  value={activeOrganizationId ?? ""}
                  onChange={(event) => selectOrganization(Number(event.target.value))}
                  className="rounded border-0 bg-transparent py-0 text-xs font-semibold text-slate-700 focus:ring-0 dark:text-slate-200"
                >
                  {organizations.map((org) => (
                    <option key={org.id} value={org.id}>
                      {org.name}
                    </option>
                  ))}
                </select>
              </label>
            ) : activeOrganization ? (
              <span className="inline-flex max-w-40 items-center gap-1.5 truncate rounded-full border border-slate-200 bg-slate-50/80 px-2.5 py-1 text-xs font-semibold text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
                <Building2 className="h-3.5 w-3.5 shrink-0 text-indigo-600 dark:text-indigo-400" aria-hidden="true" />
                <span className="truncate">{activeOrganization.name}</span>
              </span>
            ) : null}
          </div>

          {/* Desktop Top Navbar Links */}
          <nav aria-label="Main horizontal navigation" className="hidden md:flex items-center gap-1">
            <Link
              href="/dashboard"
              aria-current={isDashboardActive ? "page" : undefined}
              className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-all ${
                isDashboardActive
                  ? "bg-slate-900 text-white shadow-xs dark:bg-white dark:text-slate-900"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-slate-200"
              }`}
            >
              <LayoutDashboard className="h-3.5 w-3.5" aria-hidden="true" />
              <span>{t("dashboard")}</span>
            </Link>

            <Link
              href="/decisions"
              aria-current={isDecisionsActive ? "page" : undefined}
              className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-all ${
                isDecisionsActive
                  ? "bg-slate-900 text-white shadow-xs dark:bg-white dark:text-slate-900"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-slate-200"
              }`}
            >
              <Archive className="h-3.5 w-3.5" aria-hidden="true" />
              <span>{t("history")}</span>
            </Link>

            <Link
              href="/settings"
              aria-current={isSettingsActive ? "page" : undefined}
              className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-all ${
                isSettingsActive
                  ? "bg-slate-900 text-white shadow-xs dark:bg-white dark:text-slate-900"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-slate-200"
              }`}
            >
              <Sliders className="h-3.5 w-3.5" aria-hidden="true" />
              <span>{t("settings")}</span>
            </Link>

            <div className="mx-0.5 h-4 w-px bg-slate-200 dark:bg-slate-800" aria-hidden="true" />

            {/* Quick Action: New Decision button */}
            <Link
              href="/decisions/new"
              aria-current={isNewDecisionActive ? "page" : undefined}
              className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-all shadow-xs ${
                isNewDecisionActive
                  ? "bg-indigo-700 text-white ring-2 ring-indigo-500/30"
                  : "bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow"
              }`}
            >
              <PlusCircle className="h-3.5 w-3.5" aria-hidden="true" />
              <span className="hidden lg:inline">{t("newDecision")}</span>
              <span className="lg:hidden">New</span>
            </Link>
          </nav>
        </div>

        {/* Right: Theme Toggle + Responsible AI Badge + API Health + User Profile */}
        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          {/* Light / Dark Mode Toggle */}
          <ThemeToggle />

          {/* Responsible AI Charter Trigger */}
          <button
            type="button"
            onClick={() => setCharterOpen(true)}
            title="Responsible AI Charter: Advisory Decision Support"
            className="hidden xl:inline-flex items-center gap-1.5 rounded-full border border-indigo-200/80 bg-indigo-50/70 px-2.5 py-1 text-[11px] font-semibold text-indigo-800 transition hover:bg-indigo-100 dark:border-indigo-900/60 dark:bg-indigo-950/40 dark:text-indigo-300"
          >
            <ShieldCheck className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" aria-hidden="true" />
            <span>Charter</span>
          </button>

          {/* API Health Indicator - compact on small screens */}
          <button
            type="button"
            onClick={refreshHealth}
            aria-label={
              refreshingHealth
                ? "Checking backend status"
                : health?.status === "healthy"
                ? "Backend connected. Click to refresh."
                : "Backend unavailable. Click to retry."
            }
            title={health?.status === "healthy" ? "Backend connected" : "Backend offline (local fallback active)"}
            disabled={refreshingHealth}
            className={`inline-flex min-h-8 items-center gap-1.5 rounded-full border px-2 text-[11px] font-semibold transition hover:opacity-85 sm:px-2.5 ${
              health?.status === "healthy"
                ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-300"
                : "border-slate-200 bg-slate-100 text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
            }`}
          >
            {refreshingHealth ? (
              <RefreshCw className="h-3 w-3 animate-spin" aria-hidden="true" />
            ) : (
              <span className="relative flex h-2 w-2">
                <span
                  className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-75 ${
                    health?.status === "healthy" ? "bg-emerald-400" : "bg-slate-400"
                  }`}
                />
                <span
                  className={`relative inline-flex h-2 w-2 rounded-full ${
                    health?.status === "healthy" ? "bg-emerald-500" : "bg-slate-400"
                  }`}
                />
              </span>
            )}
            <span className="hidden sm:inline">
              {refreshingHealth ? "Checking" : health?.status === "healthy" ? "API Live" : "Offline"}
            </span>
          </button>

          {/* User Profile Dropdown */}
          <div className="relative" ref={profileRef}>
            <button
              type="button"
              onClick={() => setProfileDropdownOpen((open) => !open)}
              aria-expanded={profileDropdownOpen}
              aria-controls="profile-menu"
              className="inline-flex min-h-9 items-center gap-1.5 rounded-xl p-1 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 dark:hover:bg-slate-900 sm:p-1.5"
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-200 font-bold text-xs ring-1 ring-indigo-500/20">
                <UserRound className="h-3.5 w-3.5" aria-hidden="true" />
              </span>
              <span className="hidden text-start lg:block">
                <span className="block max-w-28 truncate text-xs font-semibold text-slate-900 dark:text-white">
                  {isDemo ? "Demo User" : user?.full_name ?? "Account"}
                </span>
              </span>
              <ChevronDown className="hidden h-3.5 w-3.5 text-slate-400 sm:block" aria-hidden="true" />
            </button>

            {profileDropdownOpen && (
              <div
                id="profile-menu"
                className="absolute inset-e-0 mt-2 w-56 rounded-xl border border-slate-200 bg-white p-1.5 text-xs shadow-xl dark:border-slate-800 dark:bg-slate-900"
              >
                <div className="border-b border-slate-100 px-3 py-2 dark:border-slate-800">
                  <p className="font-bold text-slate-900 dark:text-white truncate">{isDemo ? "Demo Workspace" : user?.full_name}</p>
                  <p className="text-[11px] text-slate-500 truncate">{isDemo ? "Local mode preview" : user?.email}</p>
                </div>
                <div className="py-1">
                  <Link
                    href="/dashboard"
                    onClick={() => setProfileDropdownOpen(false)}
                    className="flex items-center gap-2 rounded-lg px-3 py-2 text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                  >
                    <LayoutDashboard className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" /> Dashboard
                  </Link>
                  <Link
                    href="/decisions/new"
                    onClick={() => setProfileDropdownOpen(false)}
                    className="flex items-center gap-2 rounded-lg px-3 py-2 text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                  >
                    <PlusCircle className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" /> New Decision
                  </Link>
                  <Link
                    href="/decisions"
                    onClick={() => setProfileDropdownOpen(false)}
                    className="flex items-center gap-2 rounded-lg px-3 py-2 text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                  >
                    <Archive className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" /> Decision History
                  </Link>
                  <Link
                    href="/onboarding"
                    onClick={() => setProfileDropdownOpen(false)}
                    className="flex items-center gap-2 rounded-lg px-3 py-2 text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                  >
                    <Building2 className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" /> Organization Profile
                  </Link>
                  <Link
                    href="/settings"
                    onClick={() => setProfileDropdownOpen(false)}
                    className="flex items-center gap-2 rounded-lg px-3 py-2 text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                  >
                    <Sliders className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" /> Preferences
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      setProfileDropdownOpen(false);
                      setCharterOpen(true);
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-start text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                  >
                    <ShieldCheck className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" /> Responsible AI Charter
                  </button>
                </div>
                <div className="my-1 border-t border-slate-100 dark:border-slate-800" />
                <button
                  type="button"
                  onClick={() => {
                    setProfileDropdownOpen(false);
                    signOut();
                    router.replace("/login");
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-start font-medium text-rose-700 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/30"
                >
                  <LogOut className="h-3.5 w-3.5" aria-hidden="true" /> Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Charter Modal */}
      <CharterModal isOpen={charterOpen} onClose={() => setCharterOpen(false)} />
    </>
  );
}
