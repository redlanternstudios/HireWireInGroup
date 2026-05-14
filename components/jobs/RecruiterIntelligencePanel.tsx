"use client"

/**
 * components/jobs/RecruiterIntelligencePanel.tsx
 *
 * Phase 2–5 Intelligence Panel for the Job Detail page.
 * Surfaces: signal profile, role archetype, narrative mode, recruiter scan.
 *
 * Reads from jobs.intelligence JSONB column (set at analysis + generation time).
 * Client component — accepts pre-loaded job.intelligence prop.
 */

import { useState } from "react"
import {
  Brain,
  Target,
  Zap,
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Eye,
  BarChart3,
  Layers,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"

// ─── Types (mirrored from lib/intelligence) ───────────────────────────────────

interface JobSignal {
  label: string
  weight: number
  confidence: number
  reasoning: string[]
  detected_in: string[]
}

interface RecruiterScanSummary {
  overall_sentiment: "strong" | "mixed" | "risky" | "unclear"
  pass_probability: number
  pass_probability_rationale: string
  first_impression: string
  standout_elements: string[]
  friction_elements: string[]
  missing_signals: string[]
  risk_flags: Array<{
    risk: string
    severity: "critical" | "moderate" | "minor"
    mitigation: string | null
  }>
  recommendations: string[]
}

interface IntelligenceData {
  signal_profile?: {
    signals: JobSignal[]
    dominant_signal: string
    summary: string
    ats_priority_keywords: string[]
  }
  role_archetype?: string
  archetype_confidence?: number
  archetype_rationale?: string
  narrative_mode?: string
  narrative_mode_rationale?: string
  dominant_signal?: string
  signal_summary?: string
  ats_priority_keywords?: string[]
  recruiter_scan?: RecruiterScanSummary
}

interface Props {
  intelligence: IntelligenceData | null
  hasMaterials: boolean
}

// ─── Sentiment Badge ──────────────────────────────────────────────────────────

function SentimentBadge({ sentiment }: { sentiment: string }) {
  const config: Record<string, { color: string; label: string }> = {
    strong: { color: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30", label: "Strong" },
    mixed: { color: "bg-amber-500/15 text-amber-600 border-amber-500/30", label: "Mixed" },
    risky: { color: "bg-red-500/15 text-red-600 border-red-500/30", label: "Risky" },
    unclear: { color: "bg-zinc-500/15 text-zinc-500 border-zinc-500/30", label: "Unclear" },
  }
  const c = config[sentiment] || config.unclear
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${c.color}`}>
      {c.label}
    </span>
  )
}

// ─── Signal Bar ───────────────────────────────────────────────────────────────

function SignalBar({ signal }: { signal: JobSignal }) {
  const [expanded, setExpanded] = useState(false)
  const pct = Math.round((signal.weight / 10) * 100)
  const intensity = pct >= 70 ? "bg-primary" : pct >= 40 ? "bg-amber-500" : "bg-zinc-400"

  return (
    <div className="space-y-1">
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full flex items-center gap-2 text-left group"
      >
        <div className="flex-1 space-y-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium truncate">{signal.label}</span>
            <span className="text-[10px] tabular-nums text-muted-foreground shrink-0">
              {signal.weight.toFixed(1)}/10
            </span>
          </div>
          <div className="h-1 rounded-full bg-border overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${intensity}`}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
        <span className="text-muted-foreground group-hover:text-foreground transition-colors shrink-0">
          {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </span>
      </button>

      {expanded && signal.reasoning.length > 0 && (
        <ul className="ml-2 mt-1 space-y-0.5">
          {signal.reasoning.slice(0, 3).map((r, i) => (
            <li key={i} className="text-[10px] text-muted-foreground flex items-start gap-1">
              <span className="text-primary mt-0.5 shrink-0">·</span>
              {r}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

// ─── Main Panel ───────────────────────────────────────────────────────────────

export function RecruiterIntelligencePanel({ intelligence, hasMaterials }: Props) {
  const [signalsExpanded, setSignalsExpanded] = useState(false)

  if (!intelligence) {
    return (
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="flex items-center gap-2 mb-3">
          <Brain className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-semibold">Signal Intelligence</span>
        </div>
        <p className="text-xs text-muted-foreground">
          Intelligence analysis runs automatically when this job is analyzed.
        </p>
      </div>
    )
  }

  const { signal_profile, role_archetype, archetype_confidence, archetype_rationale,
    narrative_mode, narrative_mode_rationale, signal_summary, ats_priority_keywords,
    recruiter_scan } = intelligence

  const topSignals = signal_profile?.signals?.slice(0, signalsExpanded ? 8 : 4) || []

  return (
    <div className="space-y-3">

      {/* ── ARCHETYPE CARD ──────────────────────────────────────────────────── */}
      {role_archetype && (
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-2 mb-3">
            <Layers className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold">Role Archetype</span>
            {archetype_confidence && (
              <span className="ml-auto text-[10px] text-muted-foreground tabular-nums">
                {Math.round(archetype_confidence * 100)}% confidence
              </span>
            )}
          </div>

          <div className="flex items-start gap-2">
            <Badge variant="outline" className="text-xs font-medium shrink-0 border-primary/30 text-primary">
              {role_archetype}
            </Badge>
          </div>

          {narrative_mode && (
            <div className="mt-3 flex items-center gap-1.5">
              <span className="text-[10px] text-muted-foreground">Narrative Mode:</span>
              <span className="text-[10px] font-medium text-foreground">
                {narrative_mode.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}
              </span>
            </div>
          )}

          {archetype_rationale && (
            <p className="text-[10px] text-muted-foreground mt-2 leading-relaxed">
              {archetype_rationale}
            </p>
          )}
        </div>
      )}

      {/* ── SIGNAL PROFILE ──────────────────────────────────────────────────── */}
      {signal_profile && (
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-2 mb-1">
            <BarChart3 className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold">Job Signals</span>
          </div>

          {signal_summary && (
            <p className="text-[10px] text-muted-foreground mb-3 leading-relaxed">{signal_summary}</p>
          )}

          <div className="space-y-2.5">
            {topSignals.map(sig => (
              <SignalBar key={sig.label} signal={sig} />
            ))}
          </div>

          {(signal_profile.signals?.length || 0) > 4 && (
            <button
              onClick={() => setSignalsExpanded(e => !e)}
              className="mt-2 text-[10px] text-primary hover:underline flex items-center gap-1"
            >
              {signalsExpanded ? (
                <><ChevronUp className="w-3 h-3" /> Show fewer signals</>
              ) : (
                <><ChevronDown className="w-3 h-3" /> Show {(signal_profile.signals.length) - 4} more signals</>
              )}
            </button>
          )}

          {/* ATS Priority Keywords */}
          {ats_priority_keywords && ats_priority_keywords.length > 0 && (
            <div className="mt-3 pt-3 border-t border-border">
              <div className="flex items-center gap-1.5 mb-1.5">
                <Target className="w-3 h-3 text-muted-foreground" />
                <span className="text-[10px] font-medium text-muted-foreground">ATS Priority Terms</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {ats_priority_keywords.slice(0, 8).map(kw => (
                  <span
                    key={kw}
                    className="text-[9px] px-1.5 py-0.5 rounded bg-primary/8 text-primary/80 border border-primary/15"
                  >
                    {kw}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── RECRUITER SCAN ──────────────────────────────────────────────────── */}
      {hasMaterials && recruiter_scan && (
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <Eye className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold">Recruiter Scan</span>
            <div className="ml-auto">
              <SentimentBadge sentiment={recruiter_scan.overall_sentiment} />
            </div>
          </div>

          {/* Pass Probability */}
          <div className="mb-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] text-muted-foreground">First Screen Pass Probability</span>
              <span className="text-xs font-bold tabular-nums">{recruiter_scan.pass_probability}%</span>
            </div>
            <div className="h-2 rounded-full bg-border overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  recruiter_scan.pass_probability >= 70 ? "bg-emerald-500" :
                  recruiter_scan.pass_probability >= 50 ? "bg-amber-500" : "bg-red-500"
                }`}
                style={{ width: `${recruiter_scan.pass_probability}%` }}
              />
            </div>
          </div>

          {/* First Impression */}
          <p className="text-[10px] text-muted-foreground leading-relaxed mb-3 italic">
            "{recruiter_scan.first_impression}"
          </p>

          {/* Standouts */}
          {recruiter_scan.standout_elements.length > 0 && (
            <div className="mb-2">
              <div className="flex items-center gap-1.5 mb-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                <span className="text-[10px] font-medium">Standout Elements</span>
              </div>
              <ul className="space-y-0.5">
                {recruiter_scan.standout_elements.slice(0, 3).map((el, i) => (
                  <li key={i} className="text-[10px] text-muted-foreground flex gap-1">
                    <span className="text-emerald-500 shrink-0">·</span>{el}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Friction */}
          {recruiter_scan.friction_elements.length > 0 && (
            <div className="mb-2">
              <div className="flex items-center gap-1.5 mb-1">
                <AlertTriangle className="w-3 h-3 text-amber-500" />
                <span className="text-[10px] font-medium">Friction Points</span>
              </div>
              <ul className="space-y-0.5">
                {recruiter_scan.friction_elements.slice(0, 3).map((el, i) => (
                  <li key={i} className="text-[10px] text-muted-foreground flex gap-1">
                    <span className="text-amber-500 shrink-0">·</span>{el}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Risk Flags */}
          {recruiter_scan.risk_flags.filter(r => r.severity === "critical").length > 0 && (
            <div className="mt-2 pt-2 border-t border-border">
              {recruiter_scan.risk_flags.filter(r => r.severity === "critical").slice(0, 2).map((f, i) => (
                <div key={i} className="text-[10px] text-red-600 flex items-start gap-1">
                  <AlertTriangle className="w-3 h-3 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-medium">{f.risk}</span>
                    {f.mitigation && <p className="text-muted-foreground mt-0.5">{f.mitigation}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Recommendations */}
          {recruiter_scan.recommendations.length > 0 && (
            <div className="mt-3 pt-3 border-t border-border">
              <div className="flex items-center gap-1.5 mb-1.5">
                <Zap className="w-3 h-3 text-primary" />
                <span className="text-[10px] font-medium">Recommendations</span>
              </div>
              <ul className="space-y-1">
                {recruiter_scan.recommendations.slice(0, 3).map((rec, i) => (
                  <li key={i} className="text-[10px] text-muted-foreground flex gap-1">
                    <span className="text-primary shrink-0">{i + 1}.</span>{rec}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Prompt to generate if no materials yet */}
      {!hasMaterials && (
        <div className="rounded-xl border border-dashed border-border bg-card/50 p-4 text-center">
          <Eye className="w-4 h-4 text-muted-foreground mx-auto mb-1.5" />
          <p className="text-[10px] text-muted-foreground">
            Recruiter scan appears after materials are generated
          </p>
        </div>
      )}
    </div>
  )
}
