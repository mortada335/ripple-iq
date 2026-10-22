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
    <div className="md:hidden fixed bottom-6 end-6 z-50 pointer-events-none">
      <Link
        href="/decisions/new"
        aria-label={t("newDecision")}
        title={t("newDecision")}
        className="group relative pointer-events-auto flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-tr from-indigo-600 via-indigo-600 to-violet-500 text-white shadow-2xl shadow-indigo-600/50 hover:shadow-indigo-600/70 active:scale-95 transition-all duration-300 border border-white/30 dark:border-white/20 ring-4 ring-white/80 dark:ring-slate-900/80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
      >
        {/* Ambient breathing glow ring */}
        <span
          aria-hidden="true"
          className="absolute -inset-1 rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-600 opacity-40 blur-md group-hover:opacity-80 transition-opacity duration-300 animate-pulse-slow"
        />

        {/* Shimmer light reflection layer */}
        <span
          aria-hidden="true"
          className="absolute inset-0 rounded-full bg-gradient-to-b from-white/30 via-transparent to-black/10 pointer-events-none"
        />

        {/* Floating Sparkle Micro-badge */}
        <span
          aria-hidden="true"
          className="absolute -top-1 -start-1 flex h-4 w-4 items-center justify-center rounded-full bg-amber-400 text-amber-950 shadow-sm border border-white dark:border-slate-900 scale-90 group-hover:scale-110 transition-transform"
        >
          <Sparkles className="h-2.5 w-2.5 fill-current" />
        </span>

        {/* Plus Icon with smooth rotation on interaction */}
        <Plus
          className="relative z-10 h-6 w-6 stroke-[2.7] transition-transform duration-300 ease-out group-hover:rotate-90 group-hover:scale-110 group-active:rotate-45"
          aria-hidden="true"
        />

        {/* Screen Reader Label */}
        <span className="sr-only">{t("newDecision")}</span>
      </Link>
    </div>
  );
}
