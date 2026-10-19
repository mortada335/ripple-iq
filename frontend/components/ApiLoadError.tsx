"use client";

export function ApiLoadError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div role="alert" className="rounded-xl border border-rose-200 bg-white p-6 text-center dark:border-rose-900 dark:bg-slate-900">
      <p className="text-sm text-rose-700 dark:text-rose-300">{message}</p>
      <button type="button" onClick={onRetry} className="mt-3 min-h-10 rounded-lg bg-indigo-600 px-4 text-sm font-semibold text-white hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600">
        Retry
      </button>
    </div>
  );
}
