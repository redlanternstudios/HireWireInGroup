import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import { evaluateReadiness } from "@/lib/readiness/evaluator";
import {
  Plus,
  Briefcase,
  ArrowRight,
  Target,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Send,
  Zap,
  Sparkles,
  BarChart2,
  Bell,
  Activity,
} from "lucide-react";

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor(diff / 3600000);
  if (hours < 1) return "Just now";
  if (hours < 24) return `${hours}h ago`;
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  return `${Math.floor(days / 7)}w ago`;
}

const STATUS_LABEL: Record<string, string> = {
  draft: "Draft",
  analyzing: "Analyzing",
  analyzed: "Analyzed",
  generating: "Generating",
  ready: "Ready",
  applied: "Applied",
  interviewing: "Interviewing",
  offered: "Offered",
  rejected: "Rejected",
  needs_review: "Needs Review",
  needs_evidence: "Needs Evidence",
  quality_review: "Quality Review",
  error: "Error",
};

type StatusStyle = { bg: string; text: string; border: string };
const STATUS_STYLE: Record<string, StatusStyle> = {
  draft: {
    bg: "bg-stone-100",
    text: "text-stone-600",
    border: "border-stone-200",
  },
  analyzing: {
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200",
  },
  analyzed: {
    bg: "bg-blue-50",
    text: "text-blue-600",
    border: "border-blue-200",
  },
  generating: {
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200",
  },
  ready: {
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200",
  },
  applied: {
    bg: "bg-blue-50",
    text: "text-blue-700",
    border: "border-blue-200",
  },
  needs_review: {
    bg: "bg-orange-50",
    text: "text-orange-700",
    border: "border-orange-200",
  },
  needs_evidence: {
    bg: "bg-rose-50",
    text: "text-rose-700",
    border: "border-rose-200",
  },
  quality_review: {
    bg: "bg-violet-50",
    text: "text-violet-700",
    border: "border-violet-200",
  },
  error: { bg: "bg-red-50", text: "text-red-700", border: "border-red-200" },
};
function statusStyle(status: string): StatusStyle {
  return (
    STATUS_STYLE[status] ?? {
      bg: "bg-stone-100",
      text: "text-stone-600",
      border: "border-stone-200",
    }
  );
}

const EVENT_LABEL: Record<string, string> = {
  application_submitted: "Application submitted",
  documents_generated: "Documents generated",
  quality_passed: "Quality check passed",
  quality_failed: "Quality check failed",
  evidence_added: "Evidence added",
  evidence_updated: "Evidence updated",
  evidence_deleted: "Evidence removed",
  resume_uploaded: "Resume uploaded",
  job_analyzed: "Job analyzed",
  readiness_changed: "Readiness updated",
  package_reviewed: "Package accepted",
  package_invalidated: "Package flagged for review",
  export_generated: "Document exported",
};

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

type UrgencyTier = "action" | "review" | "ready" | "submitted" | "other";
function urgencyTier(job: {
  id?: string | null;
  status: string;
  quality_passed?: boolean | null;
  generated_resume?: string | null;
  generated_cover_letter?: string | null;
  evidence_map?: unknown;
  applied_at?: string | null;
  score?: number | null;
}): UrgencyTier {
  const readiness = evaluateReadiness(job);
  if (readiness.outcome !== "active") return "submitted";
  if (readiness.stage === "ready") return "ready";
  if (readiness.stage === "quality_review") return "review";
  if (readiness.stage === "evidence_blocked" || job.status === "error")
    return "action";
  if (job.status === "analyzing" || job.status === "generating") return "other";
  if (readiness.stage === "materials_missing") return "action";
  return "other";
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: profile }, { data: jobs }, { data: recentEvents }] =
    await Promise.all([
      supabase
        .from("user_profile")
        .select("full_name, headline")
        .eq("user_id", user.id)
        .maybeSingle(),
      supabase
        .from("jobs")
        .select(
          "id, role_title, company_name, status, score, quality_passed, generated_resume, generated_cover_letter, evidence_map, applied_at, created_at, updated_at, score_gaps",
        )
        .eq("user_id", user.id)
        .is("deleted_at", null)
        .order("updated_at", { ascending: false })
        .limit(200),
      supabase
        .from("domain_events")
        .select("id, event_type, job_id, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(5),
    ]);

  const jobList = jobs ?? [];
  const firstName = profile?.full_name?.split(" ")[0] ?? "there";

  const needsActionJobs = jobList.filter((j) => urgencyTier(j) === "action");
  const needsReviewJobs = jobList.filter((j) => urgencyTier(j) === "review");
  const readyJobs = jobList.filter((j) => urgencyTier(j) === "ready");
  const submittedJobs = jobList.filter((j) => urgencyTier(j) === "submitted");
  const activeJobs = jobList.filter(
    (j) => evaluateReadiness(j).outcome === "active",
  );
  const needAttention = needsActionJobs.length + needsReviewJobs.length;

  // "Applications this week" — jobs applied since Monday 00:00 local time
  const weekStart = new Date();
  const dayOfWeek = weekStart.getDay();
  weekStart.setDate(
    weekStart.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1),
  );
  weekStart.setHours(0, 0, 0, 0);
  const appliedThisWeek = jobList.filter(
    (j) => j.applied_at && new Date(j.applied_at) >= weekStart,
  );

  // "Your Next Move" — highest-urgency job
  const heroJob =
    needsActionJobs[0] ??
    needsReviewJobs[0] ??
    readyJobs[0] ??
    jobList[0] ??
    null;
  const heroTier = heroJob ? urgencyTier(heroJob) : null;

  function heroNextStep(
    tier: UrgencyTier | null,
    job: typeof heroJob,
  ): {
    label: string;
    desc: string;
    href: string;
    cta: string;
    timeEst: string | null;
  } {
    if (!job || !tier)
      return {
        label: "Add a job",
        desc: "Paste a job description to start your pipeline.",
        href: "/jobs/new",
        cta: "Add job",
        timeEst: null,
      };
    const base = `/jobs/${job.id}`;
    if (tier === "action") {
      const readiness = evaluateReadiness(job);
      const gaps = (job.score_gaps as string[] | null) ?? [];
      const gapCount = gaps.length;
      const evidenceBlocked = readiness.stage === "evidence_blocked";
      return {
        label: evidenceBlocked
          ? gapCount > 0
            ? `Match ${gapCount} missing proof point${gapCount !== 1 ? "s" : ""}`
            : "Add missing evidence"
          : "Generate your package",
        desc:
          readiness.blockedReasons[0] ??
          "Complete the next readiness requirement.",
        href: readiness.nextAction?.href ?? `${base}/evidence-match`,
        cta: evidenceBlocked ? "Fix now" : "Continue",
        timeEst:
          gapCount > 0 ? `Est. ${gapCount * 5}–${gapCount * 8} min` : null,
      };
    }
    if (tier === "review")
      return {
        label: "Review your package",
        desc: "Your application package is ready for a final check.",
        href: `${base}/documents`,
        cta: "Review now",
        timeEst: "Est. 5–10 min",
      };
    if (tier === "ready")
      return {
        label: "Submit your application",
        desc: "Package is quality-approved and ready to go.",
        href: "/ready-to-apply",
        cta: "Apply now",
        timeEst: null,
      };
    return {
      label: "View job details",
      desc: "Check the latest status of this role.",
      href: base,
      cta: "Open",
      timeEst: null,
    };
  }

  const heroAction = heroNextStep(heroTier, heroJob);

  const heroWarning =
    heroJob && heroTier === "action"
      ? (() => {
          const readiness = evaluateReadiness(heroJob);
          const gaps = (heroJob.score_gaps as string[] | null) ?? [];
          const gapCount = gaps.length;
          return readiness.stage === "evidence_blocked" && gapCount > 0
            ? `Resume not generated`
            : (readiness.blockedReasons[0] ??
                "Needs readiness work before applying");
        })()
      : heroJob && heroTier === "review"
        ? "Awaiting your review before submission"
        : null;

  const attentionItems = needsActionJobs.length + needsReviewJobs.length;
  const subtitle =
    attentionItems > 0
      ? `You've got ${attentionItems} item${attentionItems !== 1 ? "s" : ""} that need your attention today.`
      : readyJobs.length > 0
        ? `${readyJobs.length} job${readyJobs.length !== 1 ? "s" : ""} ready to apply today.`
        : "Your pipeline is up to date.";

  // Inline card style helpers
  const cardBase: React.CSSProperties = {
    background: "hsl(var(--card))",
    border: "1px solid rgba(26,23,20,0.07)",
    boxShadow: "0 1px 3px rgba(26,23,20,0.04), 0 4px 16px rgba(26,23,20,0.06)",
  };

  return (
    <div className="w-full" style={{ maxWidth: 1200, marginInline: "auto" }}>
      {/* ─── HEADER ─── */}
      <div className="flex items-start justify-between gap-4 mb-5">
        <div>
          <p className="hw-section-label mb-1">Command Center</p>
          <h1 className="text-[26px] font-bold tracking-tight text-foreground leading-tight">
            {greeting()},{" "}
            <span style={{ color: "hsl(var(--primary))" }}>{firstName}.</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {attentionItems > 0 ? (
              <>
                {"You've got "}
                <span className="font-semibold text-foreground">
                  {attentionItems} item{attentionItems !== 1 ? "s" : ""}
                </span>
                {" that need your attention today."}
              </>
            ) : (
              subtitle
            )}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0 pt-1">
          <button
            className="relative flex items-center justify-center rounded-full transition-colors"
            style={{
              width: 34,
              height: 34,
              background: "hsl(var(--card))",
              border: "1px solid rgba(26,23,20,0.09)",
            }}
          >
            <Bell className="h-4 w-4 text-muted-foreground" />
            {attentionItems > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-primary text-white text-[9px] font-bold flex items-center justify-center">
                {attentionItems}
              </span>
            )}
          </button>
          <Link href="/jobs/new">
            <Button size="sm" className="hw-btn-primary gap-1.5 px-4 h-9">
              <Plus className="h-3.5 w-3.5" /> Add Job
            </Button>
          </Link>
        </div>
      </div>

      {/* ─── TWO-COLUMN WORKSPACE ─── */}
      <div className="flex gap-4 items-start">
        {/* ─── MAIN COLUMN ─── */}
        <div className="flex-1 min-w-0 space-y-4">
          {/* ── HERO: Your Next Move ── */}
          {heroJob ? (
            <div
              className="rounded-3xl overflow-hidden"
              style={{
                background: "hsl(var(--card))",
                border: "1px solid rgba(26,23,20,0.08)",
                boxShadow:
                  "0 2px 8px rgba(26,23,20,0.05), 0 12px 32px rgba(26,23,20,0.09)",
              }}
            >
              <div className="px-6 pt-5 pb-4">
                {/* Label row */}
                <div className="flex items-center gap-2 mb-3">
                  <div
                    className="w-5 h-5 rounded flex items-center justify-center"
                    style={{ background: "hsl(var(--primary))" }}
                  >
                    <Sparkles className="h-3 w-3 text-white" />
                  </div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-primary">
                    Your Next Move
                  </p>
                </div>

                <div className="flex items-start justify-between gap-6">
                  {/* Left: job info */}
                  <div className="flex-1 min-w-0">
                    <h2 className="text-[22px] font-bold text-foreground leading-tight tracking-tight">
                      {heroJob.role_title ?? "Untitled Role"}
                    </h2>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {heroJob.company_name ?? "—"}
                    </p>

                    {heroWarning && (
                      <div className="flex items-center gap-1.5 mt-2.5">
                        <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                        <p className="text-xs font-medium text-amber-700">
                          {heroWarning}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Right: next step block */}
                  <div
                    className="shrink-0 text-right hidden sm:block"
                    style={{ minWidth: 180 }}
                  >
                    <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground mb-1">
                      Next Step
                    </p>
                    <p className="text-base font-bold text-foreground leading-snug">
                      {heroAction.label}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                      {heroAction.desc}
                    </p>
                    {heroAction.timeEst && (
                      <div
                        className="inline-flex items-center gap-1 mt-2 px-2 py-0.5 rounded-full text-[10px] text-muted-foreground font-medium"
                        style={{ background: "hsl(var(--muted))" }}
                      >
                        <Clock className="h-3 w-3" /> {heroAction.timeEst}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Action footer */}
              <div
                className="px-6 py-3.5 flex items-center gap-2.5"
                style={{
                  borderTop: "1px solid rgba(26,23,20,0.06)",
                  background: "hsl(var(--muted)/0.35)",
                }}
              >
                <Link href={heroAction.href}>
                  <Button size="sm" className="hw-btn-primary gap-1.5 px-5 h-9">
                    {heroAction.cta} <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </Link>
                <Link href="/jobs">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-9 text-muted-foreground hover:text-foreground"
                  >
                    Skip for now
                  </Button>
                </Link>
                {heroJob.score != null && (
                  <div className="ml-auto flex items-center gap-1.5">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{
                        background:
                          heroJob.score >= 70
                            ? "#22c55e"
                            : heroJob.score >= 50
                              ? "#f59e0b"
                              : "#ef4444",
                      }}
                    />
                    <span className="text-sm font-bold text-foreground tabular-nums">
                      {heroJob.score}%
                    </span>
                    <span className="text-xs text-muted-foreground">
                      Confidence
                    </span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div
              className="rounded-3xl px-6 py-10 flex flex-col items-center text-center gap-3"
              style={{
                background: "hsl(var(--card))",
                border: "1px dashed rgba(26,23,20,0.12)",
                boxShadow: "0 1px 3px rgba(26,23,20,0.04)",
              }}
            >
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center"
                style={{ background: "hsl(var(--muted))" }}
              >
                <Target className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">
                  No active jobs yet
                </p>
                <p className="text-xs text-muted-foreground mt-1 max-w-xs leading-relaxed">
                  Add your first job posting — HireWire will analyze it against
                  your career context and tell you exactly what to do next.
                </p>
              </div>
              <Link href="/jobs/new">
                <Button size="sm" className="hw-btn-primary gap-1.5 mt-1 px-5">
                  <Plus className="h-3.5 w-3.5" /> Paste a job description
                </Button>
              </Link>
            </div>
          )}

          {/* ── TODAY'S QUEUE ── */}
          <div>
            <p className="hw-section-label mb-2.5">{"Today's Queue"}</p>
            <div className="grid grid-cols-3 gap-3">
              {[
                {
                  label: "Needs Action",
                  count: needsActionJobs.length,
                  icon: AlertTriangle,
                  color: "text-rose-600",
                  numColor: needsActionJobs.length > 0 ? "#e11d48" : undefined,
                  iconBg: "#fff1f2",
                  iconColor: "#e11d48",
                  href: "/jobs?filter=needs-action",
                },
                {
                  label: "Needs Review",
                  count: needsReviewJobs.length,
                  icon: Clock,
                  color: "text-amber-600",
                  numColor: needsReviewJobs.length > 0 ? "#d97706" : undefined,
                  iconBg: "#fffbeb",
                  iconColor: "#d97706",
                  href: "/jobs?filter=needs-review",
                },
                {
                  label: "Ready to Apply",
                  count: readyJobs.length,
                  icon: CheckCircle2,
                  color: "text-emerald-600",
                  numColor: readyJobs.length > 0 ? "#059669" : undefined,
                  iconBg: "#ecfdf5",
                  iconColor: "#059669",
                  href: "/ready-to-apply",
                },
              ].map((q) => (
                <Link key={q.label} href={q.href}>
                  <div
                    className="rounded-2xl px-4 py-4 flex flex-col gap-2 group transition-all hover:-translate-y-0.5 hover:shadow-md cursor-pointer"
                    style={cardBase}
                  >
                    {/* Icon circle */}
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center"
                      style={{ background: q.iconBg }}
                    >
                      <q.icon
                        className="h-4 w-4"
                        style={{ color: q.iconColor }}
                      />
                    </div>
                    {/* Number */}
                    <p
                      className="text-[28px] font-bold tabular-nums leading-none"
                      style={{
                        color:
                          q.numColor ?? "hsl(var(--muted-foreground)/0.35)",
                      }}
                    >
                      {q.count}
                    </p>
                    {/* Label + arrow */}
                    <div className="flex items-center justify-between mt-0.5">
                      <p className="text-xs font-medium text-muted-foreground">
                        {q.label}
                      </p>
                      <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/30 group-hover:text-muted-foreground/60 transition-colors" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* ── PIPELINE OVERVIEW ── */}
          <div>
            <p className="hw-section-label mb-2.5">Pipeline Overview</p>
            <div className="grid grid-cols-4 gap-2.5">
              {[
                {
                  label: "Jobs Active",
                  value: activeJobs.length,
                  icon: Briefcase,
                  color: "#1a1714",
                },
                {
                  label: "Need Attention",
                  value: needAttention,
                  icon: AlertTriangle,
                  color: "#d97706",
                },
                {
                  label: "Ready to Apply",
                  value: readyJobs.length,
                  icon: CheckCircle2,
                  color: "#059669",
                },
                {
                  label: "Submitted",
                  value: submittedJobs.length,
                  icon: Send,
                  color: "#3b82f6",
                },
              ].map((s) => (
                <div
                  key={s.label}
                  className="rounded-xl px-3.5 py-3 flex flex-col gap-0.5"
                  style={cardBase}
                >
                  <s.icon
                    className="h-3.5 w-3.5 mb-1"
                    style={{ color: s.color }}
                  />
                  <p
                    className="text-[22px] font-bold tabular-nums leading-none"
                    style={{ color: s.color }}
                  >
                    {s.value}
                  </p>
                  <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider mt-0.5">
                    {s.label}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* ── RECENT PIPELINE ── */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <p className="hw-section-label">Recent Pipeline</p>
              <Link
                href="/jobs"
                className="text-xs text-primary font-semibold flex items-center gap-1 hover:gap-1.5 transition-all"
              >
                View all jobs <ArrowRight className="h-3 w-3" />
              </Link>
            </div>

            {jobList.length === 0 ? (
              <div
                className="rounded-2xl px-5 py-10 flex flex-col items-center text-center gap-3"
                style={{
                  background: "hsl(var(--card))",
                  border: "1px dashed rgba(26,23,20,0.12)",
                }}
              >
                <div className="hw-empty-icon">
                  <Briefcase className="h-5 w-5 text-muted-foreground" />
                </div>
                <p className="text-sm font-semibold">No jobs yet</p>
                <p className="text-xs text-muted-foreground max-w-xs leading-relaxed">
                  Add a job posting to start building your intelligence
                  pipeline.
                </p>
              </div>
            ) : (
              <div className="rounded-2xl overflow-hidden" style={cardBase}>
                {jobList.slice(0, 5).map((job, i) => {
                  const tier = urgencyTier(job);
                  const ss = statusStyle(job.status);
                  const displayStatus = STATUS_LABEL[job.status] ?? job.status;
                  const gaps = (job.score_gaps as string[] | null) ?? [];
                  return (
                    <div
                      key={job.id}
                      className={`flex items-center gap-3 px-5 py-3 group hover:bg-muted/30 transition-colors ${i > 0 ? "border-t" : ""}`}
                      style={{ borderColor: "rgba(26,23,20,0.05)" }}
                    >
                      {/* Avatar */}
                      <div
                        className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold text-muted-foreground"
                        style={{ background: "hsl(var(--muted))" }}
                      >
                        {(job.company_name ??
                          job.role_title ??
                          "?")[0]?.toUpperCase()}
                      </div>

                      {/* Job info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-foreground truncate">
                            {job.role_title ?? "Untitled Role"}
                          </p>
                          <Badge
                            variant="outline"
                            className={`text-[10px] font-semibold shrink-0 ${ss.bg} ${ss.text} ${ss.border}`}
                          >
                            {displayStatus}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <p className="text-xs text-muted-foreground">
                            {job.company_name ?? "—"}
                          </p>
                          {gaps.length > 0 && (
                            <>
                              <span className="text-muted-foreground/30 text-xs">
                                ·
                              </span>
                              <span className="text-[11px] text-rose-600 font-medium">
                                Missing {gaps.length} proof point
                                {gaps.length !== 1 ? "s" : ""}
                              </span>
                            </>
                          )}
                          {gaps.length === 0 && tier === "review" && (
                            <>
                              <span className="text-muted-foreground/30 text-xs">
                                ·
                              </span>
                              <span className="text-[11px] text-amber-600 font-medium">
                                Review resume
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Score + time */}
                      <div className="hidden sm:flex items-center gap-4 shrink-0">
                        {job.score != null && (
                          <div className="text-right">
                            <p className="text-sm font-bold tabular-nums text-foreground">
                              {job.score}%
                            </p>
                            <p className="text-[10px] text-muted-foreground">
                              Confidence
                            </p>
                          </div>
                        )}
                        <div className="text-right min-w-12">
                          <p className="text-xs text-muted-foreground">
                            {timeAgo(job.updated_at ?? job.created_at)}
                          </p>
                        </div>
                      </div>

                      {/* CTA buttons */}
                      <div className="flex items-center gap-1 shrink-0">
                        {tier === "action" && (
                          <Link href={`/jobs/${job.id}/evidence-match`}>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-[11px] h-7 px-2.5 text-rose-600 border-rose-200 hover:bg-rose-50 font-semibold"
                            >
                              Fix
                            </Button>
                          </Link>
                        )}
                        {tier === "review" && (
                          <Link href={`/jobs/${job.id}/documents`}>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-[11px] h-7 px-2.5 text-amber-600 border-amber-200 hover:bg-amber-50 font-semibold"
                            >
                              Review
                            </Button>
                          </Link>
                        )}
                        {tier === "ready" && (
                          <Link href="/ready-to-apply">
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-[11px] h-7 px-2.5 text-emerald-600 border-emerald-200 hover:bg-emerald-50 font-semibold"
                            >
                              Apply
                            </Button>
                          </Link>
                        )}
                        <Link href={`/jobs/${job.id}`}>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-[11px] h-7 px-2 text-muted-foreground"
                          >
                            Open <ArrowRight className="h-3 w-3 ml-1" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ─── RIGHT RAIL ─── */}
        <div className="shrink-0 space-y-3" style={{ width: 264 }}>
          {/* ── PIPELINE INTELLIGENCE — dark intelligence surface ── */}
          <div
            className="rounded-2xl p-4 relative overflow-hidden"
            style={{
              background: "#111110",
              border: "1px solid rgba(255,255,255,0.07)",
              boxShadow:
                "0 0 0 1px rgba(0,0,0,0.4), 0 4px 24px rgba(0,0,0,0.35), 0 0 40px rgba(189,10,10,0.07)",
            }}
          >
            {/* Subtle red ambient glow top-right */}
            <div
              className="absolute top-0 right-0 w-32 h-20 pointer-events-none"
              style={{
                background:
                  "radial-gradient(ellipse at top right, rgba(189,10,10,0.12) 0%, transparent 70%)",
              }}
            />

            <div className="relative z-10">
              <div className="flex items-center gap-1.5 mb-3">
                <BarChart2 className="h-3.5 w-3.5 text-primary" />
                <p
                  className="text-[10px] font-bold uppercase tracking-widest"
                  style={{ color: "rgba(255,255,255,0.5)" }}
                >
                  Pipeline Intelligence
                </p>
              </div>

              <p className="text-xs font-semibold text-white mb-2">
                Your pipeline at a glance
              </p>
              <div className="space-y-1.5 mb-4">
                {needAttention > 0 && (
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                    <p
                      className="text-xs"
                      style={{ color: "rgba(255,255,255,0.65)" }}
                    >
                      {needAttention} job{needAttention !== 1 ? "s" : ""} need
                      your attention
                    </p>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <div
                    className={`w-1.5 h-1.5 rounded-full shrink-0 ${readyJobs.length > 0 ? "bg-emerald-400" : "bg-white/20"}`}
                  />
                  <p
                    className="text-xs"
                    style={{ color: "rgba(255,255,255,0.65)" }}
                  >
                    {readyJobs.length} job{readyJobs.length !== 1 ? "s" : ""}{" "}
                    ready to apply
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <div
                    className={`w-1.5 h-1.5 rounded-full shrink-0 ${submittedJobs.length > 0 ? "bg-blue-400" : "bg-white/20"}`}
                  />
                  <p
                    className="text-xs"
                    style={{ color: "rgba(255,255,255,0.65)" }}
                  >
                    {submittedJobs.length > 0
                      ? `${submittedJobs.length} application${submittedJobs.length !== 1 ? "s" : ""} submitted`
                      : "No applications submitted yet"}
                  </p>
                </div>
              </div>

              {heroJob && (
                <>
                  <div
                    className="mb-2"
                    style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}
                  />
                  <p
                    className="text-[10px] font-bold uppercase tracking-wider mb-2"
                    style={{ color: "rgba(255,255,255,0.4)" }}
                  >
                    Biggest opportunity
                  </p>
                  <Link href={`/jobs/${heroJob.id}`}>
                    <div
                      className="rounded-xl p-3 group transition-all cursor-pointer"
                      style={{
                        background: "rgba(255,255,255,0.06)",
                        border: "1px solid rgba(255,255,255,0.08)",
                      }}
                    >
                      <p className="text-xs font-semibold text-white leading-snug">
                        {heroJob.role_title}
                      </p>
                      <p
                        className="text-[11px] mt-0.5"
                        style={{ color: "rgba(255,255,255,0.45)" }}
                      >
                        {heroJob.score != null
                          ? `${heroJob.score}% confidence`
                          : "High fit potential"}
                      </p>
                      <p className="text-xs font-semibold text-primary mt-2 flex items-center gap-0.5 group-hover:gap-1.5 transition-all">
                        Take action <ArrowRight className="h-3 w-3" />
                      </p>
                    </div>
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* ── QUICK ACTIONS — light surface ── */}
          <div className="rounded-2xl p-4" style={cardBase}>
            <div className="flex items-center gap-1.5 mb-3">
              <div
                className="w-5 h-5 rounded-md flex items-center justify-center"
                style={{ background: "#fef9c3" }}
              >
                <Zap className="h-3 w-3 text-amber-500" />
              </div>
              <p className="hw-section-label">Quick Actions</p>
            </div>

            <div className="space-y-0.5">
              {[
                {
                  href: "/jobs/new",
                  icon: Plus,
                  label: "Paste a job description",
                  desc: "Analyze a new opportunity",
                },
                {
                  href: "/coach",
                  icon: Sparkles,
                  label: "Improve a resume",
                  desc: "Tailor for a specific role",
                },
                {
                  href: "/coach",
                  icon: Target,
                  label: "Ask Coach",
                  desc: "Get personalized guidance",
                },
              ].map((a) => (
                <Link key={a.label} href={a.href}>
                  <div className="flex items-center gap-2.5 p-2 rounded-xl group hover:bg-muted/60 transition-colors">
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                      style={{ background: "hsl(var(--muted))" }}
                    >
                      <a.icon className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-foreground leading-tight">
                        {a.label}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {a.desc}
                      </p>
                    </div>
                    <ArrowRight className="h-3 w-3 text-muted-foreground/25 group-hover:text-muted-foreground/60 transition-colors shrink-0" />
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* MOMENTUM + RECENT ACTIVITY */}
          <div className="rounded-2xl p-4" style={cardBase}>
            <div className="flex items-center gap-1.5 mb-3">
              <div
                className="w-5 h-5 rounded-md flex items-center justify-center"
                style={{ background: "hsl(var(--primary)/0.08)" }}
              >
                <BarChart2 className="h-3 w-3 text-primary" />
              </div>
              <p className="hw-section-label">Momentum</p>
            </div>
            <p className="text-xs text-muted-foreground mb-1">
              Applications this week
            </p>
            <div className="flex items-baseline justify-between mb-1.5">
              <p className="text-xl font-bold tabular-nums text-foreground">
                {appliedThisWeek.length}{" "}
                <span className="text-xs font-normal text-muted-foreground">
                  / 5
                </span>
              </p>
              <p className="text-[10px] text-muted-foreground">Target</p>
            </div>
            <div
              className="h-1.5 rounded-full overflow-hidden mb-2.5"
              style={{ background: "hsl(var(--muted))" }}
            >
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${Math.min((appliedThisWeek.length / 5) * 100, 100)}%`,
                  background:
                    appliedThisWeek.length >= 5
                      ? "#22c55e"
                      : appliedThisWeek.length >= 3
                        ? "#f59e0b"
                        : "hsl(var(--primary))",
                }}
              />
            </div>
            {appliedThisWeek.length === 0 ? (
              <>
                <p className="text-xs font-semibold text-rose-600">
                  {"You're behind pace."}
                </p>
                <Link
                  href="/ready-to-apply"
                  className="text-xs font-medium text-primary flex items-center gap-1 mt-1 hover:gap-1.5 transition-all"
                >
                  View analytics <ArrowRight className="h-3 w-3" />
                </Link>
              </>
            ) : appliedThisWeek.length < 5 ? (
              <p className="text-xs text-amber-600 font-medium">
                {5 - appliedThisWeek.length} more to hit your target.
              </p>
            ) : (
              <p className="text-xs text-emerald-600 font-medium">
                Target reached this week!
              </p>
            )}
            {/* RECENT ACTIVITY */}
            <div
              className="rounded-xl p-3.5 mt-4"
              style={{
                background: "hsl(var(--card))",
                border: "1px solid rgba(26,23,20,0.07)",
                boxShadow:
                  "0 1px 3px rgba(26,23,20,0.04), 0 3px 8px rgba(26,23,20,0.04)",
              }}
            >
              <div className="flex items-center gap-1.5 mb-2.5">
                <div className="w-5 h-5 rounded-md bg-muted flex items-center justify-center">
                  <Activity className="h-3 w-3 text-muted-foreground" />
                </div>
                <p className="hw-section-label">Recent Activity</p>
              </div>
              {(recentEvents ?? []).length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  No activity yet.
                </p>
              ) : (
                <div className="space-y-2">
                  {(recentEvents ?? []).map((event) => (
                    <div
                      key={event.id}
                      className="flex items-start justify-between gap-2"
                    >
                      {event.job_id ? (
                        <Link
                          href={`/jobs/${event.job_id}`}
                          className="text-xs text-foreground hover:text-primary transition-colors leading-snug flex-1 min-w-0 truncate"
                        >
                          {EVENT_LABEL[event.event_type] ?? event.event_type}
                        </Link>
                      ) : (
                        <span className="text-xs text-foreground leading-snug flex-1 min-w-0 truncate">
                          {EVENT_LABEL[event.event_type] ?? event.event_type}
                        </span>
                      )}
                      <span className="text-[10px] text-muted-foreground shrink-0 tabular-nums">
                        {timeAgo(event.created_at)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
              <Link
                href="/logs"
                className="mt-3 block text-[10px] text-primary hover:underline"
              >
                Full activity log →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
