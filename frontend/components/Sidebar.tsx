"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Archive, ArrowRight, Building2, Compass, LayoutDashboard, PlusCircle, ShieldCheck, Sliders, X } from "lucide-react";
import { CharterModal } from "./CharterModal";
import { ThemeToggle } from "./ThemeToggle";
import { LanguageToggle } from "./LanguageToggle";
import { useEffect, useRef, useState } from "react";
import { useLocale } from "@/components/LocaleProvider";

const NAV_ITEMS = [
  { label: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { label: "New decision", href: "/decisions/new", icon: PlusCircle },
  { label: "Decision history", href: "/decisions", icon: Archive },
];

function NavigationLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { t } = useLocale();

  return (
    <nav aria-label="Mobile navigation" className="space-y-1.5">
      <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
        {t("workspace")}
      </p>
      {NAV_ITEMS.map(({ href, icon: Icon }) => {
        const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={`group flex min-h-11 items-center gap-3 rounded-xl px-3.5 text-sm font-semibold transition-all ${
              active
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-slate-700 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
            }`}
          >
            <Icon
              className={`h-4 w-4 ${active ? "text-white" : "text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200"}`}
              aria-hidden="true"
            />
            {href === "/dashboard" ? t("dashboard") : href === "/decisions/new" ? t("newDecision") : t("history")}
          </Link>
        );
      })}

      <div className="my-4 border-t border-slate-200 dark:border-slate-800" />
      <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
        {t("sidebarSettingsOrg")}
      </p>
      <Link
        href="/onboarding"
        onClick={onNavigate}
        aria-current={pathname === "/onboarding" ? "page" : undefined}
        className={`flex min-h-11 items-center gap-3 rounded-xl px-3.5 text-sm font-semibold transition-all ${
          pathname === "/onboarding"
            ? "bg-indigo-600 text-white shadow-sm"
            : "text-slate-700 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
        }`}
      >
        <Building2 className="h-4 w-4 text-slate-400" aria-hidden="true" />
        <span>{t("organization")}</span>
      </Link>
      <Link
        href="/settings"
        onClick={onNavigate}
        aria-current={pathname === "/settings" ? "page" : undefined}
        className={`flex min-h-11 items-center gap-3 rounded-xl px-3.5 text-sm font-semibold transition-all ${
          pathname === "/settings"
            ? "bg-indigo-600 text-white shadow-sm"
            : "text-slate-700 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
        }`}
      >
        <Sliders className="h-4 w-4 text-slate-400" aria-hidden="true" />
        <span>{t("settings")}</span>
      </Link>
    </nav>
  );
}

export function Sidebar({ mobileOpen, onClose }: { mobileOpen: boolean; onClose: () => void }) {
  const { t, locale } = useLocale();
  const [charterOpen, setCharterOpen] = useState(false);
  const mobilePanelRef = useRef<HTMLElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!mobileOpen) return;

    const previousOverflow = document.body.style.overflow;
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== "Tab" || !mobilePanelRef.current) return;

      const focusable = mobilePanelRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
      previousFocus?.focus();
    };
  }, [mobileOpen, onClose]);

  return (
    <>
      {/* Mobile Drawer (Only rendered on mobile when mobileOpen is true) */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Backdrop */}
          <button
            type="button"
            aria-label="Close navigation menu"
            onClick={onClose}
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity"
          />

          {/* Drawer Panel */}
          <aside
            ref={mobilePanelRef}
            role="dialog"
            aria-modal="true"
            aria-label="Navigation menu"
            className="absolute inset-y-0 start-0 flex w-[min(20rem,88vw)] flex-col bg-white p-5 text-slate-900 shadow-2xl dark:border-e dark:border-slate-800 dark:bg-slate-900 dark:text-white"
          >
            {/* Header */}
            <div className="mb-6 flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm">
                  <Compass className="h-4 w-4" aria-hidden="true" />
                </span>
                <span className="font-extrabold text-base tracking-tight text-slate-950 dark:text-white">
                  Ripple<span className="text-indigo-600 dark:text-indigo-400">IQ</span>
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <LanguageToggle />
                <ThemeToggle />
                <button
                  ref={closeButtonRef}
                  type="button"
                  onClick={onClose}
                  aria-label="Close navigation menu"
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
                >
                  <X className="h-5 w-5" aria-hidden="true" />
                </button>
              </div>
            </div>

            {/* Navigation links */}
            <NavigationLinks onNavigate={onClose} />

            {/* Footer Responsible AI Card */}
            <div className="mt-auto space-y-3 border-t border-slate-100 pt-4 dark:border-slate-800">
              <div className="rounded-xl border border-slate-200/80 bg-slate-50/80 p-3.5 dark:border-slate-800 dark:bg-slate-800/40">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 dark:text-white">
                  <ShieldCheck className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
                  <span>{t("responsibleDecisionSupport")}</span>
                </div>
                <p className="mt-1 text-[11px] leading-relaxed text-slate-600 dark:text-slate-400">
                  {t("advisorySimulationNotice")}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    setCharterOpen(true);
                  }}
                  className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300"
                >
                  <span>{t("reviewCharter")}</span>
                  <ArrowRight className="h-3 w-3 rtl:rotate-180" aria-hidden="true" />
                </button>
              </div>
            </div>
          </aside>
        </div>
      )}

      {/* Charter Modal */}
      <CharterModal isOpen={charterOpen} onClose={() => setCharterOpen(false)} />
    </>
  );
}
