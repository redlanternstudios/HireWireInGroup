"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

export function RebuildEvidenceMapButton({ jobId }: { jobId: string }) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const onClick = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/jobs/${jobId}/rebuild-evidence-map`, {
        method: "POST",
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data.success) {
        setError(data.user_message ?? data.error ?? "Retry failed")
        return
      }
      router.refresh()
    } catch {
      setError("Retry failed")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={onClick}
        disabled={isLoading}
        className="rounded-md border border-red-300 bg-white px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
      >
        {isLoading ? "Rebuilding..." : "Retry evidence mapping"}
      </button>
      {error ? <p className="text-xs text-red-700">{error}</p> : null}
    </div>
  )
}
