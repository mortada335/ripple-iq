import { cn } from "@/lib/utils"
import type { ButtonHTMLAttributes } from "react"

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline" | "ghost" | "destructive"
  size?: "default" | "sm" | "lg" | "icon"
}

export function Button({ className, variant = "default", size = "default", children, ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:opacity-50",
        variant === "default" && "bg-indigo-600 text-white hover:bg-indigo-500",
        variant === "outline" && "border border-slate-300 bg-transparent hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800",
        variant === "ghost" && "hover:bg-slate-100 dark:hover:bg-slate-800",
        variant === "destructive" && "bg-rose-600 text-white hover:bg-rose-500",
        size === "default" && "h-9 px-4 py-2 text-sm",
        size === "sm" && "h-7 px-3 text-xs",
        size === "lg" && "h-11 px-6 text-sm",
        size === "icon" && "h-9 w-9",
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
}
