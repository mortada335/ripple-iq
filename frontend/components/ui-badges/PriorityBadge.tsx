import { cn } from "@/lib/utils"
import { AlertCircle, X, AlertTriangle, CheckCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"

type PriorityType = "critical" | "high" | "medium" | "low" | "none"

interface PriorityBadgeProps {
  priority: PriorityType
  variant?: "default" | "outline"
  size?: "default" | "sm" | "lg"
}

export function PriorityBadge({ priority, variant = "default", size = "default" }: PriorityBadgeProps) {
  const styles = {
    critical: {
      bg: "bg-[var(--severity-critical)]",
      bgDark: "bg-rose-600",
      text: "text-white",
      icon: X,
      label: "Critical",
      border: "border-rose-900",
      lightBg: "bg-rose-50",
      lightText: "text-rose-700",
      lightBorder: "border-rose-200",
    },
    high: {
      bg: "bg-[var(--severity-high)]",
      bgDark: "bg-rose-600",
      text: "text-white",
      icon: AlertCircle,
      label: "High",
      border: "border-rose-900",
      lightBg: "bg-rose-50",
      lightText: "text-rose-700",
      lightBorder: "border-rose-200",
    },
    medium: {
      bg: "bg-[var(--severity-medium)]",
      bgDark: "bg-orange-500",
      text: "text-white",
      icon: AlertTriangle,
      label: "Medium",
      border: "border-orange-900",
      lightBg: "bg-orange-50",
      lightText: "text-orange-700",
      lightBorder: "border-orange-200",
    },
    low: {
      bg: "bg-[var(--severity-low)]",
      bgDark: "bg-amber-500",
      text: "text-[var(--foreground)]",
      icon: CheckCircle,
      label: "Low",
      border: "border-amber-900",
      lightBg: "bg-orange-50",
      lightText: "text-orange-700",
      lightBorder: "border-orange-200",
    },
    none: {
      bg: "bg-slate-500",
      bgDark: "bg-slate-500",
      text: "text-slate-300",
      icon: "—",
      label: "None",
      border: "border-slate-700",
      lightBg: "bg-slate-100",
      lightText: "text-slate-500",
      lightBorder: "border-slate-200",
    },
  }

  const style = styles[priority]

  const sizeClasses = {
    default: "px-3 py-1.5 text-sm",
    sm: "px-2 py-1 text-xs",
    lg: "px-4 py-2 text-sm",
  }

  return (
    <Badge
      className={cn(
        cn(
          "inline-flex items-center gap-1.5 rounded-md font-semibold transition-all duration-300",
          variant === "default"
            ? `${style.bg} ${style.text} border ${style.border}`
            : `${style.bg} ${style.border} ${style.lightText}`,
          size === "sm" ? "px-2 py-0.5 text-xs" : "px-3 py-1.5 text-sm"
        ),
        variant === "default" ? "" : "bg-lightBg border-lightBorder"
      )}
      variant={variant}
      size={size}
    >
      <span className={cn(size === "sm" ? "" : "text-base font-bold")}>
        {priority === "critical" ? "🔴" : 
         priority === "high" ? "🟥" : 
         priority === "medium" ? "🟧" : 
         priority === "low" ? "🟨" : "—"}
      </span>
      {priority.charAt(0).toUpperCase() + priority.slice(1)}
    </Badge>
  )
}