"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Compass, Loader2, Lock, Mail, User } from "lucide-react";
import { registerAccount, loginAccount } from "@/lib/api";
import { useAuth } from "@/components/AuthProvider";
import { useLocale } from "@/components/LocaleProvider";
import { LanguageToggle } from "@/components/LanguageToggle";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function RegisterPage() {
  const router = useRouter();
  const { refresh } = useAuth();
  const { t } = useLocale();
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
      await refresh();
      router.replace("/dashboard");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not create your account. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-50 px-4 py-10 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      {/* Ambient background glows */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(99,102,241,0.08),transparent)] dark:bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.25),rgba(255,255,255,0))]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-40 start-1/2 -translate-x-1/2 h-[500px] w-[600px] rounded-full bg-indigo-500/10 blur-[120px]"
      />

      {/* Top action controls: Language & Theme */}
      <header className="absolute top-4 end-4 z-20 flex items-center gap-2">
        <LanguageToggle />
        <ThemeToggle />
      </header>

      <div className="relative z-10 w-full max-w-md space-y-6">
        {/* Brand logo */}
        <Link
          href="/"
          className="mx-auto flex w-fit items-center gap-3 rounded-2xl p-1.5 focus-visible:outline-2 focus-visible:outline-indigo-400 group"
        >
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 group-hover:bg-indigo-500 transition">
            <Compass className="h-6 w-6" aria-hidden="true" />
          </span>
          <div className="text-start">
            <span className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
              Ripple<span className="text-indigo-600 dark:text-indigo-400">IQ</span>
            </span>
            <span className="block text-[10px] font-medium tracking-wider uppercase text-slate-500 dark:text-slate-400">
              {t("appTagline")}
            </span>
          </div>
        </Link>

        {/* Register Card */}
        <section
          className="rounded-3xl border border-slate-200/90 bg-white/95 p-6 sm:p-8 shadow-xl backdrop-blur-xl dark:border-slate-800/80 dark:bg-slate-900/80 dark:shadow-2xl"
          aria-labelledby="register-title"
        >
          <div className="text-start">
            <h1 id="register-title" className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              {t("createYourAccount")}
            </h1>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{t("registerSubtitle")}</p>
          </div>

          {error && (
            <p
              role="alert"
              className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-medium text-rose-800 dark:border-rose-800/80 dark:bg-rose-950/40 dark:text-rose-300"
            >
              {error}
            </p>
          )}

          <form onSubmit={submit} className="mt-6 space-y-4">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300" htmlFor="full-name">
              {t("fullName")}
              <span className="relative mt-1.5 block">
                <User
                  className="pointer-events-none absolute start-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500"
                  aria-hidden="true"
                />
                <input
                  id="full-name"
                  name="name"
                  autoComplete="name"
                  required
                  maxLength={120}
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Dr. Jordan Rivera"
                  className="w-full rounded-xl border border-slate-300 bg-slate-50/60 py-2.5 ps-10 pe-4 text-xs text-slate-900 placeholder-slate-400 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700/80 dark:bg-slate-800/90 dark:text-white dark:placeholder-slate-500"
                />
              </span>
            </label>

            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300" htmlFor="register-email">
              {t("email")}
              <span className="relative mt-1.5 block">
                <Mail
                  className="pointer-events-none absolute start-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500"
                  aria-hidden="true"
                />
                <input
                  id="register-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  maxLength={254}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="jordan@institution.edu"
                  className="w-full rounded-xl border border-slate-300 bg-slate-50/60 py-2.5 ps-10 pe-4 text-xs text-slate-900 placeholder-slate-400 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700/80 dark:bg-slate-800/90 dark:text-white dark:placeholder-slate-500"
                />
              </span>
            </label>

            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300" htmlFor="register-password">
              {t("password")}
              <span className="relative mt-1.5 block">
                <Lock
                  className="pointer-events-none absolute start-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500"
                  aria-hidden="true"
                />
                <input
                  id="register-password"
                  name="new-password"
                  type="password"
                  autoComplete="new-password"
                  required
                  minLength={12}
                  maxLength={128}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  aria-describedby="password-help"
                  className="w-full rounded-xl border border-slate-300 bg-slate-50/60 py-2.5 ps-10 pe-4 text-xs text-slate-900 placeholder-slate-400 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700/80 dark:bg-slate-800/90 dark:text-white dark:placeholder-slate-500"
                />
              </span>
              <span id="password-help" className="mt-1 block text-[11px] text-slate-500 dark:text-slate-400">
                {t("passwordHelp")}
              </span>
            </label>

            <button
              type="submit"
              disabled={loading}
              className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 text-xs font-bold text-white shadow-md shadow-indigo-600/20 hover:bg-indigo-500 disabled:cursor-wait disabled:opacity-60 transition cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  <span>{t("creatingAccount")}</span>
                </>
              ) : (
                <>
                  <span>{t("register")}</span>
                  <ArrowRight className="h-4 w-4 rtl:rotate-180" aria-hidden="true" />
                </>
              )}
            </button>
          </form>

          <p className="mt-5 text-center text-xs text-slate-600 dark:text-slate-400">
            {t("alreadyHaveAccount")}{" "}
            <Link
              href="/login"
              className="font-semibold text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300 underline-offset-2 hover:underline"
            >
              {t("signIn")}
            </Link>
          </p>
        </section>
      </div>
    </div>
  );
}
