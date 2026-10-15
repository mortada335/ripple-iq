"use client";

import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Compass,
  Building2,
  ChevronDown,
  Activity,
  Check,
  LogOut,
  Sliders,
  Archive,
  RefreshCw,
} from "lucide-react";
import { checkApiHealth } from "@/lib/api";
import { HealthResponse } from "@/types/decision";

const UNIVERSITIES = [
  { id: "northstar", name: "Northstar University (Demo)", code: "NU" },
  { id: "riverside", name: "Riverside University (Demo)", code: "RU" },
  { id: "cedar-grove", name: "Cedar Grove University (Demo)", code: "CGU" },
  { id: "summit", name: "Summit University (Demo)", code: "SU" },
];

export function Header() {
  const router = useRouter();
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [refreshingHealth, setRefreshingHealth] = useState(false);
  const [selectedUniv, setSelectedUniv] = useState(UNIVERSITIES[0]);
  const [univDropdownOpen, setUnivDropdownOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  const univRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  const refreshHealth = () => {
    setRefreshingHealth(true);
    checkApiHealth()
      .then(setHealth)
      .finally(() => setRefreshingHealth(false));
  };

  useEffect(() => {
    let isMounted = true;
    checkApiHealth().then((data) => {
      if (isMounted) setHealth(data);
    });

    const handleClickOutside = (e: MouseEvent) => {
      if (univRef.current && !univRef.current.contains(e.target as Node)) {
        setUnivDropdownOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      isMounted = false;
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <header className="sticky top-0 z-40 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur transition-colors dark:border-slate-800 dark:bg-slate-950/95 sm:px-6">
      {/* Brand & Institution Switcher */}
      <div className="flex items-center gap-4 sm:gap-6">
        <Link href="/dashboard" className="flex items-center gap-2.5 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 text-white shadow-md shadow-slate-900/20 group-hover:bg-slate-800 transition-colors">
            <Compass className="h-5 w-5 text-indigo-400 group-hover:rotate-45 transition-transform duration-300" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold tracking-tight text-slate-900 dark:text-white text-base">
              Ripple<span className="text-indigo-600 dark:text-indigo-400">IQ</span>
            </span>
            <span className="text-[10px] font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
              University Decision Support
            </span>
          </div>
        </Link>

        {/* Vertical divider */}
        <div className="hidden h-6 w-px bg-slate-200 dark:bg-slate-800 md:block" />

        {/* University Switcher with Dropdown */}
        <div className="relative hidden md:block" ref={univRef}>
          <button
            onClick={() => setUnivDropdownOpen(!univDropdownOpen)}
            className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50/80 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
          >
            <Building2 className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
            <span className="font-semibold">{selectedUniv.name}</span>
            <ChevronDown className="h-3 w-3 text-slate-400" />
          </button>

          {univDropdownOpen && (
            <div className="absolute start-0 mt-2 w-72 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl dark:border-slate-800 dark:bg-slate-900 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Switch Institution
              </div>
              {UNIVERSITIES.map((univ) => (
                <button
                  key={univ.id}
                  onClick={() => {
                    setSelectedUniv(univ);
                    setUnivDropdownOpen(false);
                  }}
                  className={`flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-xs font-medium transition ${
                    selectedUniv.id === univ.id
                      ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 font-semibold"
                      : "text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                  }`}
                >
                  <span className="truncate">{univ.name}</span>
                  {selectedUniv.id === univ.id && (
                    <Check className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400 shrink-0 ms-2" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-3">
        {/* Backend Connectivity Status */}
        <button
          onClick={refreshHealth}
          title={
            health?.status === "healthy"
              ? "Live Backend Connected. Click to re-check."
              : "Client Mock Engine Active. Click to re-check backend."
          }
          className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium border cursor-pointer transition hover:opacity-85 ${
            health?.status === "healthy"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-300"
              : "border-slate-200 bg-slate-100 text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400"
          }`}
        >
          {refreshingHealth ? (
            <RefreshCw className="h-3 w-3 animate-spin text-slate-500" />
          ) : health?.status === "healthy" ? (
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
            </span>
          ) : (
            <Activity className="h-3 w-3 text-slate-500" />
          )}
          <span>{health?.status === "healthy" ? "API Live" : "Demo Engine"}</span>
        </button>

        {/* Language Switcher */}
        {/* <button
          onClick={toggleLanguage}
          className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-900 transition-colors"
          title="Toggle Language & Layout Direction"
        >
          <Globe className="h-3.5 w-3.5 text-slate-500" />
          <span>{lang === "EN" ? "EN" : "العربية"}</span>
        </button> */}

        {/* Current User Profile with Dropdown */}
        <div className="relative ps-1" ref={profileRef}>
          <button
            onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
            className="flex items-center gap-2 p-1 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-900 transition"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-tr from-indigo-600 to-violet-500 text-white font-semibold text-xs shadow-xs">
              SM
            </div>
            <div className="hidden flex-col text-start lg:flex">
              <span className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                Alex Morgan
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400">
                Academic Affairs Lead
              </span>
            </div>
            <ChevronDown className="h-3 w-3 text-slate-400 hidden lg:block" />
          </button>

          {profileDropdownOpen && (
            <div className="absolute end-0 mt-2 w-56 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl dark:border-slate-800 dark:bg-slate-900 z-50 animate-in fade-in zoom-in-95 duration-150 text-xs">
              <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800 mb-1">
                <p className="font-bold text-slate-900 dark:text-white">Alex Morgan</p>
                <p className="text-[11px] text-slate-500">Demo account · Academic Affairs</p>
              </div>

              <Link
                href="/settings"
                onClick={() => setProfileDropdownOpen(false)}
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 transition"
              >
                <Sliders className="h-3.5 w-3.5 text-slate-400" />
                <span>University Settings</span>
              </Link>

              <Link
                href="/decisions"
                onClick={() => setProfileDropdownOpen(false)}
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 transition"
              >
                <Archive className="h-3.5 w-3.5 text-slate-400" />
                <span>Historical Archive</span>
              </Link>

              <div className="my-1 border-t border-slate-100 dark:border-slate-800" />

              <button
                onClick={() => {
                  setProfileDropdownOpen(false);
                  router.push("/login");
                }}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition text-start"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
