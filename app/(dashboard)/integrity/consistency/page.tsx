import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import React from "react"

export const dynamic = "force-dynamic"
export const revalidate = 0

export default async function ConsistencyPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  // Placeholder: In production, fetch latest resume and LinkedIn snapshot
  // For demo, show a form to paste both and trigger the check

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">LinkedIn ↔ Resume Consistency</h1>
        <p className="text-sm text-muted-foreground">Check for contradictions between your resume and LinkedIn profile.</p>
      </div>
      {/* Consistency check form and results will go here */}
      <ConsistencyChecker />
    </div>
  )
}

function ConsistencyChecker() {
  const [resume, setResume] = React.useState("")
  const [linkedin, setLinkedin] = React.useState("")
  const [loading, setLoading] = React.useState(false)
  const [flags, setFlags] = React.useState<any[]>([])
  const [error, setError] = React.useState<string | null>(null)

  async function handleCheck(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setFlags([])
    try {
      const res = await fetch("/api/integrity/consistency", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resume, linkedin })
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
      <textarea className="w-full border rounded p-2" rows={4} placeholder="Paste resume JSON" value={resume} onChange={e => setResume(e.target.value)} required />
      <textarea className="w-full border rounded p-2" rows={4} placeholder="Paste LinkedIn JSON" value={linkedin} onChange={e => setLinkedin(e.target.value)} required />
      <button type="submit" className="btn btn-primary" disabled={loading}>Check Consistency</button>
      {loading && <div className="text-xs text-muted-foreground">Checking...</div>}
      {error && <div className="text-xs text-destructive">{error}</div>}
      {flags.length > 0 && (
        <div className="mt-4 space-y-2">
          {flags.map((f, i) => (
            <div key={i} className="border rounded p-3 bg-muted">
              <div className="font-medium text-foreground">{f.field}</div>
              <div className="text-xs">Resume: {f.value_a} | LinkedIn: {f.value_b}</div>
              <div className={f.severity === "disqualifying" ? "text-destructive" : "text-warning"}>{f.severity.toUpperCase()} — {f.delta}</div>
            </div>
          ))}
        </div>
      )}
      {!loading && !flags.length && !error && <div className="text-muted-foreground text-xs">No contradictions found yet.</div>}
    </form>
  )
}
