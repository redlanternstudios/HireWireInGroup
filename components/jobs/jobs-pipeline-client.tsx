"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Briefcase,
  Plus,
  ArrowRight,
  Target,
  Sparkles,
  CheckSquare,
  Send,
  Filter,
  ChevronDown,
  AlertTriangle,
  MoreHorizontal,
  BarChart2,
} from "lucide-react";
import {
  deriveDisplayStage,
  DISPLAY_STAGE_LABEL,
  DISPLAY_STAGE_COLOR,
  STAGE_TO_VIEW,
  type ViewTab,
} from "@/lib/jobs/display-stage";
import { evaluateStaleness } from "@/lib/jobs/staleness";
import {
  derivePriority,
  PRIORITY_LABEL,
  PRIORITY_COLOR,
  PRIORITY_SORT_WEIGHT,
} from "@/lib/jobs/priority";
import { JobInputForm } from "@/app/(dashboard)/jobs/JobInputForm";
import { cn } from "@/lib/utils";
import { getCoachStepState } from "@/lib/coach-step";
import { evaluateReadiness } from "@/lib/readiness/evaluator";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PipelineJob {
  id: string;
  role_title: string | null;
  company_name: string | null;
  status: string | null;
  generation_status: string | null;
  generated_resume: string | null;
  generated_cover_letter: string | null;
  quality_passed: boolean | null;
  applied_at: string | null;
  evidence_map: Record<string, unknown> | null;
  score: number | null;
  score_gaps: string[] | null;
  gap_clarifications?: unknown;
  gaps_addressed?: string[] | null;
  intelligence: Record<string, unknown> | null;
  updated_at: string | null;
  created_at: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(dateStr: string | null | undefined): {
  relative: string;
  date: string;
} {
  if (!dateStr) return { relative: "—", date: "" };
  const d = new Date(dateStr);
  const diff = Date.now() - d.getTime();
  const days = Math.floor(diff / 86400000);
  const date = d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
  if (days === 0) return { relative: "Today", date };
  if (days === 1) return { relative: "Yesterday", date };
  if (days < 7) return { relative: `${days}d ago`, date };
  if (days < 30) return { relative: `${Math.floor(days / 7)}w ago`, date };
  return { relative: `${Math.floor(days / 30)}mo ago`, date };
}

type SortKey =
  | "newest"
  | "closest_ready"
  | "highest_fit"
  | "needs_action_first"
  | "recently_updated"
  | "company_az"
  | "stale_first";

const SORT_LABELS: Record<SortKey, string> = {
  newest: "Newest",
  closest_ready: "Closest to Ready",
  highest_fit: "Highest Fit",
  needs_action_first: "Needs Action First",
  recently_updated: "Recently Updated",
  company_az: "Company A–Z",
  stale_first: "Stale First",
};

type FilterChip =
  | "all"
  | "needs_evidence"
  | "needs_materials"
  | "needs_review"
  | "ready_to_apply"
  | "high_fit"
  | "recently_added"
  | "stale";

const FILTER_LABELS: Record<FilterChip, string> = {
  all: "All",
  needs_evidence: "Needs Evidence",
  needs_materials: "Needs Materials",
  needs_review: "Needs Review",
  ready_to_apply: "Ready to Apply",
  high_fit: "High Fit",
  recently_added: "Recently Added",
  stale: "Stale",
};

const VIEW_TABS: { key: ViewTab; label: string }[] = [
  { key: "active", label: "Active" },
  { key: "needs_action", label: "Needs Action" },
  { key: "ready", label: "Ready" },
  { key: "applied", label: "Applied" },
  { key: "closed", label: "Closed" },
  { key: "archived", label: "Archived" },
  { key: "all", label: "All" },
];

function scoreColor(score: number | null): string {
  if (score === null) return "text-muted-foreground";
  if (score >= 80) return "text-emerald-600";
  if (score >= 65) return "text-amber-600";
  return "text-stone-500";
}

function requirementAnchorId(requirementId: string): string {
  const safeId = requirementId
    .trim()
    .replace(/[^a-zA-Z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `req-${safeId || "unknown"}`;
}

function getFirstUnresolvedRequirementId(job: EnrichedJob): string | null {
  const map = job.evidence_map as
    | {
        requirement_matches?: Array<{
          requirement_id?: string;
          status?: string;
          priority?: string;
        }>;
      }
    | null;

  const matches = Array.isArray(map?.requirement_matches)
    ? map.requirement_matches
    : [];

  const pick = (priority: string) =>
    matches.find(
      (match) =>
        match.priority === priority &&
        (match.status === "gap" ||
          match.status === "unknown" ||
          match.status === "partial") &&
        typeof match.requirement_id === "string" &&
        match.requirement_id.trim().length > 0,
    );

  const required = pick("required");
  if (required?.requirement_id) return required.requirement_id;

  const preferred = pick("preferred");
  if (preferred?.requirement_id) return preferred.requirement_id;

  const any = matches.find(
    (match) =>
      (match.status === "gap" ||
        match.status === "unknown" ||
        match.status === "partial") &&
      typeof match.requirement_id === "string" &&
      match.requirement_id.trim().length > 0,
  );

  return any?.requirement_id ?? null;
}

function requirementResolveHref(job: EnrichedJob): string | null {
  const requirementId = getFirstUnresolvedRequirementId(job);
  if (!requirementId) return null;
  const anchor = requirementAnchorId(requirementId);
  return `/jobs/${job.id}/evidence-match?resolve=${encodeURIComponent(requirementId)}#${anchor}`;
}

// ─── Enriched job ─────────────────────────────────────────────────────────────

function enrichJob(job: PipelineJob) {
  const staleness = evaluateStaleness(job);
  const displayStage = deriveDisplayStage(job, staleness.isStale);
  const view = STAGE_TO_VIEW[displayStage];
  const priority = derivePriority(job, staleness.level === "archive_candidate");
  const coachStep = getCoachStepState(job);
  return { ...job, staleness, displayStage, view, priority, coachStep };
}

type EnrichedJob = ReturnType<typeof enrichJob>;

// ─── Next action per job — sourced from canonical readiness engine ───────────

function nextActionFor(job: EnrichedJob): {
  label: string;
  desc: string;
  href: string;
} {
  const readiness = evaluateReadiness(job);
  
  if (readiness.nextAction) {
    return {
      label: readiness.nextAction.label,
      desc: readiness.nextAction.description,
      href: readiness.nextAction.href,
    };
  }

  // Fallback for applied/closed outcomes
  if (readiness.outcome !== "active") {
    return {
      label: "View application",
      desc: "Track status",
      href: `/jobs/${job.id}`,
    };
  }

  // Final fallback
  return { label: "View", desc: "Open job", href: `/jobs/${job.id}` };
}

// ─── Tags per job ─────────────────────────────────────────────────────────────

function tagsFor(job: EnrichedJob): string[] {
  const tags: string[] = [];
  if (job.displayStage === "needs_evidence") {
    const map = job.evidence_map as Record<string, unknown> | null;
    const gaps = (map?.score_gaps as string[] | null) ?? [];
    if (gaps.length > 0)
      tags.push(
        `Missing ${gaps.length} proof point${gaps.length > 1 ? "s" : ""}`,
      );
    else tags.push("Evidence mapping incomplete");
  }
  if (job.displayStage === "needs_review") tags.push("Review resume");
  if (job.displayStage === "ready_to_generate") tags.push("Needs materials");
  if (job.coachStep.required && !job.coachStep.complete) tags.push("Coach needed");
  if (job.coachStep.skipped) tags.push("Coach skipped");
  if (job.staleness.isStale) tags.push("Stale");
  const ageMs = Date.now() - new Date(job.created_at).getTime();
  if (ageMs < 2 * 86400000) tags.push("Just added");
  return tags.slice(0, 3);
}

// ─── Job Row (dense table-style) ──────────────────────────────────────────────

function JobRow({
  job,
  isLast,
}: {
  job: EnrichedJob;
  isLast: boolean;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const action = nextActionFor(job);
  const resolveHref = requirementResolveHref(job);
  const stageLabel = DISPLAY_STAGE_LABEL[job.displayStage];
  const stageColor = DISPLAY_STAGE_COLOR[job.displayStage];
  const tags = tagsFor(job);
  const time = timeAgo(job.updated_at || job.created_at);
  const fitColor = scoreColor(job.score);
  const evidenceCoverage = job.coachStep.evidenceCoverage;

  return (
    <div
      className={cn(
        "grid items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors group",
        !isLast && "border-b border-border/60",
      )}
      style={{ gridTemplateColumns: "1fr 140px 120px 110px 160px 32px" }}
    >
      {/* JOB column */}
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
          <Briefcase className="h-3.5 w-3.5 text-muted-foreground" />
        </div>
        <div className="min-w-0">
          <Link href={`/jobs/${job.id}`}>
            <p className="text-sm font-semibold text-foreground truncate leading-tight hover:text-primary transition-colors">
              {job.role_title ?? "Untitled role"}
            </p>
          </Link>
          <p className="text-xs text-muted-foreground truncate">
            {job.company_name ?? "—"}
          </p>
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-0.5 text-[10px] px-1.5 py-px rounded bg-amber-50 text-amber-700 border border-amber-200 font-medium"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* STATUS column */}
      <div className="min-w-0">
        <Badge
          variant="outline"
          className={cn(
            "text-[10px] font-semibold px-2 py-0.5 whitespace-nowrap",
            stageColor,
          )}
        >
          {stageLabel}
        </Badge>
        {job.displayStage === "needs_evidence" && (
          <p className="text-[10px] text-muted-foreground mt-1">
            {(
              (job.evidence_map as Record<string, unknown> | null)
                ?.score_gaps as string[] | null
            )?.length ?? 0}{" "}
            blockers
          </p>
        )}
        {job.displayStage === "needs_review" && (
          <p className="text-[10px] text-muted-foreground mt-1">1 review</p>
        )}
      </div>

      {/* FIT SCORE column */}
      <div>
        {job.score !== null ? (
          <>
            <p className={cn("text-sm font-bold tabular-nums", fitColor)}>
              {Math.round(job.score)}%
            </p>
            <p className={cn("text-[10px]", fitColor)}>Strategic fit</p>
            {evidenceCoverage != null && (
              <p className="text-[10px] text-muted-foreground">
                {Math.round(evidenceCoverage)}% evidence
              </p>
            )}
          </>
        ) : (
          <p className="text-xs text-muted-foreground">In progress</p>
        )}
      </div>

      {/* LAST UPDATED column */}
      <div>
        <p className="text-xs text-foreground">{time.relative}</p>
        {time.date && (
          <p className="text-[10px] text-muted-foreground">{time.date}</p>
        )}
      </div>

      {/* NEXT ACTION column */}
      <div>
        <Link href={action.href} className="text-left block">
          <p className="text-xs font-semibold text-foreground hover:text-primary transition-colors">
            {action.label}
          </p>
          <p className="text-[10px] text-muted-foreground">{action.desc}</p>
        </Link>
        {resolveHref && (
          <Link href={resolveHref} className="mt-1 inline-flex">
            <span className="text-[10px] font-semibold text-primary hover:underline">
              Fix gaps
            </span>
          </Link>
        )}
      </div>

      {/* Overflow menu */}
      <div className="relative flex items-center justify-end">
        <button
          type="button"
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          aria-label={`More actions for ${job.role_title ?? "job"}`}
          onClick={() => setMenuOpen((v) => !v)}
          onKeyDown={(e) => {
            if (e.key === "Escape") setMenuOpen(false);
          }}
          className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
        >
          <MoreHorizontal className="h-3.5 w-3.5" />
        </button>
        {menuOpen && (
          <div
            role="menu"
            className="absolute right-0 top-8 z-30 min-w-44 rounded-xl border border-border bg-card py-1 shadow-lg"
          >
            {[
              { label: "View job", href: `/jobs/${job.id}` },
              ...(resolveHref
                ? [
                    {
                      label: "Fix gaps with coach",
                      href: resolveHref,
                    },
                  ]
                : []),
              { label: "Review documents", href: `/jobs/${job.id}/documents` },
              {
                label: "Evidence match",
                href: `/jobs/${job.id}/evidence-match`,
              },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                role="menuitem"
                onClick={() => setMenuOpen(false)}
                className="block px-3 py-2 text-xs text-foreground hover:bg-muted"
              >
                {item.label}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Intelligence Panel ────────────────────────────────────────────────────────

function IntelligencePanel({
  jobs,
  onAddJob,
}: {
  jobs: EnrichedJob[];
  onAddJob: () => void;
}) {
  const total = jobs.length;
  const active = jobs.filter((j) =>
    ["active", "needs_action"].includes(j.view),
  ).length;
  const needsAction = jobs.filter((j) => j.view === "needs_action").length;
  const ready = jobs.filter((j) => j.view === "ready").length;
  const applied = jobs.filter((j) => j.view === "applied").length;
  const stale = jobs.filter((j) => j.staleness.isStale).length;
  const maxBar = Math.max(total, 1);

  const topJob = jobs
    .filter((j) => j.view === "needs_action" || j.view === "active")
    .sort(
      (a, b) =>
        PRIORITY_SORT_WEIGHT[a.priority] - PRIORITY_SORT_WEIGHT[b.priority],
    )[0];

  const todayQueue: {
    num: number;
    label: string;
    time: string;
    href: string;
  }[] = [];
  const evidenceJob = jobs.find((j) => j.displayStage === "needs_evidence");
  if (evidenceJob)
    todayQueue.push({
      num: 1,
      label: `Add missing evidence for ${evidenceJob.role_title ?? "role"}`,
      time: "~15 min",
      href: `/jobs/${evidenceJob.id}/evidence-match`,
    });
  const reviewJob = jobs.find(
    (j) => j.displayStage === "needs_review" && evidenceJob?.id !== j.id,
  );
  if (reviewJob)
    todayQueue.push({
      num: todayQueue.length + 1,
      label: `Review application for ${reviewJob.role_title ?? "role"}`,
      time: "~10 min",
      href: `/jobs/${reviewJob.id}/documents`,
    });
  const materialJob = jobs.find(
    (j) =>
      j.displayStage === "ready_to_generate" &&
      evidenceJob?.id !== j.id &&
      reviewJob?.id !== j.id,
  );
  if (materialJob)
    todayQueue.push({
      num: todayQueue.length + 1,
      label: `Upload materials for ${materialJob.role_title ?? "role"}`,
      time: "~10 min",
      href: `/jobs/${materialJob.id}`,
    });

  return (
    <div className="hw-workspace-rail space-y-3">
      {/* Pipeline Intelligence */}
      <div
        className="rounded-xl overflow-hidden"
        style={{
          background: "hsl(var(--card))",
          border: "1px solid rgba(26,23,20,0.07)",
          boxShadow:
            "0 1px 3px rgba(26,23,20,0.04),0 3px 8px rgba(26,23,20,0.04)",
        }}
      >
        <div className="px-4 py-3 border-b border-border/60 flex items-center gap-2">
          <BarChart2 className="h-3.5 w-3.5 text-primary" />
          <p className="text-[11px] font-bold uppercase tracking-widest text-foreground">
            Pipeline Intelligence
          </p>
        </div>
        <div className="px-4 py-3 space-y-2.5">
          {[
            { label: "Active jobs", count: active, color: "bg-primary" },
            {
              label: "Needs action",
              count: needsAction,
              color: "bg-amber-500",
            },
            { label: "Ready", count: ready, color: "bg-emerald-500" },
            { label: "Applied", count: applied, color: "bg-blue-500" },
            { label: "Stale", count: stale, color: "bg-stone-400" },
          ].map((row) => (
            <div key={row.label} className="flex items-center gap-2">
              <span className="text-[11px] text-muted-foreground w-24 shrink-0">
                {row.label}
              </span>
              <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                <div
                  className={cn("h-full rounded-full", row.color)}
                  style={{
                    width: `${Math.max(row.count > 0 ? 8 : 0, Math.round((row.count / maxBar) * 100))}%`,
                  }}
                />
              </div>
              <span className="text-[11px] font-bold tabular-nums text-foreground w-4 text-right">
                {row.count}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Top Priority */}
      {topJob && (
        <div
          className="rounded-xl overflow-hidden"
          style={{
            background: "hsl(var(--card))",
            border: "1px solid rgba(26,23,20,0.07)",
            boxShadow:
              "0 1px 3px rgba(26,23,20,0.04),0 3px 8px rgba(26,23,20,0.04)",
          }}
        >
          <div className="px-4 py-3 border-b border-border/60 flex items-center gap-2">
            <Target className="h-3.5 w-3.5 text-primary" />
            <p className="text-[11px] font-bold uppercase tracking-widest text-foreground">
              Top Priority
            </p>
          </div>
          <div className="px-4 py-3">
            <p className="text-xs font-semibold text-foreground leading-tight">
              {topJob.role_title ?? "Untitled"}
            </p>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              {topJob.company_name ?? "—"}
            </p>
            <p className="text-[11px] text-foreground mt-2">
              {PRIORITY_LABEL[topJob.priority]} ·{" "}
              {DISPLAY_STAGE_LABEL[topJob.displayStage]}
            </p>
            <Link href={nextActionFor(topJob).href}>
              <span className="text-xs font-semibold text-primary mt-2 inline-flex items-center gap-1 hover:gap-1.5 transition-all">
                Take action <ArrowRight className="h-3 w-3" />
              </span>
            </Link>
          </div>
        </div>
      )}

      {/* Today's Queue */}
      {todayQueue.length > 0 && (
        <div
          className="rounded-xl overflow-hidden"
          style={{
            background: "hsl(var(--card))",
            border: "1px solid rgba(26,23,20,0.07)",
            boxShadow:
              "0 1px 3px rgba(26,23,20,0.04),0 3px 8px rgba(26,23,20,0.04)",
          }}
        >
          <div className="px-4 py-3 border-b border-border/60 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
              <p className="text-[11px] font-bold uppercase tracking-widest text-foreground">
                {"Today's Queue"}
              </p>
            </div>
            <Link href="/jobs">
              <span className="text-[11px] text-primary font-medium">
                View all
              </span>
            </Link>
          </div>
          <div className="divide-y divide-border/60">
            {todayQueue.map((item) => (
              <Link key={item.href} href={item.href}>
                <div className="px-4 py-2.5 hover:bg-muted/40 transition-colors">
                  <div className="flex items-start gap-2">
                    <span className="text-[10px] font-bold text-muted-foreground w-3 shrink-0 mt-px">
                      {item.num}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-semibold text-foreground leading-tight">
                        {item.label}
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {item.time}
                      </p>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div
        className="rounded-xl overflow-hidden"
        style={{
          background: "hsl(var(--card))",
          border: "1px solid rgba(26,23,20,0.07)",
          boxShadow:
            "0 1px 3px rgba(26,23,20,0.04),0 3px 8px rgba(26,23,20,0.04)",
        }}
      >
        <div className="px-4 py-3 border-b border-border/60">
          <p className="text-[11px] font-bold uppercase tracking-widest text-foreground">
            Quick Actions
          </p>
        </div>
        <div className="divide-y divide-border/60">
          {[
            {
              href: "#add",
              icon: Plus,
              label: "Paste a new job",
              desc: "Analyze a job description",
              onClick: onAddJob,
            },
            {
              href: "/coach",
              icon: Sparkles,
              label: "Ask Coach",
              desc: "Get personalized guidance",
              onClick: undefined,
            },
          ].map((item) =>
            item.onClick ? (
              <button
                key={item.label}
                onClick={item.onClick}
                className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-muted/40 transition-colors text-left"
              >
                <item.icon className="h-3.5 w-3.5 text-primary shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-semibold text-foreground">
                    {item.label}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {item.desc}
                  </p>
                </div>
                <ArrowRight className="h-3 w-3 text-muted-foreground/40 shrink-0" />
              </button>
            ) : (
              <Link key={item.label} href={item.href}>
                <div className="px-4 py-2.5 flex items-center gap-3 hover:bg-muted/40 transition-colors">
                  <item.icon className="h-3.5 w-3.5 text-primary shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-semibold text-foreground">
                      {item.label}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {item.desc}
                    </p>
                  </div>
                  <ArrowRight className="h-3 w-3 text-muted-foreground/40 shrink-0" />
                </div>
              </Link>
            ),
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main Client Component ────────────────────────────────────────────────────

export function JobsPipelineClient({ jobs: rawJobs }: { jobs: PipelineJob[] }) {
  const searchParams = useSearchParams();
  const [activeView, setActiveView] = useState<ViewTab>("active");
  const [activeFilter, setActiveFilter] = useState<FilterChip>("all");
  const [sortKey, setSortKey] = useState<SortKey>("needs_action_first");
  const [showSort, setShowSort] = useState(false);
  const [showAddJob, setShowAddJob] = useState(false);

  // Auto-open add job form when ?add=true is present
  useEffect(() => {
    if (searchParams.get("add") === "true") {
      setShowAddJob(true);
    }
  }, [searchParams]);

  const jobs = useMemo(() => rawJobs.map(enrichJob), [rawJobs]);

  const viewCounts = useMemo(() => {
    const counts: Record<ViewTab, number> = {
      active: 0,
      needs_action: 0,
      ready: 0,
      applied: 0,
      closed: 0,
      archived: 0,
      all: jobs.length,
    };
    for (const j of jobs) counts[j.view] = (counts[j.view] ?? 0) + 1;
    return counts;
  }, [jobs]);

  const visible = useMemo(() => {
    let list =
      activeView === "all" ? jobs : jobs.filter((j) => j.view === activeView);

    if (activeFilter !== "all") {
      list = list.filter((j) => {
        switch (activeFilter) {
          case "needs_evidence":
            return j.displayStage === "needs_evidence";
          case "needs_materials":
            return (
              j.displayStage === "ready_to_generate" ||
              j.displayStage === "package_drafted"
            );
          case "needs_review":
            return j.displayStage === "needs_review";
          case "ready_to_apply":
            return j.displayStage === "ready_to_apply";
          case "high_fit":
            return (j.score ?? 0) >= 75;
          case "recently_added":
            return Date.now() - new Date(j.created_at).getTime() < 7 * 86400000;
          case "stale":
            return j.staleness.isStale;
          default:
            return true;
        }
      });
    }

    return [...list].sort((a, b) => {
      switch (sortKey) {
        case "newest":
          return (
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );
        case "recently_updated":
          return (
            new Date(b.updated_at ?? b.created_at).getTime() -
            new Date(a.updated_at ?? a.created_at).getTime()
          );
        case "highest_fit":
          return (b.score ?? -1) - (a.score ?? -1);
        case "needs_action_first":
          return (
            PRIORITY_SORT_WEIGHT[a.priority] - PRIORITY_SORT_WEIGHT[b.priority]
          );
        case "closest_ready": {
          const ord = [
            "inbox",
            "analyzed",
            "needs_evidence",
            "ready_to_generate",
            "package_drafted",
            "needs_review",
            "ready_to_apply",
          ];
          return ord.indexOf(b.displayStage) - ord.indexOf(a.displayStage);
        }
        case "company_az":
          return (a.company_name ?? "").localeCompare(b.company_name ?? "");
        case "stale_first":
          return (
            (b.staleness.daysSinceUpdate ?? 0) -
            (a.staleness.daysSinceUpdate ?? 0)
          );
        default:
          return 0;
      }
    });
  }, [jobs, activeView, activeFilter, sortKey]);

  const needsActionCount = viewCounts.needs_action;
  const staleCount = jobs.filter((j) => j.staleness.isStale).length;

  return (
    <div className="hw-page">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-0.5">
            Pipeline Hub
          </p>
          <h1 className="text-2xl font-bold tracking-tight text-foreground leading-tight">
            All Jobs
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {jobs.length} opportunit{jobs.length === 1 ? "y" : "ies"} tracked
            {needsActionCount > 0 && (
              <>
                {" "}
                &middot;{" "}
                <span className="text-amber-600 font-semibold">
                  {needsActionCount} need{needsActionCount === 1 ? "s" : ""}{" "}
                  action
                </span>
              </>
            )}
          </p>
        </div>
        <Button
          size="sm"
          className="hw-btn-primary gap-1.5 h-9 px-4"
          onClick={() => setShowAddJob((v) => !v)}
        >
          <Plus className="h-3.5 w-3.5" /> Add Job
        </Button>
      </div>

      {/* Add Job form */}
      {showAddJob && (
        <div className="mb-4 rounded-xl p-5 hw-card">
          <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-3">
            Analyze a Job
          </p>
          <JobInputForm />
        </div>
      )}

      {/* Metric cards — 6 across */}
      <div className="grid grid-cols-6 gap-2.5 mb-4">
        {[
          {
            label: "Total",
            value: jobs.length,
            sub: `${jobs.length > 0 ? `↑ ${jobs.length} this week` : "None yet"}`,
            color: "text-foreground",
            subColor: "text-muted-foreground",
          },
          {
            label: "Active",
            value: viewCounts.active,
            sub: "No change",
            color: "text-foreground",
            subColor: "text-muted-foreground",
          },
          {
            label: "Needs Action",
            value: needsActionCount,
            sub:
              needsActionCount > 0
                ? `↑ ${needsActionCount} this week`
                : "No change",
            color: needsActionCount > 0 ? "text-amber-600" : "text-foreground",
            subColor:
              needsActionCount > 0 ? "text-amber-500" : "text-muted-foreground",
          },
          {
            label: "Ready",
            value: viewCounts.ready,
            sub: "No change",
            color: "text-emerald-600",
            subColor: "text-muted-foreground",
          },
          {
            label: "Applied",
            value: viewCounts.applied,
            sub: "No change",
            color: "text-blue-600",
            subColor: "text-muted-foreground",
          },
          {
            label: "Stale",
            value: staleCount,
            sub: "No change",
            color: staleCount > 0 ? "text-orange-500" : "text-foreground",
            subColor: "text-muted-foreground",
          },
        ].map((s) => (
          <div key={s.label} className="rounded-xl px-4 py-3.5 hw-card">
            <p
              className={cn(
                "text-2xl font-bold tabular-nums leading-none",
                s.color,
              )}
            >
              {s.value}
            </p>
            <p className="text-xs font-semibold text-foreground mt-1 uppercase tracking-wide">
              {s.label}
            </p>
            <p className={cn("text-[10px] mt-1", s.subColor)}>{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Main two-column layout */}
      <div className="hw-workspace">
        {/* Left — jobs table */}
        <div className="hw-workspace-main hw-card overflow-hidden">
          {/* View tabs */}
          <div className="flex items-end border-b border-border/70 px-4 pt-3">
            {VIEW_TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => {
                  setActiveView(tab.key);
                  setActiveFilter("all");
                }}
                className={cn(
                  "relative px-3 pb-2.5 pt-0.5 text-xs font-medium transition-colors border-b-2 -mb-px mr-0.5 whitespace-nowrap",
                  activeView === tab.key
                    ? "text-foreground border-primary"
                    : "text-muted-foreground border-transparent hover:text-foreground",
                )}
              >
                {tab.label}
                {viewCounts[tab.key] > 0 && tab.key !== "all" && (
                  <span
                    className={cn(
                      "ml-1.5 text-[10px] font-bold tabular-nums px-1 py-px rounded-full",
                      activeView === tab.key
                        ? "bg-primary/10 text-primary"
                        : "bg-muted text-muted-foreground",
                    )}
                  >
                    {viewCounts[tab.key]}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Filter chips + sort */}
          <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border/60 overflow-x-auto">
            <div className="flex items-center gap-1.5 flex-1">
              {(Object.keys(FILTER_LABELS) as FilterChip[]).map((chip) => (
                <button
                  key={chip}
                  onClick={() => setActiveFilter(chip)}
                  className={cn(
                    "px-2.5 py-1 rounded-full text-[11px] font-medium whitespace-nowrap transition-all border",
                    activeFilter === chip
                      ? "bg-foreground text-background border-foreground"
                      : "bg-transparent text-muted-foreground border-border hover:border-foreground/40 hover:text-foreground",
                  )}
                >
                  {FILTER_LABELS[chip]}
                </button>
              ))}
            </div>
            <div className="relative shrink-0">
              <button
                onClick={() => setShowSort((v) => !v)}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border border-border bg-transparent text-muted-foreground hover:border-foreground/40 hover:text-foreground transition-all whitespace-nowrap"
              >
                <Filter className="h-3 w-3" />
                {SORT_LABELS[sortKey]}
                <ChevronDown className="h-3 w-3" />
              </button>
              {showSort && (
                <div className="absolute right-0 top-full mt-1 bg-card border border-border rounded-xl shadow-lg z-20 py-1 min-w-47.5">
                  {(Object.keys(SORT_LABELS) as SortKey[]).map((key) => (
                    <button
                      key={key}
                      onClick={() => {
                        setSortKey(key);
                        setShowSort(false);
                      }}
                      className={cn(
                        "w-full text-left px-4 py-2 text-xs hover:bg-muted transition-colors",
                        sortKey === key
                          ? "font-semibold text-primary"
                          : "text-foreground",
                      )}
                    >
                      {SORT_LABELS[key]}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Table header */}
          {visible.length > 0 && (
            <div
              className="grid items-center gap-3 px-4 py-2 border-b border-border/60"
              style={{
                gridTemplateColumns: "1fr 140px 120px 110px 160px 32px",
                background: "hsl(var(--muted)/0.3)",
              }}
            >
              {[
                "Job",
                "Status",
                "Fit Score",
                "Last Updated",
                "Next Action",
                "",
              ].map((col) => (
                <p
                  key={col}
                  className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground"
                >
                  {col}
                </p>
              ))}
            </div>
          )}

          {/* Rows */}
          {visible.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-14 text-center">
              <div className="w-10 h-10 rounded-2xl bg-muted flex items-center justify-center">
                {jobs.length === 0 ? (
                  <Briefcase className="h-5 w-5 text-muted-foreground" />
                ) : (
                  <Filter className="h-5 w-5 text-muted-foreground" />
                )}
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">
                  {jobs.length === 0
                    ? "No jobs tracked yet"
                    : activeView === "active" && viewCounts.active === 0
                      ? "Your active queue is clear"
                      : "No jobs match this view"}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {jobs.length === 0
                    ? `Click "Add Job" to start your pipeline.`
                    : activeView === "active" && viewCounts.active === 0
                      ? "View applied jobs or all jobs."
                      : "Try a different view tab or filter."}
                </p>
              </div>
              {jobs.length === 0 ? (
                <button
                  onClick={() => setShowAddJob(true)}
                  className="mt-1 text-xs font-semibold text-primary hover:underline"
                >
                  + Add your first job
                </button>
              ) : activeView === "active" && viewCounts.active === 0 ? (
                <div className="mt-1 flex items-center gap-2">
                  <button
                    onClick={() => {
                      setActiveView("applied");
                      setActiveFilter("all");
                    }}
                    className="rounded-md border border-border px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted"
                  >
                    View Applied
                  </button>
                  <button
                    onClick={() => {
                      setActiveView("all");
                      setActiveFilter("all");
                    }}
                    className="rounded-md bg-foreground px-3 py-1.5 text-xs font-semibold text-background hover:opacity-90"
                  >
                    View All Jobs
                  </button>
                </div>
              ) : null}
            </div>
          ) : (
            <div>
              {visible.map((job, i) => (
                <JobRow
                  key={job.id}
                  job={job}
                  isLast={i === visible.length - 1}
                />
              ))}
              <div className="px-4 py-2.5 border-t border-border/60">
                <p className="text-[11px] text-muted-foreground">
                  Showing {visible.length} of {jobs.length} job
                  {jobs.length === 1 ? "" : "s"}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Right rail */}
        <IntelligencePanel
          jobs={jobs}
          onAddJob={() => setShowAddJob((v) => !v)}
        />
      </div>
    </div>
  );
}
