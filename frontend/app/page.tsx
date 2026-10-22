"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Compass,
  ArrowRight,
  ShieldCheck,
  GitCompare,
  Users2,
  FileText,
  Activity,
  CheckCircle2,
  Sparkles,
  ShieldAlert,
  HelpCircle,
  ChevronDown,
  XCircle,
  BrainCircuit,
  Check,
} from "lucide-react";
import { useLocale } from "@/components/LocaleProvider";
import { LanguageToggle } from "@/components/LanguageToggle";
import { ThemeToggle } from "@/components/ThemeToggle";
import { FacebookLink } from "@/components/FacebookLink";

export default function HomePage() {
  const { locale, isRtl } = useLocale();
  const isAr = locale === "ar";
  const [activeScenario, setActiveScenario] = useState<1 | 2 | 3>(2);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const scenariosData = {
    1: {
      number: "01",
      title: isAr
        ? "كما كُتب: دوام صارم 4 أيام"
        : "As Written: Strict 4-Day Attendance",
      tagline: isAr
        ? "إغلاق كامل للحرم الجامعي يوم الجمعة في جميع الكليات"
        : "Total Friday Campus Shutdown across all faculties",
      feasibility: 68,
      recommended: false,
      summary: isAr
        ? "تكثيف كافة المحاضرات والمرافق المساندة من الاثنين إلى الخميس. توفير كبير في الطاقة والنقل، ولكن تواجه المعامل البحثية مخاطر اضطراب التحكم الحراري وصعوبة رعاية التجارب الحية."
        : "All instruction and auxiliary facilities condense into Monday–Thursday. Significant energy and transit savings, but research laboratories face thermal disruptions and animal facility access risks.",
      impacts: isAr
        ? [
            { group: "الطلاب", text: "أيام دراسية أطول (8 ص - 6 م) مع عطلة نهاية أسبوع 3 أيام للدراسة الذاتية", tone: "positive" },
            { group: "المعامل", text: "تنبيهات التخزين المبرد وصعوبة وصول الباحثين المادي يوم الجمعة", tone: "negative" },
            { group: "النقل والخدمات", text: "انخفاض بنسبة 20% في ازدحام الحرم الجامعي ومواقف السيارات", tone: "positive" },
          ]
        : [
            { group: "Students", text: "Longer instructional days (8am–6pm) with 3-day weekend for study", tone: "positive" },
            { group: "Laboratories", text: "Cold storage alarms and restricted physical researcher access on Friday", tone: "negative" },
            { group: "Transportation", text: "20% drop in campus transit congestion and parking pressure", tone: "positive" },
          ],
      tradeoffs: isAr
        ? "وفر مالي وطاقي مرتفع، لكن مع مخاطر غير مقبولة على المعامل الرطبة والاعتماد الأكاديمي للبحوث الجارية."
        : "High financial/energy savings, but unacceptable risk to wet laboratories and ongoing research accreditation.",
    },
    2: {
      number: "02",
      title: isAr
        ? "معدّل: حماية المعامل والخدمات المساندة"
        : "Modified: Lab & Auxiliary Protection",
      tagline: isAr
        ? "أسبوع دراسي 4 أيام مع استمرار الوصول الكامل للأبحاث"
        : "4-Day Academic Week with Continuous Research Access",
      feasibility: 92,
      recommended: true,
      summary: isAr
        ? "تحويل التدريس الجامعي إلى 4 أيام (الاثنين-الخميس)، مع الإبقاء على تشغيل المعامل والمرافق الحيوية يوم الجمعة بجدول مكيف وطاقة مخفضة."
        : "Undergraduate instruction moves to 4 days (Mon–Thu), while research labs, clinical facilities, and essential services maintain continuous Friday operations with reduced HVAC footprint.",
      impacts: isAr
        ? [
            { group: "التدريسيون والباحثون", text: "فترة بحث وتصحيح مخصصة وغير منقطعة يوم الجمعة", tone: "positive" },
            { group: "المعامل البحثية", text: "صفر تعطيل للبحوث مع إشراف مستمر على السلامة الحيوية والتبريد", tone: "positive" },
            { group: "إدارة الحرم", text: "تعديل جداول الكوادر المساندة لتوفير تغطية جزئية يوم الجمعة", tone: "neutral" },
          ]
        : [
            { group: "Faculty & Researchers", text: "Dedicated uninterrupted Friday research and grading block", tone: "positive" },
            { group: "Laboratories", text: "Zero research disruption with continuous biosafety & cold storage oversight", tone: "positive" },
            { group: "Administration", text: "Auxiliary staff scheduling adjustments required for partial Friday coverage", tone: "neutral" },
          ],
      tradeoffs: isAr
        ? "توازن استراتيجي مثالي: يحقق 80% من مزايا مرونة الجداول مع القضاء التام على المخاطر الكارثية بالمرافق الحيوية."
        : "Optimal balance: captures 80% of schedule flexibility benefits while eliminating catastrophic research facility risks.",
    },
    3: {
      number: "03",
      title: isAr
        ? "مرحلي محدود: تجربة لمدة عام"
        : "Limited Pilot: 1-Year Phased Rollout",
      tagline: isAr
        ? "تطبيق تجريبي على كليات العلوم الإنسانية والاجتماعية فقط"
        : "Humanities & Social Sciences Pilot Only",
      feasibility: 78,
      recommended: false,
      summary: isAr
        ? "حصر جدول الـ 4 أيام على الأقسام غير المعملية للعام الجامعي 2026–2027، وجمع بيانات تجريبية حول الحضور والأداء قبل الاعتماد الشامل."
        : "Confines the 4-day schedule to non-laboratory departments for academic year 2026–2027. Gathers empirical attendance and performance data before broader institutional adoption.",
      impacts: isAr
        ? [
            { group: "مجموعات التجربة", text: "تحقق منخفض المخاطر للتعلم الرقمي غير المتزامن يوم الجمعة", tone: "positive" },
            { group: "عمليات الحرم", text: "تعقيد إداري ناتج عن جدول مزدوج واختلاف مسارات النقل", tone: "negative" },
            { group: "الطلاب", text: "تفاوت بين متطلبات التخصصات المعملية والنظرية", tone: "negative" },
          ]
        : [
            { group: "Pilot Cohorts", text: "Low-risk validation of asynchronous digital Friday learning", tone: "positive" },
            { group: "Campus Operations", text: "Dual-schedule administrative complexity and mixed transit routes", tone: "negative" },
            { group: "Students", text: "Disparity between laboratory and non-laboratory degree expectations", tone: "negative" },
          ],
      tradeoffs: isAr
        ? "مخاطر تشغيلية منخفضة في البداية، ولكنه يسبب تفككاً إدارياً وجدولياً عبر المقررات المشتركة."
        : "Lower initial operational disruption, but introduces institutional scheduling fragmentation across shared courses.",
    },
  };

  const current = scenariosData[activeScenario];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-indigo-500 selection:text-white dark:bg-slate-950 dark:text-slate-100">
      {/* Top Announcement Bar */}
      <div className="border-b border-indigo-100 bg-indigo-50/70 px-4 py-2 text-center text-xs text-indigo-900 dark:border-indigo-500/20 dark:bg-gradient-to-r dark:from-indigo-950 dark:via-slate-900 dark:to-indigo-950 dark:text-indigo-200">
        <span className="inline-flex items-center gap-1.5 font-medium">
          <Sparkles className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
          <span>
            {isAr
              ? "عرض هاكاثون DevPost · محرك ذكاء القرارات المؤسسية للتعليم العالي"
              : "DevPost Hackathon Showcase · Institutional Decision Intelligence Engine"}
          </span>
          <span className="hidden sm:inline text-indigo-300 dark:text-indigo-400">|</span>
          <span className="hidden sm:inline font-mono text-[11px] text-indigo-700 dark:text-indigo-300">
            {isAr ? "المراجعة_البشرية_مطلوبة: نعم" : "human_review_required: true"}
          </span>
        </span>
      </div>

      {/* Main Navigation */}
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur-md dark:border-slate-800/80 dark:bg-slate-950/90">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5 sm:px-8">
          <Link href="/" className="group flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-600/30 transition-transform group-hover:rotate-45">
              <Compass className="h-5 w-5" />
            </span>
            <div className="flex flex-col">
              <span className="text-lg font-bold tracking-tight text-slate-950 dark:text-white">
                Ripple<span className="text-indigo-600 dark:text-indigo-400">IQ</span>
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                {isAr ? "ذكاء القرارات" : "Decision Intelligence"}
              </span>
            </div>
          </Link>

          <nav className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm">
            <LanguageToggle />
            <ThemeToggle />
            <Link
              href="/login"
              className="rounded-lg border border-slate-300 px-3.5 py-1.5 font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-900 transition"
            >
              {isAr ? "تسجيل الدخول" : "Sign In"}
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-1.5 font-semibold text-white shadow-sm hover:bg-indigo-500 transition"
            >
              <span>{isAr ? "استكشاف العرض التجريبي" : "Explore Demo"}</span>
              <ArrowRight className="h-3.5 w-3.5 rtl:rotate-180" />
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 sm:pt-20 sm:pb-28">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(99,102,241,0.15),transparent)] dark:bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(99,102,241,0.25),transparent)]" />
        <div className="pointer-events-none absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 h-96 w-96 rounded-full bg-indigo-600/10 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-3.5 py-1 text-xs font-semibold text-indigo-800 shadow-xs dark:border-indigo-500/30 dark:bg-indigo-950/60 dark:text-indigo-300 backdrop-blur-xs">
              <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>
                {isAr
                  ? "ذكاء القرارات المؤسسية لمؤسسات التعليم العالي والجامعات"
                  : "Institutional Decision Intelligence for Higher Education"}
              </span>
            </div>

            <h1 className="text-4xl font-extrabold tracking-tight sm:text-6xl text-slate-950 dark:text-white leading-tight">
              {isAr
                ? "شاهد الآثار التتابعية المتتالية قبل أن تقرر مؤسستك."
                : "See the cascading ripples before your organization decides."}
            </h1>

            <p className="text-base text-slate-600 dark:text-slate-300 sm:text-lg leading-relaxed">
              {isAr
                ? "تقيّم قيادات الجامعات السياسات المعقدة عبر محاكاة استشرافية متعددة الأطراف. خريطة تفاعلية لـ 5 فئات رئيسية، ومقارنة لـ 3 مسارات بديلة، مع كشف المخاطر التشغيلية الخفية وصياغة مذكرات قرارات تدقيقية رفيعة المستوى."
                : "University leadership evaluates complex policies through multi-stakeholder simulations. Map 5 core campus constituencies, compare 3 alternative pathways, surface hidden operational risks, and produce audit-ready decision memoranda."}
            </p>

            <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-600/20 hover:bg-indigo-500 transition"
              >
                <span>{isAr ? "تشغيل مساحة العرض التفاعلية" : "Launch Interactive Demo Workspace"}</span>
                <ArrowRight className="h-4 w-4 rtl:rotate-180" />
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-800 hover:bg-slate-50 shadow-xs dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-200 dark:hover:bg-slate-800 transition"
              >
                <span>{isAr ? "تسجيل الدخول المؤسسي" : "Sign in with Institution"}</span>
              </Link>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-6 pt-4 text-xs text-slate-600 dark:text-slate-400">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                <span>{isAr ? "محرك احتمالي شفاف وقابل للتفسير" : "Deterministic explainable engine"}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                <span>{isAr ? "المراجعة البشرية إلزامية بالتصميم" : "Human review required by design"}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Activity className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                <span>{isAr ? "قياس دقيق لعدم اليقين والمخاطر" : "Uncertainty & risk quantified"}</span>
              </div>
            </div>
          </div>

          {/* Interactive Live Decision Preview Simulator */}
          <div className="mt-14 rounded-2xl border border-slate-200 bg-white p-5 sm:p-8 shadow-xl shadow-slate-200/50 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/95 dark:shadow-2xl dark:shadow-indigo-950/40">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-5 dark:border-slate-800">
              <div>
                <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                  {isAr ? "معاينة حية للمحاكي التفاعلي" : "Interactive Simulator Preview"}
                </span>
                <h2 className="text-lg font-bold sm:text-xl text-slate-950 dark:text-white">
                  {isAr
                    ? "مقترح سياسة جامعية: التحول إلى جدول دراسي لـ 4 أيام"
                    : "University Policy Proposal: 4-Day Attendance Shift"}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {isAr
                    ? "حرم جامعي يضم 28,000 طالب · 1,400 تدريسي · 85 معمل أبحاث رطبة · 68.5% نسبة اعتماد على النقل العام"
                    : "Campus of 28,000 students · 1,400 faculty · 85 wet research laboratories · 68.5% transit dependency"}
                </p>
              </div>

              {/* Scenario Toggle Pills */}
              <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-100 p-1 dark:border-slate-800 dark:bg-slate-950">
                {([1, 2, 3] as const).map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setActiveScenario(num)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition cursor-pointer ${
                      activeScenario === num
                        ? "bg-indigo-600 text-white shadow-sm"
                        : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                    }`}
                  >
                    {isAr ? `سيناريو 0${num}` : `Scenario 0${num}`}
                    {scenariosData[num].recommended && (
                      <span className="ms-1.5 rounded bg-emerald-500/20 px-1 py-0.2 text-[9px] font-bold text-emerald-700 dark:bg-emerald-400/20 dark:text-emerald-300">
                        {isAr ? "الموصى به" : "Pick"}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Active Scenario Card Preview */}
            <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
              {/* Left Column: Overview & Feasibility */}
              <div className="space-y-4 lg:col-span-1 rounded-xl border border-slate-200/80 bg-slate-50/80 p-5 dark:border-slate-800/80 dark:bg-slate-950/60">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold uppercase text-slate-500 dark:text-slate-400">
                    {isAr ? `سيناريو ${current.number}` : `Scenario ${current.number}`}
                  </span>
                  {current.recommended ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-bold text-emerald-800 dark:bg-emerald-500/20 dark:border-emerald-400/40 dark:text-emerald-300">
                      <Sparkles className="h-3 w-3" />
                      {isAr ? "خيار القيادة الموصى به" : "Executive Pick"}
                    </span>
                  ) : (
                    <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                      {isAr ? "مسار مقارنة بديل" : "Comparative Pathway"}
                    </span>
                  )}
                </div>

                <div>
                  <h3 className="text-base font-bold text-slate-950 dark:text-white">{current.title}</h3>
                  <p className="text-xs text-indigo-600 dark:text-indigo-300/80 mt-0.5">{current.tagline}</p>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-600 font-medium dark:text-slate-400">
                      {isAr ? "درجة الجدوى التشغيلية" : "Heuristic Feasibility"}
                    </span>
                    <span className="font-bold text-indigo-600 font-mono dark:text-indigo-400">{current.feasibility}%</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        current.feasibility >= 85 ? "bg-emerald-500" : "bg-indigo-600"
                      }`}
                      style={{ width: `${current.feasibility}%` }}
                    />
                  </div>
                </div>

                <p className="text-xs text-slate-700 leading-relaxed dark:text-slate-300">{current.summary}</p>

                <div className="pt-2 border-t border-slate-200 text-[11px] text-slate-600 dark:border-slate-800 dark:text-slate-400">
                  <strong className="text-slate-900 dark:text-slate-200">
                    {isAr ? "المفاضلة الاستراتيجية:" : "Executive Trade-Off:"}
                  </strong>{" "}
                  {current.tradeoffs}
                </div>
              </div>

              {/* Middle Column: Stakeholder Ripple Effects */}
              <div className="space-y-4 lg:col-span-2 rounded-xl border border-slate-200/80 bg-slate-50/80 p-5 dark:border-slate-800/80 dark:bg-slate-950/60">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                    {isAr ? "الآثار التتابعية المحاكاة حسب أصحاب المصلحة" : "Simulated Ripple Impacts by Stakeholder"}
                  </h4>
                  <span className="text-[10px] font-mono text-slate-500">
                    {isAr ? "5 فئات متابعة" : "5 Groups Monitored"}
                  </span>
                </div>

                <div className="space-y-2.5">
                  {current.impacts.map((impact, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-3 rounded-xl border border-slate-200/80 bg-white p-3 shadow-xs dark:border-slate-800 dark:bg-slate-900/80"
                    >
                      <span
                        className={`mt-0.5 shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                          impact.tone === "positive"
                            ? "bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-500/20 dark:border-emerald-400/30 dark:text-emerald-300"
                            : impact.tone === "negative"
                            ? "bg-rose-50 text-rose-800 border border-rose-200 dark:bg-rose-500/20 dark:border-rose-400/30 dark:text-rose-300"
                            : "bg-amber-50 text-amber-800 border border-amber-200 dark:bg-amber-500/20 dark:border-amber-400/30 dark:text-amber-300"
                        }`}
                      >
                        {impact.group}
                      </span>
                      <p className="text-xs text-slate-700 leading-relaxed flex-1 dark:text-slate-200">{impact.text}</p>
                    </div>
                  ))}
                </div>

                {/* Bottom Bar Notice */}
                <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-200 pt-4 dark:border-slate-800">
                  <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                    <ShieldAlert className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
                    <span>
                      {isAr
                        ? "مخرجات التحليل هي نماذج استشارية استكشافية. تحتفظ القيادة بالقرار البشري النهائي الكامل."
                        : "Analysis output is an advisory model. Leadership retains full final review."}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4 Core Pillars of Institutional Trust */}
      <section className="border-t border-slate-200/80 bg-slate-100/60 py-16 sm:py-24 dark:border-slate-800/80 dark:bg-slate-900/50">
        <div className="mx-auto max-w-7xl px-4 sm:px-8">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
              {isAr ? "مبادئ الحوكمة المؤسسية" : "Institutional Governance Tenets"}
            </span>
            <h2 className="text-2xl font-bold sm:text-3xl text-slate-950 dark:text-white">
              {isAr
                ? "مصمم خصيصاً للقرارات المصيرية في التعليم العالي"
                : "Built specifically for high-stakes higher education decisions"}
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {isAr
                ? "بخلاف حلول الذكاء الاصطناعي العامة، يفرض RippleIQ قيوداً شفافة، ودرجات ثقة واضحة، مع إلزامية المداولة البشرية المستقلة."
                : "Unlike generic LLM wrappers, RippleIQ enforces transparent constraints, explicit confidence ratings, and mandatory human deliberation."}
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: ShieldCheck,
                title: isAr ? "المراجعة البشرية إلزامية" : "Human Review Required",
                desc: isAr
                  ? "كل توصية تتطلب توقيعاً واعتماداً بشرياً صريحاً. لا تتخذ المنصة أي قرار ملزم للمؤسسة تلقائياً."
                  : "Every recommendation explicitly requires human sign-off. The platform cannot automate or commit institutional decisions.",
                color: "text-amber-500 dark:text-amber-400",
                badge: isAr ? "إلزامي" : "Mandatory",
              },
              {
                icon: Users2,
                title: isAr ? "5 فئات رئيسية للأطراف" : "5 Core Stakeholders",
                desc: isAr
                  ? "تقييم الآثار التتابعية على الطلاب، والتدريسيين، ومعامل الأبحاث، والإدارة، وشبكات النقل."
                  : "Evaluates cascading ripples across Students, Faculty, Research Laboratories, Administration, and Transit systems.",
                color: "text-indigo-600 dark:text-indigo-400",
                badge: isAr ? "شامل" : "Holistic",
              },
              {
                icon: GitCompare,
                title: isAr ? "3 سيناريوهات للمقارنة" : "3 Comparative Scenarios",
                desc: isAr
                  ? "لا يفرض خياراً ثنائياً أبداً. يولّد مسارات: كما كُتب، حماية المعامل، وتجربة مرحلية مع درجات الجدوى."
                  : "Never forces a binary yes/no. Generates As-Written, Modified Protection, and Phased Pilot options with feasibility scores.",
                color: "text-emerald-600 dark:text-emerald-400",
                badge: isAr ? "مفاضلات" : "Trade-offs",
              },
              {
                icon: FileText,
                title: isAr ? "تصدير جاهز للتدقيق" : "Audit-Ready Export",
                desc: isAr
                  ? "توليد مذكرات جاهزة لمجلس الإدارة، وملخصات Word (.docx)، وسجلات Markdown متوافقة مع متطلبات الامتثال."
                  : "Generates formatted board-ready memoranda, Word (.docx) executive summaries, and raw compliance Markdown records.",
                color: "text-sky-600 dark:text-sky-400",
                badge: isAr ? "حوكمة" : "Governance",
              },
            ].map((pillar) => {
              const Icon = pillar.icon;
              return (
                <div
                  key={pillar.title}
                  className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs hover:border-indigo-400/80 hover:shadow-md transition-all group dark:border-slate-800 dark:bg-slate-950 dark:hover:border-indigo-500/50"
                >
                  <div className="flex items-center justify-between">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 group-hover:bg-indigo-50 transition dark:bg-slate-900 dark:group-hover:bg-indigo-950/60">
                      <Icon className={`h-5 w-5 ${pillar.color}`} />
                    </span>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                      {pillar.badge}
                    </span>
                  </div>
                  <h3 className="mt-4 text-base font-bold text-slate-950 dark:text-white">{pillar.title}</h3>
                  <p className="mt-2 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{pillar.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 6-Stage Workflow Journey */}
      <section className="border-t border-slate-200/80 py-16 sm:py-24 dark:border-slate-800/80">
        <div className="mx-auto max-w-7xl px-4 sm:px-8">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
              {isAr ? "دورة حياة القرار المؤسسي" : "The Decision Lifecycle"}
            </span>
            <h2 className="text-2xl font-bold sm:text-3xl text-slate-950 dark:text-white">
              {isAr
                ? "من المقترح التشغيلي الأولي إلى المذكرة النهائية المحكمة"
                : "From operational proposal to synthesized memorandum"}
            </h2>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-6">
            {(isAr
              ? [
                  { step: "01", name: "السياق", label: "إدخال تعداد الطلاب، المعامل، النقل، ومستندات السياسات" },
                  { step: "02", name: "السيناريوهات", label: "توليد 3 مسارات تنفيذية متوازنة للمقارنة" },
                  { step: "03", name: "الآثار", label: "رسم الآثار الإيجابية والسلبية على الفئات الخمس" },
                  { step: "04", name: "المخاطر", label: "معايرة الشدة والاحتمالية على مصفوفة 3×3" },
                  { step: "05", name: "التوصية", label: "تقديم درجة الثقة، ومسوغات القرار، والتحسين التكراري" },
                  { step: "06", name: "المذكرة", label: "تصدير مذكرة متوافقة لمجلس الإدارة بصيغة Word أو Markdown" },
                ]
              : [
                  { step: "01", name: "Context", label: "Input institutional headcount, labs, transit, and PDF constraints" },
                  { step: "02", name: "Scenarios", label: "Generate 3 comparative implementation pathways" },
                  { step: "03", name: "Ripples", label: "Map positive and adverse consequences across 5 constituent groups" },
                  { step: "04", name: "Risks", label: "Calibrate severity and likelihood on a 3x3 Risk Matrix" },
                  { step: "05", name: "Synthesize", label: "Deliver confidence score, core rationale, and AI refinement" },
                  { step: "06", name: "Memorandum", label: "Export audit-grade board memorandum to Word or Markdown" },
                ]
            ).map((stage) => (
              <div
                key={stage.step}
                className="relative flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900/60"
              >
                <div>
                  <span className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400">
                    {isAr ? `مرحلة ${stage.step}` : `Stage ${stage.step}`}
                  </span>
                  <h3 className="mt-1 text-sm font-bold text-slate-950 dark:text-white">{stage.name}</h3>
                  <p className="mt-2 text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">{stage.label}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <Link
              href="/decisions/new"
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-bold text-white shadow-md hover:bg-indigo-500 transition"
            >
              <span>{isAr ? "إنشاء أول مقترح سياسة جديد" : "Create Your First Policy Proposal"}</span>
              <ArrowRight className="h-4 w-4 rtl:rotate-180" />
            </Link>
          </div>
        </div>
      </section>

      {/* Executive Comparison Table (GEO & Search Citable Matrix) */}
      <section className="border-t border-slate-200/80 py-16 sm:py-24 bg-slate-50/50 dark:border-slate-800/80 dark:bg-slate-950/40">
        <div className="mx-auto max-w-7xl px-4 sm:px-8">
          <div className="text-center max-w-2xl mx-auto space-y-2 mb-12">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1 text-xs font-mono font-bold uppercase tracking-wider text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300">
              <BrainCircuit className="h-3.5 w-3.5" />
              <span>{isAr ? "مقارنة منهجيات اتخاذ القرار" : "Decision Methodologies Compared"}</span>
            </span>
            <h2 className="text-2xl font-extrabold sm:text-3xl text-slate-950 dark:text-white">
              {isAr
                ? "اتخاذ القرار الانطباعي مقابل محاكاة RippleIQ لذكاء القرارات"
                : "Traditional Intuitive Decisions vs. RippleIQ Simulation"}
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
              {isAr
                ? "تُظهر الأبحاث المؤسسية أن 70% من السياسات تفشل بسبب تداعيات الدرجة الثانية غير المحسوبة مسبقاً."
                : "Studies indicate 70% of organizational policy failures stem from unforecasted secondary friction."}
            </p>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-200/90 bg-white shadow-xs dark:border-slate-800/90 dark:bg-slate-900/80">
            <table className="w-full text-left rtl:text-right border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 dark:border-slate-800 dark:bg-slate-950/80">
                  <th className="py-4 px-5 font-bold text-slate-700 dark:text-slate-300">
                    {isAr ? "معيار التقييم والحوكمة" : "Governance Dimension"}
                  </th>
                  <th className="py-4 px-5 font-bold text-rose-700 dark:text-rose-400">
                    {isAr ? "النهج التقليدي (الحدس واللجان)" : "Traditional Approach (Manual)"}
                  </th>
                  <th className="py-4 px-5 font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50/50 dark:bg-indigo-950/30">
                    {isAr ? "منظومة RippleIQ لذكاء القرارات" : "RippleIQ Decision Intelligence"}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {[
                  {
                    dimAr: "كشف التداعيات الثانوية غير المرئية",
                    dimEn: "Second-Order Ripple Effect Detection",
                    tradAr: "غائب غالباً، وتظهر العواقب كمفاجآت ميدانية واحتكاك وظيفي بعد التطبيق.",
                    tradEn: "Usually blind; secondary friction manifests as operational surprises post-rollout.",
                    rippAr: "محاكاة خوارزمية استشرافية تقيس الأثر عبر 5 فئات من المعنيين وسلاسل الإمداد.",
                    rippEn: "Algorithmic simulation proactively tracing ripples across 5 stakeholder vectors.",
                  },
                  {
                    dimAr: "زمن إعداد دراسة الأثر والمراجعة",
                    dimEn: "Assessment Turnaround Time",
                    tradAr: "3 إلى 5 أسابيع من الاجتماعات والمسودات المبعثرة.",
                    tradEn: "3–5 weeks of manual committees and scattered drafts.",
                    rippAr: "أقل من 60 ثانية لتوليد محاكاة متكاملة للمخاطر والسيناريوهات.",
                    rippEn: "Under 60 seconds for multi-scenario comparative risk assessment.",
                  },
                  {
                    dimAr: "مقارنة المسارات والبدائل التنفيذية",
                    dimEn: "Multi-Scenario Comparative Pathways",
                    tradAr: "نقاش أحادي لـ (نعم أو لا) دون مقايضات كمية متوازنة.",
                    tradEn: "Binary yes/no deliberation without balanced quantitative trade-offs.",
                    rippAr: "3 مسارات متوازنة (كما كُتب، المتوازن الموصى به، والمرحلي التجريبي).",
                    rippEn: "3 calibrated pathways (As-Written, Balanced Recommendation, Phased Pilot).",
                  },
                  {
                    dimAr: "معايرة مصفوفة المخاطر التشغيلية والمالية",
                    dimEn: "Operational & Financial Risk Calibration",
                    tradAr: "تقديرات وصفية انطباعية تفتقر للدقة الإحصائية.",
                    tradEn: "Subjective, impressionistic qualitative guesses lacking calibration.",
                    rippAr: "مصفوفة 3×3 دقيقة تقيس الشدة والاحتمالية مع مؤشرات حساسية الميزانية.",
                    rippEn: "3x3 probability vs severity matrix with budget sensitivity bounds.",
                  },
                  {
                    dimAr: "التوثيق ومذكرات مجالس الإدارة",
                    dimEn: "Governance Documentation & Memoranda",
                    tradAr: "محاضر جلسات سردية مطولة يصعب تدقيقها.",
                    tradEn: "Unstructured meeting minutes difficult for board audit.",
                    rippAr: "مذكرة تنفيذية مهيكلة بالركائز الأربع جاهزة للتصدير بصيغة Word و Markdown.",
                    rippEn: "Audit-grade 4-Pillar Executive Memorandum exportable to Word & Markdown.",
                  },
                ].map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition">
                    <td className="py-3.5 px-5 font-semibold text-slate-900 dark:text-slate-100">
                      {isAr ? row.dimAr : row.dimEn}
                    </td>
                    <td className="py-3.5 px-5 text-slate-500 dark:text-slate-400">
                      <div className="flex items-start gap-2">
                        <XCircle className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />
                        <span>{isAr ? row.tradAr : row.tradEn}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-5 text-indigo-950 dark:text-indigo-200 bg-indigo-50/20 dark:bg-indigo-950/20 font-medium">
                      <div className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                        <span>{isAr ? row.rippAr : row.rippEn}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Authoritative GEO / AI SEO FAQ Section */}
      <section className="border-t border-slate-200/80 py-16 sm:py-24 dark:border-slate-800/80">
        <div className="mx-auto max-w-4xl px-4 sm:px-8">
          <div className="text-center space-y-2 mb-12">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1 text-xs font-mono font-bold uppercase tracking-wider text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300">
              <HelpCircle className="h-3.5 w-3.5" />
              <span>{isAr ? "الأسئلة الشائعة وذكاء القرارات" : "Decision Intelligence FAQ"}</span>
            </span>
            <h2 className="text-2xl font-extrabold sm:text-3xl text-slate-950 dark:text-white">
              {isAr
                ? "إجابات شاملة حول محاكاة السياسات وحوكمة القرارات"
                : "Frequently Asked Questions on Decision Simulation"}
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
              {isAr
                ? "دليلك المعرفي لفهم آليات عمل RippleIQ، معالجة الصوت بـ NLP، ونمذجة المخاطر المؤسسية."
                : "Comprehensive guidance on RippleIQ mechanics, NLP voice capture, and risk modeling."}
            </p>
          </div>

          <div className="space-y-3">
            {[
              {
                qAr: "ما هي منصة RippleIQ وكيف تحاكي أثر القرارات المؤسسية؟",
                qEn: "What is RippleIQ and how does it simulate decision impact?",
                aAr: "منصة RippleIQ هي محرك ذكاء قرارات استراتيجي (Decision Intelligence) يقوم بمحاكاة التداعيات غير المرئية (Second-Order Ripples) لأي قرار أو سياسة قبل تطبيقها، من خلال مقارنة 3 سيناريوهات تنفيذية متوازنة وتحديد المقايضات ومستويات الرضا لدى أصحاب المصلحة.",
                aEn: "RippleIQ is a predictive enterprise decision-simulation platform that evaluates the cascading second-order consequences of operational, policy, and budget decisions across multiple stakeholder groups before execution.",
              },
              {
                qAr: "كيف يتنبأ RippleIQ بالمخاطر التشغيلية والمالية غير المتوقعة؟",
                qEn: "How does RippleIQ forecast unintended operational and financial risks?",
                aAr: "تعتمد المنصة على نمذجة دقيقة لمصفوفة المخاطر 3×3 (الشدة والاحتمالية)، مع محاكاة استشرافية لتدفقات الميزانية، سلاسل الإمداد، والأثر المعنوي للكوادر، مما يكشف نقاط الاحتكاك والمفاجآت التشغيلية قبل أن تكلف المؤسسة خسائر مادية أو سمعية.",
                aEn: "The platform calibrates a 3x3 Risk Matrix (Probability vs. Severity) alongside budget sensitivities, supply chain interdependencies, and personnel sentiment to preempt costly blindspots.",
              },
              {
                qAr: "ما هي القطاعات والمؤسسات التي تدعمها منصة RippleIQ؟",
                qEn: "What sectors and organization types does RippleIQ support?",
                aAr: "توفر المنصة قوالب ومؤشرات متخصصة تتكيف تلقائياً مع 5 أنماط رئيسية: الجامعات والمؤسسات الأكاديمية، الشركات التقنية والخاصة، الدوائر والوزارات الحكومية، المنشآت الصحية والمستشفيات، والمنظمات غير الربحية والإنسانية.",
                aEn: "RippleIQ features dynamic presets for 5 core sectors: Universities & Higher Education, Tech & Private Enterprises, Public Sector & Ministries, Healthcare & Hospitals, and NGOs.",
              },
              {
                qAr: "كيف يعمل استوديو الإملاء الصوتي والتحليل اللغوي بالذكاء الاصطناعي في RippleIQ؟",
                qEn: "How does the AI Voice Studio and NLP tokenization pipeline work?",
                aAr: "يتضمن استوديو الإملاء (AI Voice Studio) مسار نقل صوتي مشفر مع معالجة Gemini NLP؛ حيث يحلل الصوت المسجل، ويقوم بالترميز اللغوي (Tokenization) لاستخراج عنوان القرار، تصنيف القسم، تحديد الأفق الزمني والأولوية، وتوزيعها آلياً في الحقول بصياغة حوكمة مهيكلة.",
                aEn: "The AI Voice Studio captures real-time audio waveforms, securely streams to Gemini NLP, tokenizes spoken entities (action verbs, departments, horizons, priorities), and populates proposal fields automatically.",
              },
              {
                qAr: "ما هو هيكل المذكرة التنفيذية (4-Pillar Executive Memo) في RippleIQ؟",
                qEn: "What is the 4-Pillar Executive Memorandum framework?",
                aAr: "تعتمد المنصة منهجية الركائز الأربع للحوكمة الاستراتيجية: 1. السياق والمشكلة الراهنة، 2. الإجراء المقترح ونطاق التغيير، 3. أصحاب المصلحة المتأثرون والمقايضات، 4. مؤشرات النجاح والأفق الزمني؛ لتصدير مذكرات متوافقة مع مجالس الإدارة واللجان القيادية.",
                aEn: "Every policy output is formalized into 4 governance pillars: 1. Current Context & Problem, 2. Proposed Policy & Concrete Actions, 3. Affected Stakeholders & Trade-offs, 4. Key Success Metrics & Time Horizon.",
              },
            ].map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={idx}
                  className="rounded-2xl border border-slate-200/80 bg-white transition-all dark:border-slate-800/80 dark:bg-slate-900/60"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="flex w-full items-center justify-between gap-4 p-4 text-start text-xs sm:text-sm font-bold text-slate-900 dark:text-white"
                  >
                    <span>{isAr ? faq.qAr : faq.qEn}</span>
                    <ChevronDown
                      className={`h-4 w-4 text-slate-400 transition-transform duration-200 shrink-0 ${
                        isOpen ? "rotate-180 text-indigo-600 dark:text-indigo-400" : ""
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-4 pb-4 pt-1 text-xs sm:text-sm leading-relaxed text-slate-600 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800/60 animate-in fade-in duration-150">
                      {isAr ? faq.aAr : faq.aEn}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white px-4 py-8 text-xs text-slate-600 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400 sm:px-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-2">
            <Compass className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            <span className="font-bold text-slate-900 dark:text-slate-200">RippleIQ</span>
            <span>· {isAr ? "ذكاء القرارات المؤسسية" : "Institutional Decision Intelligence"}</span>
          </div>

          <div className="flex items-center gap-3">
            <FacebookLink variant="pill" />
          </div>

          <p className="text-center sm:text-right max-w-xl text-[11px] text-slate-500 dark:text-slate-500">
            {isAr
              ? "تقدم منصة RippleIQ نماذج خوارزمية استشارية لدعم القرار والتداول المؤسسي؛ ويحتفظ القادة بالمسؤولية الكاملة عن القرارات."
              : "RippleIQ provides algorithmic decision-support models for deliberation; humans retain full governance authority."}
          </p>
        </div>
      </footer>
    </div>
  );
}
