"use client"

import { useState, useTransition } from "react"
import { acceptApplicationPackage, overridePackageQuality } from "@/lib/actions/package"
import { useRouter } from "next/navigation"

type BulletTrace = {
  bullet_text?: string
  source_evidence_id?: string
  source_evidence_title?: string
  source_packet_id?: string
  matched_requirement_text?: string
  match_strength?: string
  match_reason?: string
  evidence_strength?: string
  proof_decision?: string
  user_claim?: string | null
  proof_snippets?: string[]
  why_included?: string
  risk_flags?: string[]
  truth_serum?: {
    score?: number
    flags?: string[]
    generic?: boolean
    ungrounded?: boolean
    any_pm_applicability?: boolean
  }
}

type ConfirmedProofUsage = {
  packet_id?: string
  requirement?: string
  evidence_ids?: string[]
  user_claim?: string | null
  used?: boolean
  used_in?: string[]
  generated_claims?: string[]
}

function getBulletTraces(job: any): BulletTrace[] {
  const map = job?.evidence_map
  if (!map || typeof map !== "object" || Array.isArray(map)) return []
  return Array.isArray(map.bullet_provenance) ? map.bullet_provenance : []
}

function getConfirmedProofUsage(job: any): ConfirmedProofUsage[] {
  const trace = job?.evidence_map?.generation_trace
  if (!trace || typeof trace !== "object" || Array.isArray(trace)) return []
  return Array.isArray(trace.confirmed_proof_usage) ? trace.confirmed_proof_usage : []
}

export default function ApplicationPackagePreview({
  job,
  readiness,
}: {
  job: any
  readiness: any
  userId: string
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [status, setStatus] = useState<string | null>(null)
  const [accepting, setAccepting] = useState(false)
  // Override state — shown when quality has failed
  const [showOverrideForm, setShowOverrideForm] = useState(false)
  const [overrideReason, setOverrideReason] = useState("")
  const [overriding, setOverriding] = useState(false)

  const handleAccept = () => {
    setAccepting(true)
    startTransition(async () => {
      const result = await acceptApplicationPackage(
        job.id,
        null,
        {
          resumeFormat: job.resume_format,
          resumeFont: job.resume_font,
        },
      )
      setAccepting(false)
      if (result.error) {
        setStatus(result.error)
      } else {
        setStatus("Accepted! Redirecting...")
        router.push(`/ready-to-apply?jobId=${job.id}`)
      }
    })
  }

  const handleOverride = () => {
    const trimmed = overrideReason.trim()
    if (!trimmed) {
      setStatus("A reason is required to override quality.")
      return
    }
    setOverriding(true)
    startTransition(async () => {
      const result = await overridePackageQuality(job.id, trimmed, {
        resumeFormat: job.resume_format,
        resumeFont: job.resume_font,
      })
      setOverriding(false)
      if (result.error) {
        setStatus(`Override error: ${result.error}`)
      } else {
        setStatus("Override logged. Redirecting...")
        router.push(`/ready-to-apply?jobId=${job.id}`)
      }
    })
  }

  const bulletTraces = getBulletTraces(job)
  const confirmedProofUsage = getConfirmedProofUsage(job)

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
          <li>
            <span className={readiness.checklist.coach ? "text-emerald-600" : "text-rose-600"}>
              {readiness.checklist.coach ? "✔" : "✗"} Coach step
            </span>
          </li>
          <li>
            <span className={readiness.checklist.quality ? "text-emerald-600" : "text-rose-600"}>
              {readiness.checklist.quality ? "✔" : "✗"} Quality check
            </span>
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

      {bulletTraces.length > 0 && (
        <div className="hw-card p-4">
        <h3 className="font-semibold mb-2 text-sm">Bullet Trace</h3>
          <p className="mb-3 text-xs text-muted-foreground">
            TruthSerum trace: every visible claim links back to confirmed, auto-mapped, or intentionally skipped proof.
          </p>
          <div className="space-y-3">
            {bulletTraces.map((trace, index) => {
              const flags = trace.truth_serum?.flags ?? trace.risk_flags ?? []
              const score = trace.truth_serum?.score
              return (
                <details key={`${trace.source_packet_id ?? trace.source_evidence_id ?? index}-${index}`} className="rounded-md border border-border p-3">
                  <summary className="cursor-pointer text-xs font-medium text-foreground">
                    {trace.bullet_text ?? `Bullet ${index + 1}`}
                  </summary>
                  <div className="mt-3 space-y-2 text-xs text-muted-foreground">
                    <div>
                      <span className="font-medium text-foreground">Packet:</span>{" "}
                      {trace.source_packet_id ?? "Missing"}
                    </div>
                    <div>
                      <span className="font-medium text-foreground">Requirement:</span>{" "}
                      {trace.matched_requirement_text ?? "Not linked"}
                    </div>
                    <div>
                      <span className="font-medium text-foreground">Provenance:</span>{" "}
                      {trace.proof_decision ? trace.proof_decision.replace(/_/g, " ") : "Unknown"}
                    </div>
                    <div>
                      <span className="font-medium text-foreground">Evidence:</span>{" "}
                      {trace.source_evidence_title ?? trace.source_evidence_id ?? "Missing"}
                    </div>
                    {trace.user_claim && (
                      <div>
                        <span className="font-medium text-foreground">Confirmed claim:</span>{" "}
                        {trace.user_claim}
                      </div>
                    )}
                    <div>
                      <span className="font-medium text-foreground">Match:</span>{" "}
                      {trace.match_strength ?? "Unknown"}
                      {trace.evidence_strength ? ` · Evidence ${trace.evidence_strength}` : ""}
                      {typeof score === "number" ? ` · TruthSerum ${score}` : ""}
                    </div>
                    {trace.match_reason && (
                      <div>
                        <span className="font-medium text-foreground">Reason:</span>{" "}
                        {trace.match_reason}
                      </div>
                    )}
                    {trace.why_included && (
                      <div>
                        <span className="font-medium text-foreground">Why included:</span>{" "}
                        {trace.why_included}
                      </div>
                    )}
                    {Array.isArray(trace.proof_snippets) && trace.proof_snippets.length > 0 && (
                      <div>
                        <span className="font-medium text-foreground">Proof:</span>
                        <ul className="mt-1 list-disc pl-4">
                          {trace.proof_snippets.slice(0, 3).map((snippet) => (
                            <li key={snippet}>{snippet}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {flags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {flags.slice(0, 8).map((flag) => (
                          <span key={flag} className="rounded border border-amber-200 bg-amber-50 px-1.5 py-0.5 text-[10px] text-amber-700">
                            {flag.replace(/_/g, " ")}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </details>
              )
            })}
          </div>
        </div>
      )}

      {confirmedProofUsage.length > 0 && (
        <div className="hw-card p-4">
          <h3 className="font-semibold mb-2 text-sm">Confirmed Proof Usage</h3>
          <div className="space-y-2">
            {confirmedProofUsage.map((proof, index) => (
              <div key={`${proof.packet_id ?? index}-${index}`} className="rounded-md border border-border p-3 text-xs">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-medium text-foreground">
                      {proof.requirement ?? "Confirmed proof"}
                    </div>
                    {proof.user_claim && (
                      <div className="mt-1 text-muted-foreground">{proof.user_claim}</div>
                    )}
                  </div>
                  <span className={proof.used ? "text-emerald-600" : "text-rose-600"}>
                    {proof.used ? "Used" : "Not used"}
                  </span>
                </div>
                {proof.used_in && proof.used_in.length > 0 && (
                  <div className="mt-2 text-muted-foreground">
                    Appears in: {proof.used_in.join(", ").replace(/_/g, " ")}
                  </div>
                )}
                {proof.generated_claims && proof.generated_claims.length > 0 && (
                  <ul className="mt-2 list-disc pl-4 text-muted-foreground">
                    {proof.generated_claims.slice(0, 2).map((claim) => (
                      <li key={claim}>{claim}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

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

      {/* Accept / Override / Return CTA */}
      <div className="mt-6 space-y-2">
        {job.quality_passed !== false ? (
          /* Quality passed — primary accept CTA */
          <button
            className="hw-btn-primary w-full"
            disabled={accepting || isPending || job.package_review_status === "accepted"}
            onClick={handleAccept}
          >
            {accepting ? "Accepting…" : "Accept & Continue to Apply"}
          </button>
        ) : (
          /* Quality failed — return is primary; override is secondary/subdued */
          <>
            <button
              className="w-full rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors"
              onClick={() => router.push(`/jobs/${job.id}`)}
            >
              Return to job
            </button>

            {!showOverrideForm ? (
              <button
                className="w-full rounded-lg border border-border px-4 py-2 text-xs font-medium text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors"
                onClick={() => setShowOverrideForm(true)}
                type="button"
              >
                Override and accept
              </button>
            ) : (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 space-y-2">
                <p className="text-xs font-semibold text-amber-800">
                  Override quality check
                </p>
                <p className="text-xs text-amber-700">
                  Explain why this package should be accepted despite the quality failure. This will be logged.
                </p>
                <textarea
                  className="w-full rounded border border-amber-300 bg-white px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-1 focus:ring-amber-400"
                  rows={3}
                  placeholder="e.g. Reviewed manually — drift is minor and within acceptable range."
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                />
                <div className="flex items-center gap-2">
                  <button
                    className="flex-1 rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-700 disabled:opacity-50 transition-colors"
                    disabled={!overrideReason.trim() || overriding || isPending}
                    onClick={handleOverride}
                    type="button"
                  >
                    {overriding ? "Logging override…" : "Confirm override"}
                  </button>
                  <button
                    className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
                    onClick={() => { setShowOverrideForm(false); setOverrideReason("") }}
                    type="button"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {status && <div className="mt-1 text-xs text-muted-foreground">{status}</div>}
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
