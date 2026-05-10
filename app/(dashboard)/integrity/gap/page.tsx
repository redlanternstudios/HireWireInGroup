import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import React from "react"

export const dynamic = "force-dynamic"
export const revalidate = 0

export default async function GapPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Job-to-Profile Reality Gap Analyzer</h1>
        <p className="text-sm text-muted-foreground">See which job requirements are a fit, stretch, or reach for your profile.</p>
      </div>
      <GapAnalyzer />
    </div>
  )
}

function GapAnalyzer() {
  const [jobDescription, setJobDescription] = React.useState("")
  const [resume, setResume] = React.useState("")
  const [loading, setLoading] = React.useState(false)
  const [results, setResults] = React.useState<any[]>([])
  const [error, setError] = React.useState<string | null>(null)

  async function handleCheck(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setResults([])
    try {
      const res = await fetch("/api/integrity/gap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobDescription, resume })
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.error || "Check failed")
      setResults(data.results)
    } catch (err: any) {
      setError(err.message || "Unknown error")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleCheck} className="space-y-4">
      <textarea className="w-full border rounded p-2" rows={4} placeholder="Paste job description" value={jobDescription} onChange={e => setJobDescription(e.target.value)} required />
      <textarea className="w-full border rounded p-2" rows={4} placeholder="Paste resume JSON" value={resume} onChange={e => setResume(e.target.value)} required />
      <button type="submit" className="btn btn-primary" disabled={loading}>Analyze Gap</button>
      {loading && <div className="text-xs text-muted-foreground">Checking...</div>}
      {error && <div className="text-xs text-destructive">{error}</div>}
      {results.length > 0 && (
        <div className="mt-4 space-y-2">
          {results.map((r, i) => (
            <div key={i} className="border rounded p-3 bg-muted">
              <div className="font-medium text-foreground">{r.skill}</div>
              <div className={
                r.match === "fit"
                  ? "text-success"
                  : r.match === "stretch"
                  ? "text-warning"
                  : "text-destructive"
              }>
                {r.match.toUpperCase()} — {r.reason}
              </div>
            </div>
          ))}
        </div>
      )}
      {!loading && !results.length && !error && <div className="text-muted-foreground text-xs">No gap analysis results yet.</div>}
    </form>
  )
}
