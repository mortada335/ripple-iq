"use client"

import React from "react"
import { cn } from "@/lib/utils"
import { CheckCircle, ArrowRight, Clock, AlertTriangle, Sparkles, XCircle, Loader2, Check } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { ProgressBadge } from "@/components/ui-progress/ProgressBadge"

interface StepData {
  id: number
  title: string
  description: string
  icon: React.ReactNode
  completed?: boolean
  current?: boolean
  pending?: boolean
  error?: boolean
  duration?: number // in seconds
  status?: "processing" | "completed" | "failed" | "pending" | "error"
}

interface ProgressStepperProps {
  steps: StepData[]
  totalSteps?: number
  isComplete?: boolean
  isLoading?: boolean
  progressPercentage?: number
}

export function ProgressStepper({ steps, totalSteps, isComplete, isLoading, progressPercentage }: ProgressStepperProps) {
  const completedSteps = steps.filter((s) => s.completed).length

  return (
    <Card className="w-full overflow-hidden shadow-lg border-primary/10 transition-all duration-500 hover:shadow-primary/5 bg-gradient-to-br from-card to-primary/5 dark:from-[#0a1628] dark:to-[#162a4d]">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
              Decision Progress
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              {isLoading 
                ? "Processing your decision analysis..." 
                : isComplete 
                  ? "Analysis complete! Review your results below."
                  : `${steps.reduce((acc, s) => acc + (s.completed ? 1 : 0), 0)} of ${steps.length} steps completed`
              }
            </p>
          </div>
          <div className="flex items-center gap-2">
            {isLoading && (
              <span className="text-sm text-primary flex items-center gap-1 animate-pulse">
                <Loader2 className="w-4 h-4 animate-spin" />
                Processing...
              </span>
            )}
            {isComplete && (
              <Badge variant="default" className="bg-green-500 border-green-600 animate-bounce-sm">
                <CheckCircle className="w-4 h-4 mr-1" />
                Complete
              </Badge>
            )}
          </div>
        </div>

        <div className="relative">
          {/* Progress line */}
          <div className="absolute left-[11px] top-0 bottom-0 w-0.5 bg-primary/30 dark:bg-primary/50" />
          
          <div className="space-y-6">
            {steps.map((step, index) => (
              <StepItem
                key={step.id}
                step={step}
                isLast={index === steps.length - 1}
                isLoading={isLoading}
              />
            ))}
          </div>

          {/* Progress bar overlay */}
          {progressPercentage !== undefined && !isLoading && (
            <div className="absolute left-[15px] top-0 bottom-0 w-1.5 bg-gradient-to-b from-primary via-primary to-primary/80" style={{ height: `${progressPercentage}%` }} />
          )}

          {/* Completion indicator */}
          {isComplete && (
            <div className="absolute left-[15px] top-[calc(100%+8px)] w-3 h-3 bg-green-500 rounded-full animate-pulse shadow-lg shadow-green-500/50" />
          )}
        </div>

        {/* Timeline summary */}
        {!isLoading && (
          <div className="mt-6 pt-6 border-t border-border/60">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                Started: {steps.length > 0 ? steps[0].title : "..."}
              </span>
              <span className="text-foreground font-medium">
                {isComplete ? "Completed successfully!" : "Processing in progress..."}
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function StepItem({ step, isLast, isLoading }: { step: StepData; isLast: boolean; isLoading?: boolean }) {
  const getStatusStyle = (status?: StepData["status"]) => {
    if (status === "completed") {
      return {
        icon: <CheckCircle className="w-6 h-6 text-green-500" />,
        line: "bg-green-500",
        dot: "w-4 h-4 bg-green-500",
      }
    } else if (status === "failed" || status === "error") {
      return {
        icon: <XCircle className="w-6 h-6 text-rose-500" />,
        line: "bg-rose-500",
        dot: "w-4 h-4 bg-rose-500",
      }
    } else if (status === "processing") {
      return {
        icon: <Loader2 className="w-6 h-6 text-primary animate-spin" />,
        line: "bg-primary/50 dark:bg-primary/30",
        dot: "w-4 h-4 bg-primary",
      }
    }
    return {
      icon: <Clock className="w-6 h-6 text-muted-foreground/50" />,
      line: "bg-border/30",
      dot: "w-4 h-4 bg-border",
    }
  }

  return (
    <div className="relative pl-12 group">
      {/* Timeline node */}
      <div className={cn(
        "absolute left-[15px] w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-500",
        step.completed 
          ? "bg-green-500 border-green-600 text-white scale-100" 
          : step.status === "failed" 
            ? "bg-rose-500 border-rose-600 text-white scale-95"
            : step.status === "processing"
              ? "bg-primary border-primary animate-pulse scale-110"
              : "bg-border border-muted-foreground/30 text-muted-foreground group-hover:scale-105"
      )}>
        {step.status === "processing" ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : step.completed ? (
          <Check className="w-4 h-4" />
        ) : (
          <span className="text-xs font-bold">{step.id}</span>
        )}
      </div>

      {/* Timeline line */}
      {!isLast && (
        <div className="absolute left-[1px] top-[23px] w-0.5 h-[calc(100%+6px)] {step.status === 'completed' || step.status === 'failed' ? 'bg-border/80' : 'bg-border/30'} transition-colors duration-500" />
      )}

      {/* Content */}
      <div className={cn(
        "relative transition-all duration-500",
        step.completed ? "opacity-100" : "opacity-60",
        isLoading ? "opacity-100" : "",
        "group-hover:translate-x-1"
      )}>
        <div className={cn(
          "inline-block px-4 py-2 rounded-lg border transition-all duration-500",
          step.completed 
            ? "bg-green-50 border-green-300 dark:bg-green-900/20 dark:border-green-700" 
            : step.status === "failed" 
              ? "bg-rose-50 border-rose-300 dark:bg-rose-900/20 dark:border-rose-700" 
              : step.status === "processing"
                ? "bg-primary/10 border-primary/30 dark:bg-primary/20 dark:border-primary/40"
                : "bg-muted/30 border-muted-foreground/20"
        )}>
          <div className="flex items-center gap-3">
            <span className={cn(
              "flex-shrink-0",
              step.completed ? "" : "text-muted-foreground/50"
            )}>
              {step.status === "completed" && <Check className="w-5 h-5 text-green-500" />}
              {step.status === "processing" && (
                <span className="flex items-center gap-1.5">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span className="text-xs">Processing...</span>
                </span>
              )}
              {step.status === "failed" && <XCircle className="w-5 h-5 text-rose-500" />}
              {(step.status === "pending" || step.status === undefined) && (
                <Clock className="w-5 h-5" />
              )}
            </span>
            <div>
              <h4 className={cn(
                "font-semibold text-sm",
                step.status === "completed" ? "text-green-700 dark:text-green-400" : 
                step.status === "failed" ? "text-rose-700 dark:text-rose-400" : 
                "text-foreground"
              )}>
                {step.title}
              </h4>
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                {step.description}
              </p>
            </div>
          </div>
        </div>

        {/* Duration badge */}
        {step.duration && !step.completed && !isLoading && (
          <Badge
            variant="outline"
            size="sm"
            className="absolute -right-2 -top-2 text-[10px] px-1.5 py-0.5 border-primary/30 bg-primary/5"
          >
            {step.duration}s
          </Badge>
        )}
      </div>
    </div>
  )
}

export function StepProgressBar({ step, currentIndex, total }: { step: StepData; currentIndex: number; total: number }) {
  const progress = ((currentIndex + 1) / total) * 100
  const statusColor = step.status === "completed" ? "text-green-500" : step.status === "failed" ? "text-rose-500" : "text-primary"

  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-2 flex-1">
        <span className={cn(
          "text-sm font-medium",
          step.status === "completed" ? "text-green-600 dark:text-green-400" :
          step.status === "failed" ? "text-rose-600 dark:text-rose-400" :
          "text-muted-foreground"
        )}>
          {step.title}
        </span>
        {step.status && (
          <Badge variant="outline" size="sm" className={cn(step.status === "completed" ? "border-green-500 text-green-600" : step.status === "failed" ? "border-rose-500 text-rose-600" : "border-muted-foreground/50 text-muted-foreground")}>
            {step.status}
          </Badge>
        )}
      </div>
      <Progress
        value={Math.min(progress, 100)}
        className={cn(
          "flex-1 h-2",
          step.status === "completed" ? "bg-green-500 dark:bg-green-500" :
          step.status === "failed" ? "bg-rose-500 dark:bg-rose-500" :
          "bg-muted-foreground/30"
        )}
        indicatorClassName={cn(
          "transition-all duration-500",
          step.status === "completed" ? "bg-green-500 dark:bg-green-500" :
          step.status === "failed" ? "bg-rose-500 dark:bg-rose-500" :
          step.status === "processing" ? "bg-primary dark:bg-primary" :
          "bg-border"
        )}
      />
      {step.status === "processing" && (
        <Loader2 className="w-4 h-4 animate-spin text-primary" />
      )}
    </div>
  )
}