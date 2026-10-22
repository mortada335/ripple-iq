"use client";

import React from "react";
import { useLocale } from "@/components/LocaleProvider";

export function FacebookIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fillRule="evenodd"
        d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"
        clipRule="evenodd"
      />
    </svg>
  );
}

interface FacebookLinkProps {
  variant?: "pill" | "icon" | "card";
  className?: string;
}

export function FacebookLink({ variant = "pill", className = "" }: FacebookLinkProps) {
  const { locale } = useLocale();
  const isAr = locale === "ar";
  const facebookUrl = process.env.NEXT_PUBLIC_FACEBOOK_URL || "https://facebook.com/RippleIQ";

  if (variant === "icon") {
    return (
      <a
        href={facebookUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={isAr ? "تابع صفحة RippleIQ الرسمية على فيسبوك" : "Follow RippleIQ official page on Facebook"}
        title={isAr ? "مجتمع فيسبوك الرسمي" : "Official Facebook Community"}
        className={`inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400 dark:hover:border-blue-900 dark:hover:bg-blue-950/40 dark:hover:text-blue-400 transition cursor-pointer ${className}`}
      >
        <FacebookIcon className="h-4 w-4" />
      </a>
    );
  }

  if (variant === "card") {
    return (
      <a
        href={facebookUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={`group flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-xs hover:border-blue-300 hover:shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:hover:border-blue-900/60 transition ${className}`}
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400 group-hover:scale-105 transition-transform">
            <FacebookIcon className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition">
              {isAr ? "صفحة ومجتمع فيسبوك" : "Facebook Community & Updates"}
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {isAr ? "تابع تحديثات ونقاشات الحوكمة المؤسسية" : "Follow institutional governance updates & announcements"}
            </p>
          </div>
        </div>
        <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 group-hover:translate-x-0.5 transition-transform">
          {isAr ? "زيارة الصفحة ←" : "Visit Page →"}
        </span>
      </a>
    );
  }

  return (
    <a
      href={facebookUrl}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={isAr ? "متابعة RippleIQ على فيسبوك" : "Follow RippleIQ on Facebook"}
      className={`inline-flex items-center gap-2 rounded-xl border border-blue-200/80 bg-blue-50/70 px-3 py-1.5 text-xs font-semibold text-blue-800 hover:bg-blue-100 hover:border-blue-300 dark:border-blue-900/60 dark:bg-blue-950/40 dark:text-blue-300 dark:hover:bg-blue-900/60 transition cursor-pointer ${className}`}
    >
      <FacebookIcon className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
      <span>{isAr ? "فيسبوك" : "Facebook"}</span>
    </a>
  );
}
