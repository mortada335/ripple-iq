"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  PlusCircle,
  Search,
  Layers,
  FileCheck2,
  CircleAlert,
  ChevronRight,
  Download,
  Archive,
  Trash2,
  Sparkles,
  Users2,
  GraduationCap,
  FlaskConical,
  Building,
  Bus,
  ShieldAlert,
  LayoutGrid,
  Table as TableIcon,
  RotateCcw,
} from "lucide-react";
import { getDecisions, getReport, toggleArchiveDecision, deleteDecision } from "@/lib/api";
import { Decision } from "@/types/decision";
import { LoadMore } from "@/components/LoadMore";
import { toast } from "sonner";
import { useAuth } from "@/components/AuthProvider";
import { DashboardSkeleton, DecisionCardSkeleton } from "@/components/LoadingSkeleton";
import { EmptyState } from "@/components/EmptyState";
import { useLocale } from "@/components/LocaleProvider";

const PAGE_SIZE = 20;

export default function DashboardPage() {
  const router = useRouter();
  const { locale, t, isRtl } = useLocale();
  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const { user, isDemo, activeOrganizationId, organizations } = useAuth();

  const activeOrg = organizations.find((o) => o.id === activeOrganizationId);

  const reloadDecisions = useCallback(async () => {
    setLoading(true);
    setLoadError(false);
    try {
      const data = await getDecisions(0, PAGE_SIZE);
      setDecisions(data);
      setHasMore(data.length === PAGE_SIZE);
    } catch {
      setLoadError(true);
      toast.error("Could not load decisions");
    } finally {
      setLoading(false);
    }
  }, []);

  const handleLoadMore = useCallback(async () => {
    setLoadingMore(true);
    try {
      const data = await getDecisions(decisions.length, PAGE_SIZE);
      setDecisions((current) => [
        ...current,
        ...data.filter((item) => !current.some((existing) => existing.id === item.id)),
      ]);
      setHasMore(data.length === PAGE_SIZE);
    } catch {
      toast.error("Could not load more decisions");
    } finally {
      setLoadingMore(false);
    }
  }, [decisions.length]);

  useEffect(() => {
    let ignore = false;
    getDecisions(0, PAGE_SIZE)
      .then((data) => {
        if (!ignore) {
          setDecisions(data);
          setHasMore(data.length === PAGE_SIZE);
        }
      })
      .catch(() => {
        if (!ignore) {
          setLoadError(true);
          toast.error("Could not load decisions");
        }
      })
      .finally(() => {
        if (!ignore) {
          setLoading(false);
        }
      });
    return () => {
      ignore = true;
    };
  }, [activeOrganizationId]);

  const counts = useMemo(
    () => ({
      total: decisions.length,
      completed: decisions.filter((d) => d.status === "COMPLETED").length,
      drafts: decisions.filter((d) => d.status === "DRAFT").length,
      inProgress: decisions.filter((d) => d.status === "SIMULATING" || d.status === "READY_FOR_ANALYSIS").length,
      highPriority: decisions.filter((d) => d.priority === "HIGH" || d.priority === "CRITICAL").length,
    }),
    [decisions]
  );

  const filteredDecisions = useMemo(() => {
    const query = search.trim().toLowerCase();
    return decisions.filter((d) => {
      const matchesSearch =
        !query ||
        d.title.toLowerCase().includes(query) ||
        Boolean(d.department?.toLowerCase().includes(query));
      const matchesStatus =
        statusFilter === "ALL" || d.status.toUpperCase() === statusFilter.toUpperCase();
      return matchesSearch && matchesStatus;
    });
  }, [decisions, search, statusFilter]);

  const handleDownloadReport = async (e: React.MouseEvent, id: number, title: string) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const rep = await getReport(id);
      const blob = new Blob([rep.content_markdown], { type: "text/markdown" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = rep.filename;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Board Memorandum downloaded", { description: title });
    } catch {
      toast.error("Failed to download report");
    }
  };

  const handleToggleArchive = async (e: React.MouseEvent, id: number) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await toggleArchiveDecision(id);
      toast.success("Decision updated");
      void reloadDecisions();
    } catch {
      toast.error("Could not update the decision");
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: number) => {
    e.preventDefault();
    e.stopPropagation();
    if (isDemo && confirm("Permanently remove this decision proposal from demo data?")) {
      try {
        await deleteDecision(id);
        toast.success("Decision deleted");
        void reloadDecisions();
      } catch {
        toast.error("Could not delete the decision");
      }
    }
  };

  if (loading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Executive Command Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-slate-200/80 bg-white/90 p-5 sm:p-6 shadow-xs backdrop-blur-md dark:border-slate-800/80 dark:bg-slate-900/90">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
            {user && organizations.length === 0 ? (
              <button
                type="button"
                onClick={() => window.dispatchEvent(new Event("rippleiq:open-onboarding-modal"))}
                className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
              >
                {locale === "ar" ? "+ إنشاء منظمتك الأولى" : "+ Set Up Organization"}
              </button>
            ) : (
              <span className="text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                {activeOrg?.name ?? (isDemo ? t("cockpitDemoTag") : t("cockpitTag"))}
              </span>
            )}
          </div>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
            {t("cockpitTitle")}
          </h1>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 max-w-2xl leading-relaxed">
            {t("cockpitSubtitle")}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {user && organizations.length === 0 && (
            <button
              type="button"
              onClick={() => window.dispatchEvent(new Event("rippleiq:open-onboarding-modal"))}
              className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50 px-3.5 py-2 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 dark:border-indigo-900 dark:bg-indigo-950/60 dark:text-indigo-300 transition cursor-pointer"
            >
              <PlusCircle className="h-3.5 w-3.5" />
              <span>{locale === "ar" ? "إنشاء مؤسستك الأولى" : "Create Organization"}</span>
            </button>
          )}

          <Link
            href="/decisions/new"
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-blue-600/25 hover:from-blue-500 hover:to-indigo-500 active:scale-95 transition"
          >
            <PlusCircle className="h-4 w-4" />
            <span>{t("newAnalysis")}</span>
          </Link>
        </div>
      </div>

      {user && organizations.length === 0 && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-2xl border border-indigo-200/80 bg-indigo-50/60 p-4 dark:border-indigo-900/60 dark:bg-indigo-950/40">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-xs">
              <PlusCircle className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                {locale === "ar" ? "ابدأ بإنشاء ملف مؤسستك الأولى" : "Set up your organization profile"}
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                {locale === "ar"
                  ? "أنشئ منظمتك لضبط العملة والمعايير التشغيلية ونمذجة القرارات بدقة."
                  : "Define your organization type, currency, and goals to tailor decision simulations."}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => window.dispatchEvent(new Event("rippleiq:open-onboarding-modal"))}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-indigo-500 transition cursor-pointer"
          >
            <span>{locale === "ar" ? "فتح نافذة الإنشاء" : "Open Setup Modal"}</span>
          </button>
        </div>
      )}

      {/* 4 KPI Summary Cards */}
      <section aria-label="Executive decision KPIs" className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {[
          {
            label: t("kpiTotalProposals"),
            value: counts.total,
            detail: `${counts.completed} ${t("kpiCompletedSuffix")}`,
            icon: Layers,
            iconColor: "text-indigo-600 dark:text-indigo-300",
            bgColor: "bg-indigo-50 dark:bg-indigo-500/15 border border-transparent dark:border-indigo-500/20",
          },
          {
            label: t("kpiSimulatedAnalyses"),
            value: counts.completed,
            detail: t("kpiSimulatedDetail"),
            icon: FileCheck2,
            iconColor: "text-emerald-600 dark:text-emerald-300",
            bgColor: "bg-emerald-50 dark:bg-emerald-500/15 border border-transparent dark:border-emerald-500/20",
          },
          {
            label: t("kpiCriticalRisks"),
            value: counts.highPriority,
            valueColor: counts.highPriority > 0 ? "text-rose-600 dark:text-rose-400" : undefined,
            detail: t("kpiCriticalDetail"),
            icon: ShieldAlert,
            iconColor: "text-rose-600 dark:text-rose-300",
            bgColor: "bg-rose-50 dark:bg-rose-500/15 border border-transparent dark:border-rose-500/20",
          },
          {
            label: t("kpiStakeholders"),
            value: 5,
            detail: t("kpiStakeholdersDetail"),
            icon: Users2,
            iconColor: "text-sky-600 dark:text-sky-300",
            bgColor: "bg-sky-50 dark:bg-sky-500/15 border border-transparent dark:border-sky-500/20",
          },
        ].map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div
              key={kpi.label}
              className="group rounded-2xl border border-slate-200/80 bg-white/90 p-4 sm:p-5 shadow-2xs backdrop-blur-md dark:border-slate-800/80 dark:bg-slate-900/90 transition-all hover:border-indigo-400/50 dark:hover:border-indigo-500/30"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">{kpi.label}</span>
                <span className={`flex h-8 w-8 items-center justify-center rounded-xl transition-transform group-hover:scale-105 ${kpi.bgColor}`}>
                  <Icon className={`h-4 w-4 ${kpi.iconColor}`} />
                </span>
              </div>
              <p className={`mt-3 text-2xl sm:text-3xl font-extrabold tracking-tight ${kpi.valueColor ?? "text-slate-900 dark:text-slate-100"}`}>
                {kpi.value}
              </p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{kpi.detail}</p>
            </div>
          );
        })}
      </section>

      {/* Search, Filter Tabs & View Toggle */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="pointer-events-none absolute start-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("searchPlaceholder")}
            className="w-full rounded-xl border border-slate-200/80 bg-white/90 py-2 ps-10 pe-4 text-xs text-slate-900 placeholder-slate-400 shadow-2xs focus:border-indigo-500 focus:outline-none dark:border-slate-800/80 dark:bg-slate-900/90 dark:text-white"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Status Filter Tabs */}
          <div className="flex items-center gap-1 rounded-xl border border-slate-200/80 bg-white/90 p-1 shadow-2xs dark:border-slate-800/80 dark:bg-slate-900/90">
            {(["ALL", "COMPLETED", "DRAFT", "ARCHIVED"] as const).map((status) => {
              const count = decisions.filter(
                (d) => status === "ALL" || d.status.toUpperCase() === status
              ).length;
              const isActive = statusFilter === status;
              const tabLabel =
                status === "ALL"
                  ? t("filterAll")
                  : status === "COMPLETED"
                  ? t("filterCompleted")
                  : status === "DRAFT"
                  ? t("filterDraft")
                  : t("filterArchived");

              return (
                <button
                  key={status}
                  type="button"
                  onClick={() => setStatusFilter(status)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                    isActive
                      ? "bg-slate-900 text-white shadow-xs dark:bg-indigo-600"
                      : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
                  }`}
                >
                  <span>{tabLabel}</span>
                  <span className={`ms-1.5 text-[10px] ${isActive ? "opacity-90" : "opacity-60"}`}>
                    ({count})
                  </span>
                </button>
              );
            })}
          </div>

          {/* View Mode Switcher */}
          <div className="flex items-center gap-1 rounded-xl border border-slate-200/80 bg-white/90 p-1 shadow-2xs dark:border-slate-800/80 dark:bg-slate-900/90">
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              aria-label={t("gridView")}
              className={`rounded-lg p-1.5 transition ${
                viewMode === "grid"
                  ? "bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-white"
                  : "text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
              }`}
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode("table")}
              aria-label={t("tableView")}
              className={`rounded-lg p-1.5 transition ${
                viewMode === "table"
                  ? "bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-white"
                  : "text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
              }`}
            >
              <TableIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Decisions Content */}
      {loading ? (
        <div className="space-y-3.5">
          {[...Array(3)].map((_, i) => (
            <DecisionCardSkeleton key={i} />
          ))}
        </div>
      ) : loadError ? (
        <div
          role="alert"
          className="rounded-2xl border border-rose-200 bg-white p-8 text-center shadow-sm dark:border-rose-900 dark:bg-slate-900"
        >
          <CircleAlert className="mx-auto h-8 w-8 text-rose-600" />
          <h3 className="mt-2 text-base font-bold text-slate-900 dark:text-white">{t("errorLoadDecisions")}</h3>
          <p className="mt-1 text-xs text-rose-700 dark:text-rose-300">{t("errorLoadDesc")}</p>
          <button
            type="button"
            onClick={() => void reloadDecisions()}
            className="mt-4 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-500"
          >
            {t("retryLoading")}
          </button>
        </div>
      ) : filteredDecisions.length === 0 ? (
        <EmptyState
          icon={Layers}
          title={t("noDecisionsTitle")}
          description={t("noDecisionsDescription")}
          action={{
            label: t("newAnalysis"),
            onClick: () => router.push("/decisions/new"),
          }}
        />
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {filteredDecisions.map((decision) => {
            const isArchived = decision.status === "ARCHIVED";
            const isCompleted = decision.status === "COMPLETED";

            const priorityLabel =
              decision.priority === "HIGH"
                ? t("cardPriorityHigh")
                : decision.priority === "CRITICAL"
                ? t("cardPriorityCritical")
                : decision.priority === "MEDIUM"
                ? t("cardPriorityMedium")
                : t("cardPriorityLow");

            const statusLabel = isCompleted
              ? t("cardSimulated")
              : isArchived
              ? t("cardArchived")
              : t("cardDraft");

            return (
              <div
                key={decision.id}
                className={`group flex flex-col justify-between rounded-2xl border p-5 shadow-sm transition-all ${
                  isArchived
                    ? "opacity-60 border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900/50"
                    : "border-slate-200/90 bg-white hover:border-indigo-500/50 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-indigo-500/40"
                }`}
              >
                <div className="space-y-3">
                  {/* Top Bar: ID, Priority, Status */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-[11px] font-bold text-slate-500 dark:text-slate-400">
                      {t("tableRef")} {String(decision.id).padStart(4, "0")}
                    </span>

                    <div className="flex items-center gap-1.5">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                          decision.priority === "HIGH" || decision.priority === "CRITICAL"
                            ? "bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300"
                            : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                        }`}
                      >
                        {priorityLabel}
                      </span>

                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                          isCompleted
                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                            : isArchived
                            ? "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                            : "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
                        }`}
                      >
                        {isCompleted && <Sparkles className="h-2.5 w-2.5" />}
                        {statusLabel}
                      </span>
                    </div>
                  </div>

                  {/* Title & Description */}
                  <div>
                    <Link
                      href={
                        isCompleted
                          ? `/decisions/${decision.id}/scenarios`
                          : `/decisions/${decision.id}/context`
                      }
                      className="block group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition"
                    >
                      <h3 className="text-base font-bold text-slate-900 dark:text-white leading-snug line-clamp-2">
                        {decision.title}
                      </h3>
                    </Link>
                    <p className="mt-1.5 text-xs text-slate-600 dark:text-slate-400 leading-relaxed line-clamp-2">
                      {decision.description}
                    </p>
                  </div>

                  {/* Metadata & Stakeholder Avatars */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        {decision.department || t("operations")}
                      </span>
                      <span>·</span>
                      <span>{decision.time_horizon || t("year1")}</span>
                    </div>

                    {/* 5 Core Stakeholder Icons */}
                    <div
                      className="flex items-center -space-x-1"
                      title={t("kpiStakeholdersDetail")}
                    >
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-100 text-indigo-700 ring-2 ring-white dark:bg-indigo-950 dark:text-indigo-300 dark:ring-slate-900">
                        <GraduationCap className="h-3 w-3" />
                      </span>
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 ring-2 ring-white dark:bg-emerald-950 dark:text-emerald-300 dark:ring-slate-900">
                        <Users2 className="h-3 w-3" />
                      </span>
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-100 text-amber-700 ring-2 ring-white dark:bg-amber-950 dark:text-amber-300 dark:ring-slate-900">
                        <FlaskConical className="h-3 w-3" />
                      </span>
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-sky-100 text-sky-700 ring-2 ring-white dark:bg-sky-950 dark:text-sky-300 dark:ring-slate-900">
                        <Building className="h-3 w-3" />
                      </span>
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-purple-100 text-purple-700 ring-2 ring-white dark:bg-purple-950 dark:text-purple-300 dark:ring-slate-900">
                        <Bus className="h-3 w-3" />
                      </span>
                    </div>
                  </div>

                  {/* Stage Progress Bar */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[10px] font-mono font-medium text-slate-400">
                      <span>{isCompleted ? t("stage5Complete") : t("stage1Draft")}</span>
                      <span>{isCompleted ? "100%" : "25%"}</span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isCompleted ? "bg-emerald-500" : "bg-indigo-500"
                        }`}
                        style={{ width: isCompleted ? "100%" : "25%" }}
                      />
                    </div>
                  </div>
                </div>

                {/* Card Action Footer */}
                <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-3 dark:border-slate-800/80">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={(e) => handleDownloadReport(e, decision.id, decision.title)}
                      className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-semibold text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white transition cursor-pointer"
                      title={t("memorandum")}
                    >
                      <Download className="h-3.5 w-3.5" />
                      <span>{t("memorandum")}</span>
                    </button>

                    {!isArchived && (
                      <button
                        type="button"
                        onClick={(e) => handleToggleArchive(e, decision.id)}
                        className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-semibold text-slate-500 hover:bg-slate-100 hover:text-amber-600 dark:hover:bg-slate-800 dark:hover:text-amber-400 transition cursor-pointer"
                        title={t("cardArchive")}
                      >
                        <Archive className="h-3.5 w-3.5" />
                        <span>{t("cardArchive")}</span>
                      </button>
                    )}

                    {isDemo && decision.id > 1 && (
                      <button
                        type="button"
                        onClick={(e) => handleDelete(e, decision.id)}
                        className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-semibold text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40 transition cursor-pointer"
                        title={t("cardDelete")}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>

                  <Link
                    href={
                      isCompleted
                        ? `/decisions/${decision.id}/scenarios`
                        : `/decisions/${decision.id}/context`
                    }
                    className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-slate-800 dark:bg-indigo-600 dark:hover:bg-indigo-500 transition shadow-xs"
                  >
                    <span>{isCompleted ? t("inspectMatrix") : t("inputContext")}</span>
                    <ChevronRight className="h-3.5 w-3.5 rtl:rotate-180" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Executive Table View */
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="w-full overflow-x-auto no-scrollbar">
            <table className="w-full min-w-[640px] text-start text-xs">
              <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-950">
                <tr>
                  <th className="px-4 py-3 text-start">{t("tableRef")}</th>
                  <th className="px-4 py-3 text-start">{t("tablePolicyProposal")}</th>
                  <th className="px-4 py-3 text-start">{t("tableDepartment")}</th>
                  <th className="px-4 py-3 text-start">{t("tableHorizon")}</th>
                  <th className="px-4 py-3 text-start">{t("tablePriority")}</th>
                  <th className="px-4 py-3 text-start">{t("tableStatus")}</th>
                  <th className="px-4 py-3 text-end">{t("tableAction")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredDecisions.map((decision) => {
                  const isCompleted = decision.status === "COMPLETED";
                  const isArchived = decision.status === "ARCHIVED";

                  const priorityLabel =
                    decision.priority === "HIGH"
                      ? t("cardPriorityHigh")
                      : decision.priority === "CRITICAL"
                      ? t("cardPriorityCritical")
                      : decision.priority === "MEDIUM"
                      ? t("cardPriorityMedium")
                      : t("cardPriorityLow");

                  const statusLabel = isCompleted
                    ? t("cardSimulated")
                    : isArchived
                    ? t("cardArchived")
                    : t("cardDraft");

                  return (
                    <tr
                      key={decision.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      <td className="px-4 py-3 font-mono font-bold text-slate-500">
                        {String(decision.id).padStart(4, "0")}
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white max-w-sm truncate">
                        <Link
                          href={
                            decision.status === "COMPLETED"
                              ? `/decisions/${decision.id}/scenarios`
                              : `/decisions/${decision.id}/context`
                          }
                          className="hover:text-indigo-600 dark:hover:text-indigo-400"
                        >
                          {decision.title}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                        {decision.department || t("operations")}
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                        {decision.time_horizon || t("year1")}
                      </td>
                      <td className="px-4 py-3">
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          {priorityLabel}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                            decision.status === "COMPLETED"
                              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                              : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                          }`}
                        >
                          {statusLabel}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-end">
                        <Link
                          href={
                            decision.status === "COMPLETED"
                              ? `/decisions/${decision.id}/scenarios`
                              : `/decisions/${decision.id}/context`
                          }
                          className="inline-flex items-center gap-1 font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300"
                        >
                          <span>{t("open")}</span>
                          <ChevronRight className="h-3 w-3 rtl:rotate-180" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!loading && (
        <LoadMore
          loaded={decisions.length}
          hasMore={hasMore}
          loading={loadingMore}
          onLoadMore={handleLoadMore}
        />
      )}
    </div>
  );
}
