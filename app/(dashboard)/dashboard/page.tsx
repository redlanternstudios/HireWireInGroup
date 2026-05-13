import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

import { evaluateReadiness } from "@/lib/readiness/evaluator"
import {
  Plus, Briefcase, ArrowRight, Target, AlertTriangle,
  CheckCircle2, Clock, Send, Zap, Sparkles, BarChart2, Bell,
} from "lucide-react"

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const days = Math.floor(diff / 86400000)
  const hours = Math.floor(diff / 3600000)
  if (hours < 1) return "Just now"
  if (hours < 24) return `${hours}h ago`
  if (days === 1) return "Yesterday"
  if (days < 7) return `${days}d ago`
  return `${Math.floor(days / 7)}w ago`
}

const STATUS_LABEL: Record<string, string> = {
  draft: "Draft", analyzing: "Analyzing", analyzed: "Analyzed",
  generating: "Generating", ready: "Ready", applied: "Applied",
  interviewing: "Interviewing", offered: "Offered", rejected: "Rejected",
  needs_review: "Needs Review", needs_evidence: "Needs Evidence",
  quality_review: "Quality Review", error: "Error",
}

type StatusStyle = { bg: string; text: string; border: string }
const STATUS_STYLE: Record<string, StatusStyle> = {
  draft:         { bg: "bg-stone-100",   text: "text-stone-600",   border: "border-stone-200" },
  analyzing:     { bg: "bg-amber-50",    text: "text-amber-700",   border: "border-amber-200" },
  analyzed:      { bg: "bg-blue-50",     text: "text-blue-600",    border: "border-blue-200" },
  generating:    { bg: "bg-amber-50",    text: "text-amber-700",   border: "border-amber-200" },
  ready:         { bg: "bg-emerald-50",  text: "text-emerald-700", border: "border-emerald-200" },
  applied:       { bg: "bg-blue-50",     text: "text-blue-700",    border: "border-blue-200" },
  needs_review:  { bg: "bg-orange-50",   text: "text-orange-700",  border: "border-orange-200" },
  needs_evidence:{ bg: "bg-rose-50",     text: "text-rose-700",    border: "border-rose-200" },
  quality_review:{ bg: "bg-violet-50",   text: "text-violet-700",  border: "border-violet-200" },
  error:         { bg: "bg-red-50",      text: "text-red-700",     border: "border-red-200" },
}
function statusStyle(status: string): StatusStyle {
  return STATUS_STYLE[status] ?? { bg: "bg-stone-100", text: "text-stone-600", border: "border-stone-200" }
}

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return "Good morning"
  if (h < 17) return "Good afternoon"
  return "Good evening"
}

// Derive a simple urgency tier from job state — no inline readiness logic
type UrgencyTier = "action" | "review" | "ready" | "submitted" | "other"
function urgencyTier(job: {
  id?: string | null
  status: string
  quality_passed?: boolean | null
  generated_resume?: string | null
  generated_cover_letter?: string | null
  evidence_map?: unknown
  applied_at?: string | null
  score?: number | null
}): UrgencyTier {
  const readiness = evaluateReadiness(job)
  if (readiness.outcome !== "active") return "submitted"
  if (readiness.stage === "ready") return "ready"
  if (readiness.stage === "quality_review") return "review"
  if (readiness.stage === "evidence_blocked" || job.status === "error") return "action"
  if (job.status === "analyzing" || job.status === "generating") return "other"
  if (readiness.stage === "materials_missing") return "action"
  return "other"
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const [{ data: profile }, { data: jobs }] = await Promise.all([
    supabase.from("user_profile")
      .select("full_name, onboarding_complete, headline")
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase.from("jobs")
      .select("id, role_title, company_name, status, score, quality_passed, generated_resume, generated_cover_letter, evidence_map, applied_at, created_at, updated_at, score_gaps")
      .eq("user_id", user.id)
      .is("deleted_at", null)
      .order("updated_at", { ascending: false })
      .limit(10),
  ])

  if (!profile || profile.onboarding_complete === false) redirect("/onboarding")

  const jobList = jobs ?? []
  const firstName = profile.full_name?.split(" ")[0] ?? "there"

  // Pipeline counts — derived from actual fields only
  const needsActionJobs = jobList.filter(j => urgencyTier(j) === "action")
  const needsReviewJobs = jobList.filter(j => urgencyTier(j) === "review")
  const readyJobs       = jobList.filter(j => urgencyTier(j) === "ready")
  const submittedJobs   = jobList.filter(j => urgencyTier(j) === "submitted")
  const activeJobs      = jobList.filter(j => evaluateReadiness(j).outcome === "active")
  const needAttention   = needsActionJobs.length + needsReviewJobs.length

  // "Your Next Move" — highest-urgency job
  const heroJob = needsActionJobs[0] ?? needsReviewJobs[0] ?? readyJobs[0] ?? jobList[0] ?? null
  const heroTier = heroJob ? urgencyTier(heroJob) : null

  function heroNextStep(tier: UrgencyTier | null, job: typeof heroJob): { label: string; desc: string; href: string; cta: string; timeEst: string | null } {
    if (!job || !tier) return { label: "Add a job", desc: "Paste a job description to start your pipeline.", href: "/jobs/new", cta: "Add job", timeEst: null }
    const base = `/jobs/${job.id}`
    if (tier === "action") {
      const readiness = evaluateReadiness(job)
      const gaps = (job.score_gaps as string[] | null) ?? []
      const gapCount = gaps.length
      const evidenceBlocked = readiness.stage === "evidence_blocked"
      return {
        label: evidenceBlocked
          ? gapCount > 0 ? `Match ${gapCount} missing proof point${gapCount !== 1 ? "s" : ""}` : "Add missing evidence"
          : "Generate your package",
        desc: readiness.blockedReasons[0] ?? "Complete the next readiness requirement.",
        href: readiness.nextAction?.href ?? `${base}/evidence-match`,
        cta: evidenceBlocked ? "Fix now" : "Continue",
        timeEst: gapCount > 0 ? `Est. ${gapCount * 5}–${gapCount * 8} min` : null,
      }
    }
    if (tier === "review") return { label: "Review your package", desc: "Your application package is ready for a final check.", href: `${base}/documents`, cta: "Review now", timeEst: "Est. 5–10 min" }
    if (tier === "ready")  return { label: "Submit your application", desc: "Package is quality-approved and ready to go.", href: "/ready-to-apply", cta: "Apply now", timeEst: null }
    return { label: "View job details", desc: "Check the latest status of this role.", href: base, cta: "Open", timeEst: null }
  }

  const heroAction = heroNextStep(heroTier, heroJob)

  const heroWarning = heroJob && heroTier === "action"
    ? (() => {
        const readiness = evaluateReadiness(heroJob)
        const gaps = (heroJob.score_gaps as string[] | null) ?? []
        const gapCount = gaps.length
        return readiness.stage === "evidence_blocked" && gapCount > 0
          ? `Needs evidence to support ${gapCount} key requirement${gapCount !== 1 ? "s" : ""}`
          : readiness.blockedReasons[0] ?? "Needs readiness work before applying"
      })()
    : heroJob && heroTier === "review"
    ? "Awaiting your review before submission"
    : null

  // Attention count for header subtitle
  const attentionItems = needsActionJobs.length + needsReviewJobs.length
  const subtitle = attentionItems > 0
    ? `You've got ${attentionItems} item${attentionItems !== 1 ? "s" : ""} that need your attention today.`
    : readyJobs.length > 0
    ? `${readyJobs.length} job${readyJobs.length !== 1 ? "s" : ""} ready to apply today.`
    : "Your pipeline is up to date."

  return (
    <div className="w-full px-5 py-4" style={{ maxWidth: 1200, marginInline: "auto" }}>

      {/* ─── Top Header ─── */}
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <p className="hw-section-label mb-1">Command Center</p>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {greeting()}, {firstName}.
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {attentionItems > 0 ? (
              <>
                {"You've got "}
                <span className="font-semibold text-primary">{attentionItems} item{attentionItems !== 1 ? "s" : ""}</span>
                {" that need your attention today."}
              </>
            ) : subtitle}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button className="w-8 h-8 rounded-full flex items-center justify-center bg-card border border-border text-muted-foreground hover:text-foreground transition-colors relative">
            <Bell className="h-4 w-4" />
            {attentionItems > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-primary text-white text-[8px] font-bold flex items-center justify-center">
                {attentionItems}
              </span>
            )}
          </button>
          <Link href="/jobs/new">
            <Button size="sm" className="hw-btn-primary gap-1.5 px-4">
              <Plus className="h-3.5 w-3.5" /> Add Job
            </Button>
          </Link>
        </div>
      </div>

      {/* ─── Two-column workspace ─── */}
      <div className="flex gap-4 items-start">

        {/* ─── MAIN COLUMN ─── */}
        <div className="flex-1 min-w-0 space-y-3">

          {/* HERO: Your Next Move */}
          {heroJob ? (
            <div
              className="rounded-2xl overflow-hidden"
              style={{ background: "hsl(var(--card))", border: "1px solid rgba(26,23,20,0.07)", boxShadow: "0 1px 3px rgba(26,23,20,0.04), 0 6px 20px rgba(26,23,20,0.07)" }}
            >
              <div className="px-5 pt-4 pb-3">
                {/* Badge */}
                <div className="flex items-center gap-2 mb-2.5">
                  <div className="w-6 h-6 rounded-md flex items-center justify-center shrink-0" style={{ background: "hsl(var(--primary)/0.1)" }}>
                    <Sparkles className="h-3 w-3 text-primary" />
                  </div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-primary">Your Next Move</p>
                </div>

                <div className="flex items-start justify-between gap-6">
                  {/* Left: job info */}
                  <div className="flex-1 min-w-0">
                    <h2 className="text-xl font-bold text-foreground leading-tight">
                      {heroJob.role_title ?? "Untitled Role"}
                    </h2>
                    <p className="text-sm text-muted-foreground mt-0.5">{heroJob.company_name ?? "—"}</p>

                    {heroWarning && (
                      <div className="flex items-center gap-1.5 mt-2">
                        <AlertTriangle className="h-3 w-3 text-amber-500 shrink-0" />
                        <p className="text-xs font-medium text-amber-700">{heroWarning}</p>
                      </div>
                    )}

                    {heroTier === "action" && (heroJob.score_gaps as string[] | null)?.length ? (
                      <div className="mt-2 px-3 py-2 rounded-lg" style={{ background: "hsl(var(--muted))" }}>
                        <p className="text-xs text-foreground">
                          <span className="font-semibold">Why this matters: </span>
                          Strengthening these areas will significantly increase your match confidence.
                        </p>
                      </div>
                    ) : null}
                  </div>

                  {/* Right: next step */}
                  <div className="shrink-0 text-right hidden sm:block min-w-45">
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-1">Next Step</p>
                    <p className="text-base font-bold text-foreground leading-snug">{heroAction.label}</p>
                    <p className="text-xs text-muted-foreground mt-1">{heroAction.desc}</p>
                    {heroAction.timeEst && (
                      <div className="inline-flex items-center gap-1 mt-2 px-2 py-0.5 rounded-full bg-muted text-[10px] text-muted-foreground font-medium">
                        <Clock className="h-3 w-3" /> {heroAction.timeEst}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Action footer */}
              <div className="px-5 py-2.5 flex items-center gap-2" style={{ borderTop: "1px solid rgba(26,23,20,0.06)", background: "hsl(var(--muted)/0.4)" }}>
                <Link href={heroAction.href}>
                  <Button size="sm" className="hw-btn-primary gap-1.5">
                    {heroAction.cta} <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </Link>
                <Link href="/jobs">
                  <Button size="sm" variant="outline" className="text-muted-foreground hover:text-foreground">
                    Skip for now
                  </Button>
                </Link>
                {heroJob.score != null && (
                  <div className="ml-auto flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full" style={{ background: heroJob.score >= 70 ? "#22c55e" : heroJob.score >= 50 ? "#f59e0b" : "#ef4444" }} />
                    <span className="text-sm font-bold text-foreground tabular-nums">{heroJob.score}%</span>
                    <span className="text-xs text-muted-foreground">Confidence</span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Empty state hero */
            <div
              className="rounded-2xl px-6 py-8 flex flex-col items-center text-center gap-3"
              style={{ background: "hsl(var(--card))", border: "1px dashed rgba(26,23,20,0.12)", boxShadow: "0 1px 3px rgba(26,23,20,0.04)" }}
            >
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: "hsl(var(--muted))" }}>
                <Target className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">No active jobs yet</p>
                <p className="text-xs text-muted-foreground mt-1 max-w-xs">Add your first job posting — HireWire will analyze it against your career context and tell you exactly what to do next.</p>
              </div>
              <Link href="/jobs/new">
                <Button size="sm" className="hw-btn-primary gap-1.5 mt-1">
                  <Plus className="h-3.5 w-3.5" /> Paste a job description
                </Button>
              </Link>
            </div>
          )}

          {/* TODAY'S QUEUE */}
          <div>
            <p className="hw-section-label mb-2">{"Today's Queue"}</p>
            <div className="grid grid-cols-3 gap-3">
              {[
                {
                  label: "Needs Action",
                  count: needsActionJobs.length,
                  icon: AlertTriangle,
                  color: "text-rose-600",
                  iconBg: "bg-rose-50",
                  ringColor: "border-rose-200",
                  href: "/jobs?filter=needs-action",
                },
                {
                  label: "Needs Review",
                  count: needsReviewJobs.length,
                  icon: Clock,
                  color: "text-amber-600",
                  iconBg: "bg-amber-50",
                  ringColor: "border-amber-200",
                  href: "/jobs?filter=needs-review",
                },
                {
                  label: "Ready to Apply",
                  count: readyJobs.length,
                  icon: CheckCircle2,
                  color: "text-emerald-600",
                  iconBg: "bg-emerald-50",
                  ringColor: "border-emerald-200",
                  href: "/ready-to-apply",
                },
              ].map((q) => (
                <Link key={q.label} href={q.href}>
                  <div
                    className="rounded-xl px-3.5 py-3 flex flex-col gap-1 group transition-all hover:-translate-y-0.5"
                    style={{
                      background: "hsl(var(--card))",
                      border: "1px solid rgba(26,23,20,0.07)",
                      boxShadow: "0 1px 3px rgba(26,23,20,0.04), 0 3px 8px rgba(26,23,20,0.04)",
                    }}
                  >
                    <div className={`w-7 h-7 rounded-md flex items-center justify-center ${q.iconBg}`}>
                      <q.icon className={`h-3.5 w-3.5 ${q.color}`} />
                    </div>
                    <p className={`text-xl font-bold tabular-nums ${q.count > 0 ? q.color : "text-muted-foreground/40"}`}>
                      {q.count}
                    </p>
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-medium text-muted-foreground">{q.label}</p>
                      <ArrowRight className="h-3 w-3 text-muted-foreground/30 group-hover:text-muted-foreground transition-colors" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* PIPELINE OVERVIEW */}
          <div>
            <p className="hw-section-label mb-2">Pipeline Overview</p>
            <div className="grid grid-cols-4 gap-2">
              {[
                { label: "Jobs Active",     value: activeJobs.length,     icon: Briefcase, color: "text-foreground" },
                { label: "Need Attention",  value: needAttention,          icon: AlertTriangle, color: "text-amber-600" },
                { label: "Ready to Apply",  value: readyJobs.length,       icon: CheckCircle2, color: "text-emerald-600" },
                { label: "Submitted",       value: submittedJobs.length,   icon: Send, color: "text-blue-600" },
              ].map((s) => (
                <div
                  key={s.label}
                  className="rounded-xl px-3 py-2.5 flex flex-col gap-0.5"
                  style={{
                    background: "hsl(var(--card))",
                    border: "1px solid rgba(26,23,20,0.07)",
                    boxShadow: "0 1px 3px rgba(26,23,20,0.04)",
                  }}
                >
                  <s.icon className={`h-3.5 w-3.5 ${s.color} mb-0.5`} />
                  <p className={`text-xl font-bold tabular-nums leading-none ${s.color}`}>{s.value}</p>
                  <p className="text-[10px] text-muted-foreground leading-tight mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* RECENT PIPELINE */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="hw-section-label">Recent Pipeline</p>
              <Link href="/jobs" className="text-xs text-primary font-medium flex items-center gap-1 hover:gap-1.5 transition-all">
                View all jobs <ArrowRight className="h-3 w-3" />
              </Link>
            </div>

            {jobList.length === 0 ? (
              <div
                className="rounded-2xl px-5 py-8 flex flex-col items-center text-center gap-3"
                style={{ background: "hsl(var(--card))", border: "1px dashed rgba(26,23,20,0.12)" }}
              >
                <div className="hw-empty-icon">
                  <Briefcase className="h-5 w-5 text-muted-foreground" />
                </div>
                <p className="text-sm font-semibold">No jobs yet</p>
                <p className="text-xs text-muted-foreground max-w-xs">Add a job posting to start building your intelligence pipeline.</p>
              </div>
            ) : (
              <div
                className="rounded-2xl overflow-hidden"
                style={{ background: "hsl(var(--card))", border: "1px solid rgba(26,23,20,0.07)", boxShadow: "0 1px 3px rgba(26,23,20,0.04), 0 3px 8px rgba(26,23,20,0.04)" }}
              >
                {jobList.slice(0, 5).map((job, i) => {
                  const tier = urgencyTier(job)
                  const ss = statusStyle(job.status)
                  const displayStatus = STATUS_LABEL[job.status] ?? job.status
                  const gaps = (job.score_gaps as string[] | null) ?? []
                  return (
                    <div
                      key={job.id}
                      className={`flex items-center gap-3 px-4 py-2.5 group ${i > 0 ? "border-t border-border/50" : ""}`}
                    >
                      {/* Icon */}
                      <div className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center shrink-0">
                        <Briefcase className="h-4 w-4 text-muted-foreground" />
                      </div>

                      {/* Job info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-foreground truncate">
                            {job.role_title ?? "Untitled Role"}
                          </p>
                          <Badge
                            variant="outline"
                            className={`text-[10px] font-medium shrink-0 ${ss.bg} ${ss.text} ${ss.border}`}
                          >
                            {displayStatus}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <p className="text-xs text-muted-foreground">{job.company_name ?? "—"}</p>
                          {gaps.length > 0 && (
                            <>
                              <span className="text-muted-foreground/30">·</span>
                              <span className="text-[11px] text-rose-600 font-medium">
                                Missing {gaps.length} proof point{gaps.length !== 1 ? "s" : ""}
                              </span>
                            </>
                          )}
                          {gaps.length === 0 && tier === "review" && (
                            <>
                              <span className="text-muted-foreground/30">·</span>
                              <span className="text-[11px] text-amber-600 font-medium">Review resume</span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Score + time */}
                      <div className="hidden sm:flex items-center gap-4 shrink-0">
                        {job.score != null && (
                          <div className="text-right">
                            <p className="text-sm font-bold tabular-nums text-foreground">{job.score}%</p>
                            <p className="text-[10px] text-muted-foreground">Confidence</p>
                          </div>
                        )}
                        <div className="text-right min-w-12">
                          <p className="text-xs text-muted-foreground">{timeAgo(job.updated_at ?? job.created_at)}</p>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        {tier === "action" && (
                          <Link href={`/jobs/${job.id}/evidence-match`}>
                            <Button size="sm" variant="outline" className="text-[11px] h-7 px-2 text-rose-600 border-rose-200 hover:bg-rose-50">
                              Fix
                            </Button>
                          </Link>
                        )}
                        {tier === "review" && (
                          <Link href={`/jobs/${job.id}/documents`}>
                            <Button size="sm" variant="outline" className="text-[11px] h-7 px-2 text-amber-600 border-amber-200 hover:bg-amber-50">
                              Review
                            </Button>
                          </Link>
                        )}
                        {tier === "ready" && (
                          <Link href="/ready-to-apply">
                            <Button size="sm" variant="outline" className="text-[11px] h-7 px-2 text-emerald-600 border-emerald-200 hover:bg-emerald-50">
                              Apply
                            </Button>
                          </Link>
                        )}
                        <Link href={`/jobs/${job.id}`}>
                          <Button size="sm" variant="ghost" className="text-[11px] h-7 px-2 text-muted-foreground">
                            Open <ArrowRight className="h-3 w-3 ml-1" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

        </div>

        {/* ─── RIGHT RAIL ─── */}
        <div className="shrink-0 space-y-3" style={{ width: 256 }}>

          {/* PIPELINE INTELLIGENCE */}
          <div
            className="rounded-xl p-3.5"
            style={{ background: "hsl(var(--card))", border: "1px solid rgba(26,23,20,0.07)", boxShadow: "0 1px 3px rgba(26,23,20,0.04), 0 3px 8px rgba(26,23,20,0.04)" }}
          >
            <div className="flex items-center gap-1.5 mb-2.5">
              <div className="w-5 h-5 rounded-md bg-primary/10 flex items-center justify-center">
                <BarChart2 className="h-3 w-3 text-primary" />
              </div>
              <p className="hw-section-label">Pipeline Intelligence</p>
            </div>

            <p className="text-xs font-semibold text-foreground mb-1.5">Your pipeline at a glance</p>
            <div className="space-y-1 mb-3">
              {needAttention > 0 && (
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
                  <p className="text-xs text-muted-foreground">{needAttention} job{needAttention !== 1 ? "s" : ""} need your attention</p>
                </div>
              )}
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full shrink-0 ${readyJobs.length > 0 ? "bg-emerald-500" : "bg-muted-foreground/30"}`} />
                <p className="text-xs text-muted-foreground">{readyJobs.length} job{readyJobs.length !== 1 ? "s" : ""} ready to apply</p>
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full shrink-0 ${submittedJobs.length > 0 ? "bg-blue-500" : "bg-muted-foreground/30"}`} />
                <p className="text-xs text-muted-foreground">
                  {submittedJobs.length > 0 ? `${submittedJobs.length} application${submittedJobs.length !== 1 ? "s" : ""} submitted` : "No applications submitted yet"}
                </p>
              </div>
            </div>

            {heroJob && (
              <>
                <p className="text-xs font-semibold text-foreground mb-1.5">Biggest opportunity</p>
                <Link href={`/jobs/${heroJob.id}`}>
                  <div
                    className="rounded-lg p-2.5 group transition-all hover:border-primary/30"
                    style={{ background: "hsl(var(--muted)/0.6)", border: "1px solid rgba(26,23,20,0.06)" }}
                  >
                    <p className="text-xs font-semibold text-foreground leading-snug">{heroJob.role_title}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {heroJob.score != null ? `${heroJob.score}% confidence` : "High fit potential"}
                    </p>
                    <p className="text-xs font-medium text-primary mt-1.5 flex items-center gap-0.5 group-hover:gap-1 transition-all">
                      Take action <ArrowRight className="h-3 w-3" />
                    </p>
                  </div>
                </Link>
              </>
            )}
          </div>

          {/* QUICK ACTIONS */}
          <div
            className="rounded-xl p-3.5"
            style={{ background: "hsl(var(--card))", border: "1px solid rgba(26,23,20,0.07)", boxShadow: "0 1px 3px rgba(26,23,20,0.04), 0 3px 8px rgba(26,23,20,0.04)" }}
          >
            <div className="flex items-center gap-1.5 mb-2.5">
              <div className="w-5 h-5 rounded-md bg-amber-100 flex items-center justify-center">
                <Zap className="h-3 w-3 text-amber-600" />
              </div>
              <p className="hw-section-label">Quick Actions</p>
            </div>

            <div className="space-y-0.5">
              {[
                { href: "/jobs/new",   icon: Plus,     label: "Paste a job description", desc: "Analyze a new opportunity" },
                { href: "/coach",       icon: Sparkles, label: "Improve a resume",         desc: "Tailor for a specific role" },
                { href: "/coach",       icon: Target,   label: "Ask Coach",                desc: "Get personalized guidance" },
              ].map((a) => (
                <Link key={a.label} href={a.href}>
                  <div className="flex items-center gap-2.5 p-2 rounded-lg group hover:bg-muted/60 transition-colors">
                    <div className="w-6 h-6 rounded-md bg-muted flex items-center justify-center shrink-0">
                      <a.icon className="h-3 w-3 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-foreground leading-tight">{a.label}</p>
                      <p className="text-[10px] text-muted-foreground">{a.desc}</p>
                    </div>
                    <ArrowRight className="h-3 w-3 text-muted-foreground/30 group-hover:text-muted-foreground transition-colors shrink-0" />
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* MOMENTUM */}
          <div
            className="rounded-xl p-3.5"
            style={{ background: "hsl(var(--card))", border: "1px solid rgba(26,23,20,0.07)", boxShadow: "0 1px 3px rgba(26,23,20,0.04), 0 3px 8px rgba(26,23,20,0.04)" }}
          >
            <div className="flex items-center gap-1.5 mb-2">
              <div className="w-5 h-5 rounded-md bg-blue-50 flex items-center justify-center">
                <BarChart2 className="h-3 w-3 text-blue-500" />
              </div>
              <p className="hw-section-label">Momentum</p>
            </div>

            <p className="text-xs text-muted-foreground mb-1">Applications this week</p>
            <div className="flex items-baseline justify-between mb-1.5">
              <p className="text-xl font-bold tabular-nums text-foreground">{submittedJobs.length} <span className="text-xs font-normal text-muted-foreground">/ 5</span></p>
              <p className="text-[10px] text-muted-foreground">Target</p>
            </div>

            {/* Progress bar */}
            <div className="h-1.5 rounded-full bg-muted overflow-hidden mb-2">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${Math.min((submittedJobs.length / 5) * 100, 100)}%`,
                  background: submittedJobs.length >= 5 ? "#22c55e" : submittedJobs.length >= 3 ? "#f59e0b" : "hsl(var(--primary))",
                }}
              />
            </div>

            {submittedJobs.length === 0 ? (
              <>
                <p className="text-xs font-semibold text-rose-600">{"You're behind pace."}</p>
                <Link href="/ready-to-apply" className="text-xs font-medium text-primary flex items-center gap-1 mt-1 hover:gap-1.5 transition-all">
                  View analytics <ArrowRight className="h-3 w-3" />
                </Link>
              </>
            ) : submittedJobs.length < 5 ? (
              <p className="text-xs text-amber-600 font-medium">{5 - submittedJobs.length} more to hit your target.</p>
            ) : (
              <p className="text-xs text-emerald-600 font-medium">Target reached this week!</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
