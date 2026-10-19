"use client";

import React, { useEffect, useState, use } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowRight,
  ShieldCheck,
  CheckSquare,
  Square,
  Download,
  ArrowUpDown,
} from "lucide-react";
import { getSimulationResult } from "@/lib/api";
import { saveLocalSimulationResult } from "@/lib/mock-data";
import { DecisionNavTabs } from "@/components/DecisionNavTabs";
import { RiskItem, SimulationResult } from "@/types/decision";
import { toast } from "sonner";

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

  const [result, setResult] = useState<SimulationResult | null>(null);
  const [risks, setRisks] = useState<RiskItem[]>([]);
  const [filterSeverity, setFilterSeverity] = useState<string>("ALL");
  const searchParams = useSearchParams();
  const initialSort = searchParams.get("sort") === "likelihood" ? "likelihood" : "severity";
  const [sortBy, setSortBy] = useState<"severity" | "likelihood">(initialSort);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSimulationResult(Number(decisionId))
      .then((data) => {
        setResult(data);
        setRisks(data.risks || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [decisionId]);

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

    if (result) {
      const updatedResult = {
        ...result,
        risks: updated,
      };
      setResult(updatedResult);
      saveLocalSimulationResult(Number(decisionId), updatedResult);
    }
  };

  const acknowledgedCount = risks.filter((r) => r.acknowledged).length;

  const sortedAndFilteredRisks = React.useMemo(() => {
    return risks
      .filter((r) => {
        if (filterSeverity === "ALL") return true;
        return r.severity.toUpperCase() === filterSeverity;
      })
      .sort((a, b) => {
        if (sortBy === "severity") {
          return (SEVERITY_ORDER[b.severity] || 0) - (SEVERITY_ORDER[a.severity] || 0);
        } else {
          return (LIKELIHOOD_ORDER[b.likelihood] || 0) - (LIKELIHOOD_ORDER[a.likelihood] || 0);
        }
      });
  }, [risks, filterSeverity, sortBy]);

  const handleExportRisks = () => {
    const csvContent = [
      "Title,Severity,Likelihood,Affected Stakeholders,Mitigation Strategy,Status",
      ...risks.map(
        (r) =>
          `"${r.title}","${r.severity}","${r.likelihood}","${r.affected_stakeholders.join("; ")}","${r.mitigation_strategy}","${r.acknowledged ? "ACKNOWLEDGED" : "PENDING"}"`
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `decision-${decisionId}-risk-register.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Risk register exported", { description: "CSV file downloaded." });
  };

  if (loading || !result) {
    return (
      <div className="space-y-4">
        <DecisionNavTabs decisionId={decisionId} />
        <div className="h-72 animate-pulse rounded-2xl border border-slate-200 bg-slate-100 dark:border-slate-800 dark:bg-slate-900" />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-5">
      <DecisionNavTabs decisionId={decisionId} />

      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
            Step 4 of Decision Analysis
          </span>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-2xl">
            Decision Risk Register
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Audit-ready risk evaluation, severity modeling, and actionable operational countermeasures.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExportRisks}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 transition cursor-pointer"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export Register</span>
          </button>

          <Link
            href={`/decisions/${decisionId}/recommendation`}
            className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-indigo-500 transition shadow-xs"
          >
            <span>Recommendation</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>

      {/* Audit stats banner & Sort/Filter Controls */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-xl border border-slate-200 bg-white p-3.5 text-xs dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center gap-2.5">
          <div className="rounded-lg bg-indigo-50 p-1.5 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
            <ShieldCheck className="h-4 w-4" />
          </div>
          <div>
            <div className="font-bold text-slate-900 dark:text-white">
              Risk Review
            </div>
            <div className="text-[11px] text-slate-500">
              {acknowledgedCount} of {risks.length} critical risks formally acknowledged.
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Sort By Toggle */}
          <button
            type="button"
            onClick={toggleSort}
            aria-label={`Sort risks by ${sortBy === "severity" ? "likelihood" : "severity"}`}
            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2 py-1 text-[11px] font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-300 cursor-pointer"
          >
            <ArrowUpDown className="h-3 w-3" />
            <span>Sort: {sortBy === "severity" ? "Severity" : "Likelihood"}</span>
          </button>

          {/* Severity Filter */}
          <div className="flex items-center gap-1">
            {["ALL", "CRITICAL", "HIGH", "MEDIUM"].map((sev) => (
              <button
                key={sev}
                onClick={() => setFilterSeverity(sev)}
                className={`rounded-lg px-2 py-1 text-[11px] font-semibold transition cursor-pointer ${
                  filterSeverity === sev
                    ? "bg-slate-900 text-white dark:bg-indigo-600"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400"
                }`}
              >
                {sev}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Risk Register Table / Cards */}
      <div className="space-y-3">
        {sortedAndFilteredRisks.map((risk, idx) => {
          const isCritical = risk.severity === "CRITICAL";
          const isHigh = risk.severity === "HIGH";

          return (
            <div
              key={idx}
              className={`rounded-xl border p-4 transition-all ${
                risk.acknowledged
                  ? "border-emerald-300 bg-emerald-50/20 dark:border-emerald-900/50 dark:bg-emerald-950/10"
                  : isCritical
                  ? "border-rose-200 bg-white dark:border-rose-950 dark:bg-slate-900"
                  : "border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
              }`}
            >
              <div className="flex items-start gap-3">
                <button
                  type="button"
                  onClick={() => toggleAcknowledge(idx)}
                  className="mt-0.5 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition cursor-pointer"
                  title={
                    risk.acknowledged
                      ? "Mark unacknowledged"
                      : "Acknowledge risk for audit tracking"
                  }
                >
                  {risk.acknowledged ? (
                    <CheckSquare className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  ) : (
                    <Square className="h-4 w-4" />
                  )}
                </button>

                <div className="space-y-1 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-full px-2 py-0.2 text-[9px] font-bold uppercase tracking-wider ${
                        isCritical
                          ? "bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300"
                          : isHigh
                          ? "bg-orange-100 text-orange-800 dark:bg-orange-950/60 dark:text-orange-300"
                          : "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
                      }`}
                    >
                      {risk.severity}
                    </span>

                    <span className="rounded-full bg-slate-100 px-2 py-0.2 text-[9px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                      Likelihood: {risk.likelihood}
                    </span>

                    {risk.acknowledged && (
                      <span className="rounded-full bg-emerald-100 px-2 py-0.2 text-[9px] font-semibold text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                        ✓ Acknowledged
                      </span>
                    )}
                  </div>

                  <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                    {risk.title}
                  </h3>

                  <div className="text-[10px] text-slate-400 flex items-center gap-1">
                    <span>Affected:</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      {risk.affected_stakeholders.join(", ")}
                    </span>
                  </div>
                </div>
              </div>

              {/* Mitigation Box */}
              <div className="mt-3 rounded-lg border border-slate-100 bg-slate-50/80 p-2.5 text-xs dark:border-slate-800 dark:bg-slate-800/50">
                <div className="flex items-center gap-1 font-bold text-slate-700 dark:text-slate-300 mb-0.5 text-[10px] uppercase tracking-wider">
                  <ShieldCheck className="h-3 w-3 text-indigo-600 dark:text-indigo-400" />
                  <span>Proposed Mitigation Strategy</span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                  {risk.mitigation_strategy}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
