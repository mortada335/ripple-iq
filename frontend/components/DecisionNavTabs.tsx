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

import { useLocale } from "@/components/LocaleProvider";

interface DecisionNavTabsProps {
  decisionId: string | number;
}

export function DecisionNavTabs({ decisionId }: DecisionNavTabsProps) {
  const pathname = usePathname();
  const { locale, t } = useLocale();

  const tabs = [
    {
      step: "01",
      label: locale === "ar" ? "السياق" : "Context",
      fullLabel: locale === "ar" ? "السياق التشغيلي" : "Operational Context",
      href: `/decisions/${decisionId}/context`,
      icon: FileCode2,
    },
    {
      step: "02",
      label: locale === "ar" ? "السيناريوهات" : "Scenarios",
      fullLabel: locale === "ar" ? "مصفوفة السيناريوهات" : "Scenarios Matrix",
      href: `/decisions/${decisionId}/scenarios`,
      icon: GitCompare,
    },
    {
      step: "03",
      label: locale === "ar" ? "الآثار" : "Ripples",
      fullLabel: locale === "ar" ? "أصحاب المصلحة والآثار" : "Stakeholders & Ripples",
      href: `/decisions/${decisionId}/consequences`,
      icon: Users2,
    },
    {
      step: "04",
      label: locale === "ar" ? "المخاطر" : "Risks",
      fullLabel: locale === "ar" ? "سجل المخاطر" : "Risk Register",
      href: `/decisions/${decisionId}/risks`,
      icon: ShieldAlert,
    },
    {
      step: "05",
      label: locale === "ar" ? "التوصية" : "Recommend",
      fullLabel: locale === "ar" ? "التوصية التنفيذية" : "Recommendation",
      href: `/decisions/${decisionId}/recommendation`,
      icon: Award,
    },
    {
      step: "06",
      label: locale === "ar" ? "المذكرة" : "Memorandum",
      fullLabel: locale === "ar" ? "المذكرة النهائية" : "Memorandum",
      href: `/decisions/${decisionId}/report`,
      icon: FileText,
    },
  ];

  return (
    <nav
      aria-label="Decision analysis workflow stages"
      className="w-full rounded-2xl border border-slate-200/80 bg-white/95 p-1.5 shadow-xs backdrop-blur-md dark:border-slate-800/80 dark:bg-slate-900/95"
    >
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-1 w-full">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = pathname === tab.href;

          return (
            <Link
              key={tab.href}
              href={tab.href}
              title={tab.fullLabel}
              className={`group flex items-center justify-center gap-1.5 rounded-xl px-2 py-2 text-xs font-semibold transition-all duration-200 text-center ${
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
          );
        })}
      </div>
    </nav>
  );
}
