"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Compass, Loader2, Lock, Mail } from "lucide-react";
import { toast } from "sonner";
import { loginAccount } from "@/lib/api";
import { useAuth } from "@/components/AuthProvider";

export default function LoginPage() {
  const router = useRouter();
  const { startDemo, refresh } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      await loginAccount(email.trim(), password);
      const hasOrganization = await refresh();
      router.replace(hasOrganization ? "/dashboard" : "/onboarding");
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "Could not sign in. Try again.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  function enterDemo() {
    startDemo();
    toast.info("Demo workspace opened", { description: "Demo data stays in this browser and is not sent to the API." });
    router.push("/dashboard");
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 px-4 py-10 text-slate-100">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/30 via-slate-950 to-slate-950" />
      <div className="relative w-full max-w-md space-y-6">
        <Link href="/" className="mx-auto flex w-fit items-center gap-3 rounded-xl focus-visible:outline-2 focus-visible:outline-indigo-400">
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-indigo-600"><Compass className="h-6 w-6" aria-hidden="true" /></span>
          <span className="text-xl font-bold">Ripple<span className="text-indigo-400">IQ</span></span>
        </Link>
        <section className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6 shadow-2xl sm:p-8" aria-labelledby="login-title">
          <h1 id="login-title" className="text-xl font-bold">Sign in to your workspace</h1>
          <p className="mt-1 text-sm text-slate-400">Use your RippleIQ account to continue.</p>
          {error && <p role="alert" className="mt-4 rounded-lg border border-rose-800 bg-rose-950/50 p-3 text-sm text-rose-200">{error}</p>}
          <form onSubmit={submit} className="mt-6 space-y-4">
            <label className="block text-sm font-medium" htmlFor="email">Email address
              <span className="relative mt-1.5 block"><Mail className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" aria-hidden="true" /><input id="email" name="email" type="email" autoComplete="username" required maxLength={254} value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-lg border border-slate-700 bg-slate-800 py-2.5 ps-10 pe-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30" /></span>
            </label>
            <label className="block text-sm font-medium" htmlFor="password">Password
              <span className="relative mt-1.5 block"><Lock className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" aria-hidden="true" /><input id="password" name="password" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full rounded-lg border border-slate-700 bg-slate-800 py-2.5 ps-10 pe-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30" /></span>
            </label>
            <button type="submit" disabled={loading} className="flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 text-sm font-semibold text-white hover:bg-indigo-500 disabled:cursor-wait disabled:opacity-60">
              {loading ? <><Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />Signing in…</> : <>Sign in<ArrowRight className="h-4 w-4" aria-hidden="true" /></>}
            </button>
          </form>
          <p className="mt-5 text-center text-sm text-slate-400">New to RippleIQ? <Link href="/register" className="font-semibold text-indigo-300 hover:text-white">Create an account</Link></p>
          <div className="my-5 flex items-center gap-3 text-xs text-slate-500"><span className="h-px flex-1 bg-slate-800" />or preview<span className="h-px flex-1 bg-slate-800" /></div>
          <button id="demo-entry" type="button" onClick={enterDemo} className="min-h-11 w-full rounded-lg border border-slate-700 px-4 text-sm font-semibold text-slate-200 hover:bg-slate-800">Explore demo workspace</button>
          <p className="mt-3 text-center text-xs leading-5 text-slate-500">Demo information stays in this browser. Account access requires the RippleIQ API.</p>
        </section>
      </div>
    </div>
  );
}
