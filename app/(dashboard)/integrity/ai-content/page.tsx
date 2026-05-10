import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import React from "react"

export const dynamic = "force-dynamic"
export const revalidate = 0

export default async function AIContentPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">AI-Generated Content Detector</h1>
        <p className="text-sm text-muted-foreground">Detect and flag AI-generated or generic language in your resume.</p>
      </div>
      <AIContentChecker />
    </div>
  )
}

function AIContentChecker() {
  const [resumeText, setResumeText] = React.useState("")
  const [loading, setLoading] = React.useState(false)
  const [flags, setFlags] = React.useState<any[]>([])
  const [error, setError] = React.useState<string | null>(null)

  async function handleCheck(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setFlags([])
    try {
      const res = await fetch("/api/integrity/ai-content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeText })
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.error || "Check failed")
      setFlags(data.flags)
    } catch (err: any) {
      setError(err.message || "Unknown error")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleCheck} className="space-y-4">
      <textarea className="w-full border rounded p-2" rows={6} placeholder="Paste resume text" value={resumeText} onChange={e => setResumeText(e.target.value)} required />
      <button type="submit" className="btn btn-primary" disabled={loading}>Detect AI Content</button>
      {loading && <div className="text-xs text-muted-foreground">Checking...</div>}
      {error && <div className="text-xs text-destructive">{error}</div>}
      {flags.length > 0 && (
        <div className="mt-4 space-y-2">
          {flags.map((f, i) => (
            <div key={i} className="border rounded p-3 bg-muted">
              <div className="font-medium text-foreground">Section: {f.section}</div>
              <div className="text-xs">AI Confidence: {(f.ai_confidence_score * 100).toFixed(0)}%</div>
              {f.flagged_phrases && f.flagged_phrases.length > 0 && (
                <div className="text-warning text-xs mt-1">Flagged: {f.flagged_phrases.join(", ")}</div>
              )}
            </div>
          ))}
        </div>
      )}
      {!loading && !flags.length && !error && <div className="text-muted-foreground text-xs">No AI-generated content flagged yet.</div>}
    </form>
  )
}
