"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("[v0] Global error:", error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background">
      <div className="text-center space-y-4 max-w-md">
        <ErrorCard
          title="Something went wrong"
          message={error.message || 'An unexpected error occurred.'}
          actionLabel="Try again"
          onAction={reset}
          severity="error"
          correlationId={error.digest}
          retryable
        />
      </div>
    </div>
  )
}
