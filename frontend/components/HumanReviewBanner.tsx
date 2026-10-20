"use client";

import React, { useState } from "react";
import { AlertTriangle, ShieldCheck, ChevronDown, ChevronUp, Eye } from "lucide-react";

interface HumanReviewBannerProps {
  sticky?: boolean;
}

export function HumanReviewBanner({ sticky = false }: HumanReviewBannerProps) {
  const [minimized, setMinimized] = useState(false);

  if (minimized) {
    return (
      <div className={`flex items-center justify-between rounded-lg border-l-4 border-l-amber-500 border border-amber-300/80 bg-amber-50/80 px-3 py-2 text-xs text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-200 transition ${sticky ? "sticky top-0 z-30" : ""}`}>
        <div className="flex items-center gap-2">
          <Eye className="h-3.5 w-3.5 shrink-0 text-amber-600 dark:text-amber-400" />
          <span className="font-semibold">Decision Support Only — Human Review Required</span>
        </div>
        <button
          type="button"
          onClick={() => setMinimized(false)}
          className="text-[11px] font-semibold text-amber-800 hover:text-amber-950 dark:text-amber-300 dark:hover:text-amber-100 flex items-center gap-1 cursor-pointer ml-3 shrink-0"
        >
          <span>Details</span>
          <ChevronDown className="h-3 w-3" />
        </button>
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden rounded-xl border-l-4 border-l-amber-500 border border-amber-300 bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50 p-4 shadow-sm dark:border-amber-900/40 dark:from-amber-950/30 dark:via-orange-950/20 dark:to-amber-950/30 transition ${sticky ? "sticky top-0 z-30" : ""}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="rounded-lg bg-amber-500/20 p-2 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400 shrink-0 mt-0.5">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300">
                Decision Support Only
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-200/80 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-900 dark:bg-amber-900/60 dark:text-amber-200 border border-amber-300 dark:border-amber-800">
                <ShieldCheck className="h-3 w-3" />
                Human Review Required
              </span>
            </div>
            <p className="text-xs leading-relaxed text-amber-900/90 dark:text-amber-200/90 max-w-2xl">
              RippleIQ outputs are AI-assisted decision-support models intended to inform deliberation —
              not replace it. Authorized decision-makers and affected stakeholders make final decisions
              after reviewing this analysis with appropriate domain expertise.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setMinimized(true)}
          className="text-[11px] font-semibold text-amber-800 hover:text-amber-950 dark:text-amber-300 flex items-center gap-1 shrink-0 p-1 cursor-pointer rounded"
          aria-label="Minimize review notice"
        >
          <span className="hidden sm:inline">Collapse</span>
          <ChevronUp className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}
