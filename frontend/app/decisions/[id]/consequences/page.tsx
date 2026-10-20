"use client";

import React, { useCallback, useEffect, useState, use } from "react";
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
  Award,
} from "lucide-react";
import { getSimulationResult } from "@/lib/api";
import { DecisionNavTabs } from "@/components/DecisionNavTabs";
import { SimulationResult } from "@/types/decision";
import { ComparisonBarChart } from "@/components/ComparisonBarChart";
import { ApiLoadError } from "@/components/ApiLoadError";

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
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadResult = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      setResult(await getSimulationResult(Number(decisionId)));
    } catch (cause) {
      setLoadError(cause instanceof Error ? cause.message : "Could not load impact results.");
    } finally {
      setLoading(false);
    }
  }, [decisionId]);

  useEffect(() => {
    void Promise.resolve().then(loadResult);
  }, [loadResult]);

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
        { label: `${stakeholder.name} · Favorable`, value: counts.pos, tone: "emerald" as const },
        { label: `${stakeholder.name} · Adverse`, value: counts.neg, tone: "rose" as const },
      ];
    });
    return { maxValue, items };
  }, [result]);

  if (loading) {
    return (
      <div className="space-y-4">
        <DecisionNavTabs decisionId={decisionId} />
        <div className="h-72 animate-pulse rounded-2xl border border-slate-200 bg-slate-100 dark:border-slate-800 dark:bg-slate-900" />
      </div>
    );
  }

  if (loadError || !result) {
    return (
      <div className="space-y-4">
        <DecisionNavTabs decisionId={decisionId} />
        <ApiLoadError
          message={loadError ?? "Analysis results are not available yet."}
          onRetry={() => void loadResult()}
        />
      </div>
    );
  }

  const getStakeholderIcon = (key: string) => {
    switch (key) {
      case "students":
        return <GraduationCap className="h-4 w-4" />;
      case "faculty":
        return <Users2 className="h-4 w-4" />;
      case "laboratories":
        return <FlaskConical className="h-4 w-4" />;
      case "administration":
        return <Building className="h-4 w-4" />;
      case "transportation":
        return <Bus className="h-4 w-4" />;
      default:
        return <Users2 className="h-4 w-4" />;
    }
  };

  const getStakeholderName = (key: string) => {
    return result.stakeholders.find((s) => s.key === key)?.name || key;
  };

  const totalPositive = result.impacts.filter((i) => i.direction === "POSITIVE").length;
  const totalNegative = result.impacts.filter((i) => i.direction === "NEGATIVE").length;

  return (
    <div className="space-y-6">
      <DecisionNavTabs decisionId={decisionId} />


      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
            Stage 03 of Decision Analysis
          </span>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
            Stakeholder Ripples & Impact Matrix
          </h1>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 max-w-2xl leading-relaxed">
            Detailed breakdown of how policies ripple across each campus constituency. Filter by constituent group and direction of impact.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={`/decisions/${decisionId}/risks`}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 transition"
          >
            <span>Risk Register</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
          <Link
            href={`/decisions/${decisionId}/recommendation`}
            className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-indigo-500 transition"
          >
            <Award className="h-3.5 w-3.5" />
            <span>Recommendation</span>
          </Link>
        </div>
      </div>

      {/* Ripple Distribution Chart */}
      <ComparisonBarChart
        title="Favorable vs Adverse Ripple Distribution across Constituencies"
        maxValue={overviewChart.maxValue}
        items={overviewChart.items}
      />

      {/* Filter Toolbar: Stakeholder Selector & Direction Toggle */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        {/* Stakeholder Filter Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          <button
            type="button"
            onClick={() => setSelectedStakeholder("all")}
            className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
              selectedStakeholder === "all"
                ? "bg-slate-900 text-white dark:bg-indigo-600"
                : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
            }`}
          >
            <span>All Stakeholders</span>
            <span className="opacity-75 text-[10px]">({result.impacts.length})</span>
          </button>

          {result.stakeholders.map((s) => {
            const count = result.impacts.filter((i) => i.stakeholder_key === s.key).length;
            const isSelected = selectedStakeholder === s.key;
            return (
              <button
                key={s.key}
                type="button"
                onClick={() => setSelectedStakeholder(s.key)}
                className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition ${
                  isSelected
                    ? "bg-slate-900 text-white dark:bg-indigo-600 shadow-xs"
                    : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
                }`}
              >
                {getStakeholderIcon(s.key)}
                <span>{s.name}</span>
                <span className="opacity-75 text-[10px]">({count})</span>
              </button>
            );
          })}
        </div>

        {/* Direction Filter Buttons */}
        <div className="flex items-center gap-1 shrink-0 rounded-xl border border-slate-200 bg-slate-50 p-1 dark:border-slate-800 dark:bg-slate-950">
          <button
            type="button"
            onClick={() => setDirectionFilter("all")}
            className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
              directionFilter === "all"
                ? "bg-white text-slate-900 shadow-xs dark:bg-slate-800 dark:text-white"
                : "text-slate-500 hover:text-slate-900 dark:text-slate-400"
            }`}
          >
            All
          </button>
          <button
            type="button"
            onClick={() => setDirectionFilter("positive")}
            className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
              directionFilter === "positive"
                ? "bg-emerald-600 text-white shadow-xs"
                : "text-emerald-700 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950/40"
            }`}
          >
            <TrendingUp className="h-3 w-3" />
            <span>Favorable ({totalPositive})</span>
          </button>
          <button
            type="button"
            onClick={() => setDirectionFilter("negative")}
            className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
              directionFilter === "negative"
                ? "bg-rose-600 text-white shadow-xs"
                : "text-rose-700 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/40"
            }`}
          >
            <TrendingDown className="h-3 w-3" />
            <span>Adverse ({totalNegative})</span>
          </button>
        </div>
      </div>

      {/* Ripple Cards Grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {filteredImpacts.map((impact, idx) => {
          const isPos = impact.direction === "POSITIVE";
          const isExpanded = Boolean(expandedImpacts[idx]);

          return (
            <div
              key={idx}
              className={`rounded-2xl border p-5 shadow-sm transition-all duration-200 ${
                isPos
                  ? "border-emerald-200/80 bg-white hover:border-emerald-400 dark:border-emerald-900/40 dark:bg-slate-900"
                  : "border-rose-200/80 bg-white hover:border-rose-400 dark:border-rose-900/40 dark:bg-slate-900"
              }`}
            >
              <div className="space-y-3">
                {/* Card Top: Stakeholder Tag & Direction Badge */}
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-800 dark:bg-slate-800 dark:text-slate-200">
                    {getStakeholderIcon(impact.stakeholder_key)}
                    <span>{getStakeholderName(impact.stakeholder_key)}</span>
                  </span>

                  <div className="flex items-center gap-1.5">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                        isPos
                          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                          : "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
                      }`}
                    >
                      {isPos ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                      <span>{isPos ? "Favorable" : "Adverse"}</span>
                    </span>

                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                      Mag: {impact.magnitude}
                    </span>
                  </div>
                </div>

                {/* Impact Description */}
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-snug">
                    {impact.description}
                  </h3>
                  <div className="mt-1 flex items-center gap-2 text-[11px] text-slate-500">
                    <span className="font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                      Category: {impact.category}
                    </span>
                    <span>·</span>
                    <span>Pathway 0{impact.scenario_number}</span>
                  </div>
                </div>

                {/* Metric Estimate / Detailed Notes */}
                {impact.metric_estimate && (
                  <div>
                    <button
                      type="button"
                      onClick={() => toggleExpand(idx)}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 cursor-pointer pt-1"
                    >
                      <span>{isExpanded ? "Hide analytical estimate" : "View analytical estimate"}</span>
                      {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                    </button>

                    {isExpanded && (
                      <div className="mt-2 rounded-xl bg-slate-50 p-3 text-xs leading-relaxed text-slate-700 dark:bg-slate-800/80 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700/80 space-y-1">
                        <span className="block font-bold text-[10px] uppercase tracking-wider text-slate-500">
                          Quantitative / Operational Estimate
                        </span>
                        <p>{impact.metric_estimate}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
