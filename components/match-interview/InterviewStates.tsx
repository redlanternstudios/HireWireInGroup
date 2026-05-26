"use client"

import { ChevronRight, SkipForward, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"

/** Bottom strip shown when there is a next requirement to navigate to */
export function InterviewActionBar({
  onSkip,
  onNext,
  hasNext,
  disabled = false,
  className,
}: {
  onSkip: () => void
  onNext: () => void
  hasNext: boolean
  disabled?: boolean
  className?: string
}) {
  return (
    <div
      className={cn(
        "shrink-0 flex items-center justify-between border-t border-border/50 bg-background/90 backdrop-blur-sm px-5 py-2.5",
        className,
      )}
    >
      <button
        onClick={onSkip}
        disabled={disabled}
        className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-40"
      >
        <SkipForward className="h-3.5 w-3.5" />
        Skip this claim
      </button>
      <button
        onClick={onNext}
        disabled={!hasNext || disabled}
        className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3.5 py-1.5 text-xs font-semibold text-foreground shadow-sm transition-colors hover:bg-muted disabled:pointer-events-none disabled:opacity-40"
      >
        Next requirement
        <ChevronRight className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}

/** Full-area loading state */
export function InterviewLoadingState({ message }: { message?: string }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 px-6 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
        <Sparkles className="h-6 w-6 animate-pulse text-primary" />
      </div>
      <div>
        <p className="text-sm font-medium text-foreground">
          {message ?? "Preparing your match interview…"}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Loading context for this requirement
        </p>
      </div>
    </div>
  )
}

/** Full-area error state */
export function InterviewErrorState({
  message,
  onRetry,
}: {
  message?: string
  onRetry: () => void
}) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 px-6 text-center">
      <p className="text-sm text-muted-foreground">
        {message ?? "Could not start the session. Check your connection and try again."}
      </p>
      <button
        onClick={onRetry}
        className="rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground shadow-sm hover:bg-muted transition-colors"
      >
        Retry
      </button>
    </div>
  )
}
