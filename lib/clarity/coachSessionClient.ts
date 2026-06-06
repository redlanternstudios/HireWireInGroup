import type {
  ConfidenceLevel,
  InterviewMessage,
  SuggestedEvidence,
} from "@/components/match-interview/types"

/**
 * Coach session client — shared fetch helpers + message mappers used by the
 * Clarity drawer's coach conversation. These call the SAME wired endpoints the
 * Match Interview uses:
 *   - POST /api/coach/sessions               (resume-or-start a session)
 *   - POST /api/coach/sessions/[id]/messages (send a turn)
 *   - POST /api/coach/evidence-drafts/[id]/confirm
 *   - POST /api/jobs/[id]/coach-step         (direct proof save / skip)
 *
 * VS Code/Codex owns the routes, Supabase writes, model routing, and RLS.
 * This module owns only the client transport + presentational mapping.
 */

export type CoachSessionMessage = {
  id?: string
  role?: string
  content?: string
  created_at?: string
}

export type CoachDraft = {
  id: string
  source_title: string | null
  source_type: string | null
  proof_snippet: string | null
  confidence_level?: string | null
  status?: string | null
}

export type RequirementRef = {
  requirement_id: string
  requirement_text: string
}

export const DEFAULT_QUICK_REPLIES = [
  "Yes, I have a direct example",
  "I have something adjacent",
  "I'm not sure yet",
  "I can't meet this requirement",
]

export function makeId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2)
}

async function readJson(response: Response) {
  try {
    return await response.json()
  } catch {
    return null
  }
}

function asErrorMessage(data: unknown, fallback: string) {
  if (data && typeof data === "object" && !Array.isArray(data)) {
    const record = data as Record<string, unknown>
    return String(record.user_message ?? record.error ?? record.message ?? fallback)
  }
  return fallback
}

function confidenceFromDraft(value: string | null | undefined): ConfidenceLevel {
  if (value === "high") return "strong"
  if (value === "medium") return "partial"
  if (value === "low") return "weak"
  return "needs_review"
}

export function messageFromCoachRow(row: CoachSessionMessage, isLast: boolean): InterviewMessage {
  return {
    id: row.id ?? makeId(),
    role: row.role === "user" ? "user" : "coach",
    type: "question",
    content: row.content ?? "",
    quickReplies: row.role === "user" || !isLast ? undefined : DEFAULT_QUICK_REPLIES,
    timestamp: row.created_at ? new Date(row.created_at) : new Date(),
  }
}

export function draftToSuggestedEvidence(draft: CoachDraft): SuggestedEvidence {
  return {
    id: draft.id,
    title: draft.source_title ?? "Coach-suggested proof",
    source_type: draft.source_type,
    snippet: draft.proof_snippet ?? undefined,
    relevance: draft.confidence_level === "high" ? "high" : "medium",
  }
}

export function draftToProofSummary(draft: CoachDraft): InterviewMessage {
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

/** Resume an existing coach session for this requirement, or start a new one. */
export async function startCoachSession(req: RequirementRef, jobId: string) {
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
    throw new Error(asErrorMessage(data, "Could not start the coaching session."))
  }
  const messages = Array.isArray(data?.messages) ? (data.messages as CoachSessionMessage[]) : []
  const pendingDrafts = Array.isArray(data?.pendingDrafts) ? (data.pendingDrafts as CoachDraft[]) : []

  return {
    sessionId: String(data?.sessionId ?? ""),
    messages,
    pendingDrafts,
  }
}

export async function sendCoachMessage(sessionId: string, message: string) {
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

export async function confirmDraft(draftId: string) {
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

export async function saveDirectProof(jobId: string, req: RequirementRef, claimText: string) {
  const response = await fetch(`/api/jobs/${jobId}/coach-step`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "answer",
      requirementId: req.requirement_id,
      gap: req.requirement_text,
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

export async function skipRequirement(jobId: string, req: RequirementRef) {
  const response = await fetch(`/api/jobs/${jobId}/coach-step`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "skip",
      requirementId: req.requirement_id,
      gap: req.requirement_text,
    }),
  })
  const data = await readJson(response)
  if (!response.ok) {
    throw new Error(asErrorMessage(data, "Could not skip that requirement."))
  }
  return data
}
