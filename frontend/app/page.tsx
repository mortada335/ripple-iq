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
  ChevronRight,
  ShieldAlert,
} from "lucide-react";

export default function HomePage() {
  const [activeScenario, setActiveScenario] = useState<1 | 2 | 3>(2);

  const scenariosData = {
    1: {
      number: "01",
      title: "As Written: Strict 4-Day Attendance",
      tagline: "Total Friday Campus Shutdown across all faculties",
      feasibility: 68,
      recommended: false,
      summary:
        "All instruction and auxiliary facilities condense into Monday–Thursday. Significant energy and transit savings, but research laboratories face thermal disruptions and animal facility access risks.",
      impacts: [
        { group: "Students", text: "Longer instructional days (8am–6pm) with 3-day weekend for study", tone: "positive" },
        { group: "Laboratories", text: "Cold storage alarms and restricted physical researcher access on Friday", tone: "negative" },
        { group: "Transportation", text: "20% drop in campus transit congestion and parking pressure", tone: "positive" },
      ],
      tradeoffs: "High financial/energy savings, but unacceptable risk to wet laboratories and ongoing research accreditation.",
    },
    2: {
      number: "02",
      title: "Modified: Lab & Auxiliary Protection",
      tagline: "4-Day Academic Week with Continuous Research Access",
      feasibility: 92,
      recommended: true,
      summary:
        "Undergraduate instruction moves to 4 days (Mon–Thu), while research labs, clinical facilities, and essential services maintain continuous Friday operations with reduced HVAC footprint.",
      impacts: [
        { group: "Faculty & Researchers", text: "Dedicated uninterrupted Friday research and grading block", tone: "positive" },
        { group: "Laboratories", text: "Zero research disruption with continuous biosafety & cold storage oversight", tone: "positive" },
        { group: "Administration", text: "Auxiliary staff scheduling adjustments required for partial Friday coverage", tone: "neutral" },
      ],
      tradeoffs: "Optimal balance: captures 80% of schedule flexibility benefits while eliminating catastrophic research facility risks.",
    },
    3: {
      number: "03",
      title: "Limited Pilot: 1-Year Phased Rollout",
      tagline: "Humanities & Social Sciences Pilot Only",
      feasibility: 78,
      recommended: false,
      summary:
        "Confines the 4-day schedule to non-laboratory departments for academic year 2026–2027. Gathers empirical attendance and performance data before broader institutional adoption.",
      impacts: [
        { group: "Pilot Cohorts", text: "Low-risk validation of asynchronous digital Friday learning", tone: "positive" },
        { group: "Campus Operations", text: "Dual-schedule administrative complexity and mixed transit routes", tone: "negative" },
        { group: "Students", text: "Disparity between laboratory and non-laboratory degree expectations", tone: "negative" },
      ],
      tradeoffs: "Lower initial operational disruption, but introduces institutional scheduling fragmentation across shared courses.",
    },
  };

  const current = scenariosData[activeScenario];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-indigo-500 selection:text-white">
      {/* Top Announcement Bar */}
      <div className="border-b border-indigo-500/20 bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-950 px-4 py-2 text-center text-xs text-indigo-200">
        <span className="inline-flex items-center gap-1.5 font-medium">
          <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
          <span>DevPost Hackathon Showcase · Institutional Decision Intelligence Engine</span>
          <span className="hidden sm:inline text-indigo-400">|</span>
          <span className="hidden sm:inline font-mono text-[11px] text-indigo-300">human_review_required: true</span>
        </span>
      </div>

      {/* Main Navigation */}
      <header className="sticky top-0 z-40 border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5 sm:px-8">
          <Link href="/" className="group flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-600/30 transition-transform group-hover:rotate-45">
              <Compass className="h-5 w-5" />
            </span>
            <div className="flex flex-col">
              <span className="text-lg font-bold tracking-tight text-white">
                Ripple<span className="text-indigo-400">IQ</span>
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                Decision Intelligence
              </span>
            </div>
          </Link>

          <nav className="flex items-center gap-3 text-xs sm:gap-4 sm:text-sm">
            <Link
              href="/login"
              className="rounded-lg border border-slate-700 px-3.5 py-1.5 font-semibold text-slate-200 hover:bg-slate-900 transition"
            >
              Sign In
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-1.5 font-semibold text-white shadow-sm hover:bg-indigo-500 transition"
            >
              <span>Explore Demo</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 sm:pt-20 sm:pb-28">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(99,102,241,0.25),transparent)]" />
        <div className="pointer-events-none absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 h-96 w-96 rounded-full bg-indigo-600/10 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-950/60 px-3.5 py-1 text-xs font-semibold text-indigo-300 shadow-sm backdrop-blur-xs">
              <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Institutional Decision Intelligence for Higher Education</span>
            </div>

            <h1 className="text-4xl font-extrabold tracking-tight sm:text-6xl text-white leading-tight">
              See the cascading ripples before your organization decides.
            </h1>

            <p className="text-base text-slate-300 sm:text-lg leading-relaxed">
              University leadership evaluates complex policies through multi-stakeholder simulations.
              Map 5 core campus constituencies, compare 3 alternative pathways, surface hidden operational risks,
              and produce audit-ready decision memoranda.
            </p>

            <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-600/30 hover:bg-indigo-500 transition"
              >
                <span>Launch Interactive Demo Workspace</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900/80 px-5 py-3 text-sm font-semibold text-slate-200 hover:bg-slate-800 transition"
              >
                <span>Sign in with Institution</span>
              </Link>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-6 pt-4 text-xs text-slate-400">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                <span>Deterministic explainable engine</span>
              </div>
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-indigo-400" />
                <span>Human review required by design</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Activity className="h-4 w-4 text-amber-400" />
                <span>Uncertainty & risk quantified</span>
              </div>
            </div>
          </div>

          {/* Interactive Live Decision Preview Simulator */}
          <div className="mt-14 rounded-2xl border border-slate-800 bg-slate-900/95 p-5 sm:p-8 shadow-2xl shadow-indigo-950/40 backdrop-blur-md">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-800 pb-5">
              <div>
                <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-indigo-400">
                  Interactive Simulator Preview
                </span>
                <h2 className="text-lg font-bold sm:text-xl text-white">
                  University Policy Proposal: 4-Day Attendance Shift
                </h2>
                <p className="text-xs text-slate-400">
                  Campus of 28,000 students · 1,400 faculty · 85 wet research laboratories · 68.5% transit dependency
                </p>
              </div>

              {/* Scenario Toggle Pills */}
              <div className="flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-950 p-1">
                {([1, 2, 3] as const).map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setActiveScenario(num)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                      activeScenario === num
                        ? "bg-indigo-600 text-white shadow-sm"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    Scenario 0{num}
                    {scenariosData[num].recommended && (
                      <span className="ms-1.5 rounded bg-emerald-400/20 px-1 py-0.2 text-[9px] font-bold text-emerald-300">
                        Pick
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Active Scenario Card Preview */}
            <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
              {/* Left Column: Overview & Feasibility */}
              <div className="space-y-4 lg:col-span-1 rounded-xl border border-slate-800/80 bg-slate-950/60 p-5">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold uppercase text-slate-400">
                    Scenario {current.number}
                  </span>
                  {current.recommended ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 border border-emerald-400/40 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
                      <Sparkles className="h-3 w-3" />
                      Executive Pick
                    </span>
                  ) : (
                    <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] font-medium text-slate-400">
                      Comparative Pathway
                    </span>
                  )}
                </div>

                <div>
                  <h3 className="text-base font-bold text-white">{current.title}</h3>
                  <p className="text-xs text-indigo-300/80 mt-0.5">{current.tagline}</p>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400 font-medium">Heuristic Feasibility</span>
                    <span className="font-bold text-indigo-400 font-mono">{current.feasibility}%</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        current.feasibility >= 85 ? "bg-emerald-500" : "bg-indigo-500"
                      }`}
                      style={{ width: `${current.feasibility}%` }}
                    />
                  </div>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">
                  {current.summary}
                </p>

                <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400">
                  <strong className="text-slate-200">Executive Trade-Off:</strong> {current.tradeoffs}
                </div>
              </div>

              {/* Middle Column: Stakeholder Ripple Effects */}
              <div className="space-y-4 lg:col-span-2 rounded-xl border border-slate-800/80 bg-slate-950/60 p-5">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Simulated Ripple Impacts by Stakeholder
                  </h4>
                  <span className="text-[10px] font-mono text-slate-500">5 Groups Monitored</span>
                </div>

                <div className="space-y-2.5">
                  {current.impacts.map((impact, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-3 rounded-xl border border-slate-800 bg-slate-900/80 p-3"
                    >
                      <span
                        className={`mt-0.5 shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                          impact.tone === "positive"
                            ? "bg-emerald-500/20 border border-emerald-400/30 text-emerald-300"
                            : impact.tone === "negative"
                            ? "bg-rose-500/20 border border-rose-400/30 text-rose-300"
                            : "bg-amber-500/20 border border-amber-400/30 text-amber-300"
                        }`}
                      >
                        {impact.group}
                      </span>
                      <p className="text-xs text-slate-200 leading-relaxed flex-1">
                        {impact.text}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Bottom Bar: Action & Full Workspace Link */}
                <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-800 pt-4">
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <ShieldAlert className="h-4 w-4 text-amber-400" />
                    <span>Analysis output is an advisory model. Leadership retains full final review.</span>
                  </div>

                  {/* <Link
                    href="/decisions/1/scenarios"
                    className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-indigo-500 transition"
                  >
                    <span>Inspect Full 6-Stage Analysis</span>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Link> */}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4 Core Pillars of Institutional Trust */}
      <section className="border-t border-slate-800/80 bg-slate-900/50 py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-8">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-indigo-400">
              Institutional Governance Tenets
            </span>
            <h2 className="text-2xl font-bold sm:text-3xl text-white">
              Built specifically for high-stakes higher education decisions
            </h2>
            <p className="text-sm text-slate-400">
              Unlike generic LLM wrappers, RippleIQ enforces transparent constraints, explicit confidence ratings,
              and mandatory human deliberation.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: ShieldCheck,
                title: "Human Review Required",
                desc: "Every recommendation explicitly requires human sign-off. The platform cannot automate or commit institutional decisions.",
                color: "text-amber-400",
                badge: "Mandatory",
              },
              {
                icon: Users2,
                title: "5 Core Stakeholders",
                desc: "Evaluates cascading ripples across Students, Faculty, Research Laboratories, Administration, and Transit systems.",
                color: "text-indigo-400",
                badge: "Holistic",
              },
              {
                icon: GitCompare,
                title: "3 Comparative Scenarios",
                desc: "Never forces a binary yes/no. Generates As-Written, Modified Protection, and Phased Pilot options with feasibility scores.",
                color: "text-emerald-400",
                badge: "Trade-offs",
              },
              {
                icon: FileText,
                title: "Audit-Ready Export",
                desc: "Generates formatted board-ready memoranda, Word (.docx) executive summaries, and raw compliance Markdown records.",
                color: "text-sky-400",
                badge: "Governance",
              },
            ].map((pillar) => {
              const Icon = pillar.icon;
              return (
                <div
                  key={pillar.title}
                  className="rounded-2xl border border-slate-800 bg-slate-950 p-6 shadow-sm hover:border-indigo-500/50 transition-all group"
                >
                  <div className="flex items-center justify-between">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 group-hover:bg-indigo-950/60 transition">
                      <Icon className={`h-5 w-5 ${pillar.color}`} />
                    </span>
                    <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] font-semibold text-slate-400">
                      {pillar.badge}
                    </span>
                  </div>
                  <h3 className="mt-4 text-base font-bold text-white">{pillar.title}</h3>
                  <p className="mt-2 text-xs text-slate-400 leading-relaxed">{pillar.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 6-Stage Workflow Journey */}
      <section className="border-t border-slate-800/80 py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-8">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-indigo-400">
              The Decision Lifecycle
            </span>
            <h2 className="text-2xl font-bold sm:text-3xl text-white">
              From operational proposal to synthesized memorandum
            </h2>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-6">
            {[
              { step: "01", name: "Context", label: "Input institutional headcount, labs, transit, and PDF constraints" },
              { step: "02", name: "Scenarios", label: "Generate 3 comparative implementation pathways" },
              { step: "03", name: "Ripples", label: "Map positive and adverse consequences across 5 constituent groups" },
              { step: "04", name: "Risks", label: "Calibrate severity and likelihood on a 3x3 Risk Matrix" },
              { step: "05", name: "Synthesize", label: "Deliver confidence score, core rationale, and AI refinement" },
              { step: "06", name: "Memorandum", label: "Export audit-grade board memorandum to Word or Markdown" },
            ].map((stage) => (
              <div
                key={stage.step}
                className="relative flex flex-col justify-between rounded-xl border border-slate-800 bg-slate-900/60 p-4"
              >
                <div>
                  <span className="font-mono text-xs font-bold text-indigo-400">Stage {stage.step}</span>
                  <h3 className="mt-1 text-sm font-bold text-white">{stage.name}</h3>
                  <p className="mt-2 text-[11px] text-slate-400 leading-relaxed">{stage.label}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <Link
              href="/decisions/new"
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-bold text-white shadow-md hover:bg-indigo-500 transition"
            >
              <span>Create Your First Policy Proposal</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-950 px-4 py-8 text-xs text-slate-500 sm:px-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-2">
            <Compass className="h-4 w-4 text-indigo-400" />
            <span className="font-bold text-slate-300">RippleIQ</span>
            <span>· Institutional Decision Intelligence</span>
          </div>

          <p className="text-center sm:text-right">
            RippleIQ provides algorithmic decision-support models for deliberation; humans retain full governance authority.
          </p>
        </div>
      </footer>
    </div>
  );
}
