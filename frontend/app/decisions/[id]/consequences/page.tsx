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
  BarChart3,
} from "lucide-react";
import { getSimulationResult } from "@/lib/api";
import { DecisionNavTabs } from "@/components/DecisionNavTabs";
import { useLocale } from "@/components/LocaleProvider";
import { SimulationResult } from "@/types/decision";
import { ApiLoadError } from "@/components/ApiLoadError";
import { DecisionAnalysisSkeleton } from "@/components/LoadingSkeleton";

export default function ConsequencesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const decisionId = resolvedParams.id;
  const { locale } = useLocale();
  const isAr = locale === "ar";

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
      setLoadError(cause instanceof Error ? cause.message : isAr ? "تعذر تحميل نتائج الآثار." : "Could not load impact results.");
    } finally {
      setLoading(false);
    }
  }, [decisionId, isAr]);

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

  const getStakeholderName = (key: string, originalName?: string) => {
    if (isAr) {
      switch (key.toLowerCase()) {
        case "students":
          return "الطلاب";
        case "faculty":
          return "أعضاء هيئة التدريس";
        case "laboratories":
          return "المختبرات والبحوث";
        case "administration":
          return "الإدارة والموظفون";
        case "transportation":
          return "خدمات النقل";
        default:
          break;
      }
    }
    return originalName || result?.stakeholders.find((s) => s.key === key)?.name || key;
  };

  // Compact stakeholder summary with counts
  const stakeholderSummary = React.useMemo(() => {
    if (!result) return [];
    return result.stakeholders.map((s) => {
      const pos = result.impacts.filter(
        (i) => i.stakeholder_key === s.key && i.direction === "POSITIVE"
      ).length;
      const neg = result.impacts.filter(
        (i) => i.stakeholder_key === s.key && i.direction === "NEGATIVE"
      ).length;
      return { key: s.key, name: getStakeholderName(s.key, s.name), pos, neg, total: pos + neg };
    });
  }, [result, isAr]);

  if (loading) {
    return <DecisionAnalysisSkeleton decisionId={decisionId} />;
  }

  if (loadError || !result) {
    return (
      <div className="space-y-4">
        <DecisionNavTabs decisionId={decisionId} />
        <ApiLoadError
          message={loadError ?? (isAr ? "نتائج التحليل غير متاحة بعد." : "Analysis results are not available yet.")}
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

  const totalPositive = result.impacts.filter((i) => i.direction === "POSITIVE").length;
  const totalNegative = result.impacts.filter((i) => i.direction === "NEGATIVE").length;

  return (
    <div className="space-y-5">
      <DecisionNavTabs decisionId={decisionId} />

      {/* ─── Compact Header ─── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
            {isAr ? "المرحلة 03 من تحليل القرار" : "Stage 03 of Decision Analysis"}
          </span>
          <h1 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-2xl">
            {isAr ? "آثار أصحاب المصلحة" : "Stakeholder Ripples & Impact"}
          </h1>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 max-w-xl leading-relaxed">
            {isAr
              ? "كيف تنعكس السياسات على الأطراف المختلفة. صفّ حسب الفئة والاتجاه."
              : "How policies ripple across each campus constituency. Filter by group and direction."}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={`/decisions/${decisionId}/risks`}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 transition"
          >
            <span>{isAr ? "سجل المخاطر" : "Risk Register"}</span>
            <ArrowRight className="h-3.5 w-3.5 rtl:rotate-180" />
          </Link>
          <Link
            href={`/decisions/${decisionId}/recommendation`}
            className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-indigo-500 transition"
          >
            <Award className="h-3.5 w-3.5" />
            <span>{isAr ? "التوصية" : "Recommendation"}</span>
          </Link>
        </div>
      </div>

      {/* ─── Stakeholder Summary Cards (replaces giant bar chart) ─── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {stakeholderSummary.map((s) => {
          const isSelected = selectedStakeholder === s.key;
          return (
            <button
              key={s.key}
              type="button"
              onClick={() => setSelectedStakeholder(isSelected ? "all" : s.key)}
              className={`flex flex-col gap-2 rounded-2xl border p-3.5 text-start transition-all cursor-pointer ${
                isSelected
                  ? "border-indigo-500 bg-indigo-50/50 shadow-sm dark:border-indigo-500/50 dark:bg-indigo-950/30"
                  : "border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700"
              }`}
            >
              <div className="flex items-center gap-2">
                <span className={`${isSelected ? "text-indigo-600 dark:text-indigo-400" : "text-slate-500"}`}>
                  {getStakeholderIcon(s.key)}
                </span>
                <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                  {s.name}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1">
                  <TrendingUp className="h-3 w-3 text-emerald-500" />
                  <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300">
                    {s.pos}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <TrendingDown className="h-3 w-3 text-rose-500" />
                  <span className="text-xs font-bold text-rose-700 dark:text-rose-300">
                    {s.neg}
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 ms-auto">
                  {s.total} {isAr ? "أثر" : "total"}
                </span>
              </div>
              {/* Mini bar */}
              <div className="flex h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                {s.total > 0 && (
                  <>
                    <div
                      className="h-full bg-emerald-500 transition-all"
                      style={{ width: `${(s.pos / s.total) * 100}%` }}
                    />
                    <div
                      className="h-full bg-rose-500 transition-all"
                      style={{ width: `${(s.neg / s.total) * 100}%` }}
                    />
                  </>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* ─── Direction Filter + Results Count ─── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-slate-200 bg-white p-2.5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setSelectedStakeholder("all")}
            className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition cursor-pointer ${
              selectedStakeholder === "all"
                ? "bg-slate-900 text-white dark:bg-indigo-600"
                : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
            }`}
          >
            {isAr ? "الكل" : "All"} ({result.impacts.length})
          </button>
          <span className="mx-1 h-4 w-px bg-slate-200 dark:bg-slate-700" />
          <span className="text-[10px] text-slate-400">
            {isAr ? "تصفية الاتجاه:" : "Direction:"}
          </span>
        </div>

        <div className="flex items-center gap-1 shrink-0 rounded-xl border border-slate-200 bg-slate-50 p-1 dark:border-slate-800 dark:bg-slate-950">
          <button
            type="button"
            onClick={() => setDirectionFilter("all")}
            className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition cursor-pointer ${
              directionFilter === "all"
                ? "bg-white text-slate-900 shadow-xs dark:bg-slate-800 dark:text-white"
                : "text-slate-500 hover:text-slate-900 dark:text-slate-400"
            }`}
          >
            {isAr ? "الكل" : "All"}
          </button>
          <button
            type="button"
            onClick={() => setDirectionFilter("positive")}
            className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold transition cursor-pointer ${
              directionFilter === "positive"
                ? "bg-emerald-600 text-white shadow-xs"
                : "text-emerald-700 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950/40"
            }`}
          >
            <TrendingUp className="h-3 w-3" />
            <span>{isAr ? `إيجابي (${totalPositive})` : `Favorable (${totalPositive})`}</span>
          </button>
          <button
            type="button"
            onClick={() => setDirectionFilter("negative")}
            className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold transition cursor-pointer ${
              directionFilter === "negative"
                ? "bg-rose-600 text-white shadow-xs"
                : "text-rose-700 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/40"
            }`}
          >
            <TrendingDown className="h-3 w-3" />
            <span>{isAr ? `سلبي (${totalNegative})` : `Adverse (${totalNegative})`}</span>
          </button>
        </div>
      </div>

      {/* ─── Impact Cards ─── */}
      {filteredImpacts.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center dark:border-slate-700 dark:bg-slate-900">
          <BarChart3 className="mx-auto h-8 w-8 text-slate-300 dark:text-slate-600" />
          <p className="mt-2 text-sm font-semibold text-slate-500">
            {isAr ? "لا توجد آثار تطابق معايير التصفية الحالية." : "No impacts match the current filter criteria."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {filteredImpacts.map((impact, idx) => {
            const isPos = impact.direction === "POSITIVE";
            const isExpanded = Boolean(expandedImpacts[idx]);

            return (
              <div
                key={idx}
                className={`rounded-2xl border p-4 transition-all duration-200 ${
                  isPos
                    ? "border-emerald-200/80 bg-white hover:border-emerald-300 dark:border-emerald-900/40 dark:bg-slate-900"
                    : "border-rose-200/80 bg-white hover:border-rose-300 dark:border-rose-900/40 dark:bg-slate-900"
                }`}
              >
                {/* Card Top: Direction + Stakeholder + Magnitude */}
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                      isPos
                        ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                        : "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
                    }`}
                  >
                    {isPos ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                    {isAr ? (isPos ? "إيجابي" : "سلبي") : isPos ? "Favorable" : "Adverse"}
                  </span>

                  <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                    {getStakeholderIcon(impact.stakeholder_key)}
                    {getStakeholderName(impact.stakeholder_key)}
                  </span>

                  <span className="ms-auto rounded-full bg-slate-100 px-1.5 py-0.5 text-[9px] font-bold uppercase text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                    {isAr ? `شدة: ${impact.magnitude}` : `Mag: ${impact.magnitude}`}
                  </span>
                </div>

                {/* Description */}
                <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-snug">
                  {impact.description}
                </h3>
                <div className="mt-1 flex items-center gap-2 text-[10px] text-slate-500">
                  <span className="font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                    {impact.category}
                  </span>
                  <span>·</span>
                  <span>{isAr ? `المسار 0${impact.scenario_number}` : `Pathway 0${impact.scenario_number}`}</span>
                </div>

                {/* Expandable Metric */}
                {impact.metric_estimate && (
                  <div className="mt-2">
                    <button
                      type="button"
                      onClick={() => toggleExpand(idx)}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer"
                    >
                      <span>
                        {isExpanded
                          ? isAr ? "إخفاء التقدير" : "Hide estimate"
                          : isAr ? "عرض التقدير" : "View estimate"}
                      </span>
                      {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                    </button>
                    {isExpanded && (
                      <div className="mt-1.5 rounded-lg bg-slate-50 p-2.5 text-[11px] leading-relaxed text-slate-700 dark:bg-slate-800/80 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700/80">
                        <span className="block font-bold text-[9px] uppercase tracking-wider text-slate-400 mb-0.5">
                          {isAr ? "التقدير الكمي" : "Quantitative Estimate"}
                        </span>
                        {impact.metric_estimate}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
