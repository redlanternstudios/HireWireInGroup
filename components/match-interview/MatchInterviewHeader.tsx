"use client"

import { useState } from "react"
import { ChevronDown, ChevronLeft, ChevronRight, Sparkles, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { REQUIREMENT_TYPE_LABELS, type InterviewRequirement, type RequirementType } from "./types"

export function MatchInterviewHeader({
  requirement,
  requirementType,
  currentIndex,
  totalCount,
  onPrev,
  onNext,
  onClose,
}: {
  requirement: InterviewRequirement
  requirementType: RequirementType
  currentIndex: number
  totalCount: number
  onPrev?: () => void
  onNext?: () => void
  onClose: () => void
}) {
  const [detailsOpen, setDetailsOpen] = useState(false)
  const hasPrev = !!onPrev && currentIndex > 0
  const hasNext = !!onNext && currentIndex < totalCount - 1

  const shortTitle =
    requirement.requirement_text.length > 80
      ? `${requirement.requirement_text.slice(0, 79).trimEnd()}…`
      : requirement.requirement_text

  return (
    <div className="shrink-0 border-b border-border/60 bg-background">
      {/* Row 1: Branding + progress + nav + close */}
      <div className="flex items-center gap-3 px-5 py-3 pr-3">
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary shadow-sm">
            <Sparkles className="h-3.5 w-3.5 text-white" />
          </div>
          <span className="text-sm font-semibold tracking-tight text-foreground">
            Match Interview
          </span>
          {totalCount > 0 && (
            <span className="rounded-md border border-primary/20 bg-primary/6 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">
              {currentIndex + 1} of {totalCount}
            </span>
          )}
        </div>

        <div className="ml-auto flex items-center gap-1">
          {(hasPrev || hasNext) && (
            <>
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground disabled:opacity-30"
                disabled={!hasPrev}
                onClick={onPrev}
                aria-label="Previous requirement"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground disabled:opacity-30"
                disabled={!hasNext}
                onClick={onNext}
                aria-label="Next requirement"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <div className="mx-1 h-4 w-px bg-border" />
            </>
          )}
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground"
            onClick={onClose}
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Row 2: Requirement summary line */}
      <div className="px-5 pb-2.5">
        <p className="text-[13px] font-medium leading-snug text-foreground">
          {shortTitle}
        </p>
        <p className="mt-0.5 text-[11px] text-muted-foreground">
          Answer only what you can prove. HireWire will help shape it honestly.
        </p>
      </div>

      {/* Row 3: Collapsible details toggle */}
      <button
        className="flex w-full items-center gap-1.5 border-t border-border/40 px-5 py-2 text-left transition-colors hover:bg-muted/40"
        onClick={() => setDetailsOpen((v) => !v)}
        aria-expanded={detailsOpen}
      >
        <ChevronDown
          className={cn(
            "h-3.5 w-3.5 text-muted-foreground transition-transform duration-150",
            detailsOpen && "rotate-180",
          )}
        />
        <span className="text-[11px] font-medium text-muted-foreground">
          View requirement details
        </span>
        <span className="ml-2 rounded-md border border-border bg-muted/50 px-2 py-0.5 text-[10px] text-muted-foreground">
          {REQUIREMENT_TYPE_LABELS[requirementType]}
        </span>
      </button>

      {/* Collapsible body */}
      {detailsOpen && (
        <div className="border-t border-border/40 bg-muted/30 px-5 py-3 space-y-2.5">
          <p className="text-sm text-foreground leading-relaxed">
            {requirement.requirement_text}
          </p>

          {requirement.proof_needed?.length ? (
            <p className="text-xs text-muted-foreground">
              {requirement.proof_needed[0]}
            </p>
          ) : null}

          {requirement.current_proof?.length ? (
            <div className="rounded-lg border border-border bg-background px-3 py-2">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                Already found
              </p>
              <p className="text-xs text-foreground">
                {requirement.current_proof.join(", ")}
              </p>
            </div>
          ) : null}
        </div>
      )}
    </div>
  )
}
