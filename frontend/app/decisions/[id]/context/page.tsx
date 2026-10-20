"use client";

import React, { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Sparkles,
  Loader2,
  Save,
  ArrowLeft,
  Upload,
  GraduationCap,
  Users2,
  FlaskConical,
  Bus,
  CheckCircle2,
  RotateCcw,
} from "lucide-react";
import { attachDecisionContext, extractDecisionDocument, getDecision, getDecisionContext } from "@/lib/api";
import { DecisionNavTabs } from "@/components/DecisionNavTabs";
import { DEMO_CONTEXT } from "@/lib/mock-data";
import { ExtractedDocument } from "@/types/decision";
import { toast } from "sonner";
import { readSavedOrganizationContext } from "@/lib/organization";
import { useAuth } from "@/components/AuthProvider";
import { HumanReviewBanner } from "@/components/HumanReviewBanner";

export default function DecisionContextPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const decisionId = resolvedParams.id;
  const router = useRouter();
  const { activeOrganizationId } = useAuth();

  const [studentPopulation, setStudentPopulation] = useState("");
  const [facultyCount, setFacultyCount] = useState("");
  const [activeLaboratories, setActiveLaboratories] = useState("");
  const [transitRate, setTransitRate] = useState("");
  const [assumptions, setAssumptions] = useState("");
  const [constraints, setConstraints] = useState("");
  const [existingMetadata, setExistingMetadata] = useState<Record<string, unknown>>({});
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [extractedDocument, setExtractedDocument] = useState<ExtractedDocument | null>(null);
  const [extractingDocument, setExtractingDocument] = useState(false);
  const [documentError, setDocumentError] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [savingOnly, setSavingOnly] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    Promise.all([getDecision(Number(decisionId)), getDecisionContext(Number(decisionId))])
      .then(([, context]) => {
        if (!active) return;
        if (context) {
          setStudentPopulation(context.student_population?.toString() ?? "");
          setFacultyCount(context.faculty_count?.toString() ?? "");
          setActiveLaboratories(context.active_laboratories?.toString() ?? "");
          setTransitRate(context.transit_dependency_rate?.toString() ?? "");
          setAssumptions(context.key_assumptions.join("\n"));
          setConstraints(context.constraints ?? "");
          setExistingMetadata(context.raw_metadata ?? {});
        }
      })
      .catch((cause) => {
        if (active) setError(cause instanceof Error ? cause.message : "Could not load decision context.");
      });
    return () => {
      active = false;
    };
  }, [decisionId]);

  const handleLoadDemoProfile = () => {
    setStudentPopulation(String(DEMO_CONTEXT.student_population ?? "28000"));
    setFacultyCount(String(DEMO_CONTEXT.faculty_count ?? "1400"));
    setActiveLaboratories(String(DEMO_CONTEXT.active_laboratories ?? "85"));
    setTransitRate(String(DEMO_CONTEXT.transit_dependency_rate ?? "68.5"));
    setAssumptions(
      DEMO_CONTEXT.key_assumptions.join("\n") ||
        "Fridays designated as asynchronous remote learning day\nCampus auxiliary dining operates on 50% footprint\nTotal course accreditation contact hours preserved via 15% longer classes"
    );
    setConstraints(
      DEMO_CONTEXT.constraints ??
        "Wet laboratories, live animal research facilities, and BSL-2 laboratories require continuous daily temperature controls, monitoring, and researcher physical access."
    );
    toast.success("Reference University Context Loaded!", {
      description: "Sample higher-education baseline parameters applied.",
    });
  };

  const saveContextPayload = async () => {
    const parsedAssumptions = assumptions
      .split("\n")
      .map((a) => a.trim())
      .filter((a) => a.length > 0);
    const organization = readSavedOrganizationContext(activeOrganizationId);
    const organizationMetadata = organization
      ? Object.fromEntries(
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
        )
      : undefined;

    const rawMetadata = { ...existingMetadata, ...(organizationMetadata ?? {}) };
    return attachDecisionContext(Number(decisionId), {
      ...(studentPopulation ? { student_population: Number(studentPopulation) } : {}),
      ...(facultyCount ? { faculty_count: Number(facultyCount) } : {}),
      ...(activeLaboratories ? { active_laboratories: Number(activeLaboratories) } : {}),
      ...(transitRate ? { transit_dependency_rate: Number(transitRate) } : {}),
      key_assumptions: parsedAssumptions,
      constraints: constraints.trim() || null,
      ...(Object.keys(rawMetadata).length > 0 ? { raw_metadata: rawMetadata } : {}),
    });
  };

  const handleExtractDocument = async () => {
    if (!selectedFile) return;
    if (selectedFile.size > 10 * 1024 * 1024) {
      setDocumentError("File exceeds 10 MiB limit.");
      return;
    }
    setExtractingDocument(true);
    setDocumentError(null);
    try {
      const extracted = await extractDecisionDocument(
        Number(decisionId),
        selectedFile,
        `doc-${Date.now()}`
      );
      setExtractedDocument(extracted);
      const extractedText = extracted.pages.map((p) => p.text).join("\n").trim();
      if (extractedText && !assumptions) {
        setAssumptions(extractedText.split("\n").slice(0, 5).join("\n"));
      }
      toast.success("Document analyzed via OCR pipeline", {
        description: `Extracted text from ${extracted.pages.length} page(s) of ${selectedFile.name}`,
      });
    } catch (cause) {
      setDocumentError(cause instanceof Error ? cause.message : "Could not extract document data.");
      toast.error("Document extraction failed");
    } finally {
      setExtractingDocument(false);
    }
  };

  const handleSaveOnly = async () => {
    setSavingOnly(true);
    setError(null);
    try {
      await saveContextPayload();
      toast.success("Decision context saved successfully");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Failed to save context.");
      toast.error("Could not save context");
    } finally {
      setSavingOnly(false);
    }
  };

  const handleSaveAndSimulate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await saveContextPayload();
      router.push(`/decisions/${decisionId}/progress`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Failed to launch simulation.");
      toast.error("Could not launch simulation");
      setLoading(false);
    }
  };

  const addAssumptionTag = (tag: string) => {
    setAssumptions((prev) => (prev ? `${prev}\n${tag}` : tag));
  };

  return (
    <div className="space-y-6">
      <DecisionNavTabs decisionId={decisionId} />

      <HumanReviewBanner />

      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
            Stage 01 of Decision Analysis
          </span>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
            Operational Parameters & Context
          </h1>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 max-w-2xl leading-relaxed">
            Provide baseline institutional parameters to calibrate deterministic simulation models. You can also upload a PDF policy memo for automated extraction.
          </p>
        </div>

        <button
          type="button"
          onClick={handleLoadDemoProfile}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-2 text-xs font-bold text-indigo-700 hover:bg-indigo-100 dark:border-indigo-900 dark:bg-indigo-950/60 dark:text-indigo-300 transition"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          <span>Load University 4-Day Reference Profile</span>
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

      <form onSubmit={handleSaveAndSimulate} className="space-y-6">
        {/* 4 Quantitative Metric Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-2">
            <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
              <GraduationCap className="h-4 w-4 text-indigo-500" />
              <label htmlFor="student-pop" className="text-xs font-bold uppercase tracking-wider">
                Student Headcount
              </label>
            </div>
            <input
              id="student-pop"
              type="number"
              min="0"
              placeholder="e.g. 28000"
              value={studentPopulation}
              onChange={(e) => setStudentPopulation(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-bold text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white outline-none focus:border-indigo-500 focus:bg-white"
            />
            <p className="text-[10px] text-slate-400">Total enrolled undergraduate & graduate</p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-2">
            <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
              <Users2 className="h-4 w-4 text-emerald-500" />
              <label htmlFor="faculty-count" className="text-xs font-bold uppercase tracking-wider">
                Faculty & Instructors
              </label>
            </div>
            <input
              id="faculty-count"
              type="number"
              min="0"
              placeholder="e.g. 1400"
              value={facultyCount}
              onChange={(e) => setFacultyCount(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-bold text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white outline-none focus:border-indigo-500 focus:bg-white"
            />
            <p className="text-[10px] text-slate-400">Tenured, adjunct, and teaching assistants</p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-2">
            <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
              <FlaskConical className="h-4 w-4 text-amber-500" />
              <label htmlFor="active-labs" className="text-xs font-bold uppercase tracking-wider">
                Active Research Labs
              </label>
            </div>
            <input
              id="active-labs"
              type="number"
              min="0"
              placeholder="e.g. 85"
              value={activeLaboratories}
              onChange={(e) => setActiveLaboratories(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-bold text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white outline-none focus:border-indigo-500 focus:bg-white"
            />
            <p className="text-[10px] text-slate-400">Wet labs, animal facilities, cold storage</p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-2">
            <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
              <Bus className="h-4 w-4 text-sky-500" />
              <label htmlFor="transit-rate" className="text-xs font-bold uppercase tracking-wider">
                Transit Dependency %
              </label>
            </div>
            <input
              id="transit-rate"
              type="number"
              step="0.1"
              min="0"
              max="100"
              placeholder="e.g. 68.5"
              value={transitRate}
              onChange={(e) => setTransitRate(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-bold text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white outline-none focus:border-indigo-500 focus:bg-white"
            />
            <p className="text-[10px] text-slate-400">Commuting via buses and campus shuttles</p>
          </div>
        </div>

        {/* Document Upload Zone */}
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900 space-y-3">
          <div className="flex items-center gap-2">
            <Upload className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              OCR Document Extraction (PDF Policy Memos)
            </h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Upload institutional briefing documents or accreditation guidelines (up to 10 MiB). The pipeline extracts key assumptions and operational constraints automatically.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <input
              type="file"
              accept=".pdf,.png,.jpg,.jpeg"
              onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
              className="text-xs text-slate-600 dark:text-slate-400 file:me-3 file:rounded-xl file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-slate-800 dark:file:bg-slate-800 dark:file:text-slate-200"
            />

            {selectedFile && (
              <button
                type="button"
                disabled={extractingDocument}
                onClick={handleExtractDocument}
                className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-3.5 py-2 text-xs font-bold text-white hover:bg-slate-800 dark:bg-indigo-600 dark:hover:bg-indigo-500 transition disabled:opacity-50"
              >
                {extractingDocument ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                <span>{extractingDocument ? "Extracting Content..." : "Run Document Extraction"}</span>
              </button>
            )}
          </div>

          {documentError && (
            <p className="text-xs text-rose-600 dark:text-rose-400">{documentError}</p>
          )}

          {extractedDocument && (
            <div className="rounded-xl bg-emerald-50 p-3 text-xs text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-900/60 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>Extracted content from {extractedDocument.pages.length} document page(s).</span>
            </div>
          )}
        </div>

        {/* Assumptions & Operational Constraints */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Key Assumptions */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-3">
            <div>
              <label htmlFor="assumptions" className="text-sm font-bold text-slate-900 dark:text-white">
                Key Analytical Assumptions
              </label>
              <p className="text-xs text-slate-500 dark:text-slate-400">One per line. Explicit assumptions ensure explainability.</p>
            </div>

            <textarea
              id="assumptions"
              rows={5}
              value={assumptions}
              onChange={(e) => setAssumptions(e.target.value)}
              placeholder="Fridays designated as asynchronous remote learning day&#10;Campus dining auxiliary footprint reduced by 50%&#10;Total accreditation contact hours unchanged"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-900 outline-none focus:border-indigo-500 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />

            {/* Quick Suggestion Tags */}
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Quick University Suggestions:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {[
                  "15% longer lecture periods Mon–Thu",
                  "Friday asynchronous digital learning",
                  "Dining & auxiliary reduced footprint",
                  "Graduate research labs exempted",
                ].map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => addAssumptionTag(tag)}
                    className="rounded-lg bg-slate-100 px-2 py-1 text-[10px] font-semibold text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 transition"
                  >
                    + {tag}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Operational Constraints */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-3">
            <div>
              <label htmlFor="constraints" className="text-sm font-bold text-slate-900 dark:text-white">
                Critical Institutional Constraints
              </label>
              <p className="text-xs text-slate-500 dark:text-slate-400">Hard boundaries (e.g. biosafety, union contracts, continuous power).</p>
            </div>

            <textarea
              id="constraints"
              rows={5}
              value={constraints}
              onChange={(e) => setConstraints(e.target.value)}
              placeholder="Wet laboratories, animal research facilities, and biosafety level 2 facilities require continuous daily temperature controls, monitoring, and researcher access."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-900 outline-none focus:border-indigo-500 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>
        </div>

        {/* Action Bar */}
        <div className="flex items-center justify-between pt-2">
          <Link
            href={`/decisions/${decisionId}`}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 transition"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Proposal</span>
          </Link>

          <div className="flex items-center gap-3">
            <button
              type="button"
              disabled={savingOnly || loading}
              onClick={handleSaveOnly}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 transition disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              <span>{savingOnly ? "Saving..." : "Save Draft"}</span>
            </button>

            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-2.5 text-xs font-bold text-white shadow-md shadow-indigo-600/30 hover:bg-indigo-500 transition disabled:opacity-50"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              <span>Save & Launch Simulation →</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
