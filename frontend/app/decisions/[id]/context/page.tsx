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
  FileText,
} from "lucide-react";
import { attachDecisionContext, extractDecisionDocument, getDecision, getDecisionContext } from "@/lib/api";
import { DecisionNavTabs } from "@/components/DecisionNavTabs";
import { DEMO_CONTEXT } from "@/lib/mock-data";
import { Decision, ExtractedDocument } from "@/types/decision";
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
  const [assumptions, setAssumptions] = useState("");
  const [constraints, setConstraints] = useState("");
  const [existingMetadata, setExistingMetadata] = useState<Record<string, unknown>>({});
  const [loadingContext, setLoadingContext] = useState(true);
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
      .then(([loadedDecision, context]) => {
        if (!active) return;
        setDecision(loadedDecision);
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
      })
      .finally(() => {
        if (active) setLoadingContext(false);
      });
    return () => {
      active = false;
    };
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
      setDocumentError("This file is larger than the 10 MiB extraction limit.");
      return;
    }
    if (selectedFile.size === 0) {
      setDocumentError("This file is empty. Choose a PDF or image with content.");
      return;
    }
    setExtractingDocument(true);
    setDocumentError(null);
    setExtractedDocument(null);
    try {
      const sourceId = crypto.randomUUID();
      const result = await extractDecisionDocument(Number(decisionId), selectedFile, sourceId);
      setExtractedDocument(result);
      toast.success("Document text extracted", { description: "Review the page text against the original before using it." });
    } catch (cause) {
      setDocumentError(cause instanceof Error ? cause.message : "Could not extract text from this document.");
    } finally {
      setExtractingDocument(false);
    }
  };

  const handleSaveOnly = async () => {
    setSavingOnly(true);
    setError(null);
    try {
      await saveContextPayload();
      toast.success("Context saved", { description: "Demo mode stores the context in this browser." });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not save the context. Check the entered values and try again.");
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
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not save the context. Check the entered values and try again.");
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
      <form onSubmit={handleSubmit} className="space-y-4" aria-busy={loadingContext || loading || savingOnly}>
        <div className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-4 sm:space-y-5">
          {error && (
            <div className="flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 dark:text-rose-400 mt-0.5" />
              <span>{error}</span>
            </div>
          )}
          {loadingContext && <p className="text-xs text-slate-500" role="status">Loading saved context…</p>}

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
              maxLength={25000}
              value={assumptions}
              onChange={(e) => setAssumptions(e.target.value)}
              placeholder="e.g. Existing customer support hours must remain available during the transition"
              className="w-full rounded-xl border border-slate-300 bg-slate-50/50 p-3 text-xs text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white font-mono"
            />
          </div>

          <section aria-labelledby="document-extraction-title" className="space-y-3 rounded-xl border border-slate-200 p-4 dark:border-slate-800">
            <div>
              <h2 id="document-extraction-title" className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">Extract text from a source document</h2>
              <p className="mt-1 text-[11px] leading-5 text-slate-500 dark:text-slate-400">PDF and image files are processed locally by the backend (maximum 10 MiB). Extraction is a preview only: it is not saved or included in the analysis automatically. Verify every page against the original.</p>
            </div>
            <label htmlFor="decision-source-file" className="sr-only">Choose a PDF or image document</label>
            <input
              id="decision-source-file"
              type="file"
              accept=".pdf,.png,.jpg,.jpeg,.tif,.tiff,application/pdf,image/png,image/jpeg,image/tiff"
              onChange={(event) => {
                setSelectedFile(event.target.files?.[0] ?? null);
                setExtractedDocument(null);
                setDocumentError(null);
              }}
              disabled={extractingDocument || loadingContext}
              className="block w-full text-xs text-slate-600 file:me-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-slate-700 dark:text-slate-300 dark:file:bg-slate-800 dark:file:text-slate-200"
            />
            <button type="button" onClick={() => void handleExtractDocument()} disabled={!selectedFile || extractingDocument || loadingContext} className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-slate-300 px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">
              {extractingDocument ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" /> : <FileText className="h-3.5 w-3.5" aria-hidden="true" />}
              {extractingDocument ? "Extracting…" : "Extract text"}
            </button>
            {documentError && <p role="alert" className="text-xs text-rose-700 dark:text-rose-300">{documentError}</p>}
            {extractedDocument && (
              <div className="space-y-2 rounded-lg bg-slate-50 p-3 dark:bg-slate-800/60" aria-live="polite">
                <p className="text-[11px] font-semibold text-slate-700 dark:text-slate-200">{extractedDocument.source_name} · source {extractedDocument.source_document_id} · version {extractedDocument.source_version}</p>
                <p className="text-[10px] text-amber-700 dark:text-amber-300">Human verification required. This extracted text has not been added to saved context.</p>
                {extractedDocument.pages.map((page) => (
                  <details key={page.page_number} className="rounded-md border border-slate-200 bg-white p-2 dark:border-slate-700 dark:bg-slate-900">
                    <summary className="cursor-pointer text-xs font-semibold">Page {page.page_number} · {page.backend}{page.quality_warning ? ` · ${page.quality_warning}` : ""}</summary>
                    <pre className="mt-2 max-h-64 overflow-auto whitespace-pre-wrap text-[11px] text-slate-700 dark:text-slate-200">{page.text || "No text was extracted from this page."}</pre>
                  </details>
                ))}
              </div>
            )}
          </section>

          {/* Operational Constraints */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
              Operational constraints
            </label>
            <textarea
              rows={2}
              maxLength={4000}
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
                disabled={savingOnly || loading || loadingContext}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 cursor-pointer"
              >
                <Save className="h-3.5 w-3.5" />
                <span>{savingOnly ? "Attaching..." : "Attach Context Data"}</span>
              </button>

              <button
                type="submit"
                disabled={loading || savingOnly || loadingContext}
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
