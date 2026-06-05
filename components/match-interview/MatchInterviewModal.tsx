"use client"

import { useCallback, useEffect, useReducer, useState } from "react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { MatchInterviewHeader } from "./MatchInterviewHeader"
import { CoachChatThread } from "./CoachChatThread"
import { ChatComposer } from "./ChatComposer"
import { InterviewActionBar, InterviewErrorState, InterviewLoadingState } from "./InterviewStates"
import {
  inferRequirementType,
  type EvidenceAction,
  type InterviewMessage,
  type InterviewRequirement,
  type MatchInterviewState,
  type SuggestedEvidence,
  type YearsEntry,
} from "./types"

// ─────────────────────────────────────────────
// State reducer
// ─────────────────────────────────────────────

type Action =
  | { type: "SET_SESSION"; sessionId: string }
  | { type: "SET_SESSION_STATUS"; status: MatchInterviewState["sessionStatus"] }
  | { type: "SET_INPUT"; value: string }
  | { type: "ADD_MESSAGE"; message: InterviewMessage }
  | { type: "SET_LOADING"; value: boolean }
  | { type: "SET_SAVING"; value: boolean }
  | { type: "SET_ERROR"; error: string | null }
  | { type: "SET_STATUS"; status: MatchInterviewState["interviewStatus"] }
  | { type: "UPDATE_YEARS"; messageId: string; entries: YearsEntry[] }
  | { type: "RESET_SESSION" }

function reducer(state: MatchInterviewState, action: Action): MatchInterviewState {
  switch (action.type) {
    case "SET_SESSION":
      return { ...state, sessionId: action.sessionId, sessionStatus: "ready" }
    case "SET_SESSION_STATUS":
      return { ...state, sessionStatus: action.status }
    case "SET_INPUT":
      return { ...state, inputValue: action.value }
    case "ADD_MESSAGE":
      return { ...state, messages: [...state.messages, action.message] }
    case "SET_LOADING":
      return { ...state, isLoading: action.value }
    case "SET_SAVING":
      return { ...state, isSaving: action.value }
    case "SET_ERROR":
      return { ...state, error: action.error }
    case "SET_STATUS":
      return { ...state, interviewStatus: action.status }
    case "UPDATE_YEARS":
      return {
        ...state,
        messages: state.messages.map((m) =>
          m.id === action.messageId ? { ...m, yearsEntries: action.entries } : m,
        ),
      }
    case "RESET_SESSION":
      return {
        ...state,
        sessionId: null,
        messages: [],
        inputValue: "",
        isLoading: false,
        isSaving: false,
        error: null,
        sessionStatus: "idle",
        interviewStatus: "active",
      }
    default:
      return state
  }
}

function makeId() {
  return typeof crypto !== "undefined"
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2)
}

type CoachSessionMessage = {
  id?: string
  role?: string
  content?: string
  created_at?: string
}

type CoachDraft = {
  id: string
  source_title: string | null
  source_type: string | null
  proof_snippet: string | null
  confidence_level?: string | null
  status?: string | null
}

const DEFAULT_QUICK_REPLIES = [
  "Yes, I have a direct example",
  "I have something adjacent",
  "I'm not sure yet",
  "I can't meet this requirement",
]

function asErrorMessage(data: unknown, fallback: string) {
  if (data && typeof data === "object" && !Array.isArray(data)) {
    const record = data as Record<string, unknown>
    return String(record.user_message ?? record.error ?? record.message ?? fallback)
  }
  return fallback
}

function confidenceFromDraft(value: string | null | undefined): "strong" | "partial" | "weak" | "needs_review" {
  if (value === "high") return "strong"
  if (value === "medium") return "partial"
  if (value === "low") return "weak"
  return "needs_review"
}

function messageFromCoachRow(row: CoachSessionMessage, isLast: boolean): InterviewMessage {
  return {
    id: row.id ?? makeId(),
    role: row.role === "user" ? "user" : "coach",
    type: "question",
    content: row.content ?? "",
    quickReplies: row.role === "user" || !isLast ? undefined : DEFAULT_QUICK_REPLIES,
    timestamp: row.created_at ? new Date(row.created_at) : new Date(),
  }
}

function draftToSuggestedEvidence(draft: CoachDraft): SuggestedEvidence {
  return {
    id: draft.id,
    title: draft.source_title ?? "Coach-suggested proof",
    source_type: draft.source_type,
    snippet: draft.proof_snippet ?? undefined,
    relevance: draft.confidence_level === "high" ? "high" : "medium",
  }
}

function draftToProofSummary(draft: CoachDraft): InterviewMessage {
  return {
    id: `draft:${draft.id}`,
    role: "coach",
    type: "proof_summary",
    content: "I found a proof point you can confirm for this requirement.",
    proofSummary: {
      text: draft.proof_snippet ?? draft.source_title ?? "Confirm this proof for the requirement.",
      confidence: confidenceFromDraft(draft.confidence_level),
      draftId: draft.id,
    },
    timestamp: new Date(),
  }
}

async function readJson(response: Response) {
  try {
    return await response.json()
  } catch {
    return null
  }
}

async function startCoachSession(req: InterviewRequirement, jobId: string) {
  const response = await fetch("/api/coach/sessions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jobId,
      gapRequirement: req.requirement_text,
      gapRequirementId: req.requirement_id,
    }),
  })
  const data = await readJson(response)
  if (!response.ok) {
    throw new Error(asErrorMessage(data, "Could not start the Match Interview."))
  }
  const messages = Array.isArray(data?.messages) ? data.messages as CoachSessionMessage[] : []
  const pendingDrafts = Array.isArray(data?.pendingDrafts) ? data.pendingDrafts as CoachDraft[] : []

  return {
    sessionId: String(data?.sessionId ?? ""),
    messages,
    pendingDrafts,
  }
}

async function sendCoachMessage(sessionId: string, message: string) {
  const response = await fetch(`/api/coach/sessions/${sessionId}/messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content: message }),
  })
  const data = await readJson(response)
  if (!response.ok) {
    throw new Error(asErrorMessage(data, "Could not send that message."))
  }
  return {
    message: data?.message as CoachSessionMessage | undefined,
    draft: data?.draft as CoachDraft | null | undefined,
  }
}

async function confirmDraft(draftId: string) {
  const response = await fetch(`/api/coach/evidence-drafts/${draftId}/confirm`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({}),
  })
  const data = await readJson(response)
  if (!response.ok) {
    throw new Error(asErrorMessage(data, "Could not confirm that proof."))
  }
  return data
}

async function saveDirectProof(jobId: string, requirement: InterviewRequirement, claimText: string) {
  const response = await fetch(`/api/jobs/${jobId}/coach-step`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "answer",
      requirementId: requirement.requirement_id,
      gap: requirement.requirement_text,
      answer: claimText,
      force_save: true,
    }),
  })
  const data = await readJson(response)
  if (!response.ok) {
    throw new Error(asErrorMessage(data, "Could not save that proof."))
  }
  return data
}

async function skipRequirement(jobId: string, requirement: InterviewRequirement) {
  const response = await fetch(`/api/jobs/${jobId}/coach-step`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "skip",
      requirementId: requirement.requirement_id,
      gap: requirement.requirement_text,
    }),
  })
  const data = await readJson(response)
  if (!response.ok) {
    throw new Error(asErrorMessage(data, "Could not skip that requirement."))
  }
  return data
}

// ─────────────────────────────────────────────
// MatchInterviewModal
// ─────────────────────────────────────────────

export interface MatchInterviewModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  jobId: string
  jobTitle: string
  company: string
  requirement: InterviewRequirement
  currentIndex: number
  totalCount: number
  onPrev?: () => void
  onNext?: () => void
  onStepSaved?: (mode: "answer" | "skip") => void
}

export function MatchInterviewModal({
  open,
  onOpenChange,
  jobId,
  jobTitle,
  company,
  requirement,
  currentIndex,
  totalCount,
  onPrev,
  onNext,
  onStepSaved,
}: MatchInterviewModalProps) {
  const requirementType = inferRequirementType(requirement.requirement_text)
  const [retryNonce, setRetryNonce] = useState(0)
  const [proofLocked, setProofLocked] = useState(false)

  const [state, dispatch] = useReducer(reducer, {
    jobId,
    jobTitle,
    company,
    requirement,
    requirementType,
    currentIndex,
    totalCount,
    sessionId: null,
    messages: [],
    inputValue: "",
    isLoading: false,
    isSaving: false,
    error: null,
    sessionStatus: "idle",
    interviewStatus: "active",
    detailsOpen: false,
  })

  // Reset and start a new session whenever requirement changes
  useEffect(() => {
    if (!open) return
    setProofLocked(false)
    dispatch({ type: "RESET_SESSION" })
    dispatch({ type: "SET_SESSION_STATUS", status: "loading" })

    let cancelled = false

    async function startSession() {
      try {
        const result = await startCoachSession(requirement, jobId)
        if (cancelled) return
        dispatch({ type: "SET_SESSION", sessionId: result.sessionId })
        result.messages.forEach((message, index) => {
          dispatch({
            type: "ADD_MESSAGE",
            message: messageFromCoachRow(message, index === result.messages.length - 1 && result.pendingDrafts.length === 0),
          })
        })
        result.pendingDrafts.forEach((draft) => {
          dispatch({ type: "ADD_MESSAGE", message: draftToProofSummary(draft) })
        })
        if (result.messages.length === 0 && result.pendingDrafts.length === 0) {
          dispatch({
            type: "ADD_MESSAGE",
            message: {
              id: makeId(),
              role: "coach",
              type: "question",
              content: `Let's prove this: **"${requirement.requirement_text.slice(0, 80)}"**\n\nHave you worked on anything directly related to this? A project, result, or adjacent experience all count.`,
              quickReplies: DEFAULT_QUICK_REPLIES,
              timestamp: new Date(),
            },
          })
        }
      } catch (error) {
        if (!cancelled) {
          dispatch({ type: "SET_SESSION_STATUS", status: "error" })
          dispatch({
            type: "SET_ERROR",
            error: error instanceof Error ? error.message : "Could not start the session. Try again.",
          })
        }
      }
    }

    void startSession()
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, requirement.requirement_id, retryNonce])

  const handleSend = useCallback(
    async (text: string) => {
      if (!text.trim() || state.isLoading) return

      dispatch({ type: "SET_INPUT", value: "" })
      dispatch({
        type: "ADD_MESSAGE",
        message: { id: makeId(), role: "user", type: "text", content: text, timestamp: new Date() },
      })
      dispatch({ type: "SET_LOADING", value: true })

      try {
        if (!state.sessionId) throw new Error("Session is not ready yet.")
        const result = await sendCoachMessage(state.sessionId, text)
        if (result.message) {
          dispatch({
            type: "ADD_MESSAGE",
            message: {
              ...messageFromCoachRow(result.message, !result.draft),
              suggestedEvidence: result.draft ? [draftToSuggestedEvidence(result.draft)] : undefined,
            },
          })
        }
        if (result.draft) {
          dispatch({ type: "ADD_MESSAGE", message: draftToProofSummary(result.draft) })
        }
      } catch (error) {
        dispatch({
          type: "ADD_MESSAGE",
          message: {
            id: makeId(),
            role: "coach",
            type: "text",
            content: error instanceof Error ? error.message : "Something went wrong. Please try again.",
            timestamp: new Date(),
          },
        })
      } finally {
        dispatch({ type: "SET_LOADING", value: false })
      }
    },
    [state.isLoading, state.sessionId],
  )

  const handleEvidenceAction = useCallback(
    async (action: EvidenceAction, evidence: SuggestedEvidence) => {
      if (action === "use") {
        dispatch({
          type: "ADD_MESSAGE",
          message: {
            id: makeId(),
            role: "user",
            type: "text",
            content: `Using "${evidence.title}" as proof`,
            timestamp: new Date(),
          },
        })
        dispatch({ type: "SET_SAVING", value: true })
        try {
          await confirmDraft(evidence.id)
          dispatch({ type: "SET_STATUS", status: "completed" })
          setProofLocked(true)
          window.setTimeout(() => {
            setProofLocked(false)
            onStepSaved?.("answer")
            onNext?.()
          }, 700)
        } catch (error) {
          dispatch({
            type: "ADD_MESSAGE",
            message: {
              id: makeId(),
              role: "coach",
              type: "text",
              content: error instanceof Error ? error.message : "Could not confirm that proof.",
              timestamp: new Date(),
            },
          })
        } finally {
          dispatch({ type: "SET_SAVING", value: false })
        }
      } else if (action === "add_detail") {
        void handleSend(`I'd like to add more detail to "${evidence.title}".`)
      } else {
        void handleSend(`"${evidence.title}" is not relevant to this requirement.`)
      }
    },
    [handleSend, onNext, onStepSaved],
  )

  const handleConfirmProof = useCallback(
    async (messageId: string) => {
      const proofMessage = state.messages.find((message) => message.id === messageId)
      const draftId = proofMessage?.proofSummary?.draftId
      const claimText =
        proofMessage?.proofSummary?.text ??
        [...state.messages].reverse().find((message) => message.role === "user" && message.content?.trim())?.content ??
        ""

      dispatch({ type: "SET_SAVING", value: true })
      try {
        if (draftId) {
          await confirmDraft(draftId)
        } else {
          await saveDirectProof(jobId, requirement, claimText)
        }
        dispatch({ type: "SET_SAVING", value: false })
        dispatch({ type: "SET_STATUS", status: "completed" })
        setProofLocked(true)
        window.setTimeout(() => {
          setProofLocked(false)
          onStepSaved?.("answer")
          onNext?.()
        }, 700)
      } catch (error) {
        dispatch({ type: "SET_SAVING", value: false })
        dispatch({
          type: "ADD_MESSAGE",
          message: {
            id: makeId(),
            role: "coach",
            type: "text",
            content: error instanceof Error ? error.message : "Could not save that proof.",
            timestamp: new Date(),
          },
        })
      }
    },
    [jobId, onNext, onStepSaved, requirement, state.messages],
  )

  const handleSkip = useCallback(async () => {
    dispatch({ type: "SET_SAVING", value: true })
    try {
      await skipRequirement(jobId, requirement)
      dispatch({ type: "SET_STATUS", status: "skipped" })
      onStepSaved?.("skip")
      onNext?.()
    } catch (error) {
      dispatch({
        type: "ADD_MESSAGE",
        message: {
          id: makeId(),
          role: "coach",
          type: "text",
          content: error instanceof Error ? error.message : "Could not skip that requirement.",
          timestamp: new Date(),
        },
      })
    } finally {
      dispatch({ type: "SET_SAVING", value: false })
    }
  }, [jobId, onNext, onStepSaved, requirement])

  const handleYearsUpdate = useCallback((messageId: string, entries: YearsEntry[]) => {
    dispatch({ type: "UPDATE_YEARS", messageId, entries })
  }, [])

  const handleRetry = useCallback(() => {
    dispatch({ type: "SET_ERROR", error: null })
    setRetryNonce((value) => value + 1)
  }, [])

  const hasNext = !!onNext && currentIndex < totalCount - 1

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="hw-proof-context flex flex-col gap-0 overflow-hidden border-border/60 bg-background p-0 text-foreground shadow-2xl"
        style={{
          width: "min(780px, 94vw)",
          maxWidth: "none",
          height: "88vh",
          maxHeight: "88vh",
          borderRadius: "16px",
        }}
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        {/* Header */}
        <MatchInterviewHeader
          requirement={requirement}
          requirementType={requirementType}
          currentIndex={currentIndex}
          totalCount={totalCount}
          onPrev={onPrev}
          onNext={onNext}
          onClose={() => onOpenChange(false)}
        />

        {/* Chat area */}
        <div className="relative flex-1 min-h-0">
          {proofLocked && (
            <div className="pointer-events-none absolute inset-x-0 top-4 z-20 flex justify-center">
              <span className="hw-proof-stamp locked bg-background/95 shadow-xl">
                Proof locked in
              </span>
            </div>
          )}
          {state.sessionStatus === "loading" ? (
            <InterviewLoadingState />
          ) : state.sessionStatus === "error" ? (
            <InterviewErrorState message={state.error ?? undefined} onRetry={handleRetry} />
          ) : (
            <CoachChatThread
              messages={state.messages}
              isLoading={state.isLoading}
              isSaving={state.isSaving}
              onQuickReply={handleSend}
              onEvidenceAction={handleEvidenceAction}
              onConfirmProof={handleConfirmProof}
              onSkipClaim={handleSkip}
              onYearsUpdate={handleYearsUpdate}
              className="absolute inset-0 overflow-y-auto"
            />
          )}
        </div>

        {/* Composer — always visible when session is ready */}
        {state.sessionStatus === "ready" && (
          <ChatComposer
            value={state.inputValue}
            onChange={(v) => dispatch({ type: "SET_INPUT", value: v })}
            onSubmit={handleSend}
            disabled={state.isLoading || state.isSaving}
          />
        )}

        {/* Bottom nav strip */}
        {state.sessionStatus === "ready" && (
          <InterviewActionBar
            onSkip={handleSkip}
            onNext={() => onNext?.()}
            hasNext={hasNext}
            disabled={state.isLoading || state.isSaving}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}
