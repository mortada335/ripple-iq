"use client";

import React, { useEffect, useState, useSyncExternalStore } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Header } from "./Header";
import { Sidebar } from "./Sidebar";
import { HumanReviewBanner } from "./HumanReviewBanner";
import { MobileFloatingNewDecision } from "./MobileFloatingNewDecision";
import { FirstTimeOrgModal } from "./FirstTimeOrgModal";
import { useAuth } from "./AuthProvider";
import { useLocale } from "./LocaleProvider";

import { WorkspaceShellSkeleton, getPageSkeleton } from "./LoadingSkeleton";

const emptySubscribe = () => () => {};

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, organizations, activeOrganizationId, isDemo, loading, authError, refresh, signOut } = useAuth();
  const { t } = useLocale();
  const [mobileNavigationOpen, setMobileNavigationOpen] = useState(false);
  const isMounted = useSyncExternalStore(emptySubscribe, () => true, () => false);
  const isPublicPage = pathname === "/" || pathname === "/login" || pathname === "/register";
  const needsOnboarding = Boolean(user && organizations.length === 0 && !activeOrganizationId);

  useEffect(() => {
    if (!isMounted || loading || authError || isPublicPage) return;
    if (!user && !isDemo) {
      router.replace("/login");
    } else if (needsOnboarding && pathname !== "/onboarding") {
      router.replace("/onboarding");
    }
  }, [isMounted, isDemo, isPublicPage, loading, authError, needsOnboarding, pathname, router, user]);

  // Before mount on client: render identical SSR neutral shell, avoiding hydration mismatch.
  if (!isMounted) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
        {children}
      </div>
    );
  }

  if (isPublicPage && !authError) {
    return (
      <main className="min-h-screen flex flex-col">
        {children}
        <MobileFloatingNewDecision />
      </main>
    );
  }

  if (loading || (!user && !isDemo && !authError) || (needsOnboarding && pathname !== "/onboarding")) {
    return <WorkspaceShellSkeleton pathname={pathname} />;
  }

  if (authError && !user && !isDemo) {
    return (
      <main className="grid min-h-screen place-items-center bg-slate-50 p-6 text-sm dark:bg-slate-950" role="alert">
        <div className="max-w-md space-y-3 rounded-2xl border border-amber-200 bg-white p-5 text-slate-700 shadow-sm dark:border-amber-900 dark:bg-slate-900 dark:text-slate-200">
          <h1 className="font-semibold">Could not verify your session</h1>
          <p className="text-xs">{authError} Your saved sign-in was kept. Retry when the API is available.</p>
          <div className="flex gap-2">
            <button type="button" onClick={() => void refresh()} className="min-h-10 rounded-xl bg-indigo-600 px-3.5 text-xs font-semibold text-white">Retry connection</button>
            <button type="button" onClick={signOut} className="min-h-10 rounded-xl border border-slate-300 px-3.5 text-xs font-semibold dark:border-slate-700">Sign out</button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <div className="relative min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 overflow-x-hidden">
      {/* Ambient background glow for high-end SaaS feel */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_-10%,rgba(99,102,241,0.06),transparent_70%)] dark:bg-[radial-gradient(ellipse_60%_50%_at_50%_-10%,rgba(99,102,241,0.12),transparent_70%)]"
      />

      <a
        href="#main-content"
        className="absolute inset-s-2 top-2 z-50 -translate-y-16 rounded-md bg-white px-4 py-2 text-sm font-semibold text-slate-900 shadow focus:translate-y-0"
      >
        {t("skip")}
      </a>
      <Header onOpenNavigation={() => setMobileNavigationOpen(true)} />
      <div className="relative z-10 flex flex-1 items-start">
        <Sidebar mobileOpen={mobileNavigationOpen} onClose={() => setMobileNavigationOpen(false)} />
        <main id="main-content" className="flex-1 flex flex-col min-w-0">
          <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-5 space-y-4 sm:space-y-5">
            <HumanReviewBanner />
            <React.Suspense fallback={getPageSkeleton(pathname)}>
              {children}
            </React.Suspense>
          </div>
        </main>
      </div>
      <MobileFloatingNewDecision />
      <FirstTimeOrgModal />
    </div>
  );
}
