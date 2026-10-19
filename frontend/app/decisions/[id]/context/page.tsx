"use client";

import React, { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
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
import { readSavedOrganizationContext } from "@/lib/organization";
import { useAuth } from "@/components/AuthProvider";

export default function DecisionContextPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const decisionId = resolvedParams.id;
  const router = useRouter();
  const { activeOrganizationId } = useAuth();

  const [decision, setDecision] = useState<Decision | null>(null);
  const [studentPopulation, setStudentPopulation] = useState("");
  const [facultyCount, setFacultyCount] = useState("");
  const [activeLaboratories, setActiveLaboratories] = useState("");
  const [transitRate, setTransitRate] = useState("");
  const [assumptions, setAssumptions] = useState<string>([
    "Critical services need uninterrupted coverage during implementation",
    "The change should be reviewed with affected teams before organization-wide rollout",
    "Success will be measured against the agreed operational goals",
  ].join("\n"));
  const [constraints, setConstraints] = useState(
    "Describe legal, operational, budget, staffing, timeline, or service constraints that must be respected."
  );

  const [loading, setLoading] = useState(false);
  const [savingOnly, setSavingOnly] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getDecision(Number(decisionId)).then(setDecision).catch(() => null);
  }, [decisionId]);

  const handleLoadDemoProfile = () => {
    setStudentPopulation(String(DEMO_CONTEXT.student_population ?? ""));
    setFacultyCount(String(DEMO_CONTEXT.faculty_count ?? ""));
    setActiveLaboratories(String(DEMO_CONTEXT.active_laboratories ?? ""));
    setTransitRate(String(DEMO_CONTEXT.transit_dependency_rate ?? ""));
    setAssumptions(DEMO_CONTEXT.key_assumptions.join("\n"));
    setConstraints(DEMO_CONTEXT.constraints ?? "");
    toast.success("Education example loaded", { description: "This sample uses optional education-specific baseline fields. Review or clear them before continuing." });
  };

  const saveContextPayload = async () => {
    const parsedAssumptions = assumptions
      .split("\n")
      .map((a) => a.trim())
      .filter((a) => a.length > 0);
    const organization = readSavedOrganizationContext(activeOrganizationId);
    const organizationMetadata = organization ? Object.fromEntries(
      Object.entries({
        organization_name: organization.name,
        organization_type: organization.kind,
        industry: organization.industry,
        country: organization.country,
        description: organization.description,
        goals: organization.goals,
        operating_context: organization.context,
        website: organization.website,
      }).filter(([, value]) => typeof value === "string" && value.trim().length > 0)
    ) : undefined;

    return attachDecisionContext(Number(decisionId), {
      ...(studentPopulation ? { student_population: Number(studentPopulation) } : {}),
      ...(facultyCount ? { faculty_count: Number(facultyCount) } : {}),
      ...(activeLaboratories ? { active_laboratories: Number(activeLaboratories) } : {}),
      ...(transitRate ? { transit_dependency_rate: Number(transitRate) } : {}),
      key_assumptions: parsedAssumptions,
      constraints,
      ...(organizationMetadata ? { raw_metadata: organizationMetadata } : {}),
    });
  };

  const handleSaveOnly = async () => {
    setSavingOnly(true);
    setError(null);
    try {
      await saveContextPayload();
      toast.success("Context saved", { description: "Demo mode stores the context in this browser." });
    } catch {
      setError("Could not save the context. Check the entered values and try again.");
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
      setError("Could not save the context. Check the entered values and try again.");
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <DecisionNavTabs decisionId={decisionId} />

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
            <span>Load education example</span>
        </button>
      </div>

      {/* Decision Summary Context Bar */}
      {decision && (
        <div className="rounded-xl border border-slate-200 bg-white p-3.5 text-xs dark:border-slate-800 dark:bg-slate-900 flex items-center justify-between">
          <div>
            <span className="font-semibold text-slate-400 uppercase tracking-wider text-[10px] block">
              Decision:
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

          <div className="rounded-xl border border-indigo-100 bg-indigo-50/70 p-4 text-sm leading-6 text-indigo-950 dark:border-indigo-950 dark:bg-indigo-950/30 dark:text-indigo-100">
            Add assumptions and constraints that apply to your organization. The saved organization details are included with this decision through the API&apos;s context metadata field; they are not saved as a reusable server-side organization profile. Optional education-specific baseline fields can be left blank for other organizations.
          </div>

          <details className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
            <summary className="cursor-pointer text-sm font-semibold text-slate-800 dark:text-slate-200">Optional education-specific baseline metrics</summary>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-3 dark:border-slate-800 dark:bg-slate-800/50">
              <label htmlFor="student-population" className="text-xs font-semibold text-slate-700 dark:text-slate-300">Student population</label>
              <input id="student-population" type="number" min={1} value={studentPopulation} onChange={(e) => setStudentPopulation(e.target.value)} className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-sm font-bold text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white" />
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-3 dark:border-slate-800 dark:bg-slate-800/50">
              <label htmlFor="faculty-count" className="text-xs font-semibold text-slate-700 dark:text-slate-300">Faculty count</label>
              <input id="faculty-count" type="number" min={1} value={facultyCount} onChange={(e) => setFacultyCount(e.target.value)} className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-sm font-bold text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white" />
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-3 dark:border-slate-800 dark:bg-slate-800/50">
              <label htmlFor="active-labs" className="text-xs font-semibold text-slate-700 dark:text-slate-300">Active laboratories</label>
              <input id="active-labs" type="number" min={0} value={activeLaboratories} onChange={(e) => setActiveLaboratories(e.target.value)} className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-sm font-bold text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white" />
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-3 dark:border-slate-800 dark:bg-slate-800/50">
              <label htmlFor="transit-rate" className="text-xs font-semibold text-slate-700 dark:text-slate-300">Transit dependency (%)</label>
              <input id="transit-rate" type="number" step="0.1" min={0} max={100} value={transitRate} onChange={(e) => setTransitRate(e.target.value)} className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-sm font-bold text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white" />
            </div>
          </div>
          </details>

          {/* Key Assumptions */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
              Key assumptions (one per line)
            </label>
            <textarea
              rows={3}
              value={assumptions}
              onChange={(e) => setAssumptions(e.target.value)}
              placeholder="e.g. Existing customer support hours must remain available during the transition"
              className="w-full rounded-xl border border-slate-300 bg-slate-50/50 p-3 text-xs text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white font-mono"
            />
          </div>

          {/* Operational Constraints */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
              Operational constraints
            </label>
            <textarea
              rows={2}
              value={constraints}
              onChange={(e) => setConstraints(e.target.value)}
              placeholder="e.g. Regulatory requirements, team capacity, service coverage, or fixed budget limits"
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
