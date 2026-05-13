"use client"

import { useState, useTransition } from "react"
import { acceptApplicationPackage, markPackageNeedsReview } from "@/lib/actions/package-review"
import { approveQualityManually } from "@/lib/actions/documents"
import { useRouter } from "next/navigation"

export default function ApplicationPackagePreview({
  job,
  readiness,
  userId,
}: {
  job: any
  readiness: any
  userId: string
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [status, setStatus] = useState<string | null>(null)
  const [accepting, setAccepting] = useState(false)
  const [approvingQuality, setApprovingQuality] = useState(false)

  const handleApproveQuality = () => {
    if (!confirm("Manually approve quality? This overrides the AI quality check and will be logged.")) return
    setApprovingQuality(true)
    startTransition(async () => {
      const result = await approveQualityManually(job.id)
      setApprovingQuality(false)
      if (result.error) {
        setStatus(`Error: ${result.error}`)
      } else {
        router.refresh()
      }
    })
  }

  const handleAccept = () => {
    setAccepting(true)
    startTransition(async () => {
      const result = await acceptApplicationPackage(
        job.id,
        job.resume_format,
        job.resume_font,
        userId
      )
      setAccepting(false)
      if (result.error) {
        setStatus(result.error)
      } else {
        setStatus("Accepted! Redirecting...")
        router.push(`/ready-to-apply?job=${job.id}`)
      }
    })
  }

  // If job is edited after acceptance, mark as needs_review
  // (This should be triggered by parent/editor on edit)

  return (
    <div className="space-y-6">
      {/* Readiness checklist */}
      <div>
        <h2 className="text-lg font-semibold mb-2">Readiness Checklist</h2>
        <ul className="space-y-1 text-sm">
          <li>
            <span className={readiness.checklist.resume ? "text-emerald-600" : "text-rose-600"}>
              {readiness.checklist.resume ? "✔" : "✗"} Resume exists
            </span>
          </li>
          <li>
            <span className={readiness.checklist.coverLetter ? "text-emerald-600" : "text-rose-600"}>
              {readiness.checklist.coverLetter ? "✔" : "✗"} Cover letter exists
            </span>
          </li>
          <li>
            <span className={readiness.checklist.evidence ? "text-emerald-600" : "text-rose-600"}>
              {readiness.checklist.evidence ? "✔" : "✗"} Evidence coverage
            </span>
          </li>
          <li className="flex items-center gap-2 flex-wrap">
            <span className={readiness.checklist.quality ? "text-emerald-600" : "text-rose-600"}>
              {readiness.checklist.quality ? "✔" : "✗"} Quality check
            </span>
            {job.quality_passed === false && (
              <button
                className="text-[10px] text-muted-foreground underline hover:text-foreground transition-colors disabled:opacity-50"
                onClick={handleApproveQuality}
                disabled={approvingQuality || isPending}
                type="button"
              >
                {approvingQuality ? "Approving…" : "Approve manually"}
              </button>
            )}
          </li>
          {readiness.checklist.voiceIntegrity !== undefined && (
            <li>
              <span className={readiness.checklist.voiceIntegrity ? "text-emerald-600" : "text-rose-600"}>
                {readiness.checklist.voiceIntegrity ? "✔" : "✗"} Voice integrity
              </span>
            </li>
          )}
          <li>
            <span className={job.package_review_status === "accepted" ? "text-emerald-600" : "text-rose-600"}>
              {job.package_review_status === "accepted" ? "✔" : "✗"} Application Package Reviewed
            </span>
          </li>
        </ul>
      </div>

      {/* Evidence and Quality Summary */}
      <div className="hw-card p-4">
        <h3 className="font-semibold mb-2 text-sm">Evidence & Quality</h3>
        <div className="mb-2">
          <span className="text-xs text-muted-foreground">Evidence coverage: </span>
          <span className={readiness.checklist.evidence ? "text-emerald-600" : "text-rose-600"}>
            {readiness.checklist.evidence ? "Sufficient" : "Insufficient"}
          </span>
        </div>
        <div className="mb-2">
          <span className="text-xs text-muted-foreground">Quality check: </span>
          <span className={readiness.checklist.quality ? "text-emerald-600" : "text-rose-600"}>
            {readiness.checklist.quality ? "Passed" : "Failed"}
          </span>
        </div>
        {readiness.checklist.voiceIntegrity !== undefined && (
          <div className="mb-2">
            <span className="text-xs text-muted-foreground">Voice integrity: </span>
            <span className={readiness.checklist.voiceIntegrity ? "text-emerald-600" : "text-rose-600"}>
              {readiness.checklist.voiceIntegrity ? "Preserved" : "Drift detected"}
            </span>
          </div>
        )}
        {readiness.blockedReasons.length > 0 && (
          <div className="mt-2 text-xs text-rose-600">
            <strong>Blocked:</strong>
            <ul className="list-disc ml-4">
              {readiness.blockedReasons.map((reason: string) => (
                <li key={reason}>{reason}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Format/Font Display */}
      <div className="hw-card p-4">
        <h3 className="font-semibold mb-2 text-sm">Format & Font</h3>
        <div className="mb-1 text-xs text-muted-foreground">Resume format: <span className="text-foreground font-medium">{job.resume_format}</span></div>
        <div className="mb-1 text-xs text-muted-foreground">Font: <span className="text-foreground font-medium">{job.resume_font}</span></div>
        {job.format_recommendation_reason && (
          <div className="text-xs text-muted-foreground mt-1">{job.format_recommendation_reason}</div>
        )}
      </div>

      {/* Accept/Continue CTA */}
      <div className="mt-6">
        <button
          className="hw-btn-primary w-full"
          disabled={accepting || !readiness.canApply || job.package_review_status === "accepted"}
          onClick={handleAccept}
        >
          Accept & Continue to Apply
        </button>
        {status && <div className="mt-2 text-xs text-muted-foreground">{status}</div>}
      </div>
      <div className="mt-2">
        <button
          className="hw-btn-primary w-full bg-muted text-foreground border"
          onClick={() => router.push(`/jobs/${job.id}/documents?edit=1`)}
        >
          Edit Materials
        </button>
      </div>
    </div>
  )
}
