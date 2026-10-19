"use client";

import React, { useEffect, useState, use } from "react";
import Link from "next/link";
import {
  Award,
  ArrowRight,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { getSimulationResult } from "@/lib/api";
import { saveLocalSimulationResult } from "@/lib/mock-data";
import { DecisionNavTabs } from "@/components/DecisionNavTabs";
import { SimulationResult } from "@/types/decision";
import { ComparisonBarChart } from "@/components/ComparisonBarChart";
import { toast } from "sonner";

export default function ScenarioComparisonPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const decisionId = resolvedParams.id;

  const [result, setResult] = useState<SimulationResult | null>(null);
  const [loading, setLoading] = useState(true);

  const stakeholderMap = React.useMemo(() => {
    if (!result?.stakeholders) return new Map<string, string>();
    return new Map(result.stakeholders.map((s) => [s.key, s.name]));
  }, [result]);

  useEffect(() => {
    getSimulationResult(Number(decisionId))
      .then((data) => {
        setResult(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [decisionId]);

  const handleSetPreferred = (scenarioNum: number) => {
    if (!result) return;
    const updated = {
      ...result,
      scenarios: result.scenarios.map((s) => ({
        ...s,
        is_recommended: s.scenario_number === scenarioNum,
      })),
      recommendation: {
        ...result.recommendation,
        selected_scenario_number: scenarioNum,
        title: `Adopt Scenario ${scenarioNum}: ${result.scenarios.find((s) => s.scenario_number === scenarioNum)?.title}`,
      },
    };
    setResult(updated);
    saveLocalSimulationResult(Number(decisionId), updated);
    toast.success(`Scenario ${scenarioNum} selected as the preferred path`, { description: "Saved in the local demo only." });
  };

  if (loading || !result) {
    return (
      <div className="space-y-4">
        <DecisionNavTabs decisionId={decisionId} />
        <div className="h-72 animate-pulse rounded-2xl border border-slate-200 bg-slate-100 dark:border-slate-800 dark:bg-slate-900" />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-5">
      <DecisionNavTabs decisionId={decisionId} />

      <ComparisonBarChart
        title="Scenario feasibility comparison"
        maxValue={100}
        valueSuffix="%"
        items={result.scenarios.map((scenario) => ({
          label: `Scenario ${scenario.scenario_number}: ${scenario.title}`,
          value: Math.round(scenario.feasibility_score * 100),
          tone: scenario.is_recommended ? "indigo" as const : "emerald" as const,
          detail: scenario.is_recommended ? "recommended" : undefined,
        }))}
      />

      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
            Step 2 of Decision Analysis
          </span>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-2xl">
            Comparative Scenario Matrix
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Side-by-side trade-off synthesis across 3 alternative policy implementations.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={`/decisions/${decisionId}/consequences`}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 transition"
          >
            <span>Cross-Stakeholder Impacts</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
          <Link
            href={`/decisions/${decisionId}/recommendation`}
            className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-500 transition shadow-xs"
          >
            <Award className="h-3.5 w-3.5" />
            <span>Recommendation</span>
          </Link>
        </div>
      </div>

      {/* 3-Column Comparison Grid */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {result.scenarios.map((scenario) => {
          const isWinner = scenario.is_recommended;
          const scorePercent = Math.round(scenario.feasibility_score * 100);
          const scenarioImpacts = result.impacts.filter(
            (impact) => impact.scenario_number === scenario.scenario_number
          );
          const stakeholderNames = (direction: "POSITIVE" | "NEGATIVE") =>
            Array.from(
              new Set(
                scenarioImpacts
                  .filter((impact) => impact.direction === direction)
                  .map((impact) => stakeholderMap.get(impact.stakeholder_key) ?? impact.stakeholder_key)
              )
            );
          const beneficiaries = stakeholderNames("POSITIVE");
          const disadvantaged = stakeholderNames("NEGATIVE");
          const facilitiesImpacts = scenarioImpacts.filter((impact) =>
            ["FACILITIES", "OPERATIONAL"].includes(impact.category.toUpperCase())
          );
          const financialImpacts = scenarioImpacts.filter((impact) =>
            ["FINANCIAL", "BUDGET"].includes(impact.category.toUpperCase())
          );

          return (
            <div
              key={scenario.scenario_number}
              className={`relative flex flex-col justify-between rounded-xl border p-5 transition-all ${
                isWinner
                  ? "border-indigo-600 bg-white shadow-md ring-2 ring-indigo-600/20 dark:border-indigo-500 dark:bg-slate-900"
                  : "border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900"
              }`}
            >
              {isWinner && (
                <div className="absolute -top-2.5 start-5 inline-flex items-center gap-1 rounded-full bg-indigo-600 px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white shadow-xs">
                  <Sparkles className="h-2.5 w-2.5" />
                  <span>Recommended Path</span>
                </div>
              )}

              <div className="space-y-3 pt-1">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold uppercase tracking-wider text-slate-400">
                    Scenario 0{scenario.scenario_number}
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      scorePercent >= 80
                        ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                        : scorePercent >= 70
                        ? "bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300"
                        : "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
                    }`}
                  >
                    {scorePercent}% Feasibility
                  </span>
                </div>

                <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-snug">
                  {scenario.title}
                </h3>

                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  {scenario.description}
                </p>

                <details className="rounded-lg border border-indigo-100 bg-indigo-50/60 px-3 py-2 text-xs dark:border-indigo-900/50 dark:bg-indigo-950/20">
                  <summary className="cursor-pointer font-semibold text-indigo-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 dark:text-indigo-200">
                    Assumptions made
                  </summary>
                  {scenario.assumptions?.length ? (
                    <ul className="mt-2 list-disc space-y-1 ps-5 text-slate-700 dark:text-slate-300">
                      {scenario.assumptions.map((assumption, index) => (
                        <li key={`${scenario.scenario_number}-assumption-${index}`}>
                          {assumption}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-2 text-slate-600 dark:text-slate-400">
                      Scenario-specific assumptions were not provided by the analysis.
                    </p>
                  )}
                </details>

                <div className="grid gap-2 rounded-lg border border-slate-200 p-3 text-[11px] dark:border-slate-700">
                  <div>
                    <span className="font-bold text-emerald-800 dark:text-emerald-300">Primary beneficiaries</span>
                    <p className="mt-0.5 text-slate-600 dark:text-slate-400">{beneficiaries.join(", ") || "No positive stakeholder impacts reported."}</p>
                  </div>
                  <div>
                    <span className="font-bold text-rose-800 dark:text-rose-300">Groups facing negative impacts</span>
                    <p className="mt-0.5 text-slate-600 dark:text-slate-400">{disadvantaged.join(", ") || "No negative stakeholder impacts reported."}</p>
                  </div>
                  <div>
                    <span className="font-bold text-slate-800 dark:text-slate-200">Facilities effects</span>
                    <p className="mt-0.5 text-slate-600 dark:text-slate-400">
                      {facilitiesImpacts.length
                        ? facilitiesImpacts.map((impact) => impact.metric_estimate || impact.description).join(" ")
                        : "No facilities estimate was returned by the API."}
                    </p>
                    <span className="mt-2 block font-bold text-slate-800 dark:text-slate-200">Budget & financial effects</span>
                    <p className="mt-0.5 text-slate-600 dark:text-slate-400">
                      {financialImpacts.length
                        ? financialImpacts.map((impact) => impact.metric_estimate || impact.description).join(" ")
                        : "No budget estimate was returned by the API."}
                    </p>
                  </div>
                </div>

                {/* Score bar */}
                <div className="space-y-1 pt-1">
                  <div className="flex justify-between text-[10px] font-medium text-slate-400">
                    <span>Feasibility Rating</span>
                    <span className="font-bold text-slate-700 dark:text-slate-300">
                      {scorePercent} / 100
                    </span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                    <div
                      className={`h-full transition-all duration-500 ${
                        isWinner ? "bg-indigo-600" : "bg-slate-500"
                      }`}
                      style={{ width: `${scorePercent}%` }}
                    />
                  </div>
                </div>

                {/* Key Tradeoff */}
                <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3 dark:border-slate-800/80 dark:bg-slate-800/40">
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">
                    Trade-off Summary
                  </span>
                  <p className="text-[11px] text-slate-700 dark:text-slate-300 leading-relaxed">
                    {scenario.tradeoff_summary}
                  </p>
                </div>
              </div>

              {/* Action footer */}
              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleSetPreferred(scenario.scenario_number)}
                  className={`px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition cursor-pointer ${
                    isWinner
                      ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800"
                      : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                  title="Choose this as the preferred decision path"
                >
                  {isWinner ? "✓ Preferred" : "Select Path"}
                </button>

                <Link
                  href={`/decisions/${decisionId}/scenarios/${scenario.scenario_number}`}
                  className="flex-1 flex items-center justify-center gap-1 rounded-lg bg-slate-900 py-1.5 text-[11px] font-semibold text-white hover:bg-slate-800 dark:bg-indigo-600 dark:hover:bg-indigo-500 transition"
                >
                  <span>Breakdown</span>
                  <ChevronRight className="h-3 w-3" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
