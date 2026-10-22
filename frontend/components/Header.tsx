"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Archive,
  Building2,
  ChevronDown,
  Compass,
  LayoutDashboard,
  LogOut,
  Menu,
  PlusCircle,
  ShieldCheck,
  Sliders,
  UserRound,
} from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { CharterModal } from "@/components/CharterModal";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LanguageToggle } from "@/components/LanguageToggle";
import { useLocale } from "@/components/LocaleProvider";

export function Header({ onOpenNavigation }: { onOpenNavigation: () => void }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, organizations, activeOrganizationId, isDemo, selectOrganization, signOut } = useAuth();
  const { locale, t, isRtl } = useLocale();
  const activeOrganization = organizations.find((item) => item.id === activeOrganizationId);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [orgDropdownOpen, setOrgDropdownOpen] = useState(false);
  const [charterOpen, setCharterOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const orgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const closeOnOutsideClick = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileDropdownOpen(false);
      }
      if (orgRef.current && !orgRef.current.contains(event.target as Node)) {
        setOrgDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", closeOnOutsideClick);
    return () => {
      document.removeEventListener("mousedown", closeOnOutsideClick);
    };
  }, []);

  const isDashboardActive = pathname === "/dashboard";
  const isNewDecisionActive = pathname === "/decisions/new";
  const isDecisionsActive = pathname === "/decisions" || (pathname.startsWith("/decisions/") && pathname !== "/decisions/new");
  const isSettingsActive = pathname === "/settings" || pathname === "/onboarding";

  return (
    <>
      <header className="sticky top-0 z-40 flex h-16 w-full items-center justify-between border-b border-slate-200/80 bg-white/95 px-3 backdrop-blur-md dark:border-slate-800/80 dark:bg-slate-950/95 sm:px-6 lg:px-8">
        {/* Left: Mobile menu toggle + Brand + Org Selector + Desktop Navigation */}
        <div className="flex min-w-0 items-center gap-2 sm:gap-3 lg:gap-3.5">
          <button
            type="button"
            onClick={onOpenNavigation}
            aria-label="Open navigation menu"
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-700 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 dark:text-slate-200 dark:hover:bg-slate-800 md:hidden"
          >
            <Menu className="h-5 w-5" aria-hidden="true" />
          </button>

          <Link href="/dashboard" className="group flex shrink-0 items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm ring-2 ring-indigo-500/20 transition-transform group-hover:scale-105">
              <Compass className="h-5 w-5 text-white transition-transform group-hover:rotate-45" aria-hidden="true" />
            </span>
            <span className="flex flex-col">
              <span className="text-base font-extrabold tracking-tight text-slate-950 dark:text-white">
                Ripple<span className="text-indigo-600 dark:text-indigo-400">IQ</span>
              </span>
              <span className="hidden text-[9px] font-semibold uppercase tracking-wider text-slate-500 sm:block">
                Decision Intelligence
              </span>
            </span>
          </Link>

          {/* Org Selector & Creator Trigger */}
          <div className="relative hidden sm:flex items-center" ref={orgRef}>
            {isDemo ? (
              <button
                type="button"
                onClick={() => window.dispatchEvent(new Event("rippleiq:open-onboarding-modal"))}
                className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-amber-300/80 bg-amber-50/80 px-2.5 text-xs font-semibold text-amber-800 transition hover:border-amber-400 hover:bg-amber-100 dark:border-amber-900 dark:bg-amber-950/60 dark:text-amber-300 dark:hover:bg-amber-900/50 cursor-pointer"
              >
                <Building2 className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" aria-hidden="true" />
                <span className="max-w-28 truncate">{locale === "ar" ? "مساحة تجريبية" : "Demo Workspace"}</span>
                <span className="rounded-md bg-amber-200/80 px-1.5 py-0.5 text-[9px] font-bold uppercase text-amber-900 dark:bg-amber-900 dark:text-amber-200">
                  {locale === "ar" ? "تجريبي" : "Demo"}
                </span>
              </button>
            ) : user && organizations.length === 0 ? (
              <button
                type="button"
                onClick={() => window.dispatchEvent(new Event("rippleiq:open-onboarding-modal"))}
                className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-indigo-300 bg-indigo-50 px-3 text-xs font-bold text-indigo-700 shadow-xs hover:bg-indigo-100 hover:border-indigo-400 dark:border-indigo-700 dark:bg-indigo-950/80 dark:text-indigo-300 dark:hover:bg-indigo-900 transition cursor-pointer"
              >
                <PlusCircle className="h-4 w-4 text-indigo-600 dark:text-indigo-400" aria-hidden="true" />
                <span>{locale === "ar" ? "+ إنشاء منظمة" : "+ Create Organization"}</span>
              </button>
            ) : activeOrganization ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setOrgDropdownOpen((open) => !open)}
                  aria-expanded={orgDropdownOpen}
                  aria-controls="org-menu"
                  className="inline-flex h-9 max-w-48 items-center gap-1.5 rounded-xl border border-slate-200/80 bg-slate-50/80 px-2.5 text-xs font-semibold text-slate-700 hover:border-slate-300 hover:bg-slate-100 hover:text-slate-900 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-200 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  <Building2 className="h-3.5 w-3.5 shrink-0 text-indigo-600 dark:text-indigo-400" aria-hidden="true" />
                  <span className="truncate">{activeOrganization.name}</span>
                  <ChevronDown className="h-3 w-3 text-slate-400 shrink-0" aria-hidden="true" />
                </button>

                {orgDropdownOpen && (
                  <div
                    id="org-menu"
                    className="absolute start-0 mt-2 w-64 rounded-2xl border border-slate-200 bg-white p-2 text-xs shadow-xl backdrop-blur-md dark:border-slate-800 dark:bg-slate-900 z-50 animate-in fade-in duration-150"
                  >
                    <div className="px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                      {locale === "ar" ? "المنظمات التابعة لك" : "Your Organizations"}
                    </div>
                    <div className="space-y-1 max-h-48 overflow-y-auto">
                      {organizations.map((org) => {
                        const isSelected = org.id === activeOrganizationId;
                        return (
                          <button
                            key={org.id}
                            type="button"
                            onClick={() => {
                              selectOrganization(org.id);
                              setOrgDropdownOpen(false);
                            }}
                            className={`flex w-full items-center justify-between gap-2 rounded-xl px-2.5 py-2 text-start transition cursor-pointer ${
                              isSelected
                                ? "bg-indigo-50 font-bold text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300"
                                : "text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800/60"
                            }`}
                          >
                            <span className="truncate">{org.name}</span>
                            {isSelected && <span className="h-1.5 w-1.5 rounded-full bg-indigo-600 dark:bg-indigo-400 shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                    <div className="my-1.5 border-t border-slate-100 dark:border-slate-800" />
                    <button
                      type="button"
                      onClick={() => {
                        setOrgDropdownOpen(false);
                        window.dispatchEvent(new Event("rippleiq:open-onboarding-modal"));
                      }}
                      className="flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-start font-semibold text-indigo-600 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-950/50 transition cursor-pointer"
                    >
                      <PlusCircle className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>{locale === "ar" ? "+ إنشاء منظمة جديدة" : "+ New Organization"}</span>
                    </button>
                  </div>
                )}
              </div>
            ) : null}
          </div>

          {/* Desktop Top Navbar Links: Unified Segmented Tabs & Action */}
          <nav aria-label="Main horizontal navigation" className="hidden lg:flex items-center gap-2">
            <div className="flex items-center rounded-xl bg-slate-100/90 p-0.5 border border-slate-200/80 dark:bg-slate-900/90 dark:border-slate-800">
              <Link
                href="/dashboard"
                aria-current={isDashboardActive ? "page" : undefined}
                className={`inline-flex h-8 items-center gap-1.5 rounded-lg px-3 text-xs font-semibold transition-all ${
                  isDashboardActive
                    ? "bg-white text-indigo-700 shadow-2xs font-bold dark:bg-slate-800 dark:text-indigo-300"
                    : "text-slate-600 hover:text-slate-900 hover:bg-white/50 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800/50"
                }`}
              >
                <LayoutDashboard className="h-3.5 w-3.5" aria-hidden="true" />
                <span>{t("dashboard")}</span>
              </Link>

              <Link
                href="/decisions"
                aria-current={isDecisionsActive ? "page" : undefined}
                className={`inline-flex h-8 items-center gap-1.5 rounded-lg px-3 text-xs font-semibold transition-all ${
                  isDecisionsActive
                    ? "bg-white text-indigo-700 shadow-2xs font-bold dark:bg-slate-800 dark:text-indigo-300"
                    : "text-slate-600 hover:text-slate-900 hover:bg-white/50 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800/50"
                }`}
              >
                <Archive className="h-3.5 w-3.5" aria-hidden="true" />
                <span>{t("history")}</span>
              </Link>

              <Link
                href="/settings"
                aria-current={isSettingsActive ? "page" : undefined}
                className={`inline-flex h-8 items-center gap-1.5 rounded-lg px-3 text-xs font-semibold transition-all ${
                  isSettingsActive
                    ? "bg-white text-indigo-700 shadow-2xs font-bold dark:bg-slate-800 dark:text-indigo-300"
                    : "text-slate-600 hover:text-slate-900 hover:bg-white/50 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800/50"
                }`}
              >
                <Sliders className="h-3.5 w-3.5" aria-hidden="true" />
                <span>{t("settings")}</span>
              </Link>
            </div>

            {/* Quick Action: New Decision button */}
            <Link
              href="/decisions/new"
              aria-current={isNewDecisionActive ? "page" : undefined}
              className={`hidden xl:inline-flex h-9 items-center gap-1.5 rounded-xl px-3.5 text-xs font-bold text-white transition-all shadow-xs ${
                isNewDecisionActive
                  ? "bg-indigo-700 ring-2 ring-indigo-500/30"
                  : "bg-indigo-600 hover:bg-indigo-700 hover:shadow"
              }`}
            >
              <PlusCircle className="h-4 w-4" aria-hidden="true" />
              <span>{t("newDecision")}</span>
            </Link>
          </nav>
        </div>

        {/* Right: Language Toggle + Theme Toggle + Responsible AI Badge + API Health + User Profile */}
        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          {/* Language Toggle */}
          <LanguageToggle />

          {/* Light / Dark Mode Toggle */}
          <ThemeToggle />

          {/* Responsible AI Charter Trigger */}
          <button
            type="button"
            onClick={() => setCharterOpen(true)}
            title={t("responsibleAiCharter")}
            className="hidden 2xl:inline-flex h-9 items-center gap-1.5 rounded-xl border border-slate-200/80 bg-slate-50/80 px-2.5 text-xs font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-100 hover:text-slate-900 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <ShieldCheck className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" aria-hidden="true" />
            <span>{t("charter")}</span>
          </button>


          {/* User Profile Dropdown */}
          <div className="relative" ref={profileRef}>
            <button
              type="button"
              onClick={() => setProfileDropdownOpen((open) => !open)}
              aria-expanded={profileDropdownOpen}
              aria-controls="profile-menu"
              className="inline-flex h-9 items-center gap-2 rounded-xl border border-slate-200/80 bg-slate-50/80 px-2.5 text-xs font-semibold text-slate-700 hover:border-slate-300 hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-200 dark:hover:bg-slate-800 transition"
            >
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 font-bold text-[10px]">
                <UserRound className="h-3 w-3" aria-hidden="true" />
              </span>
              <span className="hidden text-start lg:block">
                <span className="block max-w-28 truncate text-xs font-semibold text-slate-900 dark:text-white">
                  {isDemo ? t("demoWorkspace") : user?.full_name ?? t("account")}
                </span>
              </span>
              <ChevronDown className="hidden h-3.5 w-3.5 text-slate-400 sm:block" aria-hidden="true" />
            </button>

            {profileDropdownOpen && (
              <div
                id="profile-menu"
                className="absolute inset-e-0 mt-2 w-56 rounded-xl border border-slate-200 bg-white p-1.5 text-xs shadow-xl dark:border-slate-800 dark:bg-slate-900"
              >
                <Link
                  href="/profile"
                  onClick={() => setProfileDropdownOpen(false)}
                  className="block rounded-lg border-b border-slate-100 px-3 py-2 transition hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/60"
                  title={t("profile")}
                >
                  <p className="font-bold text-slate-900 dark:text-white truncate hover:text-indigo-600 dark:hover:text-indigo-400">
                    {isDemo ? t("demoWorkspace") : user?.full_name}
                  </p>
                  <p className="text-[11px] text-slate-500 truncate">
                    {isDemo ? t("demoDisclaimer") : user?.email}
                  </p>
                </Link>
                <div className="py-1">
                  <Link
                    href="/profile"
                    onClick={() => setProfileDropdownOpen(false)}
                    className="flex items-center gap-2 rounded-lg px-3 py-2 text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                  >
                    <UserRound className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" /> {t("profile")}
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      setProfileDropdownOpen(false);
                      window.dispatchEvent(new Event("rippleiq:open-onboarding-modal"));
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-start text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 transition cursor-pointer"
                  >
                    <Building2 className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
                    <span>{t("organization")}</span>
                  </button>
                  <Link
                    href="/settings"
                    onClick={() => setProfileDropdownOpen(false)}
                    className="flex items-center gap-2 rounded-lg px-3 py-2 text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                  >
                    <Sliders className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" /> {t("preferences")}
                  </Link>
                </div>
                <div className="my-1 border-t border-slate-100 dark:border-slate-800" />
                <button
                  type="button"
                  onClick={() => {
                    setProfileDropdownOpen(false);
                    signOut();
                    router.replace("/login");
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-start font-medium text-rose-700 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/30"
                >
                  <LogOut className="h-3.5 w-3.5" aria-hidden="true" /> {t("signOut")}
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Charter Modal */}
      <CharterModal isOpen={charterOpen} onClose={() => setCharterOpen(false)} />
    </>
  );
}
