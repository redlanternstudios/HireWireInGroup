"use client"

import { CheckCircle2, AlertTriangle, HelpCircle, XCircle } from "lucide-react"
import type { DetectedGap } from "@/lib/gap-detection"
import type { FitStrength } from "@/lib/canonical-evidence"

interface ReadinessReviewProps {
  strengths: FitStrength[]
  detectedGaps: DetectedGap[]
  fitLabel: string | null
  overallScore: number | null
  fallbackMatchedSkills: string[]
  fallbackKnownGaps: string[]
}

const MATCH_TYPE_LABELS: Record<string, string> = {
  direct_match: "Direct match",
  partial_match: "Partial match",
  adjacent_transferable: "Transferable experience",
}

const SUGGESTED_ACTION_LABELS: Record<string, string> = {
  clarify: "Answer this question to strengthen your materials",
  add_evidence: "Add evidence to your library",
  skip: "Optional — can proceed without",
}

function deriveReadinessStatus(detectedGaps: DetectedGap[]): {
  label: string
  description: string
  color: string
} {
  const criticalCount = detectedGaps.filter(
    (g) => g.severity === "critical" && g.classification === "missing",
  ).length
  const clarificationCount = detectedGaps.filter(
    (g) => g.classification === "ambiguous",
  ).length

  if (criticalCount === 0 && clarificationCount === 0) {
    return {
      label: "Strong fit",
      description: "Ready to generate",
      color: "text-emerald-700 bg-emerald-50 border-emerald-200",
    }
  }
  if (criticalCount === 0 && clarificationCount > 0) {
    return {
      label: "Good fit, needs input",
      description: `Answer ${clarificationCount} question${clarificationCount > 1 ? "s" : ""} to strengthen materials`,
      color: "text-blue-700 bg-blue-50 border-blue-200",
    }
  }
  if (criticalCount > 0 && criticalCount <= 2) {
    return {
      label: "Apply with positioning",
      description: `${criticalCount} gap${criticalCount > 1 ? "s" : ""} noted — coach can help frame ${criticalCount > 1 ? "them" : "it"}`,
      color: "text-amber-700 bg-amber-50 border-amber-200",
    }
  }
  return {
    label: "Stretch role",
    description: "Review gaps before applying",
    color: "text-red-700 bg-red-50 border-red-200",
  }
}

export function ReadinessReview({
  strengths,
  detectedGaps,
  fitLabel,
  overallScore,
  fallbackMatchedSkills,
  fallbackKnownGaps,
}: ReadinessReviewProps) {
  const ambiguousGaps = detectedGaps.filter(
    (g) => g.classification === "ambiguous" && g.coach_question,
  )
  const criticalGaps = detectedGaps.filter(
    (g) => g.severity === "critical" && g.classification === "missing",
  )

  const hasRichStrengths = strengths.length > 0
  const hasRichGaps = detectedGaps.length > 0
  const hasFallbackStrengths = fallbackMatchedSkills.length > 0
  const hasFallbackGaps = fallbackKnownGaps.length > 0

  const showStrengths = hasRichStrengths || hasFallbackStrengths
  const showGaps = hasRichGaps || hasFallbackGaps

  if (!showStrengths && !showGaps) return null

  const status = hasRichGaps
    ? deriveReadinessStatus(detectedGaps)
    : null

  return (
    <div className="space-y-4">
      {/* Panel 1 — What's Strong */}
      {showStrengths && (
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="text-base font-medium mb-3">What&apos;s strong</h2>
          <ul className="space-y-3">
            {hasRichStrengths
              ? strengths.map((s, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <CheckCircle2 className="h-3.5 w-3.5 text-green-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-medium">{s.requirement}</span>
                      {s.evidence_text && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {s.evidence_text.length > 120
                            ? s.evidence_text.slice(0, 120) + "…"
                            : s.evidence_text}
                        </p>
                      )}
                      {s.match_type && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Matched via {MATCH_TYPE_LABELS[s.match_type] ?? s.match_type}
                        </p>
                      )}
                    </div>
                  </li>
                ))
              : fallbackMatchedSkills.map((skill, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <CheckCircle2 className="h-3.5 w-3.5 text-green-600 shrink-0 mt-0.5" />
                    <span>{skill}</span>
                  </li>
                ))}
          </ul>
        </div>
      )}

      {/* Panel 2 — Needs Clarification */}
      {ambiguousGaps.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="text-base font-medium mb-3">Needs clarification</h2>
          <ul className="space-y-3">
            {ambiguousGaps.map((g, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <HelpCircle className="h-3.5 w-3.5 text-yellow-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-medium">{g.requirement}</span>
                  <p className="text-xs text-muted-foreground mt-0.5">{g.coach_question}</p>
                  {g.suggested_action && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {SUGGESTED_ACTION_LABELS[g.suggested_action] ?? g.suggested_action}
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Panel 3 — Real Gaps */}
      {(criticalGaps.length > 0 || (!hasRichGaps && hasFallbackGaps)) && (
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="text-base font-medium mb-3">Real gaps</h2>
          <ul className="space-y-3">
            {hasRichGaps
              ? criticalGaps.map((g, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <XCircle className="h-3.5 w-3.5 text-red-500 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-medium">{g.requirement}</span>
                      <p className="text-xs text-muted-foreground mt-0.5">{g.gap_description}</p>
                      {g.suggested_action && g.suggested_action !== "skip" && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {SUGGESTED_ACTION_LABELS[g.suggested_action]}
                        </p>
                      )}
                    </div>
                  </li>
                ))
              : fallbackKnownGaps.map((gap, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0 mt-0.5" />
                    <span>{gap.replace(/^Gap:\s*/i, "")}</span>
                  </li>
                ))}
          </ul>
        </div>
      )}

      {/* Panel 4 — Readiness Status */}
      {status && (
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="text-base font-medium mb-3">Readiness</h2>
          <div className={`inline-flex items-center gap-2 rounded border px-3 py-1.5 text-sm font-medium ${status.color}`}>
            {status.label}
          </div>
          <p className="text-xs text-muted-foreground mt-2">{status.description}</p>
        </div>
      )}
    </div>
  )
}
