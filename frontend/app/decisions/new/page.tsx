"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowRight,
  Sparkles,
  Loader2,
  Save,
  ArrowLeft,
} from "lucide-react";
import { createDecision } from "@/lib/api";
import { Priority } from "@/types/decision";
import { toast } from "sonner";
import { useLocale } from "@/components/LocaleProvider";

const TIME_HORIZONS = [
  { value: "1 month", en: "1 month", ar: "شهر واحد" },
  { value: "1 quarter", en: "1 quarter", ar: "ربع سنة (3 أشهر)" },
  { value: "1 year", en: "1 year", ar: "سنة واحدة" },
  { value: "3 years", en: "3 years", ar: "3 سنوات" },
  { value: "5 years", en: "5 years", ar: "5 سنوات" },
];

const DEPARTMENTS = [
  { value: "Academic Affairs", en: "Academic Affairs", ar: "الشؤون الأكاديمية" },
  { value: "Campus Operations & Facilities", en: "Campus Operations & Facilities", ar: "عمليات ومرافق الحرم الجامعي" },
  { value: "Student Affairs & Wellbeing", en: "Student Affairs & Wellbeing", ar: "شؤون ورعاية الطلاب" },
  { value: "Research Administration", en: "Research Administration", ar: "إدارة البحوث العلمية" },
  { value: "Financial & Auxiliary Planning", en: "Financial & Auxiliary Planning", ar: "التخطيط المالي والخدمات المساندة" },
  { value: "Human Resources", en: "Human Resources", ar: "الموارد البشرية" },
];

export default function CreateDecisionPage() {
  const router = useRouter();
  const { locale, t } = useLocale();
  const isAr = locale === "ar";

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [department, setDepartment] = useState("Academic Affairs");
  const [timeHorizon, setTimeHorizon] = useState("1 year");
  const [priority, setPriority] = useState<Priority>("HIGH");
  const [loading, setLoading] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePreFillDemo = () => {
    if (isAr) {
      setTitle("تقليص الحضور الجامعي من 5 أيام إلى 4 أيام أسبوعياً");
      setDescription(
        "تقييم تحول مؤسسي من أسبوع دراسي 5 أيام إلى أسبوع مكثف لـ 4 أيام (من الاثنين إلى الخميس)، مع تخصيص يوم الجمعة للتعلم الرقمي غير المتزامن، وأبحاث أعضاء هيئة التدريس، وتصحيح الاختبارات."
      );
      toast.success("تم تعبئة نموذج سياسة الـ 4 أيام بنجاح!", {
        description: "يمكنك تعديل أي بيانات أو المتابعة مباشرة لمعايرة السياق.",
      });
    } else {
      setTitle("Reduce in-person university attendance from five days to four days per week");
      setDescription(
        "Evaluate an institutional shift from a 5-day on-campus schedule to a condensed 4-day instructional week (Mon–Thu), with Friday designated for asynchronous digital learning, faculty research, and grading."
      );
      toast.success("University 4-Day Policy Proposal Pre-filled!", {
        description: "You can adjust any fields or continue to context calibration.",
      });
    }
    setDepartment("Academic Affairs");
    setTimeHorizon("1 year");
    setPriority("HIGH");
    setError(null);
  };

  const handleSaveDraft = async () => {
    if (title.trim().length < 5) {
      setError(
        isAr
          ? "يرجى تقديم عنوان من 5 أحرف على الأقل لحفظ المسودة."
          : "Please provide at least a short title (5+ characters) to save a draft."
      );
      return;
    }
    setSavingDraft(true);
    setError(null);
    try {
      await createDecision({
        title: title.trim(),
        description:
          description.trim() ||
          (isAr ? "مسودة مقترح سياسة قيد الاستكمال التفصيلي." : "Draft policy proposal awaiting operational detail."),
        department,
        time_horizon: timeHorizon,
        priority,
      });
      router.push("/dashboard");
    } catch (cause) {
      toast.error(isAr ? "تعذر حفظ المسودة" : "Could not save the draft", {
        description: cause instanceof Error ? cause.message : isAr ? "يرجى المحاولة مجدداً." : "Try again.",
      });
      setSavingDraft(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (title.trim().length < 5) {
      setError(isAr ? "يجب أن يتكون العنوان من 5 أحرف على الأقل." : "Title must be at least 5 characters.");
      return;
    }
    if (description.trim().length < 10) {
      setError(isAr ? "يجب أن يتكون الوصف من 10 أحرف على الأقل." : "Description must be at least 10 characters.");
      return;
    }

    setLoading(true);
    try {
      const decision = await createDecision({
        title: title.trim(),
        description: description.trim(),
        department,
        time_horizon: timeHorizon,
        priority,
      });
      router.push(`/decisions/${decision.id}/context`);
    } catch (cause) {
      toast.error(isAr ? "تعذر إنشاء مقترح القرار" : "Could not create decision proposal", {
        description:
          cause instanceof Error ? cause.message : isAr ? "تحقق من البيانات وحاول مجدداً." : "Check details and try again.",
      });
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
            {isAr ? "بدء تحليل قرار جديد" : "Initiate Decision Analysis"}
          </span>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
            {isAr ? "مقترح سياسة استراتيجية جديدة" : "New Strategic Policy Proposal"}
          </h1>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 max-w-2xl leading-relaxed">
            {isAr
              ? "صياغة القرار المؤسسي، وتحديد القسم المسؤول، وتعيين مستوى الأولوية الاستراتيجية."
              : "Frame the organizational decision, designate the responsible department, and calibrate strategic priority."}
          </p>
        </div>

        <button
          type="button"
          onClick={handlePreFillDemo}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-2 text-xs font-bold text-indigo-700 hover:bg-indigo-100 dark:border-indigo-900 dark:bg-indigo-950/60 dark:text-indigo-300 transition"
        >
          <Sparkles className="h-3.5 w-3.5" />
          <span>{isAr ? "تعبئة نموذج جاهز بضغطة واحدة" : "One-Click Hackathon Sample"}</span>
        </button>
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-800 dark:border-rose-900 dark:bg-rose-950/50 dark:text-rose-200"
        >
          {error}
        </div>
      )}

      {/* Main Creation Form Card */}
      <form onSubmit={handleSubmit} className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-6">
        {/* Title */}
        <div className="space-y-2">
          <label htmlFor="decision-title" className="text-sm font-bold text-slate-900 dark:text-white">
            {isAr ? "عنوان السياسة أو القرار" : "Policy or Decision Title"} <span className="text-rose-500">*</span>
          </label>
          <input
            id="decision-title"
            required
            maxLength={200}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={
              isAr
                ? "مثال: تقليص الحضور الجامعي من 5 إلى 4 أيام أسبوعياً"
                : "e.g. Reduce in-person university attendance from 5 to 4 days per week"
            }
            className="w-full rounded-xl border border-slate-300 bg-slate-50/50 px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          />
          <div className="flex justify-between text-[11px] text-slate-400">
            <span>{isAr ? "صياغة واضحة للمقترح. 5 أحرف كحد أدنى." : "State the proposal clearly. Min 5 characters."}</span>
            <span>{title.length}/200</span>
          </div>
        </div>

        {/* Description */}
        <div className="space-y-2">
          <label htmlFor="decision-desc" className="text-sm font-bold text-slate-900 dark:text-white">
            {isAr ? "نطاق القرار وأهدافه الاستراتيجية" : "Decision Scope & Objectives"} <span className="text-rose-500">*</span>
          </label>
          <textarea
            id="decision-desc"
            required
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={
              isAr
                ? "قدّم السياق والأسباب الدافعة، وفئات الحرم الجامعي المعنية، والمعايير التشغيلية المتوقعة..."
                : "Provide context regarding the motivation, affected campus constituencies, and expected operational parameters..."
            }
            className="w-full rounded-xl border border-slate-300 bg-slate-50/50 p-4 text-xs text-slate-900 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          />
        </div>

        {/* Priority Selector Chips */}
        <div className="space-y-2">
          <label className="text-sm font-bold text-slate-900 dark:text-white">
            {isAr ? "مستوى الأولوية الاستراتيجية" : "Strategic Priority Level"}
          </label>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {(["CRITICAL", "HIGH", "MEDIUM", "LOW"] as const).map((p) => {
              const isSelected = priority === p;
              const borderActive =
                p === "CRITICAL"
                  ? "border-rose-600 bg-rose-50 text-rose-800 dark:bg-rose-950/60 dark:text-rose-200"
                  : p === "HIGH"
                  ? "border-amber-600 bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-200"
                  : p === "MEDIUM"
                  ? "border-indigo-600 bg-indigo-50 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-200"
                  : "border-slate-600 bg-slate-50 text-slate-800 dark:bg-slate-800 dark:text-slate-200";

              const labelMap = {
                CRITICAL: isAr ? "حرج" : "CRITICAL",
                HIGH: isAr ? "عالي" : "HIGH",
                MEDIUM: isAr ? "متوسط" : "MEDIUM",
                LOW: isAr ? "منخفض" : "LOW",
              };

              const subMap = {
                CRITICAL: isAr ? "أولوية مجلس الإدارة" : "Board-level urgency",
                HIGH: isAr ? "على مستوى المؤسسة" : "Institution-wide",
                MEDIUM: isAr ? "على مستوى الكلية/القسم" : "Division-wide",
                LOW: isAr ? "إجرائي داخلي" : "Departmental",
              };

              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPriority(p)}
                  className={`flex flex-col items-center justify-center rounded-xl border p-3 transition text-center cursor-pointer ${
                    isSelected
                      ? `${borderActive} ring-2 ring-indigo-500 shadow-xs font-bold`
                      : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800"
                  }`}
                >
                  <span className="text-xs font-bold uppercase">{labelMap[p]}</span>
                  <span className="text-[10px] opacity-75 mt-0.5">{subMap[p]}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Department & Time Horizon Grid */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div className="space-y-2">
            <label htmlFor="dept" className="text-sm font-bold text-slate-900 dark:text-white">
              {isAr ? "القسم المسؤول" : "Responsible Department"}
            </label>
            <select
              id="dept"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-slate-50/50 px-3.5 py-2.5 text-xs font-semibold text-slate-900 outline-none focus:border-indigo-500 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            >
              {DEPARTMENTS.map((dept) => (
                <option key={dept.value} value={dept.value}>
                  {isAr ? dept.ar : dept.en}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label htmlFor="time-horizon" className="text-sm font-bold text-slate-900 dark:text-white">
              {isAr ? "الأفق الزمني للتنفيذ" : "Implementation Time Horizon"}
            </label>
            <select
              id="time-horizon"
              value={timeHorizon}
              onChange={(e) => setTimeHorizon(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-slate-50/50 px-3.5 py-2.5 text-xs font-semibold text-slate-900 outline-none focus:border-indigo-500 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            >
              {TIME_HORIZONS.map((th) => (
                <option key={th.value} value={th.value}>
                  {isAr ? th.ar : th.en}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center justify-between border-t border-slate-100 pt-6 dark:border-slate-800">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 transition"
          >
            <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
            <span>{isAr ? "إلغاء" : "Cancel"}</span>
          </Link>

          <div className="flex items-center gap-3">
            <button
              type="button"
              disabled={savingDraft || loading}
              onClick={handleSaveDraft}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 transition disabled:opacity-50 cursor-pointer"
            >
              <Save className="h-4 w-4" />
              <span>
                {savingDraft
                  ? isAr
                    ? "جارٍ الحفظ..."
                    : "Saving..."
                  : isAr
                  ? "حفظ كمسودة"
                  : "Save Draft"}
              </span>
            </button>

            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-2.5 text-xs font-bold text-white shadow-md shadow-indigo-600/30 hover:bg-indigo-500 transition disabled:opacity-50 cursor-pointer"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              <span>{isAr ? "المتابعة إلى السياق التشغيلي" : "Continue to Operational Context"}</span>
              {!loading && <ArrowRight className="h-4 w-4 rtl:rotate-180" />}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
