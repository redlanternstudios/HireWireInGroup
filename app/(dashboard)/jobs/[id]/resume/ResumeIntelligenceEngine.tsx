"use client"

import React, { useState } from "react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Brain,
  Target,
  Layers,
  Eye,
  Shield,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  FileText,
  Zap,
  BarChart2,
  MessageSquare,
  ExternalLink,
  RefreshCw,
  Copy,
  Check,
  Info,
  ArrowRight,
  Sparkles,
  Activity,
} from "lucide-react"

// ─── Types ────────────────────────────────────────────────────────────────────

interface JobSignal {
  label: string
  weight: number
  confidence: number
  reasoning: string[]
  detected_in: string[]
}

interface SignalProfile {
  job_id?: string
  signals: JobSignal[]
  dominant_signal: string
  summary: string
  ats_priority_keywords: string[]
}

interface ArchetypeProfile {
  archetype: string
  confidence: number
  rationale: string
  preferred_tone: string
  recruiter_priority: string
  risk_factors: string[]
  ats_language: string[]
  density_targets: {
    technical: number
    leadership: number
    ai: number
    outcome: number
    metrics: number
  }
}

interface NarrativeModeProfile {
  mode: string
  confidence: number
  rationale: string
  generation_guidance: {
    summary_tone: string
    bullet_priority: string
    skills_emphasis: string
    cover_letter_strategy: string
    lead_with: string
    bullet_length: string
  }
}

interface RecruiterScan {
  overall_sentiment: string
  pass_probability: number
  pass_probability_rationale?: string
  first_impression?: string
  standout_elements: string[]
  friction_elements: string[]
  missing_signals: string[]
  risk_flags: Array<{
    risk: string
    severity: "critical" | "moderate" | "minor"
    mitigation: string | null
  }>
  recommendations: string[]
  findings_count?: number
}

interface IntelligenceData {
  signal_profile?: SignalProfile
  role_archetype?: string
  archetype_confidence?: number
  archetype_rationale?: string
  narrative_mode?: string
  narrative_mode_rationale?: string
  dominant_signal?: string
  signal_summary?: string
  recruiter_scan?: RecruiterScan
}

interface JobData {
  id: string
  role_title: string | null
  company_name: string | null
  job_url: string | null
  status: string
  fit: string | null
  score: number | null
  generated_resume: string | null
  generated_cover_letter: string | null
  edited_resume: string | null
  edited_cover_letter: string | null
  resume_strategy: string | null
  resume_format: string | null
  generation_quality_score: number | null
  governance_passed: boolean | null
  governance_drift_score: number | null
  voice_mode: string | null
  voice_integrity_passed: boolean | null
  intelligence: Record<string, unknown> | null
  evidence_map: Record<string, unknown> | null
  score_strengths: string[] | null
  score_gaps: string[] | null
  resume_provenance: Array<Record<string, unknown>> | null
  generation_timestamp: string | null
  quality_passed: boolean | null
  generation_quality_issues: string[] | null
}

interface AnalysisData {
  id: string
  summary?: string | null
  matched_skills?: string[] | null
  matched_tools?: string[] | null
  known_gaps?: string[] | null
  ats_phrases?: string[] | null
  keywords?: string[] | null
  responsibilities?: string[] | null
  qualifications_required?: string[] | null
  qualifications_preferred?: string[] | null
}

interface Props {
  jobId: string
  job: JobData
  analysis: AnalysisData | null
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function weightBar(weight: number) {
  const pct = (weight / 10) * 100
  const color =
    weight >= 8
      ? "bg-red-600"
      : weight >= 6
      ? "bg-amber-500"
      : weight >= 4
      ? "bg-emerald-500"
      : "bg-stone-300"
  return (
    <div className="flex items-center gap-2 min-w-0">
      <div className="flex-1 h-1.5 rounded-full bg-stone-100 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-[10px] font-mono tabular-nums text-muted-foreground w-6 text-right">
        {weight.toFixed(1)}
      </span>
    </div>
  )
}

function sentimentColor(s: string) {
  if (s === "strong") return "text-emerald-700 bg-emerald-50 border-emerald-200"
  if (s === "mixed") return "text-amber-700 bg-amber-50 border-amber-200"
  if (s === "risky") return "text-rose-700 bg-rose-50 border-rose-200"
  return "text-stone-600 bg-stone-50 border-stone-200"
}

function severityColor(s: string) {
  if (s === "critical") return "text-rose-700 bg-rose-50 border-rose-200"
  if (s === "moderate") return "text-amber-700 bg-amber-50 border-amber-200"
  return "text-stone-600 bg-stone-50 border-stone-200"
}

function modeLabel(mode: string) {
  return mode
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .replace("Optimized", "↑")
}

function strategyLabel(s: string | null) {
  if (!s) return "—"
  if (s === "direct_match") return "Direct Match"
  if (s === "adjacent_transition") return "Adjacent Transition"
  if (s === "stretch_honest") return "Stretch"
  return s
}

function confidencePct(c: number) {
  return `${Math.round(c * 100)}%`
}

// ─── Section wrapper ──────────────────────────────────────────────────────────

function Section({
  icon: Icon,
  label,
  children,
  defaultOpen = true,
  badge,
}: {
  icon: React.ElementType
  label: string
  children: React.ReactNode
  defaultOpen?: boolean
  badge?: React.ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="hw-card overflow-hidden">
      <button
        onClick={() => setOpen((v: boolean) => !v)}
      >
        <div className="flex items-center gap-2.5">
          <Icon className="h-4 w-4 text-primary shrink-0" />
          <span className="text-sm font-semibold text-foreground">{label}</span>
          {badge}
        </div>
        {open ? (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        )}
      </button>
      {open && <div className="px-5 pb-5 border-t border-border">{children}</div>}
    </div>
  )
}

// ─── Copy button ──────────────────────────────────────────────────────────────

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      onClick={async () => {
        await navigator.clipboard.writeText(text)
        setCopied(true)
        setTimeout(() => setCopied(false), 1800)
      }}
      className="inline-flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
    >
      {copied ? (
        <Check className="h-3 w-3 text-emerald-500" />
      ) : (
        <Copy className="h-3 w-3" />
      )}
      {copied ? "Copied" : "Copy"}
    </button>
  )
}

// ─── Resume preview ───────────────────────────────────────────────────────────

function ResumePreview({ text }: { text: string }) {
  const [expanded, setExpanded] = useState(false)
  const lines = text.split("\n")
  const preview = lines.slice(0, 20).join("\n")
  const shown = expanded ? text : preview

  return (
    <div>
      <pre className="text-[11px] leading-relaxed font-mono text-foreground whitespace-pre-wrap bg-stone-50 rounded-lg p-4 border border-border overflow-x-auto">
        {shown}
      </pre>
      {lines.length > 20 && (
        <button
          onClick={() => setExpanded((v: boolean) => !v)}
          className="mt-2 text-xs text-primary hover:underline"
        >
          {expanded ? "Show less" : `Show full resume (${lines.length} lines)`}
        </button>
      )}
    </div>
  )
}

// ─── Generate trigger ─────────────────────────────────────────────────────────

function GenerateTrigger({ jobId, hasDocuments }: { jobId: string; hasDocuments: boolean }) {
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleGenerate() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/generate-documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ job_id: jobId }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) {
        setError(data.user_message || data.error || "Generation failed")
      } else {
        setDone(true)
        setTimeout(() => window.location.reload(), 1200)
      }
    } catch {
      setError("Network error — try again")
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    return (
      <div className="flex items-center gap-2 text-sm text-emerald-700">
        <CheckCircle2 className="h-4 w-4" />
        Generated — refreshing…
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <Button
        onClick={handleGenerate}
        disabled={loading}
        className="hw-btn-primary gap-2"
        size="sm"
      >
        {loading ? (
          <RefreshCw className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Sparkles className="h-3.5 w-3.5" />
        )}
        {loading
          ? "Generating…"
          : hasDocuments
          ? "Regenerate Resume"
          : "Generate Resume"}
      </Button>
      {error && (
        <p className="text-xs text-rose-600 flex items-center gap-1">
          <AlertTriangle className="h-3 w-3" />
          {error}
        </p>
      )}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export function ResumeIntelligenceEngine({ jobId, job, analysis }: Props) {
  const intel = job.intelligence as IntelligenceData | null
  const signalProfile = intel?.signal_profile ?? null
  const recruiterScan = intel?.recruiter_scan ?? null

  const hasDocuments = !!(job.generated_resume || job.edited_resume)
  const activeResume = job.edited_resume || job.generated_resume
  const activeStatus = job.status

  const fitColor =
    job.fit === "HIGH"
      ? "status-ready"
      : job.fit === "MEDIUM"
      ? "status-analyzing"
      : job.fit
      ? "status-rejected"
      : "status-draft"

  const passProbColor =
    (recruiterScan?.pass_probability ?? 0) >= 70
      ? "text-emerald-700"
      : (recruiterScan?.pass_probability ?? 0) >= 45
      ? "text-amber-700"
      : "text-rose-700"

  return (
    <div className="space-y-4">
      {/* ── STATUS BAR ──────────────────────────────────────────────────── */}
      <div className="hw-card px-5 py-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-wrap">
          <Badge variant="outline" className={`text-[10px] ${fitColor}`}>
            {job.fit ?? "—"} fit
          </Badge>
          {job.score !== null && (
            <span className="text-sm font-bold tabular-nums">
              {Math.round(Number(job.score))}
              <span className="text-xs font-normal text-muted-foreground">/100</span>
            </span>
          )}
          {intel?.role_archetype && (
            <Badge variant="outline" className="text-[10px] font-medium bg-violet-50 text-violet-700 border-violet-200">
              {intel.role_archetype}
            </Badge>
          )}
          {intel?.narrative_mode && (
            <Badge variant="outline" className="text-[10px] font-medium bg-blue-50 text-blue-700 border-blue-200">
              {modeLabel(intel.narrative_mode)}
            </Badge>
          )}
          {job.governance_passed === true && (
            <span className="inline-flex items-center gap-1 text-[10px] text-emerald-700">
              <Shield className="h-3 w-3" />
              Governance passed
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <GenerateTrigger jobId={jobId} hasDocuments={hasDocuments} />
          {hasDocuments && (
            <Link href={`/jobs/${jobId}/documents`}>
              <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                <FileText className="h-3.5 w-3.5" />
                View Documents
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* ── NO INTELLIGENCE YET ─────────────────────────────────────────── */}
      {!intel && (
        <div className="hw-card px-6 py-10 flex flex-col items-center text-center gap-3">
          <Brain className="h-8 w-8 text-muted-foreground/40" />
          <div>
            <p className="text-sm font-semibold">No intelligence data yet</p>
            <p className="text-xs text-muted-foreground mt-1 max-w-xs">
              Generate a resume first. Signal profiling, archetype classification, and recruiter scan run automatically during generation.
            </p>
          </div>
          <GenerateTrigger jobId={jobId} hasDocuments={false} />
        </div>
      )}

      {/* ── SIGNAL PROFILE ──────────────────────────────────────────────── */}
      {signalProfile && (
        <Section
          icon={Activity}
          label="Job Signal Profile"
          badge={
            <span className="text-[10px] text-muted-foreground ml-1">
              {signalProfile.signals?.length ?? 0} signals
            </span>
          }
        >
          <div className="pt-4 space-y-4">
            {/* Summary */}
            <div className="bg-stone-50 rounded-lg px-4 py-3 border border-border">
              <p className="text-xs text-foreground leading-relaxed">{signalProfile.summary}</p>
              <p className="text-[10px] text-muted-foreground mt-1">
                Dominant: <span className="font-medium text-primary">{signalProfile.dominant_signal}</span>
              </p>
            </div>

            {/* Signals */}
            <div className="space-y-3">
              {(signalProfile.signals ?? [])
                .sort((a, b) => b.weight - a.weight)
                .map((sig, i) => (
                  <SignalRow key={i} signal={sig} />
                ))}
            </div>

            {/* ATS keywords */}
            {(signalProfile.ats_priority_keywords ?? []).length > 0 && (
              <div>
                <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide mb-2">
                  ATS Priority Keywords
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {signalProfile.ats_priority_keywords.map((kw, i) => (
                    <span
                      key={i}
                      className="text-[10px] font-mono px-2 py-0.5 rounded bg-stone-100 border border-stone-200 text-foreground"
                    >
                      {kw}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Section>
      )}

      {/* ── ROLE ARCHETYPE ──────────────────────────────────────────────── */}
      {intel?.role_archetype && (
        <Section icon={Target} label="Role Archetype">
          <div className="pt-4 space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-lg font-bold text-foreground">{intel.role_archetype}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {intel.archetype_rationale}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-xs text-muted-foreground">Confidence</p>
                <p className="text-sm font-bold text-foreground">
                  {intel.archetype_confidence
                    ? confidencePct(intel.archetype_confidence as number)
                    : "—"}
                </p>
              </div>
            </div>
          </div>
        </Section>
      )}

      {/* ── NARRATIVE MODE ──────────────────────────────────────────────── */}
      {intel?.narrative_mode && (
        <Section icon={Layers} label="Narrative Mode">
          <div className="pt-4 space-y-3">
            <div className="flex items-center gap-3">
              <div className="px-3 py-1.5 rounded-full bg-blue-50 border border-blue-200">
                <span className="text-xs font-semibold text-blue-700">
                  {modeLabel(intel.narrative_mode)}
                </span>
              </div>
            </div>
            {intel.narrative_mode_rationale && (
              <p className="text-xs text-muted-foreground leading-relaxed">
                {intel.narrative_mode_rationale}
              </p>
            )}
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>Strategy:</span>
              <span className="font-medium text-foreground">
                {strategyLabel(job.resume_strategy)}
              </span>
            </div>
          </div>
        </Section>
      )}

      {/* ── RECRUITER SCAN ──────────────────────────────────────────────── */}
      {recruiterScan && (
        <Section
          icon={Eye}
          label="Recruiter Scan Simulation"
          badge={
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full border ${sentimentColor(
                recruiterScan.overall_sentiment
              )}`}
            >
              {recruiterScan.overall_sentiment}
            </span>
          }
        >
          <div className="pt-4 space-y-4">
            {/* Pass probability */}
            <div className="flex items-center justify-between bg-stone-50 rounded-lg px-4 py-3 border border-border">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  First Screen Pass Probability
                </p>
                {recruiterScan.pass_probability_rationale && (
                  <p className="text-[10px] text-muted-foreground mt-0.5 max-w-sm">
                    {recruiterScan.pass_probability_rationale}
                  </p>
                )}
              </div>
              <span className={`text-3xl font-black tabular-nums ${passProbColor}`}>
                {recruiterScan.pass_probability}
                <span className="text-base font-normal text-muted-foreground">%</span>
              </span>
            </div>

            {/* First impression */}
            {recruiterScan.first_impression && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
                <p className="text-[10px] font-medium text-amber-700 uppercase tracking-wide mb-1">
                  10-Second Impression
                </p>
                <p className="text-xs text-foreground leading-relaxed">
                  {recruiterScan.first_impression}
                </p>
              </div>
            )}

            {/* Standout / Friction grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {(recruiterScan.standout_elements ?? []).length > 0 && (
                <div>
                  <p className="text-[10px] font-medium text-emerald-700 uppercase tracking-wide mb-2">
                    What stands out
                  </p>
                  <ul className="space-y-1.5">
                    {recruiterScan.standout_elements.map((s, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-foreground">
                        <CheckCircle2 className="h-3 w-3 text-emerald-500 shrink-0 mt-0.5" />
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {(recruiterScan.friction_elements ?? []).length > 0 && (
                <div>
                  <p className="text-[10px] font-medium text-amber-700 uppercase tracking-wide mb-2">
                    What creates friction
                  </p>
                  <ul className="space-y-1.5">
                    {recruiterScan.friction_elements.map((f, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-foreground">
                        <AlertTriangle className="h-3 w-3 text-amber-500 shrink-0 mt-0.5" />
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Missing signals */}
            {(recruiterScan.missing_signals ?? []).length > 0 && (
              <div>
                <p className="text-[10px] font-medium text-rose-700 uppercase tracking-wide mb-2">
                  Missing signals
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {recruiterScan.missing_signals.map((m, i) => (
                    <span
                      key={i}
                      className="text-[10px] px-2 py-0.5 rounded-full border bg-rose-50 border-rose-200 text-rose-700"
                    >
                      {m}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Risk flags */}
            {(recruiterScan.risk_flags ?? []).length > 0 && (
              <div>
                <p className="text-[10px] font-medium text-foreground uppercase tracking-wide mb-2">
                  Risk flags
                </p>
                <div className="space-y-2">
                  {recruiterScan.risk_flags.map((rf, i) => (
                    <div
                      key={i}
                      className={`px-3 py-2.5 rounded-lg border text-xs ${severityColor(
                        rf.severity
                      )}`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium">{rf.risk}</span>
                        <span className={`text-[9px] uppercase font-bold tracking-wide px-1.5 py-0.5 rounded ${severityColor(rf.severity)}`}>
                          {rf.severity}
                        </span>
                      </div>
                      {rf.mitigation && (
                        <p className="mt-1 text-[10px] opacity-80">{rf.mitigation}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recommendations */}
            {(recruiterScan.recommendations ?? []).length > 0 && (
              <div>
                <p className="text-[10px] font-medium text-foreground uppercase tracking-wide mb-2">
                  Recommendations
                </p>
                <ul className="space-y-1.5">
                  {recruiterScan.recommendations.map((r, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-foreground">
                      <ArrowRight className="h-3 w-3 text-primary shrink-0 mt-0.5" />
                      {r}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </Section>
      )}

      {/* ── GOVERNANCE ──────────────────────────────────────────────────── */}
      {job.governance_passed !== null && (
        <Section icon={Shield} label="Governance & Truth Lock" defaultOpen={false}>
          <div className="pt-4 space-y-3">
            <div className="flex items-center gap-3">
              <div
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium ${
                  job.governance_passed
                    ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                    : "bg-rose-50 border-rose-200 text-rose-700"
                }`}
              >
                {job.governance_passed ? (
                  <CheckCircle2 className="h-3.5 w-3.5" />
                ) : (
                  <AlertTriangle className="h-3.5 w-3.5" />
                )}
                {job.governance_passed ? "Governance passed" : "Governance failed"}
              </div>
              {job.governance_drift_score !== null && (
                <span className="text-xs text-muted-foreground">
                  Drift score:{" "}
                  <span className="font-mono font-medium text-foreground">
                    {Math.round(Number(job.governance_drift_score))}
                  </span>
                  /100
                </span>
              )}
            </div>

            {(job.generation_quality_issues ?? []).length > 0 && (
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium mb-2">
                  Quality issues
                </p>
                <ul className="space-y-1">
                  {(job.generation_quality_issues ?? []).map((issue, i) => (
                    <li key={i} className="text-xs text-rose-600 flex items-start gap-1.5">
                      <AlertTriangle className="h-3 w-3 shrink-0 mt-0.5" />
                      {issue}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
              <span>
                Voice mode:{" "}
                <span className="font-medium text-foreground">
                  {job.voice_mode?.replace(/_/g, " ") ?? "—"}
                </span>
              </span>
              <span>
                Voice integrity:{" "}
                <span
                  className={`font-medium ${
                    job.voice_integrity_passed ? "text-emerald-700" : "text-amber-700"
                  }`}
                >
                  {job.voice_integrity_passed === null
                    ? "—"
                    : job.voice_integrity_passed
                    ? "passed"
                    : "review"}
                </span>
              </span>
              {job.generation_quality_score !== null && (
                <span>
                  Quality score:{" "}
                  <span className="font-medium text-foreground">
                    {Math.round(Number(job.generation_quality_score))}
                  </span>
                </span>
              )}
            </div>
          </div>
        </Section>
      )}

      {/* ── EVIDENCE MAP ────────────────────────────────────────────────── */}
      {(job.score_strengths ?? []).length > 0 || (job.score_gaps ?? []).length > 0 ? (
        <Section icon={BarChart2} label="Evidence Map" defaultOpen={false}>
          <div className="pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {(job.score_strengths ?? []).length > 0 && (
              <div>
                <p className="text-[10px] font-medium text-emerald-700 uppercase tracking-wide mb-2">
                  Matched evidence
                </p>
                <ul className="space-y-1.5">
                  {(job.score_strengths ?? []).map((s, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs">
                      <CheckCircle2 className="h-3 w-3 text-emerald-500 shrink-0 mt-0.5" />
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {(job.score_gaps ?? []).length > 0 && (
              <div>
                <p className="text-[10px] font-medium text-rose-700 uppercase tracking-wide mb-2">
                  Gaps
                </p>
                <ul className="space-y-1.5">
                  {(job.score_gaps ?? []).map((g, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs">
                      <AlertTriangle className="h-3 w-3 text-rose-500 shrink-0 mt-0.5" />
                      {g}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </Section>
      ) : null}

      {/* ── RESUME PREVIEW ──────────────────────────────────────────────── */}
      {activeResume && (
        <Section
          icon={FileText}
          label="Generated Resume"
          defaultOpen={false}
          badge={
            <div className="flex items-center gap-2 ml-1">
              {job.edited_resume && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-50 border border-blue-200 text-blue-700">
                  edited
                </span>
              )}
              <CopyButton text={activeResume} />
            </div>
          }
        >
          <div className="pt-4">
            <ResumePreview text={activeResume} />
            <div className="mt-3 flex items-center gap-3">
              <Link href={`/jobs/${jobId}/documents`}>
                <Button variant="outline" size="sm" className="text-xs gap-1.5">
                  <ExternalLink className="h-3 w-3" />
                  Open full editor
                </Button>
              </Link>
              {job.generation_timestamp && (
                <span className="text-[10px] text-muted-foreground">
                  Generated{" "}
                  {new Date(job.generation_timestamp).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              )}
            </div>
          </div>
        </Section>
      )}

      {/* ── ATS KEYWORDS (from analysis) ────────────────────────────────── */}
      {analysis &&
        ((analysis.ats_phrases ?? []).length > 0 ||
          (analysis.keywords ?? []).length > 0) && (
          <Section icon={Zap} label="ATS Keywords" defaultOpen={false}>
            <div className="pt-4 flex flex-wrap gap-1.5">
              {[
                ...(analysis.ats_phrases ?? []),
                ...(analysis.keywords ?? []),
              ]
                .filter((v, i, a) => a.indexOf(v) === i)
                .map((kw, i) => (
                  <span
                    key={i}
                    className="text-[11px] font-mono px-2 py-0.5 rounded bg-stone-100 border border-stone-200 text-foreground"
                  >
                    {kw}
                  </span>
                ))}
            </div>
          </Section>
        )}

      {/* ── COACH LINK ──────────────────────────────────────────────────── */}
      <div className="hw-card px-5 py-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <MessageSquare className="h-4 w-4 text-primary shrink-0" />
          <div>
            <p className="text-sm font-semibold">Ask the Coach</p>
            <p className="text-xs text-muted-foreground">
              Why did this resume emphasize these signals? What&apos;s missing?
            </p>
          </div>
        </div>
        <Link href={`/coach?job=${jobId}`}>
          <Button variant="outline" size="sm" className="text-xs gap-1.5 shrink-0">
            Open Coach
            <ArrowRight className="h-3 w-3" />
          </Button>
        </Link>
      </div>
    </div>
  )
}

// ─── Signal Row ───────────────────────────────────────────────────────────────

function SignalRow({ signal }: { signal: JobSignal; key?: number | string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen((v: boolean) => !v)}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs font-medium text-foreground truncate">{signal.label}</span>
            <span className="text-[10px] text-muted-foreground shrink-0">
              {confidencePct(signal.confidence)} conf
            </span>
          </div>
          <div className="mt-1.5">{weightBar(signal.weight)}</div>
        </div>
        {open ? (
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        ) : (
          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        )}
      </button>
      {open && (
        <div className="px-3 pb-3 border-t border-border bg-stone-50/60">
          <div className="pt-2 space-y-1">
            {signal.reasoning.map((r, i) => (
              <div key={i} className="flex items-start gap-1.5 text-[11px] text-muted-foreground">
                <Info className="h-3 w-3 shrink-0 mt-0.5 text-primary/60" />
                {r}
              </div>
            ))}
          </div>
          {(signal.detected_in ?? []).length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {signal.detected_in.map((d, i) => (
                <span
                  key={i}
                  className="text-[9px] uppercase tracking-wide px-1.5 py-0.5 rounded bg-stone-200 text-stone-600"
                >
                  {d.replace(/_/g, " ")}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
