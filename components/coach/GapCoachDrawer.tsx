"use client"

import { useEffect, useMemo, useState } from "react"
import { Sparkles, MessageSquareText } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { CoachChat } from "@/components/coach-chat"
import { type RequirementType, inferRequirementType } from "@/lib/coach/requirement-type"

export type RequirementCoachModalProps = {
  jobId: string
  jobTitle: string
  company: string
  score?: number | null
  status?: string
  gaps: string[]
  requirement?: {
    requirement_id: string
    requirement_text: string
    requirement_type?: RequirementType
    priority?: string
    status?: string
    current_proof?: string[]
    proof_needed?: string[]
    coach_question?: string
  }
  evidenceItems?: {
    id: string
    source_title: string | null
    source_type: string | null
  }[]
  autoOpen?: boolean
  open?: boolean
  onOpenChange?: (open: boolean) => void
  onStepSaved?: (mode: "answer" | "skip") => void
  progressLabel?: string
  showGenerationUnlock?: boolean
}

function cleanGap(gap: string) {
  return gap.replace(/^Gap:\s*/i, "").trim()
}

function truncateText(value: string, maxLength: number) {
  return value.length > maxLength ? `${value.slice(0, maxLength - 1).trimEnd()}...` : value
}

export function RequirementCoachModal({
  jobId,
  jobTitle,
  company,
  score,
  status,
  gaps,
  requirement,
  evidenceItems = [],
  autoOpen = false,
  open: controlledOpen,
  onOpenChange,
  onStepSaved,
  progressLabel,
  showGenerationUnlock = false,
}: RequirementCoachModalProps) {
  const [internalOpen, setInternalOpen] = useState(autoOpen && gaps.length > 0)
  const [coachSessionId, setCoachSessionId] = useState<string | null>(null)
  const [sessionLoading, setSessionLoading] = useState(false)
  const [sessionError, setSessionError] = useState(false)
  const [retryCount, setRetryCount] = useState(0)
  const [resumeHint, setResumeHint] = useState<string | null>(null)
  const activeGap = requirement?.requirement_text ?? (gaps[0] ? cleanGap(gaps[0]) : null)
  const isControlled = controlledOpen !== undefined
  const open = controlledOpen ?? internalOpen
  const setOpen = (nextOpen: boolean) => {
    if (!isControlled) {
      setInternalOpen(nextOpen)
    }
    onOpenChange?.(nextOpen)
  }
  const requirementType = useMemo<RequirementType>(() => {
    if (!activeGap) return "other"
    return requirement?.requirement_type ?? inferRequirementType(activeGap)
  }, [activeGap, requirement?.requirement_type])

  const initialMessage = useMemo(() => {
    if (!activeGap) return undefined
    return [
      `Help me find a real example for ${jobTitle} at ${company}: "${activeGap}".`,
      requirement?.current_proof?.length ? `Possible examples already found: ${requirement.current_proof.join("; ")}.` : "No strong example has been found yet.",
      evidenceItems.length ? `Background proof HireWire has already indexed: ${evidenceItems.map((item) => item.source_title ?? "Untitled evidence").slice(0, 8).join("; ")}.` : "",
      `Requirement type: ${requirementType.replace(/_/g, " ")}. Start with one simple question. Draft a truthful claim from my answer and save it only after I confirm.`,
    ].join(" ")
  }, [activeGap, company, evidenceItems, jobTitle, requirement?.current_proof, requirementType])

  const requiresScopedSession = !!(requirement?.requirement_id && activeGap)

  useEffect(() => {
    if (!open || !requiresScopedSession || coachSessionId || sessionLoading) return

    let cancelled = false

    async function resumeOrCreateSession() {
      setSessionLoading(true)
      setSessionError(false)
      try {
        const response = await fetch("/api/coach/sessions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            jobId,
            gapRequirement: activeGap,
            gapRequirementId: requirement?.requirement_id,
          }),
        })
        const data = await response.json().catch(() => ({}))
        if (cancelled) return
        if (!response.ok || !data?.sessionId) {
          setSessionError(true)
          return
        }

        setCoachSessionId(data.sessionId)

        if (data?.isNew === false && Array.isArray(data.messages)) {
          const latestAssistant = [...data.messages]
            .reverse()
            .find((message) => message?.role === "assistant" && typeof message?.content === "string")

          if (latestAssistant?.content && latestAssistant.content.trim().length > 0) {
            setResumeHint(latestAssistant.content.slice(0, 220))
          }
        }
      } catch {
        if (!cancelled) setSessionError(true)
      } finally {
        if (!cancelled) setSessionLoading(false)
      }
    }

    void resumeOrCreateSession()

    return () => {
      cancelled = true
    }
  }, [
    open,
    requiresScopedSession,
    coachSessionId,
    sessionLoading,
    jobId,
    activeGap,
    requirement?.requirement_id,
    retryCount,
  ])

  if (!activeGap) return null

  const loadingRequirement = activeGap ? truncateText(activeGap, 60) : "this claim"

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {!isControlled && requirement ? (
        <DialogTrigger asChild>
          <Button
            size="sm"
            className="hw-btn-primary gap-1.5 text-xs shrink-0"
            aria-label={`Start Match Interview for ${activeGap}`}
          >
            <MessageSquareText className="h-3.5 w-3.5" />
            Start Match Interview
          </Button>
        </DialogTrigger>
      ) : !isControlled ? (
        <div className="hw-card px-5 py-4 border-l-4 border-l-primary">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary shrink-0" />
                <h2 className="text-sm font-semibold text-foreground">Match Interview</h2>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                I&apos;ll ask only about what HireWire can&apos;t verify yet.
              </p>
            </div>
            <DialogTrigger asChild>
              <Button
                size="sm"
                className="hw-btn-primary gap-1.5 text-xs shrink-0"
                aria-label="Start Match Interview"
              >
                <MessageSquareText className="h-3.5 w-3.5" />
                Start Match Interview
              </Button>
            </DialogTrigger>
          </div>
        </div>
      ) : null}

      <DialogContent
        className="flex max-h-[92vh] w-[min(980px,calc(100vw-2rem))] max-w-none flex-col gap-0 overflow-hidden p-0"
        onOpenAutoFocus={(event) => {
          event.preventDefault()
        }}
      >
        <DialogHeader className="border-b border-border px-5 py-4 pr-10">
          <DialogTitle className="text-base">
            Match Interview
            {progressLabel ? (
              <span
                className="ml-2 rounded border border-primary/20 bg-primary/5 px-2 py-0.5 text-[10px] font-semibold uppercase text-primary"
                aria-label={`Requirement ${progressLabel}`}
              >
                {progressLabel}
              </span>
            ) : null}
          </DialogTitle>
          <DialogDescription>
            Confirm proof or skip claims you won&apos;t make. Your answers unlock document generation.
            {showGenerationUnlock ? (
              <span className="mt-1 block">Skipping is okay; HireWire will stay honest about weaker areas.</span>
            ) : null}
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-hidden">
          {requiresScopedSession && !coachSessionId ? (
            <div
              className="flex min-h-[420px] flex-col items-center justify-center gap-3 px-6 text-center"
              aria-live="polite"
            >
              {sessionLoading ? (
                <p className="max-w-sm text-sm text-muted-foreground">
                  Preparing your session for: {loadingRequirement}
                </p>
              ) : sessionError ? (
                <>
                  <p className="text-sm text-muted-foreground">Could not start the session. Check your connection and try again.</p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => { setSessionError(false); setRetryCount((c) => c + 1) }}
                  >
                    Retry
                  </Button>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">Starting session...</p>
              )}
            </div>
          ) : (
            <CoachChat
              key={`coach-${coachSessionId ?? "adhoc"}`}
              compact
              className="min-h-[420px] h-full"
              sessionId={coachSessionId ?? undefined}
              jobContext={{
                jobId,
                title: jobTitle,
                company,
                score,
                status,
              }}
              gapContext={{
                jobTitle,
                company,
                gap: {
                  requirement_id: requirement?.requirement_id,
                  requirement: activeGap,
                  category: requirementType,
                  coach_question: requirement?.coach_question ?? `Have you done anything related to ${activeGap}?`,
                },
              }}
              initialMessage={
                resumeHint && resumeHint.trim().length > 0
                  ? `${initialMessage ?? ""} Resume the prior session. Last coach summary: ${resumeHint}`
                  : initialMessage
              }
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

export const GapCoachDrawer = RequirementCoachModal
