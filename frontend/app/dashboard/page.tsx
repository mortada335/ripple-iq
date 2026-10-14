"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  PlusCircle,
  Search,
  TrendingUp,
  Users,
  ShieldCheck,
  Layers,
  ChevronRight,
  Download,
  Archive,
  ArchiveRestore,
  Trash2,
  Check,
} from "lucide-react";
import { getDecisions, getReport, toggleArchiveDecision, deleteDecision } from "@/lib/api";
import { Decision } from "@/types/decision";

export default function DashboardPage() {
  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [loading, setLoading] = useState(true);
  const [downloadToast, setDownloadToast] = useState<string | null>(null);

  const loadDecisions = () => {
    getDecisions()
      .then((data) => {
        setDecisions(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    loadDecisions();
  }, []);

  const counts = {
    ALL: decisions.length,
    COMPLETED: decisions.filter((d) => d.status === "COMPLETED").length,
    DRAFT: decisions.filter((d) => d.status === "DRAFT").length,
    SIMULATING: decisions.filter((d) => d.status === "SIMULATING").length,
    ARCHIVED: decisions.filter((d) => d.status === "ARCHIVED").length,
  };

  const filteredDecisions = decisions.filter((d) => {
    const matchesSearch =
      d.title.toLowerCase().includes(search.toLowerCase()) ||
      d.department?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus =
      statusFilter === "ALL" || d.status.toUpperCase() === statusFilter.toUpperCase();
    return matchesSearch && matchesStatus;
  });

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
      setDownloadToast(`Report for "${title.slice(0, 30)}..." downloaded`);
      setTimeout(() => setDownloadToast(null), 3000);
    } catch {
      alert("Failed to download report.");
    }
  };

  const handleToggleArchive = async (e: React.MouseEvent, id: number) => {
    e.preventDefault();
    e.stopPropagation();
    await toggleArchiveDecision(id);
    loadDecisions();
  };

  const handleDelete = async (e: React.MouseEvent, id: number) => {
    e.preventDefault();
    e.stopPropagation();
    if (confirm("Are you sure you want to delete this proposal from the local session?")) {
      await deleteDecision(id);
      loadDecisions();
    }
  };

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* Download toast notification */}
      {downloadToast && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-xl border border-emerald-300 bg-white px-4 py-2.5 text-xs font-semibold text-emerald-800 shadow-xl dark:border-emerald-800 dark:bg-slate-900 dark:text-emerald-300 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <Check className="h-4 w-4 text-emerald-500" />
          <span>{downloadToast}</span>
        </div>
      )}

      {/* Hero / Executive Command Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-2xl">
            Institutional Foresight Dashboard
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Model cascading second-order impacts across university policies before board ratification.
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

      {/* Metrics Banner */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Policies Modeled
            </span>
            <div className="rounded-lg bg-indigo-50 p-1.5 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
              <Layers className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 dark:text-white">
              {decisions.length}
            </span>
            <span className="text-[10px] font-medium text-emerald-600">Active</span>
          </div>
          <p className="mt-0.5 text-[10px] text-slate-500 dark:text-slate-400">
            4 Academic Units
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Stakeholders
            </span>
            <div className="rounded-lg bg-emerald-50 p-1.5 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
              <Users className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 dark:text-white">
              29,400+
            </span>
            <span className="text-[10px] font-medium text-emerald-600">Monitored</span>
          </div>
          <p className="mt-0.5 text-[10px] text-slate-500 dark:text-slate-400">
            Students & Research Labs
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Avg Feasibility
            </span>
            <div className="rounded-lg bg-indigo-50 p-1.5 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
              <TrendingUp className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 dark:text-white">
              88%
            </span>
            <span className="text-[10px] font-medium text-indigo-600">Scenario 2</span>
          </div>
          <p className="mt-0.5 text-[10px] text-slate-500 dark:text-slate-400">
            Protecting Laboratories
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Human Review
            </span>
            <div className="rounded-lg bg-amber-50 p-1.5 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400">
              <ShieldCheck className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 dark:text-white">
              100%
            </span>
            <span className="text-[10px] font-medium text-amber-600">Enforced</span>
          </div>
          <p className="mt-0.5 text-[10px] text-slate-500 dark:text-slate-400">
            Provost Authorization
          </p>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search proposals by keyword or department..."
            className="w-full rounded-xl border border-slate-200 bg-white py-1.5 pl-9 pr-4 text-xs text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-white"
          />
        </div>

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
              <span>{status === "ALL" ? "All Policies" : status.charAt(0) + status.slice(1).toLowerCase()}</span>
              <span className="ml-1.5 opacity-70 text-[10px]">({counts[status] || 0})</span>
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
      ) : filteredDecisions.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center dark:border-slate-800 dark:bg-slate-900">
          <Layers className="mx-auto h-8 w-8 text-slate-400" />
          <h3 className="mt-2 text-xs font-semibold text-slate-900 dark:text-white">
            No decisions match current filter
          </h3>
          <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
            Create a new policy proposal or select another status filter tab.
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
                    <span>🏢 {decision.department}</span>
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

                    <button
                      type="button"
                      onClick={(e) => handleToggleArchive(e, decision.id)}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 hover:text-amber-600 dark:hover:text-amber-400 cursor-pointer ml-1"
                      title={isArchived ? "Restore to Active" : "Soft-archive decision"}
                    >
                      {isArchived ? (
                        <>
                          <ArchiveRestore className="h-3.5 w-3.5" />
                          <span>Restore</span>
                        </>
                      ) : (
                        <>
                          <Archive className="h-3.5 w-3.5" />
                          <span>Archive</span>
                        </>
                      )}
                    </button>

                    {decision.id > 1 && (
                      <button
                        type="button"
                        onClick={(e) => handleDelete(e, decision.id)}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-400 hover:text-rose-600 cursor-pointer ml-1"
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
    </div>
  );
}
