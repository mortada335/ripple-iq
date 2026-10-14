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
} from "lucide-react";

interface DecisionNavTabsProps {
  decisionId: string | number;
}

export function DecisionNavTabs({ decisionId }: DecisionNavTabsProps) {
  const pathname = usePathname();

  const tabs = [
    {
      label: "1. Operational Context",
      href: `/decisions/${decisionId}/context`,
      icon: FileCode2,
    },
    {
      label: "2. Scenarios Matrix",
      href: `/decisions/${decisionId}/scenarios`,
      icon: GitCompare,
    },
    {
      label: "3. Stakeholders & Ripples",
      href: `/decisions/${decisionId}/consequences`,
      icon: Users2,
    },
    {
      label: "4. Risk Register",
      href: `/decisions/${decisionId}/risks`,
      icon: ShieldAlert,
    },
    {
      label: "5. Recommendation",
      href: `/decisions/${decisionId}/recommendation`,
      icon: Award,
    },
    {
      label: "6. Decision Memorandum",
      href: `/decisions/${decisionId}/report`,
      icon: FileText,
    },
  ];

  return (
    <div className="w-full border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950/80">
      <div className="flex gap-1 overflow-x-auto px-4 sm:px-6 py-2 no-scrollbar">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = pathname === tab.href;

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex items-center gap-2 whitespace-nowrap rounded-lg px-3.5 py-2 text-xs font-semibold transition-all ${
                isActive
                  ? "bg-slate-900 text-white shadow-xs dark:bg-indigo-600 dark:text-white"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-slate-200"
              }`}
            >
              <Icon
                className={`h-3.5 w-3.5 ${
                  isActive ? "text-white" : "text-slate-400 dark:text-slate-500"
                }`}
              />
              <span>{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
