"use client";

import React, { useCallback, useEffect, useState, use } from "react";
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
import { useLocale } from "@/components/LocaleProvider";
import { MarkdownViewer } from "@/components/MarkdownViewer";
import { ReportResponse } from "@/types/decision";
import { toast } from "sonner";
import { downloadReportDocx } from "@/lib/report-export";
import { ApiLoadError } from "@/components/ApiLoadError";
import { DecisionAnalysisSkeleton } from "@/components/LoadingSkeleton";

export default function ReportPreviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const decisionId = resolvedParams.id;
  const { locale } = useLocale();
  const isAr = locale === "ar";

  const [report, setReport] = useState<ReportResponse | null>(null);
  const [viewMode, setViewMode] = useState<"PREVIEW" | "RAW">("PREVIEW");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadReport = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      setReport(await getReport(Number(decisionId)));
    } catch (cause) {
      setLoadError(cause instanceof Error ? cause.message : isAr ? "تعذر تحميل التقرير." : "Could not load the report.");
    } finally {
      setLoading(false);
    }
  }, [decisionId, isAr]);

  useEffect(() => {
    void Promise.resolve().then(loadReport);
  }, [loadReport]);

  const handleCopy = async () => {
    if (!report) return;
    try {
      await navigator.clipboard.writeText(report.content_markdown);
      toast.success(isAr ? "تم نسخ كود التقرير إلى الحافظة" : "Markdown copied to clipboard");
    } catch {
      toast.error(isAr ? "تعذر الوصول إلى الحافظة" : "Could not access the clipboard", {
        description: isAr ? "حدد كود Markdown وانسخه يدوياً." : "Select and copy the raw Markdown instead.",
      });
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
    toast.success(isAr ? "تم تنزيل تقرير Markdown" : "Markdown report downloaded");
  };

  const handleDownloadDocx = async () => {
    if (!report) return;
    try {
      await downloadReportDocx(report.content_markdown, report.filename || `rippleiq-decision-${decisionId}-report.md`);
      toast.success(isAr ? "تم تنزيل تقرير Word بنجاح" : "Word report downloaded");
    } catch {
      toast.error(isAr ? "تعذر إنشاء ملف Word" : "Could not create the Word report");
    }
  };

  const handlePrintPdf = () => {
    toast.info(isAr ? "اختر 'حفظ بتنسيق PDF' من نافذة الطباعة" : "Choose Save as PDF in your browser’s print dialog");
    window.print();
  };

  if (loading) {
    return <DecisionAnalysisSkeleton decisionId={decisionId} />;
  }

  if (loadError || !report) {
    return (
      <div className="space-y-4">
        <DecisionNavTabs decisionId={decisionId} />
        <ApiLoadError
          message={loadError ?? (isAr ? "المذكرة غير متاحة حتى تكتمل المحاكاة والتحليل." : "A report is not available until analysis is complete.")}
          onRetry={() => void loadReport()}
        />
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
            {isAr ? "الخطوة 6 من تحليل القرار" : "Step 6 of Decision Analysis"}
          </span>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-2xl">
            {isAr ? "المذكرة التنفيذية للقرار" : "Executive Decision Memorandum"}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {isAr
              ? "موجز قرارات قابل للمشاركة مع فرق العمل وأصحاب المصلحة المتأثرين في مؤسستك."
              : "A shareable decision brief for your organization and affected stakeholders."}
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
            <span>{isAr ? "نسخ كـ Markdown" : "Copy Markdown"}</span>
          </button>

          <button
            type="button"
            onClick={handleDownload}
            className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-indigo-500 transition shadow-xs cursor-pointer"
          >
            <Download className="h-3.5 w-3.5" />
            <span>{isAr ? "تنزيل .md" : "Download .md"}</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadDocx}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <FileText className="h-3.5 w-3.5" />
            <span>{isAr ? "تنزيل .docx" : "Download .docx"}</span>
          </button>

          <button
            type="button"
            onClick={handlePrintPdf}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <Printer className="h-3.5 w-3.5" />
            <span>{isAr ? "طباعة / حفظ كـ PDF" : "Print / Save PDF"}</span>
          </button>
        </div>
      </div>

      <article id="report-print-content" className="hidden print:block" aria-label="Printable decision report">
        <div className="mb-6 border-b border-slate-200 pb-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
            {isAr ? "RippleIQ · تحليل آثار القرارات المؤسسية" : "RippleIQ · Decision impact analysis"}
          </p>
          <h1 className="mt-2 text-2xl font-bold text-slate-900">
            {isAr ? "موجز القرار التنفيذي" : "Decision Brief"}
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            {isAr ? `تاريخ الإنشاء: ${new Date(report.generated_at).toLocaleString("ar-SA")}` : `Generated ${new Date(report.generated_at).toLocaleString()}`}
          </p>
        </div>
        <MarkdownViewer content={report.content_markdown} />
      </article>

      {/* Main Container with Sidebar Metadata */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-4 print:hidden">
        {/* Document Viewer */}
        <div className="lg:col-span-3 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          {/* Tab Switcher */}
          <div className="mb-4 flex items-center justify-between border-b border-slate-200 pb-2.5 dark:border-slate-800">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setViewMode("PREVIEW")}
                className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition cursor-pointer ${
                  viewMode === "PREVIEW"
                    ? "bg-slate-900 text-white dark:bg-indigo-600"
                    : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
                }`}
              >
                <Eye className="h-3.5 w-3.5" />
                <span>{isAr ? "معاينة منسقة" : "Rendered Preview"}</span>
              </button>

              <button
                type="button"
                onClick={() => setViewMode("RAW")}
                className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition cursor-pointer ${
                  viewMode === "RAW"
                    ? "bg-slate-900 text-white dark:bg-indigo-600"
                    : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
                }`}
              >
                <Code className="h-3.5 w-3.5" />
                <span>{isAr ? "كود Markdown الأولي" : "Raw Markdown"}</span>
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
            <pre className="max-h-[600px] overflow-auto rounded-xl border border-slate-200 bg-slate-900 p-3.5 font-mono text-[11px] text-slate-100 dark:border-slate-800 whitespace-pre-wrap leading-relaxed">
              {report.content_markdown}
            </pre>
          )}
        </div>

        {/* Metadata Sidebar */}
        <div className="space-y-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
              {isAr ? "بيانات تدقيق الوثيقة" : "Document Audit Metadata"}
            </h3>

            <div className="space-y-2.5 text-xs">
              <div>
                <span className="text-[10px] font-semibold uppercase text-slate-400 block">
                  {isAr ? "توقيت الإنشاء" : "Generated Timestamp"}
                </span>
                <span className="font-medium text-slate-800 dark:text-slate-200 text-[11px]">
                  {new Date(report.generated_at).toLocaleString(isAr ? "ar-SA" : undefined)}
                </span>
              </div>

              <div>
                <span className="text-[10px] font-semibold uppercase text-slate-400 block">
                  {isAr ? "بصمة التحقق الرقمية" : "Integrity Checksum"}
                </span>
                <span className="font-mono text-[10px] text-slate-500 break-all">
                  {report.checksum || (isAr ? "غير متوفرة من خدمة التقارير" : "Not provided by the report service")}
                </span>
              </div>

              <div>
                <span className="text-[10px] font-semibold uppercase text-slate-400 block">
                  {isAr ? "محرك الصياغة" : "Authoring Engine"}
                </span>
                <span className="font-medium text-slate-800 dark:text-slate-200 text-[11px]">
                  {isAr ? "RippleIQ · موجز قرارات المؤسسة" : "RippleIQ · Organization Decision Brief"}
                </span>
              </div>
            </div>

            <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800 text-[10px] text-slate-400">
              {isAr
                ? "جاهز للمشاركة مع الفريق القيادي ومجلس القرار في مؤسستك."
                : "Ready to share with your organization’s decision-making team."}
            </div>
          </div>

          <Link
            href="/dashboard"
            className="w-full flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 transition"
          >
            <ArrowLeft className="h-3.5 w-3.5 rtl:rotate-180" />
            <span>{isAr ? "العودة للوحة التحكم" : "Return to Dashboard"}</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
