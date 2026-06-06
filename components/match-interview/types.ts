// ─────────────────────────────────────────────
// Match Interview — shared types
// VS Code owns: API routes, Supabase writes, model routing, RLS
// v0 owns: all UI components and interaction states in this folder
// ─────────────────────────────────────────────

export type RequirementType =
  | "years_experience"
  | "credential"
  | "tool"
  | "domain"
  | "outcome"
  | "responsibility"
  | "skill"
  | "other"

export type ConfidenceLevel =
  | "strong"
  | "partial"
  | "weak"
  | "missing"
  | "needs_review"

export type MessageRole = "coach" | "user" | "system"

export type MessageType =
  | "text"
  | "question"
  | "evidence_card"
  | "evidence_summary"
  | "proof_summary"
  | "composite_years"
  | "loading"

export type EvidenceAction = "use" | "add_detail" | "not_relevant"

/** A single suggested evidence item surfaced by the coach inline */
export interface SuggestedEvidence {
  id: string
  title: string
  source_type: string | null
  snippet?: string
  relevance?: "high" | "medium" | "low"
}

/** A role/duration entry for composite years-of-experience requirements */
export interface YearsEntry {
  id: string
  role: string
  company: string
  startYear: number
  endYear: number | "present"
}

/** A single message in the chat thread */
export interface InterviewMessage {
  id: string
  role: MessageRole
  type: MessageType
  content?: string
  quickReplies?: string[]
  suggestedEvidence?: SuggestedEvidence[]
  yearsEntries?: YearsEntry[]
  confidence?: ConfidenceLevel
  proofSummary?: {
    text: string
    confidence: ConfidenceLevel
    gapNotes?: string
    draftId?: string
  }
  timestamp: Date
}

/** Requirement passed into the modal */
export interface InterviewRequirement {
  requirement_id: string
  requirement_text: string
  requirement_type?: RequirementType
  priority?: string
  status?: string
  current_proof?: string[]
  proof_needed?: string[]
  coach_question?: string
}

/** Top-level state for the match interview session */
export interface MatchInterviewState {
  jobId: string
  jobTitle: string
  company: string
  requirement: InterviewRequirement
  requirementType: RequirementType
  currentIndex: number
  totalCount: number
  sessionId: string | null
  messages: InterviewMessage[]
  inputValue: string
  isLoading: boolean
  isSaving: boolean
  error: string | null
  sessionStatus: "idle" | "loading" | "ready" | "error"
  interviewStatus: "active" | "completed" | "skipped"
  detailsOpen: boolean
}

/** Quick reply chip definition */
export interface QuickReply {
  label: string
  value: string
}

/** Confidence level display config */
export const CONFIDENCE_CONFIG: Record<
  ConfidenceLevel,
  { label: string; className: string; dotClass: string }
> = {
  strong: {
    label: "Strong match",
    className: "bg-emerald-50 text-emerald-700 border-emerald-200",
    dotClass: "bg-emerald-500",
  },
  partial: {
    label: "Partial match",
    className: "bg-amber-50 text-amber-700 border-amber-200",
    dotClass: "bg-amber-400",
  },
  weak: {
    label: "Weak match",
    className: "bg-orange-50 text-orange-700 border-orange-200",
    dotClass: "bg-orange-400",
  },
  missing: {
    label: "Not yet matched",
    className: "bg-rose-50 text-rose-700 border-rose-200",
    dotClass: "bg-rose-400",
  },
  needs_review: {
    label: "Needs review",
    className: "bg-slate-50 text-slate-600 border-slate-200",
    dotClass: "bg-slate-400",
  },
}

/** Requirement type display labels */
export const REQUIREMENT_TYPE_LABELS: Record<RequirementType, string> = {
  years_experience: "Years of experience",
  credential: "Credential / certification",
  tool: "Tool / platform",
  domain: "Industry / domain",
  outcome: "Business outcome",
  responsibility: "Responsibility",
  skill: "Skill",
  other: "General requirement",
}

/** Infer requirement type from text — mirrors server logic, client-only hint */
export function inferRequirementType(text: string): RequirementType {
  const v = text.toLowerCase()
  if (/(\d+\+?\s*years?|years?\s+of\s+experience|experience\s+in)/.test(v)) return "years_experience"
  if (/(bachelor|master|mba|phd|degree|certified|certification|license|pmp|cka)/.test(v)) return "credential"
  if (/(salesforce|sap|jira|figma|supabase|openai|api|tableau|excel|python|sql)/.test(v)) return "tool"
  if (/(healthcare|finance|enterprise\s+saas|construction|education|government|retail)/.test(v)) return "domain"
  if (/(increase|improve|reduce|delivered|impact|outcome|kpi|adoption|revenue|efficiency)/.test(v)) return "outcome"
  if (/(own|lead|manage|partner|coordinate|launch|roadmap|stakeholder|cross-functional)/.test(v)) return "responsibility"
  if (/(analytical|problem.solving|communication|strategy|leadership|skill|ability)/.test(v)) return "skill"
  return "other"
}
