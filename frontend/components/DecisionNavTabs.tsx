"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Database,
  GitCompare,
  Users2,
  ShieldAlert,
  Award,
  FileText,
  ArrowRight,
  ArrowLeft,
  ChevronRight,
  ChevronLeft,
  Lock,
} from "lucide-react";

import { useLocale } from "@/components/LocaleProvider";

interface DecisionNavTabsProps {
  decisionId: string | number;
}

export function DecisionNavTabs({ decisionId }: DecisionNavTabsProps) {
  const pathname = usePathname();
  const { locale } = useLocale();
  const isAr = locale === "ar";

  // Step 00: Foundation & Context (Baseline input - Read-only once set)
  const contextTab = {
    step: "00",
    label: isAr ? "السياق" : "Context",
    fullLabel: isAr ? "السياق والمدخلات الأساسية (الخطوة 0)" : "Baseline Institutional Context (Step 0)",
    sublabel: isAr ? "الأساس" : "Baseline",
    href: `/decisions/${decisionId}/context`,
    icon: Database,
  };

  // Steps 01 to 05: The Solution Track (Analytical Simulation Journey)
  const solutionTabs = [
    {
      step: "01",
      label: isAr ? "السيناريوهات" : "Scenarios",
      fullLabel: isAr ? "مصفوفة السيناريوهات" : "Scenarios Matrix",
      href: `/decisions/${decisionId}/scenarios`,
      icon: GitCompare,
    },
    {
      step: "02",
      label: isAr ? "الآثار" : "Ripples",
      fullLabel: isAr ? "أصحاب المصلحة والآثار" : "Stakeholders & Ripples",
      href: `/decisions/${decisionId}/consequences`,
      icon: Users2,
    },
    {
      step: "03",
      label: isAr ? "المخاطر" : "Risks",
      fullLabel: isAr ? "سجل المخاطر" : "Risk Register",
      href: `/decisions/${decisionId}/risks`,
      icon: ShieldAlert,
    },
    {
      step: "04",
      label: isAr ? "التوصية" : "Recommend",
      fullLabel: isAr ? "التوصية التنفيذية" : "Recommendation",
      href: `/decisions/${decisionId}/recommendation`,
      icon: Award,
    },
    {
      step: "05",
      label: isAr ? "المذكرة" : "Memorandum",
      fullLabel: isAr ? "المذكرة النهائية" : "Memorandum",
      href: `/decisions/${decisionId}/report`,
      icon: FileText,
    },
  ];

  const isContextActive =
    pathname === contextTab.href || pathname.startsWith(`${contextTab.href}/`);

  return (
    <nav
      aria-label="Decision analysis workflow stages"
      className="w-full rounded-2xl border border-slate-200/90 bg-white/95 p-2 shadow-xs backdrop-blur-md dark:border-slate-800/90 dark:bg-slate-900/95 print:hidden overflow-x-auto no-scrollbar"
    >
      <div className="flex items-center min-w-max md:min-w-0 justify-between gap-1 w-full">
        {/* ─── Step 00: Baseline Context (Problem Formulation) ─── */}
        <div className="shrink-0">
          <Link
            href={contextTab.href}
            prefetch={true}
            title={contextTab.fullLabel}
            className={`group relative flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold transition-all duration-200 ${
              isContextActive
                ? "bg-slate-900 text-white shadow-xs dark:bg-indigo-600 dark:text-white"
                : "text-slate-700 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/60 dark:text-slate-300 dark:hover:bg-slate-800"
            }`}
          >
            <span
              className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md text-[10px] font-mono font-bold ${
                isContextActive
                  ? "bg-white/20 text-white"
                  : "bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300 group-hover:bg-indigo-100 group-hover:text-indigo-700 dark:group-hover:bg-indigo-900/60 dark:group-hover:text-indigo-300"
              }`}
            >
              00
            </span>
            <contextTab.icon
              className={`h-3.5 w-3.5 shrink-0 ${
                isContextActive ? "text-indigo-300 dark:text-white" : "text-slate-500 group-hover:text-slate-800 dark:text-slate-400"
              }`}
            />
            <div className="flex flex-col text-start">
              <span className="font-bold tracking-tight">{contextTab.label}</span>
              <span className="text-[9px] font-normal opacity-75 hidden sm:inline">
                {contextTab.sublabel}
              </span>
            </div>
            <Lock className={`h-3 w-3 shrink-0 ms-1 opacity-60 ${isContextActive ? "text-indigo-200" : "text-slate-400"}`} />
          </Link>
        </div>

        {/* ─── Elongated Directional Transition (Connecting Step 00 to Step 01) ─── */}
        <div className="flex items-center px-2 sm:px-4 shrink-0 gap-1.5 select-none" aria-hidden="true">
          <div className="h-[2px] w-4 sm:w-8 rounded-full bg-gradient-to-r from-slate-200 via-indigo-300 to-indigo-500 dark:from-slate-700 dark:via-indigo-600 dark:to-indigo-400" />
          <div className="flex items-center gap-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 border border-indigo-200/60 dark:border-indigo-800/60">
            <span className="text-[9px] font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-300 whitespace-nowrap">
              {isAr ? "مسار الحل" : "Solution Track"}
            </span>
            {isAr ? (
              <ArrowLeft className="h-3 w-3 text-indigo-600 dark:text-indigo-400 animate-pulse" />
            ) : (
              <ArrowRight className="h-3 w-3 text-indigo-600 dark:text-indigo-400 animate-pulse" />
            )}
          </div>
          <div className="h-[2px] w-4 sm:w-8 rounded-full bg-gradient-to-r from-indigo-500 via-indigo-300 to-slate-200 dark:from-indigo-400 dark:via-indigo-600 dark:to-slate-700" />
        </div>

        {/* ─── Steps 01 to 05: The Solution Stages ─── */}
        <div className="flex items-center flex-1 justify-between gap-1">
          {solutionTabs.map((tab, idx) => {
            const Icon = tab.icon;
            const isActive =
              pathname === tab.href ||
              (tab.href !== `/decisions/${decisionId}` && pathname.startsWith(`${tab.href}/`));

            return (
              <React.Fragment key={tab.href}>
                <Link
                  href={tab.href}
                  prefetch={true}
                  title={tab.fullLabel}
                  className={`group flex items-center justify-center gap-1.5 flex-1 rounded-xl px-2 py-2 text-xs font-semibold transition-all duration-200 text-center ${
                    isActive
                      ? "bg-slate-900 text-white shadow-xs dark:bg-indigo-600 dark:text-white"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                  }`}
                >
                  <span
                    className={`flex h-4 w-4 shrink-0 items-center justify-center rounded text-[9px] font-mono font-bold ${
                      isActive
                        ? "bg-white/20 text-white"
                        : "bg-slate-100 text-slate-500 group-hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400"
                    }`}
                  >
                    {tab.step}
                  </span>
                  <Icon
                    className={`h-3.5 w-3.5 shrink-0 ${
                      isActive
                        ? "text-indigo-300 dark:text-white"
                        : "text-slate-400 group-hover:text-slate-600 dark:text-slate-500 dark:group-hover:text-slate-300"
                    }`}
                  />
                  <span className="truncate">{tab.label}</span>
                </Link>

                {/* Subtle compact divider between solution steps */}
                {idx < solutionTabs.length - 1 && (
                  <span className="text-slate-300 dark:text-slate-700 shrink-0 select-none hidden lg:inline">
                    {isAr ? <ChevronLeft className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                  </span>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
