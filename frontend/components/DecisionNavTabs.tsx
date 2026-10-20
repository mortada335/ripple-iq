"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FileCode2,
  GitCompare,
  Users2,
  ShieldAlert,
  Award,
  FileText,
  ChevronRight,
} from "lucide-react";

interface DecisionNavTabsProps {
  decisionId: string | number;
}

export function DecisionNavTabs({ decisionId }: DecisionNavTabsProps) {
  const pathname = usePathname();

  const tabs = [
    {
      step: "01",
      label: "Operational Context",
      shortLabel: "Context",
      href: `/decisions/${decisionId}/context`,
      icon: FileCode2,
    },
    {
      step: "02",
      label: "Scenarios Matrix",
      shortLabel: "Scenarios",
      href: `/decisions/${decisionId}/scenarios`,
      icon: GitCompare,
    },
    {
      step: "03",
      label: "Stakeholders & Ripples",
      shortLabel: "Ripples",
      href: `/decisions/${decisionId}/consequences`,
      icon: Users2,
    },
    {
      step: "04",
      label: "Risk Register",
      shortLabel: "Risks",
      href: `/decisions/${decisionId}/risks`,
      icon: ShieldAlert,
    },
    {
      step: "05",
      label: "Strategic Recommendation",
      shortLabel: "Recommendation",
      href: `/decisions/${decisionId}/recommendation`,
      icon: Award,
    },
    {
      step: "06",
      label: "Decision Memorandum",
      shortLabel: "Memorandum",
      href: `/decisions/${decisionId}/report`,
      icon: FileText,
    },
  ];

  return (
    <nav
      aria-label="Decision analysis workflow stages"
      className="w-full overflow-hidden rounded-2xl border border-slate-200/80 bg-white/90 p-1.5 shadow-sm backdrop-blur-md dark:border-slate-800/80 dark:bg-slate-900/90"
    >
      <div className="flex items-center gap-1 overflow-x-auto no-scrollbar scroll-smooth px-1">
        {tabs.map((tab, idx) => {
          const Icon = tab.icon;
          const isActive = pathname === tab.href;

          return (
            <React.Fragment key={tab.href}>
              <Link
                href={tab.href}
                className={`group relative flex shrink-0 items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold transition-all duration-200 ${
                  isActive
                    ? "bg-gradient-to-r from-slate-900 to-indigo-950 text-white shadow-md shadow-indigo-950/20 dark:from-indigo-600 dark:to-indigo-700 dark:text-white"
                    : "text-slate-600 hover:bg-slate-100/80 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/70 dark:hover:text-slate-200"
                }`}
              >
                <span
                  className={`flex h-4 w-4 shrink-0 items-center justify-center rounded text-[10px] font-mono font-bold ${
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
                      ? "text-indigo-300 dark:text-indigo-200"
                      : "text-slate-400 group-hover:text-slate-600 dark:text-slate-500 dark:group-hover:text-slate-300"
                  }`}
                />
                <span className="hidden md:inline">{tab.label}</span>
                <span className="inline md:hidden">{tab.shortLabel}</span>
              </Link>
              {idx < tabs.length - 1 && (
                <ChevronRight className="h-3 w-3 shrink-0 text-slate-300 dark:text-slate-700" />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </nav>
  );
}
