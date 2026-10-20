import { cn } from "@/lib/utils"
import { TrendingUp, Clock, CheckCircle, XCircle, AlertTriangle, Loader2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Card, CardContent } from "@/components/ui/card"

interface ProgressPoint {
  step: number
  title: string
  status?: "processing" | "completed" | "failed" | "pending" | "error"
  duration?: number // seconds
}

interface ProgressSummary {
  completed: number
  total: number
  timeElapsed: number // seconds
  estimatedTime: number // seconds
  status: "processing" | "completed" | "failed" | "pending"
}

interface ProgressBadgeProps {
  summary: ProgressSummary
  points?: ProgressPoint[]
}

export function ProgressBadge({ summary, points = [] }: ProgressBadgeProps) {
  const percentage = (summary.completed / summary.total) * 100
  const etaMinutes = summary.estimatedTime > 0 ? Math.ceil(summary.estimatedTime / 60) : 0
  
  const getStatusColor = (status: ProgressSummary["status"]) => {
    switch (status) {
      case "completed": return "from-green-400 to-green-600"
      case "failed": return "from-rose-400 to-rose-600"
      case "pending": return "from-amber-400 to-amber-600"
      default: return "from-primary/50 to-primary/80"
    }
  }

  const getStatusIcon = (status: ProgressSummary["status"]) => {
    switch (status) {
      case "completed": return <CheckCircle className="w-6 h-6" />
      case "failed": return <XCircle className="w-6 h-6" />
      case "pending": return <AlertTriangle className="w-6 h-6" />
      default: return <Loader2 className="w-6 h-6 animate-spin" />
    }
  }

  return (
    <Card className="shadow-lg border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10 dark:from-[#0a1628] dark:to-[#162a4d] hover:shadow-primary/10 transition-all duration-500">
      <CardContent className="p-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <Card className="flex items-center justify-center p-3 bg-gradient-to-br from-primary to-primary-foreground/90 dark:from-primary dark:to-indigo-500 shadow-lg shadow-primary/20 dark:shadow-primary/30 animate-pulse border-primary">
            <div className="text-white">
              {getStatusIcon(summary.status)}
            </div>
          </Card>
          <div>
            <h3 className="text-lg font-bold bg-gradient-to-r from-primary to-primary-foreground bg-clip-text text-transparent">
              {summary.status === "processing" ? "Analyzing Decision..." : summary.status === "completed" ? "Analysis Complete!" : summary.status === "failed" ? "Analysis Failed" : "Ready to Analyze"}
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              {summary.status === "processing"
                ? `Processing ${summary.total} steps...`
                : summary.status === "completed"
                  ? `${summary.completed}/${summary.total} steps analyzed`
                  : summary.status === "failed"
                    ? "An error occurred during analysis"
                    : "Waiting to begin analysis"}
              {summary.timeElapsed > 0 && summary.timeElapsed < 60 && (
                <span className="ml-2 px-2 py-0.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded text-xs">
                  {summary.timeElapsed}s elapsed
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-foreground">Progress</span>
            <span className="text-sm font-bold text-primary">{percentage.toFixed(0)}%</span>
          </div>
          <Progress
            value={percentage}
            className={cn(
              "h-3 bg-gradient-to-r",
              summary.status === "completed" ? "from-green-400 to-green-600" :
              summary.status === "failed" ? "from-rose-400 to-rose-600" :
              "from-primary/50 to-primary/80"
            )}
            indicatorClassName={cn(
              "h-3 rounded-full transition-all duration-500",
              summary.status === "completed" ? "bg-green-500 dark:bg-green-400" :
              summary.status === "failed" ? "bg-rose-500 dark:bg-rose-400" :
              "bg-gradient-to-r from-primary via-primary to-primary/80 dark:from-primary dark:via-primary dark:to-indigo-400"
            )}
          />
        </div>

        {/* Timeline points */}
        {points.length > 0 && (
          <div className="space-y-3">
            {points.map((point, idx) => (
              <div key={point.step} className="flex items-center gap-3 p-3 rounded-lg border border-border/30 bg-card/30 hover:bg-card/50 transition-all duration-300"
                   style={{ opacity: point.status === "completed" ? 1 : point.status === "processing" ? 0.8 : 0.5 }}>
                <span
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold border",
                    point.status === "completed" ? "bg-green-500/10 border-green-500/30 text-green-600 dark:text-green-400" :
                    point.status === "failed" ? "bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400" :
                    point.status === "error" ? "bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400" :
                    "bg-primary/10 border-primary/30 text-primary dark:text-primary"
                  )}
                >
                  {idx + 1}
                  {point.status === "completed" && <CheckCircle className="w-4 h-4 ml-1" />}
                  {point.status === "processing" && <Loader2 className="w-4 h-4 ml-1 animate-spin" />}
                  {point.status === "failed" && <XCircle className="w-4 h-4 ml-1" />}
                </span>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">{point.title}</p>
                  {point.duration && (
                    <p className="text-xs text-muted-foreground">{point.duration}s</p>
                  )}
                </div>
                {point.status === "processing" && (
                  <Loader2 className="w-4 h-4 animate-spin text-primary" />
                )}
              </div>
            ))}
          </div>
        )}

        {/* Summary stats */}
        {summary.status === "completed" && (
          <div className="grid grid-cols-3 gap-3 mt-4">
            <div className="text-center p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">{percentage.toFixed(1)}%</p>
              <p className="text-xs text-green-700 dark:text-green-400">Completion</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
              <p className="text-xl font-bold text-amber-600 dark:text-amber-400">~{etaMinutes}m</p>
              <p className="text-xs text-amber-700 dark:text-amber-400">ETA</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
              <p className="text-xl font-bold text-blue-600 dark:text-blue-400">{summary.timeElapsed}s</p>
              <p className="text-xs text-blue-700 dark:text-blue-400">Elapsed Time</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export function StepIndicator({ step, total }: { step: number; total: number }) {
  const percentage = (step / total) * 100
  
  return (
    <div className="flex items-center gap-3">
      <Progress
        value={percentage}
        className="w-12 h-2"
        indicatorClassName={cn(
          "transition-all duration-500",
          percentage > 50 ? "bg-green-500 dark:bg-green-400" :
          percentage > 25 ? "bg-amber-500 dark:bg-amber-400" :
          "bg-primary dark:bg-primary"
        )}
      />
      <span className="text-sm font-medium text-muted-foreground">{step}/{total}</span>
    </div>
  )
}