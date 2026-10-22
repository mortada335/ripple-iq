"use client";

import React, { useCallback, useEffect, useState, use } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  Check,
  Layers,
  Sparkles,
  Award,
  ChevronRight,
  Calendar,
  Download,
} from "lucide-react";
import { getRecommendation, getSimulationResult, refineRecommendation } from "@/lib/api";
import { DecisionNavTabs } from "@/components/DecisionNavTabs";
import { useLocale } from "@/components/LocaleProvider";
import { RecommendationView, SimulationResult } from "@/types/decision";
import { toast } from "sonner";
import { DecisionAnalysisSkeleton } from "@/components/LoadingSkeleton";

export default function ScenarioDetailsPage({
  params,
}: {
  params: Promise<{ id: string; scenarioId: string }>;
}) {
  const resolvedParams = use(params);
  const decisionId = resolvedParams.id;
  const scenarioNumber = Number(resolvedParams.scenarioId);
  const { locale, t } = useLocale();
  const isAr = locale === "ar";

  const [result, setResult] = useState<SimulationResult | null>(null);
  const [recommendation, setRecommendation] = useState<RecommendationView | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [savingPreferred, setSavingPreferred] = useState(false);

  const loadScenario = useCallback(async () => {
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
      setLoadError(cause instanceof Error ? cause.message : isAr ? "تعذر تحميل تفاصيل السيناريو." : "Could not load scenario details.");
    } finally {
      setLoading(false);
    }
  }, [decisionId, isAr]);

  useEffect(() => {
    void Promise.resolve().then(loadScenario);
  }, [loadScenario]);

  const scenario = result?.scenarios.find(
    (s) => s.scenario_number === scenarioNumber
  );

  const handleSetPreferred = async () => {
    if (!scenario || savingPreferred) return;
    setSavingPreferred(true);
    try {
      setRecommendation(await refineRecommendation(Number(decisionId), {
        selected_scenario_number: scenarioNumber,
        feedback: `Reviewer selected Scenario ${scenarioNumber} as the preferred decision path.`,
      }));
      toast.success(isAr ? "تم حفظ السيناريو المفضل" : "Preferred scenario saved", {
        description: isAr ? "تم الاحتفاظ بتوصية التحليل الأصلية في سجل التدقيق." : "The original analysis recommendation remains preserved.",
      });
    } catch (cause) {
      toast.error(isAr ? "تعذر حفظ السيناريو المفضل" : "Could not save the preferred scenario", {
        description: cause instanceof Error ? cause.message : isAr ? "حاول مجدداً." : "Try again.",
      });
    } finally {
      setSavingPreferred(false);
    }
  };

  const handleExportBreakdown = () => {
    if (!scenario) return;
    const content = `# Scenario ${scenario.scenario_number} Operational Breakdown
Title: ${scenario.title}
Heuristic feasibility score: ${Math.round(scenario.feasibility_score * 100)}% (not a measured probability)
Original model recommendation: ${scenario.is_recommended ? "yes" : "no"}
Current human preference: ${recommendation?.current.selected_scenario_number === scenarioNumber ? "yes" : "no"}

## Description
${scenario.description}

## Scenario rationale
${scenario.rationale?.trim() || "Scenario reasoning was not stored with this analysis. The saved analysis, any human refinement, and any existing report remain unchanged. A new analysis run creates a separate version with scenario-specific reasoning."}

## Trade-off Summary
${scenario.tradeoff_summary ?? "No trade-off summary was provided by the analysis."}

## Scenario-specific implementation steps and timeline
Not provided by the analysis.

## Decision-level assumptions
${result?.assumptions.map((item) => `- ${item}`).join("\n") || "Not provided."}

## Limitations
${result?.limitations.map((item) => `- ${item}`).join("\n") || "Not provided."}
`;
    const blob = new Blob([content], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `decision-${decisionId}-scenario-${scenarioNumber}-breakdown.md`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(isAr ? "تم تنزيل تفاصيل السيناريو" : "Scenario breakdown downloaded");
  };

  if (loading) {
    return <DecisionAnalysisSkeleton decisionId={decisionId} />;
  }

  if (loadError || !result || !scenario || !recommendation) {
    return (
      <div className="space-y-4">
        <DecisionNavTabs decisionId={decisionId} />
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center dark:border-slate-800 dark:bg-slate-900">
          <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            {loadError ?? (isAr ? `السيناريو ${scenarioNumber} غير موجود أو التحليل غير متاح بعد.` : `Scenario ${scenarioNumber} was not found or the analysis is not available.`)}
          </p>
          <Link
            href={`/decisions/${decisionId}/scenarios`}
            className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400"
          >
            <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
            <span>{isAr ? "العودة لمصفوفة المقارنة" : "Return to Comparison Matrix"}</span>
          </Link>
        </div>
      </div>
    );
  }

  const scorePercent = Math.round(scenario.feasibility_score * 100);
  const isCurrentPreferred = recommendation.current.selected_scenario_number === scenarioNumber;
  const scenarioAssumptions = scenario.assumptions ?? result.assumptions;

  return (
    <div className="space-y-4">
      <DecisionNavTabs decisionId={decisionId} />

      {/* Back button */}
      <div>
        <Link
          href={`/decisions/${decisionId}/scenarios`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white transition"
        >
          <ArrowLeft className="h-3.5 w-3.5 rtl:rotate-180" />
          <span>{isAr ? "العودة إلى السيناريوهات الثلاثة" : "Back to All 3 Scenarios"}</span>
        </Link>
      </div>

      {/* Hero Scenario Breakdown */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-4 sm:space-y-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-slate-400 uppercase tracking-wider">
                {isAr ? `تحليل متعمق للسيناريو 0${scenario.scenario_number}` : `Scenario 0${scenario.scenario_number} Deep Dive`}
              </span>
              {isCurrentPreferred && (
                <span className="inline-flex items-center gap-1 rounded-full bg-indigo-100 px-2.5 py-0.5 text-[10px] font-bold text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                  <Sparkles className="h-3 w-3" />
                  {recommendation.refinement
                    ? (isAr ? "الخيار المفضل بشرياً" : "Human-preferred option")
                    : (isAr ? "الخيار الموصى به نموذجياً" : "Model-recommended option")}
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
            <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block">
              {isAr ? "معدل الجدوى التقديري" : "Heuristic Feasibility Score"}
            </span>
            <div className="text-2xl font-extrabold text-indigo-600 dark:text-indigo-400 mt-0.5 font-mono">
              {scorePercent}%
            </div>
            <span className="text-[10px] font-medium text-slate-500 block">
              {isAr ? "تقدير استرشادي وليس احتمالية" : "Not a measured probability"}
            </span>
          </div>
        </div>

        {/* Scenario rationale */}
        <div className="rounded-xl border border-indigo-200 bg-indigo-50/60 p-4 text-xs dark:border-indigo-900/60 dark:bg-indigo-950/30">
          <h2 className="font-bold uppercase tracking-wider text-indigo-900 text-[10px] dark:text-indigo-300">
            {isAr ? "المبررات المنطقية للسيناريو" : "Scenario rationale"}
          </h2>
          <p className="mt-1 text-indigo-950 leading-relaxed dark:text-indigo-100">
            {scenario.rationale?.trim() || (isAr ? "لم يتم تخزين تعليل السيناريو مع هذا التحليل. التحليل المحفوظ والمذكرات الحالية تبقى محفوظة." : "Scenario reasoning was not stored with this analysis. The saved analysis, any human refinement, and any existing report remain unchanged. A new analysis run creates a separate version with scenario-specific reasoning.")}
          </p>
        </div>

        {/* Detailed Sections Grid */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 pt-3 border-t border-slate-100 dark:border-slate-800">
          <div className="rounded-xl border border-slate-200 bg-slate-50/40 p-4 dark:border-slate-800 dark:bg-slate-800/30 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
              <Layers className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
              <span>{isAr ? "التغييرات التشغيلية" : "Operational Changes"}</span>
            </div>
            <ul className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
              {scenario.key_changes?.length ? scenario.key_changes.map((change, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  <span>{change}</span>
                </li>
              )) : <li className="text-xs text-slate-500">{isAr ? "لم يتم توفير خطوات تنفيذ محددة للسيناريو. راجع الوصف أعلاه." : "Scenario-specific implementation steps were not provided by the analysis. See the description above."}</li>}
            </ul>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50/40 p-4 dark:border-slate-800 dark:bg-slate-800/30 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
              <Calendar className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
              <span>{isAr ? "الافتراضات وشروط القرار" : "Assumptions & Decision Conditions"}</span>
            </div>
            <ul className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
              {scenarioAssumptions.length ? scenarioAssumptions.map((assump, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 shrink-0 mt-1.5" />
                  <span>{assump}</span>
                </li>
              )) : <li className="text-xs text-slate-500">{isAr ? "لا توجد افتراضات محددة من التحليل." : "No assumptions were provided by the analysis."}</li>}
            </ul>
          </div>
        </div>

        {/* Tradeoff Box */}
        <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-3 text-xs dark:border-amber-900/60 dark:bg-amber-950/30">
          <span className="font-bold uppercase tracking-wider text-amber-900 dark:text-amber-300 text-[10px]">
            {isAr ? "ملاحظة مراجعة القرار والمقايضات" : "Decision Review Note"}
          </span>
          <p className="mt-0.5 text-amber-950 dark:text-amber-200 leading-relaxed text-[11px]">
            {scenario.tradeoff_summary ?? (isAr ? "لم يتم تقديم ملخص للمقايضات في هذا التحليل." : "No trade-off summary was provided by the analysis.")}
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => void handleSetPreferred()}
              disabled={savingPreferred}
              className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold transition cursor-pointer ${
                isCurrentPreferred
                  ? "bg-emerald-600 text-white"
                  : "bg-slate-900 text-white hover:bg-slate-800 dark:bg-indigo-600 dark:hover:bg-indigo-500"
              }`}
            >
              {isCurrentPreferred ? (
                <Check className="h-3.5 w-3.5" />
              ) : (
                <Award className="h-3.5 w-3.5" />
              )}
              <span>
                {savingPreferred
                  ? (isAr ? "جارٍ الحفظ…" : "Saving…")
                  : isCurrentPreferred
                  ? (isAr ? "الخيار المفضل" : "Preferred option")
                  : (isAr ? "تعيين كخيار مفضل" : "Set as preferred option")}
              </span>
            </button>

            <button
              type="button"
              onClick={handleExportBreakdown}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 cursor-pointer transition"
            >
              <Download className="h-3.5 w-3.5" />
              <span>{isAr ? "تصدير التفاصيل" : "Export Breakdown"}</span>
            </button>
          </div>

          <Link
            href={`/decisions/${decisionId}/consequences`}
            className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 transition"
          >
            <span>{isAr ? "المتابعة إلى آثار أصحاب المصلحة" : "Proceed to Stakeholder Ripples"}</span>
            <ChevronRight className="h-3.5 w-3.5 rtl:rotate-180" />
          </Link>
        </div>
      </div>
    </div>
  );
}
