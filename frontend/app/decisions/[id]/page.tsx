"use client";

import React, { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, CalendarDays, CircleAlert } from "lucide-react";
import { getDecision } from "@/lib/api";
import { Decision } from "@/types/decision";

export default function DecisionDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [decision, setDecision] = useState<Decision | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    getDecision(Number(id))
      .then((data) => {
        if (active) setDecision(data);
      })
      .catch((cause) => {
        if (active) setError(cause instanceof Error ? cause.message : "Could not load this decision.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [id]);

  if (loading) {
    return <div className="h-64 animate-pulse rounded-2xl border border-slate-200 bg-slate-100 dark:border-slate-800 dark:bg-slate-900" aria-label="Loading decision details" />;
  }

  if (error || !decision) {
    return (
      <section className="mx-auto max-w-2xl rounded-2xl border border-rose-200 bg-white p-6 text-center dark:border-rose-900 dark:bg-slate-900" role="alert">
        <CircleAlert className="mx-auto h-8 w-8 text-rose-600" aria-hidden="true" />
        <h1 className="mt-3 text-lg font-bold text-slate-900 dark:text-white">Decision unavailable</h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{error ?? "This proposal may have been archived or is unavailable."}</p>
        <Link href="/decisions" className="mt-4 inline-flex min-h-10 items-center rounded-lg bg-slate-900 px-4 text-sm font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 dark:bg-indigo-600">Return to decisions</Link>
      </section>
    );
  }

  const nextHref = decision.simulation_ready
    ? `/decisions/${id}/scenarios`
    : `/decisions/${id}/context`;

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <nav aria-label="Breadcrumb" className="text-sm text-slate-500">
        <ol className="flex flex-wrap items-center gap-2">
          <li><Link href="/decisions" className="underline-offset-4 hover:underline">Decisions</Link></li>
          <li aria-hidden="true">/</li>
          <li aria-current="page" className="max-w-[65vw] truncate font-medium text-slate-800 dark:text-slate-200">{decision.title}</li>
        </ol>
      </nav>

      <header className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 sm:p-7 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
          <span className="rounded-full bg-slate-100 px-2.5 py-1 dark:bg-slate-800">{decision.status}</span>
          <span>{decision.priority} priority</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-950 dark:text-white">{decision.title}</h1>
        <p className="whitespace-pre-wrap text-sm leading-6 text-slate-600 dark:text-slate-300">{decision.description}</p>
        <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-slate-500">
          {decision.department && <span>{decision.department}</span>}
          {decision.time_horizon && <span className="inline-flex items-center gap-1.5"><CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />{decision.time_horizon}</span>}
          <span>Created {new Date(decision.created_at).toLocaleDateString()}</span>
        </div>
        <div className="flex flex-wrap gap-3 border-t border-slate-100 pt-4 dark:border-slate-800">
          <button type="button" onClick={() => router.push(nextHref)} className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-indigo-700 px-4 text-sm font-semibold text-white hover:bg-indigo-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600">
            {decision.simulation_ready ? "Review analysis" : decision.context_attached ? "Continue to simulation" : "Add decision context"}
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </button>
          <Link href="/decisions" className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-300 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back to decisions
          </Link>
        </div>
      </header>
    </div>
  );
}
