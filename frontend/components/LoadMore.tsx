"use client";

import { Loader2 } from "lucide-react";

export function LoadMore({ loaded, hasMore, loading, onLoadMore }: { loaded: number; hasMore: boolean; loading: boolean; onLoadMore: () => void }) {
  if (!loaded) return null;
  return <div className="flex flex-col items-center gap-2 py-2">
    <p className="text-xs text-slate-500" aria-live="polite">Showing {loaded} loaded decisions</p>
    {hasMore && <button type="button" onClick={onLoadMore} disabled={loading} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800">
      {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}{loading ? "Loading…" : "Load more decisions"}
    </button>}
  </div>;
}
