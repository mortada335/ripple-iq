"use client";

import React, { useEffect, useState, use } from "react";
import Link from "next/link";
import {
  Users2,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  GraduationCap,
  FlaskConical,
  Building,
  Bus,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { getSimulationResult } from "@/lib/api";
import { DecisionNavTabs } from "@/components/DecisionNavTabs";
import { SimulationResult } from "@/types/decision";
import { ComparisonBarChart } from "@/components/ComparisonBarChart";

export default function ConsequencesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const decisionId = resolvedParams.id;

  const [result, setResult] = useState<SimulationResult | null>(null);
  const [selectedStakeholder, setSelectedStakeholder] = useState<string>("all");
  const [directionFilter, setDirectionFilter] = useState<string>("all");
  const [expandedImpacts, setExpandedImpacts] = useState<Record<number, boolean>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSimulationResult(Number(decisionId))
      .then((data) => {
        setResult(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [decisionId]);

  const toggleExpand = (idx: number) => {
    setExpandedImpacts((prev) => ({
      ...prev,
      [idx]: !prev[idx],
    }));
  };

  const filteredImpacts = React.useMemo(() => {
    if (!result) return [];
    return result.impacts.filter((impact) => {
      const matchesStakeholder =
        selectedStakeholder === "all" || impact.stakeholder_key === selectedStakeholder;
      const matchesDirection =
        directionFilter === "all" || impact.direction.toLowerCase() === directionFilter;
      return matchesStakeholder && matchesDirection;
    });
  }, [result, selectedStakeholder, directionFilter]);

  const overviewChart = React.useMemo(() => {
    if (!result) return { maxValue: 1, items: [] };
    const countsByKey: Record<string, { pos: number; neg: number }> = {};
    for (const impact of result.impacts) {
      if (!countsByKey[impact.stakeholder_key]) {
        countsByKey[impact.stakeholder_key] = { pos: 0, neg: 0 };
      }
      if (impact.direction === "POSITIVE") countsByKey[impact.stakeholder_key].pos++;
      else countsByKey[impact.stakeholder_key].neg++;
    }
    const maxVals = result.stakeholders.map((s) => {
      const c = countsByKey[s.key] ?? { pos: 0, neg: 0 };
      return Math.max(c.pos, c.neg);
    });
    const maxValue = Math.max(1, ...maxVals);
    const items = result.stakeholders.flatMap((stakeholder) => {
      const counts = countsByKey[stakeholder.key] ?? { pos: 0, neg: 0 };
      return [
        { label: `${stakeholder.name} · Positive`, value: counts.pos, tone: "emerald" as const },
        { label: `${stakeholder.name} · Negative`, value: counts.neg, tone: "rose" as const },
      ];
    });
    return { maxValue, items };
  }, [result]);

  if (loading || !result) {
    return (
      <div className="space-y-4">
        <DecisionNavTabs decisionId={decisionId} />
        <div className="h-72 animate-pulse rounded-2xl border border-slate-200 bg-slate-100 dark:border-slate-800 dark:bg-slate-900" />
      </div>
    );
  }

  const getStakeholderIcon = (key: string) => {
    switch (key) {
      case "students":
        return <GraduationCap className="h-3.5 w-3.5" />;
      case "faculty":
        return <Users2 className="h-3.5 w-3.5" />;
      case "laboratories":
        return <FlaskConical className="h-3.5 w-3.5" />;
      case "administration":
        return <Building className="h-3.5 w-3.5" />;
      case "transportation":
        return <Bus className="h-3.5 w-3.5" />;
      default:
        return <Users2 className="h-3.5 w-3.5" />;
    }
  };

  return (
    <div className="space-y-4 sm:space-y-5">
      <DecisionNavTabs decisionId={decisionId} />

      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
            Step 3 of Decision Analysis
          </span>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-2xl">
            Stakeholder Ripples & Impact Map
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Explore the people and groups affected by this decision.
          </p>
        </div>

        <Link
          href={`/decisions/${decisionId}/risks`}
          className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white hover:bg-slate-800 dark:bg-indigo-600 dark:hover:bg-indigo-500 transition shadow-xs"
        >
          <span>View Risk Mitigations</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {/* Stakeholder Category Tabs */}
      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          <button
            onClick={() => setSelectedStakeholder("all")}
            className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
              selectedStakeholder === "all"
                ? "bg-slate-900 text-white dark:bg-indigo-600"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
            }`}
          >
            All Stakeholders ({result.stakeholders.length})
          </button>
          {result.stakeholders.map((s) => (
            <button
              key={s.key}
              onClick={() => setSelectedStakeholder(s.key)}
              className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                selectedStakeholder === s.key
                  ? "bg-slate-900 text-white dark:bg-indigo-600"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
              }`}
            >
              {getStakeholderIcon(s.key)}
              <span>{s.name}</span>
            </button>
          ))}
        </div>

        {/* Positive / Negative Filter */}
        <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-xl dark:bg-slate-900 shrink-0">
          {[
            { id: "all", label: "All" },
            { id: "positive", label: "Positive (+)" },
            { id: "negative", label: "Negative (!)" },
          ].map((btn) => (
            <button
              key={btn.id}
              onClick={() => setDirectionFilter(btn.id)}
              className={`rounded-lg px-2.5 py-1 text-xs font-medium transition ${
                directionFilter === btn.id
                  ? "bg-white text-slate-900 shadow-xs font-semibold dark:bg-slate-800 dark:text-white"
                  : "text-slate-600 hover:text-slate-900 dark:text-slate-400"
              }`}
            >
              {btn.label}
            </button>
          ))}
        </div>
      </div>

      {/* Impact overview derived from analysis data */}
      {selectedStakeholder === "all" && (
        <ComparisonBarChart
          title="Reported positive and negative impacts by stakeholder"
          maxValue={overviewChart.maxValue}
          items={overviewChart.items}
        />
      )}

      {/* Impact Ripple Cards Grid */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {filteredImpacts.map((impact, idx) => {
          const isPositive = impact.direction === "POSITIVE";
          const isExpanded = !!expandedImpacts[idx];
          const stakeholder = result.stakeholders.find(
            (s) => s.key === impact.stakeholder_key
          );

          return (
            <div
              key={idx}
              className={`flex flex-col justify-between rounded-xl border p-4 transition-all ${
                isPositive
                  ? "border-emerald-200 bg-gradient-to-br from-white to-emerald-50/30 dark:border-emerald-950 dark:from-slate-900 dark:to-emerald-950/20"
                  : "border-rose-200 bg-gradient-to-br from-white to-rose-50/30 dark:border-rose-950 dark:from-slate-900 dark:to-rose-950/20"
              }`}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                        isPositive
                          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                          : "bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300"
                      }`}
                    >
                      {isPositive ? (
                        <>
                          <TrendingUp className="h-3 w-3" />
                          <span>Positive</span>
                        </>
                      ) : (
                        <>
                          <TrendingDown className="h-3 w-3" />
                          <span>Adverse</span>
                        </>
                      )}
                    </span>

                    <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-mono text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                      Scenario 0{impact.scenario_number}
                    </span>
                  </div>

                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    {impact.magnitude} Magnitude
                  </span>
                </div>

                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 dark:text-white">
                  {getStakeholderIcon(impact.stakeholder_key)}
                  <span>{stakeholder?.name || impact.stakeholder_key}</span>
                  <span className="text-slate-400 font-normal">
                    • {impact.category}
                  </span>
                </div>

                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                  {impact.description}
                </p>

                {isExpanded && (
                  <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 space-y-1 animate-in fade-in duration-150">
                    <p>
                      <strong>Operational check:</strong> Review these impacts against the constraints and assumptions entered for this decision.
                    </p>
                    <p>
                      <strong>Follow-up:</strong> The decision owner and affected teams should review these impacts and plan mitigations.
                    </p>
                  </div>
                )}
              </div>

              <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[10px] text-slate-400">
                <span>Accreditation Validated</span>
                <button
                  type="button"
                  onClick={() => toggleExpand(idx)}
                  className="flex items-center gap-1 font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 cursor-pointer"
                >
                  <span>{isExpanded ? "Collapse" : "Details"}</span>
                  {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
