"use client"

import { ShieldCheck } from "lucide-react"
import { cn } from "@/lib/utils"
import { ConfidenceBadge } from "./ConfidenceBadge"
import type { ConfidenceLevel } from "./types"

export function EvidenceSummaryCard({
  summary,
  confidence,
  gapNotes,
  onConfirm,
  onSkip,
  isSaving = false,
  className,
}: {
  summary: string
  confidence: ConfidenceLevel
  gapNotes?: string
  onConfirm: () => void
  onSkip: () => void
  isSaving?: boolean
  className?: string
}) {
  return (
    <div
      className={cn(
        "ml-9 rounded-xl border border-border bg-card shadow-sm overflow-hidden",
        className,
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-border/60 bg-muted/30 px-4 py-2.5">
        <ShieldCheck className="h-4 w-4 text-primary shrink-0" />
        <p className="text-[11px] font-bold uppercase tracking-wider text-foreground">
          Proof summary
        </p>
        <div className="ml-auto">
          <ConfidenceBadge level={confidence} />
        </div>
      </div>

      {/* Summary */}
      <div className="px-4 py-3">
        <p className="text-sm text-foreground leading-relaxed">{summary}</p>
        {gapNotes && (
          <p className="mt-2 text-xs text-muted-foreground leading-relaxed border-t border-border/40 pt-2">
            {gapNotes}
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 border-t border-border/60 bg-muted/20 px-4 py-2.5">
        <button
          onClick={onConfirm}
          disabled={isSaving}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm",
            "hover:bg-primary/90 transition-colors",
            "disabled:pointer-events-none disabled:opacity-50",
          )}
        >
          {isSaving ? "Saving…" : "Confirm proof"}
        </button>
        <button
          onClick={onSkip}
          disabled={isSaving}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3.5 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors disabled:pointer-events-none disabled:opacity-40"
        >
          Skip this claim
        </button>
        <p className="ml-auto text-[10px] text-muted-foreground">
          HireWire saves only what you confirm
        </p>
      </div>
    </div>
  )
}
