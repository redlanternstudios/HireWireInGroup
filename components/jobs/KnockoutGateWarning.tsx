import Link from "next/link"
import { ShieldAlert, ArrowRight } from "lucide-react"

/**
 * KnockoutGateWarning
 *
 * Appears on the job detail page when the employer has hard-gate requirements
 * the user cannot satisfy (e.g. security clearance, a required certification,
 * a mandatory degree). These conditions are typically auto-rejected at the ATS
 * before a human reviews the application.
 *
 * Pure display component — no backend calls, no routing logic. Codex wires the
 * `requirements` prop in during P3-T2.
 */

export type KnockoutRequirement = {
  requirement_id: string
  explanation: string
}

export function KnockoutGateWarning({
  requirements,
}: {
  requirements: KnockoutRequirement[]
}) {
  if (!requirements || requirements.length === 0) return null

  return (
    <div className="hw-card border-amber-200 bg-amber-50/60 p-5">
      <div className="flex items-start gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-100">
          <ShieldAlert className="h-4 w-4 text-amber-700" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold text-amber-900">
            Hard gate detected at this employer
          </h3>

          <ul className="mt-3 flex flex-col gap-2">
            {requirements.map((req) => (
              <li key={req.requirement_id} className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
                <span className="text-xs leading-relaxed text-amber-900/90">
                  {req.explanation}
                </span>
              </li>
            ))}
          </ul>

          <p className="mt-3 text-xs leading-relaxed text-amber-800/80">
            This condition is likely auto-rejected at the ATS before a human
            reviews your application.
          </p>

          <Link
            href="/coach"
            className="mt-4 inline-flex items-center gap-1.5 rounded-md border border-amber-300 bg-white/70 px-3 py-1.5 text-xs font-medium text-amber-900 transition-colors hover:bg-white"
          >
            Discuss with Coach
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </div>
    </div>
  )
}

export default KnockoutGateWarning
