"use client";

import { cn } from "@/lib/utils";
import { Check, Clock, X, Search } from "lucide-react";
import { useLocale } from "@/components/LocaleProvider";

type StatusType = "active" | "completed" | "pending" | "cancelled" | "review" | "failed" | "success";

interface StatusBadgeProps {
  status: StatusType;
  variant?: "default" | "outline";
  size?: "default" | "sm" | "lg";
}

export function StatusBadge({ status, variant = "default", size = "default" }: StatusBadgeProps) {
  const { locale } = useLocale();

  const labels: Record<StatusType, { en: string; ar: string }> = {
    active: { en: "Active", ar: "نشط" },
    completed: { en: "Completed", ar: "مكتمل" },
    pending: { en: "Pending", ar: "قيد الانتظار" },
    cancelled: { en: "Cancelled", ar: "ملغي" },
    review: { en: "Under Review", ar: "قيد المراجعة" },
    failed: { en: "Failed", ar: "فشل" },
    success: { en: "Success", ar: "ناجح" },
  };

  const icons: Record<StatusType, typeof Check> = {
    active: Check,
    completed: Check,
    pending: Clock,
    cancelled: X,
    review: Search,
    failed: X,
    success: Check,
  };

  const styles = {
    default: {
      active: "bg-emerald-600 text-white border-emerald-700",
      completed: "bg-emerald-600 text-white border-emerald-700",
      pending: "bg-amber-500 text-white border-amber-600",
      cancelled: "bg-slate-500 text-white border-slate-600",
      review: "bg-purple-600 text-white border-purple-700",
      failed: "bg-rose-600 text-white border-rose-700",
      success: "bg-emerald-600 text-white border-emerald-700",
    },
    outline: {
      active: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900/50",
      completed: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900/50",
      pending: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900/50",
      cancelled: "bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-900 dark:text-slate-300 dark:border-slate-800",
      review: "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-900/50",
      failed: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900/50",
      success: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900/50",
    },
  };

  const styleClass = styles[variant][status] ?? styles[variant].active;
  const Icon = icons[status] ?? Check;
  const label = labels[status]?.[locale] ?? labels[status]?.en ?? status;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-lg font-semibold border shadow-2xs transition-all",
        styleClass,
        size === "sm" ? "px-2 py-0.5 text-[11px]" : size === "lg" ? "px-3.5 py-1.5 text-sm" : "px-2.5 py-1 text-xs"
      )}
    >
      <Icon className={cn("shrink-0", size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5")} aria-hidden="true" />
      <span>{label}</span>
    </span>
  );
}