"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  PlusCircle,
  Archive,
  Sliders,
  BookOpen,
} from "lucide-react";
import { CharterModal } from "./CharterModal";

const NAV_ITEMS = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    badge: null,
  },
  {
    label: "New Decision",
    href: "/decisions/new",
    icon: PlusCircle,
    badge: "Create",
  },
  {
    label: "Historical Decisions",
    href: "/decisions",
    icon: Archive,
    badge: null,
  },
  {
    label: "Institutional Settings",
    href: "/settings",
    icon: Sliders,
    badge: null,
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const [charterOpen, setCharterOpen] = useState(false);

  return (
    <>
      <aside className="hidden w-64 shrink-0 flex-col border-e border-slate-200 bg-slate-50/70 p-4 transition-colors dark:border-slate-800 dark:bg-slate-950 md:flex sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto">
        {/* Navigation menu */}
        <nav className="flex-1 space-y-1">
          <div className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Decision Workspace
          </div>
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname?.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`group flex items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold transition-all ${
                  isActive
                    ? "bg-slate-900 text-white shadow-xs dark:bg-indigo-600 dark:text-white"
                    : "text-slate-600 hover:bg-slate-200/60 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-slate-100"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon
                    className={`h-4 w-4 transition-transform group-hover:scale-110 ${
                      isActive
                        ? "text-white"
                        : "text-slate-500 dark:text-slate-400"
                    }`}
                  />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${
                      isActive
                        ? "bg-white/20 text-white"
                        : "bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300"
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Institutional Knowledge Widget */}
        <div className="mt-auto space-y-2 pt-4 border-t border-slate-200 dark:border-slate-800/80">
          <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-xs dark:border-slate-800 dark:bg-slate-900/60">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-900 dark:text-slate-100">
              <BookOpen className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
              <span>Policy Guidelines</span>
            </div>
            <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
              Simulations are estimates for discussion and require human review.
            </p>
            <button
              type="button"
              onClick={() => setCharterOpen(true)}
              className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 cursor-pointer"
            >
              Review Responsible Use →
            </button>
          </div>
        </div>
      </aside>

      <CharterModal isOpen={charterOpen} onClose={() => setCharterOpen(false)} />
    </>
  );
}
