"use client"

import { useEffect, useState } from "react"
import { ArrowLeft, ArrowRight, CheckCircle2, ListChecks, Sparkles, SkipForward } from "lucide-react"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useIsMobile } from "@/hooks/use-mobile"
import { ClarityCoachPanel } from "./ClarityCoachPanel"
import type { ClarityRequirement } from "@/lib/clarity/getUnresolvedRequirements"

type Phase = "coaching" | "resolved" | "done"

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

/**
 * ClarityDrawer — Phase 3 clarity surface that lives on /jobs/[id] (no new
 * route). Right-side drawer on desktop, bottom sheet on mobile.
 *
 * Behavior is intentionally a calm coach, not a wizard:
 *   - Opens straight into a coach conversation for the first unresolved item.
 *   - After confirm/skip it does NOT auto-advance. It shows what changed and
 *     offers "Next unresolved item" and "Back to job" — the user decides.
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
  const [phase, setPhase] = useState<Phase>("coaching")
  const [lastAction, setLastAction] = useState<"answer" | "skip" | null>(null)

  const total = requirements.length
  const current = requirements[index]

  // Reset to a clean state every time the drawer opens.
  useEffect(() => {
    if (!open) return
    setIndex(0)
    setLastAction(null)
    setPhase(total === 0 ? "done" : "coaching")
  }, [open, total])

  const handleResolved = (mode: "answer" | "skip") => {
    setLastAction(mode)
    setPhase("resolved")
  }

  const handleNext = () => {
    const next = index + 1
    if (next < total) {
      setIndex(next)
      setLastAction(null)
      setPhase("coaching")
    } else {
      setPhase("done")
    }
  }

  const handleBackToJob = () => onOpenChange(false)

  const hasMore = index + 1 < total
  const reviewedCount = phase === "done" ? total : index + (phase === "resolved" ? 1 : 0)

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
                {phase === "done" ? `${total} of ${total}` : `${index + 1} of ${total}`}
              </span>
            )}
          </div>
          <p className="mt-1 truncate text-xs text-muted-foreground">
            {jobTitle}
            {company ? ` · ${company}` : ""}
          </p>
        </div>

        {/* Body */}
        {phase === "coaching" && current && (
          <>
            <div className="shrink-0 border-b border-border/40 bg-muted/30 px-5 py-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Missing proof
              </p>
              <p className="mt-0.5 text-[13px] font-medium leading-snug text-foreground">
                {current.requirement_text}
              </p>
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

function ResolvedState({
  mode,
  hasMore,
  onNext,
  onBackToJob,
}: {
  mode: "answer" | "skip" | null
  hasMore: boolean
  onNext: () => void
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
        {hasMore ? (
          <div className="flex flex-col gap-2">
            <Button onClick={onNext} className="hw-btn-primary w-full gap-1.5">
              Next unresolved item <ArrowRight className="h-4 w-4" />
            </Button>
            <Button onClick={onBackToJob} variant="ghost" className="w-full gap-1.5 text-muted-foreground">
              <ArrowLeft className="h-4 w-4" /> Back to job
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <Button onClick={onNext} className="hw-btn-primary w-full gap-1.5">
              See summary <ArrowRight className="h-4 w-4" />
            </Button>
            <Button onClick={onBackToJob} variant="ghost" className="w-full gap-1.5 text-muted-foreground">
              <ArrowLeft className="h-4 w-4" /> Back to job
            </Button>
          </div>
        )}
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
