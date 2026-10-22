"use client";

import React, { useCallback, useEffect, useState, use } from "react";
import Link from "next/link";
import {
  Award,
  ArrowRight,
  Sparkles,
  Check,
} from "lucide-react";
import { getRecommendation, getSimulationResult, refineRecommendation } from "@/lib/api";
import { DecisionNavTabs } from "@/components/DecisionNavTabs";
import { RecommendationView, SimulationResult } from "@/types/decision";
import { ComparisonBarChart } from "@/components/ComparisonBarChart";
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
  const { locale, t } = useLocale();
  const isAr = locale === "ar";

  const [result, setResult] = useState<SimulationResult | null>(null);
  const [recommendation, setRecommendation] = useState<RecommendationView | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [savingScenario, setSavingScenario] = useState<number | null>(null);

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
      toast.success(`Scenario ${scenarioNum} saved as preferred pathway`, {
        description: "The baseline model recommendation remains preserved for audit compliance.",
      });
    } catch (cause) {
      toast.error("Could not save preferred scenario", {
        description: cause instanceof Error ? cause.message : "Try again.",
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
            {loadError ?? "Analysis results are not available yet."}
          </p>
          <button
            type="button"
            onClick={() => void loadAnalysis()}
            className="mt-3 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-500"
          >
            Retry Loading Analysis
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <DecisionNavTabs decisionId={decisionId} />


      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
            {isAr ? "المرحلة 02 من تحليل القرار" : "Stage 02 of Decision Analysis"}
          </span>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
            {isAr ? "مصفوفة مقارنة السيناريوهات" : "Comparative Scenario Matrix"}
          </h1>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 max-w-2xl leading-relaxed">
            {isAr
              ? "تقييم المفاضلات جنباً إلى جنب. لا يفرض خياراً ثنائياً أبداً. قارن بين 3 مسارات سياسات متباينة تمت معايرتها وفق قيود مؤسستك."
              : "Side-by-side trade-off evaluation. Never forces a binary yes/no. Compare 3 distinct policy pathways calibrated to your institutional constraints."}
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

      {/* Feasibility Comparison Bar Chart */}
      <ComparisonBarChart
        title={isAr ? "درجات الجدوى التشغيلية المقارنة" : "Comparative Heuristic Feasibility Scores"}
        maxValue={100}
        valueSuffix="%"
        items={result.scenarios.map((scenario) => ({
          label: isAr
            ? `سيناريو 0${scenario.scenario_number}: ${scenario.title}`
            : `Scenario 0${scenario.scenario_number}: ${scenario.title}`,
          value: Math.round(scenario.feasibility_score * 100),
          tone:
            recommendation.current.selected_scenario_number === scenario.scenario_number
              ? ("indigo" as const)
              : ("emerald" as const),
          detail:
            recommendation.current.selected_scenario_number === scenario.scenario_number
              ? isAr
                ? "الخيار النشط المعتمد"
                : "Active Preference"
              : undefined,
        }))}
      />

      {/* 3-Column Responsive Scenarios Deck */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {result.scenarios.map((scenario) => {
          const isWinner =
            recommendation.current.selected_scenario_number === scenario.scenario_number;
          const scorePercent = Math.round(scenario.feasibility_score * 100);
          const scenarioImpacts = result.impacts.filter(
            (impact) => impact.scenario_number === scenario.scenario_number
          );

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
              className={`relative flex flex-col justify-between rounded-2xl border p-6 transition-all duration-300 ${
                isWinner
                  ? "border-indigo-600 bg-white shadow-xl ring-2 ring-indigo-600/30 dark:border-indigo-500 dark:bg-slate-900"
                  : "border-slate-200 bg-white shadow-sm hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700"
              }`}
            >
              {/* Highlight Badge */}
              {isWinner && (
                <div className="absolute -top-3 start-6 inline-flex items-center gap-1 rounded-full bg-indigo-600 px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider text-white shadow-md">
                  <Sparkles className="h-3 w-3" />
                  <span>
                    {recommendation.refinement
                      ? isAr
                        ? "المسار المفضل المختار"
                        : "Your Preferred Pathway"
                      : isAr
                      ? "توصية القيادة التنفيذية"
                      : "Executive Recommendation"}
                  </span>
                </div>
              )}

              <div className="space-y-4 pt-1">
                {/* Header: Scenario Number & Score */}
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold uppercase tracking-wider text-slate-400">
                    {isAr ? `المسار 0${scenario.scenario_number}` : `Pathway 0${scenario.scenario_number}`}
                  </span>

                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-medium text-slate-500">
                      {isAr ? "الجدوى" : "Feasibility"}
                    </span>
                    <span
                      className={`rounded-md px-2 py-0.5 font-mono text-xs font-extrabold ${
                        scorePercent >= 85
                          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                          : scorePercent >= 70
                          ? "bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300"
                          : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                      }`}
                    >
                      {scorePercent}%
                    </span>
                  </div>
                </div>

                {/* Title */}
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white leading-snug">
                    {scenario.title}
                  </h3>
                  {scenario.rationale && (
                    <p className="mt-2 text-xs leading-relaxed text-slate-600 dark:text-slate-300 line-clamp-3">
                      {scenario.rationale}
                    </p>
                  )}
                </div>

                {/* Feasibility Meter */}
                <div className="space-y-1">
                  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
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

                {/* Beneficiaries & Disadvantaged Groups */}
                <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                      {isAr ? "الفئات المستفيدة إيجاباً" : "Positive Beneficiaries"}
                    </span>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {beneficiaries.length > 0 ? (
                        beneficiaries.map((name) => (
                          <span
                            key={name}
                            className="rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                          >
                            + {name}
                          </span>
                        ))
                      ) : (
                        <span className="text-[10px] text-slate-400">
                          {isAr ? "لم يُرصد مستفيدون" : "None detected"}
                        </span>
                      )}
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">
                      {isAr ? "الفئات المتأثرة سلباً" : "Disadvantaged Constituencies"}
                    </span>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {disadvantaged.length > 0 ? (
                        disadvantaged.map((name) => (
                          <span
                            key={name}
                            className="rounded-md bg-rose-50 px-2 py-0.5 text-[10px] font-semibold text-rose-800 dark:bg-rose-950/60 dark:text-rose-300"
                          >
                            - {name}
                          </span>
                        ))
                      ) : (
                        <span className="text-[10px] text-slate-400">
                          {isAr ? "احتكاك طفيف جداً" : "Minimal friction"}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Action: Set Preferred or View Breakdown */}
              <div className="mt-6 flex flex-col gap-2 border-t border-slate-100 pt-4 dark:border-slate-800">
                <button
                  type="button"
                  disabled={savingScenario !== null || isWinner}
                  onClick={() => handleSetPreferred(scenario.scenario_number)}
                  className={`flex w-full items-center justify-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-bold transition shadow-xs cursor-pointer ${
                    isWinner
                      ? "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800"
                      : "bg-slate-900 text-white hover:bg-slate-800 dark:bg-indigo-600 dark:hover:bg-indigo-500"
                  }`}
                >
                  {isWinner ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span>{isAr ? "الخيار المؤسسي النشط" : "Active Institutional Choice"}</span>
                    </>
                  ) : (
                    <span>{isAr ? "الاعتماد كمسار مفضل" : "Adopt as Preferred Pathway"}</span>
                  )}
                </button>

                <Link
                  href={`/decisions/${decisionId}/scenarios/${scenario.scenario_number}`}
                  className="inline-flex items-center justify-center gap-1 text-[11px] font-semibold text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 py-1"
                >
                  <span>
                    {isAr
                      ? `فحص تفاصيل السيناريو 0${scenario.scenario_number}`
                      : `Inspect Scenario 0${scenario.scenario_number} Breakdown`}
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
