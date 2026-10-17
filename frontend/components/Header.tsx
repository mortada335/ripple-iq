"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Activity,
  Archive,
  Building2,
  ChevronDown,
  Compass,
  LogOut,
  Menu,
  RefreshCw,
  Sliders,
  UserRound,
} from "lucide-react";
import { checkApiHealth } from "@/lib/api";
import { useOrganizationProfile } from "@/lib/use-organization";
import type { HealthResponse } from "@/types/decision";

export function Header({ onOpenNavigation }: { onOpenNavigation: () => void }) {
  const router = useRouter();
  const organization = useOrganizationProfile();
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [refreshingHealth, setRefreshingHealth] = useState(true);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
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
    checkApiHealth().then((data) => {
      if (isMounted) setHealth(data);
    }).catch(() => {
      if (isMounted) setHealth(null);
    }).finally(() => {
      if (isMounted) setRefreshingHealth(false);
    });

    const closeOnOutsideClick = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", closeOnOutsideClick);
    return () => {
      isMounted = false;
      document.removeEventListener("mousedown", closeOnOutsideClick);
    };
  }, []);

  return (
    <header className="sticky top-0 z-40 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white/95 px-3 backdrop-blur dark:border-slate-800 dark:bg-slate-950/95 sm:px-6">
      <div className="flex min-w-0 items-center gap-3 sm:gap-5">
        <button
          type="button"
          onClick={onOpenNavigation}
          aria-label="Open navigation menu"
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-slate-700 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 dark:text-slate-200 dark:hover:bg-slate-800 md:hidden"
        >
          <Menu className="h-5 w-5" aria-hidden="true" />
        </button>
        <Link href="/dashboard" className="group flex shrink-0 items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-950 text-white shadow-sm dark:bg-indigo-600">
            <Compass className="h-5 w-5 text-indigo-300 transition-transform group-hover:rotate-45" aria-hidden="true" />
          </span>
          <span className="flex flex-col">
            <span className="text-base font-bold tracking-tight text-slate-950 dark:text-white">Ripple<span className="text-indigo-600 dark:text-indigo-400">IQ</span></span>
            <span className="hidden text-[9px] font-semibold uppercase tracking-wider text-slate-500 sm:block">Decision impact analysis</span>
          </span>
        </Link>

        <span className="hidden h-7 w-px bg-slate-200 dark:bg-slate-800 md:block" aria-hidden="true" />
        <Link href="/onboarding" className="hidden min-w-0 items-center gap-2 rounded-lg px-2.5 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-indigo-600 dark:text-slate-200 dark:hover:bg-slate-800 sm:flex">
          <Building2 className="h-4 w-4 shrink-0 text-indigo-600 dark:text-indigo-400" aria-hidden="true" />
          <span className="max-w-48 truncate">{organization.name}</span>
          <span className="hidden rounded-full bg-amber-100 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-amber-800 lg:inline dark:bg-amber-950 dark:text-amber-200">Demo</span>
        </Link>
      </div>

      <div className="flex shrink-0 items-center gap-2 sm:gap-3">
        <button
          type="button"
          onClick={refreshHealth}
          aria-label={refreshingHealth ? "Checking backend status" : health?.status === "healthy" ? "Backend connected. Refresh status." : "Backend unavailable. Refresh status."}
          title="Check backend connection"
          disabled={refreshingHealth}
          className={`inline-flex min-h-9 items-center gap-1.5 rounded-full border px-2.5 text-[10px] font-semibold transition hover:opacity-85 sm:text-[11px] ${
            health?.status === "healthy"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-300"
              : "border-slate-200 bg-slate-100 text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
          }`}
        >
          {refreshingHealth ? <RefreshCw className="h-3.5 w-3.5 animate-spin" aria-hidden="true" /> : <Activity className="h-3.5 w-3.5" aria-hidden="true" />}
          <span className="hidden sm:inline">{refreshingHealth ? "Checking API" : health?.status === "healthy" ? "API connected" : "API unavailable"}</span>
        </button>

        <div className="relative" ref={profileRef}>
          <button
            type="button"
            onClick={() => setProfileDropdownOpen((open) => !open)}
            aria-expanded={profileDropdownOpen}
            aria-controls="profile-menu"
            className="inline-flex min-h-10 items-center gap-2 rounded-xl px-2 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 dark:hover:bg-slate-900"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-200"><UserRound className="h-4 w-4" aria-hidden="true" /></span>
            <span className="hidden text-start sm:block"><span className="block text-xs font-semibold text-slate-900 dark:text-white">Demo user</span><span className="block text-[10px] text-slate-500">Local prototype</span></span>
            <ChevronDown className="hidden h-3.5 w-3.5 text-slate-400 sm:block" aria-hidden="true" />
          </button>

          {profileDropdownOpen && (
            <div id="profile-menu" className="absolute end-0 mt-2 w-56 rounded-xl border border-slate-200 bg-white p-1.5 text-xs shadow-xl dark:border-slate-800 dark:bg-slate-900">
              <div className="border-b border-slate-100 px-3 py-2 dark:border-slate-800">
                <p className="font-bold text-slate-900 dark:text-white">Demo account</p>
                <p className="text-[11px] text-slate-500">Account features need backend auth</p>
              </div>
              <Link href="/onboarding" onClick={() => setProfileDropdownOpen(false)} className="flex items-center gap-2 rounded-lg px-3 py-2 text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800">
                <Building2 className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" /> Organization profile
              </Link>
              <Link href="/settings" onClick={() => setProfileDropdownOpen(false)} className="flex items-center gap-2 rounded-lg px-3 py-2 text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800">
                <Sliders className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" /> Preferences
              </Link>
              <Link href="/decisions" onClick={() => setProfileDropdownOpen(false)} className="flex items-center gap-2 rounded-lg px-3 py-2 text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800">
                <Archive className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" /> Decision history
              </Link>
              <div className="my-1 border-t border-slate-100 dark:border-slate-800" />
              <button type="button" onClick={() => { setProfileDropdownOpen(false); router.push("/login"); }} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-start text-rose-700 hover:bg-rose-50 dark:text-rose-300 dark:hover:bg-rose-950/30">
                <LogOut className="h-3.5 w-3.5" aria-hidden="true" /> Leave demo
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
