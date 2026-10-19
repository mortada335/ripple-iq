"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { Activity, Building2, CheckCircle2, Globe2, RefreshCw, RotateCcw, Save } from "lucide-react";
import { toast } from "sonner";
import { FormField } from "@/components/FormField";
import { formatCurrency, getCurrencyCodes, getCurrencyLabel } from "@/lib/currency";
import { checkApiHealth, getAIProviderStatus, type AIProviderStatus } from "@/lib/api";
import type { HealthResponse } from "@/types/decision";
import type { Locale } from "@/lib/locale";
import { translate } from "@/lib/locale";

const STORAGE_KEY = "rippleiq_settings";
const DEFAULT_SETTINGS: { currency: string; language: Locale } = { currency: "IQD", language: "en" };
const controlClassName = "w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white";

function applyLanguageDirection(language: string) {
  document.documentElement.lang = language;
  document.documentElement.dir = language === "ar" ? "rtl" : "ltr";
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<{ currency: string; language: Locale }>(DEFAULT_SETTINGS);
  const t = (key: Parameters<typeof translate>[1]) => translate(settings.language, key);
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

    const init = async () => {
      await Promise.resolve();
      if (!active) return;
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed: unknown = JSON.parse(saved);
          if (parsed && typeof parsed === "object") {
            const candidate = parsed as Partial<typeof DEFAULT_SETTINGS>;
            const next: { currency: string; language: Locale } = {
              currency: typeof candidate.currency === "string" && /^[A-Z]{3}$/.test(candidate.currency) ? candidate.currency : DEFAULT_SETTINGS.currency,
              language: candidate.language === "ar" ? "ar" : "en",
            };
            if (active) {
              setSettings(next);
              applyLanguageDirection(next.language);
            }
          }
        }
      } catch {
        toast.error("Could not read saved demo preferences");
      }
    };

    void init();

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
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
      applyLanguageDirection(settings.language);
      window.dispatchEvent(new Event("rippleiq:locale-updated"));
      toast.success(t("saved"), {
        description: "These demo preferences are not synced to an account.",
      });
    } catch {
      toast.error("Could not save preferences", { description: "Check browser storage settings and try again." });
    }
  };

  const handleReset = () => {
    setSettings(DEFAULT_SETTINGS);
    applyLanguageDirection(DEFAULT_SETTINGS.language);
    try {
      localStorage.removeItem(STORAGE_KEY);
      window.dispatchEvent(new Event("rippleiq:locale-updated"));
      toast.success("Preferences reset");
    } catch {
      toast.error("Could not reset saved preferences");
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <header>
        <p className="text-xs font-semibold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">{t("workspace")}</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-950 dark:text-white">{t("preferences")}</h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">Manage local demo preferences and check whether the API is reachable.</p>
      </header>

      <section aria-labelledby="org-profile-title" className="flex flex-col gap-4 rounded-2xl border border-indigo-200 bg-indigo-50/70 p-4 dark:border-indigo-900/60 dark:bg-indigo-950/20 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <Building2 className="mt-0.5 h-5 w-5 text-indigo-600 dark:text-indigo-400" aria-hidden="true" />
          <div><h2 id="org-profile-title" className="text-sm font-semibold text-slate-900 dark:text-white">Organization profile</h2><p className="mt-1 text-xs text-slate-600 dark:text-slate-400">Add demo organization context. It stays in this browser until an organization API is connected.</p></div>
        </div>
        <Link href="/onboarding" className="inline-flex min-h-10 items-center justify-center rounded-lg bg-indigo-600 px-4 text-xs font-semibold text-white hover:bg-indigo-500">Edit organization profile</Link>
      </section>

      <section aria-labelledby="api-health-title" className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200"><Activity className="h-5 w-5" aria-hidden="true" /></span><div><h2 id="api-health-title" className="text-sm font-semibold text-slate-900 dark:text-white">API connection</h2><p className="text-xs text-slate-500">GET /api/v1/health</p></div></div>
          <button type="button" onClick={() => void fetchHealth()} disabled={checkingHealth} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-slate-300 px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"><RefreshCw className={`h-3.5 w-3.5 ${checkingHealth ? "animate-spin" : ""}`} aria-hidden="true" /> Refresh status</button>
        </div>
        <div className="mt-4 flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-3 text-sm dark:bg-slate-800/60">
          {health?.status === "healthy" ? <CheckCircle2 className="h-4 w-4 text-emerald-600" aria-hidden="true" /> : <Activity className="h-4 w-4 text-amber-600" aria-hidden="true" />}
          <span className="font-medium text-slate-800 dark:text-slate-200">{health?.status === "healthy" ? "Backend reachable" : health?.status === "degraded" ? "Backend is degraded" : "Backend unavailable"}</span>
          {health?.analyzer_mode && <span className="ms-auto hidden text-xs text-slate-500 sm:inline">Analyzer: {health.analyzer_mode}</span>}
        </div>
        <div className="mt-3 rounded-xl border border-slate-200 p-3 dark:border-slate-800" aria-live="polite">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-xs font-semibold text-slate-800 dark:text-slate-200">AI provider configuration</h3>
            {providerStatus && <span className="text-[10px] font-medium text-slate-500">Mode: {providerStatus.mode}</span>}
          </div>
          {providerStatus ? (
            <>
              <ul className="mt-2 grid gap-1 sm:grid-cols-2">
                {providerStatus.providers.map((provider) => (
                  <li key={provider.name} className="flex items-center justify-between gap-2 text-[11px] text-slate-600 dark:text-slate-300">
                    <span>{provider.name.replaceAll("_", " ")}</span>
                    <span className={provider.configured ? "text-emerald-700 dark:text-emerald-300" : "text-slate-500"}>{provider.configured ? "Configured" : "Not configured"}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-[10px] leading-4 text-slate-500 dark:text-slate-400">{providerStatus.note} Configured does not mean reachable. Failover {providerStatus.failover_enabled ? "enabled" : "disabled"}; mock degraded mode {providerStatus.degraded_mode_enabled ? "enabled" : "disabled"}.</p>
            </>
          ) : <p className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">{providerStatusUnavailable ? "Provider configuration status is unavailable." : "Loading provider configuration…"}</p>}
        </div>
      </section>

      <form onSubmit={handleSave} className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-4 dark:border-slate-800"><Globe2 className="h-4 w-4 text-indigo-600 dark:text-indigo-400" aria-hidden="true" /><h2 className="text-sm font-semibold text-slate-900 dark:text-white">Regional preferences</h2></div>
        <div className="grid gap-5 sm:grid-cols-2">
          <FormField id="preference-currency" label="Preferred currency" hint="Standard ISO 4217 currency codes. Financial analysis must return its own currency before this can format live values.">
            <select className={controlClassName} value={settings.currency} onChange={(event) => setSettings({ ...settings, currency: event.target.value })}>
              {!getCurrencyCodes().includes(settings.currency) && <option value={settings.currency}>{settings.currency}</option>}
              {getCurrencyCodes().map((code) => <option key={code} value={code}>{getCurrencyLabel(code, settings.language)}</option>)}
            </select>
          </FormField>
          <FormField id="preference-language" label={t("language")} hint={t("languageNote")}>
            <select className={controlClassName} value={settings.language} onChange={(event) => setSettings({ ...settings, language: event.target.value === "ar" ? "ar" : "en" })}>
              <option value="en">{t("english")} · LTR</option>
              <option value="ar">{t("arabic")} · RTL</option>
            </select>
          </FormField>
        </div>
        <div className="rounded-lg bg-slate-50 px-3 py-2.5 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-300">Currency formatting preview: <strong>{formatCurrency(12345.67, settings.currency, settings.language)}</strong></div>
        <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-4 dark:border-slate-800 sm:flex-row sm:justify-between">
          <span className="self-center text-xs text-slate-500">Saved to this browser only</span>
          <div className="flex gap-2 sm:ms-auto">
            <button type="button" onClick={handleReset} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-300 px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"><RotateCcw className="h-3.5 w-3.5" aria-hidden="true" /> Reset</button>
            <button type="submit" className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-indigo-600 px-4 text-xs font-semibold text-white hover:bg-indigo-500"><Save className="h-3.5 w-3.5" aria-hidden="true" /> {t("save")}</button>
          </div>
        </div>
      </form>
    </div>
  );
}
