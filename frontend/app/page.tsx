"use client";

import { FormEvent, useState } from "react";

const questions = [
  { id: "affected_groups", label: "Who would be most affected at your institution?", hint: "Name groups or services, not individuals." },
  { id: "observed_effects", label: "What effects have you observed or expect?", hint: "Separate direct experience from expectations where possible." },
  { id: "constraints", label: "What local constraints should leaders consider?", hint: "For example: lab schedules, clinical placements, transit, contracts, or accessibility." },
  { id: "evidence", label: "What evidence or source supports your answer?", hint: "A report, aggregate metric, or first-hand operational experience." },
];

export default function Home() {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [token, setToken] = useState("");
  const [organizationId, setOrganizationId] = useState("");
  const [role, setRole] = useState("");
  const [source, setSource] = useState("");
  const [sourceDate, setSourceDate] = useState("");
  const [consent, setConsent] = useState(false);
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setStatus("");
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"}/api/v1/knowledge-submissions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token.trim()}`,
          ...(organizationId ? { "X-Organization-ID": organizationId } : {}),
        },
        body: JSON.stringify({
          scenario_key: "university-four-day-campus-week",
          contributor_role: role,
          answers,
          source_name: source || null,
          source_date: sourceDate || null,
          consent_to_review: consent,
        }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body?.error?.message ?? "Submission failed. Check your access and try again.");
      setStatus(`Thanks. Your response was saved for human review (submission ${body.id}). It is not used for model training.`);
      setAnswers({});
      setConsent(false);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Submission failed. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f5f7fa] text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
          <a className="text-xl font-bold tracking-tight text-[#142c4e]" href="#top">RippleIQ</a>
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800">PILOT · KNOWLEDGE INTAKE</span>
        </div>
      </header>
      <div id="top" className="mx-auto grid max-w-5xl gap-8 px-6 py-10 lg:grid-cols-[0.85fr_1.15fr]">
        <section>
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.16em] text-blue-700">Real campus scenario</p>
          <h1 className="text-4xl font-semibold leading-tight tracking-tight text-[#142c4e]">What changes when campus moves to four days?</h1>
          <p className="mt-4 leading-7 text-slate-600">A university is considering moving from five in-person days to four. Leadership wants to understand likely effects before running a limited pilot.</p>
          <div className="mt-7 rounded-2xl border border-blue-100 bg-white p-5 shadow-sm">
            <h2 className="font-semibold text-[#142c4e]">Questions for the review team</h2>
            <ul className="mt-3 space-y-3 text-sm leading-6 text-slate-600">
              <li>Which people and services could be affected?</li>
              <li>What local evidence would change the decision?</li>
              <li>Which constraints or exceptions should a pilot test?</li>
            </ul>
          </div>
          <div className="mt-5 rounded-2xl bg-amber-50 p-5 text-sm leading-6 text-amber-950">
            <strong>Decision support only.</strong> Contributions are stored as pending and require human review. They do not automatically change recommendations or train a model.
          </div>
        </section>

        <form onSubmit={submit} className="space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div>
            <h2 className="text-xl font-semibold text-[#142c4e]">Share local knowledge</h2>
            <p className="mt-1 text-sm text-slate-500">Avoid names, student records, health information, and other personal or confidential details.</p>
          </div>
          <label className="block text-sm font-medium">Your role or area of work
            <input required maxLength={100} value={role} onChange={(e) => setRole(e.target.value)} placeholder="e.g. campus transport planner" className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 font-normal outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100" />
          </label>
          {questions.map((question) => (
            <label key={question.id} className="block text-sm font-medium">{question.label}
              <span className="mt-1 block text-xs font-normal text-slate-500">{question.hint}</span>
              <textarea required maxLength={4000} rows={3} value={answers[question.id] ?? ""} onChange={(e) => setAnswers({ ...answers, [question.id]: e.target.value })} className="mt-1.5 w-full resize-y rounded-lg border border-slate-300 px-3 py-2.5 font-normal outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100" />
            </label>
          ))}
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-medium">Source name <span className="font-normal text-slate-500">(optional)</span>
              <input maxLength={255} value={source} onChange={(e) => setSource(e.target.value)} placeholder="Report or data source" className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 font-normal" />
            </label>
            <label className="block text-sm font-medium">Source date <span className="font-normal text-slate-500">(optional)</span>
              <input type="date" value={sourceDate} onChange={(e) => setSourceDate(e.target.value)} className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 font-normal" />
            </label>
          </div>
          <details className="rounded-lg border border-slate-200 p-4">
            <summary className="cursor-pointer text-sm font-semibold">Organization access</summary>
            <p className="mt-2 text-xs leading-5 text-slate-500">Sign in with your RippleIQ access token. If your account belongs to multiple organizations, enter the organization ID.</p>
            <label className="mt-3 block text-sm font-medium">Access token
              <input required type="password" autoComplete="off" value={token} onChange={(e) => setToken(e.target.value)} className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 font-normal" />
            </label>
            <label className="mt-3 block text-sm font-medium">Organization ID <span className="font-normal text-slate-500">(only if prompted)</span>
              <input inputMode="numeric" value={organizationId} onChange={(e) => setOrganizationId(e.target.value)} className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 font-normal" />
            </label>
          </details>
          <label className="flex items-start gap-3 text-sm leading-6 text-slate-700">
            <input required type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-1 size-4 accent-blue-700" />
            <span>I agree that this contribution may be stored for review and may be considered for RippleIQ’s institutional knowledge base. I understand it will not be used to train a model without a separate review and decision.</span>
          </label>
          {status && <p role="status" className="rounded-lg bg-slate-100 p-3 text-sm leading-6">{status}</p>}
          <button disabled={busy} className="w-full rounded-lg bg-[#163b68] px-4 py-3 font-semibold text-white transition hover:bg-[#102d50] disabled:cursor-wait disabled:opacity-60">{busy ? "Submitting…" : "Submit for review"}</button>
          <p className="text-center text-xs text-slate-500">Your submission is private to your organization and marked pending review.</p>
        </form>
      </div>
    </main>
  );
}
