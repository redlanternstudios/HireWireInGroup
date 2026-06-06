"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

type BlockedRequirement = {
  requirement_id: string
  requirement_text: string
  status: string
}

function requirementAnchorId(requirementId: string) {
  const safeId = requirementId
    .trim()
    .replace(/[^a-zA-Z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")

  return `req-${safeId || "unknown"}`
}

export function GenerateButton({
  jobId,
  disabled = false,
  disabledReason,
}: {
  jobId: string
  disabled?: boolean
  disabledReason?: string | null
}) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [blockedRequirements, setBlockedRequirements] = useState<BlockedRequirement[]>([])
  const [nextActionHref, setNextActionHref] = useState<string | null>(null)
  const router = useRouter()

  const handleGenerate = async () => {
    if (disabled) return
    setIsLoading(true)
    setError(null)
    setBlockedRequirements([])
    setNextActionHref(null)

    try {
      const res = await fetch("/api/generate-documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ job_id: jobId }),
      })
      const data = await res.json().catch(() => ({}))

      if (!res.ok || !data.success) {
        const message =
          data.reason ??
          data.detail ??
          data.user_message ??
          data.error ??
          data.message ??
          "Generation failed"

        if (data.error === "evidence_required") {
          setError(
            data.user_message ??
              "No evidence found in your library. Upload a resume or add evidence manually before generating."
          )
        } else if (data.error === "matching_incomplete") {
          setError(
            data.user_message ??
              "Run Prove Fit before generating documents."
          )
        } else if (data.error === "coach_step_required") {
          setError(
            data.user_message ??
              "Answer or skip the Match Interview prompts before generating documents."
          )
        } else if (data.error === "prove_fit_required") {
          setError(
            data.user_message ??
              "Run Prove Fit before generating documents."
          )
          if (data.next_action?.href && typeof data.next_action.href === "string") {
            setNextActionHref(data.next_action.href)
          }
        } else if (data.error === "capability_packets_required") {
          setError(
            data.user_message ??
              "Resolve missing requirement proof before generating."
          )
          if (Array.isArray(data.blocked_requirements)) {
            setBlockedRequirements(
              data.blocked_requirements
                .filter((item: unknown) => item && typeof item === "object")
                .map((item: Record<string, unknown>) => ({
                  requirement_id: String(item.requirement_id ?? ""),
                  requirement_text: String(item.requirement_text ?? ""),
                  status: String(item.status ?? "unknown"),
                }))
                .filter((item: BlockedRequirement) => item.requirement_id.length > 0),
            )
          }
          if (data.next_action?.href && typeof data.next_action.href === "string") {
            setNextActionHref(data.next_action.href)
          }
        } else if (data.error === "generation_limit_reached") {
          setError(
            data.user_message ??
              "You've reached your monthly limit of 5 document generations. Upgrade to Pro for unlimited generations."
          )
        } else if (data.error === "governance_blocked") {
          setError(message)
        } else {
          setError(message)
        }
        return
      }

      router.push(`/jobs/${jobId}/documents`)
      router.refresh()
    } catch {
      setError("Something went wrong. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-2">
      <button
        onClick={handleGenerate}
        disabled={isLoading || disabled}
        className="w-full rounded-lg hw-btn-primary px-4 py-2.5 text-sm disabled:opacity-50 transition-all"
      >
        {isLoading ? "Generating documents…" : "Generate resume & cover letter"}
      </button>
      {disabled && disabledReason && (
        <p className="text-xs text-amber-600 text-center">{disabledReason}</p>
      )}
      {isLoading && (
        <p className="text-xs text-muted-foreground text-center">
          This takes 20–40 seconds — building tailored materials from your evidence…
        </p>
      )}
      {error && (
        <p className="text-sm text-red-500 text-center">{error}</p>
      )}
      {blockedRequirements.length > 0 && (
        <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-left">
          <p className="text-xs font-semibold text-amber-800">Claims needing judgment</p>
          <ul className="mt-1 space-y-1">
            {blockedRequirements.slice(0, 5).map((item) => (
              <li key={item.requirement_id}>
                <a
                  className="text-xs text-amber-800 underline hover:text-amber-900"
                  href={`/jobs/${jobId}/evidence-match?req=${encodeURIComponent(item.requirement_id)}#${requirementAnchorId(item.requirement_id)}`}
                >
                  {item.requirement_text || item.requirement_id}
                </a>
              </li>
            ))}
          </ul>
          {nextActionHref ? (
            <a
              href={nextActionHref}
              className="mt-2 inline-block text-xs font-medium text-amber-900 underline"
            >
              Prove Fit
            </a>
          ) : null}
        </div>
      )}
    </div>
  )
}
