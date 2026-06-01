import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { BarChart3, Lock, TrendingUp } from "lucide-react";

export const dynamic = "force-dynamic";

type ScoreRel = { overall_score?: number } | { overall_score?: number }[] | null;

function readScore(scores: ScoreRel): number | null {
  const s = Array.isArray(scores) ? scores[0]?.overall_score : scores?.overall_score;
  return typeof s === "number" ? s : null;
}

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
        "id, status, created_at, quality_passed, generated_resume, applied_at, job_scores(overall_score)",
      )
      .eq("user_id", user.id)
      .is("deleted_at", null)
      .order("created_at", { ascending: false }),
  ]);

  const isPro = userData?.plan_type === "pro";
  const jobList = jobs ?? [];

  // ── Section 1: pipeline summary ─────────────────────────────
  const total = jobList.length;
  const generated = jobList.filter((j) => Boolean(j.generated_resume)).length;
  const applied = jobList.filter((j) =>
    ["applied", "interviewing", "offered", "rejected"].includes(j.status ?? ""),
  ).length;
  const active = jobList.filter((j) =>
    ["applied", "interviewing", "offered"].includes(j.status ?? ""),
  ).length;

  // ── Section 2: score distribution ──────────────────────────
  const scores = jobList
    .map((j) => readScore(j.job_scores as ScoreRel))
    .filter((s): s is number => s !== null);

  const bands = [
    { label: "Excellent", range: "90-100", min: 90, color: "bg-emerald-500" },
    { label: "Strong", range: "75-89", min: 75, color: "bg-sky-500" },
    { label: "Moderate", range: "50-74", min: 50, color: "bg-amber-500" },
    { label: "Weak", range: "<50", min: 0, color: "bg-rose-400" },
  ].map((b, i, arr) => {
    const max = i === 0 ? Infinity : arr[i - 1].min;
    const count = scores.filter((s) => s >= b.min && s < max).length;
    return { ...b, count };
  });
  const maxBand = Math.max(1, ...bands.map((b) => b.count));

  // ── Section 3: application outcomes ────────────────────────
  const outcomes = [
    { label: "In pipeline", key: "applied", color: "bg-blue-500" },
    { label: "Interviewing", key: "interviewing", color: "bg-indigo-500" },
    { label: "Offered", key: "offered", color: "bg-emerald-500" },
    { label: "Closed", key: "rejected", color: "bg-rose-400" },
  ].map((o) => ({
    ...o,
    count: jobList.filter((j) => j.status === o.key).length,
  }));
  const outcomeTotal = Math.max(1, applied);

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

      {/* ─── Section 1: Pipeline summary (always visible) ─── */}
      <div className="hw-metrics">
        <div className="hw-stat">
          <span className="hw-stat-value">{total}</span>
          <span className="hw-stat-label">Jobs tracked</span>
        </div>
        <div className="hw-stat">
          <span className="hw-stat-value">{generated}</span>
          <span className="hw-stat-label">Documents generated</span>
        </div>
        <div className="hw-stat">
          <span className="hw-stat-value">{applied}</span>
          <span className="hw-stat-label">Applied</span>
        </div>
        <div className="hw-stat">
          <span className="hw-stat-value text-blue-600">{active}</span>
          <span className="hw-stat-label">Active in pipeline</span>
        </div>
      </div>

      {total === 0 ? (
        <div className="hw-empty">
          <div className="hw-empty-icon">
            <BarChart3 className="h-5 w-5 text-muted-foreground" />
          </div>
          <div>
            <p className="text-sm font-semibold">No data yet</p>
            <p className="text-xs text-muted-foreground mt-1 max-w-xs">
              Analytics populate as you add jobs and track applications. Start by
              analyzing your first job posting.
            </p>
          </div>
          <Link href="/jobs">
            <Button size="sm" variant="outline">
              View pipeline
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {/* ─── Section 2: Score distribution ─── */}
          <ProGated isPro={isPro} title="Score distribution">
            <div className="hw-card p-5">
              <div className="flex items-center justify-between mb-5">
                <h2 className="hw-section-label">Score distribution</h2>
                <span className="text-[11px] text-muted-foreground">
                  {scores.length} scored
                </span>
              </div>
              {scores.length === 0 ? (
                <p className="text-xs text-muted-foreground py-4">
                  No fit scores yet. Analyze jobs to populate this chart.
                </p>
              ) : (
                <div className="flex flex-col gap-4">
                  {bands.map((b) => (
                    <div key={b.label} className="flex items-center gap-4">
                      <div className="w-28 shrink-0">
                        <p className="text-xs font-medium text-foreground">{b.label}</p>
                        <p className="text-[10px] text-muted-foreground tabular-nums">
                          {b.range}
                        </p>
                      </div>
                      <div className="flex-1 quality-bar h-2.5">
                        <div
                          className={`h-full rounded-full transition-all ${b.color}`}
                          style={{
                            width: `${Math.max(b.count > 0 ? 6 : 0, Math.round((b.count / maxBand) * 100))}%`,
                          }}
                        />
                      </div>
                      <span className="text-xs font-bold text-foreground tabular-nums w-5 text-right">
                        {b.count}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </ProGated>

          {/* ─── Section 3: Application outcomes ─── */}
          <ProGated isPro={isPro} title="Application outcomes">
            <div className="hw-card p-5">
              <div className="flex items-center justify-between mb-5">
                <h2 className="hw-section-label">Application outcomes</h2>
                <span className="text-[11px] text-muted-foreground">
                  {applied} applied
                </span>
              </div>
              {applied === 0 ? (
                <p className="text-xs text-muted-foreground py-4">
                  No applications yet. Outcomes appear once you start applying.
                </p>
              ) : (
                <div className="flex flex-col gap-4">
                  {outcomes.map((o) => (
                    <div key={o.key} className="flex items-center gap-4">
                      <span className="text-xs text-muted-foreground w-24 shrink-0">
                        {o.label}
                      </span>
                      <div className="flex-1 quality-bar h-2.5">
                        <div
                          className={`h-full rounded-full transition-all ${o.color}`}
                          style={{
                            width: `${Math.max(o.count > 0 ? 6 : 0, Math.round((o.count / outcomeTotal) * 100))}%`,
                          }}
                        />
                      </div>
                      <span className="text-xs font-bold text-foreground tabular-nums w-5 text-right">
                        {o.count}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </ProGated>
        </div>
      )}
    </div>
  );
}

/**
 * Wraps Pro-only sections. Free users see the section blurred behind an
 * upgrade overlay; Pro users see the live content.
 */
function ProGated({
  isPro,
  title,
  children,
}: {
  isPro: boolean;
  title: string;
  children: React.ReactNode;
}) {
  if (isPro) return <>{children}</>;
  return (
    <div className="relative">
      <div className="pointer-events-none select-none blur-sm" aria-hidden="true">
        {children}
      </div>
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-2xl bg-background/40 text-center">
        <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
          <Lock className="h-4 w-4 text-muted-foreground" />
        </div>
        <div>
          <p className="text-sm font-semibold">{title}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Pro feature</p>
        </div>
        <Link href="/billing">
          <Button size="sm" className="hw-btn-primary gap-1.5">
            <TrendingUp className="h-3.5 w-3.5" /> Upgrade to Pro
          </Button>
        </Link>
      </div>
    </div>
  );
}
