"use client";

import React, { useEffect, useState, use } from "react";
import Link from "next/link";
import {
  Copy,
  Download,
  Code,
  Eye,
  ArrowLeft,
  FileText,
  Printer,
} from "lucide-react";
import { getReport } from "@/lib/api";
import { DecisionNavTabs } from "@/components/DecisionNavTabs";
import { MarkdownViewer } from "@/components/MarkdownViewer";
import { ReportResponse } from "@/types/decision";
import { toast } from "sonner";
import { downloadReportDocx } from "@/lib/report-export";

export default function ReportPreviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const decisionId = resolvedParams.id;

  const [report, setReport] = useState<ReportResponse | null>(null);
  const [viewMode, setViewMode] = useState<"PREVIEW" | "RAW">("PREVIEW");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getReport(Number(decisionId))
      .then((data) => {
        setReport(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [decisionId]);

  const handleCopy = async () => {
    if (!report) return;
    try {
      await navigator.clipboard.writeText(report.content_markdown);
      toast.success("Markdown copied to clipboard");
    } catch {
      toast.error("Could not access the clipboard", { description: "Select and copy the raw Markdown instead." });
    }
  };

  const handleDownload = () => {
    if (!report) return;
    const blob = new Blob([report.content_markdown], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = report.filename || `rippleiq-decision-${decisionId}-report.md`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Markdown report downloaded");
  };

  const handleDownloadDocx = async () => {
    if (!report) return;
    try {
      await downloadReportDocx(report.content_markdown, report.filename || `rippleiq-decision-${decisionId}-report.md`);
      toast.success("Word report downloaded");
    } catch {
      toast.error("Could not create the Word report");
    }
  };

  const handlePrintPdf = () => {
    toast.info("Choose Save as PDF in your browser’s print dialog");
    window.print();
  };

  if (loading || !report) {
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
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
            Step 6 of Decision Analysis
          </span>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-2xl">
            Executive Decision Memorandum
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            A shareable decision brief for your organization and affected stakeholders.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2 print:hidden">
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <Copy className="h-3.5 w-3.5" />
            <span>Copy Markdown</span>
          </button>

          <button
            type="button"
            onClick={handleDownload}
            className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-indigo-500 transition shadow-xs cursor-pointer"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Download .md</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadDocx}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <FileText className="h-3.5 w-3.5" />
            <span>Download .docx</span>
          </button>

          <button
            type="button"
            onClick={handlePrintPdf}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <Printer className="h-3.5 w-3.5" />
            <span>Print / Save PDF</span>
          </button>
        </div>
      </div>

      <article id="report-print-content" className="hidden print:block" aria-label="Printable decision report">
        <div className="mb-6 border-b border-slate-200 pb-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">RippleIQ · Decision impact analysis</p>
          <h1 className="mt-2 text-2xl font-bold text-slate-900">Decision Brief</h1>
          <p className="mt-1 text-xs text-slate-500">Generated {new Date(report.generated_at).toLocaleString()}</p>
        </div>
        <MarkdownViewer content={report.content_markdown} />
      </article>

      {/* Main Container with Sidebar Metadata */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-4 print:hidden">
        {/* Document Viewer */}
        <div className="lg:col-span-3 rounded-xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          {/* Tab Switcher */}
          <div className="mb-4 flex items-center justify-between border-b border-slate-200 pb-2.5 dark:border-slate-800">
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setViewMode("PREVIEW")}
                className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition cursor-pointer ${
                  viewMode === "PREVIEW"
                    ? "bg-slate-900 text-white dark:bg-indigo-600"
                    : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
                }`}
              >
                <Eye className="h-3.5 w-3.5" />
                <span>Rendered Preview</span>
              </button>

              <button
                onClick={() => setViewMode("RAW")}
                className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition cursor-pointer ${
                  viewMode === "RAW"
                    ? "bg-slate-900 text-white dark:bg-indigo-600"
                    : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
                }`}
              >
                <Code className="h-3.5 w-3.5" />
                <span>Raw Markdown</span>
              </button>
            </div>

            <span className="font-mono text-[10px] text-slate-400">
              {report.filename}
            </span>
          </div>

          {/* Render content */}
          {viewMode === "PREVIEW" ? (
            <div className="max-h-[600px] overflow-y-auto pe-1">
              <MarkdownViewer content={report.content_markdown} />
            </div>
          ) : (
            <pre className="max-h-[600px] overflow-auto rounded-lg border border-slate-200 bg-slate-900 p-3.5 font-mono text-[11px] text-slate-100 dark:border-slate-800 whitespace-pre-wrap leading-relaxed">
              {report.content_markdown}
            </pre>
          )}
        </div>

        {/* Metadata Sidebar */}
        <div className="space-y-3">
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
              Document Audit Metadata
            </h3>

            <div className="space-y-2.5 text-xs">
              <div>
                <span className="text-[10px] font-semibold uppercase text-slate-400 block">
                  Generated Timestamp
                </span>
                <span className="font-medium text-slate-800 dark:text-slate-200 text-[11px]">
                  {new Date(report.generated_at).toLocaleString()}
                </span>
              </div>

              <div>
                <span className="text-[10px] font-semibold uppercase text-slate-400 block">
                  Integrity Checksum
                </span>
                <span className="font-mono text-[10px] text-slate-500 break-all">
                  {report.checksum || "Not provided by the report service"}
                </span>
              </div>

              <div>
                <span className="text-[10px] font-semibold uppercase text-slate-400 block">
                  Authoring Engine
                </span>
                <span className="font-medium text-slate-800 dark:text-slate-200 text-[11px]">
                  RippleIQ · Organization Decision Brief
                </span>
              </div>
            </div>

            <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800 text-[10px] text-slate-400">
              Ready to share with your organization’s decision-making team.
            </div>
          </div>

          <Link
            href="/dashboard"
            className="w-full flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 transition"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Return to Dashboard</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
