"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { Activity, Building2, CheckCircle2, Globe2, Laptop, Moon, RefreshCw, RotateCcw, Save, Sun } from "lucide-react";
import { toast } from "sonner";
import { FormField } from "@/components/FormField";
import { CurrencySelect } from "@/components/CurrencySelect";
import { formatCurrency, getCurrencyCodes, getCurrencyLabel } from "@/lib/currency";
import { checkApiHealth, getAIProviderStatus, type AIProviderStatus } from "@/lib/api";
import type { HealthResponse } from "@/types/decision";
import { useLocale } from "@/components/LocaleProvider";
import { useTheme } from "@/components/ThemeProvider";

const STORAGE_KEY = "rippleiq_settings";
const DEFAULT_SETTINGS = { currency: "IQD" };
const controlClassName = "w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white";

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const { locale, setLocale, t } = useLocale();
  const [currency, setCurrency] = useState(DEFAULT_SETTINGS.currency);
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [providerStatus, setProviderStatus] = useState<AIProviderStatus | null>(null);
  const [providerStatusUnavailable, setProviderStatusUnavailable] = useState(false);
  const [checkingHealth, setCheckingHealth] = useState(true);

  const fetchHealth = async () => {
    setCheckingHealth(true);
    const [healthResult, providerResult] = await Promise.allSettled([checkApiHealth(), getAIProviderStatus()]);
    setHealth(healthResult.status === "fulfilled" ? healthResult.value : null);
    setProviderStatus(providerResult.status === "fulfilled" ? providerResult.value : null);
    setProviderStatusUnavailable(providerResult.status === "rejected");
    setCheckingHealth(false);
  };

  useEffect(() => {
    let active = true;

    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as { currency?: string };
        if (parsed?.currency && /^[A-Z]{3}$/.test(parsed.currency)) {
          setCurrency(parsed.currency);
        }
      }
    } catch {
      // ignore
    }

    Promise.allSettled([checkApiHealth(), getAIProviderStatus()]).then(([healthResult, providerResult]) => {
      if (!active) return;
      setHealth(healthResult.status === "fulfilled" ? healthResult.value : null);
      setProviderStatus(providerResult.status === "fulfilled" ? providerResult.value : null);
      setProviderStatusUnavailable(providerResult.status === "rejected");
      setCheckingHealth(false);
    });

    return () => {
      active = false;
    };
  }, []);

  const handleSave = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ currency, language: locale }));
      toast.success(t("saved"), {
        description: locale === "ar" ? "تفضيلاتك محفوظة بنجاح في هذا المتصفح." : "These demo preferences are saved in this browser.",
      });
    } catch {
      toast.error(locale === "ar" ? "تعذر حفظ التفضيلات" : "Could not save preferences");
    }
  };

  const handleReset = () => {
    setCurrency(DEFAULT_SETTINGS.currency);
    setLocale("en");
    try {
      localStorage.removeItem(STORAGE_KEY);
      toast.success(locale === "ar" ? "تمت استعادة الإعدادات الافتراضية" : "Preferences reset");
    } catch {
      toast.error(locale === "ar" ? "تعذر إعادة الضبط" : "Could not reset saved preferences");
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <header>
        <p className="text-xs font-semibold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">{t("workspace")}</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-950 dark:text-white">{t("preferences")}</h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{t("settingsSubtitle")}</p>
      </header>

      <section aria-labelledby="org-profile-title" className="flex flex-col gap-4 rounded-2xl border border-indigo-200 bg-indigo-50/70 p-4 dark:border-indigo-900/60 dark:bg-indigo-950/20 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <Building2 className="mt-0.5 h-5 w-5 text-indigo-600 dark:text-indigo-400" aria-hidden="true" />
          <div>
            <h2 id="org-profile-title" className="text-sm font-semibold text-slate-900 dark:text-white">{t("orgProfileTitle")}</h2>
            <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">{t("orgProfileDesc")}</p>
          </div>
        </div>
        <Link href="/onboarding" className="inline-flex min-h-10 items-center justify-center rounded-lg bg-indigo-600 px-4 text-xs font-semibold text-white hover:bg-indigo-500 transition">
          {t("editOrgProfile")}
        </Link>
      </section>

      <section aria-labelledby="api-health-title" className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200">
              <Activity className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <h2 id="api-health-title" className="text-sm font-semibold text-slate-900 dark:text-white">{t("apiConnection")}</h2>
              <p className="text-xs text-slate-500">GET /api/v1/health</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => void fetchHealth()}
            disabled={checkingHealth}
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-slate-300 px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${checkingHealth ? "animate-spin" : ""}`} aria-hidden="true" />
            {t("refreshStatus")}
          </button>
        </div>
        <div className="mt-4 flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-3 text-sm dark:bg-slate-800/60">
          {health?.status === "healthy" ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-600" aria-hidden="true" />
          ) : (
            <Activity className="h-4 w-4 text-amber-600" aria-hidden="true" />
          )}
          <span className="font-medium text-slate-800 dark:text-slate-200">
            {health?.status === "healthy"
              ? t("backendReachable")
              : health?.status === "degraded"
              ? t("backendDegraded")
              : t("backendUnavailable")}
          </span>
          {health?.analyzer_mode && (
            <span className="ms-auto hidden text-xs text-slate-500 sm:inline">
              Analyzer: {health.analyzer_mode}
            </span>
          )}
        </div>
        <div className="mt-3 rounded-xl border border-slate-200 p-3 dark:border-slate-800" aria-live="polite">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-xs font-semibold text-slate-800 dark:text-slate-200">{t("aiProviderConfig")}</h3>
            {providerStatus && <span className="text-[10px] font-medium text-slate-500">Mode: {providerStatus.mode}</span>}
          </div>
          {providerStatus ? (
            <>
              <ul className="mt-2 grid gap-1 sm:grid-cols-2">
                {providerStatus.providers.map((provider) => (
                  <li key={provider.name} className="flex items-center justify-between gap-2 text-[11px] text-slate-600 dark:text-slate-300">
                    <span>{provider.name.replaceAll("_", " ")}</span>
                    <span className={provider.configured ? "text-emerald-700 dark:text-emerald-300" : "text-slate-500"}>
                      {provider.configured ? (locale === "ar" ? "مُفعّل ومضبوط" : "Configured") : (locale === "ar" ? "غير مهيأ" : "Not configured")}
                    </span>
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-[10px] leading-4 text-slate-500 dark:text-slate-400">
                {providerStatus.note}
              </p>
            </>
          ) : (
            <p className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">
              {providerStatusUnavailable
                ? (locale === "ar" ? "بيانات المزود غير متوفرة حالياً." : "Provider configuration status is unavailable.")
                : (locale === "ar" ? "جارٍ فحص مزودي الذكاء الاصطناعي…" : "Loading provider configuration…")}
            </p>
          )}
        </div>
      </section>

      {/* Appearance Section */}
      <section aria-labelledby="appearance-title" className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-4 dark:border-slate-800">
          <Sun className="h-4 w-4 text-amber-500" aria-hidden="true" />
          <h2 id="appearance-title" className="text-sm font-semibold text-slate-900 dark:text-white">{t("interfaceAppearance")}</h2>
        </div>
        <div className="mt-4">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">{t("themeMode")}</label>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{t("themeModeDesc")}</p>
          <div className="mt-3 grid grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => setTheme("light")}
              className={`flex flex-col items-center gap-2 rounded-xl border p-3 text-xs font-semibold transition cursor-pointer ${
                theme === "light"
                  ? "border-indigo-600 bg-indigo-50/50 text-indigo-700 ring-2 ring-indigo-500/20 dark:bg-indigo-950/40 dark:text-indigo-300"
                  : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
              }`}
            >
              <Sun className="h-5 w-5 text-amber-500" aria-hidden="true" />
              <span>{t("themeLight")}</span>
            </button>
            <button
              type="button"
              onClick={() => setTheme("dark")}
              className={`flex flex-col items-center gap-2 rounded-xl border p-3 text-xs font-semibold transition cursor-pointer ${
                theme === "dark"
                  ? "border-indigo-600 bg-indigo-50/50 text-indigo-700 ring-2 ring-indigo-500/20 dark:bg-indigo-950/40 dark:text-indigo-300"
                  : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
              }`}
            >
              <Moon className="h-5 w-5 text-indigo-600 dark:text-indigo-400" aria-hidden="true" />
              <span>{t("themeDark")}</span>
            </button>
            <button
              type="button"
              onClick={() => setTheme("system")}
              className={`flex flex-col items-center gap-2 rounded-xl border p-3 text-xs font-semibold transition cursor-pointer ${
                theme === "system"
                  ? "border-indigo-600 bg-indigo-50/50 text-indigo-700 ring-2 ring-indigo-500/20 dark:bg-indigo-950/40 dark:text-indigo-300"
                  : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
              }`}
            >
              <Laptop className="h-5 w-5 text-indigo-600 dark:text-indigo-400" aria-hidden="true" />
              <span>{t("themeSystem")}</span>
            </button>
          </div>
        </div>
      </section>

      <form onSubmit={handleSave} className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-4 dark:border-slate-800">
          <Globe2 className="h-4 w-4 text-indigo-600 dark:text-indigo-400" aria-hidden="true" />
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white">{t("regionalPreferences")}</h2>
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <FormField id="preference-currency" label={t("preferredCurrency")} hint={t("preferredCurrencyDesc")}>
            <CurrencySelect
              id="preference-currency"
              value={currency}
              onChange={(newCurrency) => setCurrency(newCurrency)}
            />
          </FormField>
          <FormField id="preference-language" label={t("language")} hint={t("languageNote")}>
            <select
              className={controlClassName}
              value={locale}
              onChange={(event) => setLocale(event.target.value === "ar" ? "ar" : "en")}
            >
              <option value="en">{t("english")} (English)</option>
              <option value="ar">{t("arabic")} (Arabic)</option>
            </select>
          </FormField>
        </div>
        <div className="rounded-xl bg-slate-50 px-3.5 py-2.5 text-xs text-slate-600 dark:bg-slate-800/60 dark:text-slate-300">
          <span>{locale === "ar" ? "معاينة تنسيق العملة: " : "Currency formatting preview: "}</span>
          <strong className="font-mono font-bold text-slate-900 dark:text-white">{formatCurrency(12345.67, currency, locale)}</strong>
        </div>
        <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-4 dark:border-slate-800 sm:flex-row sm:justify-between">
          <span className="self-center text-xs text-slate-500">
            {locale === "ar" ? "تُحفظ في هذا المتصفح فقط" : "Saved to this browser only"}
          </span>
          <div className="flex gap-2 sm:ms-auto">
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-slate-300 px-3.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
              {t("resetPreferences")}
            </button>
            <button
              type="submit"
              className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-indigo-600 px-4 text-xs font-semibold text-white hover:bg-indigo-500 transition cursor-pointer"
            >
              <Save className="h-3.5 w-3.5" aria-hidden="true" />
              {t("save")}
            </button>
          </div>
        </div>
      </form>

    </div>
  );
}
