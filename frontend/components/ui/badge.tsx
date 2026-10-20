import { cn } from "@/lib/utils"
import type { HTMLAttributes } from "react"

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "outline" | "secondary" | "destructive"
  size?: "default" | "sm" | "lg"
}

export function Badge({ className, variant = "default", size: _size, children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors",
        variant === "default" && "border-transparent bg-indigo-600 text-white",
        variant === "outline" && "border-current bg-transparent",
        variant === "secondary" && "border-transparent bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-slate-100",
        variant === "destructive" && "border-transparent bg-rose-600 text-white",
        className
      )}
      {...props}
    >
      {children}
    </span>
  )
}
