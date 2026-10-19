"use client";

import React, { useEffect, useState, use } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  Layers,
  Sparkles,
  Award,
  ChevronRight,
  Calendar,
  Download,
} from "lucide-react";
import { getSimulationResult } from "@/lib/api";
import { saveLocalSimulationResult } from "@/lib/mock-data";
import { DecisionNavTabs } from "@/components/DecisionNavTabs";
import { SimulationResult } from "@/types/decision";
import { toast } from "sonner";

export default function ScenarioDetailsPage({
  params,
}: {
  params: Promise<{ id: string; scenarioId: string }>;
}) {
  const resolvedParams = use(params);
  const decisionId = resolvedParams.id;
  const scenarioNumber = Number(resolvedParams.scenarioId);

  const [result, setResult] = useState<SimulationResult | null>(null);

  useEffect(() => {
    getSimulationResult(Number(decisionId)).then(setResult).catch(() => null);
  }, [decisionId]);

  const scenario = result?.scenarios.find(
    (s) => s.scenario_number === scenarioNumber
  );

  const handleSetPreferred = () => {
    if (!result || !scenario) return;
    const updated = {
      ...result,
      scenarios: result.scenarios.map((s) => ({
        ...s,
        is_recommended: s.scenario_number === scenarioNumber,
      })),
      recommendation: {
        ...result.recommendation,
        selected_scenario_number: scenarioNumber,
        title: `Adopt Scenario ${scenarioNumber}: ${scenario.title}`,
      },
    };
    setResult(updated);
    saveLocalSimulationResult(Number(decisionId), updated);
    toast.success("Preferred scenario updated", { description: "Saved in the local demo only." });
  };

  const handleExportBreakdown = () => {
    if (!scenario) return;
    const content = `# Scenario ${scenario.scenario_number} Operational Breakdown
Title: ${scenario.title}
Feasibility: ${Math.round(scenario.feasibility_score * 100)}%
Status: ${scenario.is_recommended ? "RECOMMENDED PATH" : "ALTERNATIVE"}

## Description
${scenario.description}

## Trade-off Summary
${scenario.tradeoff_summary}

## Key Operational Changes
${(scenario.key_changes || []).map((k) => `- ${k}`).join("\n")}

## Assumptions
${(scenario.assumptions || []).map((a) => `- ${a}`).join("\n")}
`;
    const blob = new Blob([content], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `decision-${decisionId}-scenario-${scenarioNumber}-breakdown.md`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Scenario breakdown downloaded");
  };

  if (!result || !scenario) {
    return (
      <div className="space-y-4">
        <DecisionNavTabs decisionId={decisionId} />
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center dark:border-slate-800 dark:bg-slate-900">
          <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            Scenario {scenarioNumber} details loading or not found.
          </p>
          <Link
            href={`/decisions/${decisionId}/scenarios`}
            className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400"
          >
            ← Return to Comparison Matrix
          </Link>
        </div>
      </div>
    );
  }

  const scorePercent = Math.round(scenario.feasibility_score * 100);

  return (
    <div className="space-y-4">
      <DecisionNavTabs decisionId={decisionId} />

      {/* Back button */}
      <div>
        <Link
          href={`/decisions/${decisionId}/scenarios`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to All 3 Scenarios</span>
        </Link>
      </div>

      {/* Hero Scenario Breakdown */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-4 sm:space-y-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-slate-400 uppercase tracking-wider">
                Scenario 0{scenario.scenario_number} Deep Dive
              </span>
              {scenario.is_recommended && (
                <span className="inline-flex items-center gap-1 rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-bold text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                  <Sparkles className="h-3 w-3" />
                  Recommended Alternative
                </span>
              )}
            </div>
            <h1 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white sm:text-xl">
              {scenario.title}
            </h1>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed max-w-3xl">
              {scenario.description}
            </p>
          </div>

          <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3 text-center dark:border-slate-800 dark:bg-slate-800/40 shrink-0">
            <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
              Feasibility Score
            </span>
            <div className="text-2xl font-extrabold text-indigo-600 dark:text-indigo-400 mt-0.5">
              {scorePercent}%
            </div>
            <span className="text-[10px] font-medium text-slate-500">
              Organizational Viability
            </span>
          </div>
        </div>

        {/* Detailed Sections Grid */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 pt-3 border-t border-slate-100 dark:border-slate-800">
          <div className="rounded-xl border border-slate-200 bg-slate-50/40 p-4 dark:border-slate-800 dark:bg-slate-800/30 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
              <Layers className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
              <span>Operational Changes</span>
            </div>
            <ul className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
              {(scenario.key_changes || [
                "Adjust operating schedules to support the proposed change",
                "Update team coverage and responsibilities during implementation",
                "Review service capacity before expanding the change",
              ]).map((change, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  <span>{change}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50/40 p-4 dark:border-slate-800 dark:bg-slate-800/30 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
              <Calendar className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
              <span>Assumptions & Decision Conditions</span>
            </div>
            <ul className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
              {(scenario.assumptions || [
                "Required service levels remain available during implementation",
                "Affected teams can provide feedback before organization-wide rollout",
              ]).map((assump, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 shrink-0 mt-1.5" />
                  <span>{assump}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Tradeoff Box */}
        <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-3 text-xs dark:border-amber-900/60 dark:bg-amber-950/30">
          <span className="font-bold uppercase tracking-wider text-amber-900 dark:text-amber-300 text-[10px]">
            Decision Review Note
          </span>
          <p className="mt-0.5 text-amber-950 dark:text-amber-200 leading-relaxed text-[11px]">
            {scenario.tradeoff_summary}
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSetPreferred}
              className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold transition cursor-pointer ${
                scenario.is_recommended
                  ? "bg-emerald-600 text-white"
                  : "bg-slate-900 text-white hover:bg-slate-800 dark:bg-indigo-600 dark:hover:bg-indigo-500"
              }`}
            >
              <Award className="h-3.5 w-3.5" />
              <span>
                {scenario.is_recommended ? "✓ Preferred option" : "Set as preferred option"}
              </span>
            </button>

            <button
              type="button"
              onClick={handleExportBreakdown}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 cursor-pointer"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Export Breakdown</span>
            </button>
          </div>

          <Link
            href={`/decisions/${decisionId}/consequences`}
            className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
          >
            <span>Proceed to Stakeholder Ripples</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
