"use client"

import { useEffect, useId, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  MessageSquareText,
  SkipForward,
  Sparkles,
  X,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog"
import { CoachChat } from "@/components/coach-chat"
import { cn } from "@/lib/utils"

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
  /** Total number of requirements in the flow — used for prev/next */
  totalCount?: number
  /** 0-based index of the current requirement */
  currentIndex?: number
  onPrev?: () => void
  onNext?: () => void
}

type RequirementType =
  | "years_experience"
  | "credential"
  | "tool"
  | "domain"
  | "outcome"
  | "responsibility"
  | "skill"
  | "other"

function inferRequirementType(text: string): RequirementType {
  const value = text.toLowerCase()
  if (/(\d+\+?\s*years?|years?\s+of\s+experience|experience\s+in)/.test(value)) return "years_experience"
  if (/(bachelor|master|mba|phd|degree|certified|certification|license|pmp|cka)/.test(value)) return "credential"
  if (/(salesforce|sap|jira|figma|supabase|openai|api|tableau|excel|python|sql)/.test(value)) return "tool"
  if (/(healthcare|finance|enterprise\s+saas|construction|education|government|retail)/.test(value)) return "domain"
  if (/(increase|improve|reduce|delivered|impact|outcome|kpi|adoption|revenue|efficiency)/.test(value)) return "outcome"
  if (/(own|lead|manage|partner|coordinate|launch|roadmap|stakeholder|cross-functional)/.test(value)) return "responsibility"
  if (/(analytical|problem solving|communication|strategy|leadership|skill|ability)/.test(value)) return "skill"
  return "other"
}

function cleanGap(gap: string) {
  return gap.replace(/^Gap:\s*/i, "").trim()
}

function truncateText(value: string, maxLength: number) {
  return value.length > maxLength ? `${value.slice(0, maxLength - 1).trimEnd()}…` : value
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
  totalCount,
  currentIndex,
  onPrev,
  onNext,
}: RequirementCoachModalProps) {
  const [internalOpen, setInternalOpen] = useState(autoOpen && gaps.length > 0)
  const [coachSessionId, setCoachSessionId] = useState<string | null>(null)
  const [sessionLoading, setSessionLoading] = useState(false)
  const [sessionError, setSessionError] = useState(false)
  const [retryCount, setRetryCount] = useState(0)
  const [resumeHint, setResumeHint] = useState<string | null>(null)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const router = useRouter()

  const activeGap = requirement?.requirement_text ?? (gaps[0] ? cleanGap(gaps[0]) : null)
  const isControlled = controlledOpen !== undefined
  const open = controlledOpen ?? internalOpen

  const setOpen = (nextOpen: boolean) => {
    if (!isControlled) setInternalOpen(nextOpen)
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
      requirement?.current_proof?.length
        ? `Possible examples already found: ${requirement.current_proof.join("; ")}.`
        : "No strong example has been found yet.",
      evidenceItems.length
        ? `Background proof HireWire has already indexed: ${evidenceItems.map((item) => item.source_title ?? "Untitled evidence").slice(0, 8).join("; ")}.`
        : "",
      `Requirement type: ${requirementType.replace(/_/g, " ")}. Start with one simple, direct question. Draft a truthful claim from my answer and save it only after I confirm.`,
    ]
      .filter(Boolean)
      .join(" ")
  }, [activeGap, company, evidenceItems, jobTitle, requirement?.current_proof, requirementType])

  const requiresScopedSession = !!(requirement?.requirement_id && activeGap)

  // Reset session when requirement changes
  useEffect(() => {
    setCoachSessionId(null)
    setSessionError(false)
    setSessionLoading(false)
    setResumeHint(null)
    setDetailsOpen(false)
  }, [requirement?.requirement_id])

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
            .find((m) => m?.role === "assistant" && typeof m?.content === "string")
          if (latestAssistant?.content) {
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
    return () => { cancelled = true }
  }, [open, requiresScopedSession, coachSessionId, sessionLoading, jobId, activeGap, requirement?.requirement_id, retryCount])

  if (!activeGap) return null

  const shortTitle = truncateText(activeGap, 72)
  const hasPrev = onPrev && typeof currentIndex === "number" && currentIndex > 0
  const hasNext = onNext && typeof currentIndex === "number" && typeof totalCount === "number" && currentIndex < totalCount - 1

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {!isControlled && requirement && (
        <button
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-primary/90 transition-colors"
          aria-label={`Start Match Interview for ${activeGap}`}
        >
          <MessageSquareText className="h-3.5 w-3.5" />
          Start Match Interview
        </button>
      )}

      <DialogContent
        className="flex flex-col gap-0 overflow-hidden p-0 border-border/60 shadow-2xl"
        style={{
          width: "min(1160px, 92vw)",
          maxWidth: "none",
          height: "88vh",
          maxHeight: "88vh",
          borderRadius: "16px",
        }}
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        {/* ── Header ── */}
        <div className="shrink-0 border-b border-border/60 bg-background">
          {/* Top row: title + progress + nav + close */}
          <div className="flex items-center gap-3 px-5 py-3.5 pr-4">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="h-7 w-7 rounded-lg bg-primary flex items-center justify-center shrink-0">
                <Sparkles className="h-3.5 w-3.5 text-white" />
              </div>
              <span className="text-sm font-semibold text-foreground tracking-tight">
                Match Interview
              </span>
              {progressLabel && (
                <span className="rounded-md border border-primary/20 bg-primary/6 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">
                  {progressLabel}
                </span>
              )}
            </div>

            {/* Prev / Next */}
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
                  <div className="w-px h-4 bg-border mx-1" />
                </>
              )}
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground"
                onClick={() => setOpen(false)}
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Second row: requirement short title + helper */}
          <div className="px-5 pb-3">
            <p className="text-[13px] font-medium text-foreground leading-snug">
              {shortTitle}
            </p>
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              Answer only what you can prove. HireWire will help shape it honestly.
            </p>
          </div>

          {/* Collapsible requirement details */}
          <button
            className="flex w-full items-center gap-1.5 border-t border-border/50 px-5 py-2 text-left hover:bg-muted/40 transition-colors"
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
          </button>

          {detailsOpen && (
            <div className="border-t border-border/40 bg-muted/30 px-5 py-3 space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-primary">
                  {requirementType.replace(/_/g, " ")}
                </span>
                {requirement?.priority && (
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    · {requirement.priority}
                  </span>
                )}
              </div>
              <p className="text-sm text-foreground leading-relaxed">{activeGap}</p>
              {requirement?.proof_needed?.length ? (
                <p className="text-xs text-muted-foreground">{requirement.proof_needed[0]}</p>
              ) : null}
              {requirement?.current_proof?.length ? (
                <div className="rounded-lg bg-background border border-border px-3 py-2">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                    Already found
                  </p>
                  <p className="text-xs text-foreground">{requirement.current_proof.join(", ")}</p>
                </div>
              ) : null}
            </div>
          )}
        </div>

        {/* ── Chat area ── */}
        <div className="flex-1 min-h-0 relative">
          {requiresScopedSession && !coachSessionId ? (
            /* Loading / error state — full area */
            <div className="flex h-full flex-col items-center justify-center gap-4 text-center px-6">
              {sessionLoading ? (
                <>
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Sparkles className="h-5 w-5 text-primary animate-pulse" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">Preparing your match interview…</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Loading context for this requirement
                    </p>
                  </div>
                </>
              ) : sessionError ? (
                <>
                  <p className="text-sm text-muted-foreground">
                    Could not start the session. Check your connection and try again.
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => { setSessionError(false); setRetryCount((c) => c + 1) }}
                  >
                    Retry
                  </Button>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">Starting session…</p>
              )}
            </div>
          ) : (
            <CoachChat
              key={`coach-${coachSessionId ?? "adhoc"}-${requirement?.requirement_id ?? "general"}`}
              className="h-full"
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
                  coach_question:
                    requirement?.coach_question ??
                    `Have you done anything related to ${activeGap}?`,
                },
              }}
              initialMessage={
                resumeHint
                  ? `${initialMessage ?? ""} Resume the prior session. Last coach summary: ${resumeHint}`
                  : initialMessage
              }
            />
          )}
        </div>

        {/* ── Footer nav strip (Skip + Next) ── */}
        {(hasNext || onNext) && (
          <div className="shrink-0 border-t border-border/50 bg-background/80 backdrop-blur-sm px-5 py-2.5 flex items-center justify-between">
            <Button
              size="sm"
              variant="ghost"
              className="text-xs text-muted-foreground hover:text-foreground gap-1.5"
              onClick={() => {
                onStepSaved?.("skip")
                onNext?.()
              }}
            >
              <SkipForward className="h-3.5 w-3.5" />
              Skip this requirement
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="text-xs gap-1.5"
              disabled={!hasNext}
              onClick={onNext}
            >
              Next requirement
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

export const GapCoachDrawer = RequirementCoachModal
