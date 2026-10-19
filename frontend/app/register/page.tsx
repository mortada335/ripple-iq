"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Compass, Loader2 } from "lucide-react";
import { registerAccount, loginAccount } from "@/lib/api";
import { useAuth } from "@/components/AuthProvider";

export default function RegisterPage() {
  const router = useRouter();
  const { refresh } = useAuth();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      await registerAccount({ email: email.trim(), full_name: fullName.trim(), password });
      await loginAccount(email.trim(), password);
      const hasOrganization = await refresh();
      router.replace(hasOrganization ? "/dashboard" : "/onboarding");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not create your account. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-10 text-slate-100">
    <section className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl sm:p-8" aria-labelledby="register-title">
      <Link href="/" className="mb-6 flex w-fit items-center gap-2 text-lg font-bold"><Compass className="h-6 w-6 text-indigo-400" aria-hidden="true" />RippleIQ</Link>
      <h1 id="register-title" className="text-xl font-bold">Create your account</h1>
      <p className="mt-1 text-sm text-slate-400">Set up a workspace for your organization.</p>
      {error && <p role="alert" className="mt-4 rounded-lg border border-rose-800 bg-rose-950/50 p-3 text-sm text-rose-200">{error}</p>}
      <form onSubmit={submit} className="mt-6 space-y-4">
        <label htmlFor="full-name" className="block text-sm font-medium">Full name<input id="full-name" name="name" autoComplete="name" required maxLength={120} value={fullName} onChange={(e) => setFullName(e.target.value)} className="mt-1.5 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2.5 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30" /></label>
        <label htmlFor="register-email" className="block text-sm font-medium">Email address<input id="register-email" name="email" type="email" autoComplete="email" required maxLength={254} value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1.5 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2.5 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30" /></label>
        <label htmlFor="register-password" className="block text-sm font-medium">Password<input id="register-password" name="new-password" type="password" autoComplete="new-password" required minLength={12} maxLength={128} value={password} onChange={(e) => setPassword(e.target.value)} aria-describedby="password-help" className="mt-1.5 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2.5 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30" /><span id="password-help" className="mt-1 block text-xs text-slate-500">Use 12–128 characters.</span></label>
        <button type="submit" disabled={loading} className="flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 text-sm font-semibold hover:bg-indigo-500 disabled:opacity-60">{loading ? <><Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />Creating account…</> : "Create account"}</button>
      </form>
      <p className="mt-5 text-center text-sm text-slate-400">Already have an account? <Link href="/login" className="font-semibold text-indigo-300 hover:text-white">Sign in</Link></p>
    </section>
  </div>;
}
