import { cn } from "@/lib/utils"
import type { HTMLAttributes } from "react"

interface ProgressProps extends HTMLAttributes<HTMLDivElement> {
  value?: number
  indicatorClassName?: string
}

export function Progress({ className, value = 0, indicatorClassName, ...props }: ProgressProps) {
  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.min(100, Math.max(0, value))}
      className={cn("relative h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800", className)}
      {...props}
    >
      <div
        className={cn("h-full rounded-full bg-indigo-600 transition-all duration-500", indicatorClassName)}
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  )
}
