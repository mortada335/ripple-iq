"use client";

import React, { useState } from "react";
import { usePathname } from "next/navigation";
import { Header } from "./Header";
import { Sidebar } from "./Sidebar";
import { HumanReviewBanner } from "./HumanReviewBanner";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileNavigationOpen, setMobileNavigationOpen] = useState(false);
  const isLoginPage = pathname === "/login";

  if (isLoginPage) {
    return <main className="min-h-screen bg-slate-950 flex flex-col">{children}</main>;
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans">
      <a
        href="#main-content"
        className="absolute start-2 top-2 z-50 -translate-y-16 rounded-md bg-white px-4 py-2 text-sm font-semibold text-slate-900 shadow focus:translate-y-0"
      >
        Skip to content
      </a>
      <Header onOpenNavigation={() => setMobileNavigationOpen(true)} />
      <div className="flex flex-1 items-start">
        <Sidebar mobileOpen={mobileNavigationOpen} onClose={() => setMobileNavigationOpen(false)} />
        <main id="main-content" className="flex-1 flex flex-col min-w-0">
          <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-5 space-y-4 sm:space-y-5">
            <HumanReviewBanner />
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
