"use client";

import React, { useCallback, useEffect, useState, use } from "react";
import Link from "next/link";
import {
  Award,
  ArrowRight,
  Sparkles,
  Check,
  ChevronDown,
  ChevronUp,
  TrendingUp,
  TrendingDown,
  Eye,
  Zap,
} from "lucide-react";
import { getRecommendation, getSimulationResult, refineRecommendation } from "@/lib/api";
import { DecisionNavTabs } from "@/components/DecisionNavTabs";
import { RecommendationView, SimulationResult } from "@/types/decision";
import { toast } from "sonner";
import { useLocale } from "@/components/LocaleProvider";
import { DecisionAnalysisSkeleton } from "@/components/LoadingSkeleton";

export default function ScenarioComparisonPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const decisionId = resolvedParams.id;
  const { locale } = useLocale();
  const isAr = locale === "ar";

  const [result, setResult] = useState<SimulationResult | null>(null);
  const [recommendation, setRecommendation] = useState<RecommendationView | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [savingScenario, setSavingScenario] = useState<number | null>(null);
  const [expandedCard, setExpandedCard] = useState<number | null>(null);

  const stakeholderMap = React.useMemo(() => {
    if (!result?.stakeholders) return new Map<string, string>();
    return new Map(result.stakeholders.map((s) => [s.key, s.name]));
  }, [result]);

  const loadAnalysis = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const [analysis, currentRecommendation] = await Promise.all([
        getSimulationResult(Number(decisionId)),
        getRecommendation(Number(decisionId)),
      ]);
      setResult(analysis);
      setRecommendation(currentRecommendation);
    } catch (cause) {
      setLoadError(cause instanceof Error ? cause.message : "Could not load the analysis.");
    } finally {
      setLoading(false);
    }
  }, [decisionId]);

  useEffect(() => {
    void Promise.resolve().then(loadAnalysis);
  }, [loadAnalysis]);

  const handleSetPreferred = async (scenarioNum: number) => {
    if (!result || savingScenario !== null) return;
    setSavingScenario(scenarioNum);
    try {
      const updated = await refineRecommendation(Number(decisionId), {
        selected_scenario_number: scenarioNum,
        feedback: `Reviewer selected Scenario ${scenarioNum} as the preferred institutional pathway.`,
      });
      setRecommendation(updated);
      toast.success(
        isAr
          ? `تم اعتماد المسار ${scenarioNum} كخيار مفضل`
          : `Scenario ${scenarioNum} saved as preferred pathway`,
        {
          description: isAr
            ? "تُحفظ توصية التحليل الأصلية لأغراض التدقيق."
            : "The baseline model recommendation remains preserved for audit compliance.",
        }
      );
    } catch (cause) {
      toast.error(isAr ? "تعذر حفظ المسار المفضل" : "Could not save preferred scenario", {
        description: cause instanceof Error ? cause.message : isAr ? "حاول مرة أخرى." : "Try again.",
      });
    } finally {
      setSavingScenario(null);
    }
  };

  if (loading) {
    return <DecisionAnalysisSkeleton decisionId={decisionId} />;
  }

  if (loadError || !result || !recommendation) {
    return (
      <div className="space-y-4">
        <DecisionNavTabs decisionId={decisionId} />
        <div
          role="alert"
          className="rounded-2xl border border-rose-200 bg-white p-6 text-center text-sm shadow-sm dark:border-rose-900 dark:bg-slate-900"
        >
          <p className="text-rose-700 dark:text-rose-300 font-semibold">
            {loadError ?? (isAr ? "نتائج التحليل غير متاحة بعد." : "Analysis results are not available yet.")}
          </p>
          <button
            type="button"
            onClick={() => void loadAnalysis()}
            className="mt-3 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-500 cursor-pointer"
          >
            {isAr ? "إعادة المحاولة" : "Retry Loading Analysis"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <DecisionNavTabs decisionId={decisionId} />

      {/* ─── Compact Header ─── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
            {isAr ? "المرحلة 02 من تحليل القرار" : "Stage 02 of Decision Analysis"}
          </span>
          <h1 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-2xl">
            {isAr ? "مصفوفة مقارنة السيناريوهات" : "Comparative Scenario Matrix"}
          </h1>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 max-w-xl leading-relaxed">
            {isAr
              ? "قارن بين المسارات الثلاثة جنباً إلى جنب. حدد المسار الأمثل لمؤسستك."
              : "Compare all three pathways side-by-side. Select the optimal pathway for your institution."}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={`/decisions/${decisionId}/consequences`}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 transition"
          >
            <span>{isAr ? "الآثار على أصحاب المصلحة" : "Stakeholder Ripples"}</span>
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

      {/* ─── Quick Feasibility Overview (Inline Compact) ─── */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {isAr ? "نظرة سريعة على الجدوى" : "Feasibility At a Glance"}
          </h2>
          <span className="text-[10px] text-slate-400">
            {isAr ? "اضغط أي مسار للتفاصيل" : "Click any pathway for details"}
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {result.scenarios.map((scenario) => {
            const isWinner =
              recommendation.current.selected_scenario_number === scenario.scenario_number;
            const scorePercent = Math.round(scenario.feasibility_score * 100);
            return (
              <button
                key={scenario.scenario_number}
                type="button"
                onClick={() =>
                  setExpandedCard(
                    expandedCard === scenario.scenario_number ? null : scenario.scenario_number
                  )
                }
                className={`relative flex items-center gap-3 rounded-xl border p-3 text-start transition-all cursor-pointer ${
                  isWinner
                    ? "border-indigo-500/60 bg-indigo-50/50 dark:border-indigo-500/40 dark:bg-indigo-950/30"
                    : "border-slate-200 hover:border-slate-300 dark:border-slate-800 dark:hover:border-slate-700"
                }`}
              >
                {/* Score Circle */}
                <div
                  className={`relative flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-[3px] ${
                    scorePercent >= 85
                      ? "border-emerald-500 text-emerald-700 dark:text-emerald-300"
                      : scorePercent >= 70
                      ? "border-indigo-500 text-indigo-700 dark:text-indigo-300"
                      : "border-amber-500 text-amber-700 dark:text-amber-300"
                  }`}
                >
                  <span className="text-sm font-extrabold font-mono">{scorePercent}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-mono font-bold text-slate-400">
                      {isAr ? `مسار ${scenario.scenario_number}` : `P${scenario.scenario_number}`}
                    </span>
                    {isWinner && (
                      <span className="inline-flex items-center gap-0.5 rounded-full bg-indigo-600 px-1.5 py-0.5 text-[8px] font-extrabold uppercase tracking-wider text-white">
                        <Zap className="h-2 w-2" />
                        {isAr ? "نشط" : "Active"}
                      </span>
                    )}
                  </div>
                  <p className="text-xs font-bold text-slate-900 dark:text-white leading-tight line-clamp-1 mt-0.5">
                    {scenario.title}
                  </p>
                </div>
                <ChevronDown
                  className={`h-3.5 w-3.5 text-slate-400 shrink-0 transition-transform ${
                    expandedCard === scenario.scenario_number ? "rotate-180" : ""
                  }`}
                />
              </button>
            );
          })}
        </div>
      </div>

      {/* ─── Detailed Scenario Cards ─── */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {result.scenarios.map((scenario) => {
          const isWinner =
            recommendation.current.selected_scenario_number === scenario.scenario_number;
          const scorePercent = Math.round(scenario.feasibility_score * 100);
          const scenarioImpacts = result.impacts.filter(
            (impact) => impact.scenario_number === scenario.scenario_number
          );
          const isExpanded = expandedCard === scenario.scenario_number;

          const stakeholderNames = (direction: "POSITIVE" | "NEGATIVE") =>
            Array.from(
              new Set(
                scenarioImpacts
                  .filter((impact) => impact.direction === direction)
                  .map(
                    (impact) =>
                      stakeholderMap.get(impact.stakeholder_key) ?? impact.stakeholder_key
                  )
              )
            );

          const beneficiaries = stakeholderNames("POSITIVE");
          const disadvantaged = stakeholderNames("NEGATIVE");

          return (
            <div
              key={scenario.scenario_number}
              className={`group relative flex flex-col rounded-2xl border transition-all duration-300 ${
                isWinner
                  ? "border-indigo-500 bg-white shadow-lg shadow-indigo-500/10 ring-1 ring-indigo-500/20 dark:border-indigo-500 dark:bg-slate-900"
                  : "border-slate-200 bg-white shadow-sm hover:border-slate-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700"
              }`}
            >
              {/* Winner Badge */}
              {isWinner && (
                <div className="absolute -top-3 start-5 inline-flex items-center gap-1 rounded-full bg-indigo-600 px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider text-white shadow-md">
                  <Sparkles className="h-3 w-3" />
                  <span>
                    {recommendation.refinement
                      ? isAr
                        ? "المسار المفضل"
                        : "Preferred Pathway"
                      : isAr
                      ? "توصية تنفيذية"
                      : "Executive Recommendation"}
                  </span>
                </div>
              )}

              {/* Card Header */}
              <div className="p-5 pb-0 pt-5">
                <div className="flex items-start justify-between gap-2">
                  <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    {isAr ? `المسار 0${scenario.scenario_number}` : `Pathway 0${scenario.scenario_number}`}
                  </span>
                  <div
                    className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 ${
                      scorePercent >= 85
                        ? "bg-emerald-50 dark:bg-emerald-950/40"
                        : scorePercent >= 70
                        ? "bg-indigo-50 dark:bg-indigo-950/40"
                        : "bg-amber-50 dark:bg-amber-950/40"
                    }`}
                  >
                    <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400">
                      {isAr ? "جدوى" : "Feasibility"}
                    </span>
                    <span
                      className={`font-mono text-sm font-extrabold ${
                        scorePercent >= 85
                          ? "text-emerald-700 dark:text-emerald-300"
                          : scorePercent >= 70
                          ? "text-indigo-700 dark:text-indigo-300"
                          : "text-amber-700 dark:text-amber-300"
                      }`}
                    >
                      {scorePercent}%
                    </span>
                  </div>
                </div>

                {/* Title */}
                <h3 className="mt-3 text-base font-bold text-slate-900 dark:text-white leading-snug">
                  {scenario.title}
                </h3>
              </div>

              {/* Feasibility Bar */}
              <div className="px-5 pt-3">
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${
                      scorePercent >= 85
                        ? "bg-emerald-500"
                        : scorePercent >= 70
                        ? "bg-indigo-600"
                        : "bg-amber-500"
                    }`}
                    style={{ width: `${scorePercent}%` }}
                  />
                </div>
              </div>

              {/* Rationale (always visible, compact) */}
              {scenario.rationale && (
                <p className="px-5 pt-3 text-[11px] leading-relaxed text-slate-500 dark:text-slate-400 line-clamp-2">
                  {scenario.rationale}
                </p>
              )}

              {/* Stakeholder Impact Summary */}
              <div className="mx-5 mt-3 space-y-2 border-t border-slate-100 pt-3 dark:border-slate-800">
                {/* Beneficiaries Row */}
                <div className="flex items-start gap-2">
                  <TrendingUp className="h-3.5 w-3.5 mt-0.5 shrink-0 text-emerald-500" />
                  <div className="flex flex-wrap gap-1 min-w-0">
                    {beneficiaries.length > 0 ? (
                      beneficiaries.map((name) => (
                        <span
                          key={name}
                          className="rounded-md bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300"
                        >
                          {name}
                        </span>
                      ))
                    ) : (
                      <span className="text-[10px] text-slate-400 italic">
                        {isAr ? "لا مستفيدين مباشرين" : "No direct beneficiaries"}
                      </span>
                    )}
                  </div>
                </div>

                {/* Disadvantaged Row */}
                <div className="flex items-start gap-2">
                  <TrendingDown className="h-3.5 w-3.5 mt-0.5 shrink-0 text-rose-500" />
                  <div className="flex flex-wrap gap-1 min-w-0">
                    {disadvantaged.length > 0 ? (
                      disadvantaged.map((name) => (
                        <span
                          key={name}
                          className="rounded-md bg-rose-50 px-1.5 py-0.5 text-[10px] font-semibold text-rose-800 dark:bg-rose-950/50 dark:text-rose-300"
                        >
                          {name}
                        </span>
                      ))
                    ) : (
                      <span className="text-[10px] text-slate-400 italic">
                        {isAr ? "احتكاك طفيف" : "Minimal friction"}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Expanded: detailed impacts */}
              {isExpanded && (
                <div className="mx-5 mt-3 space-y-2 rounded-xl border border-slate-100 bg-slate-50/60 p-3 dark:border-slate-800 dark:bg-slate-800/40 animate-in fade-in slide-in-from-top-2 duration-200">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    {isAr ? "تفاصيل الآثار" : "Impact Details"}
                  </span>
                  {scenarioImpacts.length > 0 ? (
                    scenarioImpacts.slice(0, 5).map((impact, idx) => (
                      <div
                        key={idx}
                        className={`flex items-start gap-2 rounded-lg p-2 text-[11px] ${
                          impact.direction === "POSITIVE"
                            ? "bg-emerald-50/70 dark:bg-emerald-950/20"
                            : "bg-rose-50/70 dark:bg-rose-950/20"
                        }`}
                      >
                        {impact.direction === "POSITIVE" ? (
                          <TrendingUp className="h-3 w-3 mt-0.5 shrink-0 text-emerald-500" />
                        ) : (
                          <TrendingDown className="h-3 w-3 mt-0.5 shrink-0 text-rose-500" />
                        )}
                        <span className="text-slate-700 dark:text-slate-300 leading-tight">
                          {impact.description}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-[11px] text-slate-400">
                      {isAr ? "لا توجد آثار محددة لهذا المسار." : "No specific impacts for this pathway."}
                    </p>
                  )}
                </div>
              )}

              {/* Card Footer Actions */}
              <div className="mt-auto flex flex-col gap-2 border-t border-slate-100 p-4 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={savingScenario !== null || isWinner}
                    onClick={() => handleSetPreferred(scenario.scenario_number)}
                    className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-bold transition shadow-xs cursor-pointer ${
                      isWinner
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800"
                        : "bg-slate-900 text-white hover:bg-slate-800 dark:bg-indigo-600 dark:hover:bg-indigo-500"
                    }`}
                  >
                    {isWinner ? (
                      <>
                        <Check className="h-3.5 w-3.5" />
                        <span>{isAr ? "الخيار النشط" : "Active Choice"}</span>
                      </>
                    ) : (
                      <span>{isAr ? "اعتماد كمسار مفضل" : "Adopt as Preferred"}</span>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setExpandedCard(
                        expandedCard === scenario.scenario_number
                          ? null
                          : scenario.scenario_number
                      )
                    }
                    className="flex h-[38px] w-[38px] items-center justify-center rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800 transition cursor-pointer"
                    title={isAr ? "عرض التفاصيل" : "Toggle details"}
                  >
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>

                <Link
                  href={`/decisions/${decisionId}/scenarios/${scenario.scenario_number}`}
                  className="inline-flex items-center justify-center gap-1 text-[11px] font-semibold text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 py-0.5 transition"
                >
                  <span>
                    {isAr
                      ? `فحص تفاصيل المسار ${scenario.scenario_number}`
                      : `Full Breakdown of Pathway ${scenario.scenario_number}`}
                  </span>
                  <ArrowRight className="h-3 w-3 rtl:rotate-180" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
