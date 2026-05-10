"use client"

import { useEffect } from "react"

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // Log error to console for debugging
    console.error("[GlobalError]", error)
  }, [error])

  return (
    <html>
      <body>
          <ErrorCard
            title="Something went wrong"
            message={error.message || 'An unexpected error occurred.'}
            actionLabel="Try again"
            onAction={reset}
            severity="critical"
            correlationId={error.digest}
            retryable
          />
      </body>
    </html>
  )
}
