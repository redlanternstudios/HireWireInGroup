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

  if (jobList.length === 0) {
    return (
      <div className="hw-page mx-auto w-full max-w-4xl">
        <div className="py-4 sm:py-8">
          <h1 className="max-w-2xl text-[30px] font-bold leading-tight tracking-tight text-foreground sm:text-[36px]">
            Let&apos;s analyze your first opportunity,{" "}
            <span className="text-primary">{firstName}.</span>
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground sm:text-base">
            Paste one job description. HireWire will match it to your real
            evidence, coach you through anything missing, and build a resume
            you can defend in an interview.
          </p>
        </div>

        <div className="hw-card overflow-hidden rounded-3xl">
          <div className="p-6 sm:p-8">
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
                <Briefcase className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <h2 className="text-lg font-semibold text-foreground">
                  Start with a job you are considering
                </h2>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  A copied job description is enough. You can review everything
                  before HireWire saves the opportunity.
                </p>
              </div>
            </div>

            <Link href="/jobs?add=true" className="mt-6 block sm:inline-block">
              <Button className="hw-btn-primary h-11 w-full gap-2 px-6 sm:w-auto">
                Paste a job description
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>

          <div className="border-t border-border/60 bg-muted/20 px-6 py-5 sm:px-8">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              What happens next
            </p>
            <ol className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                ["1", "Read the role", "Extract what the employer actually needs."],
                ["2", "Match your evidence", "Connect each requirement to real proof."],
                ["3", "Build with your coach", "Talk through gaps and strengthen the story together."],
                ["4", "Check every claim", "See why the finished resume fits this job."],
              ].map(([number, title, description]) => (
                <li key={number} className="flex gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-border bg-background text-xs font-bold text-foreground">
                    {number}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{title}</p>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">
                      {description}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-muted-foreground">
          <span>Your profile and evidence are ready.</span>
          <Link href="/evidence" className="font-semibold text-primary hover:underline">
            Review career context
          </Link>
          <Link href="/coach" className="font-semibold text-primary hover:underline">
            Ask the coach
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="hw-page mx-auto w-full max-w-4xl">
      <div className="flex items-start justify-between gap-4 pb-6 pt-2">
        <div>
          <h1 className="text-[28px] font-bold leading-tight tracking-tight text-foreground">
            {greeting()},{" "}
            <span className="text-primary">{firstName}.</span>
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
            Focus on one opportunity at a time. HireWire will keep everything else organized.
          </p>
        </div>
        <Link href="/jobs?add=true" className="shrink-0">
          <Button size="sm" variant="outline" className="gap-1.5">
            <Plus className="h-3.5 w-3.5" />
            Add job
          </Button>
        </Link>
      </div>

      {reentryJob && reentryReadiness?.nextAction ? (
        <section className="hw-card overflow-hidden rounded-3xl">
          <div className="p-6 sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
              Your next best step
            </p>
            <div className="mt-3 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
              <div className="min-w-0">
                <h2 className="text-xl font-semibold text-foreground">
                  {reentryJob.role_title ?? "Continue this opportunity"}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {reentryJob.company_name ?? "Company details not added yet"}
                </p>
                <p className="mt-4 max-w-xl text-sm leading-6 text-muted-foreground">
                  {reentryReadiness.nextAction.description}
                </p>
              </div>
              <Link href={reentryReadiness.nextAction.href} className="shrink-0">
                <Button className="hw-btn-primary h-10 gap-2 px-5">
                  {reentryReadiness.nextAction.label}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </section>
      ) : null}

      <section className="mt-7">
        <div className="mb-3 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-foreground">Your opportunities</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              {jobList.length} saved · {readyJobs.length} ready to apply
            </p>
          </div>
          <Link href="/jobs" className="text-xs font-semibold text-primary hover:underline">
            View all
          </Link>
        </div>

        <div className="hw-card overflow-hidden rounded-2xl">
          {recentPipelineJobs.slice(0, 5).map((job, index) => {
            const readiness = evaluateReadiness(withReadinessInputs(job));
            return (
              <div
                key={job.id}
                className={cn(
                  "flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-muted/30 sm:px-5",
                  index > 0 && "border-t border-border/60",
                )}
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-muted text-xs font-bold text-muted-foreground">
                  {(job.company_name ?? job.role_title ?? "?")[0]?.toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-semibold text-foreground">
                      {job.role_title ?? "Untitled opportunity"}
                    </p>
                    <Badge
                      variant="outline"
                      className={cn("shrink-0 text-[10px] font-semibold", readiness.displayClassName)}
                    >
                      {readiness.displayLabel}
                    </Badge>
                  </div>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">
                    {job.company_name ?? "Company not added"}
                  </p>
                </div>
                <div className="hidden text-right sm:block">
                  <p className="text-xs text-muted-foreground">
                    {timeAgo(job.updated_at ?? job.created_at)}
                  </p>
                </div>
                <Link href={`/jobs/${job.id}`} className="shrink-0 text-xs font-semibold text-primary hover:underline">
                  Open
                </Link>
              </div>
            );
          })}
        </div>
      </section>

      <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-muted-foreground">
        <span>Nothing else is urgent right now.</span>
        <Link href="/ready-to-apply" className="font-semibold text-primary hover:underline">
          View ready applications
        </Link>
        <Link href="/logs" className="font-semibold text-primary hover:underline">
          View activity
        </Link>
      </div>
    </div>
  );
}
