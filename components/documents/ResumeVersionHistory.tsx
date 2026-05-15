"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { restoreResumeVersion } from "@/lib/actions/resume-versions"
import type { ResumeVersion } from "@/lib/actions/resume-versions"
import { CheckCircle, XCircle, RotateCcw, Clock } from "lucide-react"

interface ResumeVersionHistoryProps {
  jobId: string
  versions: ResumeVersion[]
}

export default function ResumeVersionHistory({ jobId, versions }: ResumeVersionHistoryProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [restoringId, setRestoringId] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<{ id: string; ok: boolean; msg: string } | null>(null)

  if (versions.length === 0) return null

  function handleRestore(versionId: string) {
    setRestoringId(versionId)
    setFeedback(null)
    startTransition(async () => {
      const result = await restoreResumeVersion(jobId, versionId)
      setRestoringId(null)
      if (result.success) {
        setFeedback({ id: versionId, ok: true, msg: "Restored — editor updated" })
        router.refresh()
      } else {
        setFeedback({ id: versionId, ok: false, msg: result.error ?? "Restore failed" })
      }
    })
  }

  return (
    <div className="hw-card p-4 space-y-3">
      <div className="flex items-center gap-1.5">
        <Clock className="h-3.5 w-3.5 text-muted-foreground" />
        <h3 className="text-sm font-semibold">Version History</h3>
        <span className="ml-auto text-[11px] text-muted-foreground">{versions.length} saved</span>
      </div>

      <div className="space-y-2">
        {versions.map((v, i) => (
          <div key={v.id} className="flex items-start gap-2 py-2 border-b border-border last:border-0">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-medium text-foreground">v{v.version_number}</span>
                {i === 0 && (
                  <span className="text-[10px] bg-emerald-100 text-emerald-700 rounded px-1.5 py-0.5 font-medium">current</span>
                )}
                {v.quality_passed === true && (
                  <CheckCircle className="h-3 w-3 text-emerald-500 shrink-0" />
                )}
                {v.quality_passed === false && (
                  <XCircle className="h-3 w-3 text-rose-400 shrink-0" />
                )}
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {new Date(v.created_at).toLocaleString(undefined, {
                  month: "short", day: "numeric",
                  hour: "numeric", minute: "2-digit",
                })}
                {v.strategy && <> · <span className="capitalize">{v.strategy.replace(/_/g, " ")}</span></>}
              </p>
              {feedback?.id === v.id && (
                <p className={`text-[11px] mt-0.5 font-medium ${feedback.ok ? "text-emerald-600" : "text-rose-500"}`}>
                  {feedback.msg}
                </p>
              )}
            </div>
            {i !== 0 && (
              <button
                onClick={() => handleRestore(v.id)}
                disabled={isPending && restoringId === v.id}
                className="shrink-0 flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground border border-border rounded px-2 py-1 hover:bg-muted transition-colors disabled:opacity-50"
                title={`Restore v${v.version_number}`}
              >
                <RotateCcw className="h-3 w-3" />
                {isPending && restoringId === v.id ? "…" : "Restore"}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
