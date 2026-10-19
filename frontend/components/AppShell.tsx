"use client";

import React, { useEffect, useState, useSyncExternalStore } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Header } from "./Header";
import { Sidebar } from "./Sidebar";
import { HumanReviewBanner } from "./HumanReviewBanner";
import { useAuth } from "./AuthProvider";

const emptySubscribe = () => () => {};

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, organizations, activeOrganizationId, isDemo, loading } = useAuth();
  const [mobileNavigationOpen, setMobileNavigationOpen] = useState(false);
  const isMounted = useSyncExternalStore(emptySubscribe, () => true, () => false);
  const isPublicPage = pathname === "/" || pathname === "/login" || pathname === "/register";
  const needsOnboarding = Boolean(user && organizations.length === 0 && !activeOrganizationId);

  useEffect(() => {
    if (!isMounted || loading || isPublicPage) return;
    if (!user && !isDemo) {
      router.replace("/login");
    } else if (needsOnboarding && pathname !== "/onboarding") {
      router.replace("/onboarding");
    }
  }, [isMounted, isDemo, isPublicPage, loading, needsOnboarding, pathname, router, user]);

  useEffect(() => {
    try {
      const settings = JSON.parse(localStorage.getItem("rippleiq_settings") ?? "{}") as { language?: string };
      const language = settings.language === "ar" ? "ar" : "en";
      document.documentElement.lang = language;
      document.documentElement.dir = language === "ar" ? "rtl" : "ltr";
    } catch {
      document.documentElement.lang = "en";
      document.documentElement.dir = "ltr";
    }
  }, []);

  // Before mount on client: render identical SSR neutral shell, avoiding hydration mismatch.
  if (!isMounted) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
        {children}
      </div>
    );
  }

  if (isPublicPage) {
    return <main className="min-h-screen flex flex-col">{children}</main>;
  }

  if (loading || (!user && !isDemo) || (needsOnboarding && pathname !== "/onboarding")) {
    return (
      <main
        className="grid min-h-screen place-items-center bg-slate-50 text-sm text-slate-600 dark:bg-slate-950 dark:text-slate-300"
        aria-live="polite"
      >
        Loading your workspace…
      </main>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      <a
        href="#main-content"
        className="absolute inset-s-2 top-2 z-50 -translate-y-16 rounded-md bg-white px-4 py-2 text-sm font-semibold text-slate-900 shadow focus:translate-y-0"
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
