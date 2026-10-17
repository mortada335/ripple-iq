"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Archive, Building2, LayoutDashboard, PlusCircle, Sliders, X } from "lucide-react";
import { CharterModal } from "./CharterModal";
import { useEffect, useRef, useState } from "react";

const NAV_ITEMS = [
  { label: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { label: "New decision", href: "/decisions/new", icon: PlusCircle },
  { label: "Decision history", href: "/decisions", icon: Archive },
];

function NavigationLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Main navigation" className="space-y-1">
      <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">Workspace</p>
      {NAV_ITEMS.map(({ label, href, icon: Icon }) => {
        const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={`group flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-300 ${
              active ? "bg-indigo-600 text-white shadow-sm" : "text-slate-300 hover:bg-white/10 hover:text-white"
            }`}
          >
            <Icon className={`h-[18px] w-[18px] ${active ? "text-white" : "text-slate-400 group-hover:text-white"}`} aria-hidden="true" />
            {label}
          </Link>
        );
      })}
      <div className="my-3 border-t border-white/10" />
      <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">Organization</p>
      <Link href="/onboarding" onClick={onNavigate} aria-current={pathname === "/onboarding" ? "page" : undefined} className={`flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-300 ${pathname === "/onboarding" ? "bg-indigo-600 text-white" : "text-slate-300 hover:bg-white/10 hover:text-white"}`}>
        <Building2 className="h-[18px] w-[18px] text-slate-400" aria-hidden="true" /> Organization setup <span className="ms-auto rounded-full bg-amber-400/15 px-2 py-0.5 text-[9px] font-bold uppercase text-amber-200">Demo</span>
      </Link>
      <Link href="/settings" onClick={onNavigate} aria-current={pathname === "/settings" ? "page" : undefined} className={`flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-300 ${pathname === "/settings" ? "bg-indigo-600 text-white" : "text-slate-300 hover:bg-white/10 hover:text-white"}`}>
        <Sliders className="h-[18px] w-[18px] text-slate-400" aria-hidden="true" /> Preferences
      </Link>
    </nav>
  );
}

export function Sidebar({ mobileOpen, onClose }: { mobileOpen: boolean; onClose: () => void }) {
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
      <aside className="sticky top-16 hidden h-[calc(100vh-4rem)] w-64 shrink-0 flex-col overflow-y-auto bg-slate-950 p-4 text-white shadow-xl md:flex">
        <NavigationLinks />
        <div className="mt-auto space-y-2 border-t border-white/10 pt-4">
          <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3">
            <p className="text-xs font-semibold text-white">Decision support, not automation</p>
            <p className="mt-1 text-[11px] leading-relaxed text-slate-400">Analysis is a demo estimate. People remain responsible for final decisions.</p>
            <button type="button" onClick={() => setCharterOpen(true)} className="mt-2 text-[11px] font-semibold text-indigo-300 hover:text-indigo-200 focus-visible:outline-2 focus-visible:outline-indigo-300">Review responsible use →</button>
          </div>
        </div>
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <button type="button" aria-label="Close navigation menu" onClick={onClose} className="absolute inset-0 bg-slate-950/60" />
          <aside ref={mobilePanelRef} role="dialog" aria-modal="true" aria-label="Navigation menu" className="absolute inset-y-0 start-0 flex w-[min(18rem,85vw)] flex-col bg-slate-950 p-4 text-white shadow-2xl">
            <div className="mb-6 flex items-center justify-between border-b border-white/10 pb-4">
              <span className="font-bold">Ripple<span className="text-indigo-300">IQ</span></span>
              <button ref={closeButtonRef} type="button" onClick={onClose} aria-label="Close navigation menu" className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-300 hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-indigo-300"><X className="h-5 w-5" aria-hidden="true" /></button>
            </div>
            <NavigationLinks onNavigate={onClose} />
            <p className="mt-auto border-t border-white/10 pt-4 text-[11px] leading-relaxed text-slate-400">Demo workspace · Sign-in and organization data are not connected yet.</p>
          </aside>
        </div>
      )}
      <CharterModal isOpen={charterOpen} onClose={() => setCharterOpen(false)} />
    </>
  );
}
