import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-slate-200 dark:bg-slate-800",
        className
      )}
    />
  );
}

export function CardSkeleton() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-3">
      <Skeleton className="h-4 w-1/3" />
      <Skeleton className="h-3 w-2/3" />
      <Skeleton className="h-3 w-1/2" />
    </div>
  );
}

export function DecisionCardSkeleton() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-start justify-between gap-3 mb-3">
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
      <Skeleton className="h-3 w-full mb-2" />
      <Skeleton className="h-3 w-3/4 mb-4" />
      <div className="flex items-center gap-2">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-3 w-24" />
      </div>
    </div>
  );
}

export function TableRowSkeleton({ cols = 4 }: { cols?: number }) {
  return (
    <tr className="border-b border-slate-100 dark:border-slate-800">
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <Skeleton className={`h-3 ${i === 0 ? "w-3/4" : "w-1/2"}`} />
        </td>
      ))}
    </tr>
  );
}

export function PageSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-9 w-32 rounded-xl" />
      </div>
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <Skeleton className="h-3 w-2/3 mb-3" />
            <Skeleton className="h-7 w-12" />
          </div>
        ))}
      </div>
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <DecisionCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
