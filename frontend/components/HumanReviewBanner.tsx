"use client";

import React, { useState } from "react";
import { AlertTriangle, ShieldCheck, ChevronDown, ChevronUp, Eye } from "lucide-react";
import { useLocale } from "@/components/LocaleProvider";

interface HumanReviewBannerProps {
  sticky?: boolean;
}

export function HumanReviewBanner({ sticky = false }: HumanReviewBannerProps) {
  const [minimized, setMinimized] = useState(false);
  const { t, isRtl } = useLocale();

  if (minimized) {
    return (
      <div
        className={`flex items-center justify-between rounded-xl border border-amber-300/80 bg-amber-50/80 px-3.5 py-2 text-xs text-amber-900 dark:border-amber-500/30 dark:bg-[#151722] dark:text-amber-200 backdrop-blur-md transition shadow-2xs ${
          isRtl ? "border-r-4 border-r-amber-500" : "border-l-4 border-l-amber-500"
        } ${sticky ? "sticky top-0 z-30" : ""}`}
      >
        <div className="flex items-center gap-2">
          <Eye className="h-3.5 w-3.5 shrink-0 text-amber-600 dark:text-amber-400" />
          <span className="font-semibold">
            {t("decisionSupportOnly")} — {t("humanReviewRequired")}
          </span>
        </div>
        <button
          type="button"
          onClick={() => setMinimized(false)}
          className="text-[11px] font-semibold text-amber-800 hover:text-amber-950 dark:text-amber-300 dark:hover:text-amber-100 flex items-center gap-1 cursor-pointer ms-3 shrink-0"
        >
          <span>{t("details")}</span>
          <ChevronDown className="h-3 w-3" />
        </button>
      </div>
    );
  }

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border border-amber-300/70 bg-gradient-to-r from-amber-50/90 via-orange-50/50 to-amber-50/90 p-4 shadow-xs dark:border-amber-500/30 dark:bg-gradient-to-r dark:from-[#171a25] dark:via-[#141620] dark:to-[#171a25] backdrop-blur-md transition ${
        isRtl ? "border-r-4 border-r-amber-500" : "border-l-4 border-l-amber-500"
      } ${sticky ? "sticky top-0 z-30" : ""}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-amber-500/15 p-2 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400 shrink-0 mt-0.5">
            <AlertTriangle className="h-4.5 w-4.5" />
          </div>
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300">
                {t("decisionSupportOnly")}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-200/80 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-900 dark:bg-amber-500/20 dark:text-amber-200 border border-amber-300 dark:border-amber-500/30">
                <ShieldCheck className="h-3 w-3" />
                {t("humanReviewRequired")}
              </span>
            </div>
            <p className="text-xs leading-relaxed text-amber-900/90 dark:text-slate-300 max-w-3xl">
              {t("bannerNotice")}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setMinimized(true)}
          className="text-[11px] font-semibold text-amber-800 hover:text-amber-950 dark:text-amber-300 dark:hover:text-amber-100 flex items-center gap-1 shrink-0 p-1 cursor-pointer rounded-lg hover:bg-amber-200/40 dark:hover:bg-amber-900/30 transition"
          aria-label={t("collapse")}
        >
          <span className="hidden sm:inline">{t("collapse")}</span>
          <ChevronUp className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
