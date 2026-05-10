// JobIntakeForm.tsx
"use client"
import React, { useState } from "react"

export function JobIntakeForm({ onSubmit }: { onSubmit: (url: string) => void }) {
  const [url, setUrl] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    if (!url.trim()) {
      setError("Please enter a job URL.")
      return
    }
    setLoading(true)
    try {
      await onSubmit(url.trim())
      setUrl("")
    } catch (err: any) {
      setError(err?.message || "Failed to analyze job.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form className="flex gap-2 mb-2" onSubmit={handleSubmit}>
      <input
        type="url"
        placeholder="Paste job URL (LinkedIn, Lever, Greenhouse, Workday, etc.)"
        className="flex-1 rounded-lg border border-border px-4 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary"
        value={url}
        onChange={e => setUrl(e.target.value)}
        disabled={loading}
      />
      <button type="submit" className="rounded-lg bg-primary text-white px-4 py-2 font-medium hover:bg-primary/90 transition-colors" disabled={loading}>
        {loading ? "Analyzing..." : "Analyze Job"}
      </button>
    </form>
  )
}
