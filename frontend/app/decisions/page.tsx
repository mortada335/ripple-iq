"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Search,
  PlusCircle,
  ChevronRight,
  Download,
  Archive,
  ArchiveRestore,
  Trash2,
} from "lucide-react";
import { getDecisions, getReport, toggleArchiveDecision, deleteDecision } from "@/lib/api";
import { Decision } from "@/types/decision";
import { Pagination } from "@/components/Pagination";
import { toast } from "sonner";

const PAGE_SIZE = 20;

export default function HistoricalDecisionsPage() {
  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  const loadDecisions = () => {
    getDecisions()
      .then((data) => {
        setDecisions(data);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
        toast.error("Could not load decisions");
      });
  };

  useEffect(() => {
    loadDecisions();
  }, []);

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
      loadDecisions();
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
        loadDecisions();
      } catch {
        toast.error("Could not delete the decision");
      }
    }
  };

  const filtered = decisions.filter(
    (d) =>
      d.title.toLowerCase().includes(search.toLowerCase()) ||
      d.department.toLowerCase().includes(search.toLowerCase())
  );
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const visible = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  return (
    <div className="space-y-4 sm:space-y-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-2xl">
            Past Decision Analyses
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Browse organization decisions and their completed impact analyses.
          </p>
        </div>

        <Link
          href="/decisions/new"
          className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-indigo-500 transition shadow-xs"
        >
          <PlusCircle className="h-3.5 w-3.5" />
          <span>New Decision</span>
        </Link>
      </div>

      {/* Search Filter */}
      <div className="relative max-w-md">
        <Search className="pointer-events-none absolute start-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="Filter decisions by title or responsible team..."
          className="w-full rounded-xl border border-slate-200 bg-white py-1.5 ps-9 pe-4 text-xs text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-white"
        />
      </div>

      {/* Table list */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {loading ? (
            <div className="p-6 text-center text-xs text-slate-400 animate-pulse">
              Loading decisions...
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-400">
              No historical decisions found.
            </div>
          ) : (
            visible.map((d) => {
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
                        {d.status}
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

                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      🏢 {d.department} • Created {new Date(d.created_at).toLocaleDateString()}
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

                    <button
                      onClick={(e) => handleToggleArchive(e, d.id)}
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 cursor-pointer"
                      title={isArchived ? "Restore to Active" : "Archive"}
                    >
                      {isArchived ? (
                        <>
                          <ArchiveRestore className="h-3 w-3" />
                          <span>Restore</span>
                        </>
                      ) : (
                        <>
                          <Archive className="h-3 w-3" />
                          <span>Archive</span>
                        </>
                      )}
                    </button>

                    {d.id > 1 && (
                      <button
                        onClick={(e) => handleDelete(e, d.id)}
                        className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer"
                        title="Delete"
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
                      <span>{d.status === "COMPLETED" ? "Inspect" : "Resume"}</span>
                      <ChevronRight className="h-3 w-3" />
                    </Link>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
      {!loading && filtered.length > 0 && (
        <>
          <p className="text-center text-[11px] text-slate-500">Pagination is local to this demo until server-side paging is connected.</p>
          <Pagination page={currentPage} pageSize={PAGE_SIZE} totalItems={filtered.length} onPageChange={(nextPage) => setPage(Math.min(Math.max(1, nextPage), pageCount))} />
        </>
      )}
    </div>
  );
}
