"use client"

import { useCallback, useEffect, useReducer, useRef } from "react"
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

// ─────────────────────────────────────────────
// Placeholder for VS Code API integration
// Replace these stubs with real fetch calls:
//   POST /api/match-interview/start     → { sessionId, message, quickReplies }
//   POST /api/match-interview/message   → streaming { message, quickReplies, evidence, proofSummary }
//   POST /api/match-interview/skip      → { ok }
//   POST /api/match-interview/finalize  → { proofSummary, confidence }
// ─────────────────────────────────────────────

async function stubStartSession(req: InterviewRequirement, jobId: string) {
  // VS Code wires: POST /api/match-interview/start
  await new Promise((r) => setTimeout(r, 900))
  return {
    sessionId: makeId(),
    message: `Let's prove this: **"${req.requirement_text.slice(0, 60)}…"**\n\nHave you worked on anything directly related to this? A project, result, or adjacent experience all count.`,
    quickReplies: [
      "Yes, I have a direct example",
      "I have something adjacent",
      "I'm not sure yet",
      "I can't meet this requirement",
    ],
  }
}

async function stubSendMessage(_sessionId: string, _message: string) {
  // VS Code wires: POST /api/match-interview/message (streaming)
  await new Promise((r) => setTimeout(r, 1100))
  return {
    message:
      "That sounds like a strong fit. Can you give me one specific example — the project, your role, and the result you drove?",
    quickReplies: ["Sure, here's an example", "I need to think about it", "Skip this requirement"],
    suggestedEvidence: [] as SuggestedEvidence[],
  }
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
  requirement,
  currentIndex,
  totalCount,
  onPrev,
  onNext,
  onStepSaved,
}: MatchInterviewModalProps) {
  const requirementType = inferRequirementType(requirement.requirement_text)

  const [state, dispatch] = useReducer(reducer, {
    jobId,
    jobTitle,
    company: "",
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

  const retryRef = useRef(0)

  // Reset and start a new session whenever requirement changes
  useEffect(() => {
    if (!open) return
    dispatch({ type: "RESET_SESSION" })
    dispatch({ type: "SET_SESSION_STATUS", status: "loading" })

    let cancelled = false

    async function startSession() {
      try {
        const result = await stubStartSession(requirement, jobId)
        if (cancelled) return
        dispatch({ type: "SET_SESSION", sessionId: result.sessionId })
        dispatch({
          type: "ADD_MESSAGE",
          message: {
            id: makeId(),
            role: "coach",
            type: "question",
            content: result.message,
            quickReplies: result.quickReplies,
            timestamp: new Date(),
          },
        })
      } catch {
        if (!cancelled) {
          dispatch({ type: "SET_SESSION_STATUS", status: "error" })
          dispatch({ type: "SET_ERROR", error: "Could not start the session. Try again." })
        }
      }
    }

    void startSession()
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, requirement.requirement_id, retryRef.current])

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
        const result = await stubSendMessage(state.sessionId ?? "", text)
        dispatch({
          type: "ADD_MESSAGE",
          message: {
            id: makeId(),
            role: "coach",
            type: "question",
            content: result.message,
            quickReplies: result.quickReplies,
            suggestedEvidence: result.suggestedEvidence,
            timestamp: new Date(),
          },
        })
      } catch {
        dispatch({
          type: "ADD_MESSAGE",
          message: {
            id: makeId(),
            role: "coach",
            type: "text",
            content: "Something went wrong. Please try again.",
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
    (action: EvidenceAction, evidence: SuggestedEvidence) => {
      // VS Code wires: optimistic UI, then server confirms
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
        void handleSend(`I want to use "${evidence.title}" as my proof for this requirement.`)
      } else if (action === "add_detail") {
        void handleSend(`I'd like to add more detail to "${evidence.title}".`)
      } else {
        void handleSend(`"${evidence.title}" is not relevant to this requirement.`)
      }
    },
    [handleSend],
  )

  const handleConfirmProof = useCallback(
    (_messageId: string) => {
      // VS Code wires: POST /api/match-interview/finalize → Supabase write
      // v0: optimistic update only
      dispatch({ type: "SET_SAVING", value: true })
      setTimeout(() => {
        dispatch({ type: "SET_SAVING", value: false })
        dispatch({ type: "SET_STATUS", status: "completed" })
        onStepSaved?.("answer")
        onNext?.()
      }, 800)
    },
    [onNext, onStepSaved],
  )

  const handleSkip = useCallback(() => {
    // VS Code wires: POST /api/match-interview/skip → Supabase write
    dispatch({ type: "SET_STATUS", status: "skipped" })
    onStepSaved?.("skip")
    onNext?.()
  }, [onNext, onStepSaved])

  const handleYearsUpdate = useCallback((messageId: string, entries: YearsEntry[]) => {
    dispatch({ type: "UPDATE_YEARS", messageId, entries })
  }, [])

  const handleRetry = useCallback(() => {
    retryRef.current += 1
    dispatch({ type: "SET_ERROR", error: null })
  }, [])

  const hasNext = !!onNext && currentIndex < totalCount - 1

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="flex flex-col gap-0 overflow-hidden border-border/60 p-0 shadow-2xl"
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
