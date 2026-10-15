"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  AlertCircle,
  ArrowRight,
  Sparkles,
  Loader2,
  Save,
} from "lucide-react";
import { createDecision } from "@/lib/api";
import { Priority } from "@/types/decision";

const DEPARTMENTS = [
  "Academic Affairs",
  "Faculty of Engineering & Natural Sciences",
  "Division of Campus Operations & Facilities Management",
  "Office of Student Life & Commuter Services",
  "Institutional Research",
];

const TIME_HORIZONS = [
  "1 Semester (Pilot)",
  "1 Academic Year",
  "3 Years (Strategic Cycle)",
  "5 Years (Institutional Master Plan)",
];

export default function CreateDecisionPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [department, setDepartment] = useState(DEPARTMENTS[0]);
  const [timeHorizon, setTimeHorizon] = useState(TIME_HORIZONS[1]);
  const [priority, setPriority] = useState<Priority>("HIGH");
  const [loading, setLoading] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePreFillDemo = () => {
    setTitle("Reduce in-person university attendance from five days to four days per week");
    setDescription(
      "Evaluate institutional shift from traditional 5-day on-campus instruction to a 4-day condensed week (Monday through Thursday) with Friday designated for asynchronous digital learning, grading, and faculty research."
    );
    setDepartment(DEPARTMENTS[0]);
    setTimeHorizon(TIME_HORIZONS[1]);
    setPriority("HIGH");
    setError(null);
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
    } catch {
      setError("Failed to save draft.");
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
    if (description.trim().length < 20) {
      setError("Description must be at least 20 characters to provide sufficient context.");
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
    } catch {
      setError("Failed to create decision proposal. Please try again.");
      setLoading(false);
    }
  };

  const handleCancel = (e: React.MouseEvent) => {
    if (title || description) {
      if (!confirm("Discard unsaved changes and return to dashboard?")) {
        e.preventDefault();
      }
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-2xl">
            Draft Policy Proposal
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Describe the proposed change, responsible academic team, and timeline before adding campus data.
          </p>
        </div>
        <button
          type="button"
          onClick={handlePreFillDemo}
          className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 dark:border-indigo-900 dark:bg-indigo-950/60 dark:text-indigo-300 transition"
        >
          <Sparkles className="h-3.5 w-3.5" />
          <span>Pre-fill Demo 4-Day Policy</span>
        </button>
      </div>

      {/* Form Card */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
        {error && (
          <div className="mb-4 flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 dark:text-rose-400 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
          {/* Title */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
              Policy Proposal Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Transition undergraduate campus instruction to a 4-day condensed week"
              className="w-full rounded-xl border border-slate-300 bg-slate-50/50 px-3.5 py-2 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
              Scope & Institutional Rationale <span className="text-rose-500">*</span>
            </label>
            <textarea
              required
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detail the operational change, schedule shifts, remote expectations, and core objective..."
              className="w-full rounded-xl border border-slate-300 bg-slate-50/50 p-3 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>

          {/* Department & Time Horizon */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Responsible Academic Team <span className="text-rose-500">*</span>
              </label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-slate-50/50 px-3 py-2 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              >
                {DEPARTMENTS.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Evaluation Time Horizon <span className="text-rose-500">*</span>
              </label>
              <select
                value={timeHorizon}
                onChange={(e) => setTimeHorizon(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-slate-50/50 px-3 py-2 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              >
                {TIME_HORIZONS.map((h) => (
                  <option key={h} value={h}>
                    {h}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Priority */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
              Institutional Priority Level
            </label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {(["LOW", "MEDIUM", "HIGH", "CRITICAL"] as Priority[]).map((p) => (
                <label
                  key={p}
                  className={`flex cursor-pointer items-center justify-center rounded-xl border p-2 text-xs font-semibold transition ${
                    priority === p
                      ? "border-indigo-600 bg-indigo-50/80 text-indigo-900 dark:border-indigo-500 dark:bg-indigo-950/60 dark:text-indigo-200"
                      : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-800/40 dark:text-slate-300"
                  }`}
                >
                  <input
                    type="radio"
                    name="priority"
                    value={p}
                    checked={priority === p}
                    onChange={() => setPriority(p)}
                    className="sr-only"
                  />
                  <span>{p}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-t border-slate-200 pt-4 dark:border-slate-800">
            <Link
              href="/dashboard"
              onClick={handleCancel}
              className="text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white"
            >
              Cancel
            </Link>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSaveDraft}
                disabled={savingDraft || loading}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 cursor-pointer"
              >
                <Save className="h-3.5 w-3.5" />
                <span>{savingDraft ? "Saving..." : "Save Draft"}</span>
              </button>

              <button
                type="submit"
                disabled={loading || savingDraft}
                className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-60 transition cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <span>Next: Add Context</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
