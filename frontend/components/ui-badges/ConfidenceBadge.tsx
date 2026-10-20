import { cn } from "@/lib/utils"
import { Gauge, ArrowDown, ArrowUp } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"

type ConfidenceType = "high" | "medium" | "low"

interface ConfidenceBadgeProps {
  confidence: ConfidenceType | number
  variant?: "default" | "outline"
  size?: "default" | "sm" | "lg"
  withProgress?: boolean
  interactive?: boolean
  onClick?: () => void
}

function getConfidenceLevel(value: number | string) {
  return typeof value === "string" ? value : value >= 80 ? "high" : value >= 50 ? "medium" : "low"
}

export function ConfidenceBadge({ confidence, variant = "default", size = "default", withProgress = false, interactive = false, onClick }: ConfidenceBadgeProps) {
  const level = getConfidenceLevel(confidence)

  const styles = {
    high: {
      bg: "bg-[var(--confidence-high)]",
      bgDark: "bg-indigo-500",
      text: "text-white",
      label: "High",
      border: "border-indigo-900",
      lightBg: "bg-indigo-50",
      lightText: "text-indigo-700",
      lightBorder: "border-indigo-200",
      icon: "🟢",
    },
    medium: {
      bg: "bg-[var(--confidence-medium)]",
      bgDark: "bg-amber-500",
      text: "text-white",
      label: "Medium",
      border: "border-amber-900",
      lightBg: "bg-amber-50",
      lightText: "text-amber-700",
      lightBorder: "border-amber-200",
      icon: "🟡",
    },
    low: {
      bg: "bg-[var(--confidence-low)]",
      bgDark: "bg-orange-500",
      text: "text-[var(--foreground)]",
      label: "Low",
      border: "border-orange-900",
      lightBg: "bg-orange-50",
      lightText: "text-orange-700",
      lightBorder: "border-orange-200",
      icon: "🟠",
    },
  }

  const style = styles[level as keyof typeof styles]

  const percentage = typeof confidence === "number" ? confidence : 0

  const sizeClasses = {
    default: "px-3 py-1.5 text-sm",
    sm: "px-2 py-1 text-xs",
    lg: "px-4 py-2 text-base",
  }

  return (
    <Badge
      className={cn(
        cn(
          "inline-flex items-center gap-2 rounded-md font-semibold transition-all duration-300 hover:scale-105",
          variant === "default"
            ? `${style.bg} ${style.text} border ${style.border}`
            : `${style.bg} ${style.border} ${style.lightText}`,
          size === "sm" ? "px-2 py-0.5 text-xs" : "px-3 py-1.5 text-sm"
        ),
        variant === "default" ? "" : "bg-lightBg border-lightBorder"
      )}
      variant={variant}
    >
      <span
        className={cn(
          "text-xl transition-transform duration-300",
          interactive ? "hover:scale-110 cursor-pointer select-none" : ""
        )}
        onClick={interactive ? onClick : undefined}
      >
        {style.icon}
      </span>
      <span className={cn(size === "sm" ? "" : "text-base font-bold")}>
        {level.charAt(0).toUpperCase() + level.slice(1)} Confidence
      </span>
      {withProgress && (
        <Progress value={percentage} className="h-1.5 w-12 ml-2 flex-shrink-0" indicatorClassName={cn("transition-all duration-500", style.bg.replace("bg-", "bg-"))} />
      )}
    </Badge>
  )
}

export interface ConfidenceBadgeDetailedProps extends ConfidenceBadgeProps {
  percentage: number
  description?: string
  recommendedAction?: string
}

export function ConfidenceBadgeDetailed({ confidence, percentage, description, recommendedAction, variant = "default", size = "default", interactive = false, onClick }: ConfidenceBadgeDetailedProps) {
  const level = getConfidenceLevel(confidence)
  const styles = {
    high: {
      bg: "bg-[var(--confidence-high)]",
      bgDark: "bg-indigo-500",
      text: "text-white",
      label: "High Confidence",
      border: "border-indigo-900",
      lightBg: "bg-indigo-50",
      lightText: "text-indigo-700",
      lightBorder: "border-indigo-200",
      icon: "🟢",
      desc: "AI is highly confident in this recommendation. Review and accept if it matches your intent.",
    },
    medium: {
      bg: "bg-[var(--confidence-medium)]",
      bgDark: "bg-amber-500",
      text: "text-white",
      label: "Medium Confidence",
      border: "border-amber-900",
      lightBg: "bg-amber-50",
      lightText: "text-amber-700",
      lightBorder: "border-amber-200",
      icon: "🟡",
      desc: "AI has a moderate confidence level. Carefully review the recommendation before proceeding.",
    },
    low: {
      bg: "bg-[var(--confidence-low)]",
      bgDark: "bg-orange-500",
      text: "text-[var(--foreground)]",
      label: "Low Confidence",
      border: "border-orange-900",
      lightBg: "bg-orange-50",
      lightText: "text-orange-700",
      lightBorder: "border-orange-200",
      icon: "🟠",
      desc: "AI is uncertain about this recommendation. Strongly recommend human review before proceeding.",
    },
  }

  const style = styles[level as keyof typeof styles]

  return (
    <div className="relative p-3 rounded-lg border border-dashed border-border/60 bg-card/50 hover:bg-card/80 transition-all duration-300">
      <div className="flex items-start gap-3">
        <span
          className={cn(
            "text-2xl transition-transform duration-300",
            interactive ? "hover:scale-125 cursor-pointer hover:animate-bounce" : ""
          )}
          onClick={interactive ? onClick : undefined}
        >
          {style.icon}
        </span>
        <div className="flex-1">
          <h4 className={cn("font-semibold text-base mb-1 transition-colors duration-300", interactive ? "cursor-pointer hover:text-primary" : "")}>
            {style.label}
            <span className={cn("text-sm font-normal ml-2 text-muted-foreground", interactive ? "cursor-pointer hover:text-foreground" : "")}>
              ({percentage}%)
            </span>
          </h4>
          {description && (
            <p className={cn("text-sm text-muted-foreground mb-2 line-clamp-2", interactive ? "" : "")}>
              {description}
            </p>
          )}
          {recommendedAction && (
            <div className="mb-3">
              <span className={cn("text-xs font-medium", interactive ? "text-primary" : "text-primary-foreground")}>
                <span className={cn("inline-block w-1.5 h-1.5 rounded-full mr-1.5", style.bg.replace("[", "").replace("]", ""))}></span>
                Recommended Action:
              </span>
              <p className={cn("text-sm mt-1.5", interactive ? "text-muted-foreground" : "")}>
                {recommendedAction}
              </p>
            </div>
          )}
          {interactive && (
            <Button
              size="sm"
              variant="outline"
              className={cn(
                "mt-2 px-3 py-1.5 text-xs transition-all duration-200",
                level === "high" && "border-green-500 text-green-600 hover:bg-green-50 dark:border-green-500 dark:text-green-400 dark:hover:bg-green-900/20",
                level === "medium" && "border-amber-500 text-amber-600 hover:bg-amber-50 dark:border-amber-500 dark:text-amber-400 dark:hover:bg-amber-900/20",
                level === "low" && "border-orange-500 text-orange-600 hover:bg-orange-50 dark:border-orange-500 dark:text-orange-400 dark:hover:bg-orange-900/20"
              )}
              onClick={onClick}
            >
              {percentage >= 80 ? "Accept" : percentage >= 50 ? "Review" : "Manual Override"}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}