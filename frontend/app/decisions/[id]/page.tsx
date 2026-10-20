"use client";

import React, { use, useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  CircleAlert,
  FileCode2,
  GitCompare,
  Users2,
  ShieldAlert,
  Award,
  FileText,
  Building,
  Sparkles,
  Download,
} from "lucide-react";
import { getDecision, getReport } from "@/lib/api";
import { Decision } from "@/types/decision";
import { DecisionNavTabs } from "@/components/DecisionNavTabs";
import { toast } from "sonner";

export default function DecisionDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [decision, setDecision] = useState<Decision | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    getDecision(Number(id))
      .then((data) => {
        if (active) setDecision(data);
      })
      .catch((cause) => {
        if (active) setError(cause instanceof Error ? cause.message : "Could not load this decision.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [id]);

  const handleDownloadMemo = async () => {
    if (!decision) return;
    try {
      const rep = await getReport(decision.id);
      const blob = new Blob([rep.content_markdown], { type: "text/markdown" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = rep.filename;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Board Memorandum downloaded");
    } catch {
      toast.error("Failed to download memorandum");
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-12 w-full animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800" />
        <div className="h-64 animate-pulse rounded-2xl border border-slate-200 bg-slate-100 dark:border-slate-800 dark:bg-slate-900" />
      </div>
    );
  }

  if (error || !decision) {
    return (
      <section
        className="mx-auto max-w-2xl rounded-2xl border border-rose-200 bg-white p-6 text-center dark:border-rose-900 dark:bg-slate-900"
        role="alert"
      >
        <CircleAlert className="mx-auto h-8 w-8 text-rose-600" />
        <h1 className="mt-3 text-lg font-bold text-slate-900 dark:text-white">Decision unavailable</h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          {error ?? "This proposal may have been archived or is unavailable."}
        </p>
        <Link
          href="/decisions"
          className="mt-4 inline-flex min-h-10 items-center rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white dark:bg-indigo-600"
        >
          Return to proposals
        </Link>
      </section>
    );
  }

  const isCompleted = decision.status === "COMPLETED";

  const workflowStages = [
    {
      num: "01",
      name: "Operational Context",
      desc: "Enrollment numbers, active laboratories, transit rates, and institutional constraints.",
      href: `/decisions/${id}/context`,
      icon: FileCode2,
      status: decision.context_attached ? "Completed" : "Pending Input",
      ready: true,
    },
    {
      num: "02",
      name: "Comparative Scenarios",
      desc: "3 pathways: As Written, Modified Lab Protection (Recommended), and Limited Pilot.",
      href: `/decisions/${id}/scenarios`,
      icon: GitCompare,
      status: isCompleted ? "Generated" : "Pending Simulation",
      ready: isCompleted,
    },
    {
      num: "03",
      name: "Stakeholder Ripples",
      desc: "Cascading impact mapping across Students, Faculty, Labs, Admin, and Transit.",
      href: `/decisions/${id}/consequences`,
      icon: Users2,
      status: isCompleted ? "5 Groups Mapped" : "Pending",
      ready: isCompleted,
    },
    {
      num: "04",
      name: "Risk Register Matrix",
      desc: "3x3 Likelihood vs Severity matrix with explicit human review mitigations.",
      href: `/decisions/${id}/risks`,
      icon: ShieldAlert,
      status: isCompleted ? "Calibrated" : "Pending",
      ready: isCompleted,
    },
    {
      num: "05",
      name: "Strategic Recommendation",
      desc: "Synthesized executive recommendation with confidence score and AI refinement.",
      href: `/decisions/${id}/recommendation`,
      icon: Award,
      status: isCompleted ? "Ready for Sign-Off" : "Pending",
      ready: isCompleted,
    },
    {
      num: "06",
      name: "Decision Memorandum",
      desc: "Audit-ready memorandum exportable to Microsoft Word (.docx) and Markdown.",
      href: `/decisions/${id}/report`,
      icon: FileText,
      status: isCompleted ? "Audit-Ready" : "Pending",
      ready: isCompleted,
    },
  ];

  return (
    <div className="space-y-6">
      {/* 6-Stage Workflow Navigation Bar */}
      <DecisionNavTabs decisionId={id} />

      {/* Main Executive Summary Header */}
      <header className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold text-slate-500">
              PROPOSAL #{String(decision.id).padStart(4, "0")}
            </span>
            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider text-slate-700 dark:bg-slate-800 dark:text-slate-300">
              {decision.priority} PRIORITY
            </span>
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider ${
                isCompleted
                  ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                  : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
              }`}
            >
              {isCompleted && <Sparkles className="h-3 w-3" />}
              {decision.status}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDownloadMemo}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 transition"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Export Memo</span>
            </button>

            <Link
              href={isCompleted ? `/decisions/${id}/scenarios` : `/decisions/${id}/context`}
              className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-indigo-600/20 hover:bg-indigo-500 transition"
            >
              <span>{isCompleted ? "Open Scenarios Matrix" : "Add Context"}</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>

        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
            {decision.title}
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300 max-w-3xl">
            {decision.description}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-1.5">
            <Building className="h-3.5 w-3.5 text-indigo-500" />
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              Department: {decision.department || "Operations"}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <CalendarDays className="h-3.5 w-3.5 text-indigo-500" />
            <span>Horizon: {decision.time_horizon || "1 year"}</span>
          </div>
          <div>Created: {new Date(decision.created_at).toLocaleDateString()}</div>
        </div>
      </header>

      {/* 6-Stage Lifecycle Hub Cards */}
      <section className="space-y-3">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">
          Decision Analysis Lifecycle Hub
        </h2>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {workflowStages.map((stage) => {
            const Icon = stage.icon;
            return (
              <Link
                key={stage.num}
                href={stage.href}
                className="group flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:border-indigo-500/50 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 transition-all"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white transition">
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="font-mono text-xs font-bold text-slate-400">
                      STAGE {stage.num}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition">
                      {stage.name}
                    </h3>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                      {stage.desc}
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 dark:border-slate-800 text-xs">
                  <span className="font-semibold text-slate-600 dark:text-slate-300">
                    {stage.status}
                  </span>
                  <span className="inline-flex items-center gap-1 font-bold text-indigo-600 dark:text-indigo-400 group-hover:translate-x-0.5 transition-transform">
                    <span>Inspect</span>
                    <ArrowRight className="h-3 w-3" />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
