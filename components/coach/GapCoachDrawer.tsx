"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { MessageSquareText, Sparkles } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { CoachChat } from "@/components/coach-chat"

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
  if (/(\d+\+?\s*years?|years?\s+of\s+experience|experience\s+in)/.test(value)) {
    return "years_experience"
  }
  if (/(bachelor|master|mba|phd|degree|certified|certification|license|pmp|cka)/.test(value)) {
    return "credential"
  }
  if (/(salesforce|sap|jira|figma|supabase|openai|api|tableau|excel|python|sql)/.test(value)) {
    return "tool"
  }
  if (/(healthcare|finance|enterprise\s+saas|construction|education|government|retail)/.test(value)) {
    return "domain"
  }
  if (/(increase|improve|reduce|delivered|impact|outcome|kpi|adoption|revenue|efficiency)/.test(value)) {
    return "outcome"
  }
  if (/(own|lead|manage|partner|coordinate|launch|roadmap|stakeholder|cross-functional)/.test(value)) {
    return "responsibility"
  }
  if (/(analytical|problem solving|communication|strategy|leadership|skill|ability)/.test(value)) {
    return "skill"
  }
  return "other"
}

function cleanGap(gap: string) {
  return gap.replace(/^Gap:\s*/i, "").trim()
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
  const [answer, setAnswer] = useState("")
  const [saving, setSaving] = useState<"answer" | "skip" | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [coachingNudge, setCoachingNudge] = useState<string | null>(null)
  const [canForceSave, setCanForceSave] = useState(false)
  const [coachSessionId, setCoachSessionId] = useState<string | null>(null)
  const [sessionLoading, setSessionLoading] = useState(false)
  const [resumeHint, setResumeHint] = useState<string | null>(null)
  const [savedState, setSavedState] = useState<{ mode: "answer" | "skip"; allDone: boolean } | null>(null)
  const router = useRouter()
  const activeGap = requirement?.requirement_text ?? (gaps[0] ? cleanGap(gaps[0]) : null)
  const open = controlledOpen ?? internalOpen
  const setOpen = (nextOpen: boolean) => {
    if (controlledOpen === undefined) {
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
        if (cancelled || !response.ok || !data?.sessionId) return

        setCoachSessionId(data.sessionId)

        if (data?.isNew === false && Array.isArray(data.messages)) {
          const latestAssistant = [...data.messages]
            .reverse()
            .find((message) => message?.role === "assistant" && typeof message?.content === "string")

          if (latestAssistant?.content) {
            setResumeHint(latestAssistant.content.slice(0, 220))
          }
        }
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
  ])

  if (!activeGap) return null

  async function postCoachStep(body: Record<string, unknown>, mode: "answer" | "skip") {
    setSaving(mode)
    setError(null)
    setCoachingNudge(null)
    try {
      const response = await fetch(`/api/jobs/${jobId}/coach-step`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      const data = await response.json()
      if (!response.ok || !data.success) {
        if (response.status === 422 && data.error === "answer_needs_detail") {
          setCoachingNudge(data.user_message ?? "Add more detail before saving.")
          setCanForceSave(!!data.can_force_save)
          return
        }
        if (response.status === 409 || data.error === "evidence_map_conflict") {
          setError(
            data.user_message ??
              "This requirement was updated in another tab. The page has been refreshed with the latest state. Try again.",
          )
          router.refresh()
          return
        }
        setError(data.user_message ?? "Could not save the coach step. Please try again.")
        return
      }
      setAnswer("")
      setCoachingNudge(null)
      setCanForceSave(false)
      const allDone = data?.allGapsResolved === true || showGenerationUnlock
      setSavedState({ mode, allDone })
      onStepSaved?.(mode)
      // Refresh server data but stay open to show progression
      router.refresh()
    } catch {
      setError("Network error. Please try again.")
    } finally {
      setSaving(null)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {requirement ? (
        <DialogTrigger asChild>
          <Button size="sm" className="hw-btn-primary gap-1.5 text-xs shrink-0">
            <MessageSquareText className="h-3.5 w-3.5" />
            Open interview
          </Button>
        </DialogTrigger>
      ) : (
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
              <Button size="sm" className="hw-btn-primary gap-1.5 text-xs shrink-0">
                <MessageSquareText className="h-3.5 w-3.5" />
                Start interview
              </Button>
            </DialogTrigger>
          </div>
        </div>
      )}

      <DialogContent className="flex max-h-[92vh] w-[min(980px,calc(100vw-2rem))] max-w-none flex-col gap-0 overflow-hidden p-0">
        <DialogHeader className="border-b border-border px-5 py-4 pr-10">
          <DialogTitle className="text-base">
            Match Interview
            {progressLabel ? (
              <span className="ml-2 rounded border border-primary/20 bg-primary/5 px-2 py-0.5 text-[10px] font-semibold uppercase text-primary">
                {progressLabel}
              </span>
            ) : null}
          </DialogTitle>
          <DialogDescription>
            Answer one focused question. Review the claim before HireWire uses it.
            {showGenerationUnlock ? (
              <span className="mt-1 block">Skipping is okay; HireWire will stay honest about weaker areas.</span>
            ) : null}
          </DialogDescription>
        </DialogHeader>
        {/* Post-save progression state */}
        {savedState && (
          <div className="flex flex-col items-center justify-center gap-5 px-8 py-12 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
              <Sparkles className="h-6 w-6" />
            </div>
            <div>
              <p className="text-base font-semibold text-foreground">
                {savedState.mode === "skip"
                  ? "Skipped. HireWire will stay conservative here."
                  : "Confirmed."}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {savedState.allDone
                  ? "You can now generate materials from confirmed proof."
                  : "Moving to the next unclear point."}
              </p>
            </div>
            <div className="flex items-center gap-3">
              {savedState.allDone ? (
                <>
                  <Button
                    size="sm"
                    className="hw-btn-primary gap-1.5"
                    onClick={() => { setOpen(false); router.push(`/jobs/${jobId}/documents`) }}
                  >
                    Generate materials
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setOpen(false)}>
                    Back to job
                  </Button>
                </>
              ) : (
                <>
                  <Button size="sm" className="hw-btn-primary gap-1.5" onClick={() => { setSavedState(null) }}>
                    Next question
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setOpen(false)}>
                    Return to job
                  </Button>
                </>
              )}
            </div>
          </div>
        )}

        {/* Main content — hidden while showing post-save state */}
        <div className={`grid min-h-0 flex-1 overflow-hidden lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] ${savedState ? "hidden" : ""}`}>
          <div className="min-h-0 overflow-y-auto border-b border-border bg-muted/25 px-5 py-4 lg:border-b-0 lg:border-r">
            <div className="rounded-md border border-border bg-background p-4">
              <p className="text-[11px] font-semibold uppercase text-muted-foreground">
                Requirement
              </p>
              <p className="mt-1 text-[10px] font-semibold uppercase text-primary">
                {requirementType.replace(/_/g, " ")}
              </p>
              <p className="mt-2 text-sm font-semibold text-foreground">{activeGap}</p>
              {requirement?.proof_needed?.length ? (
                <p className="mt-2 text-xs text-muted-foreground">{requirement.proof_needed[0]}</p>
              ) : null}
              {requirement?.current_proof?.length ? (
                <div className="mt-3 rounded-md bg-muted/60 px-3 py-2">
                  <p className="text-[11px] font-semibold uppercase text-muted-foreground">Already found</p>
                  <p className="mt-1 text-xs text-foreground">{requirement.current_proof.join(", ")}</p>
                </div>
              ) : null}
            </div>

            <div className="mt-4 rounded-md border border-border bg-background p-4">
              <p className="text-xs font-semibold text-foreground">
                {requirement?.coach_question ?? "What should HireWire know?"}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Have you done anything related to {activeGap}? A project, responsibility, tool, result, or adjacent experience all count.
              </p>
              <div className="mt-3 space-y-2">
                <Textarea
                  value={answer}
                  onChange={(event) => { setAnswer(event.target.value); setCoachingNudge(null) }}
                  placeholder="Example: I have not owned this exact tool, but I led..."
                  className="min-h-24 text-sm"
                />
                {coachingNudge && (
                  <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
                    {coachingNudge}
                  </p>
                )}
                {error && <p className="text-xs text-rose-600">{error}</p>}
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Button
                    size="sm"
                    className="hw-btn-primary gap-1.5 text-xs"
                    disabled={saving !== null || answer.trim().length < 8}
                    onClick={() => postCoachStep({ action: "answer", gap: activeGap, requirementId: requirement?.requirement_id, answer }, "answer")}
                  >
                    {saving === "answer" ? "Saving..." : "Confirm claim"}
                  </Button>
                  {coachingNudge && canForceSave && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs text-amber-700 border-amber-300 hover:bg-amber-50"
                      disabled={saving !== null}
                      onClick={() => postCoachStep({ action: "answer", gap: activeGap, requirementId: requirement?.requirement_id, answer, force_save: true }, "answer")}
                    >
                      {saving === "answer" ? "Saving..." : "Save anyway"}
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs"
                    disabled={saving !== null}
                    onClick={() => postCoachStep({
                      action: "skip",
                      gap: activeGap,
                      requirementId: requirement?.requirement_id,
                    }, "skip")}
                  >
                    {saving === "skip" ? "Skipping..." : "Skip"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
          {requiresScopedSession && !coachSessionId ? (
            <div className="flex min-h-[420px] items-center justify-center border-t border-border bg-background px-6 text-center text-sm text-muted-foreground lg:min-h-0 lg:border-t-0">
              {sessionLoading ? "Loading your requirement session..." : "Preparing coach session..."}
            </div>
          ) : (
            <CoachChat
              key={`coach-${coachSessionId ?? "adhoc"}`}
              compact
              className="min-h-[420px] lg:min-h-0"
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
                resumeHint
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
