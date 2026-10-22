"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { DecisionNavTabs } from "@/components/DecisionNavTabs";

interface SkeletonProps {
  className?: string;
}

/**
 * High-performance, shimmering skeleton block.
 * Uses a gentle pulse combined with a sweeping shimmer gradient for an ultra-premium feel.
 */
export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-md bg-slate-200/80 dark:bg-slate-800/80",
        "after:absolute after:inset-0 after:-translate-x-full after:animate-[shimmer_2s_infinite] after:bg-gradient-to-r after:from-transparent after:via-white/30 dark:after:via-white/5 after:to-transparent",
        className
      )}
    />
  );
}

export function CardSkeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-slate-200/80 bg-white/90 p-5 shadow-xs dark:border-slate-800/80 dark:bg-slate-900/90 space-y-3",
        className
      )}
    >
      <Skeleton className="h-4 w-1/3" />
      <Skeleton className="h-3 w-2/3" />
      <Skeleton className="h-3 w-1/2" />
    </div>
  );
}

export function DecisionCardSkeleton() {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-5 shadow-xs dark:border-slate-800/80 dark:bg-slate-900/90 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-2 flex-1">
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-16 rounded-md" />
            <Skeleton className="h-4 w-20 rounded-md" />
            <Skeleton className="h-4 w-24 rounded-full" />
          </div>
          <Skeleton className="h-5 w-3/4 rounded-md" />
        </div>
        <Skeleton className="h-6 w-16 rounded-full" />
      </div>

      <Skeleton className="h-3.5 w-full rounded-md" />
      <Skeleton className="h-3.5 w-4/5 rounded-md" />

      <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800/80">
        <div className="flex items-center gap-3">
          <Skeleton className="h-4 w-24 rounded-md" />
          <Skeleton className="h-4 w-20 rounded-md" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-24 rounded-xl" />
          <Skeleton className="h-8 w-20 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

export function TableRowSkeleton({ cols = 5 }: { cols?: number }) {
  return (
    <tr className="border-b border-slate-100 dark:border-slate-800">
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-4 py-3.5">
          <Skeleton className={`h-3.5 ${i === 0 ? "w-3/4" : i === 1 ? "w-1/2" : "w-1/3"}`} />
        </td>
      ))}
    </tr>
  );
}

/**
 * Skeleton placeholder for the Unified Header
 */
export function HeaderSkeleton() {
  return (
    <header className="sticky top-0 z-40 flex h-16 w-full items-center justify-between border-b border-slate-200/80 bg-white/95 px-3 backdrop-blur-md dark:border-slate-800/80 dark:bg-slate-950/95 sm:px-6 lg:px-8">
      {/* Brand & Segmented Nav */}
      <div className="flex items-center gap-3">
        <Skeleton className="h-9 w-9 rounded-xl" />
        <div className="space-y-1">
          <Skeleton className="h-4 w-20 rounded-md" />
          <Skeleton className="hidden sm:block h-2.5 w-28 rounded-md" />
        </div>
        <div className="hidden lg:flex items-center gap-1.5 ms-4 rounded-xl bg-slate-100/90 p-0.5 border border-slate-200/80 dark:bg-slate-900/90 dark:border-slate-800">
          <Skeleton className="h-8 w-24 rounded-lg" />
          <Skeleton className="h-8 w-24 rounded-lg" />
          <Skeleton className="h-8 w-24 rounded-lg" />
        </div>
      </div>

      {/* Utilities */}
      <div className="flex items-center gap-2">
        <Skeleton className="h-9 w-20 rounded-xl" />
        <Skeleton className="h-9 w-9 rounded-xl" />
        <Skeleton className="hidden sm:block h-9 w-24 rounded-xl" />
        <Skeleton className="h-9 w-28 rounded-xl" />
      </div>
    </header>
  );
}

/**
 * Skeleton placeholder for the Sidebar navigation
 */
export function SidebarSkeleton() {
  return (
    <aside className="hidden md:flex w-64 shrink-0 flex-col gap-6 border-e border-slate-200/80 bg-white/95 p-4 dark:border-slate-800/80 dark:bg-slate-950/95 min-h-[calc(100vh-4rem)]">
      <div className="space-y-2">
        <Skeleton className="h-3 w-20 rounded-md mb-3" />
        <Skeleton className="h-10 w-full rounded-xl" />
        <Skeleton className="h-10 w-full rounded-xl" />
        <Skeleton className="h-10 w-full rounded-xl" />
      </div>

      <div className="space-y-2 pt-4 border-t border-slate-100 dark:border-slate-800">
        <Skeleton className="h-3 w-24 rounded-md mb-3" />
        <Skeleton className="h-10 w-full rounded-xl" />
        <Skeleton className="h-10 w-full rounded-xl" />
      </div>
    </aside>
  );
}

/**
 * Skeleton placeholder for the Executive Dashboard
 */
export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Executive Command Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-slate-200/80 bg-white/90 p-5 sm:p-6 shadow-xs backdrop-blur-md dark:border-slate-800/80 dark:bg-slate-900/90">
        <div className="space-y-2.5 flex-1">
          <div className="flex items-center gap-2">
            <Skeleton className="h-3 w-3 rounded-full" />
            <Skeleton className="h-3.5 w-32 rounded-md" />
          </div>
          <Skeleton className="h-7 w-64 rounded-lg" />
          <Skeleton className="h-4 w-96 max-w-full rounded-md" />
        </div>
        <div className="flex items-center gap-2.5">
          <Skeleton className="hidden md:block h-9 w-32 rounded-xl" />
        </div>
      </div>

      {/* 4 KPI Summary Cards */}
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="rounded-2xl border border-slate-200/80 bg-white/90 p-4 shadow-xs dark:border-slate-800/80 dark:bg-slate-900/90 space-y-3"
          >
            <div className="flex items-center justify-between">
              <Skeleton className="h-3.5 w-24 rounded-md" />
              <Skeleton className="h-8 w-8 rounded-xl" />
            </div>
            <Skeleton className="h-8 w-12 rounded-lg" />
            <Skeleton className="h-3 w-20 rounded-md" />
          </div>
        ))}
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Skeleton className="h-10 w-full sm:w-80 rounded-xl" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-44 rounded-xl" />
          <Skeleton className="h-9 w-18 rounded-xl" />
        </div>
      </div>

      {/* Decision Cards List */}
      <div className="space-y-3.5">
        {[...Array(3)].map((_, i) => (
          <DecisionCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

export function PageSkeleton() {
  return <DashboardSkeleton />;
}

/**
 * Skeleton placeholder for Decisions History page
 */
export function DecisionsListSkeleton() {
  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1.5">
          <Skeleton className="h-7 w-40 rounded-lg" />
          <Skeleton className="h-3.5 w-72 rounded-md" />
        </div>
        <Skeleton className="hidden md:block h-9 w-28 rounded-xl" />
      </div>

      <Skeleton className="h-10 w-full max-w-md rounded-xl" />

      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white/90 shadow-xs dark:border-slate-800/80 dark:bg-slate-900/90 divide-y divide-slate-100 dark:divide-slate-800">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 gap-3">
            <div className="space-y-2 flex-1">
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-44 rounded-md" />
                <Skeleton className="h-4 w-16 rounded-full" />
              </div>
              <Skeleton className="h-3.5 w-3/4 rounded-md" />
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="h-8 w-20 rounded-xl" />
              <Skeleton className="h-8 w-16 rounded-xl" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Skeleton placeholder for Decision Detail & Analysis overview
 */
export function DecisionDetailSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-5 sm:p-6 shadow-xs backdrop-blur-md dark:border-slate-800/80 dark:bg-slate-900/90 space-y-4">
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-16 rounded-full" />
          <Skeleton className="h-4 w-20 rounded-full" />
          <Skeleton className="h-4 w-28 rounded-md" />
        </div>
        <Skeleton className="h-7 w-3/4 rounded-lg" />
        <Skeleton className="h-4 w-full max-w-2xl rounded-md" />
      </div>

      {/* Tabs Row */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {[...Array(6)].map((_, i) => (
          <Skeleton key={i} className="h-9 w-28 shrink-0 rounded-xl" />
        ))}
      </div>

      {/* Main Analysis Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="rounded-2xl border border-slate-200/80 bg-white/90 p-5 shadow-xs dark:border-slate-800/80 dark:bg-slate-900/90 space-y-3"
          >
            <Skeleton className="h-5 w-28 rounded-md" />
            <Skeleton className="h-3.5 w-full rounded-md" />
            <Skeleton className="h-3.5 w-2/3 rounded-md" />
            <Skeleton className="h-28 w-full rounded-xl mt-3" />
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Skeleton placeholder for analysis subpages (Scenarios, Risks, Recommendations, Reports, Consequences).
 * If decisionId is passed, renders the real interactive DecisionNavTabs so the user can see and click tabs,
 * followed by a multi-card analysis skeleton.
 */
export function DecisionAnalysisSkeleton({ decisionId }: { decisionId?: string | number }) {
  return (
    <div className="space-y-5">
      {decisionId ? (
        <DecisionNavTabs decisionId={decisionId} />
      ) : (
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-9 w-28 shrink-0 rounded-xl" />
          ))}
        </div>
      )}

      {/* Analysis Headline Placeholder */}
      <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-5 shadow-xs dark:border-slate-800/80 dark:bg-slate-900/90 space-y-3">
        <Skeleton className="h-6 w-52 rounded-md" />
        <Skeleton className="h-3.5 w-full max-w-xl rounded-md" />
      </div>

      {/* Grid of structured analytical cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="rounded-2xl border border-slate-200/80 bg-white/90 p-5 shadow-xs dark:border-slate-800/80 dark:bg-slate-900/90 space-y-3"
          >
            <div className="flex items-center justify-between">
              <Skeleton className="h-5 w-28 rounded-md" />
              <Skeleton className="h-6 w-14 rounded-full" />
            </div>
            <Skeleton className="h-3.5 w-full rounded-md" />
            <Skeleton className="h-3.5 w-4/5 rounded-md" />
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 space-y-2">
              <Skeleton className="h-3 w-1/2 rounded-md" />
              <Skeleton className="h-16 w-full rounded-xl" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Skeleton placeholder for Settings page
 */
export function SettingsSkeleton() {
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="space-y-1.5">
        <Skeleton className="h-7 w-36 rounded-lg" />
        <Skeleton className="h-3.5 w-64 rounded-md" />
      </div>

      <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-6 shadow-xs dark:border-slate-800/80 dark:bg-slate-900/90 space-y-4">
        <Skeleton className="h-5 w-32 rounded-md" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Skeleton className="h-20 rounded-xl" />
          <Skeleton className="h-20 rounded-xl" />
          <Skeleton className="h-20 rounded-xl" />
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-6 shadow-xs dark:border-slate-800/80 dark:bg-slate-900/90 space-y-4">
        <Skeleton className="h-5 w-40 rounded-md" />
        <Skeleton className="h-10 w-full max-w-sm rounded-xl" />
      </div>
    </div>
  );
}

/**
 * Skeleton placeholder for New Decision Form page (/decisions/new)
 */
export function NewDecisionFormSkeleton() {
  return (
    <div className="space-y-6">
      {/* Stepper bar skeleton */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 border-b border-slate-200/80 pb-4 dark:border-slate-800/80">
        <Skeleton className="h-4 w-48 rounded-md" />
        <Skeleton className="h-7 w-72 rounded-lg" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Main Column */}
        <div className="lg:col-span-8 space-y-6">
          <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-5 sm:p-6 shadow-xs dark:border-slate-800/80 dark:bg-slate-900/90 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-2 flex-1">
              <Skeleton className="h-3.5 w-32 rounded-md" />
              <Skeleton className="h-7 w-3/4 rounded-lg" />
              <Skeleton className="h-3.5 w-5/6 rounded-md" />
            </div>
            <Skeleton className="h-10 w-44 rounded-xl" />
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white/95 p-6 sm:p-7 shadow-xs dark:border-slate-800/80 dark:bg-slate-900/95 space-y-6">
            <div className="space-y-2">
              <Skeleton className="h-3.5 w-36 rounded-md" />
              <Skeleton className="h-11 w-full rounded-xl" />
              <div className="flex gap-2 pt-1">
                <Skeleton className="h-6 w-24 rounded-lg" />
                <Skeleton className="h-6 w-28 rounded-lg" />
                <Skeleton className="h-6 w-32 rounded-lg" />
              </div>
            </div>

            <div className="space-y-2">
              <Skeleton className="h-3.5 w-44 rounded-md" />
              <Skeleton className="h-32 w-full rounded-xl" />
              <Skeleton className="h-12 w-full rounded-xl" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-2">
                <Skeleton className="h-3.5 w-28 rounded-md" />
                <Skeleton className="h-10 w-full rounded-xl" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-3.5 w-28 rounded-md" />
                <Skeleton className="h-10 w-full rounded-xl" />
              </div>
            </div>

            <div className="space-y-2.5">
              <Skeleton className="h-3.5 w-36 rounded-md" />
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <Skeleton className="h-20 rounded-xl" />
                <Skeleton className="h-20 rounded-xl" />
                <Skeleton className="h-20 rounded-xl" />
                <Skeleton className="h-20 rounded-xl" />
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-slate-100 pt-6 dark:border-slate-800/80">
              <Skeleton className="h-10 w-24 rounded-xl" />
              <div className="flex gap-3">
                <Skeleton className="h-10 w-28 rounded-xl" />
                <Skeleton className="h-10 w-48 rounded-xl" />
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar Column */}
        <div className="lg:col-span-4 space-y-5">
          <div className="rounded-2xl border border-slate-200/80 bg-white/95 p-5 shadow-xs dark:border-slate-800/80 dark:bg-slate-900/95 space-y-3">
            <Skeleton className="h-4 w-40 rounded-md" />
            <Skeleton className="h-3.5 w-full rounded-md" />
            <div className="space-y-2 pt-1">
              <Skeleton className="h-9 w-full rounded-xl" />
              <Skeleton className="h-9 w-full rounded-xl" />
              <Skeleton className="h-9 w-full rounded-xl" />
              <Skeleton className="h-9 w-full rounded-xl" />
              <Skeleton className="h-9 w-full rounded-xl" />
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white/95 p-5 shadow-xs dark:border-slate-800/80 dark:bg-slate-900/95 space-y-3">
            <Skeleton className="h-4 w-36 rounded-md" />
            <Skeleton className="h-16 w-full rounded-xl" />
            <Skeleton className="h-16 w-full rounded-xl" />
            <Skeleton className="h-16 w-full rounded-xl" />
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white/95 p-5 shadow-xs dark:border-slate-800/80 dark:bg-slate-900/95 space-y-2">
            <Skeleton className="h-4 w-32 rounded-md" />
            <Skeleton className="h-4 w-full rounded-md" />
            <Skeleton className="h-4 w-full rounded-md" />
            <Skeleton className="h-4 w-3/4 rounded-md" />
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Skeleton placeholder for Simulation Progress page (/decisions/[id]/progress)
 */
export function SimulationProgressSkeleton({ decisionId }: { decisionId?: string | number }) {
  return (
    <div className="space-y-6">
      {decisionId ? (
        <DecisionNavTabs decisionId={decisionId} />
      ) : (
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-9 w-28 shrink-0 rounded-xl" />
          ))}
        </div>
      )}

      <div className="mx-auto max-w-3xl space-y-6">
        {/* Simulation Hero Card */}
        <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-8 shadow-xs dark:border-slate-800/80 dark:bg-slate-900/90 text-center space-y-4">
          <Skeleton className="mx-auto h-14 w-14 rounded-2xl" />
          <div className="space-y-2">
            <Skeleton className="mx-auto h-7 w-64 rounded-lg" />
            <Skeleton className="mx-auto h-3.5 w-32 rounded-md" />
          </div>
          <div className="flex justify-center gap-3">
            <Skeleton className="h-6 w-24 rounded-full" />
            <Skeleton className="h-6 w-24 rounded-full" />
          </div>
          <Skeleton className="h-2.5 w-full max-w-lg mx-auto rounded-full mt-4" />
        </div>

        {/* 5 Sequential Stages */}
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="flex items-start gap-4 rounded-2xl border border-slate-200/80 bg-white/90 p-4 sm:p-5 shadow-xs dark:border-slate-800/80 dark:bg-slate-900/90"
            >
              <Skeleton className="h-9 w-9 shrink-0 rounded-xl" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-48 rounded-md" />
                <Skeleton className="h-3 w-4/5 rounded-md" />
              </div>
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Skeleton placeholder for Board Report & Memoranda (/decisions/[id]/report)
 */
export function ReportDocumentSkeleton({ decisionId }: { decisionId?: string | number }) {
  return (
    <div className="space-y-6">
      {decisionId ? (
        <DecisionNavTabs decisionId={decisionId} />
      ) : (
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-9 w-28 shrink-0 rounded-xl" />
          ))}
        </div>
      )}

      {/* Document Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-2xl border border-slate-200/80 bg-white/90 p-5 shadow-xs dark:border-slate-800/80 dark:bg-slate-900/90">
        <div className="space-y-2">
          <Skeleton className="h-6 w-56 rounded-md" />
          <Skeleton className="h-3.5 w-40 rounded-md" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 w-32 rounded-xl" />
          <Skeleton className="h-9 w-36 rounded-xl" />
        </div>
      </div>

      {/* Structured Document Body */}
      <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-6 sm:p-8 shadow-xs dark:border-slate-800/80 dark:bg-slate-900/90 space-y-6">
        <div className="space-y-3 pb-6 border-b border-slate-100 dark:border-slate-800">
          <Skeleton className="h-8 w-2/3 rounded-lg" />
          <Skeleton className="h-4 w-48 rounded-md" />
        </div>

        <div className="space-y-3">
          <Skeleton className="h-5 w-40 rounded-md" />
          <Skeleton className="h-3.5 w-full rounded-md" />
          <Skeleton className="h-3.5 w-full rounded-md" />
          <Skeleton className="h-3.5 w-3/4 rounded-md" />
        </div>

        <div className="space-y-3 pt-4">
          <Skeleton className="h-5 w-48 rounded-md" />
          <Skeleton className="h-3.5 w-full rounded-md" />
          <Skeleton className="h-3.5 w-5/6 rounded-md" />
          <Skeleton className="h-36 w-full rounded-xl" />
        </div>
      </div>
    </div>
  );
}

/**
 * Skeleton placeholder for Risk Assessment page (/decisions/[id]/risks)
 */
export function RisksMatrixSkeleton({ decisionId }: { decisionId?: string | number }) {
  return (
    <div className="space-y-6">
      {decisionId ? (
        <DecisionNavTabs decisionId={decisionId} />
      ) : (
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-9 w-28 shrink-0 rounded-xl" />
          ))}
        </div>
      )}

      {/* 4 Risk Severity Tally Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="rounded-2xl border border-slate-200/80 bg-white/90 p-4 shadow-xs dark:border-slate-800/80 dark:bg-slate-900/90 space-y-2"
          >
            <Skeleton className="h-3.5 w-24 rounded-md" />
            <Skeleton className="h-7 w-12 rounded-lg" />
          </div>
        ))}
      </div>

      {/* Risk Register Table */}
      <div className="rounded-2xl border border-slate-200/80 bg-white/90 shadow-xs dark:border-slate-800/80 dark:bg-slate-900/90 divide-y divide-slate-100 dark:divide-slate-800">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="p-5 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1.5 flex-1">
                <Skeleton className="h-5 w-48 rounded-md" />
                <Skeleton className="h-3.5 w-full max-w-lg rounded-md" />
              </div>
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
            <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/40 space-y-1.5">
              <Skeleton className="h-3 w-32 rounded-md" />
              <Skeleton className="h-3 w-4/5 rounded-md" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Skeleton placeholder for Executive Recommendation (/decisions/[id]/recommendation)
 */
export function RecommendationSkeleton({ decisionId }: { decisionId?: string | number }) {
  return (
    <div className="space-y-6">
      {decisionId ? (
        <DecisionNavTabs decisionId={decisionId} />
      ) : (
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-9 w-28 shrink-0 rounded-xl" />
          ))}
        </div>
      )}

      {/* Preferred Scenario Highlight Banner */}
      <div className="rounded-2xl border border-indigo-200/80 bg-gradient-to-r from-indigo-50/80 via-white to-indigo-50/80 p-6 sm:p-8 shadow-xs dark:border-indigo-900/40 dark:from-indigo-950/20 dark:via-slate-900 dark:to-indigo-950/20 space-y-4">
        <Skeleton className="h-6 w-40 rounded-full" />
        <Skeleton className="h-8 w-3/4 rounded-lg" />
        <Skeleton className="h-4 w-full max-w-2xl rounded-md" />
      </div>

      {/* 2-column Rationale & Governance Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-5 shadow-xs dark:border-slate-800/80 dark:bg-slate-900/90 space-y-4">
          <Skeleton className="h-5 w-44 rounded-md" />
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex gap-3">
                <Skeleton className="h-5 w-5 shrink-0 rounded-full" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-4 w-32 rounded-md" />
                  <Skeleton className="h-3 w-full rounded-md" />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-5 shadow-xs dark:border-slate-800/80 dark:bg-slate-900/90 space-y-4">
          <Skeleton className="h-5 w-48 rounded-md" />
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex gap-3">
                <Skeleton className="h-5 w-5 shrink-0 rounded-md" />
                <Skeleton className="h-4 flex-1 rounded-md" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Skeleton placeholder for Context & Attachments (/decisions/[id]/context)
 */
export function ContextManagementSkeleton({ decisionId }: { decisionId?: string | number }) {
  return (
    <div className="space-y-6">
      {decisionId ? (
        <DecisionNavTabs decisionId={decisionId} />
      ) : (
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-9 w-28 shrink-0 rounded-xl" />
          ))}
        </div>
      )}

      {/* Context Upload Card */}
      <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-6 shadow-xs dark:border-slate-800/80 dark:bg-slate-900/90 space-y-4">
        <Skeleton className="h-5 w-44 rounded-md" />
        <Skeleton className="h-3.5 w-96 max-w-full rounded-md" />
        <Skeleton className="h-28 w-full rounded-xl" />
      </div>

      {/* Extracted Documents List */}
      <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-6 shadow-xs dark:border-slate-800/80 dark:bg-slate-900/90 space-y-4">
        <Skeleton className="h-5 w-36 rounded-md" />
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="flex items-center justify-between rounded-xl border border-slate-200/80 p-4 dark:border-slate-800"
            >
              <div className="flex items-center gap-3">
                <Skeleton className="h-8 w-8 rounded-lg" />
                <div className="space-y-1.5">
                  <Skeleton className="h-4 w-40 rounded-md" />
                  <Skeleton className="h-3 w-24 rounded-md" />
                </div>
              </div>
              <Skeleton className="h-8 w-20 rounded-xl" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Skeleton placeholder for Authentication (Login & Register)
 */
export function AuthFormSkeleton() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-50 px-4 py-10 dark:bg-slate-950">
      <div className="w-full max-w-md rounded-3xl border border-slate-200/80 bg-white/90 p-8 shadow-2xl dark:border-slate-800/80 dark:bg-slate-900/90 backdrop-blur-xl space-y-6">
        <div className="text-center space-y-2">
          <Skeleton className="mx-auto h-12 w-12 rounded-2xl" />
          <Skeleton className="mx-auto h-6 w-36 rounded-lg" />
          <Skeleton className="mx-auto h-3.5 w-52 rounded-md" />
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Skeleton className="h-3.5 w-16 rounded-md" />
            <Skeleton className="h-11 w-full rounded-xl" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-3.5 w-20 rounded-md" />
            <Skeleton className="h-11 w-full rounded-xl" />
          </div>
          <Skeleton className="h-11 w-full rounded-xl mt-2" />
        </div>

        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 text-center space-y-2">
          <Skeleton className="mx-auto h-10 w-44 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

/**
 * Skeleton placeholder for Organization Onboarding
 */
export function OnboardingSkeleton() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto py-4">
      {/* Top Bar Skeleton */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-6 w-36 rounded-lg" />
        <Skeleton className="h-9 w-52 rounded-2xl" />
      </div>

      {/* Hero Header Skeleton */}
      <div className="rounded-3xl border border-slate-200/80 bg-white/80 p-6 sm:p-8 dark:border-slate-800/80 dark:bg-slate-900/80 space-y-3">
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-2xl" />
          <Skeleton className="h-5 w-40 rounded-md" />
        </div>
        <Skeleton className="h-8 w-80 rounded-xl" />
        <Skeleton className="h-4 w-full max-w-2xl rounded-md" />
      </div>

      {/* 12-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Main Column Skeleton (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          <div className="rounded-3xl border border-slate-200/80 bg-white/90 p-6 sm:p-7 dark:border-slate-800/80 dark:bg-slate-900/90 space-y-5">
            <Skeleton className="h-5 w-48 rounded-md" />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Skeleton className="h-20 w-full rounded-2xl" />
              <Skeleton className="h-20 w-full rounded-2xl" />
              <Skeleton className="h-20 w-full rounded-2xl" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <Skeleton className="h-11 w-full rounded-xl" />
              <Skeleton className="h-11 w-full rounded-xl" />
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200/80 bg-white/90 p-6 sm:p-7 dark:border-slate-800/80 dark:bg-slate-900/90 space-y-4">
            <Skeleton className="h-5 w-52 rounded-md" />
            <Skeleton className="h-11 w-full rounded-xl" />
          </div>

          <div className="rounded-3xl border border-slate-200/80 bg-white/90 p-6 sm:p-7 dark:border-slate-800/80 dark:bg-slate-900/90 space-y-4">
            <Skeleton className="h-5 w-60 rounded-md" />
            <Skeleton className="h-24 w-full rounded-xl" />
            <Skeleton className="h-24 w-full rounded-xl" />
          </div>
        </div>

        {/* Companion Column Skeleton (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          <div className="rounded-3xl border border-slate-200/80 bg-white/90 p-6 dark:border-slate-800/80 dark:bg-slate-900/90 space-y-4">
            <Skeleton className="h-4 w-32 rounded-md" />
            <div className="flex items-center gap-3">
              <Skeleton className="h-14 w-14 rounded-2xl" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-3/4 rounded-md" />
                <Skeleton className="h-3 w-1/2 rounded-md" />
              </div>
            </div>
            <Skeleton className="h-32 w-full rounded-2xl" />
          </div>
          <div className="rounded-3xl border border-slate-200/80 bg-white/90 p-6 dark:border-slate-800/80 dark:bg-slate-900/90 space-y-3">
            <Skeleton className="h-4 w-40 rounded-md" />
            <Skeleton className="h-16 w-full rounded-xl" />
            <Skeleton className="h-16 w-full rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Top-level Workspace Shell Skeleton.
/**
 * Resolves the precise, tailored skeleton matching the given pathname.
 * Ensures each page has its own dedicated loading skeleton that perfectly mirrors
 * its actual layout, preventing generic dashboard flash or double-loading.
 */
export function getPageSkeleton(pathname = ""): React.ReactNode {
  if (!pathname || pathname === "/") return null;
  if (pathname === "/login" || pathname === "/register") return <AuthFormSkeleton />;
  if (pathname === "/onboarding") return <OnboardingSkeleton />;
  if (pathname === "/settings") return <SettingsSkeleton />;
  if (pathname === "/decisions/new") return <NewDecisionFormSkeleton />;
  if (pathname.includes("/risks")) return <RisksMatrixSkeleton />;
  if (pathname.includes("/recommendation")) return <RecommendationSkeleton />;
  if (pathname.includes("/report")) return <ReportDocumentSkeleton />;
  if (pathname.includes("/context")) return <ContextManagementSkeleton />;
  if (pathname.includes("/scenarios") || pathname.includes("/consequences")) return <DecisionAnalysisSkeleton />;
  if (pathname.includes("/progress")) return <SimulationProgressSkeleton />;
  if (pathname.match(/^\/decisions\/[^/]+$/)) return <DecisionDetailSkeleton />;
  if (pathname === "/decisions") return <DecisionsListSkeleton />;
  return <DashboardSkeleton />;
}

/**
 * Tailored WorkspaceShellSkeleton that dynamically reflects the target page.
 * Keeps header, sidebar, and exact page skeleton layout perfectly aligned.
 */
export function WorkspaceShellSkeleton({ pathname = "" }: { pathname?: string }) {
  if (pathname === "/login" || pathname === "/register") {
    return <AuthFormSkeleton />;
  }
  if (pathname === "/onboarding") {
    return <OnboardingSkeleton />;
  }

  return (
    <div className="relative min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 overflow-x-hidden">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_-10%,rgba(99,102,241,0.06),transparent_70%)] dark:bg-[radial-gradient(ellipse_60%_50%_at_50%_-10%,rgba(99,102,241,0.12),transparent_70%)]"
      />
      <HeaderSkeleton />
      <div className="relative z-10 flex flex-1 items-start">
        <SidebarSkeleton />
        <main className="flex-1 flex flex-col min-w-0">
          <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-5 space-y-4 sm:space-y-5">
            {getPageSkeleton(pathname)}
          </div>
        </main>
      </div>
    </div>
  );
}
