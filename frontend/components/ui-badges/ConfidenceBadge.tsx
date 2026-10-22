"use client";

import { cn } from "@/lib/utils";
import { CheckCircle2, AlertCircle, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useLocale } from "@/components/LocaleProvider";

type ConfidenceType = "high" | "medium" | "low";

interface ConfidenceBadgeProps {
  confidence: ConfidenceType | number;
  variant?: "default" | "outline";
  size?: "default" | "sm" | "lg";
  withProgress?: boolean;
  interactive?: boolean;
  onClick?: () => void;
}

function getConfidenceLevel(value: number | string): ConfidenceType {
  return typeof value === "string" ? (value as ConfidenceType) : value >= 80 ? "high" : value >= 50 ? "medium" : "low";
}

export function ConfidenceBadge({
  confidence,
  variant = "default",
  size = "default",
  withProgress = false,
  interactive = false,
  onClick,
}: ConfidenceBadgeProps) {
  const level = getConfidenceLevel(confidence);
  const { locale } = useLocale();

  const labels = {
    high: { en: "High Confidence", ar: "ثقة عالية" },
    medium: { en: "Medium Confidence", ar: "ثقة متوسطة" },
    low: { en: "Low Confidence", ar: "ثقة منخفضة" },
  };

  const styles = {
    high: {
      bg: "bg-indigo-600 text-white border-indigo-700",
      lightBg: "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-900/50",
      icon: CheckCircle2,
    },
    medium: {
      bg: "bg-amber-500 text-white border-amber-600",
      lightBg: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900/50",
      icon: AlertCircle,
    },
    low: {
      bg: "bg-orange-500 text-white border-orange-600",
      lightBg: "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/40 dark:text-orange-300 dark:border-orange-900/50",
      icon: AlertTriangle,
    },
  };

  const style = styles[level];
  const Icon = style.icon;
  const percentage = typeof confidence === "number" ? confidence : 0;
  const labelText = labels[level]?.[locale] ?? labels[level]?.en;

  return (
    <Badge
      className={cn(
        "inline-flex items-center gap-1.5 rounded-lg font-semibold transition-all shadow-2xs border",
        variant === "default" ? style.bg : style.lightBg,
        size === "sm" ? "px-2 py-0.5 text-[11px]" : size === "lg" ? "px-3.5 py-1.5 text-sm" : "px-2.5 py-1 text-xs"
      )}
      variant={variant}
      onClick={interactive ? onClick : undefined}
    >
      <Icon className={cn("shrink-0", size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5")} aria-hidden="true" />
      <span>{labelText}</span>
      {withProgress && (
        <Progress value={percentage} className="h-1.5 w-12 ms-2 shrink-0" />
      )}
    </Badge>
  );
}

export interface ConfidenceBadgeDetailedProps extends ConfidenceBadgeProps {
  percentage: number;
  description?: string;
  recommendedAction?: string;
}

export function ConfidenceBadgeDetailed({
  confidence,
  percentage,
  description,
  recommendedAction,
  interactive = false,
  onClick,
}: ConfidenceBadgeDetailedProps) {
  const level = getConfidenceLevel(confidence);
  const { locale } = useLocale();

  const labels = {
    high: { en: "High Confidence", ar: "ثقة عالية" },
    medium: { en: "Medium Confidence", ar: "ثقة متوسطة" },
    low: { en: "Low Confidence", ar: "ثقة منخفضة" },
  };

  const styles = {
    high: {
      icon: CheckCircle2,
      color: "text-indigo-600 dark:text-indigo-400",
      bgBadge: "bg-indigo-500",
      border: "border-indigo-200 dark:border-indigo-900/50",
    },
    medium: {
      icon: AlertCircle,
      color: "text-amber-600 dark:text-amber-400",
      bgBadge: "bg-amber-500",
      border: "border-amber-200 dark:border-amber-900/50",
    },
    low: {
      icon: AlertTriangle,
      color: "text-orange-600 dark:text-orange-400",
      bgBadge: "bg-orange-500",
      border: "border-orange-200 dark:border-orange-900/50",
    },
  };

  const style = styles[level];
  const Icon = style.icon;

  return (
    <div className={cn("relative p-3.5 rounded-xl border bg-white/50 dark:bg-slate-900/50 backdrop-blur-xs transition-all", style.border)}>
      <div className="flex items-start gap-3">
        <span className={cn("p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800", style.color)}>
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
        <div className="flex-1">
          <h4 className="font-semibold text-sm mb-1 text-slate-900 dark:text-white">
            {labels[level]?.[locale] ?? labels[level]?.en}
            <span className="text-xs font-normal ms-2 text-slate-500">
              ({percentage}%)
            </span>
          </h4>
          {description && (
            <p className="text-xs text-slate-600 dark:text-slate-400 mb-2 line-clamp-2">
              {description}
            </p>
          )}
          {recommendedAction && (
            <div className="mb-2 text-xs">
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                {locale === "ar" ? "الإجراء الموصى به: " : "Recommended Action: "}
              </span>
              <span className="text-slate-600 dark:text-slate-400">
                {recommendedAction}
              </span>
            </div>
          )}
          {interactive && (
            <Button
              size="sm"
              variant="outline"
              className="mt-1 px-3 py-1 text-xs"
              onClick={onClick}
            >
              {percentage >= 80 ? (locale === "ar" ? "قبول" : "Accept") : percentage >= 50 ? (locale === "ar" ? "مراجعة" : "Review") : (locale === "ar" ? "تعديل يدوي" : "Manual Override")}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}