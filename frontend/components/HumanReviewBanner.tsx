"use client";

import React, { useState } from "react";
import { AlertTriangle, ShieldCheck, ChevronDown, ChevronUp } from "lucide-react";

export function HumanReviewBanner() {
  const [minimized, setMinimized] = useState(true);

  if (minimized) {
    return (
      <div className="flex items-center justify-between rounded-lg border border-amber-300/80 bg-amber-50/80 px-3 py-1.5 text-xs text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-200 transition">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-amber-600 dark:text-amber-400" />
          <span className="font-semibold text-[11px]">
            Decision Support Only — Human Review Required
          </span>
        </div>
        <button
          type="button"
          onClick={() => setMinimized(false)}
          className="text-[11px] font-semibold text-amber-800 hover:text-amber-950 dark:text-amber-300 dark:hover:text-amber-100 flex items-center gap-1 cursor-pointer"
        >
          <span>Details</span>
          <ChevronDown className="h-3 w-3" />
        </button>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-xl border border-amber-300 bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50 p-3 shadow-xs dark:border-amber-900/40 dark:from-amber-950/30 dark:via-orange-950/20 dark:to-amber-950/30 transition">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5">
          <div className="rounded-lg bg-amber-500/15 p-1.5 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400 shrink-0">
            <AlertTriangle className="h-4 w-4" />
          </div>
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300">
                Organization Decision Review
              </span>
              <span className="inline-flex items-center gap-1 rounded bg-amber-200/60 px-1.5 py-0.5 text-[10px] font-semibold text-amber-900 dark:bg-amber-900/60 dark:text-amber-200">
                <ShieldCheck className="h-3 w-3" />
                Human Review Required
              </span>
            </div>
            <p className="text-[11px] leading-relaxed text-amber-900/90 dark:text-amber-200/90">
              RippleIQ outputs are algorithmic decision-support models intended to inform leadership deliberation. 
              Decision-makers and affected teams make final decisions after reviewing the analysis.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setMinimized(true)}
          className="text-[11px] font-semibold text-amber-800 hover:text-amber-950 dark:text-amber-300 flex items-center gap-1 shrink-0 p-1 cursor-pointer"
        >
          <span>Collapse</span>
          <ChevronUp className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}
