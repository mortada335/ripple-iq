"use client";

import React, { useEffect, useState, use } from "react";
import Link from "next/link";
import {
  Award,
  ArrowRight,
  FileText,
  CheckCircle2,
  AlertCircle,
  GitCompare,
} from "lucide-react";
import { getSimulationResult } from "@/lib/api";
import { DecisionNavTabs } from "@/components/DecisionNavTabs";
import { SimulationResult } from "@/types/decision";

export default function RecommendationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const decisionId = resolvedParams.id;

  const [result, setResult] = useState<SimulationResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSimulationResult(Number(decisionId))
      .then((data) => {
        setResult(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [decisionId]);

  if (loading || !result) {
    return (
      <div className="space-y-4">
        <DecisionNavTabs decisionId={decisionId} />
        <div className="h-72 animate-pulse rounded-2xl border border-slate-200 bg-slate-100 dark:border-slate-800 dark:bg-slate-900" />
      </div>
    );
  }

  const rec = result.recommendation;
  const confidenceScore = Math.round(result.confidence.score * 100);

  return (
    <div className="space-y-4 sm:space-y-5">
      <DecisionNavTabs decisionId={decisionId} />

      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
            Step 5 of Decision Analysis
          </span>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-2xl">
            Executive Synthesis & Strategic Recommendation
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Synthesized recommendation for university leadership with explicit confidence and assumptions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={`/decisions/${decisionId}/scenarios`}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 transition"
          >
            <GitCompare className="h-3.5 w-3.5" />
            <span>Review Other Scenarios</span>
          </Link>

          <Link
            href={`/decisions/${decisionId}/report`}
            className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-indigo-500 transition shadow-xs"
          >
            <FileText className="h-3.5 w-3.5" />
            <span>View Memorandum</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>

      {/* Recommended Scenario Hero Card */}
      <div className="relative overflow-hidden rounded-xl border border-indigo-200 bg-gradient-to-br from-indigo-900 via-slate-900 to-indigo-950 p-5 sm:p-6 text-white shadow-lg">
        <div className="relative z-10 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-indigo-500/30 border border-indigo-400/40 px-2.5 py-0.5 text-[11px] font-bold text-indigo-200">
              <Award className="h-3 w-3 text-indigo-300" />
              <span>Recommended Path</span>
            </span>
            <span className="rounded-full bg-emerald-500/20 border border-emerald-400/30 px-2.5 py-0.5 text-[11px] font-bold text-emerald-300">
              Scenario 0{rec.selected_scenario_number} Selected
            </span>
          </div>

          <h2 className="text-lg font-extrabold sm:text-xl text-white tracking-tight">
            {rec.title}
          </h2>

          <p className="text-xs text-indigo-100/90 leading-relaxed max-w-3xl">
            {rec.summary}
          </p>

          {/* Rationale Quote */}
          <div className="rounded-lg border border-indigo-500/30 bg-indigo-950/40 p-3 text-xs leading-relaxed text-indigo-200">
            <span className="block font-bold uppercase tracking-wider text-indigo-300 text-[10px] mb-0.5">
              Core Strategic Rationale
            </span>
            {rec.rationale}
          </div>
        </div>
      </div>

      {/* Confidence Gauge & Analytical Basis Grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {/* Confidence Gauge Card */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Algorithmic Confidence
            </span>
            <span className="rounded-full bg-indigo-100 px-2 py-0.2 text-[10px] font-bold text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
              {result.confidence.level}
            </span>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-indigo-600 dark:text-indigo-400">
              {confidenceScore}%
            </span>
            <span className="text-xs text-slate-400 font-medium">Confidence Score</span>
          </div>

          <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
            <div
              className="h-full bg-indigo-600"
              style={{ width: `${confidenceScore}%` }}
            />
          </div>

          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
            {result.confidence.rationale}
          </p>
        </div>

        {/* Analytical Assumptions */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
            <span>Assumptions</span>
          </div>
          <ul className="space-y-1.5 text-[11px] text-slate-600 dark:text-slate-400">
            {result.assumptions.map((assump, idx) => (
              <li key={idx} className="flex items-start gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 shrink-0 mt-1" />
                <span>{assump}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Known Limitations */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
            <AlertCircle className="h-3.5 w-3.5 text-amber-600" />
            <span>Limitations</span>
          </div>
          <ul className="space-y-1.5 text-[11px] text-slate-600 dark:text-slate-400">
            {result.limitations.map((limit, idx) => (
              <li key={idx} className="flex items-start gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0 mt-1" />
                <span>{limit}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
