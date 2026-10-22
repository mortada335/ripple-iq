"use client";

import React from "react";
import { Globe } from "lucide-react";
import { useLocale } from "@/components/LocaleProvider";

export function LanguageToggle({ className = "" }: { className?: string }) {
  const { locale, toggleLocale } = useLocale();

  return (
    <button
      type="button"
      onClick={toggleLocale}
      aria-label={locale === "ar" ? "Switch interface to English" : "تبديل الواجهة إلى العربية"}
      title={locale === "ar" ? "Switch to English" : "التبديل إلى العربية"}
      className={`shrink-0 inline-flex h-9 items-center gap-1.5 rounded-xl border border-slate-200/80 bg-slate-50/80 px-2.5 text-xs font-semibold text-slate-700 shadow-2xs backdrop-blur-sm transition-all hover:border-slate-300 hover:bg-slate-100 hover:text-slate-950 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-200 dark:hover:border-slate-700 dark:hover:bg-slate-800 dark:hover:text-white cursor-pointer ${className}`}
    >
      <Globe className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" aria-hidden="true" />
      <span className="font-semibold text-xs whitespace-nowrap">
        {locale === "ar" ? "English" : "العربية"}
      </span>
    </button>
  );
}
