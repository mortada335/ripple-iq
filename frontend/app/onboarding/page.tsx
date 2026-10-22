"use client";

import React, { useEffect, useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Building2,
  Save,
  RotateCcw,
  Sparkles,
  CheckCircle2,
  GraduationCap,
  Briefcase,
  Landmark,
  HeartHandshake,
  Building,
  Coins,
  Globe2,
  ShieldCheck,
  Zap,
  Users2,
  Scale,
  FileText,
  BadgeCheck,
  TrendingUp,
} from "lucide-react";
import { toast } from "sonner";
import { CurrencySelect } from "@/components/CurrencySelect";
import { formatCurrency, getCurrencyCodes, getCurrencyLabel } from "@/lib/currency";
import { createOrganization } from "@/lib/api";
import { useAuth } from "@/components/AuthProvider";
import { useLocale } from "@/components/LocaleProvider";
import {
  DEFAULT_ORGANIZATION,
  ORGANIZATION_PRESETS,
  getOrganizationStorageKey,
  readDemoOrganization,
  saveDemoOrganization,
  type OrganizationKind,
  type OrganizationProfile,
} from "@/lib/organization";
import { getActiveOrganizationId } from "@/lib/session";

const kindOptions: Array<{
  value: OrganizationKind;
  labelAr: string;
  labelEn: string;
  descAr: string;
  descEn: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  {
    value: "university",
    labelAr: "جامعة / مؤسسة أكاديمية",
    labelEn: "University",
    descAr: "تعليم عالي، بحث علمي، وكليات",
    descEn: "Higher education, research & academia",
    icon: GraduationCap,
  },
  {
    value: "company",
    labelAr: "شركة / قطاع خاص",
    labelEn: "Company",
    descAr: "أعمال تجارية، تقنية، وصناعة",
    descEn: "Business, tech, and enterprise",
    icon: Briefcase,
  },
  {
    value: "public-sector",
    labelAr: "قطاع حكومي / عام",
    labelEn: "Public Sector",
    descAr: "هيئات، وزارات، ودوائر خدمية",
    descEn: "Ministries, authorities, and civic bodies",
    icon: Landmark,
  },
  {
    value: "nonprofit",
    labelAr: "منظمة غير ربحية",
    labelEn: "Nonprofit",
    descAr: "جمعيات، مبادرات مجتمعية، وإغاثة",
    descEn: "NGOs, charities, and social initiatives",
    icon: HeartHandshake,
  },
  {
    value: "other",
    labelAr: "مؤسسة أخرى",
    labelEn: "Other",
    descAr: "مستشفيات، مراكز أبحاث، ومجمعات",
    descEn: "Hospitals, complexes, and special entities",
    icon: Building,
  },
];

const QUICK_GOALS = [
  { ar: "+ تعظيم كفاءة الميزانية والإنفاق", en: "+ Maximize budget efficiency" },
  { ar: "+ رفع تصنيف الجودة والاعتماد المؤسسي", en: "+ Improve quality & accreditation" },
  { ar: "+ تسريع وتيرة التحول الرقمي والأتمتة", en: "+ Accelerate digital transformation" },
  { ar: "+ رفع رضا المستفيدين وتقليص مدة الانتظار", en: "+ Boost stakeholder satisfaction" },
];

const inputClassName =
  "w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white";

export default function OrganizationOnboardingPage() {
  const router = useRouter();
  const { user, organizations, activeOrganizationId, isDemo, refresh } = useAuth();
  const { locale } = useLocale();
  const isAr = locale === "ar";
  const activeOrganization = organizations.find((item) => item.id === activeOrganizationId);
  const [profile, setProfile] = useState<OrganizationProfile>(DEFAULT_ORGANIZATION);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    const loadProfile = async () => {
      await Promise.resolve();
      if (active) {
        const loaded = readDemoOrganization(activeOrganizationId);
        if (user && activeOrganization) {
          try {
            if (!localStorage.getItem(getOrganizationStorageKey(activeOrganizationId))) {
              loaded.name = activeOrganization.name;
              loaded.country = activeOrganization.country ?? loaded.country;
            }
          } catch {
            /* Retain defaults */
          }
        }
        setProfile(loaded);
      }
    };
    void loadProfile();
    return () => {
      active = false;
    };
  }, [activeOrganization, activeOrganizationId, user]);

  const update = <K extends keyof OrganizationProfile>(key: K, value: OrganizationProfile[K]) => {
    setProfile((current) => ({ ...current, [key]: value }));
  };

  const applyPreset = (presetId: string) => {
    const preset = ORGANIZATION_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;
    setProfile((prev) => ({
      ...prev,
      ...preset.profile,
    }));
    toast.success(isAr ? `تم تطبيق قالب: ${preset.labelAr}` : `Applied preset: ${preset.labelEn}`);
  };

  const addGoalChip = (goalText: string) => {
    const clean = goalText.replace(/^\+\s*/, "").trim();
    if (profile.goals.includes(clean)) return;
    const updated = profile.goals ? `${profile.goals.trim()} • ${clean}` : clean;
    update("goals", updated);
  };

  // Calculate readiness score
  const readiness = useMemo(() => {
    let score = 0;
    if (profile.name.trim().length > 2) score += 25;
    if (profile.kind) score += 15;
    if (profile.industry.trim().length > 1) score += 15;
    if (profile.country.trim().length > 1) score += 15;
    if (profile.goals.trim().length > 5) score += 15;
    if (profile.description.trim().length > 5 || profile.context.trim().length > 5) score += 15;
    return Math.min(score, 100);
  }, [profile]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!profile.name.trim()) {
      toast.error(isAr ? "يرجى إدخال اسم المؤسسة" : "Organization name is required");
      return;
    }

    if (user && !activeOrganization) {
      setSaving(true);
      try {
        await createOrganization({ name: profile.name.trim(), country: profile.country.trim() || null });
        await refresh();
        saveDemoOrganization(profile, getActiveOrganizationId());
        toast.success(isAr ? "تم إنشاء المؤسسة بنجاح!" : "Organization created successfully!", {
          description: isAr
            ? "تم حفظ اسم المؤسسة والبلد، وتم تحديث سياق التحليلات في متصفحك."
            : "Organization name saved. Extended profile context is active for all simulations.",
        });
        router.push("/dashboard");
      } catch (cause) {
        toast.error(isAr ? "تعذر إنشاء المؤسسة" : "Could not create the organization", {
          description: cause instanceof Error ? cause.message : "Try again.",
        });
      } finally {
        setSaving(false);
      }
      return;
    }

    try {
      saveDemoOrganization(profile, activeOrganizationId);
      toast.success(isAr ? "تم حفظ سياق المؤسسة بنجاح" : "Organization context saved successfully", {
        description: isAr
          ? "يتم الآن تضمين هذا السياق المؤسسي تلقائياً في صياغة ومحاكاة كافة القرارات القادمة."
          : "This institutional context will automatically guide all upcoming decision simulations.",
      });
      router.push("/dashboard");
    } catch {
      toast.error(isAr ? "تعذر حفظ الملف التعريفي" : "Could not save the profile");
    }
  };

  const handleReset = () => {
    try {
      saveDemoOrganization(DEFAULT_ORGANIZATION, activeOrganizationId);
      setProfile(DEFAULT_ORGANIZATION);
      toast.success(isAr ? "تمت استعادة الملف الافتراضي" : "Demo profile reset");
    } catch {
      toast.error(isAr ? "تعذر إعادة الضبط" : "Could not reset the profile");
    }
  };

  const currentKind = kindOptions.find((k) => k.value === profile.kind) || kindOptions[0];

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-12">
      {/* Top Navigation & Status Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-medium text-slate-500 hover:text-slate-900 dark:hover:text-white transition"
        >
          <ArrowLeft className="h-4 w-4 rtl:rotate-180" aria-hidden="true" />
          <span>{isAr ? "العودة إلى لوحة التحكم" : "Back to dashboard"}</span>
        </Link>

        {/* Readiness Meter */}
        <div className="inline-flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-white/80 px-4 py-2 shadow-xs backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/80">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-indigo-500" />
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              {isAr ? "اكتمال السياق المؤسسي:" : "Context Readiness:"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-2 w-24 sm:w-32 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-linear-to-r from-indigo-500 to-emerald-500 transition-all duration-500"
                style={{ width: `${readiness}%` }}
              />
            </div>
            <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">{readiness}%</span>
          </div>
        </div>
      </div>

      {/* Hero Header Banner */}
      <header className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-linear-to-b from-white via-slate-50/50 to-slate-100/30 p-6 shadow-xs dark:border-slate-800/80 dark:from-slate-900 dark:via-slate-900/60 dark:to-slate-950 sm:p-8">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-24 end-0 h-72 w-72 rounded-full bg-indigo-500/10 blur-3xl dark:bg-indigo-500/15"
        />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-300 ring-1 ring-indigo-500/20">
                <Building2 className="h-5 w-5" aria-hidden="true" />
              </span>
              <span className="rounded-md bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 text-[11px] font-bold text-indigo-700 dark:text-indigo-300">
                {user ? (activeOrganization ? (isAr ? "سياق المؤسسة المعتمد" : "Active Context") : (isAr ? "إعداد مساحة العمل" : "Workspace Setup")) : (isAr ? "الملف التعريفي التجريبي" : "Demo Workspace")}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-950 dark:text-white">
              {isAr ? "عرّف RippleIQ بمؤسستك وطبيعة عملها" : "Configure Your Organization Profile"}
            </h1>
            <p className="max-w-3xl text-xs sm:text-sm leading-6 text-slate-600 dark:text-slate-400">
              {isAr
                ? "أضف السياق التشغيلي والاستراتيجي والقيود التنظيمية التي توجّه وكلاء الذكاء الاصطناعي أثناء محاكاة قراراتك. تُحفظ هذه البيانات وتُرفق مع سياق كل قرار تقوم بنمذجته."
                : "Add operational constraints, goals, and institutional boundaries. RippleIQ’s multi-stakeholder engines use this context to measure trade-offs and cascading ripple effects."}
            </p>
          </div>

          {/* Quick Presets Bar in Hero */}
          <div className="flex flex-col gap-2 shrink-0 rounded-2xl border border-slate-200/90 bg-white/80 p-4 shadow-xs backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/90 sm:min-w-[280px]">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-indigo-500" />
              {isAr ? "قوالب مؤسسية بنقرة واحدة:" : "1-Click Presets:"}
            </span>
            <div className="grid grid-cols-2 gap-1.5">
              {ORGANIZATION_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => applyPreset(preset.id)}
                  className="rounded-xl border border-slate-200 bg-slate-50/80 px-2.5 py-1.5 text-center text-xs font-semibold text-slate-700 hover:border-indigo-500 hover:bg-indigo-50/50 hover:text-indigo-600 dark:border-slate-800 dark:bg-slate-800/80 dark:text-slate-300 dark:hover:border-indigo-500 dark:hover:text-indigo-300 transition cursor-pointer"
                >
                  {isAr ? preset.labelAr : preset.labelEn}
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* Main 12-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (8 cols): The Comprehensive Form */}
        <div className="lg:col-span-8 space-y-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Card 1: Core Institutional Identity & Classification */}
            <div className="rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-7 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-5">
              <div className="flex items-center gap-2.5 border-b border-slate-100 pb-4 dark:border-slate-800">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
                  <Building2 className="h-4 w-4" />
                </span>
                <div>
                  <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                    {isAr ? "1. الهوية الأساسية والتصنيف المؤسسي" : "1. Core Identity & Institutional Classification"}
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {isAr ? "حدد نوع المؤسسة ونطاق عملها لضبط مسار نمذجة القرارات" : "Select organization kind and official legal classification"}
                  </p>
                </div>
              </div>

              {/* Kind Selector Cards */}
              <div>
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-2.5">
                  {isAr ? "نوع وتصنيف المؤسسة *" : "Organization Classification *"}
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2.5">
                  {kindOptions.map((opt) => {
                    const Icon = opt.icon;
                    const isSelected = profile.kind === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => update("kind", opt.value)}
                        className={`group relative flex items-start gap-3 p-3.5 rounded-2xl border text-start transition cursor-pointer ${
                          isSelected
                            ? "border-indigo-600 bg-indigo-50/70 text-indigo-950 ring-2 ring-indigo-500/20 dark:border-indigo-500 dark:bg-indigo-950/40 dark:text-indigo-200"
                            : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/60 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800/60"
                        }`}
                      >
                        <span
                          className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl transition ${
                            isSelected
                              ? "bg-indigo-600 text-white dark:bg-indigo-500"
                              : "bg-slate-100 text-slate-500 group-hover:text-slate-700 dark:bg-slate-800 dark:text-slate-400"
                          }`}
                        >
                          <Icon className="h-4 w-4" />
                        </span>
                        <div>
                          <p className="text-xs font-bold">{isAr ? opt.labelAr : opt.labelEn}</p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                            {isAr ? opt.descAr : opt.descEn}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Name & Industry */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label htmlFor="org-name-input" className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                    {isAr ? "اسم المؤسسة أو الجامعة *" : "Organization Name *"}
                  </label>
                  <input
                    id="org-name-input"
                    type="text"
                    required
                    maxLength={120}
                    value={profile.name}
                    onChange={(e) => update("name", e.target.value)}
                    placeholder={isAr ? "مثال: جامعة النور التقنية" : "e.g. Al-Noor University"}
                    className={inputClassName}
                    readOnly={Boolean(user && activeOrganization)}
                  />
                  <p className="mt-1 text-[11px] text-slate-400">
                    {isAr ? "الاسم الرسمي المعتمد في التقارير والمذكرات التنفيذية." : "Official name appearing in executive memoranda."}
                  </p>
                </div>

                <div>
                  <label htmlFor="org-industry-input" className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                    {isAr ? "القطاع أو المجال التخصصي" : "Industry / Specialization"}
                  </label>
                  <input
                    id="org-industry-input"
                    type="text"
                    maxLength={120}
                    value={profile.industry}
                    onChange={(e) => update("industry", e.target.value)}
                    placeholder={isAr ? "مثال: التعليم العالي والبحث العلمي" : "e.g. Higher Education"}
                    className={inputClassName}
                  />
                  {/* Industry fast chips */}
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {["تعليم عالي", "تقنية وبرمجيات", "رعاية صحية", "إدارة عامة"].map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => update("industry", tag)}
                        className="rounded-md border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[10px] text-slate-600 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-400"
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Country & Website */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                <div>
                  <label htmlFor="org-country-input" className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                    {isAr ? "البلد أو النطاق الجغرافي" : "Country / Territory"}
                  </label>
                  <input
                    id="org-country-input"
                    type="text"
                    maxLength={100}
                    value={profile.country}
                    onChange={(e) => update("country", e.target.value)}
                    placeholder={isAr ? "العراق" : "Iraq"}
                    className={inputClassName}
                    readOnly={Boolean(user && activeOrganization)}
                  />
                </div>

                <div>
                  <label htmlFor="org-website-input" className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                    {isAr ? "الموقع الإلكتروني الرسمي" : "Official Website"}
                  </label>
                  <input
                    id="org-website-input"
                    type="url"
                    value={profile.website}
                    onChange={(e) => update("website", e.target.value)}
                    placeholder="https://example.edu.iq"
                    className={inputClassName}
                  />
                </div>
              </div>
            </div>

            {/* Card 2: Financial & Currency Defaults */}
            <div className="rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-7 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-4">
              <div className="flex items-center gap-2.5 border-b border-slate-100 pb-4 dark:border-slate-800">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
                  <Coins className="h-4 w-4" />
                </span>
                <div>
                  <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                    {isAr ? "2. العملة المعتمدة والخيارات الإقليمية" : "2. Reporting Currency & Financial Defaults"}
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {isAr ? "تُستخدم لحساب تكاليف السيناريوهات ومؤشرات الجدوى المالية" : "Used to calculate scenario expenditures and budget impact"}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                <div>
                  <label htmlFor="org-currency-select" className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                    {isAr ? "العملة المالية الرئيسية" : "Default Currency"}
                  </label>
                  <CurrencySelect
                    id="org-currency-select"
                    value={profile.currency}
                    onChange={(curr) => update("currency", curr)}
                  />
                </div>

                <div className="rounded-2xl border border-emerald-200/80 bg-emerald-50/50 p-3.5 dark:border-emerald-900/40 dark:bg-emerald-950/20">
                  <div className="flex items-center justify-between text-xs text-emerald-800 dark:text-emerald-300">
                    <span className="font-semibold">{isAr ? "معاينة التنسيق المالي:" : "Currency Live Format:"}</span>
                    <span className="font-mono font-bold text-sm">
                      {formatCurrency(12500000, profile.currency, profile.locale)}
                    </span>
                  </div>
                  <p className="text-[11px] text-emerald-700/80 dark:text-emerald-400/80 mt-1">
                    {isAr ? "تتوافق مع المعيار الدولي ISO 4217 لتوحيد الأرقام والمذكرات." : "Complies with ISO 4217 for financial clarity."}
                  </p>
                </div>
              </div>
            </div>

            {/* Card 3: Strategic Vision, Activity & Constraints */}
            <div className="rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-7 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-5">
              <div className="flex items-center gap-2.5 border-b border-slate-100 pb-4 dark:border-slate-800">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-950 dark:text-purple-400">
                  <TrendingUp className="h-4 w-4" />
                </span>
                <div>
                  <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                    {isAr ? "3. النشاط والأهداف الاستراتيجية ومحددات العمل" : "3. Mission, Strategic Objectives & Operational Guardrails"}
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {isAr ? "توجّه هذه المعلومات تفكير الوكلاء ومحاكاة المقايضات بين أصحاب المصلحة" : "Informs stakeholder trade-off calculations and risk tolerance"}
                  </p>
                </div>
              </div>

              {/* Activity */}
              <div>
                <label htmlFor="org-desc-textarea" className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                  {isAr ? "ما هو نشاط المؤسسة الرئيسي والفئات المستفيدة؟" : "What does your organization do & who does it serve?"}
                </label>
                <textarea
                  id="org-desc-textarea"
                  rows={3}
                  maxLength={1200}
                  value={profile.description}
                  onChange={(e) => update("description", e.target.value)}
                  placeholder={
                    isAr
                      ? "نبذة موجزة عن المؤسسة، جمهورها، وما تقدمه من برامج أو خدمات أو منتجات."
                      : "Brief description of the organization and the community/customers it serves."
                  }
                  className={`${inputClassName} resize-y`}
                />
              </div>

              {/* Goals */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label htmlFor="org-goals-textarea" className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                    {isAr ? "الأهداف الاستراتيجية والمؤشرات الأهم حالياً" : "Current Strategic Objectives & Key Outcomes"}
                  </label>
                  <span className="text-[11px] text-slate-400">
                    {profile.goals.length} / 1200
                  </span>
                </div>
                <textarea
                  id="org-goals-textarea"
                  rows={3}
                  maxLength={1200}
                  value={profile.goals}
                  onChange={(e) => update("goals", e.target.value)}
                  placeholder={
                    isAr
                      ? "ما هي النتائج والمؤشرات الأهم عند تقييم أي قرار؟ (مثال: تعظيم كفاءة الميزانية، تحسين الاعتماد، رضا المستفيدين)"
                      : "What strategic outcomes matter most when evaluating a proposed decision?"
                  }
                  className={`${inputClassName} resize-y`}
                />
                {/* 1-click Goal Chips */}
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  <span className="text-[11px] font-semibold text-slate-400 shrink-0">
                    {isAr ? "اقتراحات سريعة:" : "Quick additions:"}
                  </span>
                  {QUICK_GOALS.map((chip, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => addGoalChip(chip.ar)}
                      className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-xs text-slate-700 hover:border-indigo-400 hover:bg-indigo-50/60 hover:text-indigo-600 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-indigo-500 dark:hover:bg-slate-800 transition cursor-pointer"
                    >
                      {isAr ? chip.ar : chip.en}
                    </button>
                  ))}
                </div>
              </div>

              {/* Constraints */}
              <div>
                <label htmlFor="org-context-textarea" className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                  {isAr ? "القيود التشغيلية والاعتبارات الخاصة (Guardrails)" : "Operational Constraints & Boundaries"}
                </label>
                <textarea
                  id="org-context-textarea"
                  rows={3}
                  maxLength={2000}
                  value={profile.context}
                  onChange={(e) => update("context", e.target.value)}
                  placeholder={
                    isAr
                      ? "القيود التشغيلية، ساعات العمل، اشتراطات الحوكمة، أو أي اعتبارات خاصة ترغب في أخذها بالحسبان (تجنب البيانات الحساسة أو السرية)."
                      : "Operating constraints, shift hours, regulatory limits, or other boundaries your team wants respected."
                  }
                  className={`${inputClassName} resize-y`}
                />
                <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                  {isAr
                    ? "تنبيه: يُرسل هذا السياق لدعم نمذجة كل قرار. تجنب إدخال كلمات سرية أو أسرار تجارية خاصة."
                    : "Note: This context is attached to decision simulations. Avoid confidential credentials."}
                </p>
              </div>
            </div>

            {/* Action Buttons Bar */}
            <div className="rounded-3xl border border-slate-200/90 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900 flex flex-col-reverse sm:flex-row items-center justify-between gap-4">
              <button
                type="button"
                onClick={handleReset}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 px-4 py-2.5 text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                <RotateCcw className="h-4 w-4" />
                <span>{isAr ? "استعادة الملف التجريبي" : "Reset Demo Profile"}</span>
              </button>

              <button
                type="submit"
                disabled={saving}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-7 py-3 text-xs sm:text-sm font-bold text-white hover:bg-indigo-500 disabled:opacity-60 transition shadow-lg shadow-indigo-600/25 cursor-pointer"
              >
                <Save className="h-4 w-4" />
                <span>
                  {saving
                    ? (isAr ? "جارٍ الحفظ وتحديث السياق..." : "Saving Context...")
                    : user && !activeOrganization
                    ? (isAr ? "إنشاء وتفعيل المؤسسة" : "Create Organization")
                    : (isAr ? "حفظ سياق المؤسسة المعتمد" : "Save Organization Context")}
                </span>
              </button>
            </div>
          </form>
        </div>

        {/* Right Column (4 cols): Companion Intelligence & Live Passport */}
        <div className="lg:col-span-4 space-y-6">
          {/* Live Passport Card */}
          <div className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
                {isAr ? "بطاقة هوية المؤسسة الذكية" : "Institutional Passport"}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                <CheckCircle2 className="h-3 w-3" />
                {isAr ? "مفعّل للمحاكاة" : "Active for Simulation"}
              </span>
            </div>

            {/* Emblem & Identity */}
            <div className="flex items-center gap-4 pt-1">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-linear-to-br from-indigo-500 to-purple-600 text-white font-extrabold text-2xl shadow-md shadow-indigo-500/20">
                {profile.name.trim().charAt(0) || "R"}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-bold text-base text-slate-900 dark:text-white truncate">
                  {profile.name.trim() || (isAr ? "مؤسستك (تجريبي)" : "Your Organization")}
                </h3>
                <div className="mt-1 flex flex-wrap items-center gap-1.5">
                  <span className="rounded-md bg-indigo-50 dark:bg-indigo-950 px-2 py-0.5 text-[10px] font-bold text-indigo-700 dark:text-indigo-300">
                    {isAr ? currentKind.labelAr : currentKind.labelEn}
                  </span>
                  <span className="rounded-md bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-[10px] font-semibold text-slate-600 dark:text-slate-300">
                    {profile.country || (isAr ? "العراق" : "Iraq")}
                  </span>
                </div>
              </div>
            </div>

            {/* Passport Detail Items */}
            <div className="space-y-2.5 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
              <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                <span>{isAr ? "القطاع المعتمد:" : "Sector:"}</span>
                <span className="font-semibold text-slate-900 dark:text-white">
                  {profile.industry || (isAr ? "عام" : "General")}
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                <span>{isAr ? "العملة المالية:" : "Currency:"}</span>
                <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                  {profile.currency} ({formatCurrency(1000, profile.currency, locale).replace(/[0-9.,]/g, "").trim()})
                </span>
              </div>
              {profile.website && (
                <div className="flex items-center justify-between text-slate-600 dark:text-slate-400 truncate">
                  <span>{isAr ? "الموقع الرسمي:" : "Domain:"}</span>
                  <a
                    href={profile.website}
                    target="_blank"
                    rel="noreferrer"
                    className="font-mono text-indigo-600 hover:underline dark:text-indigo-400 truncate max-w-[160px]"
                  >
                    {profile.website.replace(/^https?:\/\//, "")}
                  </a>
                </div>
              )}
            </div>

            {/* Checklist of context completeness */}
            <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-800/60 space-y-2">
              <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block">
                {isAr ? "جاهزية المحاكاة المتعددة الأطراف:" : "Simulation Completeness:"}
              </span>
              <ul className="space-y-1.5 text-[11px]">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className={`h-3.5 w-3.5 ${profile.name ? "text-emerald-500" : "text-slate-300"}`} />
                  <span className={profile.name ? "text-slate-700 dark:text-slate-300" : "text-slate-400"}>
                    {isAr ? "الهوية والتصنيف الرسمي" : "Official Classification"}
                  </span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className={`h-3.5 w-3.5 ${profile.industry ? "text-emerald-500" : "text-slate-300"}`} />
                  <span className={profile.industry ? "text-slate-700 dark:text-slate-300" : "text-slate-400"}>
                    {isAr ? "القطاع والجمهور المستهدف" : "Industry & Audience"}
                  </span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className={`h-3.5 w-3.5 ${profile.goals ? "text-emerald-500" : "text-slate-300"}`} />
                  <span className={profile.goals ? "text-slate-700 dark:text-slate-300" : "text-slate-400"}>
                    {isAr ? "الأهداف الاستراتيجية المحددة" : "Strategic Targets"}
                  </span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className={`h-3.5 w-3.5 ${profile.context ? "text-emerald-500" : "text-slate-300"}`} />
                  <span className={profile.context ? "text-slate-700 dark:text-slate-300" : "text-slate-400"}>
                    {isAr ? "القيود التشغيلية والتنظيمية" : "Operational Guardrails"}
                  </span>
                </li>
              </ul>
            </div>
          </div>

          {/* How AI Simulation Uses This Data */}
          <div className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-4">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-indigo-500" />
              <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                {isAr ? "أثر هذا الملف على محاكاة RippleIQ" : "How RippleIQ Applies This Context"}
              </h3>
            </div>
            <div className="space-y-3 text-xs text-slate-600 dark:text-slate-400">
              <div className="flex items-start gap-2.5">
                <Coins className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                <p>
                  <strong className="text-slate-900 dark:text-white">
                    {isAr ? "المسار المالي:" : "Financial Agent:"}
                  </strong>{" "}
                  {isAr
                    ? `يعتمد عملة ${profile.currency} ويقيس تأثير النفقات على ميزانية المؤسسة.`
                    : `Uses ${profile.currency} for scenario NPV and expenditure modeling.`}
                </p>
              </div>
              <div className="flex items-start gap-2.5">
                <Scale className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
                <p>
                  <strong className="text-slate-900 dark:text-white">
                    {isAr ? "المسار التنظيمي:" : "Governance Agent:"}
                  </strong>{" "}
                  {isAr
                    ? `يطابق القرارات مع اشتراطات قطاع (${profile.industry || "العام"}) واللوائح المعتمدة.`
                    : `Validates policy proposals against ${profile.kind} compliance limits.`}
                </p>
              </div>
              <div className="flex items-start gap-2.5">
                <Users2 className="h-4 w-4 text-purple-500 shrink-0 mt-0.5" />
                <p>
                  <strong className="text-slate-900 dark:text-white">
                    {isAr ? "وكيل أصحاب المصلحة:" : "Stakeholders:"}
                  </strong>{" "}
                  {isAr
                    ? "يقيس أثر كل قرار على الطلاب، الموظفين، والمستفيدين بحسب طبيعة المؤسسة."
                    : "Simulates acceptance rates and friction across your user community."}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
