"use client";

import React, { useEffect, useRef, useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  CheckCircle2,
  Loader2,
  Compass,
  XCircle,
  RotateCcw,
  Sparkles,
  ArrowRight,
  Cpu,
  GraduationCap,
  GitCompare,
  AlertTriangle,
} from "lucide-react";
import { getAnalysisStatus, retryFailedAnalysis, runSimulation } from "@/lib/api";
import type { AnalysisStatus, SimulateResponse } from "@/types/decision";
import { DecisionNavTabs } from "@/components/DecisionNavTabs";

const SIMULATION_STAGES = [
  {
    id: 1,
    title: "1. Ingesting Institutional Context & Constraints",
    desc: "Validating headcount parameters, active laboratory thermal requirements, and weekly transit loads.",
    icon: Cpu,
  },
  {
    id: 2,
    title: "2. Mapping 5 Core Stakeholder Constituencies",
    desc: "Tracing direct and secondary lines of impact for Students, Faculty, Laboratories, Administration, and Transit.",
    icon: GraduationCap,
  },
  {
    id: 3,
    title: "3. Generating 3 Comparative Scenario Pathways",
    desc: "Formulating Scenario 1 (As Written), Scenario 2 (Lab Protection - Recommended), and Scenario 3 (Limited Pilot).",
    icon: GitCompare,
  },
  {
    id: 4,
    title: "4. Calibrating Risk Register & Explaining Trade-offs",
    desc: "Computing heat scores on a 3x3 Likelihood/Severity matrix and establishing verifiable mitigation strategies.",
    icon: AlertTriangle,
  },
  {
    id: 5,
    title: "5. Synthesizing Strategic Recommendation & Memorandum",
    desc: "Synthesizing executive recommendation, calculating heuristic confidence rating, and drafting board memorandum.",
    icon: Sparkles,
  },
];

export default function AnalysisProgressPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const decisionId = resolvedParams.id;
  const router = useRouter();

  const [activeStep, setActiveStep] = useState(1);
  const [complete, setComplete] = useState(false);
  const [error, setError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("Analysis could not be completed. Please retry.");
  const [attempt, setAttempt] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const jobs = useRef(new Map<number, Promise<AnalysisStatus | SimulateResponse>>());

  // Elapsed timer ticker
  useEffect(() => {
    if (complete || error) return;
    const interval = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [complete, error]);

  useEffect(() => {
    let cancelled = false;
    let redirectTimer: ReturnType<typeof setTimeout> | undefined;

    const t1 = setTimeout(() => {
      if (!cancelled) setActiveStep(2);
    }, 800);
    const t2 = setTimeout(() => {
      if (!cancelled) setActiveStep(3);
    }, 1600);
    const t3 = setTimeout(() => {
      if (!cancelled) setActiveStep(4);
    }, 2400);
    const t4 = setTimeout(() => {
      if (!cancelled) setActiveStep(5);
    }, 3200);

    let job = jobs.current.get(attempt);
    if (!job) {
      job = (async () => {
        let currentStatus = await getAnalysisStatus(Number(decisionId));
        if (currentStatus.analysis_status === "completed") return currentStatus;
        if (currentStatus.analysis_status === "failed" && attempt === 0) {
          throw new Error("The previous analysis run failed. Click Retry to run again.");
        }
        if (currentStatus.analysis_status === "failed") {
          return retryFailedAnalysis(Number(decisionId));
        }
        if (currentStatus.analysis_status === "running") {
          const deadline = Date.now() + 115_000;
          while (currentStatus.analysis_status === "running" && Date.now() < deadline) {
            await new Promise((resolve) => setTimeout(resolve, 1_000));
            currentStatus = await getAnalysisStatus(Number(decisionId));
          }
          if (currentStatus.analysis_status === "completed") return currentStatus;
          if (currentStatus.analysis_status === "failed") {
            if (attempt === 0) throw new Error("The previous analysis failed. Click Retry.");
            return retryFailedAnalysis(Number(decisionId));
          }
          throw new Error("Analysis is taking longer than expected. You can check back shortly.");
        }
        return runSimulation(Number(decisionId));
      })();
      jobs.current.set(attempt, job);
    }

    job
      .then(() => {
        if (cancelled) return;
        setComplete(true);
        setActiveStep(5);
        redirectTimer = setTimeout(() => {
          if (!cancelled) router.push(`/decisions/${decisionId}/scenarios`);
        }, 1200);
      })
      .catch((cause) => {
        if (!cancelled) {
          setError(true);
          setErrorMessage(cause instanceof Error ? cause.message : "Analysis failed. Please retry.");
        }
      });

    return () => {
      cancelled = true;
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
      if (redirectTimer) clearTimeout(redirectTimer);
    };
  }, [decisionId, router, attempt]);

  const progressPercent = complete
    ? 100
    : activeStep === 1
    ? 20
    : activeStep === 2
    ? 45
    : activeStep === 3
    ? 65
    : activeStep === 4
    ? 85
    : 95;

  return (
    <div className="space-y-6">
      <DecisionNavTabs decisionId={decisionId} />

      <div className="mx-auto max-w-3xl space-y-6">
        {/* Simulation Banner Header */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900 text-center space-y-3">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400 shadow-inner">
            <Compass className={`h-8 w-8 ${complete ? "text-emerald-500" : "animate-spin"}`} />
          </div>

          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
              {complete ? "Simulation Complete!" : "Running Decision Simulation"}
            </h1>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Proposal Reference: <span className="font-mono font-bold text-slate-700 dark:text-slate-300">D-{String(decisionId).padStart(4, "0")}</span>
            </p>
          </div>

          <div className="flex items-center justify-center gap-4 text-xs font-mono">
            <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
              Elapsed: {elapsedSeconds}s
            </span>
            <span className="rounded-full bg-indigo-50 px-3 py-1 font-bold text-indigo-700 dark:bg-indigo-950/80 dark:text-indigo-300">
              Progress: {progressPercent}%
            </span>
          </div>

          {/* Master Progress Bar */}
          <div className="pt-2 max-w-lg mx-auto">
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
              <div
                className={`h-full rounded-full transition-all duration-700 ${
                  complete ? "bg-emerald-500" : "bg-gradient-to-r from-indigo-500 to-indigo-600"
                }`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div
            role="alert"
            className="flex items-center justify-between gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-800 dark:border-rose-900 dark:bg-rose-950/50 dark:text-rose-200"
          >
            <span>{errorMessage}</span>
            <button
              type="button"
              onClick={() => {
                setError(false);
                setComplete(false);
                setActiveStep(1);
                setElapsedSeconds(0);
                setAttempt((c) => c + 1);
              }}
              className="inline-flex items-center gap-1.5 rounded-xl border border-rose-300 bg-white px-3 py-1.5 font-bold text-rose-800 hover:bg-rose-100 dark:border-rose-800 dark:bg-slate-900 dark:text-rose-300 transition"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Retry Simulation</span>
            </button>
          </div>
        )}

        {/* Stepper Card */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Multi-Phase Analytical Pipeline
            </h2>
            <span className="text-[11px] font-mono text-slate-400">
              {complete ? "All 5 phases verified" : `Phase ${activeStep} of 5 active`}
            </span>
          </div>

          <div className="space-y-4">
            {SIMULATION_STAGES.map((stage) => {
              const isDone = activeStep > stage.id || complete;
              const isCurrent = activeStep === stage.id && !complete;

              return (
                <div
                  key={stage.id}
                  className={`flex items-start gap-4 rounded-xl p-3.5 transition-all ${
                    isCurrent
                      ? "border border-indigo-200 bg-indigo-50/50 dark:border-indigo-900/60 dark:bg-indigo-950/20"
                      : isDone
                      ? "border border-transparent bg-slate-50/60 dark:bg-slate-800/40"
                      : "opacity-40"
                  }`}
                >
                  <div className="mt-0.5 shrink-0">
                    {isDone ? (
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-white shadow-xs">
                        <CheckCircle2 className="h-4 w-4" />
                      </span>
                    ) : isCurrent ? (
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600 text-white shadow-md shadow-indigo-600/30">
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      </span>
                    ) : (
                      <span className="flex h-6 w-6 items-center justify-center rounded-full border border-slate-300 text-xs font-mono font-bold text-slate-400 dark:border-slate-700">
                        {stage.id}
                      </span>
                    )}
                  </div>

                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <h3
                        className={`text-xs font-bold ${
                          isDone
                            ? "text-slate-900 dark:text-white"
                            : isCurrent
                            ? "text-indigo-600 dark:text-indigo-400"
                            : "text-slate-500"
                        }`}
                      >
                        {stage.title}
                      </h3>
                      <span
                        className={`text-[10px] font-mono font-bold uppercase tracking-wider ${
                          isDone
                            ? "text-emerald-600 dark:text-emerald-400"
                            : isCurrent
                            ? "text-indigo-600 dark:text-indigo-400"
                            : "text-slate-400"
                        }`}
                      >
                        {isDone ? "Done" : isCurrent ? "Computing" : "Queued"}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                      {stage.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <Link
              href={`/decisions/${decisionId}`}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            >
              <XCircle className="h-4 w-4" />
              <span>Cancel & return</span>
            </Link>

            {complete ? (
              <Link
                href={`/decisions/${decisionId}/scenarios`}
                className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-500 shadow-sm"
              >
                <span>Open Scenarios Matrix</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            ) : (
              <span className="text-[11px] text-slate-400 font-mono">
                Auto-redirecting upon completion...
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
