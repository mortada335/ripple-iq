"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Search,
  PlusCircle,
  ChevronRight,
  Download,
  Archive,
  Trash2,
  Building2,
} from "lucide-react";
import { getDecisions, getReport, toggleArchiveDecision, deleteDecision } from "@/lib/api";
import { Decision } from "@/types/decision";
import { LoadMore } from "@/components/LoadMore";
import { toast } from "sonner";
import { useAuth } from "@/components/AuthProvider";
import { useLocale } from "@/components/LocaleProvider";
import { DecisionsListSkeleton } from "@/components/LoadingSkeleton";

const PAGE_SIZE = 20;

export default function HistoricalDecisionsPage() {
  const { locale, t, isRtl } = useLocale();
  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const { isDemo, activeOrganizationId } = useAuth();

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

  const handleDownload = async (e: React.MouseEvent, id: number) => {
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
      toast.success("Report downloaded");
    } catch {
      toast.error("Failed to download report");
    }
  };

  const handleToggleArchive = async (e: React.MouseEvent, id: number) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await toggleArchiveDecision(id);
      toast.success("Decision archive status updated");
      void reloadDecisions();
    } catch {
      toast.error("Could not update the decision");
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: number) => {
    e.preventDefault();
    e.stopPropagation();
    if (confirm("Delete this decision proposal from archive?")) {
      try {
        await deleteDecision(id);
        toast.success("Decision deleted");
        void reloadDecisions();
      } catch {
        toast.error("Could not delete the decision");
      }
    }
  };

  const filteredDecisions = useMemo(() => {
    const query = search.trim().toLowerCase();
    return decisions.filter(
      (d) =>
        !query ||
        d.title.toLowerCase().includes(query) ||
        (d.department ?? "").toLowerCase().includes(query)
    );
  }, [decisions, search]);

  if (loading) {
    return <DecisionsListSkeleton />;
  }

  return (
    <div className="space-y-4 sm:space-y-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-2xl">
            {t("history")}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {locale === "ar"
              ? "استعراض قرارات المؤسسة وسجل تحليلات التأثير المكتملة."
              : "Browse organization decisions and their completed impact analyses."}
          </p>
        </div>

        <Link
          href="/decisions/new"
          className="hidden md:inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-indigo-500 transition shadow-xs"
        >
          <PlusCircle className="h-3.5 w-3.5" />
          <span>{t("newDecision")}</span>
        </Link>
      </div>

      {/* Search Filter */}
      <div className="relative max-w-md">
        <Search className="pointer-events-none absolute inset-s-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("searchPlaceholder")}
          className="w-full rounded-xl border border-slate-200 bg-white py-1.5 ps-9 pe-4 text-xs text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-white"
        />
      </div>

      {/* Table list */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {loading ? (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 gap-3">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-44 rounded-md bg-slate-200/80 dark:bg-slate-800/80 animate-pulse" />
                      <div className="h-4 w-16 rounded-full bg-slate-200/80 dark:bg-slate-800/80 animate-pulse" />
                    </div>
                    <div className="h-3.5 w-3/4 rounded-md bg-slate-200/60 dark:bg-slate-800/60 animate-pulse" />
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-20 rounded-xl bg-slate-200/70 dark:bg-slate-800/70 animate-pulse" />
                    <div className="h-8 w-16 rounded-xl bg-slate-200/70 dark:bg-slate-800/70 animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          ) : loadError ? (
            <div role="alert" className="p-6 text-center">
              <p className="text-sm text-rose-700 dark:text-rose-300">
                {locale === "ar" ? "تعذر تحميل القرارات." : "Decisions could not be loaded."}
              </p>
              <button
                type="button"
                onClick={() => void reloadDecisions()}
                className="mt-3 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white"
              >
                {locale === "ar" ? "إعادة المحاولة" : "Retry"}
              </button>
            </div>
          ) : filteredDecisions.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-400">
              {t("noDecisionsTitle")}
            </div>
          ) : (
            filteredDecisions.map((d: Decision) => {
              const isArchived = d.status === "ARCHIVED";

              return (
                <div
                  key={d.id}
                  className={`flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between transition ${
                    isArchived
                      ? "opacity-60 bg-slate-50/50 dark:bg-slate-900/30"
                      : "hover:bg-slate-50/50 dark:hover:bg-slate-800/40"
                  }`}
                >
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-[10px] font-semibold text-slate-400">
                        D-{String(d.id).padStart(4, "0")}
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.2 text-[9px] font-bold ${
                          d.status === "COMPLETED"
                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                            : isArchived
                            ? "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-400"
                            : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                        }`}
                      >
                        {d.status === "COMPLETED"
                          ? t("cardSimulated")
                          : isArchived
                          ? t("cardArchived")
                          : t("cardDraft")}
                      </span>
                      <span className="rounded-full bg-slate-100 px-2 py-0.2 text-[9px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                        {d.time_horizon}
                      </span>
                    </div>

                    <Link
                      href={
                        d.status === "COMPLETED"
                          ? `/decisions/${d.id}/scenarios`
                          : `/decisions/${d.id}/context`
                      }
                      className="block font-bold text-slate-900 hover:text-indigo-600 dark:text-white dark:hover:text-indigo-400 text-xs sm:text-sm transition"
                    >
                      {d.title}
                    </Link>

                    <p className="flex items-center text-[11px] text-slate-500 dark:text-slate-400">
                      <Building2 className="inline h-3.5 w-3.5 me-1 text-slate-400" aria-hidden="true" />
                      <span>{d.department}</span>
                      <span className="mx-1.5">•</span>
                      <span>
                        {t("cardCreated")}: {new Date(d.created_at).toLocaleDateString(locale === "ar" ? "ar-IQ" : "en-US")}
                      </span>
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={(e) => handleDownload(e, d.id)}
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 cursor-pointer"
                    >
                      <Download className="h-3 w-3" />
                      <span>.md</span>
                    </button>

                    {!isArchived && (
                      <button
                        onClick={(e) => handleToggleArchive(e, d.id)}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 cursor-pointer"
                        title={t("cardArchive")}
                      >
                        <Archive className="h-3 w-3" />
                        <span>{t("cardArchive")}</span>
                      </button>
                    )}

                    {isDemo && d.id > 1 && (
                      <button
                        onClick={(e) => handleDelete(e, d.id)}
                        className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer"
                        title={t("cardDelete")}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}

                    <Link
                      href={
                        d.status === "COMPLETED"
                          ? `/decisions/${d.id}/scenarios`
                          : `/decisions/${d.id}/context`
                      }
                      className="inline-flex items-center gap-1 rounded-lg bg-slate-900 px-3 py-1 text-xs font-semibold text-white hover:bg-slate-800 dark:bg-indigo-600 dark:hover:bg-indigo-500 transition"
                    >
                      <span>
                        {d.status === "COMPLETED"
                          ? locale === "ar"
                            ? "فحص"
                            : "Inspect"
                          : locale === "ar"
                          ? "استئناف"
                          : "Resume"}
                      </span>
                      <ChevronRight className="h-3 w-3 rtl:rotate-180" />
                    </Link>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
      {!loading && <LoadMore loaded={decisions.length} hasMore={hasMore} loading={loadingMore} onLoadMore={handleLoadMore} />}
    </div>
  );
}
