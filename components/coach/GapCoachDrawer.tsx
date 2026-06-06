"use client"

import { useState } from "react"
import { MessageSquareText } from "lucide-react"

import { MatchInterviewModal } from "@/components/match-interview/MatchInterviewModal"

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

function cleanGap(gap: string) {
  return gap.replace(/^Gap:\s*/i, "").trim()
}

export function RequirementCoachModal({
  jobId,
  jobTitle,
  gaps,
  requirement,
  autoOpen = false,
  open: controlledOpen,
  onOpenChange,
  onStepSaved,
  totalCount = 1,
  currentIndex = 0,
  onPrev,
  onNext,
}: RequirementCoachModalProps) {
  const [internalOpen, setInternalOpen] = useState(autoOpen && gaps.length > 0)
  const isControlled = controlledOpen !== undefined
  const open = controlledOpen ?? internalOpen

  const setOpen = (nextOpen: boolean) => {
    if (!isControlled) setInternalOpen(nextOpen)
    onOpenChange?.(nextOpen)
  }

  const activeGap = requirement?.requirement_text ?? (gaps[0] ? cleanGap(gaps[0]) : null)

  if (!activeGap || !requirement) return null

  return (
    <>
      {!isControlled && (
        <button
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-primary/90 transition-colors"
          aria-label={`Start Match Interview for ${activeGap}`}
        >
          <MessageSquareText className="h-3.5 w-3.5" />
          Start Match Interview
        </button>
      )}

      <MatchInterviewModal
        open={open}
        onOpenChange={setOpen}
        jobId={jobId}
        jobTitle={jobTitle}
        company=""
        requirement={requirement}
        currentIndex={currentIndex}
        totalCount={totalCount}
        onPrev={onPrev}
        onNext={onNext}
        onStepSaved={onStepSaved}
      />
    </>
  )
}

export const GapCoachDrawer = RequirementCoachModal
