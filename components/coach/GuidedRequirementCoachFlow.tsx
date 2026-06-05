"use client"

import { useEffect, useMemo, useState } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { MessageSquareText, Target } from "lucide-react"

import { Button } from "@/components/ui/button"
import { RequirementCoachModal } from "@/components/coach/RequirementCoachModal"
import type { RequirementEvidenceMatch } from "@/lib/evidence/types"
import { inferRequirementType, requirementAnchorId } from "@/lib/coach/requirement-type"

function isUnresolved(status: RequirementEvidenceMatch["status"]) {
  return status === "gap" || status === "unknown" || status === "partial"
}

export function GuidedRequirementCoachFlow({
  jobId,
  jobTitle,
  company,
  score,
  status,
  requirementMatches,
  evidenceItems,
  requestedRequirementId,
  generationBlocked = false,
}: {
  jobId: string
  jobTitle: string
  company: string
  score?: number | null
  status?: string
  requirementMatches: RequirementEvidenceMatch[]
  evidenceItems: Array<{
    id: string
    source_title: string | null
    source_type: string | null
  }>
  requestedRequirementId?: string | null
  generationBlocked?: boolean
}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const unresolvedMatches = useMemo(() => {
    const required = requirementMatches.filter(
      (match) => match.priority === "required" && isUnresolved(match.status),
    )
    const preferred = requirementMatches.filter(
      (match) => match.priority === "preferred" && isUnresolved(match.status),
    )
    const keyword = requirementMatches.filter(
      (match) => match.priority === "keyword" && isUnresolved(match.status),
    )
    return [...required, ...preferred, ...keyword]
  }, [requirementMatches])

  const initialIndex = useMemo(() => {
    if (!requestedRequirementId) return 0
    const idx = unresolvedMatches.findIndex(
      (match) => match.requirement_id === requestedRequirementId,
    )
    return idx >= 0 ? idx : 0
  }, [requestedRequirementId, unresolvedMatches])

  const [activeIndex, setActiveIndex] = useState(initialIndex)
  const [flowOpen, setFlowOpen] = useState(
    !!requestedRequirementId && unresolvedMatches.length > 0,
  )

  useEffect(() => {
    setActiveIndex(initialIndex)
    if (requestedRequirementId && unresolvedMatches.length > 0) {
      setFlowOpen(true)
    }
  }, [initialIndex, requestedRequirementId, unresolvedMatches.length])

  const safeActiveIndex =
    unresolvedMatches.length === 0
      ? 0
      : Math.min(activeIndex, unresolvedMatches.length - 1)
  const active = unresolvedMatches[safeActiveIndex] ?? null

  if (!active) return null

  const stepLabel = `${safeActiveIndex + 1} of ${unresolvedMatches.length}`

  const setResolveParam = (requirementId: string | null) => {
    const params = new URLSearchParams(searchParams.toString())
    params.delete("resolve")
    if (requirementId) {
      params.set("req", requirementId)
    } else {
      params.delete("req")
    }

    const query = params.toString()
    const target = requirementId
      ? `${pathname}${query ? `?${query}` : ""}#${requirementAnchorId(requirementId)}`
      : `${pathname}${query ? `?${query}` : ""}`

    router.replace(target, { scroll: false })
  }

  return (
    <div className="hw-ticket px-5 py-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-primary" />
            <p className="hw-ticket-label">Prove Fit</p>
            <span className="rounded border border-primary/20 bg-primary/5 px-2 py-0.5 text-[10px] font-semibold uppercase text-primary">
              Match Interview
            </span>
          </div>
          <p className="mt-2 text-sm font-semibold text-foreground">{active.requirement_text}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Let&apos;s prove this job fit. I&apos;ll only ask about what I can&apos;t verify from your background.
          </p>
        </div>

        {!flowOpen && (
          <Button
            size="sm"
            className="hw-btn-primary gap-1.5 text-xs shrink-0"
            onClick={() => setFlowOpen(true)}
            aria-label={`Start Match Interview for ${active.requirement_text}`}
          >
            <MessageSquareText className="h-3.5 w-3.5" />
            Start Match Interview
          </Button>
        )}
      </div>

      <RequirementCoachModal
        open={flowOpen}
        onOpenChange={setFlowOpen}
        onStepSaved={(mode) => {
          if (mode === "answer" || mode === "skip") {
            const hasNext = safeActiveIndex + 1 < unresolvedMatches.length
            if (hasNext) {
              const nextIndex = safeActiveIndex + 1
              const next = unresolvedMatches[nextIndex]
              setActiveIndex(nextIndex)
              if (next) setResolveParam(next.requirement_id)
              setTimeout(() => setFlowOpen(true), 0)
            } else {
              setResolveParam(null)
              setFlowOpen(false)
            }
          }
        }}
        jobId={jobId}
        jobTitle={jobTitle}
        company={company}
        score={score}
        status={status}
        gaps={[active.requirement_text]}
        requirement={{
          requirement_id: active.requirement_id,
          requirement_text: active.requirement_text,
          requirement_type: inferRequirementType(active.requirement_text),
          priority: active.priority,
          status: active.status,
          current_proof: active.matched_evidence_titles,
          proof_needed: active.proof_needed,
          coach_question: active.evidence_questions?.[0],
        }}
        evidenceItems={evidenceItems}
        progressLabel={stepLabel}
        showGenerationUnlock={generationBlocked}
        totalCount={unresolvedMatches.length}
        currentIndex={safeActiveIndex}
        onPrev={() => {
          if (safeActiveIndex > 0) {
            const prevIndex = safeActiveIndex - 1
            const prev = unresolvedMatches[prevIndex]
            setActiveIndex(prevIndex)
            if (prev) setResolveParam(prev.requirement_id)
          }
        }}
        onNext={() => {
          const nextIndex = safeActiveIndex + 1
          if (nextIndex < unresolvedMatches.length) {
            const next = unresolvedMatches[nextIndex]
            setActiveIndex(nextIndex)
            if (next) setResolveParam(next.requirement_id)
          } else {
            setResolveParam(null)
            setFlowOpen(false)
          }
        }}
      />
    </div>
  )
}
