import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";


import { evaluateReadiness } from "@/lib/readiness/evaluator";
import { cn } from "@/lib/utils";
import {
  Plus,
  Briefcase,
  ArrowRight,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Send,
  BarChart2,
  Activity,
} from "lucide-react";

type ProveFitDecisionRow = {
  job_id: string | null;
  requirement_id?: string | null;
  decision?: string | null;
  claim_text?: string | null;
};

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
  package_quality_override: "Package quality override",
  export_generated: "Document exported",
};

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [
    { data: profile },
    { data: jobs },
    { data: recentEvents },
    { data: proveFitDecisions },
    { data: analysisPresence },
  ] =
    await Promise.all([
      supabase
        .from("user_profile")
        .select("full_name, headline")
        .eq("user_id", user.id)
        .maybeSingle(),
      supabase
        .from("jobs")
        .select(
          "id, role_title, company_name, status, score, quality_passed, generated_resume, generated_cover_letter, evidence_map, applied_at, created_at, updated_at, score_gaps, gap_clarifications, gaps_addressed",
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
      supabase
        .from("prove_fit_decisions")
        .select("job_id, requirement_id, decision, claim_text")
        .eq("user_id", user.id),
      supabase
        .from("job_analyses")
        .select("job_id")
        .eq("user_id", user.id),
    ]);

  const jobList = jobs ?? [];
  const firstName = profile?.full_name?.split(" ")[0] ?? "there";
  const decisionsByJobId = new Map<string, ProveFitDecisionRow[]>();
  for (const decision of (proveFitDecisions ?? []) as ProveFitDecisionRow[]) {
    if (!decision.job_id) continue;
    const list = decisionsByJobId.get(decision.job_id) ?? [];
    list.push(decision);
    decisionsByJobId.set(decision.job_id, list);
  }
  const analysisJobIds = new Set(
    ((analysisPresence ?? []) as Array<{ job_id: string | null }>)
      .map((row) => row.job_id)
      .filter((id): id is string => typeof id === "string" && id.length > 0),
  );
  const withReadinessInputs = <T extends { id: string }>(job: T) => ({
    ...job,
    analysis_present: analysisJobIds.has(job.id),
    prove_fit_decisions: decisionsByJobId.get(job.id) ?? [],
  });

  const evaluatedJobs = jobList.map((job) => ({
    job,
    readiness: evaluateReadiness(withReadinessInputs(job)),
  }));
  const needsActionJobs = evaluatedJobs
    .filter(
      ({ readiness }) =>
        readiness.outcome === "active" &&
        !readiness.isReady &&
        readiness.displayState !== "package_review",
    )
    .map(({ job }) => job);
  const needsReviewJobs = evaluatedJobs
    .filter(({ readiness }) => readiness.displayState === "package_review")
    .map(({ job }) => job);
  const readyJobs = evaluatedJobs
    .filter(({ readiness }) => readiness.canApply)
    .map(({ job }) => job);
  const submittedJobs = evaluatedJobs
    .filter(({ readiness }) => readiness.outcome !== "active")
    .map(({ job }) => job);
  const activeJobs = jobList.filter(
    (j) => evaluateReadiness(withReadinessInputs(j)).outcome === "active",
  );
  const needAttention = needsActionJobs.length + needsReviewJobs.length;
  const reentryJob =
    needsActionJobs[0] ??
    needsReviewJobs[0] ??
    evaluatedJobs.find(({ readiness }) => {
      return readiness.outcome === "active" && readiness.stage !== "ready";
    })?.job ??
    null;
  const reentryReadiness = reentryJob ? evaluateReadiness(withReadinessInputs(reentryJob)) : null;
  const recentPipelineJobs = reentryJob
    ? jobList.filter((job) => job.id !== reentryJob.id)
    : jobList;

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

  const attentionItems = needsActionJobs.length + needsReviewJobs.length;
  const subtitle =
    attentionItems > 0
      ? `You've got ${attentionItems} item${attentionItems !== 1 ? "s" : ""} that need your attention today.`
      : readyJobs.length > 0
        ? `${readyJobs.length} job${readyJobs.length !== 1 ? "s" : ""} ready to apply today.`
        : "Your pipeline is up to date.";

  return (
    <div className="hw-page">
      {/* ─── HEADER ─── */}
      <div className="flex items-start justify-between gap-4 mb-5">
        <div>
          <p className="hw-section-label mb-1">Command Center</p>
          <h1 className="text-[26px] font-bold tracking-tight text-foreground leading-tight">
            {greeting()},{" "}
            <span className="text-primary">{firstName}.</span>
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
          <Link href="/jobs?add=true">
            <Button size="icon" className="hw-btn-primary h-9 w-9" aria-label="Add job" title="Add job">
              <Plus className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>
      </div>

      {reentryJob && reentryReadiness?.nextAction && (
        <div
          className={cn(
            "hw-card mb-5 border-l-4 px-5 py-4",
            reentryReadiness.blockedReasons.length > 0
              ? "border-l-amber-500"
              : "border-l-primary",
          )}
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="hw-section-label mb-1">Resume where you left off</p>
              <h2 className="text-sm font-semibold text-foreground">
                {reentryJob.role_title ?? "Untitled job."}
              </h2>
              <p className="text-xs text-muted-foreground">
                {reentryJob.company_name ?? "Unknown company."}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                {reentryReadiness.nextAction.description}
              </p>
            </div>
            <Link href={reentryReadiness.nextAction.href} className="shrink-0">
              <Button size="sm" className="hw-btn-primary gap-1.5">
                {reentryReadiness.nextAction.label}
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* ─── TWO-COLUMN WORKSPACE ─── */}
      <div className="hw-workspace">
        {/* ─── MAIN COLUMN ─── */}
        <div className="hw-workspace-main space-y-4">
          {jobList.length === 0 && (
            <div className="rounded-3xl px-6 py-10 flex flex-col items-center text-center gap-3 hw-card border-dashed border-border/70 shadow-sm">
              <div>
                <p className="text-sm font-semibold text-foreground">
                  No active jobs yet
                </p>
                <p className="text-xs text-muted-foreground mt-1 max-w-xs leading-relaxed">
                  Add your first job posting — HireWire will analyze it against
                  your career context and tell you exactly what to do next.
                </p>
              </div>
              <Link href="/jobs?add=true">
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
                },
                {
                  label: "Needs Review",
                  count: needsReviewJobs.length,
                  icon: Clock,
                  color: "text-amber-600",
                  numColor: needsReviewJobs.length > 0 ? "#d97706" : undefined,
                  iconBg: "#fffbeb",
                  iconColor: "#d97706",
                },
                {
                  label: "Ready to Apply",
                  count: readyJobs.length,
                  icon: CheckCircle2,
                  color: "text-emerald-600",
                  numColor: readyJobs.length > 0 ? "#059669" : undefined,
                  iconBg: "#ecfdf5",
                  iconColor: "#059669",
                },
              ].map((q) => (
                <div key={q.label} className="rounded-2xl px-4 py-4 flex flex-col gap-2 hw-card">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center"
                    style={{ background: q.iconBg }}
                  >
                    <q.icon
                      className="h-4 w-4"
                      style={{ color: q.iconColor }}
                    />
                  </div>
                  <p
                    className="text-[28px] font-bold tabular-nums leading-none"
                    style={{
                      color:
                        q.numColor ?? "hsl(var(--muted-foreground)/0.35)",
                    }}
                  >
                    {q.count}
                  </p>
                  <p className="text-xs font-medium text-muted-foreground">
                    {q.label}
                  </p>
                </div>
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
                <div key={s.label} className="rounded-xl px-3.5 py-3 flex flex-col gap-0.5 hw-card">
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

            {recentPipelineJobs.length === 0 ? (
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
                  {jobList.length === 0
                    ? "Add a job posting to start building your intelligence pipeline."
                    : "No other recent jobs to show."}
                </p>
              </div>
            ) : (
              <div className="rounded-2xl overflow-hidden hw-card">
                {recentPipelineJobs.slice(0, 5).map((job, i) => {
                  const readiness = evaluateReadiness(withReadinessInputs(job));
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
                            {job.role_title ?? "Untitled job."}
                          </p>
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-[10px] font-semibold shrink-0",
                              readiness.displayClassName,
                            )}
                          >
                            {readiness.displayLabel}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <p className="text-xs text-muted-foreground">
                            {job.company_name ?? "Unknown company."}
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
                          {gaps.length === 0 && readiness.displayState === "package_review" && (
                            <>
                              <span className="text-muted-foreground/30 text-xs">
                                ·
                              </span>
                              <span className="text-[11px] text-amber-600 font-medium">
                                Review package
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

                      <Link href={`/jobs/${job.id}`} className="text-xs font-semibold text-primary hover:underline shrink-0">
                        Open
                      </Link>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ─── RIGHT RAIL ─── */}
        <div className="hw-workspace-rail space-y-3">
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

            </div>
          </div>

          {/* MOMENTUM + RECENT ACTIVITY */}
          <div className="rounded-2xl p-4 hw-card">
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
