import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "RippleIQ | Explore decision consequences before acting",
  description:
    "Map scenarios, compare possible impacts, and review assumptions before your organization makes an important decision.",
  robots: { index: true, follow: true },
  openGraph: {
    title: "RippleIQ | Explore decision consequences before acting",
    description:
      "Map scenarios, compare possible impacts, and review assumptions before your organization makes an important decision.",
  },
};

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5 sm:px-8">
        <Link href="/" className="text-lg font-bold">
          Ripple<span className="text-indigo-400">IQ</span>
        </Link>
        <nav
          aria-label="Main navigation"
          className="flex items-center gap-4 text-sm"
        >
          <Link href="/login" className="text-slate-300 hover:text-white">
            Sign in
          </Link>
          <Link
            href="/register"
            className="rounded-lg bg-indigo-600 px-4 py-2 font-semibold hover:bg-indigo-500"
          >
            Create account
          </Link>
        </nav>
      </header>
      <section className="mx-auto grid max-w-6xl gap-12 px-5 pb-24 pt-20 sm:px-8 sm:pt-28 lg:grid-cols-[1.15fr_.85fr] lg:items-center">
        <div>
          <p className="text-xs font-bold uppercase tracking-[.2em] text-indigo-300">
            Decision planning for teams
          </p>
          <h1 className="mt-5 max-w-3xl text-4xl font-bold tracking-tight sm:text-6xl">
            See the possible ripples before you decide.
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">
            Explore scenarios, compare potential impacts, and make assumptions
            visible while your team considers consequential organizational
            decisions.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/register"
              className="rounded-lg bg-indigo-600 px-5 py-3 text-sm font-semibold hover:bg-indigo-500"
            >
              Get started
            </Link>
            <Link
              href="/login#demo-entry"
              className="rounded-lg border border-slate-700 px-5 py-3 text-sm font-semibold text-slate-200 hover:bg-slate-900"
            >
              Sign in or explore the demo
            </Link>
          </div>
        </div>
        <div
          aria-label="Example decision analysis preview"
          className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl"
        >
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">
            Decision preview
          </p>
          <h2 className="mt-3 text-lg font-semibold">
            Consider a change across multiple scenarios
          </h2>
          <p className="mt-2 text-sm text-slate-400">
            Compare possible benefits, risks, and affected stakeholder groups
            before choosing a path.
          </p>
          <div className="mt-7 space-y-4">
            {[
              {
                label: "Operational continuity",
                width: "78%",
                color: "bg-indigo-400",
              },
              {
                label: "Stakeholder readiness",
                width: "62%",
                color: "bg-emerald-400",
              },
              {
                label: "Implementation effort",
                width: "48%",
                color: "bg-amber-400",
              },
            ].map((item) => (
              <div key={item.label}>
                <div className="mb-2 flex justify-between text-xs text-slate-300">
                  <span>{item.label}</span>
                  <span>Illustrative</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-800">
                  <div
                    className={`h-full rounded-full ${item.color}`}
                    style={{ width: item.width }}
                  />
                </div>
              </div>
            ))}
          </div>
          <p className="mt-6 border-t border-slate-800 pt-4 text-xs leading-5 text-slate-500">
            Illustrative interface preview. Analysis outputs are estimates and
            require human review.
          </p>
        </div>
      </section>
      <footer className="border-t border-slate-800 px-5 py-6 text-center text-xs text-slate-500">
        RippleIQ supports structured exploration; teams remain responsible for
        decisions and review.
      </footer>
    </div>
  );
}
