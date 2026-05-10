// components/integrity/ResumeIntegrityFlags.tsx
import React from "react"

export type ResumeIntegrityFlag = {
  bullet: string
  risk_score: number
  risk_level: "low" | "medium" | "high"
  flag_reason?: string
  suggested_rewrite?: string
}

type Props = {
  flags: ResumeIntegrityFlag[]
}

export function ResumeIntegrityFlags({ flags }: Props) {
  if (!flags.length) return null
  return (
    <div className="space-y-4">
      {flags.map((f, i) => (
        <div key={i} className="border rounded p-4 bg-muted">
          <div className="font-medium text-foreground">{f.bullet}</div>
          <div className="text-sm mt-1">
            <span className={
              f.risk_level === "high"
                ? "text-destructive"
                : f.risk_level === "medium"
                ? "text-warning"
                : "text-success"
            }>
              {f.risk_level.toUpperCase()} RISK
            </span>
            {f.flag_reason && <span className="ml-2 text-muted-foreground">{f.flag_reason}</span>}
          </div>
          {f.suggested_rewrite && (
            <div className="mt-2 text-sm text-primary">
              Suggested rewrite: {f.suggested_rewrite}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
