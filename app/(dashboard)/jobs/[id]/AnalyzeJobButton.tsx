"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Zap } from "lucide-react"

interface AnalyzeJobButtonProps {
  jobId: string
  hasUrl: boolean
  label?: string
  size?: "sm" | "default"
}

export function AnalyzeJobButton({ jobId, hasUrl, label = "Analyze Job", size = "default" }: AnalyzeJobButtonProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  if (!hasUrl) {
    return (
      <div className="flex flex-col gap-2">
        <button
          disabled
          className={[
            "inline-flex items-center justify-center gap-2 rounded-lg font-semibold opacity-50 cursor-not-allowed",
            "bg-primary text-primary-foreground",
            size === "sm" ? "px-3 py-1.5 text-xs" : "px-4 py-2.5 text-sm",
          ].join(" ")}
        >
          <Zap className={size === "sm" ? "h-3 w-3" : "h-4 w-4"} />
          {label}
        </button>
        <p className="text-xs text-muted-foreground">
          This job has no URL. Add a job URL to enable analysis.
        </p>
      </div>
    )
  }

  async function handleAnalyze() {
    setLoading(true)
    setError(null)

    try {
      const res = await fetch("/api/re-analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ job_id: jobId }),
      })

      const data = await res.json()

      if (!data.success) {
        setError(data.error || "Analysis failed. Please try again.")
        setLoading(false)
        return
      }

      // Refresh the page to show updated analysis
      router.refresh()
    } catch {
      setError("Network error. Please try again.")
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={handleAnalyze}
        disabled={loading}
        className={[
          "inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-all",
          "hw-btn-primary",
          loading ? "opacity-70 cursor-wait" : "",
          size === "sm" ? "px-3 py-1.5 text-xs" : "px-4 py-2.5 text-sm w-full",
        ].join(" ")}
      >
        {loading ? (
          <>
            <Loader2 className={`animate-spin ${size === "sm" ? "h-3 w-3" : "h-4 w-4"}`} />
            Analyzing...
          </>
        ) : (
          <>
            <Zap className={size === "sm" ? "h-3 w-3" : "h-4 w-4"} />
            {label}
          </>
        )}
      </button>
      {loading && (
        <p className="text-xs text-muted-foreground text-center">
          Fetching and analyzing job requirements — usually 15–30 seconds.
        </p>
      )}
      {error && (
        <p className="text-xs text-red-600">{error}</p>
      )}
    </div>
  )
}
