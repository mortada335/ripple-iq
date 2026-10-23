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
  ZoomIn,
  ZoomOut,
  Maximize2,
  Globe,
  Sparkles,
  Layers,
  ShieldCheck,
} from "lucide-react";
import {
  getReport,
  getDecision,
  getSimulationResult,
  getRecommendation,
  getLocalReport,
  getLocalRecommendation,
} from "@/lib/api";
import { getLocalDecision, getLocalSimulationResult } from "@/lib/mock-data";
import { DecisionNavTabs } from "@/components/DecisionNavTabs";
import { useLocale } from "@/components/LocaleProvider";
import { MarkdownViewer } from "@/components/MarkdownViewer";
import { ExecutiveReportDocument } from "@/components/ExecutiveReportDocument";
import {
  Decision,
  SimulationResult,
  RecommendationView,
  ReportResponse,
} from "@/types/decision";
import { toast } from "sonner";
import { downloadReportDocx } from "@/lib/report-export";
import { ApiLoadError } from "@/components/ApiLoadError";
import { ReportDocumentSkeleton } from "@/components/LoadingSkeleton";

export default function ReportPreviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const decisionId = resolvedParams.id;
  const { locale } = useLocale();
  const isAr = locale === "ar";

  const [report, setReport] = useState<ReportResponse | null>(() => {
    if (typeof window === "undefined") return null;
    try {
      return getLocalReport(Number(decisionId));
    } catch {
      return null;
    }
  });
  const [decision, setDecision] = useState<Decision | null>(() => {
    if (typeof window === "undefined") return null;
    try {
      return getLocalDecision(Number(decisionId));
    } catch {
      return null;
    }
  });
  const [simulation, setSimulation] = useState<SimulationResult | null>(() => {
    if (typeof window === "undefined") return null;
    try {
      return getLocalSimulationResult(Number(decisionId));
    } catch {
      return null;
    }
  });
  const [recommendation, setRecommendation] = useState<RecommendationView | null>(() => {
    if (typeof window === "undefined") return null;
    try {
      return getLocalRecommendation(Number(decisionId));
    } catch {
      return null;
    }
  });

  const [viewMode, setViewMode] = useState<"DOCUMENT" | "WEB" | "RAW">("DOCUMENT");
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [docLang, setDocLang] = useState<"ar" | "en">(isAr ? "ar" : "en");
  const [loading, setLoading] = useState(() => {
    if (typeof window === "undefined") return true;
    try {
      return !getLocalReport(Number(decisionId));
    } catch {
      return true;
    }
  });
  const [loadError, setLoadError] = useState<string | null>(null);

  // Sync default document language with system locale on mount or change
  useEffect(() => {
    setDocLang(isAr ? "ar" : "en");
  }, [isAr]);

  const loadReportData = useCallback(async () => {
    setLoadError(null);

    try {
      const [reportRes, decRes, simRes, recRes] = await Promise.allSettled([
        getReport(Number(decisionId)),
        getDecision(Number(decisionId)),
        getSimulationResult(Number(decisionId)),
        getRecommendation(Number(decisionId)),
      ]);

      if (reportRes.status === "fulfilled") {
        setReport(reportRes.value);
      } else {
        throw reportRes.reason;
      }

      if (decRes.status === "fulfilled") {
        setDecision(decRes.value);
      }
      if (simRes.status === "fulfilled") {
        setSimulation(simRes.value);
      }
      if (recRes.status === "fulfilled") {
        setRecommendation(recRes.value);
      }
    } catch (cause) {
      setLoadError(
        cause instanceof Error
          ? cause.message
          : isAr
          ? "تعذر تحميل التقرير ومخرجات المحاكاة."
          : "Could not load the executive report."
      );
    } finally {
      setLoading(false);
    }
  }, [decisionId, isAr]);

  useEffect(() => {
    void Promise.resolve().then(loadReportData);
  }, [loadReportData]);

  const handleCopy = async () => {
    if (!report) return;
    try {
      await navigator.clipboard.writeText(report.content_markdown);
      toast.success(
        isAr
          ? "تم نسخ نص المذكرة التنفيذية إلى الحافظة ✨"
          : "Executive memorandum copied to clipboard"
      );
    } catch {
      toast.error(isAr ? "تعذر الوصول إلى الحافظة" : "Could not access clipboard");
    }
  };

  const handleDownloadMd = () => {
    if (!report) return;
    const blob = new Blob([report.content_markdown], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = report.filename || `rippleiq-decision-${decisionId}-memorandum.md`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(isAr ? "تم تنزيل مذكرة Markdown" : "Markdown memorandum downloaded");
  };

  const handleDownloadDocx = async () => {
    if (!report) return;
    try {
      await downloadReportDocx(
        report.content_markdown,
        report.filename || `rippleiq-decision-${decisionId}-report.md`,
        {
          isAr: docLang === "ar",
          title: decision?.title,
        }
      );
      toast.success(isAr ? "تم تصدير وثيقة Word (.docx) بنجاح ✨" : "Word document downloaded");
    } catch {
      toast.error(isAr ? "تعذر إنشاء ملف Word" : "Could not create Word document");
    }
  };

  const handlePrintPdf = () => {
    toast.info(
      isAr
        ? "اختر 'حفظ بتنسيق PDF' من نافذة الطباعة للحصول على وثيقة A4 الرسمية"
        : "Choose 'Save as PDF' in the print dialog for official A4 layout"
    );
    // Trigger standard browser print which is styled via @media print in globals.css
    window.print();
  };

  if (loading && !report) {
    return <ReportDocumentSkeleton decisionId={decisionId} />;
  }

  if (loadError || !report) {
    return (
      <div className="space-y-4">
        <DecisionNavTabs decisionId={decisionId} />
        <ApiLoadError
          message={
            loadError ??
            (isAr
              ? "المذكرة غير متاحة حتى تكتمل المحاكاة والتحليل."
              : "A report is not available until analysis is complete.")
          }
          onRetry={() => void loadReportData()}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* Workflow Navigation */}
      <DecisionNavTabs decisionId={decisionId} />

      {/* Page Header & Executive Actions Bar */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between print:hidden">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
              {isAr ? "المرحلة 05 · المذكرة التنفيذية واعتماد الحوكمة" : "Stage 05 · Executive Memorandum & Governance Sign-off"}
            </span>
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
              {isAr ? "جاهز للطباعة والاعتماد المؤسسي" : "Ready for Board Sign-off"}
            </span>
          </div>

          <h1 className="mt-1 text-xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-2xl">
            {isAr ? "المذكرة التنفيذية للقرار المؤسسي" : "Executive Decision Memorandum"}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-2xl">
            {isAr
              ? "وثيقة قرار رسمية مخصصة للقيادة العليا ومجلس الإدارة، مع مصفوفة الآثار الارتدادية ومحضر التوقيعات المعتمد."
              : "An executive-grade memorandum engineered for board reviews, stakeholder alignment, and governance audits."}
          </p>
        </div>

        {/* Action Controls Suite */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Primary Print / Save as PDF Button */}
          <button
            type="button"
            onClick={handlePrintPdf}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white shadow-md hover:bg-slate-800 dark:bg-indigo-600 dark:hover:bg-indigo-500 transition-all cursor-pointer active:scale-95"
            title={isAr ? "طباعة الوثيقة الرسمية أو حفظها كملف PDF" : "Print or save as official PDF"}
          >
            <Printer className="h-4 w-4" />
            <span>{isAr ? "طباعة / تصدير PDF" : "Print / Export PDF"}</span>
          </button>

          {/* Download Word (.docx) */}
          <button
            type="button"
            onClick={handleDownloadDocx}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 transition cursor-pointer shadow-xs"
            title={isAr ? "تصدير بصيغة Microsoft Word قابلة للتعديل" : "Download editable Microsoft Word document"}
          >
            <FileText className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
            <span>{isAr ? "تنزيل Word" : "Download .docx"}</span>
          </button>

          {/* Download Markdown (.md) */}
          <button
            type="button"
            onClick={handleDownloadMd}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 transition cursor-pointer shadow-xs"
          >
            <Download className="h-3.5 w-3.5" />
            <span>{isAr ? "تنزيل .md" : "Download .md"}</span>
          </button>

          {/* Copy to Clipboard */}
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 transition cursor-pointer shadow-xs"
            title={isAr ? "نسخ نص التقرير الكامل للحافظة" : "Copy markdown to clipboard"}
          >
            <Copy className="h-3.5 w-3.5" />
            <span>{isAr ? "نسخ النص" : "Copy"}</span>
          </button>
        </div>
      </div>

      {/* Main Workspace with Document Desk */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-4 print:block">
        {/* Document Presentation Area (3 columns on Desktop, full on Print) */}
        <div className="lg:col-span-3 space-y-4 print:w-full">
          {/* View Mode Bar & Toolbar (Screen Only) */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-2.5 shadow-xs dark:border-slate-800 dark:bg-slate-900 print:hidden">
            {/* View Switcher Tabs */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setViewMode("DOCUMENT")}
                className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition cursor-pointer ${
                  viewMode === "DOCUMENT"
                    ? "bg-slate-900 text-white shadow-xs dark:bg-indigo-600"
                    : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
                }`}
              >
                <FileText className="h-3.5 w-3.5" />
                <span>{isAr ? "وثيقة A4 الرسمية" : "Official A4 Sheet"}</span>
              </button>

              <button
                type="button"
                onClick={() => setViewMode("WEB")}
                className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition cursor-pointer ${
                  viewMode === "WEB"
                    ? "bg-slate-900 text-white shadow-xs dark:bg-indigo-600"
                    : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
                }`}
              >
                <Eye className="h-3.5 w-3.5" />
                <span>{isAr ? "المعاينة التفاعلية" : "Interactive Preview"}</span>
              </button>

              <button
                type="button"
                onClick={() => setViewMode("RAW")}
                className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition cursor-pointer ${
                  viewMode === "RAW"
                    ? "bg-slate-900 text-white shadow-xs dark:bg-indigo-600"
                    : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
                }`}
              >
                <Code className="h-3.5 w-3.5" />
                <span>{isAr ? "كود Markdown" : "Raw Markdown"}</span>
              </button>
            </div>

            {/* Document Controls (Language & Zoom) */}
            {viewMode === "DOCUMENT" && (
              <div className="flex items-center gap-2">
                {/* Language Switcher for Document Sheet */}
                <div className="flex items-center rounded-lg border border-slate-200 bg-slate-50 p-0.5 dark:border-slate-800 dark:bg-slate-950 text-[11px] font-semibold">
                  <button
                    type="button"
                    onClick={() => setDocLang("ar")}
                    className={`rounded-md px-2 py-0.5 transition cursor-pointer ${
                      docLang === "ar"
                        ? "bg-white text-slate-900 font-bold shadow-xs dark:bg-slate-800 dark:text-white"
                        : "text-slate-500 hover:text-slate-800 dark:text-slate-400"
                    }`}
                  >
                    العربية
                  </button>
                  <button
                    type="button"
                    onClick={() => setDocLang("en")}
                    className={`rounded-md px-2 py-0.5 transition cursor-pointer ${
                      docLang === "en"
                        ? "bg-white text-slate-900 font-bold shadow-xs dark:bg-slate-800 dark:text-white"
                        : "text-slate-500 hover:text-slate-800 dark:text-slate-400"
                    }`}
                  >
                    English
                  </button>
                </div>

                {/* Zoom Controls */}
                <div className="hidden sm:flex items-center gap-1 border-s border-slate-200 ps-2 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setZoomLevel((z) => Math.max(75, z - 10))}
                    className="p-1 rounded-md text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                    title={isAr ? "تصغير" : "Zoom out"}
                  >
                    <ZoomOut className="h-3.5 w-3.5" />
                  </button>
                  <span className="text-[11px] font-mono text-slate-500 min-w-9 text-center">
                    {zoomLevel}%
                  </span>
                  <button
                    type="button"
                    onClick={() => setZoomLevel((z) => Math.min(130, z + 10))}
                    className="p-1 rounded-md text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                    title={isAr ? "تكبير" : "Zoom in"}
                  >
                    <ZoomIn className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setZoomLevel(100)}
                    className="p-1 rounded-md text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                    title={isAr ? "إعادة الضبط" : "Reset zoom"}
                  >
                    <Maximize2 className="h-3 w-3" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* 1. Official A4 Executive Document Desk View */}
          {viewMode === "DOCUMENT" && (
            <div className="rounded-2xl border border-slate-200 bg-slate-100/70 p-3 sm:p-6 dark:border-slate-800 dark:bg-slate-950/70 overflow-x-auto print:border-none print:bg-white print:p-0">
              <div
                style={{
                  zoom: zoomLevel !== 100 ? `${zoomLevel}%` : undefined,
                }}
                className="transition-transform duration-150 origin-top"
              >
                <ExecutiveReportDocument
                  decision={decision}
                  simulation={simulation}
                  recommendation={recommendation}
                  report={report}
                  isAr={docLang === "ar"}
                />
              </div>
            </div>
          )}

          {/* 2. Web Markdown Viewer View */}
          {viewMode === "WEB" && (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900 print:hidden">
              <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800 text-xs text-slate-500">
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  {isAr ? "معاينة الوثيقة المنسقة" : "Rendered Markdown Document"}
                </span>
                <span className="font-mono text-[11px] text-slate-400">
                  {report.filename}
                </span>
              </div>
              <div className="max-h-[750px] overflow-y-auto pe-2">
                <MarkdownViewer content={report.content_markdown} isAr={docLang === "ar"} />
              </div>
            </div>
          )}

          {/* 3. Raw Code Markdown View */}
          {viewMode === "RAW" && (
            <div className="rounded-2xl border border-slate-200 bg-slate-950 p-5 shadow-xs dark:border-slate-800 print:hidden">
              <div className="mb-3 flex items-center justify-between border-b border-slate-800 pb-2.5 text-xs text-slate-400 font-mono">
                <span>{report.filename}</span>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="inline-flex items-center gap-1 text-[11px] text-indigo-400 hover:text-indigo-300 cursor-pointer"
                >
                  <Copy className="h-3 w-3" />
                  <span>{isAr ? "نسخ كود Markdown" : "Copy Markdown"}</span>
                </button>
              </div>
              <pre className="max-h-[700px] overflow-auto font-mono text-[11px] text-slate-200 whitespace-pre-wrap leading-relaxed">
                {report.content_markdown}
              </pre>
            </div>
          )}

          {/* Print Anchor: When not in DOCUMENT view, ensure the executive document sheet is still printed */}
          {viewMode !== "DOCUMENT" && (
            <div className="hidden print:block">
              <ExecutiveReportDocument
                decision={decision}
                simulation={simulation}
                recommendation={recommendation}
                report={report}
                isAr={docLang === "ar"}
              />
            </div>
          )}
        </div>

        {/* Audit Metadata & Quick Governance Sidebar (Screen Only) */}
        <aside className="space-y-4 print:hidden">
          {/* Document Verification & Security Badge */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-4">
            <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold text-xs uppercase tracking-wide">
              <ShieldCheck className="h-4 w-4" />
              <span>{isAr ? "بيانات التحقق والاعتماد" : "Audit & Verification"}</span>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400 block">
                  {isAr ? "توقيت الإنشاء الرقمي" : "Generation Timestamp"}
                </span>
                <span className="font-semibold text-slate-800 dark:text-slate-200 text-[11px]">
                  {new Date(report.generated_at).toLocaleString(isAr ? "ar-SA" : undefined)}
                </span>
              </div>

              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400 block">
                  {isAr ? "بصمة التحقق الرقمية (SHA-256)" : "Integrity Checksum"}
                </span>
                <span className="font-mono text-[10px] text-slate-500 break-all bg-slate-50 dark:bg-slate-950 p-1.5 rounded-lg border border-slate-200/70 dark:border-slate-800 block mt-1">
                  {report.checksum || (isAr ? "محمي برقم قيد مشفر" : "Verified SHA-256 Digest")}
                </span>
              </div>

              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400 block">
                  {isAr ? "محرك الصياغة والمحاكاة" : "Authoring Engine"}
                </span>
                <span className="font-medium text-slate-800 dark:text-slate-200 text-[11px] block mt-0.5">
                  RippleIQ Institutional Simulation v0.1.0
                </span>
              </div>

              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400 block">
                  {isAr ? "حالة المراجعة البشرية" : "Human Review Status"}
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md mt-1 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900">
                  <Sparkles className="h-3 w-3" />
                  {isAr ? "مطلوبة قبل الاعتماد النهائي" : "Mandatory for Execution"}
                </span>
              </div>
            </div>

            <div className="border-t border-slate-100 dark:border-slate-800 pt-3 text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
              {isAr
                ? "هذه المذكرة مهيأة للمشاركة المباشرة مع أعضاء مجلس الإدارة واللجان المعنية عبر ملف PDF أو التقرير المطبوع."
                : "This document is verified and formatted for direct distribution to board members and executive committees."}
            </div>
          </div>

          {/* Quick Navigation Action */}
          <Link
            href="/dashboard"
            className="w-full flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 transition shadow-xs"
          >
            <ArrowLeft className="h-3.5 w-3.5 rtl:rotate-180" />
            <span>{isAr ? "العودة للوحة التحكم" : "Return to Dashboard"}</span>
          </Link>
        </aside>
      </div>
    </div>
  );
}
