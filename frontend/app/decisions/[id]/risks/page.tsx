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
  ShieldAlert,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
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
  const [showMatrix, setShowMatrix] = useState(false);
  const [expandedRisks, setExpandedRisks] = useState<Record<number, boolean>>({});

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
        ? (isAr ? "تم اعتماد التخفيف" : "Mitigation verified")
        : (isAr ? "تمت إعادة ضبط الحالة" : "Mitigation status reset")
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
    toast.success(isAr ? "تم تصدير سجل المخاطر" : "Risk register exported to CSV");
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

  const sevBadgeClass = (sev: string) => {
    switch (sev.toUpperCase()) {
      case "CRITICAL":
        return "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300";
      case "HIGH":
        return "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300";
      case "MEDIUM":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-300";
      default:
        return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300";
    }
  };

  const sevAccent = (sev: string) => {
    switch (sev.toUpperCase()) {
      case "CRITICAL":
        return "border-s-rose-500";
      case "HIGH":
        return "border-s-amber-500";
      case "MEDIUM":
        return "border-s-yellow-500";
      default:
        return "border-s-slate-300 dark:border-s-slate-600";
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
          message={loadError ?? (isAr ? "نتائج المخاطر غير متاحة بعد." : "Risk analysis results are not available yet.")}
          onRetry={() => void loadResult()}
        />
      </div>
    );
  }

  const criticalCount = risks.filter((r) => r.severity.toUpperCase() === "CRITICAL").length;
  const highCount = risks.filter((r) => r.severity.toUpperCase() === "HIGH").length;

  return (
    <div className="space-y-5">
      <DecisionNavTabs decisionId={decisionId} />

      {/* ─── Compact Header ─── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
            {isAr ? "المرحلة 04 من تحليل القرار" : "Stage 04 of Decision Analysis"}
          </span>
          <h1 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-2xl">
            {isAr ? "سجل المخاطر المؤسسية" : "Institutional Risk Register"}
          </h1>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 max-w-xl leading-relaxed">
            {isAr
              ? "تحديد نقاط الضعف والمخاطر عبر المرافق والاعتماد والكوادر."
              : "Identifies vulnerabilities across facilities, accreditation, and staffing."}
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
            <span>{isAr ? "التوصية" : "Recommendation"}</span>
          </Link>
        </div>
      </div>

      {/* ─── Risk Summary KPIs + Collapsible Matrix ─── */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        {/* KPI Row */}
        <div className="flex flex-wrap items-center gap-4 mb-0">
          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-700 dark:bg-slate-800">
            <ShieldAlert className="h-4 w-4 text-slate-500" />
            <div className="text-xs">
              <span className="font-bold text-slate-900 dark:text-white text-base">{risks.length}</span>
              <span className="ms-1 text-slate-500">{isAr ? "إجمالي" : "Total"}</span>
            </div>
          </div>

          {criticalCount > 0 && (
            <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 dark:border-rose-900 dark:bg-rose-950/30">
              <AlertTriangle className="h-4 w-4 text-rose-600 dark:text-rose-400" />
              <div className="text-xs">
                <span className="font-bold text-rose-700 dark:text-rose-300 text-base">{criticalCount}</span>
                <span className="ms-1 text-rose-600 dark:text-rose-400">{isAr ? "حرج" : "Critical"}</span>
              </div>
            </div>
          )}

          {highCount > 0 && (
            <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 dark:border-amber-900 dark:bg-amber-950/30">
              <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              <div className="text-xs">
                <span className="font-bold text-amber-700 dark:text-amber-300 text-base">{highCount}</span>
                <span className="ms-1 text-amber-600 dark:text-amber-400">{isAr ? "عالي" : "High"}</span>
              </div>
            </div>
          )}

          <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 dark:border-emerald-900 dark:bg-emerald-950/30">
            <CheckSquare className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <div className="text-xs">
              <span className="font-bold text-emerald-700 dark:text-emerald-300 text-base">{acknowledgedCount}</span>
              <span className="ms-1 text-emerald-600 dark:text-emerald-400">
                / {risks.length} {isAr ? "تم التحقق" : "Verified"}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowMatrix(!showMatrix)}
            className="ms-auto inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 cursor-pointer"
          >
            <span>{showMatrix ? (isAr ? "إخفاء المصفوفة" : "Hide Matrix") : (isAr ? "مصفوفة المخاطر" : "Risk Matrix")}</span>
            {showMatrix ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </button>
        </div>

        {/* Collapsible 3x3 Matrix */}
        {showMatrix && (
          <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs font-bold text-slate-700 dark:text-slate-300">
                {isAr ? "مصفوفة 3×3 (الاحتمالية × الشدة)" : "3×3 Risk Matrix (Likelihood × Severity)"}
              </h2>
              {activeCell && (
                <button
                  type="button"
                  onClick={() => setActiveCell(null)}
                  className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                >
                  {isAr ? "إلغاء التصفية" : "Clear filter"}
                </button>
              )}
            </div>

            <div className="w-full overflow-x-auto no-scrollbar">
              <div className="min-w-[320px] grid grid-cols-4 gap-1.5 text-center text-xs">
                {/* Header */}
                <div className="p-1.5 font-mono text-[10px] font-bold text-slate-400 uppercase">
                  {isAr ? "الاحتمالية \\ الشدة" : "Lik \\ Sev"}
                </div>
                <div className="p-1.5 font-bold text-amber-600 dark:text-amber-400 uppercase text-[10px]">
                  {isAr ? "منخفض" : "Low"}
                </div>
                <div className="p-1.5 font-bold text-orange-600 dark:text-orange-400 uppercase text-[10px]">
                  {isAr ? "متوسط" : "Medium"}
                </div>
                <div className="p-1.5 font-bold text-rose-600 dark:text-rose-400 uppercase text-[10px]">
                  {isAr ? "حرج/عالي" : "Crit/High"}
                </div>

                {(["HIGH", "MEDIUM", "LOW"] as const).map((lik) => (
                  <React.Fragment key={lik}>
                    <div className="flex items-center justify-center p-1.5 font-bold text-xs text-slate-600 dark:text-slate-300">
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
                          ? "bg-rose-500/20 border-rose-500/40 text-rose-700 dark:text-rose-300"
                          : (lik === "HIGH" && sev === "MEDIUM") || (lik === "MEDIUM" && sev === "HIGH")
                          ? "bg-amber-500/20 border-amber-500/40 text-amber-700 dark:text-amber-300"
                          : "bg-slate-100/80 border-slate-200 dark:bg-slate-800/60 dark:border-slate-700 text-slate-600 dark:text-slate-300";

                      return (
                        <button
                          key={sev}
                          type="button"
                          onClick={() =>
                            setActiveCell(
                              isSelected ? null : { likelihood: lik, severity: sev === "HIGH" ? "HIGH" : sev }
                            )
                          }
                          className={`flex min-h-12 flex-col items-center justify-center rounded-lg border p-1.5 transition cursor-pointer ${bgCell} ${
                            isSelected ? "ring-2 ring-indigo-500 shadow-sm" : "hover:opacity-80"
                          }`}
                        >
                          <span className="text-base font-extrabold">{matching.length}</span>
                          <span className="text-[9px] uppercase font-semibold opacity-70">
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
        )}
      </div>

      {/* ─── Filter + Sort Toolbar ─── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-slate-200 bg-white p-2.5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
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
                <span>{sev === "ALL" ? (isAr ? "الكل" : "All") : translateSev(sev)}</span>
                <span className="ms-1 text-[10px] opacity-75">({count})</span>
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={toggleSort}
          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1 text-xs text-slate-700 hover:bg-slate-100 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800 transition cursor-pointer"
        >
          <ArrowUpDown className="h-3 w-3" />
          <span>{isAr ? `الترتيب: ${sortBy === "severity" ? "الشدة" : "الاحتمالية"}` : `Sort: ${sortBy}`}</span>
        </button>
      </div>

      {/* ─── Risk Cards ─── */}
      <div className="space-y-3">
        {filteredRisks.map((risk, idx) => {
          const isExpanded = Boolean(expandedRisks[idx]);

          return (
            <div
              key={idx}
              className={`rounded-2xl border border-s-4 ${sevAccent(risk.severity)} p-4 shadow-sm transition-all ${
                risk.acknowledged
                  ? "border-emerald-200 bg-emerald-50/20 dark:border-emerald-950 dark:bg-emerald-950/10"
                  : "border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
              }`}
            >
              {/* Top row: Badges + Acknowledge */}
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${sevBadgeClass(risk.severity)}`}>
                    {translateSev(risk.severity)}
                  </span>
                  <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                    {isAr ? `احتمالية: ${translateLik(risk.likelihood)}` : `Likelihood: ${risk.likelihood}`}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => toggleAcknowledge(idx)}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold cursor-pointer text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400 transition"
                >
                  {risk.acknowledged ? (
                    <>
                      <CheckSquare className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                      <span className="text-emerald-700 dark:text-emerald-300">{isAr ? "تم التحقق" : "Verified"}</span>
                    </>
                  ) : (
                    <>
                      <Square className="h-4 w-4" />
                      <span>{isAr ? "تحقق" : "Verify"}</span>
                    </>
                  )}
                </button>
              </div>

              {/* Title + Stakeholders */}
              <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-snug">
                {risk.title}
              </h3>
              <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-xs">
                {risk.affected_stakeholders.map((sh) => (
                  <span
                    key={sh}
                    className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                  >
                    {translateStakeholder(sh)}
                  </span>
                ))}
              </div>

              {/* Mitigation (expandable on mobile, always shown on desktop) */}
              <div className="mt-3">
                <button
                  type="button"
                  onClick={() => setExpandedRisks(prev => ({ ...prev, [idx]: !prev[idx] }))}
                  className="sm:hidden inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 cursor-pointer mb-1"
                >
                  {isExpanded ? (isAr ? "إخفاء التخفيف" : "Hide mitigation") : (isAr ? "خطة التخفيف" : "Mitigation plan")}
                  {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                </button>
                <div className={`rounded-xl border border-indigo-100 bg-indigo-50/60 p-3 text-xs text-indigo-950 dark:border-indigo-900/40 dark:bg-indigo-950/30 dark:text-indigo-200 ${isExpanded ? "" : "hidden sm:block"}`}>
                  <span className="block font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 text-[9px] mb-0.5">
                    {isAr ? "بروتوكول التخفيف" : "Mitigation Protocol"}
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
