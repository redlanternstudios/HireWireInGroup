import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import React from "react"

export const dynamic = "force-dynamic"
export const revalidate = 0

export default async function VerificationPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Employer Verification Simulator</h1>
        <p className="text-sm text-muted-foreground">See what an employer's background check might flag in your resume.</p>
      </div>
      <VerificationSimulator />
    </div>
  )
}

function VerificationSimulator() {
  const [claims, setClaims] = React.useState("")
  const [loading, setLoading] = React.useState(false)
  const [results, setResults] = React.useState<any[]>([])
  const [error, setError] = React.useState<string | null>(null)

  async function handleCheck(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setResults([])
    try {
      const res = await fetch("/api/integrity/verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ claims: JSON.parse(claims) })
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
      <textarea className="w-full border rounded p-2" rows={6} placeholder='Paste claims as JSON array, e.g. [{"claim_text":"Deployed Mars rover for NASA","org_name":"NASA"}]' value={claims} onChange={e => setClaims(e.target.value)} required />
      <button type="submit" className="btn btn-primary" disabled={loading}>Simulate Verification</button>
      {loading && <div className="text-xs text-muted-foreground">Checking...</div>}
      {error && <div className="text-xs text-destructive">{error}</div>}
      {results.length > 0 && (
        <div className="mt-4 space-y-2">
          {results.map((r, i) => (
            <div key={i} className="border rounded p-3 bg-muted">
              <div className="font-medium text-foreground">{r.claim_text}</div>
              <div className="text-xs">Org: {r.org_name || "N/A"}</div>
              <div className={
                r.check_result === "verifiable"
                  ? "text-success"
                  : r.check_result === "unclear"
                  ? "text-warning"
                  : "text-destructive"
              }>
                {r.check_result.toUpperCase()} ({(r.confidence * 100).toFixed(0)}% confidence)
              </div>
            </div>
          ))}
        </div>
      )}
      {!loading && !results.length && !error && <div className="text-muted-foreground text-xs">No verification results yet.</div>}
    </form>
  )
}
