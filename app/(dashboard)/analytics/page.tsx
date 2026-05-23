import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  BarChart3,
  Lock,
  TrendingUp,
  Target,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { evaluateReadiness } from "@/lib/readiness/evaluator";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: userData }, { data: jobs }] = await Promise.all([
    supabase.from("users").select("plan_type").eq("id", user.id).single(),
    supabase
      .from("jobs")
      .select(
        "id, status, created_at, quality_passed, generated_resume, generated_cover_letter, evidence_map, applied_at, score, score_gaps, gap_clarifications, gaps_addressed, job_scores(overall_score)",
      )
      .eq("user_id", user.id)
      .is("deleted_at", null)
      .order("created_at", { ascending: false }),
  ]);

  const isPro = userData?.plan_type === "pro";
  const jobList = jobs ?? [];
  const total = jobList.length;
  const applied = jobList.filter((j) =>
    ["applied", "interviewing", "offered", "rejected"].includes(j.status),
  ).length;
  const generated = jobList.filter(
    (j) => !["draft", "analyzing", "queued"].includes(j.status),
  ).length;
  const active = jobList.filter((j) =>
    ["applied", "interviewing", "offered"].includes(j.status),
  ).length;

  const scoredJobs = jobList.filter((j) => {
    const scores = j.job_scores;
    const score = Array.isArray(scores)
      ? scores[0]?.overall_score
      : (scores as { overall_score?: number } | null)?.overall_score;
    return typeof score === "number";
  });
  const avgScore = scoredJobs.length
    ? Math.round(
        scoredJobs.reduce((a, j) => {
          const scores = j.job_scores;
          const score = Array.isArray(scores)
            ? scores[0]?.overall_score
            : (scores as { overall_score?: number } | null)?.overall_score;
          return a + (score ?? 0);
        }, 0) / scoredJobs.length,
      )
    : null;

  const conversionRate =
    applied > 0 && total > 0 ? Math.round((applied / total) * 100) : null;

  const breakdownRows = [
    {
      label: "Draft / In progress",
      count: jobList.filter((j) =>
        ["draft", "analyzing", "generating", "analyzed"].includes(j.status),
      ).length,
      color: "bg-stone-400",
    },
    {
      label: "Ready to apply",
      count: jobList.filter((j) => evaluateReadiness(j).stage === "ready")
        .length,
      color: "bg-emerald-500",
    },
    {
      label: "Applied",
      count: jobList.filter((j) => j.status === "applied").length,
      color: "bg-blue-500",
    },
    {
      label: "Interviewing",
      count: jobList.filter((j) => j.status === "interviewing").length,
      color: "bg-blue-400",
    },
    {
      label: "Offered",
      count: jobList.filter((j) => j.status === "offered").length,
      color: "bg-violet-500",
    },
    {
      label: "Rejected",
      count: jobList.filter((j) => j.status === "rejected").length,
      color: "bg-rose-400",
    },
  ].filter((r) => r.count > 0);

  const proFeatures = [
    "Application funnel breakdown",
    "Score trends over time",
    "Keyword coverage heatmap",
    "Interview-to-offer rate",
    "Evidence gap analysis",
  ];

  return (
    <div className="hw-page">
      {/* ─── Header ─── */}
      <div className="hw-page-header">
        <div>
          <p className="hw-section-label mb-1">Intelligence</p>
          <h1 className="hw-page-title">Analytics</h1>
          <p className="hw-page-subtitle">
            Your job search performance — built from real pipeline data.
          </p>
        </div>
        {!isPro && (
          <Link href="/billing">
            <Button size="sm" className="hw-btn-primary gap-1.5">
              <TrendingUp className="h-3.5 w-3.5" /> Upgrade to Pro
            </Button>
          </Link>
        )}
      </div>

      {/* ─── Metric Strip ─── */}
      <div className="hw-metrics">
        <div className="hw-stat">
          <span className="hw-stat-value">{total}</span>
          <span className="hw-stat-label">Jobs tracked</span>
        </div>
        <div className="hw-stat">
          <span className="hw-stat-value">{generated}</span>
          <span className="hw-stat-label">Docs generated</span>
        </div>
        <div className="hw-stat">
          <span className="hw-stat-value text-blue-600">{active}</span>
          <span className="hw-stat-label">Active apps</span>
        </div>
        <div className="hw-stat">
          <span className="hw-stat-value">
            {avgScore !== null ? `${avgScore}%` : "—"}
          </span>
          <span className="hw-stat-label">Avg fit score</span>
        </div>
        {conversionRate !== null && (
          <div className="hw-stat">
            <span className="hw-stat-value">{conversionRate}%</span>
            <span className="hw-stat-label">Apply rate</span>
          </div>
        )}
      </div>

      {/* ─── Workspace ─── */}
      <div className="hw-workspace">
        {/* Main */}
        <div className="hw-workspace-main">
          {/* Pipeline Breakdown */}
          {total > 0 ? (
            <div className="hw-card p-5">
              <h2 className="hw-section-label mb-5">Pipeline Breakdown</h2>
              <div className="space-y-4">
                {breakdownRows.map((row) => (
                  <div key={row.label} className="flex items-center gap-4">
                    <span className="text-xs text-muted-foreground w-36 shrink-0">
                      {row.label}
                    </span>
                    <div className="flex-1 quality-bar h-2">
                      <div
                        className={`h-full rounded-full transition-all ${row.color}`}
                        style={{
                          width: `${Math.max(4, Math.round((row.count / total) * 100))}%`,
                        }}
                      />
                    </div>
                    <span className="text-xs font-bold text-foreground tabular-nums w-5 text-right">
                      {row.count}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="hw-empty">
              <div className="hw-empty-icon">
                <BarChart3 className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-semibold">No data yet</p>
                <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                  Analytics populate as you add jobs and track your
                  applications. Start by analyzing your first job posting.
                </p>
              </div>
              <Link href="/jobs?add=true">
                <Button size="sm" className="hw-btn-primary gap-1.5">
                  <Target className="h-3.5 w-3.5" /> Add a job
                </Button>
              </Link>
            </div>
          )}

          {/* Pro gate or coming soon */}
          {isPro ? (
            <div className="hw-card p-10 flex flex-col items-center justify-center text-center gap-3">
              <div className="hw-empty-icon">
                <BarChart3 className="h-5 w-5 text-muted-foreground" />
              </div>
              <p className="text-sm font-semibold">
                Detailed charts coming soon
              </p>
              <p className="text-xs text-muted-foreground max-w-xs">
                Full analytics dashboard is in development. Your pipeline
                breakdown above is live data.
              </p>
            </div>
          ) : (
            <div className="hw-card p-8 flex flex-col items-center justify-center text-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center">
                <Lock className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-semibold">
                  Detailed analytics is a Pro feature
                </p>
                <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                  Upgrade to unlock application funnel analysis, score trends,
                  keyword coverage, and outcome quality framing.
                </p>
              </div>
              <Link href="/billing">
                <Button size="sm" className="hw-btn-primary gap-1.5">
                  <TrendingUp className="h-3.5 w-3.5" /> Upgrade to Pro
                </Button>
              </Link>
            </div>
          )}
        </div>

        {/* Right Rail */}
        <div className="hw-workspace-rail">
          {/* Outcome framing */}
          <div>
            <h2 className="hw-section-label mb-3">What This Measures</h2>
            <div className="hw-panel p-4 space-y-3">
              <p className="text-xs text-muted-foreground leading-relaxed">
                HireWire tracks quality over volume. A smaller pipeline with
                higher fit scores produces better outcomes than a spray-and-pray
                approach.
              </p>
              <div className="space-y-2 pt-1">
                {[
                  { label: "Fit score", desc: "How well you match the role" },
                  {
                    label: "Apply rate",
                    desc: "Applications vs. jobs tracked",
                  },
                  {
                    label: "Interview rate",
                    desc: "Interviews vs. applications",
                  },
                ].map((item) => (
                  <div key={item.label} className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary/60 shrink-0 mt-1.5" />
                    <div>
                      <p className="text-xs font-semibold text-foreground">
                        {item.label}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {item.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Pro preview */}
          {!isPro && (
            <div className="mt-4">
              <h2 className="hw-section-label mb-2">Pro Features</h2>
              <div className="hw-panel p-4">
                <div className="space-y-2 mb-4">
                  {proFeatures.map((f) => (
                    <div key={f} className="flex items-center gap-2">
                      <Sparkles className="h-3 w-3 text-primary shrink-0" />
                      <p className="text-xs text-foreground">{f}</p>
                    </div>
                  ))}
                </div>
                <Link href="/billing">
                  <Button size="sm" className="w-full hw-btn-primary gap-1.5">
                    <TrendingUp className="h-3.5 w-3.5" /> Upgrade to Pro
                  </Button>
                </Link>
              </div>
            </div>
          )}

          {/* Next action */}
          <div className="mt-4">
            <h2 className="hw-section-label mb-2">Next Best Action</h2>
            <Link href="/jobs">
              <div className="hw-next-action group">
                <Target className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold">Grow your pipeline</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    More jobs means richer analytics. Add 3–5 strong matches to
                    see trends emerge.
                  </p>
                  <span className="text-xs font-medium text-primary mt-1.5 inline-flex items-center gap-1 group-hover:gap-1.5 transition-all">
                    View pipeline <ArrowRight className="h-3 w-3" />
                  </span>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
