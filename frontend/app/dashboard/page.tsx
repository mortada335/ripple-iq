"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  PlusCircle,
  Search,
  Layers,
  FileCheck2,
  FileClock,
  CircleAlert,
  ChevronRight,
  Download,
  Archive,
  Trash2,
} from "lucide-react";
import { getDecisions, getReport, toggleArchiveDecision, deleteDecision } from "@/lib/api";
import { Decision } from "@/types/decision";
import { LoadMore } from "@/components/LoadMore";
import { toast } from "sonner";
import { useAuth } from "@/components/AuthProvider";

const PAGE_SIZE = 20;

export default function DashboardPage() {
  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
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

  const counts = useMemo(() => ({
    total: decisions.length,
    completed: decisions.filter((d) => d.status === "COMPLETED").length,
    drafts: decisions.filter((d) => d.status === "DRAFT").length,
    inProgress: decisions.filter((d) => d.status === "SIMULATING").length,
  }), [decisions]);

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
      toast.success("Report downloaded", { description: title });
    } catch {
      toast.error("Failed to download report");
    }
  };

  const handleToggleArchive = async (e: React.MouseEvent, id: number) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await toggleArchiveDecision(id);
      toast.success("Decision archived");
      void reloadDecisions();
    } catch {
      toast.error("Could not update the decision");
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: number) => {
    e.preventDefault();
    e.stopPropagation();
    if (isDemo && confirm("Permanently remove this decision from local demo data?")) {
      try {
        await deleteDecision(id);
        toast.success("Decision deleted");
        void reloadDecisions();
      } catch {
        toast.error("Could not delete the decision");
      }
    }
  };

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* Hero / Executive Command Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-2xl">
            Decision dashboard
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Compare possible outcomes of organization decisions before choosing a path forward.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/decisions/new"
            className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-500 transition-all"
          >
            <PlusCircle className="h-4 w-4" />
            <span>Create New Decision</span>
          </Link>
        </div>
      </div>

      <section aria-label="Decision summary" className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {[
          { label: "Loaded decisions", value: counts.total, icon: Layers, iconClass: "text-indigo-600 dark:text-indigo-400" },
          { label: "Completed (loaded)", value: counts.completed, icon: FileCheck2, iconClass: "text-emerald-600 dark:text-emerald-400" },
          { label: "Drafts (loaded)", value: counts.drafts, icon: FileClock, iconClass: "text-amber-600 dark:text-amber-400" },
          { label: "In progress (loaded)", value: counts.inProgress, icon: CircleAlert, iconClass: "text-violet-600 dark:text-violet-400" },
        ].map(({ label, value, icon: Icon, iconClass }) => (
          <div key={label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between gap-3"><span className="text-xs font-medium text-slate-500">{label}</span><Icon className={`h-4 w-4 ${iconClass}`} aria-hidden="true" /></div>
            <p className="mt-3 text-2xl font-bold tracking-tight text-slate-950 dark:text-white">{value}</p>
          </div>
        ))}
      </section>

      {/* Search & Filter Bar */}
      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="pointer-events-none absolute start-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by decision or responsible team..."
            className="w-full rounded-xl border border-slate-200 bg-white py-1.5 ps-9 pe-4 text-xs text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-white"
          />
        </div>
        <p className="text-[11px] text-slate-500 sm:ms-3">Search covers loaded decisions. Load more to search additional results.</p>

        {/* Status Pills with Dynamic Counts */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          {(["ALL", "COMPLETED", "DRAFT", "ARCHIVED"] as const).map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                statusFilter === status
                  ? "bg-slate-900 text-white dark:bg-indigo-600"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800"
              }`}
            >
              <span>{status === "ALL" ? "All decisions" : status.charAt(0) + status.slice(1).toLowerCase()}</span>
              <span className="ms-1.5 opacity-70 text-[10px]">({decisions.filter((decision) => status === "ALL" || decision.status === status).length})</span>
            </button>
          ))}
        </div>
      </div>

      {/* Decisions Grid */}
      {loading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="h-44 animate-pulse rounded-2xl border border-slate-200 bg-slate-100 dark:border-slate-800 dark:bg-slate-900"
            />
          ))}
        </div>
      ) : loadError ? (
        <div role="alert" className="rounded-2xl border border-rose-200 bg-white p-8 text-center dark:border-rose-900 dark:bg-slate-900"><p className="text-sm text-rose-700 dark:text-rose-300">Decisions could not be loaded.</p><button type="button" onClick={() => void reloadDecisions()} className="mt-3 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white">Retry</button></div>
      ) : filteredDecisions.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center dark:border-slate-800 dark:bg-slate-900">
          <Layers className="mx-auto h-8 w-8 text-slate-400" />
          <h3 className="mt-2 text-xs font-semibold text-slate-900 dark:text-white">
            No decisions match current filter
          </h3>
          <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
            Create a decision or adjust your search and status filters.
          </p>
          <Link
            href="/decisions/new"
            className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-indigo-500"
          >
            <PlusCircle className="h-3.5 w-3.5" />
            <span>Create Decision</span>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {filteredDecisions.map((decision) => {
            const isArchived = decision.status === "ARCHIVED";

            return (
              <div
                key={decision.id}
                className={`group flex flex-col justify-between rounded-xl border p-5 shadow-xs transition-all ${
                  isArchived
                    ? "opacity-60 border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900/50"
                    : "border-slate-200 bg-white hover:border-indigo-400 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-indigo-500/50"
                }`}
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-mono font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                      D-{String(decision.id).padStart(4, "0")}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                          decision.priority === "HIGH" || decision.priority === "CRITICAL"
                            ? "bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300"
                            : "bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300"
                        }`}
                      >
                        {decision.priority}
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                          decision.status === "COMPLETED"
                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                            : decision.status === "ARCHIVED"
                            ? "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                            : "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
                        }`}
                      >
                        {decision.status}
                      </span>
                    </div>
                  </div>

                  <Link
                    href={
                      decision.status === "COMPLETED"
                        ? `/decisions/${decision.id}/scenarios`
                        : `/decisions/${decision.id}/context`
                    }
                    className="block group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition"
                  >
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-snug line-clamp-2">
                      {decision.title}
                    </h3>
                  </Link>

                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed line-clamp-2">
                    {decision.description}
                  </p>

                  <div className="text-[10px] font-medium text-slate-500 dark:text-slate-400 flex flex-wrap items-center gap-2">
                    <span>Team: {decision.department}</span>
                    <span>• ⏳ {decision.time_horizon}</span>
                  </div>
                </div>

                {/* Card Footer Actions */}
                <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 dark:border-slate-800/80">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={(e) => handleDownloadReport(e, decision.id, decision.title)}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 cursor-pointer"
                      title="Download Markdown Memorandum"
                    >
                      <Download className="h-3.5 w-3.5" />
                      <span>Report</span>
                    </button>

                    {!isArchived && <button
                      type="button"
                      onClick={(e) => handleToggleArchive(e, decision.id)}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 hover:text-amber-600 dark:hover:text-amber-400 cursor-pointer ms-1"
                      title={isArchived ? "Restore to Active" : "Soft-archive decision"}
                    >
                      {isArchived ? <><Archive className="h-3.5 w-3.5" /><span>Archived</span></> : (
                        <>
                          <Archive className="h-3.5 w-3.5" />
                          <span>Archive</span>
                        </>
                      )}
                    </button>}

                    {isDemo && decision.id > 1 && (
                      <button
                        type="button"
                        onClick={(e) => handleDelete(e, decision.id)}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-400 hover:text-rose-600 cursor-pointer ms-1"
                        title="Delete Proposal"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>

                  <Link
                    href={
                      decision.status === "COMPLETED"
                        ? `/decisions/${decision.id}/scenarios`
                        : `/decisions/${decision.id}/context`
                    }
                    className="inline-flex items-center gap-1 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800 dark:bg-indigo-600 dark:hover:bg-indigo-500 transition"
                  >
                    <span>
                      {decision.status === "COMPLETED"
                        ? "Inspect"
                        : "Attach Context"}
                    </span>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
      {!loading && <LoadMore loaded={decisions.length} hasMore={hasMore} loading={loadingMore} onLoadMore={handleLoadMore} />}
    </div>
  );
}
