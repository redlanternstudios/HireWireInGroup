"use client"

import { useCallback, useEffect, useReducer, useState } from "react"
import { SkipForward } from "lucide-react"
import { CoachChatThread } from "@/components/match-interview/CoachChatThread"
import { ChatComposer } from "@/components/match-interview/ChatComposer"
import { InterviewErrorState, InterviewLoadingState } from "@/components/match-interview/InterviewStates"
import type {
  EvidenceAction,
  InterviewMessage,
  SuggestedEvidence,
  YearsEntry,
} from "@/components/match-interview/types"
import {
  DEFAULT_QUICK_REPLIES,
  confirmDraft,
  draftToProofSummary,
  draftToSuggestedEvidence,
  makeId,
  messageFromCoachRow,
  saveDirectProof,
  sendCoachMessage,
  skipRequirement,
  startCoachSession,
} from "@/lib/clarity/coachSessionClient"
import type { ClarityRequirement } from "@/lib/clarity/getUnresolvedRequirements"

type SessionStatus = "idle" | "loading" | "ready" | "error"

interface PanelState {
  sessionId: string | null
  messages: InterviewMessage[]
  inputValue: string
  isLoading: boolean
  isSaving: boolean
  error: string | null
  sessionStatus: SessionStatus
}

type Action =
  | { type: "RESET" }
  | { type: "SET_SESSION_STATUS"; status: SessionStatus }
  | { type: "SET_SESSION"; sessionId: string }
  | { type: "SET_INPUT"; value: string }
  | { type: "ADD_MESSAGE"; message: InterviewMessage }
  | { type: "SET_LOADING"; value: boolean }
  | { type: "SET_SAVING"; value: boolean }
  | { type: "SET_ERROR"; error: string | null }
  | { type: "UPDATE_YEARS"; messageId: string; entries: YearsEntry[] }

const INITIAL: PanelState = {
  sessionId: null,
  messages: [],
  inputValue: "",
  isLoading: false,
  isSaving: false,
  error: null,
  sessionStatus: "idle",
}

function reducer(state: PanelState, action: Action): PanelState {
  switch (action.type) {
    case "RESET":
      return { ...INITIAL }
    case "SET_SESSION_STATUS":
      return { ...state, sessionStatus: action.status }
    case "SET_SESSION":
      return { ...state, sessionId: action.sessionId, sessionStatus: "ready" }
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
    case "UPDATE_YEARS":
      return {
        ...state,
        messages: state.messages.map((m) =>
          m.id === action.messageId ? { ...m, yearsEntries: action.entries } : m,
        ),
      }
    default:
      return state
  }
}

/**
 * ClarityCoachPanel — the conversational core of the Clarity drawer for a
 * SINGLE requirement. It resumes (or starts) the coach session and opens with
 * a coach message. Confirm/skip are always available but secondary.
 *
 * Crucially, it does NOT advance to the next requirement. On a successful
 * confirm or skip it calls onResolved(mode) and lets the parent drawer decide
 * what happens next — a calm coach, not a wizard.
 */
export function ClarityCoachPanel({
  jobId,
  requirement,
  onResolved,
}: {
  jobId: string
  requirement: ClarityRequirement
  onResolved: (mode: "answer" | "skip") => void
}) {
  const [state, dispatch] = useReducer(reducer, INITIAL)
  const [retryNonce, setRetryNonce] = useState(0)

  // Resume or start a session whenever the requirement changes.
  useEffect(() => {
    dispatch({ type: "RESET" })
    dispatch({ type: "SET_SESSION_STATUS", status: "loading" })

    let cancelled = false

    async function start() {
      try {
        const result = await startCoachSession(requirement, jobId)
        if (cancelled) return
        dispatch({ type: "SET_SESSION", sessionId: result.sessionId })

        result.messages.forEach((message, index) => {
          dispatch({
            type: "ADD_MESSAGE",
            message: messageFromCoachRow(
              message,
              index === result.messages.length - 1 && result.pendingDrafts.length === 0,
            ),
          })
        })
        result.pendingDrafts.forEach((draft) => {
          dispatch({ type: "ADD_MESSAGE", message: draftToProofSummary(draft) })
        })

        // No prior history → open with a warm, focused coach opener.
        if (result.messages.length === 0 && result.pendingDrafts.length === 0) {
          dispatch({
            type: "ADD_MESSAGE",
            message: {
              id: makeId(),
              role: "coach",
              type: "question",
              content: `Let's see if we can prove this from your background:\n\n**"${requirement.requirement_text.slice(0, 100)}"**\n\nI'll ask one question at a time. First — where have you shown this most clearly?`,
              quickReplies: DEFAULT_QUICK_REPLIES,
              timestamp: new Date(),
            },
          })
        }
      } catch (error) {
        if (cancelled) return
        dispatch({ type: "SET_SESSION_STATUS", status: "error" })
        dispatch({
          type: "SET_ERROR",
          error: error instanceof Error ? error.message : "Could not start the session. Try again.",
        })
      }
    }

    void start()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requirement.requirement_id, retryNonce])

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
          dispatch({ type: "SET_SAVING", value: false })
          onResolved("answer")
        } catch (error) {
          dispatch({ type: "SET_SAVING", value: false })
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
        }
      } else if (action === "add_detail") {
        void handleSend(`I'd like to add more detail to "${evidence.title}".`)
      } else {
        void handleSend(`"${evidence.title}" is not relevant to this requirement.`)
      }
    },
    [handleSend, onResolved],
  )

  const handleConfirmProof = useCallback(
    async (messageId: string) => {
      const proofMessage = state.messages.find((message) => message.id === messageId)
      const draftId = proofMessage?.proofSummary?.draftId
      const claimText =
        proofMessage?.proofSummary?.text ??
        [...state.messages].reverse().find((m) => m.role === "user" && m.content?.trim())?.content ??
        ""

      dispatch({ type: "SET_SAVING", value: true })
      try {
        if (draftId) {
          await confirmDraft(draftId)
        } else {
          await saveDirectProof(jobId, requirement, claimText)
        }
        dispatch({ type: "SET_SAVING", value: false })
        onResolved("answer")
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
    [jobId, onResolved, requirement, state.messages],
  )

  const handleSkip = useCallback(async () => {
    dispatch({ type: "SET_SAVING", value: true })
    try {
      await skipRequirement(jobId, requirement)
      dispatch({ type: "SET_SAVING", value: false })
      onResolved("skip")
    } catch (error) {
      dispatch({ type: "SET_SAVING", value: false })
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
    }
  }, [jobId, onResolved, requirement])

  const handleYearsUpdate = useCallback((messageId: string, entries: YearsEntry[]) => {
    dispatch({ type: "UPDATE_YEARS", messageId, entries })
  }, [])

  const handleRetry = useCallback(() => {
    dispatch({ type: "SET_ERROR", error: null })
    setRetryNonce((value) => value + 1)
  }, [])

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="relative min-h-0 flex-1">
        {state.sessionStatus === "loading" ? (
          <InterviewLoadingState message="Preparing your coaching session…" />
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

      {state.sessionStatus === "ready" && (
        <>
          <ChatComposer
            value={state.inputValue}
            onChange={(v) => dispatch({ type: "SET_INPUT", value: v })}
            onSubmit={handleSend}
            disabled={state.isLoading || state.isSaving}
          />
          {/* Skip is always available, but visually secondary. */}
          <div className="shrink-0 border-t border-border/50 px-4 py-2">
            <button
              onClick={handleSkip}
              disabled={state.isLoading || state.isSaving}
              className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground disabled:pointer-events-none disabled:opacity-40"
            >
              <SkipForward className="h-3.5 w-3.5" />
              I can&apos;t prove this right now — skip it
            </button>
          </div>
        </>
      )}
    </div>
  )
}
