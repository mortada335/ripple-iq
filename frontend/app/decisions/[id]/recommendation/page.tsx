"use client";

import React, { useCallback, useEffect, useState, use } from "react";
import Link from "next/link";
import {
  Award,
  ArrowRight,
  FileText,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Send,
  Loader2,
} from "lucide-react";
import { getRecommendation, getSimulationResult, refineRecommendation } from "@/lib/api";
import { DecisionNavTabs } from "@/components/DecisionNavTabs";
import { useLocale } from "@/components/LocaleProvider";
import { RecommendationView, SimulationResult } from "@/types/decision";
import { toast } from "sonner";
import { DecisionAnalysisSkeleton } from "@/components/LoadingSkeleton";

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
      setLoadError(cause instanceof Error ? cause.message : isAr ? "تعذر تحميل التوصية." : "Could not load recommendation.");
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
            {isAr ? "المرحلة 05 من تحليل القرار" : "Stage 05 of Decision Analysis"}
          </span>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
            {isAr ? "التوصية الإستراتيجية والتوليف النهائي" : "Strategic Recommendation & Synthesis"}
          </h1>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 max-w-2xl leading-relaxed">
            {isAr
              ? "توصية شاملة وموجزة للقادة مع تصنيفات صريحة لمستوى الثقة، ومقايضات واضحة، وإمكانية التحسين التفاعلي."
              : "Synthesized recommendation for institutional leaders with explicit confidence ratings, transparent trade-offs, and interactive AI refinement."}
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
            <span>{isAr ? "إنشاء المذكرة التنفيذية" : "Generate Memorandum"}</span>
            <ArrowRight className="h-3.5 w-3.5 rtl:rotate-180" />
          </Link>
        </div>
      </div>

      {/* Recommended Pathway Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-indigo-200 bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-900 p-6 sm:p-8 text-white shadow-xl">
        <div className="space-y-4 max-w-3xl">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-indigo-500/30 border border-indigo-400/40 px-3 py-1 text-xs font-extrabold text-indigo-200">
              <Award className="h-3.5 w-3.5 text-indigo-300" />
              <span>
                {recommendation.refinement
                  ? (isAr ? "مسار قرار محسّن بشرياً" : "Human-Refined Decision Pathway")
                  : (isAr ? "مسار موصى به من النموذج" : "Model-Recommended Pathway")}
              </span>
            </span>

            <span className="rounded-full bg-emerald-500/20 border border-emerald-400/30 px-3 py-1 text-xs font-extrabold text-emerald-300 font-mono">
              {isAr ? `تم اختيار المسار 0${rec.selected_scenario_number}` : `Scenario 0${rec.selected_scenario_number} Selected`}
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white">
            {rec.title}
          </h2>

          <p className="text-sm leading-relaxed text-indigo-100/90">
            {rec.summary}
          </p>

          {/* Core Rationale Block */}
          <div className="rounded-xl border border-indigo-500/30 bg-indigo-950/60 p-4 text-xs leading-relaxed text-indigo-200 space-y-1">
            <span className="block font-bold uppercase tracking-wider text-indigo-300 text-[10px]">
              {isAr ? "المبررات الإستراتيجية المؤسسية" : "Institutional Strategic Rationale"}
            </span>
            <p>{rec.rationale}</p>
          </div>
        </div>
      </div>

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
        <h2 className="text-sm font-bold text-slate-900 dark:text-white">
          {isAr ? "تدقيق العدالة لأصحاب المصلحة" : "Constituency Fairness Audit"}
        </h2>
        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
          {result?.fairness?.note || (isAr ? "قام تقييم العدالة بقياس الأعباء المحتملة على الطلاب المتنقلين وباحثي المختبرات العلمية." : "Fairness assessment evaluated potential disproportionate burdens on commuting students and laboratory researchers.")}
        </p>

        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
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
                    ? "مثال: ضمان تشغيل المختبرات الحيوية والكيميائية بكوادر طوارئ أيام الجمعة، وضمان بقاء قاعات طعام الطلاب مفتوحة بنسبة 50%..."
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
