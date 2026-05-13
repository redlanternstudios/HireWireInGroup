"use client"

import { useEffect } from "react"

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // Log error to console for debugging
    console.error("[GlobalError]", error)
  }, [error])

  return (
    <html lang="en">
      <body>
        <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "2rem", fontFamily: "system-ui, sans-serif", background: "#f0ede8", textAlign: "center", gap: "1rem" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/hirewire-logo.png" alt="HireWire" style={{ height: "40px", marginBottom: "0.5rem" }} />
          <h2 style={{ fontSize: "1.125rem", fontWeight: 600, color: "#1a1714", margin: 0 }}>Something went wrong</h2>
          <p style={{ fontSize: "0.875rem", color: "#6b6560", maxWidth: "360px", margin: 0 }}>
            HireWire ran into a critical error. Your data is safe. Try reloading the page.
          </p>
          {error.digest && (
            <p style={{ fontSize: "0.75rem", color: "#9b9590", fontFamily: "monospace", margin: 0 }}>
              Ref: {error.digest}
            </p>
          )}
          <button
            onClick={reset}
            style={{ padding: "0.5rem 1.25rem", backgroundColor: "#BD0A0A", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "0.875rem", fontWeight: 500 }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  )
}
