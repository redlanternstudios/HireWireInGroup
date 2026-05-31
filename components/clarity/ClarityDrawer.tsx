"use client"

import { useEffect, useMemo, useState } from "react"
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  ListChecks,
  Sparkles,
  SkipForward,
} from "lucide-react"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useIsMobile } from "@/hooks/use-mobile"
import { ClarityCoachPanel } from "./ClarityCoachPanel"
import type { ClarityRequirement } from "@/lib/clarity/getUnresolvedRequirements"

type Phase = "overview" | "coaching" | "resolved" | "done"

export interface ClarityDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  jobId: string
  jobTitle: string
  company: string
  /**
   * Snapshot of unresolved requirements taken when the drawer opened. The
   * drawer walks this list by index; "Next unresolved item" advances manually.
   */
  requirements: ClarityRequirement[]
}

/** Priority ordering for the scannable overview — required gaps first. */
const PRIORITY_RANK: Record<string, number> = {
  required: 0,
  preferred: 1,
  keyword: 2,
}

function priorityMeta(priority?: string): { label: string; className: string } {
  switch (priority) {
    case "required":
      return { label: "Required", className: "border-primary/20 bg-primary/10 text-primary" }
    case "preferred":
      return { label: "Preferred", className: "border-amber-200 bg-amber-50 text-amber-700" }
    case "keyword":
      return { label: "Keyword", className: "border-border bg-muted text-muted-foreground" }
    default:
      return { label: "Requirement", className: "border-border bg-muted text-muted-foreground" }
  }
}

/** Human, non-database phrasing for why a requirement is still unproven. */
function missingProofReason(status?: string): string {
  switch (status) {
    case "partial":
      return "Needs stronger proof"
    case "unknown":
      return "Needs review"
    case "gap":
    default:
      return "No proof yet"
  }
}

/**
 * ClarityDrawer — Phase 3 clarity surface that lives on /jobs/[id] (no new
 * route). Right-side drawer on desktop, bottom sheet on mobile.
 *
 * Behavior is intentionally a calm coach, not a wizard:
 *   - Opens on a scannable overview of every unresolved requirement, sorted by
 *     priority, so the user sees the whole picture before diving in.
 *   - From there the user picks an item (or starts with the first) and enters a
 *     coach conversation. After confirm/skip it does NOT auto-advance — it shows
 *     what changed and offers "Next unresolved item" / "Back to job".
 *   - When nothing is left, it shows "All gaps reviewed".
 */
export function ClarityDrawer({
  open,
  onOpenChange,
  jobId,
  jobTitle,
  company,
  requirements,
}: ClarityDrawerProps) {
  const isMobile = useIsMobile()
  const [index, setIndex] = useState(0)
  const [phase, setPhase] = useState<Phase>("overview")
  const [lastAction, setLastAction] = useState<"answer" | "skip" | null>(null)
  const [resolvedIds, setResolvedIds] = useState<Set<string>>(new Set())

  // Stable, priority-sorted list the drawer walks. Sorting once keeps index
  // navigation and the overview list in agreement.
  const ordered = useMemo(() => {
    return [...requirements].sort(
      (a, b) =>
        (PRIORITY_RANK[a.priority ?? ""] ?? 3) - (PRIORITY_RANK[b.priority ?? ""] ?? 3),
    )
  }, [requirements])

  const total = ordered.length
  const current = ordered[index]

  // Reset to a clean state every time the drawer opens.
  useEffect(() => {
    if (!open) return
    setIndex(0)
    setLastAction(null)
    setResolvedIds(new Set())
    setPhase(total === 0 ? "done" : "overview")
  }, [open, total])

  const handleStart = (idx: number) => {
    setIndex(idx)
    setLastAction(null)
    setPhase("coaching")
  }

  const handleResolved = (mode: "answer" | "skip") => {
    setLastAction(mode)
    if (current) {
      setResolvedIds((prev) => new Set(prev).add(current.requirement_id))
    }
    setPhase("resolved")
  }

  // Advance to the next still-unresolved item (skipping ones handled this session).
  const handleNext = () => {
    const nextUnresolved = ordered.findIndex(
      (req, i) => i > index && !resolvedIds.has(req.requirement_id),
    )
    if (nextUnresolved !== -1) {
      setIndex(nextUnresolved)
      setLastAction(null)
      setPhase("coaching")
    } else if (resolvedIds.size >= total) {
      setPhase("done")
    } else {
      setPhase("overview")
    }
  }

  const handleViewAll = () => {
    setLastAction(null)
    setPhase("overview")
  }

  const handleBackToJob = () => onOpenChange(false)

  const remaining = ordered.filter((req) => !resolvedIds.has(req.requirement_id))
  const hasMore = remaining.length > 0
  const reviewedCount = resolvedIds.size

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side={isMobile ? "bottom" : "right"}
        className={cn(
          "flex flex-col gap-0 border-border/60 p-0",
          isMobile
            ? "h-[92vh] rounded-t-2xl"
            : "h-full w-full sm:max-w-md md:max-w-xl lg:max-w-2xl",
        )}
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        {/* Header */}
        <div className="shrink-0 border-b border-border/60 bg-background px-5 py-3 pr-12">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary shadow-sm">
              <Sparkles className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="text-sm font-semibold tracking-tight text-foreground">Prove your fit</span>
            {total > 0 && (
              <span className="rounded-md border border-primary/20 bg-primary/5 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">
                {phase === "overview"
                  ? `${total} ${total === 1 ? "gap" : "gaps"}`
                  : phase === "done"
                    ? `${total} of ${total}`
                    : `${index + 1} of ${total}`}
              </span>
            )}
          </div>
          <p className="mt-1 truncate text-xs text-muted-foreground">
            {jobTitle}
            {company ? ` · ${company}` : ""}
          </p>
        </div>

        {/* Body */}
        {phase === "overview" && total > 0 && (
          <OverviewState requirements={ordered} resolvedIds={resolvedIds} onStart={handleStart} />
        )}

        {phase === "coaching" && current && (
          <>
            <div className="flex shrink-0 items-center justify-between gap-2 border-b border-border/40 bg-muted/30 px-5 py-3">
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  {missingProofReason(current.status)}
                </p>
                <p className="mt-0.5 text-[13px] font-medium leading-snug text-foreground">
                  {current.requirement_text}
                </p>
              </div>
              {total > 1 && (
                <button
                  type="button"
                  onClick={handleViewAll}
                  className="shrink-0 rounded-md px-2 py-1 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  All gaps
                </button>
              )}
            </div>
            <ClarityCoachPanel
              key={current.requirement_id}
              jobId={jobId}
              requirement={current}
              onResolved={handleResolved}
            />
          </>
        )}

        {phase === "resolved" && (
          <ResolvedState
            mode={lastAction}
            hasMore={hasMore}
            onNext={handleNext}
            onViewAll={handleViewAll}
            onBackToJob={handleBackToJob}
          />
        )}

        {phase === "done" && (
          <DoneState reviewedCount={reviewedCount} onReturn={handleBackToJob} />
        )}
      </SheetContent>
    </Sheet>
  )
}

function OverviewState({
  requirements,
  resolvedIds,
  onStart,
}: {
  requirements: ClarityRequirement[]
  resolvedIds: Set<string>
  onStart: (idx: number) => void
}) {
  const firstUnresolved = requirements.findIndex((req) => !resolvedIds.has(req.requirement_id))

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="shrink-0 px-5 pb-1 pt-4">
        <p className="text-sm font-semibold text-foreground text-balance">
          {"Let's prove the claims HireWire can't verify yet"}
        </p>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
          {
            "I'll walk through these one at a time and ask a focused question. Confirm what you can show, skip what you can't — you decide the pace."
          }
        </p>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3">
        <ul className="flex flex-col gap-2">
          {requirements.map((req, idx) => {
            const resolved = resolvedIds.has(req.requirement_id)
            const meta = priorityMeta(req.priority)
            const isFirst = idx === firstUnresolved
            return (
              <li key={req.requirement_id}>
                <button
                  type="button"
                  onClick={() => onStart(idx)}
                  disabled={resolved}
                  className={cn(
                    "group flex w-full items-start gap-3 rounded-xl border px-3 py-3 text-left transition-colors",
                    resolved
                      ? "border-border/50 bg-muted/40 opacity-70"
                      : isFirst
                        ? "border-primary/30 bg-primary/[0.04] hover:bg-primary/[0.07]"
                        : "border-border/60 bg-background hover:bg-muted/50",
                  )}
                >
                  <div className="mt-0.5 shrink-0">
                    {resolved ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    ) : (
                      <span
                        className={cn(
                          "flex h-4 w-4 items-center justify-center rounded-full border text-[9px] font-bold",
                          isFirst
                            ? "border-primary/40 bg-primary/10 text-primary"
                            : "border-border bg-muted text-muted-foreground",
                        )}
                      >
                        {idx + 1}
                      </span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span
                        className={cn(
                          "rounded border px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider",
                          meta.className,
                        )}
                      >
                        {meta.label}
                      </span>
                      <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                        {resolved ? "Reviewed" : missingProofReason(req.status)}
                      </span>
                    </div>
                    <p
                      className={cn(
                        "mt-1 text-[13px] font-medium leading-snug",
                        resolved ? "text-muted-foreground line-through" : "text-foreground",
                      )}
                    >
                      {req.requirement_text}
                    </p>
                  </div>
                  {!resolved && (
                    <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground/50 transition-transform group-hover:translate-x-0.5" />
                  )}
                </button>
              </li>
            )
          })}
        </ul>
      </div>

      <div className="shrink-0 border-t border-border/60 bg-background px-5 py-4">
        {firstUnresolved !== -1 ? (
          <Button onClick={() => onStart(firstUnresolved)} className="hw-btn-primary w-full gap-1.5">
            <Sparkles className="h-4 w-4" />
            {`Start with ${priorityMeta(requirements[firstUnresolved].priority).label.toLowerCase()} gap`}
          </Button>
        ) : (
          <p className="text-center text-xs text-muted-foreground">All gaps reviewed in this session.</p>
        )}
      </div>
    </div>
  )
}

function ResolvedState({
  mode,
  hasMore,
  onNext,
  onViewAll,
  onBackToJob,
}: {
  mode: "answer" | "skip" | null
  hasMore: boolean
  onNext: () => void
  onViewAll: () => void
  onBackToJob: () => void
}) {
  const saved = mode === "answer"
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
        <div
          className={cn(
            "flex h-12 w-12 items-center justify-center rounded-full",
            saved ? "bg-emerald-50" : "bg-muted",
          )}
        >
          {saved ? (
            <CheckCircle2 className="h-6 w-6 text-emerald-600" />
          ) : (
            <SkipForward className="h-6 w-6 text-muted-foreground" />
          )}
        </div>
        <div className="max-w-xs">
          <p className="text-sm font-semibold text-foreground">
            {saved ? "Saved as evidence" : "Skipped for now"}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {saved
              ? "This proof strengthens your readiness for this role."
              : "This item will stay in missing proof — you can come back to it anytime."}
          </p>
        </div>
      </div>

      {/* Manual next — the user decides when to continue. */}
      <div className="shrink-0 border-t border-border/60 bg-background px-5 py-4">
        <div className="flex flex-col gap-2">
          {hasMore ? (
            <Button onClick={onNext} className="hw-btn-primary w-full gap-1.5">
              Next unresolved item <ArrowRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={onNext} className="hw-btn-primary w-full gap-1.5">
              See summary <ArrowRight className="h-4 w-4" />
            </Button>
          )}
          <div className="flex gap-2">
            <Button onClick={onViewAll} variant="outline" className="flex-1 gap-1.5">
              <ListChecks className="h-4 w-4" /> All gaps
            </Button>
            <Button onClick={onBackToJob} variant="ghost" className="flex-1 gap-1.5 text-muted-foreground">
              <ArrowLeft className="h-4 w-4" /> Back to job
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

function DoneState({ reviewedCount, onReturn }: { reviewedCount: number; onReturn: () => void }) {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50">
          <ListChecks className="h-6 w-6 text-emerald-600" />
        </div>
        <div className="max-w-xs">
          <p className="text-sm font-semibold text-foreground">All gaps reviewed</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {reviewedCount > 0
              ? `You've worked through ${reviewedCount} ${reviewedCount === 1 ? "requirement" : "requirements"}. Your readiness reflects these decisions.`
              : "There's nothing left to prove right now."}
          </p>
        </div>
      </div>
      <div className="shrink-0 border-t border-border/60 bg-background px-5 py-4">
        <Button onClick={onReturn} className="hw-btn-primary w-full gap-1.5">
          Return to job detail <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
