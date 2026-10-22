"use client";

import React from "react";
import { X, ShieldCheck, BookOpen, AlertTriangle, Scale, CheckCircle2 } from "lucide-react";
import { useLocale } from "@/components/LocaleProvider";

interface CharterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CharterModal({ isOpen, onClose }: CharterModalProps) {
  const { locale, isRtl } = useLocale();
  const isAr = locale === "ar";

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs animate-in fade-in duration-200" dir={isRtl ? "rtl" : "ltr"}>
      <div className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900 text-slate-900 dark:text-white">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
              <BookOpen className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold">
                {isAr ? "ميثاق الاستخدام المسؤول لـ RippleIQ" : "Responsible Use of RippleIQ"}
              </h2>
              <p className="text-[11px] text-slate-500">
                {isAr ? "دعم القرارات المؤسسية · نموذج استشاري أولي" : "Organization decision support · Demo prototype"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label={isAr ? "إغلاق النافذة" : "Close modal"}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="max-h-[70vh] overflow-y-auto px-6 py-4 space-y-4 text-xs text-slate-600 dark:text-slate-300">
          <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-3.5 text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-200">
            <div className="flex items-center gap-2 font-bold text-xs mb-1">
              <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              <span>{isAr ? "قاعدة المراجعة البشرية الإلزامية" : "Mandatory Human Review Rule"}</span>
            </div>
            <p className="text-[11px] leading-relaxed">
              {isAr
                ? "تعد مخرجات RippleIQ نماذج استشارية لدعم المداولات ولا تُغني عن التقدير والقرار البشري. يتخذ القادة والجهات المتأثرة القرارات النهائية بعد مراجعة السيناريوهات استناداً لخبراتهم."
                : "RippleIQ analysis is advisory and does not replace human judgment. Organization leaders and affected teams should review scenario recommendations before making a decision."}
            </p>
          </div>

          <div className="space-y-3">
            <h3 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider">
              {isAr ? "كيف يدعم RippleIQ اتخاذ قرارات أفضل" : "How RippleIQ Supports Better Decisions"}
            </h3>

            <div className="grid grid-cols-1 gap-2.5">
              <div className="flex items-start gap-2.5 rounded-xl border border-slate-100 bg-slate-50/50 p-3 dark:border-slate-800/80 dark:bg-slate-800/40">
                <Scale className="h-4 w-4 text-indigo-600 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-slate-900 dark:text-white">
                    {isAr ? "1. تقييم متوازن ومتعدد الأطراف" : "1. Balanced Multi-Stakeholder Evaluation"}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    {isAr
                      ? "تقوم المحاكاة بتقدير الآثار عبر كافة الفئات المتأثرة بالقرار بحيادية تامة دون تحيز إداري أحادي."
                      : "Simulations should evaluate consequences across the groups affected by a decision without organizational bias."}
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-2.5 rounded-xl border border-slate-100 bg-slate-50/50 p-3 dark:border-slate-800/80 dark:bg-slate-800/40">
                <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-slate-900 dark:text-white">
                    {isAr ? "2. احترام القيود التشغيلية والسلامة" : "2. Respect Operational Constraints"}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    {isAr
                      ? "تلتزم المؤسسات بإبراز الخدمات الأساسية، متطلبات السلامة، والمحددات اللوجستية قبل اعتماد أي تحليل."
                      : "Teams should surface essential services, safety requirements, staffing limits, and other constraints before acting on an analysis."}
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-2.5 rounded-xl border border-slate-100 bg-slate-50/50 p-3 dark:border-slate-800/80 dark:bg-slate-800/40">
                <CheckCircle2 className="h-4 w-4 text-indigo-600 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-slate-900 dark:text-white">
                    {isAr ? "3. شفافية الثقة والمحددات التحليلية" : "3. Transparent Confidence & Limitations"}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    {isAr
                      ? "تكشف كل محاكاة بوضوح نسب الثقة التحليلية، والافتراضات الأساسية، والمحددات غير المغطاة."
                      : "Every simulation explicitly discloses analytical confidence percentages, baseline assumptions, and unmodeled boundary conditions."}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end border-t border-slate-200 px-6 py-3.5 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <button
            onClick={onClose}
            className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800 dark:bg-indigo-600 dark:hover:bg-indigo-500 transition cursor-pointer"
          >
            {isAr ? "قرأت وموافق على الميثاق" : "I Acknowledge & Understand"}
          </button>
        </div>
      </div>
    </div>
  );
}
