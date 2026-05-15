"use client"

import React from "react"

const DISABLED_MESSAGE = "Integrity tools require AI Gateway configuration. Add AI_GATEWAY_API_KEY to enable live checks."

function DisabledNotice({ aiEnabled }: { aiEnabled: boolean }) {
  if (aiEnabled) return null
  return (
    <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
      {DISABLED_MESSAGE}
    </div>
  )
}

export function AIContentChecker({ aiEnabled }: { aiEnabled: boolean }) {
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
        body: JSON.stringify({ resumeText }),
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
      <DisabledNotice aiEnabled={aiEnabled} />
      <textarea className="w-full border rounded p-2" rows={6} placeholder="Paste resume text" value={resumeText} onChange={e => setResumeText(e.target.value)} required />
      <button type="submit" className="btn btn-primary" disabled={!aiEnabled || loading}>Detect AI Content</button>
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

export function ConsistencyChecker({ aiEnabled }: { aiEnabled: boolean }) {
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
        body: JSON.stringify({ resume, linkedin }),
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
      <DisabledNotice aiEnabled={aiEnabled} />
      <textarea className="w-full border rounded p-2" rows={4} placeholder="Paste resume JSON" value={resume} onChange={e => setResume(e.target.value)} required />
      <textarea className="w-full border rounded p-2" rows={4} placeholder="Paste LinkedIn JSON" value={linkedin} onChange={e => setLinkedin(e.target.value)} required />
      <button type="submit" className="btn btn-primary" disabled={!aiEnabled || loading}>Check Consistency</button>
      {loading && <div className="text-xs text-muted-foreground">Checking...</div>}
      {error && <div className="text-xs text-destructive">{error}</div>}
      {flags.length > 0 && (
        <div className="mt-4 space-y-2">
          {flags.map((f, i) => (
            <div key={i} className="border rounded p-3 bg-muted">
              <div className="font-medium text-foreground">{f.field}</div>
              <div className="text-xs">Resume: {f.value_a} | LinkedIn: {f.value_b}</div>
              <div className={f.severity === "disqualifying" ? "text-destructive" : "text-warning"}>{f.severity.toUpperCase()} - {f.delta}</div>
            </div>
          ))}
        </div>
      )}
      {!loading && !flags.length && !error && <div className="text-muted-foreground text-xs">No contradictions found yet.</div>}
    </form>
  )
}

export function GapAnalyzer({ aiEnabled }: { aiEnabled: boolean }) {
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
        body: JSON.stringify({ jobDescription, resume }),
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
      <DisabledNotice aiEnabled={aiEnabled} />
      <textarea className="w-full border rounded p-2" rows={4} placeholder="Paste job description" value={jobDescription} onChange={e => setJobDescription(e.target.value)} required />
      <textarea className="w-full border rounded p-2" rows={4} placeholder="Paste resume JSON" value={resume} onChange={e => setResume(e.target.value)} required />
      <button type="submit" className="btn btn-primary" disabled={!aiEnabled || loading}>Analyze Gap</button>
      {loading && <div className="text-xs text-muted-foreground">Checking...</div>}
      {error && <div className="text-xs text-destructive">{error}</div>}
      {results.length > 0 && (
        <div className="mt-4 space-y-2">
          {results.map((r, i) => (
            <div key={i} className="border rounded p-3 bg-muted">
              <div className="font-medium text-foreground">{r.skill}</div>
              <div className={r.match === "fit" ? "text-success" : r.match === "stretch" ? "text-warning" : "text-destructive"}>
                {r.match.toUpperCase()} - {r.reason}
              </div>
            </div>
          ))}
        </div>
      )}
      {!loading && !results.length && !error && <div className="text-muted-foreground text-xs">No gap analysis results yet.</div>}
    </form>
  )
}

export function VerificationSimulator({ aiEnabled }: { aiEnabled: boolean }) {
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
        body: JSON.stringify({ claims: JSON.parse(claims) }),
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
      <DisabledNotice aiEnabled={aiEnabled} />
      <textarea className="w-full border rounded p-2" rows={6} placeholder='Paste claims as JSON array, e.g. [{"claim_text":"Deployed Mars rover for NASA","org_name":"NASA"}]' value={claims} onChange={e => setClaims(e.target.value)} required />
      <button type="submit" className="btn btn-primary" disabled={!aiEnabled || loading}>Simulate Verification</button>
      {loading && <div className="text-xs text-muted-foreground">Checking...</div>}
      {error && <div className="text-xs text-destructive">{error}</div>}
      {results.length > 0 && (
        <div className="mt-4 space-y-2">
          {results.map((r, i) => (
            <div key={i} className="border rounded p-3 bg-muted">
              <div className="font-medium text-foreground">{r.claim_text}</div>
              <div className="text-xs">Org: {r.org_name || "N/A"}</div>
              <div className={r.check_result === "verifiable" ? "text-success" : r.check_result === "unclear" ? "text-warning" : "text-destructive"}>
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
