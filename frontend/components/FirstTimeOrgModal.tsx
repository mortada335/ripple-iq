"use client";

import React, { useEffect, useState, type FormEvent } from "react";
import { usePathname } from "next/navigation";
import {
  Building2,
  Sparkles,
  X,
  CheckCircle2,
  Globe2,
  Coins,
  Compass,
  ArrowRight,
  GraduationCap,
  Briefcase,
  Landmark,
  HeartHandshake,
  Building,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "./AuthProvider";
import { useLocale } from "./LocaleProvider";
import { formatCurrency, getCurrencyCodes, getCurrencyLabel } from "@/lib/currency";
import { CurrencySelect } from "./CurrencySelect";
import { createOrganization } from "@/lib/api";
import {
  DEFAULT_ORGANIZATION,
  ORGANIZATION_PRESETS,
  readDemoOrganization,
  saveDemoOrganization,
  type OrganizationKind,
  type OrganizationProfile,
} from "@/lib/organization";
import { getActiveOrganizationId, setActiveOrganizationId } from "@/lib/session";

const MODAL_STORAGE_KEY = "rippleiq_first_time_modal_seen";

const kindOptions: Array<{
  value: OrganizationKind;
  labelAr: string;
  labelEn: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { value: "university", labelAr: "جامعة / مؤسسة أكاديمية", labelEn: "University", icon: GraduationCap },
  { value: "company", labelAr: "شركة / قطاع خاص", labelEn: "Company", icon: Briefcase },
  { value: "public-sector", labelAr: "قطاع حكومي / عام", labelEn: "Public Sector", icon: Landmark },
  { value: "nonprofit", labelAr: "منظمة غير ربحية", labelEn: "Nonprofit", icon: HeartHandshake },
  { value: "other", labelAr: "مؤسسة أخرى", labelEn: "Other", icon: Building },
];

export function FirstTimeOrgModal() {
  const pathname = usePathname();
  const { user, organizations, activeOrganizationId, isDemo, refresh } = useAuth();
  const { locale, isRtl } = useLocale();
  const isAr = locale === "ar";

  const [isOpen, setIsOpen] = useState(false);
  const [profile, setProfile] = useState<OrganizationProfile>(DEFAULT_ORGANIZATION);
  const [saving, setSaving] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);

  // Listen for manual trigger anywhere in the app (e.g. from Header or Dashboard "+ Create Organization")
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleOpen = () => {
      const current = readDemoOrganization(activeOrganizationId);
      if (user && organizations.length > 0) {
        const activeOrg = organizations.find((o) => o.id === activeOrganizationId);
        if (activeOrg) {
          current.name = activeOrg.name;
          current.country = activeOrg.country ?? current.country;
        }
      } else if (user && organizations.length === 0) {
        current.name = "";
      }
      setProfile(current);
      setIsOpen(true);
      setStep(1);
    };

    window.addEventListener("rippleiq:open-onboarding-modal", handleOpen);

    return () => {
      window.removeEventListener("rippleiq:open-onboarding-modal", handleOpen);
    };
  }, [activeOrganizationId, organizations, user]);

  if (!isOpen) return null;

  const update = <K extends keyof OrganizationProfile>(key: K, value: OrganizationProfile[K]) => {
    setProfile((prev) => ({ ...prev, [key]: value }));
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

  const handleDismiss = () => {
    try {
      localStorage.setItem(MODAL_STORAGE_KEY, "true");
    } catch {
      // Ignore
    }
    setIsOpen(false);
    toast.info(isAr ? "يمكنك دائماً إنشاء أو تعديل بيانات المؤسسة من شريط التنقل أو الإعدادات." : "You can manage organizations anytime from the navigation bar or settings.");
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!profile.name.trim()) {
      toast.error(isAr ? "يرجى إدخال اسم المؤسسة" : "Organization name is required");
      return;
    }

    setSaving(true);
    try {
      const isExistingOrg = organizations.some(
        (o) => o.name.trim().toLowerCase() === profile.name.trim().toLowerCase()
      );
      let targetOrgId = activeOrganizationId;
      if (!isExistingOrg) {
        const newOrg = await createOrganization({
          name: profile.name.trim(),
          country: profile.country.trim() || null,
        });
        targetOrgId = newOrg.id;
        await refresh();
      } else {
        const found = organizations.find(
          (o) => o.name.trim().toLowerCase() === profile.name.trim().toLowerCase()
        );
        if (found) {
          targetOrgId = found.id;
          setActiveOrganizationId(found.id);
        }
      }

      // Save complete extended profile to local context
      saveDemoOrganization(profile, targetOrgId ?? getActiveOrganizationId());
      localStorage.setItem(MODAL_STORAGE_KEY, "true");

      toast.success(isAr ? "تم إعداد مساحة المؤسسة بنجاح!" : "Organization profile configured successfully!", {
        description: isAr
          ? "أصبحت منصة RippleIQ جاهزة الآن لمحاكاة القرارات بناءً على سياق مؤسستك."
          : "RippleIQ is now tailored to simulate decisions for your organization.",
      });

      setIsOpen(false);
    } catch (err) {
      toast.error(isAr ? "تعذر حفظ بيانات المؤسسة" : "Could not save organization data", {
        description: err instanceof Error ? err.message : "Try again",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboarding-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/75 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-2xl max-h-[92vh] flex flex-col rounded-3xl border border-slate-200/90 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900 overflow-hidden text-slate-900 dark:text-slate-100">
        {/* Subtle ambient light bar */}
        <div className="h-1.5 w-full bg-linear-to-r from-indigo-500 via-purple-500 to-indigo-600" />

        {/* Header */}
        <div className="px-6 pt-5 pb-4 border-b border-slate-100 dark:border-slate-800 flex items-start justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400 ring-1 ring-indigo-500/20">
              <Building2 className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-md bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 text-[11px] font-bold text-indigo-700 dark:text-indigo-300">
                  <Sparkles className="h-3 w-3" />
                  {isAr ? "إعداد المؤسسة لأول مرة" : "First-Time Organization Setup"}
                </span>
                <span className="text-xs text-slate-400">
                  {step === 1 ? (isAr ? "خطوة 1 من 2: الهوية والتصنيف" : "Step 1 of 2: Identity & Type") : (isAr ? "خطوة 2 من 2: الأهداف والعملة" : "Step 2 of 2: Goals & Currency")}
                </span>
              </div>
              <h2 id="onboarding-modal-title" className="text-lg font-bold text-slate-900 dark:text-white mt-1">
                {isAr ? "عرّف RippleIQ بمؤسستك وطبيعة عملها" : "Tell RippleIQ about your organization"}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {isAr
                  ? "تساعد هذه البيانات محرك الذكاء الاصطناعي في قياس الآثار المتتالية والتوافق المالي والتنظيمي بدقة."
                  : "This operational context guides our simulation models to evaluate cascading ripple effects and trade-offs accurately."}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleDismiss}
            aria-label={isAr ? "إغلاق" : "Close"}
            className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* 1-Click Fast Presets */}
        <div className="bg-slate-50/80 dark:bg-slate-950/40 px-6 py-2.5 border-b border-slate-100 dark:border-slate-800/80">
          <div className="flex items-center gap-2 overflow-x-auto py-1 scrollbar-none">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 shrink-0">
              {isAr ? "نماذج سريعة جاهزة:" : "1-Click Presets:"}
            </span>
            {ORGANIZATION_PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => applyPreset(preset.id)}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:border-indigo-400 hover:bg-indigo-50/50 hover:text-indigo-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-indigo-500 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                <span>{isAr ? preset.labelAr : preset.labelEn}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {step === 1 ? (
            <div className="space-y-4 animate-in fade-in duration-150">
              {/* Kind selector cards */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  {isAr ? "نوع وتصنيف المؤسسة *" : "Organization Type *"}
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {kindOptions.map((opt) => {
                    const Icon = opt.icon;
                    const isSelected = profile.kind === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => update("kind", opt.value)}
                        className={`flex flex-col items-center justify-center text-center p-3 rounded-2xl border transition text-xs font-medium cursor-pointer ${
                          isSelected
                            ? "border-indigo-600 bg-indigo-50/80 text-indigo-700 ring-2 ring-indigo-500/20 dark:border-indigo-500 dark:bg-indigo-950/40 dark:text-indigo-300"
                            : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800/60"
                        }`}
                      >
                        <Icon className={`h-5 w-5 mb-1.5 ${isSelected ? "text-indigo-600 dark:text-indigo-400" : "text-slate-400"}`} />
                        <span>{isAr ? opt.labelAr : opt.labelEn}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Name & Industry */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    {isAr ? "اسم المؤسسة *" : "Organization Name *"}
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={120}
                    value={profile.name}
                    onChange={(e) => update("name", e.target.value)}
                    placeholder={isAr ? "مثال: جامعة النور التقنية، شركة مدار" : "e.g. Al-Noor University"}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-xs text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    {isAr ? "القطاع أو المجال" : "Industry or Field"}
                  </label>
                  <input
                    type="text"
                    maxLength={120}
                    value={profile.industry}
                    onChange={(e) => update("industry", e.target.value)}
                    placeholder={isAr ? "مثال: التعليم العالي، الذكاء الاصطناعي، المستشفيات" : "e.g. Higher Education"}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-xs text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Country & Website */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    {isAr ? "البلد أو النطاق الجغرافي" : "Country / Region"}
                  </label>
                  <input
                    type="text"
                    maxLength={100}
                    value={profile.country}
                    onChange={(e) => update("country", e.target.value)}
                    placeholder={isAr ? "العراق" : "Iraq"}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-xs text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    {isAr ? "الموقع الإلكتروني الرسمي" : "Official Website"}
                  </label>
                  <input
                    type="url"
                    value={profile.website}
                    onChange={(e) => update("website", e.target.value)}
                    placeholder="https://example.edu.iq"
                    className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-xs text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4 animate-in fade-in duration-150">
              {/* Currency Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  {isAr ? "العملة المالية المعتمدة للتقارير" : "Preferred Currency"}
                </label>
                <div className="grid sm:grid-cols-2 gap-3 items-center">
                  <CurrencySelect
                    value={profile.currency}
                    onChange={(curr) => update("currency", curr)}
                  />
                  <div className="flex items-center gap-2 rounded-xl border border-indigo-100 bg-indigo-50/60 px-3.5 py-2 text-xs font-medium text-indigo-900 dark:border-indigo-900/60 dark:bg-indigo-950/30 dark:text-indigo-300">
                    <Coins className="h-4 w-4 text-indigo-500 shrink-0" />
                    <span>
                      {isAr ? "معاينة:" : "Preview:"} {formatCurrency(2500000, profile.currency, locale)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Description & Mission */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  {isAr ? "نشاط المؤسسة الرئيسي والفئات المستفيدة" : "Primary Activity & Target Audience"}
                </label>
                <textarea
                  rows={3}
                  maxLength={1200}
                  value={profile.description}
                  onChange={(e) => update("description", e.target.value)}
                  placeholder={
                    isAr
                      ? "نبذة موجزة عن المؤسسة، جمهورها، وما تقدمه من خدمات أو منتجات أو برامج."
                      : "Brief description of the organization and what it provides."
                  }
                  className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white resize-y"
                />
              </div>

              {/* Strategic Goals & Constraints */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  {isAr ? "الأهداف الاستراتيجية ومحددات العمل الحالية" : "Current Strategic Goals & Constraints"}
                </label>
                <textarea
                  rows={3}
                  maxLength={1200}
                  value={profile.goals}
                  onChange={(e) => update("goals", e.target.value)}
                  placeholder={
                    isAr
                      ? "ما هي أولويات المؤسسة؟ مثل كفاءة النفقات، جودة الخدمات، الامتثال للوائح، وساعات العمل."
                      : "What are your team's top priorities when evaluating choices?"
                  }
                  className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white resize-y"
                />
              </div>
            </div>
          )}

          {/* Footer Controls */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col-reverse sm:flex-row items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleDismiss}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              {isAr ? "تخطي الآن والإكمال لاحقاً" : "Skip for now"}
            </button>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              {step === 1 ? (
                <button
                  type="button"
                  onClick={() => {
                    if (!profile.name.trim()) {
                      toast.error(isAr ? "يرجى كتابة اسم المؤسسة أولاً" : "Please enter organization name first");
                      return;
                    }
                    setStep(2);
                  }}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-semibold text-white hover:bg-indigo-500 transition cursor-pointer"
                >
                  <span>{isAr ? "التالي: الأهداف والعملة" : "Next: Goals & Currency"}</span>
                  <ArrowRight className="h-3.5 w-3.5 rtl:rotate-180" />
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 transition cursor-pointer"
                  >
                    {isAr ? "السابق" : "Back"}
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-2.5 text-xs font-semibold text-white hover:bg-indigo-500 disabled:opacity-60 transition shadow-md shadow-indigo-600/20 cursor-pointer"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>{saving ? (isAr ? "جارٍ الحفظ وتفعيل المساحة..." : "Saving & Activating...") : (isAr ? "حفظ وتفعيل مساحة العمل" : "Save & Activate Workspace")}</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
