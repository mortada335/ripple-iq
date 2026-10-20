import { cn } from "@/lib/utils"
import type { HTMLAttributes } from "react"

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900", className)}
      {...props}
    />
  )
}

export function CardContent({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-6", className)} {...props} />
}

export function CardHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex flex-col space-y-1.5 p-6", className)} {...props} />
}

export function CardTitle({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={cn("font-semibold text-slate-900 dark:text-white", className)} {...props} />
}
