"use client";

import React, { useCallback, useEffect, useState, use } from "react";
import Link from "next/link";
import {
  Award,
  ArrowRight,
  ArrowLeft,
  FileText,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Send,
  Loader2,
  GitCompare,
  TrendingUp,
  ShieldCheck,
  Scale,
  Users2,
  CalendarDays,
  Clock,
  RotateCcw,
  Check,
} from "lucide-react";
import { getRecommendation, getSimulationResult, refineRecommendation } from "@/lib/api";
import { DecisionNavTabs } from "@/components/DecisionNavTabs";
import { useLocale } from "@/components/LocaleProvider";
import { RecommendationView, SimulationResult } from "@/types/decision";
import { toast } from "sonner";
import { RecommendationSkeleton } from "@/components/LoadingSkeleton";

export default function RecommendationPage({
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

  // Refinement modal state
  const [refineFeedback, setRefineFeedback] = useState("");
  const [refining, setRefining] = useState(false);
  const [refineModalOpen, setRefineModalOpen] = useState(false);
  const [switchingScenario, setSwitchingScenario] = useState<number | null>(null);

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
      setLoadError(
        cause instanceof Error
          ? cause.message
          : isAr
          ? "تعذر تحميل التوصية."
          : "Could not load recommendation."
      );
    } finally {
      setLoading(false);
    }
  }, [decisionId, isAr]);

  useEffect(() => {
    void Promise.resolve().then(loadAnalysis);
  }, [loadAnalysis]);

  const handleRefineSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!refineFeedback.trim()) return;
    setRefining(true);
    try {
      const updated = await refineRecommendation(Number(decisionId), {
        feedback: refineFeedback.trim(),
      });
      setRecommendation(updated);
      setRefineFeedback("");
      setRefineModalOpen(false);
      toast.success(
        isAr ? "تم تحسين التوصية بتوجيهات القيادة!" : "Recommendation refined with leadership guidance!",
        {
          description: isAr
            ? "تم الاحتفاظ بتوصية التحليل الأساسية لأغراض التدقيق."
            : "The baseline model recommendation remains preserved for audit history.",
        }
      );
    } catch (cause) {
      toast.error(isAr ? "تعذر تحسين التوصية" : "Could not refine recommendation", {
        description: cause instanceof Error ? cause.message : isAr ? "حاول مجدداً." : "Try again.",
      });
    } finally {
      setRefining(false);
    }
  };

  const handleSwitchPathway = async (scenarioNumber: number) => {
    if (switchingScenario !== null || !recommendation) return;
    const isCurrent = recommendation.current.selected_scenario_number === scenarioNumber;
    const targetScenario = isCurrent
      ? recommendation.original.selected_scenario_number
      : scenarioNumber;

    setSwitchingScenario(scenarioNumber);
    try {
      const updated = await refineRecommendation(Number(decisionId), {
        selected_scenario_number: targetScenario,
        feedback: isCurrent
          ? `Leadership reset pathway adoption back to baseline recommendation Scenario 0${targetScenario}.`
          : `Leadership elected to adopt Scenario 0${scenarioNumber} as the preferred institutional strategy.`,
      });
      setRecommendation(updated);
      if (isCurrent) {
        toast.info(
          isAr
            ? `تم إلغاء اعتماد المسار، والعودة إلى مسار التوصية الأساسي (المسار 0${targetScenario})`
            : `Adoption removed. Restored baseline pathway 0${targetScenario}`,
        );
      } else {
        toast.success(
          isAr ? `تم تعيين المسار 0${scenarioNumber} كمسار معتمد!` : `Scenario 0${scenarioNumber} selected as active pathway!`,
          {
            description: isAr
              ? "تم تحديث التوصية ومذكرة المجلس رسمياً."
              : "Strategic synthesis and board memorandum have been updated.",
          }
        );
      }
    } catch (cause) {
      toast.error(isAr ? "تعذر تغيير المسار" : "Could not switch pathway", {
        description: cause instanceof Error ? cause.message : isAr ? "حاول مجدداً." : "Try again.",
      });
    } finally {
      setSwitchingScenario(null);
    }
  };

  if (loading) {
    return <RecommendationSkeleton decisionId={decisionId} />;
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
            {loadError ?? (isAr ? "التوصية غير متاحة بعد." : "Recommendation is not available yet.")}
          </p>
          <button
            type="button"
            onClick={() => void loadAnalysis()}
            className="mt-3 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-500 cursor-pointer"
          >
            {isAr ? "إعادة المحاولة" : "Retry Loading"}
          </button>
        </div>
      </div>
    );
  }

  const rec = recommendation.current;
  const confidenceScore = Math.round(result.confidence.score * 100);

  const selectedScenarioObj = result.scenarios.find(
    (s) => s.scenario_number === rec.selected_scenario_number
  );
  const selectedFeasibility = selectedScenarioObj
    ? Math.round(selectedScenarioObj.feasibility_score * 100)
    : null;

  // Filter ripples relevant to the chosen scenario
  const chosenImpacts = result.impacts.filter(
    (imp) => imp.scenario_number === rec.selected_scenario_number
  );

  const stakeholderMap = new Map(result.stakeholders.map((s) => [s.key, s.name]));

  const getConfidenceLevelText = (level: string) => {
    if (!isAr) return `${level} Confidence`;
    switch (level.toUpperCase()) {
      case "HIGH": return "ثقة عالية";
      case "MEDIUM": return "ثقة متوسطة";
      case "LOW": return "ثقة منخفضة";
      default: return level;
    }
  };

  return (
    <div className="space-y-6">
      <DecisionNavTabs decisionId={decisionId} />

      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
            {isAr ? "المرحلة 04 · التوصية الاستراتيجية ومسار الحل" : "Stage 04 · Strategic Recommendation & Solution Track"}
          </span>
          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            {isAr ? "التوصية الإستراتيجية والتوليف النهائي" : "Strategic Recommendation & Synthesis"}
          </h1>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 max-w-2xl leading-relaxed">
            {isAr
              ? "توصية مؤسسية نهائية صريحة وموجزة لقيادات الجامعة مع تصنيفات الثقة ومقارنة البدائل وإمكانية التحسين التفاعلي."
              : "Definitive synthesized recommendation for institutional leaders with explicit confidence ratings, alternative comparisons, and interactive AI refinement."}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setRefineModalOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50 px-3.5 py-2 text-xs font-bold text-indigo-700 hover:bg-indigo-100 dark:border-indigo-900 dark:bg-indigo-950/60 dark:text-indigo-300 transition cursor-pointer"
          >
            <Sparkles className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
            <span>{isAr ? "تحسين بتوجيه الذكاء الاصطناعي" : "Refine with AI Guidance"}</span>
          </button>

          <Link
            href={`/decisions/${decisionId}/report`}
            className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-indigo-500 transition"
          >
            <FileText className="h-3.5 w-3.5" />
            <span>{isAr ? "المذكرة التنفيذية" : "Executive Memorandum"}</span>
            <ArrowRight className="h-3.5 w-3.5 rtl:rotate-180" />
          </Link>
        </div>
      </div>

      {/* Human Refinement Banner if Active */}
      {recommendation.refinement && (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50/80 p-4 text-xs dark:border-amber-900/50 dark:bg-amber-950/30">
          <RotateCcw className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="flex-1 space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-bold text-amber-900 dark:text-amber-200">
                {isAr ? "توجيهات بشرية نشطة تم دمجها في التحليل:" : "Human Leadership Guidance Integrated:"}
              </span>
              <span className="text-[10px] text-amber-600 dark:text-amber-400 font-mono">
                {new Date(recommendation.refinement.created_at).toLocaleDateString(isAr ? "ar-EG" : "en-US")}
              </span>
            </div>
            <p className="text-amber-800 dark:text-amber-300 italic">
              &quot;{recommendation.refinement.feedback}&quot;
            </p>
          </div>
        </div>
      )}

      {/* Recommended Pathway Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-indigo-200 bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-900 p-6 sm:p-8 text-white shadow-xl">
        <div className="relative z-10 space-y-5 max-w-4xl">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-500/30 border border-indigo-400/40 px-3 py-1 text-xs font-extrabold text-indigo-200">
              <Award className="h-3.5 w-3.5 text-indigo-300" />
              <span>
                {recommendation.refinement
                  ? (isAr ? "مسار معتمد بتوجيه القيادة" : "Leadership-Approved Decision Pathway")
                  : (isAr ? "المسار الموصى به نموذجياً" : "Model-Recommended Decision Pathway")}
              </span>
            </span>

            <span className="rounded-full bg-emerald-500/25 border border-emerald-400/40 px-3 py-1 text-xs font-extrabold text-emerald-300 font-mono">
              {isAr ? `المسار 0${rec.selected_scenario_number}` : `Scenario 0${rec.selected_scenario_number}`}
            </span>

            {selectedFeasibility !== null && (
              <span className="rounded-full bg-indigo-400/20 border border-indigo-300/30 px-3 py-1 text-xs font-bold text-indigo-200 font-mono">
                {isAr ? `معامل الجدوى: ${selectedFeasibility}%` : `Feasibility: ${selectedFeasibility}%`}
              </span>
            )}
          </div>

          <div>
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-extrabold tracking-tight text-white">
              {rec.title}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-indigo-100/90 max-w-3xl">
              {rec.summary}
            </p>
          </div>

          {/* Core Rationale Block */}
          <div className="rounded-xl border border-indigo-500/30 bg-indigo-950/70 p-4 sm:p-5 text-xs leading-relaxed text-indigo-100 space-y-2">
            <div className="flex items-center gap-2">
              <Sparkles className="h-3.5 w-3.5 text-indigo-300" />
              <span className="font-bold uppercase tracking-wider text-indigo-300 text-[10px]">
                {isAr ? "المبررات الإستراتيجية المؤسسية المتكاملة" : "Institutional Strategic Rationale & Governance Defense"}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-indigo-100/95 leading-relaxed">{rec.rationale}</p>
          </div>
        </div>

        {/* Subtle Decorative Elements */}
        <div className="absolute -top-12 -right-12 h-64 w-64 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
      </div>

      {/* ─── Comparative Pathways Scoreboard: Why This Over Others? ─── */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <GitCompare className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
              <span>{isAr ? "مقارنة المسار الموصى به بالبدائل الأخرى" : "Comparative Analysis: Recommended vs Alternatives"}</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {isAr
                ? "يوضح الجدول سبب ترجيح هذا المسار وكيف يتفوق على الخيارات المطروحة الأخرى."
                : "Understand why this pathway scored highest and how it compares against competing options."}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {result.scenarios.map((scen) => {
            const isCurrent = scen.scenario_number === rec.selected_scenario_number;
            const scorePct = Math.round(scen.feasibility_score * 100);

            return (
              <div
                key={scen.scenario_number}
                className={`relative rounded-2xl border p-5 transition-all ${
                  isCurrent
                    ? "border-indigo-400/80 bg-indigo-50/50 dark:border-indigo-500/60 dark:bg-indigo-950/20 shadow-md ring-2 ring-indigo-500/20"
                    : "border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 shadow-xs"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="font-mono text-xs font-bold text-slate-400">
                    0{scen.scenario_number}
                  </span>
                  {isCurrent ? (
                    <button
                      type="button"
                      disabled={switchingScenario !== null}
                      onClick={() => handleSwitchPathway(scen.scenario_number)}
                      title={isAr ? "اضغط لإلغاء الاعتماد واستعادة المسار الأساسي" : "Click to remove adoption and reset to baseline"}
                      className="group inline-flex items-center gap-1 rounded-full bg-emerald-100 hover:bg-rose-100 dark:bg-emerald-950 dark:hover:bg-rose-950 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800 hover:text-rose-700 dark:text-emerald-300 dark:hover:text-rose-300 transition cursor-pointer"
                    >
                      <Check className="h-3 w-3 group-hover:hidden" />
                      <span className="group-hover:hidden">{isAr ? "المسار المعتمد" : "Selected Pathway"}</span>
                      <span className="hidden group-hover:inline">{isAr ? "إلغاء الاعتماد ✕" : "Remove ✕"}</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={switchingScenario !== null}
                      onClick={() => handleSwitchPathway(scen.scenario_number)}
                      className="rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 px-2 py-1 text-[10px] font-semibold text-slate-700 dark:text-slate-300 transition cursor-pointer disabled:opacity-50"
                    >
                      {switchingScenario === scen.scenario_number
                        ? (isAr ? "جارٍ الاعتماد…" : "Selecting…")
                        : (isAr ? "اعتماد كبديل" : "Select as Alt")}
                    </button>
                  )}
                </div>

                <h3 className="mt-2 text-sm font-bold text-slate-900 dark:text-white line-clamp-1">
                  {scen.title}
                </h3>

                <div className="mt-3 space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-500 dark:text-slate-400">{isAr ? "درجة الجدوى" : "Feasibility"}</span>
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{scorePct}%</span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isCurrent
                          ? "bg-indigo-600 dark:bg-indigo-400"
                          : scorePct >= 70
                          ? "bg-emerald-500"
                          : "bg-amber-500"
                      }`}
                      style={{ width: `${scorePct}%` }}
                    />
                  </div>
                </div>

                <p className="mt-3 text-xs text-slate-600 dark:text-slate-400 line-clamp-3 leading-relaxed">
                  {scen.tradeoff_summary || scen.description}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ─── Stakeholder Ripples for Selected Recommendation ─── */}
      {chosenImpacts.length > 0 && (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Users2 className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                <span>{isAr ? "توزيع الأثر التتابعي على أصحاب المصلحة (للمسار المعتمد)" : "Cascading Ripples on Constituencies (Selected Pathway)"}</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isAr
                  ? "كيف يؤثر هذا الخيار بشكل مباشر على الفئات الخمس داخل الحرم الجامعي."
                  : "Direct line-of-sight impacts across campus constituencies under this scenario."}
              </p>
            </div>

            <Link
              href={`/decisions/${decisionId}/consequences`}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 inline-flex items-center gap-1"
            >
              <span>{isAr ? "عرض المصفوفة الكاملة" : "Full Ripple Matrix"}</span>
              <ArrowRight className="h-3 w-3 rtl:rotate-180" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {chosenImpacts.map((imp, idx) => {
              const stakeholderName = stakeholderMap.get(imp.stakeholder_key) || imp.stakeholder_key;
              const isPos = imp.direction === "POSITIVE";
              const isNeg = imp.direction === "NEGATIVE";

              return (
                <div
                  key={idx}
                  className="rounded-xl border border-slate-100 bg-slate-50/60 p-3.5 text-xs dark:border-slate-800/80 dark:bg-slate-800/40 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {stakeholderName}
                    </span>
                    <span
                      className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-bold ${
                        isPos
                          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                          : isNeg
                          ? "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
                          : "bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-300"
                      }`}
                    >
                      {imp.direction} · {imp.magnitude}
                    </span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed">
                    {imp.description}
                  </p>
                  {imp.metric_estimate && (
                    <span className="inline-block rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-2 py-0.5 text-[10px] font-mono text-slate-600 dark:text-slate-300">
                      {imp.metric_estimate}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ─── Operational Implementation Roadmap ─── */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            <span>{isAr ? "خطة التنفيذ والضوابط التشغيلية المقترحة" : "Phased Implementation & Governance Guardrails"}</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {isAr
              ? "خطوات مرحلية واضحة لتنفيذ القرار بأعلى درجات الانسيابية وأقل قدر من المخاطر."
              : "Actionable phased execution timeline to safeguard institutional continuity and compliance."}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-2">
            <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold text-xs uppercase tracking-wider">
              <Clock className="h-3.5 w-3.5" />
              <span>{isAr ? "المرحلة 1: الشهر الأول" : "Phase 1: Month 01"}</span>
            </div>
            <h3 className="font-bold text-slate-900 dark:text-white text-xs">
              {isAr ? "بروتوكول الاستثناءات وحماية المعامل" : "Protocol Exemptions & Lab Safeguards"}
            </h3>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
              {isAr
                ? "إصدار تصاريح الوصول المستمر لـ 14 معملاً رطباً وتأمين مناوبات الفنيين والتبريد المركزي."
                : "Issue 24/7 access permits for all 14 wet research labs, securing critical cooling and technician shifts."}
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-2">
            <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold text-xs uppercase tracking-wider">
              <Clock className="h-3.5 w-3.5" />
              <span>{isAr ? "المرحلة 2: الأشهر 2 - 3" : "Phase 2: Months 02-03"}</span>
            </div>
            <h3 className="font-bold text-slate-900 dark:text-white text-xs">
              {isAr ? "إعادة جدولة المقررات ودعم النقل" : "Course Rescheduling & Commuter Support"}
            </h3>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
              {isAr
                ? "توزيع المحاضرات المكثفة أيام الاثنين-الخميس مع توجيه 15% من وفورات الطاقة لدعم حافلات الطلاب المتنقلين."
                : "Compress lectures Monday-Thursday while allocating 15% of energy savings to subsidize Friday student transit."}
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-2">
            <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold text-xs uppercase tracking-wider">
              <Clock className="h-3.5 w-3.5" />
              <span>{isAr ? "المرحلة 3: نهاية الفصل" : "Phase 3: Semester Review"}</span>
            </div>
            <h3 className="font-bold text-slate-900 dark:text-white text-xs">
              {isAr ? "تدقيق المخرجات ومواءمة الاعتماد" : "Outcomes Audit & Board Alignment"}
            </h3>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
              {isAr
                ? "قياس وفورات المرافق الفعلية ومعدلات حضور الطلاب وساعات التدريس لتقديم تقرير نهائي لمجلس الأمناء."
                : "Measure verified utility savings, student retention, and instructional hours to report to the Board of Trustees."}
            </p>
          </div>
        </div>
      </section>

      {/* Confidence Gauge & Analytical Basis Grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {/* Confidence Gauge Card */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              {isAr ? "مستوى ثقة النموذج" : "Model Confidence Rating"}
            </span>
            <span
              className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                confidenceScore >= 80
                  ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                  : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
              }`}
            >
              {getConfidenceLevelText(result.confidence.level)}
            </span>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-extrabold text-indigo-600 dark:text-indigo-400 font-mono">
              {confidenceScore}%
            </span>
            <span className="text-xs text-slate-400">
              {isAr ? "معايرة تقديرية" : "heuristic calibration"}
            </span>
          </div>

          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
            <div
              className={`h-full rounded-full transition-all duration-700 ${
                confidenceScore >= 80 ? "bg-emerald-500" : "bg-indigo-600"
              }`}
              style={{ width: `${confidenceScore}%` }}
            />
          </div>

          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
            {result.confidence.rationale}
          </p>
        </div>

        {/* Key Model Assumptions */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-3">
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            <span>{isAr ? "الافتراضات المعتمدة" : "Verified Assumptions"}</span>
          </div>
          <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
            {result.assumptions.map((assump, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 shrink-0 mt-1.5" />
                <span className="leading-relaxed">{assump}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Known Limitations & Guardrails */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-3">
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
            <AlertCircle className="h-4 w-4 text-amber-500" />
            <span>{isAr ? "المحددات التحليلية" : "Analytical Limitations"}</span>
          </div>
          <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
            {result.limitations.map((limit, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0 mt-1.5" />
                <span className="leading-relaxed">{limit}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Fairness & Constituency Review Section */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-3">
        <div className="flex items-center gap-2">
          <Scale className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">
            {isAr ? "تدقيق العدالة لأصحاب المصلحة والمواءمة التنظيمية" : "Constituency Fairness Audit & Equity Review"}
          </h2>
        </div>
        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
          {result?.fairness?.note ||
            (isAr
              ? "قام تقييم العدالة بقياس الأعباء المحتملة على الطلاب المتنقلين وباحثي المختبرات العلمية لضمان عدم وجود فئات متضررة بشكل غير متكافئ."
              : "Fairness assessment evaluated potential disproportionate burdens on commuting students and laboratory researchers to ensure balanced institutional equity.")}
        </p>

        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div>
            <span className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
              {isAr ? "فئات محددة للمراجعة الدقيقة:" : "Groups Flagged for Special Review:"}
            </span>
            <div className="flex flex-wrap gap-1.5">
              {result?.fairness?.affected_groups_to_review?.map((group) => (
                <span
                  key={group}
                  className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-800 dark:bg-slate-800 dark:text-slate-200"
                >
                  {group}
                </span>
              ))}
            </div>
          </div>

          <div>
            <span className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
              {isAr ? "مخاوف حوكمة محتملة:" : "Potential Governance Concerns:"}
            </span>
            <ul className="list-disc space-y-1 ps-4 text-slate-600 dark:text-slate-400">
              {result?.fairness?.potential_concerns?.map((concern, idx) => (
                <li key={idx}>{concern}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ─── Bottom Navigation Actions ─── */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
        <Link
          href={`/decisions/${decisionId}/risks`}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 transition shadow-xs"
        >
          <ArrowLeft className="h-3.5 w-3.5 rtl:rotate-180" />
          <span>{isAr ? "السابق: مراجعة سجل المخاطر" : "Previous: Risk Register"}</span>
        </Link>

        <Link
          href={`/decisions/${decisionId}/report`}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow-md hover:bg-indigo-500 transition"
        >
          <FileText className="h-4 w-4" />
          <span>{isAr ? "الانتقال إلى المذكرة التنفيذية للمجلس" : "Proceed to Board Memorandum"}</span>
          <ArrowRight className="h-4 w-4 rtl:rotate-180" />
        </Link>
      </div>

      {/* Refine Recommendation Modal */}
      {refineModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {isAr ? "تحسين التوصية الإستراتيجية" : "Refine Strategic Recommendation"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setRefineModalOpen(false)}
                className="text-xs font-semibold text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                {isAr ? "إغلاق" : "Close"}
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              {isAr
                ? "أدخل توجيهات مجلس الجامعة أو تعديلات اللجان أو القيود المحددة. سيقوم RippleIQ بتعديل التلخيص مع الاحتفاظ بالتحليل الأساسي للرجوع إليه."
                : "Input specific university board guidance, committee amendments, or constraints. RippleIQ will adjust the synthesis while preserving original baseline analysis."}
            </p>

            <form onSubmit={handleRefineSubmit} className="space-y-3">
              <textarea
                rows={4}
                required
                value={refineFeedback}
                onChange={(e) => setRefineFeedback(e.target.value)}
                placeholder={
                  isAr
                    ? "مثال: ضمان تشغيل المختبرات الحيوية والكيميائية بكوادر طوارئ أيام الجمعة، وتخصيص جزء من وفورات الطاقة لدعم حافلات الطلاب المتنقلين..."
                    : "Example: Ensure all wet biology and chemistry laboratories receive emergency staffing on Fridays, and guarantee student dining halls remain 50% open..."
                }
                className="w-full rounded-xl border border-slate-300 bg-white p-3 text-xs text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white outline-none"
              />

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRefineModalOpen(false)}
                  className="rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 cursor-pointer"
                >
                  {isAr ? "إلغاء" : "Cancel"}
                </button>
                <button
                  type="submit"
                  disabled={refining}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50 cursor-pointer"
                >
                  {refining ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                  <span>{refining ? (isAr ? "جارٍ تحسين التلخيص…" : "Refining Synthesis...") : (isAr ? "إرسال التوجيهات للتحسين" : "Submit AI Refinement")}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
