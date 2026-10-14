"use client";

import React, { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  CheckCircle2,
  Loader2,
  Compass,
  FastForward,
  XCircle,
} from "lucide-react";
import { runSimulation } from "@/lib/api";

const STEPS = [
  {
    id: 1,
    title: "Parsing Institutional Context & Baseline Data",
    desc: "Ingesting student enrollment, lab constraints, and commuter transit profiles.",
  },
  {
    id: 2,
    title: "Mapping 5 Affected Stakeholder Groups",
    desc: "Evaluating students, instructional faculty, wet laboratories, administration, and transportation.",
  },
  {
    id: 3,
    title: "Simulating 3 Comparative Policy Scenarios",
    desc: "Generating direct compression, lab exemption hybrid, and single-faculty pilot models.",
  },
  {
    id: 4,
    title: "Synthesizing Risk Register & Explainable Recommendation",
    desc: "Calculating feasibility ratings, confidence score (82%), and governance disclaimers.",
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

  useEffect(() => {
    let cancelled = false;
    runSimulation(Number(decisionId)).catch(() => null);

    const t1 = setTimeout(() => {
      if (!cancelled) setActiveStep(2);
    }, 600);
    const t2 = setTimeout(() => {
      if (!cancelled) setActiveStep(3);
    }, 1400);
    const t3 = setTimeout(() => {
      if (!cancelled) setActiveStep(4);
    }, 2200);
    const t4 = setTimeout(() => {
      if (!cancelled) {
        setComplete(true);
        const redirectTimer = setTimeout(() => {
          if (!cancelled) router.push(`/decisions/${decisionId}/scenarios`);
        }, 800);
        return () => clearTimeout(redirectTimer);
      }
    }, 3000);

    return () => {
      cancelled = true;
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, [decisionId, router]);

  return (
    <div className="max-w-2xl mx-auto py-2 sm:py-4 space-y-4 sm:space-y-6">
      {/* Simulation Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
          <Compass className="h-5 w-5 animate-spin text-indigo-600 dark:text-indigo-400" />
        </div>
        <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-2xl">
          Executing Policy Impact Simulation
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Decision Reference:{" "}
          <span className="font-mono font-semibold">D-{String(decisionId).padStart(4, "0")}</span>
        </p>
      </div>

      {/* Stepper Card */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-4">
        <div className="space-y-4">
          {STEPS.map((step) => {
            const isDone = activeStep > step.id || complete;
            const isCurrent = activeStep === step.id && !complete;

            return (
              <div key={step.id} className="flex items-start gap-3.5">
                <div className="mt-0.5 shrink-0">
                  {isDone ? (
                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-white shadow-xs">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                    </div>
                  ) : isCurrent ? (
                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-white shadow-xs">
                      <Loader2 className="h-3 w-3 animate-spin" />
                    </div>
                  ) : (
                    <div className="flex h-5 w-5 items-center justify-center rounded-full border border-slate-300 text-[10px] font-bold text-slate-400 dark:border-slate-700">
                      {step.id}
                    </div>
                  )}
                </div>

                <div className="flex-1 space-y-0.5">
                  <div className="flex items-center justify-between">
                    <h3
                      className={`text-xs font-bold ${
                        isDone
                          ? "text-slate-900 dark:text-white"
                          : isCurrent
                          ? "text-indigo-600 dark:text-indigo-400"
                          : "text-slate-400 dark:text-slate-500"
                      }`}
                    >
                      {step.title}
                    </h3>
                    <span
                      className={`text-[10px] font-semibold uppercase tracking-wider ${
                        isDone
                          ? "text-emerald-600 dark:text-emerald-400"
                          : isCurrent
                          ? "text-indigo-600 dark:text-indigo-400"
                          : "text-slate-400"
                      }`}
                    >
                      {isDone ? "Done" : isCurrent ? "Processing" : "Pending"}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {step.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Progress bar */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
            <div
              className="h-full bg-indigo-600 transition-all duration-500"
              style={{
                width: complete
                  ? "100%"
                  : activeStep === 1
                  ? "25%"
                  : activeStep === 2
                  ? "50%"
                  : activeStep === 3
                  ? "75%"
                  : "90%",
              }}
            />
          </div>
        </div>

        {/* Action controls */}
        <div className="flex items-center justify-between pt-2">
          <Link
            href={`/decisions/${decisionId}/context`}
            className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
          >
            <XCircle className="h-3.5 w-3.5" />
            <span>Cancel Simulation</span>
          </Link>

          <button
            onClick={() => router.push(`/decisions/${decisionId}/scenarios`)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-slate-800 dark:bg-indigo-600 dark:hover:bg-indigo-500 transition cursor-pointer"
          >
            <FastForward className="h-3.5 w-3.5" />
            <span>Skip to Results</span>
          </button>
        </div>
      </div>
    </div>
  );
}
