"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { ArrowLeft, Building2, Save } from "lucide-react";
import { toast } from "sonner";
import { FormField } from "@/components/FormField";
import { formatCurrency, getCurrencyCodes, getCurrencyLabel } from "@/lib/currency";
import { createOrganization } from "@/lib/api";
import { useAuth } from "@/components/AuthProvider";
import { useLocale } from "@/components/LocaleProvider";
import {
  DEFAULT_ORGANIZATION,
  getOrganizationStorageKey,
  readDemoOrganization,
  saveDemoOrganization,
  type OrganizationKind,
  type OrganizationProfile,
} from "@/lib/organization";
import { getActiveOrganizationId } from "@/lib/session";

const inputClassName = "w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white";

export default function OrganizationOnboardingPage() {
  const { user, organizations, activeOrganizationId, isDemo, refresh } = useAuth();
  const { locale, isRtl } = useLocale();
  const isAr = locale === "ar";
  const activeOrganization = organizations.find((item) => item.id === activeOrganizationId);
  const [profile, setProfile] = useState<OrganizationProfile>(DEFAULT_ORGANIZATION);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    const loadProfile = async () => {
      await Promise.resolve();
      if (active) {
        const profile = readDemoOrganization(activeOrganizationId);
        if (user && activeOrganization) {
          try {
            if (!localStorage.getItem(getOrganizationStorageKey(activeOrganizationId))) {
              profile.name = activeOrganization.name;
              profile.country = activeOrganization.country ?? "";
            }
          } catch { /* Retain defaults */ }
        }
        setProfile(profile);
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

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (user && !activeOrganization) {
      setSaving(true);
      try {
        await createOrganization({ name: profile.name.trim(), country: profile.country.trim() || null });
        await refresh();
        saveDemoOrganization(profile, getActiveOrganizationId());
        toast.success(isAr ? "تم إنشاء المؤسسة بنجاح" : "Organization created", {
          description: isAr
            ? "تم حفظ اسم المؤسسة والبلد في الخادم. التفاصيل الموسعة محفوظة في هذا المتصفح."
            : "The API saves the organization name and country. Extended profile fields remain in this browser.",
        });
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
      toast.success(isAr ? "تم حفظ سياق المؤسسة في المتصفح" : "Organization context saved in this browser", {
        description: isDemo
          ? (isAr ? "البيانات التجريبية محفوظة محلياً فقط." : "Demo data was not sent to the API.")
          : (isAr ? "تم حفظ السياق الإضافي للمؤسسة بنجاح." : "The API has no endpoint for updating these extended profile fields yet."),
      });
    } catch {
      toast.error(isAr ? "تعذر حفظ الملف التجريبي" : "Could not save the demo profile");
    }
  };

  const handleReset = () => {
    try {
      saveDemoOrganization(DEFAULT_ORGANIZATION, activeOrganizationId);
      setProfile(DEFAULT_ORGANIZATION);
      toast.success(isAr ? "تمت استعادة الملف الافتراضي" : "Demo profile reset");
    } catch {
      toast.error(isAr ? "تعذر إعادة الضبط" : "Could not reset the demo profile");
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link
        href={user && !activeOrganization ? "/login" : "/dashboard"}
        className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900 dark:hover:text-white transition"
      >
        <ArrowLeft className="h-4 w-4 rtl:rotate-180" aria-hidden="true" />
        <span>{isAr ? "العودة إلى لوحة التحكم" : "Back to dashboard"}</span>
      </Link>

      <header>
        <div className="mb-3 inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
          <Building2 className="h-5 w-5" aria-hidden="true" />
        </div>
        <p className="text-xs font-semibold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
          {user ? (activeOrganization ? (isAr ? "سياق المؤسسة" : "Organization context") : (isAr ? "إعداد مساحة العمل" : "Workspace setup")) : (isAr ? "الإعداد التجريبي" : "Demo setup")}
        </p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-950 dark:text-white">
          {isAr ? "عرّف RippleIQ بمؤسستك" : "Tell RippleIQ about your organization"}
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-400">
          {isAr
            ? "أضف السياق التشغيلي الذي يساعد في صياغة ومحاكاة القرارات بدقة. تُحفظ هذه البيانات داخل المتصفح وتُرفق مع سياق كل قرار تقوم بتحليله."
            : "Add context that can help frame decisions. Demo profile fields are saved only in this browser and are included with a decision only when you submit its context."}
        </p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-7">
        <div className="grid gap-5 sm:grid-cols-2">
          <FormField id="org-name" label={isAr ? "اسم المؤسسة" : "Organization name"} required>
            <input
              className={inputClassName}
              value={profile.name}
              onChange={(event) => update("name", event.target.value)}
              required
              maxLength={120}
              readOnly={Boolean(user && activeOrganization)}
            />
          </FormField>
          <FormField id="org-kind" label={isAr ? "نوع المؤسسة" : "Organization type"} required>
            <select
              className={inputClassName}
              value={profile.kind}
              onChange={(event) => update("kind", event.target.value as OrganizationKind)}
            >
              <option value="university">{isAr ? "جامعة / مؤسسة أكاديمية" : "University"}</option>
              <option value="company">{isAr ? "شركة / قطاع خاص" : "Company or business"}</option>
              <option value="nonprofit">{isAr ? "منظمة غير ربحية" : "Nonprofit"}</option>
              <option value="public-sector">{isAr ? "قطاع حكومي / عام" : "Public sector"}</option>
              <option value="other">{isAr ? "مؤسسة أخرى" : "Other organization"}</option>
            </select>
          </FormField>
          <FormField id="org-industry" label={isAr ? "القطاع أو المجال" : "Industry or field"}>
            <input
              className={inputClassName}
              value={profile.industry}
              onChange={(event) => update("industry", event.target.value)}
              maxLength={120}
              placeholder={isAr ? "مثال: التعليم العالي، الرعاية الصحية" : "For example, education or manufacturing"}
            />
          </FormField>
          <FormField id="org-country" label={isAr ? "البلد" : "Country"}>
            <input
              className={inputClassName}
              value={profile.country}
              onChange={(event) => update("country", event.target.value)}
              maxLength={100}
              autoComplete="country-name"
              readOnly={Boolean(user && activeOrganization)}
            />
          </FormField>
          <FormField id="org-website" label={isAr ? "الموقع الإلكتروني" : "Website"}>
            <input
              className={inputClassName}
              type="url"
              value={profile.website}
              onChange={(event) => update("website", event.target.value)}
              placeholder="https://example.org"
            />
          </FormField>
          <FormField id="org-currency" label={isAr ? "العملة المفضلة" : "Preferred currency"}>
            <select
              className={inputClassName}
              value={profile.currency}
              onChange={(event) => update("currency", event.target.value)}
            >
              {!getCurrencyCodes().includes(profile.currency) && <option value={profile.currency}>{profile.currency}</option>}
              {getCurrencyCodes().map((code) => (
                <option key={code} value={code}>
                  {getCurrencyLabel(code, locale)}
                </option>
              ))}
            </select>
          </FormField>
        </div>

        <FormField id="org-description" label={isAr ? "ما هو نشاط المؤسسة الرئيسي؟" : "What does your organization do?"}>
          <textarea
            className={`${inputClassName} min-h-24 resize-y`}
            value={profile.description}
            onChange={(event) => update("description", event.target.value)}
            maxLength={1200}
            placeholder={isAr ? "نبذة موجزة عن المؤسسة والفئات والمستفيدين الذين تخدمهم." : "A short overview of the organization and the people it serves."}
          />
        </FormField>
        <FormField id="org-goals" label={isAr ? "الأهداف الاستراتيجية الحالية" : "Current goals"}>
          <textarea
            className={`${inputClassName} min-h-24 resize-y`}
            value={profile.goals}
            onChange={(event) => update("goals", event.target.value)}
            maxLength={1200}
            placeholder={isAr ? "ما هي النتائج والمؤشرات الأهم عند تقييم أي قرار؟" : "What outcomes matter when your team evaluates a decision?"}
          />
        </FormField>
        <FormField
          id="org-context"
          label={isAr ? "سياق مفيد للقرارات والقيود" : "Useful decision context"}
          hint={isAr ? "تجنب إدخال معلومات سرية أو حساسة. يُرسل هذا السياق لدعم نمذجة كل قرار." : "Avoid confidential or personal information. This is sent with each decision context you submit."}
        >
          <textarea
            className={`${inputClassName} min-h-28 resize-y`}
            value={profile.context}
            onChange={(event) => update("context", event.target.value)}
            maxLength={2000}
            placeholder={isAr ? "القيود التشغيلية، ساعات العمل، أو أي اعتبارات خاصة ترغب في أخذها بالحسبان." : "Constraints, operating context, or other details your team wants to consider."}
          />
        </FormField>

        <p className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-300">
          {isAr ? "معاينة العملة:" : "Currency preview:"}{" "}
          <strong>{formatCurrency(12345.67, profile.currency, profile.locale)}</strong>.
        </p>

        <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 dark:border-slate-800 sm:flex-row sm:justify-between">
          <button
            type="button"
            onClick={handleReset}
            className="min-h-11 rounded-xl border border-slate-300 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            {isAr ? "استعادة الملف التجريبي" : "Reset demo profile"}
          </button>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-60 transition cursor-pointer"
          >
            <Save className="h-4 w-4" aria-hidden="true" />
            <span>
              {saving
                ? (isAr ? "جارٍ الحفظ…" : "Creating…")
                : user && !activeOrganization
                ? (isAr ? "إنشاء المؤسسة" : "Create organization")
                : (isAr ? "حفظ سياق المؤسسة" : "Save organization context")}
            </span>
          </button>
        </div>
      </form>
    </div>
  );
}
