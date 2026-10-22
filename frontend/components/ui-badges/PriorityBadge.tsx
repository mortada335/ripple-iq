"use client";

import { cn } from "@/lib/utils";
import { AlertCircle, X, AlertTriangle, CheckCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useLocale } from "@/components/LocaleProvider";

type PriorityType = "critical" | "high" | "medium" | "low" | "none";

interface PriorityBadgeProps {
  priority: PriorityType;
  variant?: "default" | "outline";
  size?: "default" | "sm" | "lg";
}

export function PriorityBadge({ priority, variant = "default", size = "default" }: PriorityBadgeProps) {
  const { locale } = useLocale();

  const labels: Record<PriorityType, { en: string; ar: string }> = {
    critical: { en: "Critical", ar: "حرج" },
    high: { en: "High", ar: "عالي" },
    medium: { en: "Medium", ar: "متوسط" },
    low: { en: "Low", ar: "منخفض" },
    none: { en: "None", ar: "بدون" },
  };

  const styles = {
    critical: {
      bg: "bg-rose-600 text-white border-rose-700",
      icon: X,
      dot: "bg-rose-400 animate-pulse",
      lightBg: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900/50",
    },
    high: {
      bg: "bg-rose-500 text-white border-rose-600",
      icon: AlertCircle,
      dot: "bg-rose-400",
      lightBg: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900/50",
    },
    medium: {
      bg: "bg-amber-500 text-white border-amber-600",
      icon: AlertTriangle,
      dot: "bg-amber-400",
      lightBg: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900/50",
    },
    low: {
      bg: "bg-emerald-500 text-white border-emerald-600",
      icon: CheckCircle,
      dot: "bg-emerald-400",
      lightBg: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900/50",
    },
    none: {
      bg: "bg-slate-500 text-white border-slate-600",
      icon: CheckCircle,
      dot: "bg-slate-400",
      lightBg: "bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-900 dark:text-slate-300 dark:border-slate-800",
    },
  };

  const style = styles[priority] ?? styles.none;
  const label = labels[priority]?.[locale] ?? labels[priority]?.en ?? priority;
  const Icon = style.icon;

  return (
    <Badge
      className={cn(
        "inline-flex items-center gap-1.5 rounded-lg font-semibold transition-all shadow-2xs border",
        variant === "default" ? style.bg : style.lightBg,
        size === "sm" ? "px-2 py-0.5 text-[11px]" : size === "lg" ? "px-3.5 py-1.5 text-sm" : "px-2.5 py-1 text-xs"
      )}
      variant={variant}
      size={size}
    >
      <Icon className={cn("shrink-0", size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5")} aria-hidden="true" />
      <span>{label}</span>
    </Badge>
  );
}