import { cn } from "@/lib/utils"

type StatusType = "active" | "completed" | "pending" | "cancelled" | "review" | "failed" | "success"

interface StatusBadgeProps {
  status: StatusType
  variant?: "default" | "outline"
  size?: "default" | "sm" | "lg"
}

export function StatusBadge({ status, variant = "default", size = "default" }: StatusBadgeProps) {
  const styles = {
    default: {
      active: {
        bg: "bg-emerald-500",
        border: "border-emerald-500",
        text: "text-emerald-100",
        icon: "✓",
      },
      completed: {
        bg: "bg-emerald-500",
        border: "border-emerald-600",
        text: "text-white",
        icon: "✓",
      },
      pending: {
        bg: "bg-amber-500",
        border: "border-amber-600",
        text: "text-white",
        icon: "⏳",
      },
      cancelled: {
        bg: "bg-slate-400",
        border: "border-slate-500",
        text: "text-white",
        icon: "✕",
      },
      review: {
        bg: "bg-purple-500",
        border: "border-purple-600",
        text: "text-white",
        icon: "🔍",
      },
      failed: {
        bg: "bg-rose-500",
        border: "border-rose-600",
        text: "text-white",
        icon: "✕",
      },
      success: {
        bg: "bg-emerald-500",
        border: "border-emerald-600",
        text: "text-white",
        icon: "✓",
      },
    },
    outline: {
      active: {
        bg: "bg-emerald-50",
        border: "border-emerald-300",
        text: "text-emerald-700",
        icon: "✓",
      },
      completed: {
        bg: "bg-slate-50",
        border: "border-emerald-300",
        text: "text-emerald-700",
        icon: "✓",
      },
      pending: {
        bg: "bg-amber-50",
        border: "border-amber-300",
        text: "text-amber-700",
        icon: "⏳",
      },
      cancelled: {
        bg: "bg-slate-50",
        border: "border-slate-300",
        text: "text-slate-600",
        icon: "✕",
      },
      review: {
        bg: "bg-slate-50",
        border: "border-purple-300",
        text: "text-purple-700",
        icon: "🔍",
      },
      failed: {
        bg: "bg-slate-50",
        border: "border-rose-300",
        text: "text-rose-700",
        icon: "✕",
      },
      success: {
        bg: "bg-emerald-50",
        border: "border-emerald-400",
        text: "text-emerald-700",
        icon: "✓",
      },
    },
  }

  const style = styles[variant][status]

  const sizeClasses = {
    default: "px-3 py-1.5 text-sm",
    sm: "px-2 py-1 text-xs",
    lg: "px-4 py-2 text-base",
  }

  const sizeClassesDark = {
    default: "px-3 py-1.5 text-sm",
    sm: "px-2 py-1 text-xs",
    lg: "px-4 py-2 text-base",
  }

  return (
    <span
      className={cn(
        cn(
          "inline-flex items-center gap-1.5 rounded-full font-medium",
          variant === "default" 
            ? `${style.bg} ${style.border} ${style.text} border` 
            : `${style.bg} ${style.border} ${style.text}`,
          size === "sm" ? "px-2 py-0.5 text-xs" : "px-3 py-1.5 text-sm"
        ),
        "transition-all duration-300"
      )}
    >
      <span className="text-base font-bold" style={{ fontFamily: '"Segoe UI Symbol", "Symbol", "Arial Unicode MS", sans-serif' }}>{style.icon}</span>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  )
}