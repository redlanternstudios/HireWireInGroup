"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

export function GenerateButton({ jobId }: { jobId: string }) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleGenerate = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const res = await fetch("/api/generate-documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ job_id: jobId }),
      })
      const data = await res.json()

      if (!res.ok || !data.success) {
        if (data.error === "evidence_required") {
          setError(
            data.user_message ??
              "No evidence found in your library. Upload a resume or add evidence manually before generating."
          )
        } else if (data.error === "matching_incomplete") {
          setError(
            data.user_message ??
              "Complete evidence matching before generating documents."
          )
        } else if (data.error === "generation_limit_reached") {
          setError(
            data.user_message ??
              "You've reached your monthly limit of 5 document generations. Upgrade to Pro for unlimited generations."
          )
        } else {
          setError(data.error ?? "Generation failed — please try again.")
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
        disabled={isLoading}
        className="w-full rounded-lg hw-btn-primary px-4 py-2.5 text-sm disabled:opacity-50 transition-all"
      >
        {isLoading ? "Generating documents…" : "Generate resume & cover letter"}
      </button>
      {isLoading && (
        <p className="text-xs text-muted-foreground text-center">
          This takes 20–40 seconds — building tailored materials from your evidence…
        </p>
      )}
      {error && (
        <p className="text-sm text-red-500 text-center">{error}</p>
      )}
    </div>
  )
}
