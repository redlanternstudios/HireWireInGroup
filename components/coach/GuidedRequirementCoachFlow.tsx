"use client"

import { useMemo } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { Target } from "lucide-react"

import { RequirementCoachModal } from "@/components/coach/RequirementCoachModal"
import { inferRequirementType, requirementAnchorId } from "@/lib/coach/requirement-type"
import { buildLowFitCoachOpeningMessage } from "@/lib/coach/low-fit-contract"

type CoachRequirement = {
  requirement_id: string
  requirement_text: string
  priority?: string
  status?: string
  matched_evidence_titles?: string[]
  proof_needed?: string[]
  evidence_questions?: string[]
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
  requirementMatches: CoachRequirement[]
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
    const required = requirementMatches.filter((match) => match.priority === "required")
    const preferred = requirementMatches.filter((match) => match.priority === "preferred")
    const keyword = requirementMatches.filter((match) => match.priority === "keyword")
    return [...required, ...preferred, ...keyword]
  }, [requirementMatches])

  const initialIndex = useMemo(() => {
    if (!requestedRequirementId) return 0
    const idx = unresolvedMatches.findIndex(
      (match) => match.requirement_id === requestedRequirementId,
    )
    return idx >= 0 ? idx : 0
  }, [requestedRequirementId, unresolvedMatches])

  const numericScore = Number(score)
  const autoOpen = Number.isFinite(numericScore) && numericScore < 70 && unresolvedMatches.length > 0

  const activeIndex = initialIndex

  const safeActiveIndex =
    unresolvedMatches.length === 0
      ? 0
      : Math.min(activeIndex, unresolvedMatches.length - 1)
  const active = unresolvedMatches[safeActiveIndex] ?? null
  const openingMessage = buildLowFitCoachOpeningMessage(score, unresolvedMatches.length)

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
    <div className="hw-card px-5 py-4 border-l-4 border-l-primary">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-primary" />
            <p className="hw-section-label">Prove Fit</p>
            <span className="rounded border border-primary/20 bg-primary/5 px-2 py-0.5 text-[10px] font-semibold uppercase text-primary">
              Match Interview
            </span>
          </div>
          <p className="mt-2 text-sm font-semibold text-foreground">{active.requirement_text}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Let&apos;s prove this job fit. I&apos;ll only ask about what I can&apos;t verify from your background.
          </p>
        </div>

      </div>

      <RequirementCoachModal
        autoOpen={autoOpen}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) router.refresh()
        }}
        onStepSaved={(mode) => {
          if (mode === "answer" || mode === "skip") {
            const hasNext = safeActiveIndex + 1 < unresolvedMatches.length
            if (hasNext) {
              const nextIndex = safeActiveIndex + 1
              const next = unresolvedMatches[nextIndex]
              if (next) setResolveParam(next.requirement_id)
            } else {
              setResolveParam(null)
            }
          }
        }}
        jobId={jobId}
        jobTitle={jobTitle}
        company={company}
        score={score}
        status={status}
        gaps={[active.requirement_text]}
        openingMessage={openingMessage}
        requirement={{
            requirement_id: active.requirement_id,
            requirement_text: active.requirement_text,
            requirement_type: inferRequirementType(active.requirement_text),
            priority: active.priority,
            status: active.status,
            current_proof: active.matched_evidence_titles ?? [],
            proof_needed: active.proof_needed ?? [],
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
            if (prev) setResolveParam(prev.requirement_id)
          }
        }}
        onNext={() => {
          const nextIndex = safeActiveIndex + 1
          if (nextIndex < unresolvedMatches.length) {
            const next = unresolvedMatches[nextIndex]
            if (next) setResolveParam(next.requirement_id)
          } else {
            setResolveParam(null)
          }
        }}
      />
    </div>
  )
}
