"use client";

import React, { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Users,
  GraduationCap,
  FlaskConical,
  Bus,
  Sparkles,
  ArrowRight,
  Loader2,
  AlertCircle,
  Save,
  ArrowLeft,
} from "lucide-react";
import { attachDecisionContext, getDecision } from "@/lib/api";
import { DecisionNavTabs } from "@/components/DecisionNavTabs";
import { DEMO_CONTEXT } from "@/lib/mock-data";
import { Decision } from "@/types/decision";
import { toast } from "sonner";

export default function DecisionContextPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const decisionId = resolvedParams.id;
  const router = useRouter();

  const [decision, setDecision] = useState<Decision | null>(null);
  const [studentPopulation, setStudentPopulation] = useState(28000);
  const [facultyCount, setFacultyCount] = useState(1400);
  const [activeLaboratories, setActiveLaboratories] = useState(85);
  const [transitRate, setTransitRate] = useState(68.5);
  const [assumptions, setAssumptions] = useState<string>([
    "Fridays designated as asynchronous remote learning day",
    "Campus dining and auxiliary services operate on a reduced footprint on remote days",
    "Total accreditation contact hours per course remain unchanged via 15% longer class periods",
  ].join("\n"));
  const [constraints, setConstraints] = useState(
    "Wet laboratories, live animal research facilities, and biosafety level 2/3 labs require continuous daily temperature controls, monitoring, and researcher physical access."
  );

  const [loading, setLoading] = useState(false);
  const [savingOnly, setSavingOnly] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getDecision(Number(decisionId)).then(setDecision).catch(() => null);
  }, [decisionId]);

  const handleLoadDemoProfile = () => {
    setStudentPopulation(DEMO_CONTEXT.student_population);
    setFacultyCount(DEMO_CONTEXT.faculty_count);
    setActiveLaboratories(DEMO_CONTEXT.active_laboratories);
    setTransitRate(DEMO_CONTEXT.transit_dependency_rate);
    setAssumptions(DEMO_CONTEXT.key_assumptions.join("\n"));
    setConstraints(DEMO_CONTEXT.constraints);
    toast.success("University demo context loaded", { description: "This is sample data. Review it before continuing." });
  };

  const saveContextPayload = async () => {
    const parsedAssumptions = assumptions
      .split("\n")
      .map((a) => a.trim())
      .filter((a) => a.length > 0);

    return attachDecisionContext(Number(decisionId), {
      student_population: Number(studentPopulation),
      faculty_count: Number(facultyCount),
      active_laboratories: Number(activeLaboratories),
      transit_dependency_rate: Number(transitRate),
      key_assumptions: parsedAssumptions,
      constraints,
    });
  };

  const handleSaveOnly = async () => {
    setSavingOnly(true);
    setError(null);
    try {
      await saveContextPayload();
      toast.success("Context saved", { description: "Demo mode stores the context in this browser." });
    } catch {
      setError("Failed to attach institutional context.");
    } finally {
      setSavingOnly(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await saveContextPayload();
      router.push(`/decisions/${decisionId}/progress`);
    } catch {
      setError("Failed to attach institutional context. Please verify values.");
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <DecisionNavTabs decisionId={decisionId} />

      <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200">
        The numeric fields below match the university demo schema. General organization context is captured in assumptions and constraints until the backend supports organization-specific context fields.
      </p>

      {/* Page Title & Demo Preset */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
            Step 1 of Decision Analysis
          </span>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-2xl">
            Decision context
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Add operating details and assumptions to make the analysis more relevant.
          </p>
        </div>

        <button
          type="button"
          onClick={handleLoadDemoProfile}
          className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 dark:border-indigo-900 dark:bg-indigo-950/60 dark:text-indigo-300 transition cursor-pointer"
        >
          <Sparkles className="h-3.5 w-3.5" />
          <span>Load Demo Campus Data</span>
        </button>
      </div>

      {/* Decision Summary Context Bar */}
      {decision && (
        <div className="rounded-xl border border-slate-200 bg-white p-3.5 text-xs dark:border-slate-800 dark:bg-slate-900 flex items-center justify-between">
          <div>
            <span className="font-semibold text-slate-400 uppercase tracking-wider text-[10px] block">
              Target Policy Proposal:
            </span>
            <p className="font-bold text-slate-900 dark:text-white">
              {decision.title}
            </p>
          </div>
          <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-mono text-slate-600 dark:bg-slate-800 dark:text-slate-400">
            D-{String(decision.id).padStart(4, "0")}
          </span>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-4 sm:space-y-5">
          {error && (
            <div className="flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 dark:text-rose-400 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Metric input cards */}
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-3 dark:border-slate-800 dark:bg-slate-800/50">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                <Users className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>Student Body</span>
              </div>
              <input
                type="number"
                min={1}
                required
                value={studentPopulation}
                onChange={(e) => setStudentPopulation(Number(e.target.value))}
                className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs sm:text-sm font-bold text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              />
              <span className="mt-1 block text-[10px] text-slate-400">
                Total enrollment
              </span>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-3 dark:border-slate-800 dark:bg-slate-800/50">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                <GraduationCap className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>Faculty Members</span>
              </div>
              <input
                type="number"
                min={1}
                required
                value={facultyCount}
                onChange={(e) => setFacultyCount(Number(e.target.value))}
                className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs sm:text-sm font-bold text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              />
              <span className="mt-1 block text-[10px] text-slate-400">
                Instructional staff
              </span>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-3 dark:border-slate-800 dark:bg-slate-800/50">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                <FlaskConical className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>Active Labs</span>
              </div>
              <input
                type="number"
                min={0}
                required
                value={activeLaboratories}
                onChange={(e) => setActiveLaboratories(Number(e.target.value))}
                className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs sm:text-sm font-bold text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              />
              <span className="mt-1 block text-[10px] text-slate-400">
                Continuous wet labs
              </span>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-3 dark:border-slate-800 dark:bg-slate-800/50">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                <Bus className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>Transit %</span>
              </div>
              <input
                type="number"
                step="0.1"
                min={0}
                max={100}
                required
                value={transitRate}
                onChange={(e) => setTransitRate(Number(e.target.value))}
                className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs sm:text-sm font-bold text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              />
              <span className="mt-1 block text-[10px] text-slate-400">
                Commuter dependency
              </span>
            </div>
          </div>

          {/* Key Assumptions */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
              Key Policy Assumptions (One per line)
            </label>
            <textarea
              rows={3}
              value={assumptions}
              onChange={(e) => setAssumptions(e.target.value)}
              placeholder="e.g. Fridays designated as asynchronous remote learning day"
              className="w-full rounded-xl border border-slate-300 bg-slate-50/50 p-3 text-xs text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white font-mono"
            />
          </div>

          {/* Operational Constraints */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
              Hard Operational Constraints & Biosafety Regulations
            </label>
            <textarea
              rows={2}
              value={constraints}
              onChange={(e) => setConstraints(e.target.value)}
              placeholder="e.g. Wet laboratories, live animal facilities cannot be left unattended..."
              className="w-full rounded-xl border border-slate-300 bg-slate-50/50 p-3 text-xs text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-t border-slate-200 pt-4 dark:border-slate-800">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back to Dashboard</span>
            </Link>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSaveOnly}
                disabled={savingOnly || loading}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 cursor-pointer"
              >
                <Save className="h-3.5 w-3.5" />
                <span>{savingOnly ? "Attaching..." : "Attach Context Data"}</span>
              </button>

              <button
                type="submit"
                disabled={loading || savingOnly}
                className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-60 transition cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Launching...</span>
                  </>
                ) : (
                  <>
                    <span>Launch Impact Simulation</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
