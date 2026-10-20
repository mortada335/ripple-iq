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

const TIME_HORIZONS = [
  "1 month",
  "1 quarter",
  "1 year",
  "3 years",
  "5 years",
];

const DEPARTMENTS = [
  "Academic Affairs",
  "Campus Operations & Facilities",
  "Student Affairs & Wellbeing",
  "Research Administration",
  "Financial & Auxiliary Planning",
  "Human Resources",
];

export default function CreateDecisionPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [department, setDepartment] = useState("Academic Affairs");
  const [timeHorizon, setTimeHorizon] = useState(TIME_HORIZONS[2]);
  const [priority, setPriority] = useState<Priority>("HIGH");
  const [loading, setLoading] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePreFillDemo = () => {
    setTitle("Reduce in-person university attendance from five days to four days per week");
    setDescription(
      "Evaluate an institutional shift from a 5-day on-campus schedule to a condensed 4-day instructional week (Mon–Thu), with Friday designated for asynchronous digital learning, faculty research, and grading."
    );
    setDepartment("Academic Affairs");
    setTimeHorizon("1 year");
    setPriority("HIGH");
    setError(null);
    toast.success("University 4-Day Policy Proposal Pre-filled!", {
      description: "You can adjust any fields or continue to context calibration.",
    });
  };

  const handleSaveDraft = async () => {
    if (title.trim().length < 5) {
      setError("Please provide at least a short title (5+ characters) to save a draft.");
      return;
    }
    setSavingDraft(true);
    setError(null);
    try {
      await createDecision({
        title: title.trim(),
        description: description.trim() || "Draft policy proposal awaiting operational detail.",
        department,
        time_horizon: timeHorizon,
        priority,
      });
      router.push("/dashboard");
    } catch (cause) {
      toast.error("Could not save the draft", {
        description: cause instanceof Error ? cause.message : "Try again.",
      });
      setSavingDraft(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (title.trim().length < 5) {
      setError("Title must be at least 5 characters.");
      return;
    }
    if (description.trim().length < 10) {
      setError("Description must be at least 10 characters.");
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
      toast.error("Could not create decision proposal", {
        description: cause instanceof Error ? cause.message : "Check details and try again.",
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
            Initiate Decision Analysis
          </span>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
            New Strategic Policy Proposal
          </h1>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 max-w-2xl leading-relaxed">
            Frame the organizational decision, designate the responsible department, and calibrate strategic priority.
          </p>
        </div>

        <button
          type="button"
          onClick={handlePreFillDemo}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-2 text-xs font-bold text-indigo-700 hover:bg-indigo-100 dark:border-indigo-900 dark:bg-indigo-950/60 dark:text-indigo-300 transition"
        >
          <Sparkles className="h-3.5 w-3.5" />
          <span>One-Click Hackathon Sample</span>
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
            Policy or Decision Title <span className="text-rose-500">*</span>
          </label>
          <input
            id="decision-title"
            required
            maxLength={200}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Reduce in-person university attendance from 5 to 4 days per week"
            className="w-full rounded-xl border border-slate-300 bg-slate-50/50 px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          />
          <div className="flex justify-between text-[11px] text-slate-400">
            <span>State the proposal clearly. Min 5 characters.</span>
            <span>{title.length}/200</span>
          </div>
        </div>

        {/* Description */}
        <div className="space-y-2">
          <label htmlFor="decision-desc" className="text-sm font-bold text-slate-900 dark:text-white">
            Decision Scope & Objectives <span className="text-rose-500">*</span>
          </label>
          <textarea
            id="decision-desc"
            required
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Provide context regarding the motivation, affected campus constituencies, and expected operational parameters..."
            className="w-full rounded-xl border border-slate-300 bg-slate-50/50 p-4 text-xs text-slate-900 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          />
        </div>

        {/* Priority Selector Chips */}
        <div className="space-y-2">
          <label className="text-sm font-bold text-slate-900 dark:text-white">
            Strategic Priority Level
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
                  <span className="text-xs font-bold uppercase">{p}</span>
                  <span className="text-[10px] opacity-75 mt-0.5">
                    {p === "CRITICAL"
                      ? "Board-level urgency"
                      : p === "HIGH"
                      ? "Institution-wide"
                      : p === "MEDIUM"
                      ? "Division-wide"
                      : "Departmental"}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Department & Time Horizon Grid */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div className="space-y-2">
            <label htmlFor="dept" className="text-sm font-bold text-slate-900 dark:text-white">
              Responsible Department
            </label>
            <select
              id="dept"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-slate-50/50 px-3.5 py-2.5 text-xs font-semibold text-slate-900 outline-none focus:border-indigo-500 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            >
              {DEPARTMENTS.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label htmlFor="time-horizon" className="text-sm font-bold text-slate-900 dark:text-white">
              Implementation Time Horizon
            </label>
            <select
              id="time-horizon"
              value={timeHorizon}
              onChange={(e) => setTimeHorizon(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-slate-50/50 px-3.5 py-2.5 text-xs font-semibold text-slate-900 outline-none focus:border-indigo-500 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            >
              {TIME_HORIZONS.map((th) => (
                <option key={th} value={th}>
                  {th}
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
            <ArrowLeft className="h-4 w-4" />
            <span>Cancel</span>
          </Link>

          <div className="flex items-center gap-3">
            <button
              type="button"
              disabled={savingDraft || loading}
              onClick={handleSaveDraft}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 transition disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              <span>{savingDraft ? "Saving..." : "Save Draft"}</span>
            </button>

            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-2.5 text-xs font-bold text-white shadow-md shadow-indigo-600/30 hover:bg-indigo-500 transition disabled:opacity-50"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
              <span>Continue to Operational Context →</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
