"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"

export default function AuthError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("[hirewire] Auth error:", error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background">
      <div className="text-center space-y-4 max-w-md">
        <h2 className="text-xl font-semibold text-foreground">Something went wrong</h2>
        <p className="text-sm text-muted-foreground">
          HireWire ran into an issue. Try again or contact support if this keeps happening.
        </p>
        <Button onClick={reset}>Try again</Button>
      </div>
    </div>
  )
}
