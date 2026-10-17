"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { ArrowLeft, Building2, Save } from "lucide-react";
import { toast } from "sonner";
import { FormField } from "@/components/FormField";
import { formatCurrency, getCurrencyCodes, getCurrencyLabel } from "@/lib/currency";
import {
  DEFAULT_ORGANIZATION,
  readDemoOrganization,
  saveDemoOrganization,
  type OrganizationKind,
  type OrganizationProfile,
} from "@/lib/organization";

const inputClassName = "w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white";

export default function OrganizationOnboardingPage() {
  const [profile, setProfile] = useState<OrganizationProfile>(DEFAULT_ORGANIZATION);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setProfile(readDemoOrganization()));
    return () => window.cancelAnimationFrame(frame);
  }, []);

  const update = <K extends keyof OrganizationProfile>(key: K, value: OrganizationProfile[K]) => {
    setProfile((current) => ({ ...current, [key]: value }));
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      saveDemoOrganization(profile);
      toast.success("Organization profile saved in this browser", {
        description: "This is demo data. It has not been sent to a server.",
      });
    } catch {
      toast.error("Could not save the demo profile", {
        description: "Check your browser storage settings and try again.",
      });
    }
  };

  const handleReset = () => {
    try {
      saveDemoOrganization(DEFAULT_ORGANIZATION);
      setProfile(DEFAULT_ORGANIZATION);
      toast.success("Demo profile reset");
    } catch {
      toast.error("Could not reset the demo profile");
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900 dark:hover:text-white">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back to dashboard
      </Link>

      <header>
        <div className="mb-3 inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
          <Building2 className="h-5 w-5" aria-hidden="true" />
        </div>
        <p className="text-xs font-semibold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">Demo setup</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-950 dark:text-white">Tell RippleIQ about your organization</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-400">
          Add context that can help frame decisions. This prototype saves the profile only in this browser; it does not create an account or send this information to an AI service.
        </p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-7">
        <div className="grid gap-5 sm:grid-cols-2">
          <FormField id="org-name" label="Organization name" required>
            <input className={inputClassName} value={profile.name} onChange={(event) => update("name", event.target.value)} required maxLength={120} />
          </FormField>
          <FormField id="org-kind" label="Organization type" required>
            <select className={inputClassName} value={profile.kind} onChange={(event) => update("kind", event.target.value as OrganizationKind)}>
              <option value="university">University</option>
              <option value="company">Company or business</option>
              <option value="nonprofit">Nonprofit</option>
              <option value="public-sector">Public sector</option>
              <option value="other">Other organization</option>
            </select>
          </FormField>
          <FormField id="org-industry" label="Industry or field">
            <input className={inputClassName} value={profile.industry} onChange={(event) => update("industry", event.target.value)} maxLength={120} placeholder="For example, education or manufacturing" />
          </FormField>
          <FormField id="org-country" label="Country">
            <input className={inputClassName} value={profile.country} onChange={(event) => update("country", event.target.value)} maxLength={100} autoComplete="country-name" />
          </FormField>
          <FormField id="org-website" label="Website" hint="Optional; this is saved locally in the demo profile.">
            <input className={inputClassName} type="url" value={profile.website} onChange={(event) => update("website", event.target.value)} placeholder="https://example.org" />
          </FormField>
          <FormField id="org-currency" label="Preferred currency">
            <select className={inputClassName} value={profile.currency} onChange={(event) => update("currency", event.target.value)}>
              {!getCurrencyCodes().includes(profile.currency) && <option value={profile.currency}>{profile.currency}</option>}
              {getCurrencyCodes().map((code) => <option key={code} value={code}>{getCurrencyLabel(code)}</option>)}
            </select>
          </FormField>
        </div>

        <FormField id="org-description" label="What does your organization do?">
          <textarea className={`${inputClassName} min-h-24 resize-y`} value={profile.description} onChange={(event) => update("description", event.target.value)} maxLength={1200} placeholder="A short overview of the organization and the people it serves." />
        </FormField>
        <FormField id="org-goals" label="Current goals">
          <textarea className={`${inputClassName} min-h-24 resize-y`} value={profile.goals} onChange={(event) => update("goals", event.target.value)} maxLength={1200} placeholder="What outcomes matter when your team evaluates a decision?" />
        </FormField>
        <FormField id="org-context" label="Useful decision context" hint="Avoid confidential or personal information in this local demo profile.">
          <textarea className={`${inputClassName} min-h-28 resize-y`} value={profile.context} onChange={(event) => update("context", event.target.value)} maxLength={2000} placeholder="Constraints, operating context, or other details your team wants to consider." />
        </FormField>

        <p className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-300">
          Currency preview: <strong>{formatCurrency(12345.67, profile.currency, profile.locale)}</strong>. Live analysis amounts will need to include their currency from the backend.
        </p>

        <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 dark:border-slate-800 sm:flex-row sm:justify-between">
          <button type="button" onClick={handleReset} className="min-h-11 rounded-xl border border-slate-300 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">
            Reset demo profile
          </button>
          <button type="submit" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 text-sm font-semibold text-white hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600">
            <Save className="h-4 w-4" aria-hidden="true" /> Save demo profile
          </button>
        </div>
      </form>
    </div>
  );
}
