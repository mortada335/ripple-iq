"use client";

import React, { useCallback, useEffect, useState, use } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  CheckSquare,
  Square,
  Download,
  ArrowUpDown,
  Award,
} from "lucide-react";
import { getSimulationResult } from "@/lib/api";
import { DecisionNavTabs } from "@/components/DecisionNavTabs";
import { useLocale } from "@/components/LocaleProvider";
import { RiskItem, SimulationResult } from "@/types/decision";
import { toast } from "sonner";
import { ApiLoadError } from "@/components/ApiLoadError";
import { RisksMatrixSkeleton } from "@/components/LoadingSkeleton";

const SEVERITY_ORDER: Record<string, number> = {
  CRITICAL: 4,
  HIGH: 3,
  MEDIUM: 2,
  LOW: 1,
};

const LIKELIHOOD_ORDER: Record<string, number> = {
  HIGH: 3,
  MEDIUM: 2,
  LOW: 1,
};

export default function RiskRegisterPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const decisionId = resolvedParams.id;
  const { locale } = useLocale();
  const isAr = locale === "ar";

  const [result, setResult] = useState<SimulationResult | null>(null);
  const [risks, setRisks] = useState<RiskItem[]>([]);
  const [filterSeverity, setFilterSeverity] = useState<string>("ALL");
  const [activeCell, setActiveCell] = useState<{ likelihood?: string; severity?: string } | null>(null);
  const searchParams = useSearchParams();
  const initialSort = searchParams.get("sort") === "likelihood" ? "likelihood" : "severity";
  const [sortBy, setSortBy] = useState<"severity" | "likelihood">(initialSort);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadResult = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const data = await getSimulationResult(Number(decisionId));
      setResult(data);
      setRisks(data.risks || []);
    } catch (cause) {
      setLoadError(cause instanceof Error ? cause.message : isAr ? "تعذر تحميل نتائج المخاطر." : "Could not load risk results.");
    } finally {
      setLoading(false);
    }
  }, [decisionId, isAr]);

  useEffect(() => {
    void Promise.resolve().then(loadResult);
  }, [loadResult]);

  const toggleSort = () => {
    setSortBy((prev) => {
      const nextSort = prev === "severity" ? "likelihood" : "severity";
      if (typeof window !== "undefined") {
        const url = new URL(window.location.href);
        url.searchParams.set("sort", nextSort);
        window.history.replaceState(null, "", url);
      }
      return nextSort;
    });
  };

  const toggleAcknowledge = (idx: number) => {
    const updated = [...risks];
    updated[idx] = {
      ...updated[idx],
      acknowledged: !updated[idx].acknowledged,
    };
    setRisks(updated);

    if (result) setResult({ ...result, risks: updated });
    toast.info(
      updated[idx].acknowledged
        ? (isAr ? "تم اعتماد قائمة التحقق للتخفيف من قبل المراجع البشري" : "Mitigation checklist marked as verified by human reviewer")
        : (isAr ? "تمت إعادة ضبط حالة التخفيف" : "Mitigation status reset")
    );
  };

  const acknowledgedCount = risks.filter((r) => r.acknowledged).length;

  const filteredRisks = React.useMemo(() => {
    return risks
      .filter((r) => {
        if (filterSeverity !== "ALL" && r.severity.toUpperCase() !== filterSeverity) return false;
        if (activeCell) {
          if (activeCell.likelihood && r.likelihood.toUpperCase() !== activeCell.likelihood) return false;
          if (activeCell.severity && r.severity.toUpperCase() !== activeCell.severity) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === "severity") {
          return (SEVERITY_ORDER[b.severity] || 0) - (SEVERITY_ORDER[a.severity] || 0);
        } else {
          return (LIKELIHOOD_ORDER[b.likelihood] || 0) - (LIKELIHOOD_ORDER[a.likelihood] || 0);
        }
      });
  }, [risks, filterSeverity, activeCell, sortBy]);

  const handleExportRisks = () => {
    const csvContent = [
      "Title,Severity,Likelihood,Affected Stakeholders,Mitigation Strategy,Review Status",
      ...risks.map(
        (r) =>
          `"${r.title}","${r.severity}","${r.likelihood}","${r.affected_stakeholders.join("; ")}","${r.mitigation_strategy}","${r.acknowledged ? "VERIFIED" : "PENDING"}"`
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `rippleiq-decision-${decisionId}-risks.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(isAr ? "تم تصدير سجل المخاطر بنجاح بصيغة CSV" : "Risk register exported to CSV");
  };

  const translateSev = (sev: string) => {
    if (!isAr) return sev;
    switch (sev.toUpperCase()) {
      case "CRITICAL": return "حرج";
      case "HIGH": return "عالي";
      case "MEDIUM": return "متوسط";
      case "LOW": return "منخفض";
      case "ALL": return "الكل";
      default: return sev;
    }
  };

  const translateLik = (lik: string) => {
    if (!isAr) return lik;
    switch (lik.toUpperCase()) {
      case "HIGH": return "عالية";
      case "MEDIUM": return "متوسطة";
      case "LOW": return "منخفضة";
      default: return lik;
    }
  };

  const translateStakeholder = (name: string) => {
    if (!isAr) return name;
    switch (name.toLowerCase()) {
      case "students": return "الطلاب";
      case "faculty": return "أعضاء هيئة التدريس";
      case "laboratories": return "المختبرات";
      case "administration": return "الإدارة";
      case "transportation": return "النقل";
      default: return name;
    }
  };

  if (loading) {
    return <RisksMatrixSkeleton decisionId={decisionId} />;
  }

  if (loadError || !result) {
    return (
      <div className="space-y-4">
        <DecisionNavTabs decisionId={decisionId} />
        <ApiLoadError
          message={loadError ?? (isAr ? "نتائج تحليل المخاطر غير متاحة بعد." : "Risk analysis results are not available yet.")}
          onRetry={() => void loadResult()}
        />
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
            {isAr ? "المرحلة 04 من تحليل القرار" : "Stage 04 of Decision Analysis"}
          </span>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
            {isAr ? "سجل المخاطر المؤسسية" : "Institutional Risk Register"}
          </h1>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 max-w-2xl leading-relaxed">
            {isAr
              ? "تحديد الثغرات ونقاط الخطر المحتملة عبر مرافق المؤسسة والاعتماد والكوادر. يتطلب اعتماداً بشرياً لخطط التخفيف."
              : "Identifies vulnerabilities and potential failure modes across campus facilities, accreditation, and staffing. Requires active human mitigation sign-off."}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleExportRisks}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <Download className="h-3.5 w-3.5" />
            <span>{isAr ? "تصدير CSV" : "Export CSV"}</span>
          </button>

          <Link
            href={`/decisions/${decisionId}/recommendation`}
            className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-indigo-500 transition"
          >
            <Award className="h-3.5 w-3.5" />
            <span>{isAr ? "التوصية التنفيذية" : "Recommendation"}</span>
          </Link>
        </div>
      </div>

      {/* 3x3 Risk Heat Matrix Card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-100 pb-3 dark:border-slate-800">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              {isAr ? "مصفوفة المخاطر المؤسسية 3×3" : "Institutional 3x3 Risk Matrix"}
            </h2>
            <p className="text-xs text-slate-500">
              {isAr
                ? "انقر فوق أي خلية لتصفية المخاطر حسب موضع الاحتمالية والشدة."
                : "Click any cell to filter risks by Likelihood & Severity positioning."}
            </p>
          </div>

          {activeCell && (
            <button
              type="button"
              onClick={() => setActiveCell(null)}
              className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
            >
              {isAr ? "إلغاء تصفية المصفوفة" : "Clear matrix filter"}
            </button>
          )}
        </div>

        {/* The 3x3 Matrix Grid - fully responsive on all screens */}
        <div className="w-full overflow-x-auto no-scrollbar">
          <div className="min-w-[340px] sm:min-w-[480px] grid grid-cols-4 gap-1.5 sm:gap-2 text-center text-xs">
            {/* Header row */}
            <div className="p-2 font-mono text-[11px] font-bold text-slate-400 uppercase">
              {isAr ? "الاحتمالية \\ الشدة" : "Likelihood \\ Severity"}
            </div>
            <div className="p-2 font-bold text-amber-700 dark:text-amber-400 uppercase">
              {isAr ? "منخفض" : "Low"}
            </div>
            <div className="p-2 font-bold text-orange-700 dark:text-orange-400 uppercase">
              {isAr ? "متوسط" : "Medium"}
            </div>
            <div className="p-2 font-bold text-rose-700 dark:text-rose-400 uppercase">
              {isAr ? "حرج / عالي" : "Critical / High"}
            </div>

            {/* Rows */}
            {(["HIGH", "MEDIUM", "LOW"] as const).map((lik) => (
              <React.Fragment key={lik}>
                <div className="flex items-center justify-center p-2 font-bold text-slate-700 dark:text-slate-300">
                  {translateLik(lik)}
                </div>
                {(["LOW", "MEDIUM", "HIGH"] as const).map((sev) => {
                  const matching = risks.filter(
                    (r) =>
                      r.likelihood.toUpperCase() === lik &&
                      (sev === "HIGH"
                        ? r.severity.toUpperCase() === "HIGH" || r.severity.toUpperCase() === "CRITICAL"
                        : r.severity.toUpperCase() === sev)
                  );
                  const isSelected =
                    activeCell?.likelihood === lik && activeCell?.severity === (sev === "HIGH" ? "HIGH" : sev);

                  const bgCell =
                    lik === "HIGH" && sev === "HIGH"
                      ? "bg-rose-500/20 border-rose-500/40 text-rose-300"
                      : (lik === "HIGH" && sev === "MEDIUM") || (lik === "MEDIUM" && sev === "HIGH")
                      ? "bg-amber-500/20 border-amber-500/40 text-amber-300"
                      : "bg-slate-100/80 border-slate-200 dark:bg-slate-800/60 dark:border-slate-700 text-slate-700 dark:text-slate-300";

                  return (
                    <button
                      key={sev}
                      type="button"
                      onClick={() =>
                        setActiveCell(
                          isSelected ? null : { likelihood: lik, severity: sev === "HIGH" ? "HIGH" : sev }
                        )
                      }
                      className={`flex min-h-16 flex-col items-center justify-center rounded-xl border p-2 transition cursor-pointer ${bgCell} ${
                        isSelected ? "ring-2 ring-indigo-500 shadow-md" : "hover:opacity-85"
                      }`}
                    >
                      <span className="text-lg font-extrabold">{matching.length}</span>
                      <span className="text-[10px] uppercase font-semibold">
                        {isAr ? "مخاطر" : matching.length === 1 ? "Risk" : "Risks"}
                      </span>
                    </button>
                  );
                })}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

      {/* Filter and Sort Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {(["ALL", "CRITICAL", "HIGH", "MEDIUM", "LOW"] as const).map((sev) => {
            const count =
              sev === "ALL"
                ? risks.length
                : risks.filter((r) => r.severity.toUpperCase() === sev).length;
            const isSelected = filterSeverity === sev;

            return (
              <button
                key={sev}
                type="button"
                onClick={() => setFilterSeverity(sev)}
                className={`rounded-xl px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                  isSelected
                    ? "bg-slate-900 text-white dark:bg-indigo-600 shadow-xs"
                    : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
                }`}
              >
                <span>{sev === "ALL" ? (isAr ? "جميع المستويات" : "All Severities") : translateSev(sev)}</span>
                <span className="ms-1 text-[10px] opacity-75">({count})</span>
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-3 text-xs">
          <span className="text-slate-500">
            {isAr ? "تم التحقق:" : "Verified:"} <strong className="text-emerald-600 dark:text-emerald-400">{acknowledgedCount}</strong> / {risks.length}
          </span>

          <button
            type="button"
            onClick={toggleSort}
            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1 text-slate-700 hover:bg-slate-100 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <ArrowUpDown className="h-3 w-3" />
            <span>{isAr ? `الترتيب: ${sortBy === "severity" ? "الشدة" : "الاحتمالية"}` : `Sort: ${sortBy}`}</span>
          </button>
        </div>
      </div>

      {/* Risk Cards Deck */}
      <div className="space-y-4">
        {filteredRisks.map((risk, idx) => {
          const isCritical = risk.severity.toUpperCase() === "CRITICAL";
          const isHigh = risk.severity.toUpperCase() === "HIGH";

          return (
            <div
              key={idx}
              className={`rounded-2xl border p-5 shadow-sm transition-all ${
                risk.acknowledged
                  ? "border-emerald-200 bg-emerald-50/20 dark:border-emerald-950 dark:bg-emerald-950/10"
                  : isCritical
                  ? "border-rose-300 bg-white hover:border-rose-500 dark:border-rose-900 dark:bg-slate-900"
                  : isHigh
                  ? "border-amber-300 bg-white hover:border-amber-500 dark:border-amber-900 dark:bg-slate-900"
                  : "border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
              }`}
            >
              <div className="space-y-3">
                {/* Top: Severity & Likelihood Badges */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                        isCritical
                          ? "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
                          : isHigh
                          ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                          : "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300"
                      }`}
                    >
                      {isAr ? `الشدة: ${translateSev(risk.severity)}` : `Severity: ${risk.severity}`}
                    </span>

                    <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                      {isAr ? `الاحتمالية: ${translateLik(risk.likelihood)}` : `Likelihood: ${risk.likelihood}`}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => toggleAcknowledge(idx)}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold cursor-pointer text-slate-600 hover:text-emerald-600 dark:text-slate-400 dark:hover:text-emerald-400 transition"
                  >
                    {risk.acknowledged ? (
                      <>
                        <CheckSquare className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                        <span className="text-emerald-700 dark:text-emerald-300">{isAr ? "تم اعتماد التخفيف" : "Mitigation Verified"}</span>
                      </>
                    ) : (
                      <>
                        <Square className="h-4 w-4" />
                        <span>{isAr ? "اعتماد التخفيف" : "Verify Mitigation"}</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Risk Title & Affected Stakeholders */}
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white leading-snug">
                    {risk.title}
                  </h3>
                  <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      {isAr ? "أصحاب المصلحة المتأثرون:" : "Affected Stakeholders:"}
                    </span>
                    {risk.affected_stakeholders.map((sh) => (
                      <span
                        key={sh}
                        className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                      >
                        {translateStakeholder(sh)}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Explicit Mitigation Strategy Card */}
                <div className="rounded-xl border border-indigo-100 bg-indigo-50/60 p-3.5 text-xs text-indigo-950 dark:border-indigo-900/40 dark:bg-indigo-950/30 dark:text-indigo-200 space-y-1">
                  <span className="block font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-300 text-[10px]">
                    {isAr ? "بروتوكول التخفيف البشري المعتمد" : "Prescribed Human Mitigation Protocol"}
                  </span>
                  <p className="leading-relaxed">{risk.mitigation_strategy}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
