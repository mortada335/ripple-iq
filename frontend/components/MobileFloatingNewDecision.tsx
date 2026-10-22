"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Plus, Sparkles } from "lucide-react";
import { useLocale } from "@/components/LocaleProvider";

/**
 * Mobile-only Premium Floating Action Button (FAB) for "New Decision".
 * - Visible only on mobile / small phone screens (md:hidden).
 * - Floats at the bottom corner with safe-area padding.
 * - Icon-only with stunning multi-layer glow, tactile micro-interactions, and rotation animation.
 * - Fully accessible with screen-reader text and tooltips.
 */
export function MobileFloatingNewDecision() {
  const pathname = usePathname();
  const { t, locale } = useLocale();
  const isAr = locale === "ar";

  // Do not show FAB when already on the new decision form, or on authentication pages
  if (
    pathname === "/decisions/new" ||
    pathname === "/login" ||
    pathname === "/register"
  ) {
    return null;
  }

  return (
    <div
      className="md:hidden fixed z-50 pointer-events-none transition-all duration-300"
      style={{
        bottom: "calc(1.5rem + env(safe-area-inset-bottom, 0px))",
        right: isAr ? "auto" : "calc(1.5rem + env(safe-area-inset-right, 0px))",
        left: isAr ? "calc(1.5rem + env(safe-area-inset-left, 0px))" : "auto",
      }}
    >
      <Link
        href="/decisions/new"
        aria-label={t("newDecision")}
        title={t("newDecision")}
        className="group relative pointer-events-auto flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-tr from-indigo-600 via-indigo-600 to-violet-500 text-white shadow-[0_10px_25px_-4px_rgba(79,70,229,0.5),0_8px_10px_-6px_rgba(79,70,229,0.4)] hover:shadow-[0_16px_32px_-6px_rgba(79,70,229,0.65)] active:scale-90 transition-all duration-300 ease-out border border-white/40 dark:border-white/20 ring-4 ring-white/90 dark:ring-slate-900/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 backdrop-blur-md"
      >
        {/* Soft radial ambient halo */}
        <span
          aria-hidden="true"
          className="absolute -inset-1.5 rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-600 opacity-40 blur-md group-hover:opacity-75 transition-opacity duration-300 animate-pulse-slow pointer-events-none"
        />

        {/* Outer subtle radar ring pulse */}
        <span
          aria-hidden="true"
          className="absolute -inset-1 rounded-full border border-indigo-400/30 opacity-70 group-hover:scale-110 transition-transform duration-500 pointer-events-none"
        />

        {/* 3D Glassmorphic gloss reflection */}
        <span
          aria-hidden="true"
          className="absolute inset-0 rounded-full bg-gradient-to-b from-white/35 via-white/10 to-transparent pointer-events-none"
        />

        {/* Sparkle Micro-badge */}
        <span
          aria-hidden="true"
          className="absolute -top-1 -start-1 flex h-4 w-4 items-center justify-center rounded-full bg-gradient-to-br from-amber-300 to-amber-500 text-amber-950 shadow-md border border-white/80 dark:border-slate-900 scale-90 group-hover:scale-110 group-active:scale-75 transition-transform duration-200"
        >
          <Sparkles className="h-2.5 w-2.5 fill-current" />
        </span>

        {/* Plus Icon with ultra-fluid rotation and spring micro-interaction */}
        <Plus
          className="relative z-10 h-6 w-6 stroke-[2.8] transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:rotate-90 group-hover:scale-110 group-active:rotate-45 group-active:scale-95"
          aria-hidden="true"
        />

        {/* Accessible screen reader label */}
        <span className="sr-only">{t("newDecision")}</span>
      </Link>
    </div>
  );
}
