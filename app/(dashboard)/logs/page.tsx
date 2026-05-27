import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  History,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Info,
  Clock,
  Briefcase,
  Zap,
  ShieldCheck,
} from "lucide-react";

export const dynamic = "force-dynamic";

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

/** Map domain event severity to UI config. */
const SEVERITY_CONFIG: Record<
  string,
  { icon: React.ElementType; bg: string; text: string; dot: string }
> = {
  info: {
    icon: Info,
    bg: "bg-blue-50",
    text: "text-blue-700",
    dot: "bg-blue-500",
  },
  warning: {
    icon: AlertTriangle,
    bg: "bg-amber-50",
    text: "text-amber-700",
    dot: "bg-amber-500",
  },
  error: {
    icon: XCircle,
    bg: "bg-rose-50",
    text: "text-rose-700",
    dot: "bg-rose-500",
  },
  critical: {
    icon: XCircle,
    bg: "bg-rose-100",
    text: "text-rose-800",
    dot: "bg-rose-700",
  },
  // legacy fallbacks
  success: {
    icon: CheckCircle,
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    dot: "bg-emerald-500",
  },
  pending: {
    icon: Clock,
    bg: "bg-stone-100",
    text: "text-stone-600",
    dot: "bg-stone-400",
  },
};

const EVENT_LABELS: Record<string, string> = {
  job_created: "Job added",
  job_analyzed: "Job analyzed",
  job_deleted: "Job removed",
  evidence_added: "Evidence added",
  evidence_updated: "Evidence updated",
  evidence_deleted: "Evidence removed",
  evidence_mapped: "Evidence mapped",
  requirement_addressed: "Requirement addressed",
  resume_uploaded: "Resume uploaded",
  voice_profile_extracted: "Voice profile extracted",
  documents_generated: "Documents generated",
  document_edited: "Document edited",
  format_changed: "Format changed",
  font_changed: "Font changed",
  quality_passed: "Quality check passed",
  quality_failed: "Quality check failed",
  quality_invalidated: "Quality invalidated",
  package_reviewed: "Package accepted",
  package_invalidated: "Package needs review",
  package_quality_override: "Package quality override",
  readiness_changed: "Readiness updated",
  voice_drift_detected: "Voice drift detected",
  override_logged: "Override logged",
  application_submitted: "Application submitted",
  application_failed: "Application failed",
  outcome_updated: "Outcome updated",
  coach_action_taken: "Coach action",
  export_generated: "Document exported",
};

const EVENT_CATEGORIES = [
  {
    key: "job_analysis",
    label: "Job Analysis",
    desc: "AI parsing and fit scoring",
  },
  {
    key: "document_gen",
    label: "Doc Generation",
    desc: "Resume and cover letter creation",
  },
  {
    key: "quality_review",
    label: "Quality Review",
    desc: "Evidence and claim verification",
  },
  {
    key: "applications",
    label: "Applications",
    desc: "Submissions and outcomes",
  },
  { key: "exports", label: "Exports", desc: "Document downloads" },
];

export default async function LogsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Primary: domain_events (canonical event store)
  const [
    domainEventsResult,
    receiptsResult,
    aiAuditResult,
    usageResult,
    governanceResult,
    qualityResult,
  ] = await Promise.all([
    supabase
      .from("domain_events")
      .select("id, event_type, job_id, severity, payload, metadata, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(100),
    supabase
      .from("hirewire_receipts")
      .select("id, receipt_id, receipt_type, action, job_id, domain_event_id, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(8),
    supabase
      .from("ai_generation_audit_logs")
      .select("id, request_id, job_id, route, operation, provider, model, status, latency_ms, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(8),
    supabase
      .from("usage_records")
      .select("id, resource_type, quantity, occurred_at, metadata")
      .eq("user_id", user.id)
      .order("occurred_at", { ascending: false })
      .limit(8),
    supabase
      .from("generation_governance_runs")
      .select("id, job_id, governance_passed, drift_score, failed_at_phase, evaluated_at")
      .eq("user_id", user.id)
      .order("evaluated_at", { ascending: false })
      .limit(8),
    supabase
      .from("generation_quality_checks")
      .select("id, job_id, passed, issues_count, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(8),
  ]);

  const domainEvents = domainEventsResult.data ?? [];
  const receipts = receiptsResult.data ?? [];
  const aiAudits = aiAuditResult.data ?? [];
  const usageRecords = usageResult.data ?? [];
  const governanceRuns = governanceResult.data ?? [];
  const qualityChecks = qualityResult.data ?? [];
  const proofArtifactCount =
    receipts.length +
    aiAudits.length +
    usageRecords.length +
    governanceRuns.length +
    qualityChecks.length;

  type EventRow = {
    id: string | number;
    event_type: string;
    severity?: string;
    status?: string;
    message?: string;
    summary?: string;
    created_at: string;
    job_id?: string | null;
  };

  let eventList: EventRow[] = [];

  if (domainEvents && domainEvents.length > 0) {
    eventList = domainEvents.map((e) => ({
      id: e.id,
      event_type: e.event_type,
      severity: e.severity ?? "info",
      status: e.severity ?? "info",
      job_id: e.job_id ?? null,
      created_at: e.created_at,
    }));
  } else {
    // Fallback 1: career_activity_log
    const { data: activityLog } = await supabase
      .from("career_activity_log")
      .select("id, object_type, object_id, summary, metadata, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(100);

    if (activityLog && activityLog.length > 0) {
      eventList = activityLog.map((e) => ({
        id: e.id,
        event_type:
          ((e as Record<string, unknown>).object_type as string) ?? "event",
        summary:
          ((e as Record<string, unknown>).summary as string) ?? undefined,
        status: "info",
        severity: "info",
        created_at: e.created_at,
      }));
    } else {
      // Fallback 2: processing_events
      const { data: legacyEvents } = await supabase
        .from("processing_events")
        .select("id, event_type, status, message, metadata, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(100);
      eventList = (legacyEvents ?? []).map((e) => ({
        id: e.id,
        event_type:
          ((e as Record<string, unknown>).event_type as string) ?? "event",
        status: ((e as Record<string, unknown>).status as string) ?? "pending",
        message:
          ((e as Record<string, unknown>).message as string) ?? undefined,
        severity: ((e as Record<string, unknown>).status as string) ?? "info",
        created_at: e.created_at,
      }));
    }
  }

  const infoCount = eventList.filter(
    (e) =>
      (e.severity ?? e.status) === "info" ||
      (e.severity ?? e.status) === "success",
  ).length;
  const warningCount = eventList.filter(
    (e) => (e.severity ?? e.status) === "warning",
  ).length;
  const errorCount = eventList.filter(
    (e) =>
      (e.severity ?? e.status) === "error" ||
      (e.severity ?? e.status) === "critical",
  ).length;

  return (
    <div className="hw-page">
      {/* ─── Header ─── */}
      <div className="hw-page-header">
        <div>
          <p className="hw-section-label mb-1">Audit Trail</p>
          <h1 className="hw-page-title">Activity Log</h1>
          <p className="hw-page-subtitle">
            Every mutation across your jobs, documents, and pipeline.
          </p>
        </div>
      </div>

      {/* ─── Metric Strip ─── */}
      <div className="hw-metrics">
        <div className="hw-stat">
          <span className="hw-stat-value">{eventList.length}</span>
          <span className="hw-stat-label">Total events</span>
        </div>
        <div className="hw-stat">
          <span className="hw-stat-value text-blue-600">{infoCount}</span>
          <span className="hw-stat-label">Info</span>
        </div>
        <div className="hw-stat">
          <span className="hw-stat-value text-amber-600">{warningCount}</span>
          <span className="hw-stat-label">Warnings</span>
        </div>
        <div className="hw-stat">
          <span className="hw-stat-value text-rose-500">{errorCount}</span>
          <span className="hw-stat-label">Errors</span>
        </div>
        <div className="hw-stat">
          <span className="hw-stat-value text-emerald-600">
            {proofArtifactCount}
          </span>
          <span className="hw-stat-label">Proof artifacts</span>
        </div>
      </div>

      {/* ─── Workspace ─── */}
      <div className="hw-workspace">
        {/* Main — Timeline */}
        <div className="hw-workspace-main">
          {eventList.length === 0 ? (
            <div className="hw-empty">
              <div className="hw-empty-icon">
                <History className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-semibold">No activity yet</p>
                <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                  Events appear here as you add jobs, run analysis, generate
                  documents, and apply. Your complete event history will live
                  here.
                </p>
              </div>
              <Link href="/jobs">
                <Button size="sm" variant="outline" className="gap-1.5">
                  <Briefcase className="h-3.5 w-3.5" /> View pipeline
                </Button>
              </Link>
            </div>
          ) : (
            <div className="hw-card overflow-hidden">
              <div className="divide-y divide-border/60">
                {eventList.map((event) => {
                  const severityKey = (event.severity ??
                    event.status ??
                    "info") as string;
                  const cfg =
                    SEVERITY_CONFIG[severityKey] ?? SEVERITY_CONFIG.info;
                  const Icon = cfg.icon;
                  const label =
                    EVENT_LABELS[event.event_type] ?? event.event_type;
                  const detail = event.message ?? event.summary ?? null;
                  return (
                    <div
                      key={event.id}
                      className="flex items-start gap-4 px-5 py-4 group hover:bg-accent/30 transition-colors"
                    >
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${cfg.bg}`}
                      >
                        <Icon className={`h-3.5 w-3.5 ${cfg.text}`} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-semibold text-foreground">
                            {label}
                          </p>
                          <span
                            className={`inline-flex items-center gap-1 text-[10px] font-medium ${cfg.text}`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`}
                            />
                            {severityKey}
                          </span>
                          {event.event_type !== label && (
                            <span className="text-[10px] text-muted-foreground/60 font-mono">
                              {event.event_type}
                            </span>
                          )}
                        </div>
                        {detail && (
                          <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                            {detail}
                          </p>
                        )}
                        {event.job_id && (
                          <Link
                            href={`/jobs/${event.job_id}`}
                            className="text-[11px] text-primary/60 hover:text-primary mt-0.5 block"
                          >
                            View job
                          </Link>
                        )}
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-[11px] text-muted-foreground">
                          {timeAgo(event.created_at)}
                        </p>
                        <p className="text-[10px] text-muted-foreground/60 mt-0.5 hidden sm:block">
                          {formatDate(event.created_at)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right Rail */}
        <div className="hw-workspace-rail">
          <div>
            <h2 className="hw-section-label mb-3">What Gets Logged</h2>
            <div className="hw-panel p-4 space-y-3">
              {EVENT_CATEGORIES.map((cat) => (
                <div key={cat.key} className="flex items-start gap-2.5">
                  <Zap className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-semibold text-foreground">
                      {cat.label}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {cat.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4">
            <h2 className="hw-section-label mb-2">Proof Artifacts</h2>
            <div className="hw-panel p-4 space-y-3">
              {[
                {
                  label: "Receipts",
                  value: receipts.length,
                  detail: receipts[0]?.receipt_type ?? "No receipts yet",
                },
                {
                  label: "AI audits",
                  value: aiAudits.length,
                  detail: aiAudits[0]
                    ? `${aiAudits[0].operation} · ${aiAudits[0].status}`
                    : "No AI audits yet",
                },
                {
                  label: "Usage records",
                  value: usageRecords.length,
                  detail: usageRecords[0]?.resource_type ?? "No usage yet",
                },
                {
                  label: "Governance",
                  value: governanceRuns.length,
                  detail: governanceRuns[0]
                    ? governanceRuns[0].governance_passed
                      ? "Latest passed"
                      : `Latest failed ${governanceRuns[0].failed_at_phase ?? "governance"}`
                    : "No governance yet",
                },
                {
                  label: "Quality checks",
                  value: qualityChecks.length,
                  detail: qualityChecks[0]
                    ? qualityChecks[0].passed
                      ? "Latest passed"
                      : `${qualityChecks[0].issues_count ?? 0} issues`
                    : "No quality checks yet",
                },
              ].map((item) => (
                <div key={item.label} className="flex items-start gap-2.5">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-xs font-semibold text-foreground">
                        {item.label}
                      </p>
                      <span className="text-xs font-semibold text-emerald-700">
                        {item.value}
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground truncate">
                      {item.detail}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4">
            <h2 className="hw-section-label mb-2">Severity Key</h2>
            <div className="hw-panel p-4 space-y-2">
              {(["info", "warning", "error"] as const).map((key) => {
                const cfg = SEVERITY_CONFIG[key];
                const Icon = cfg.icon;
                return (
                  <div key={key} className="flex items-center gap-2">
                    <Icon className={`h-3.5 w-3.5 ${cfg.text} shrink-0`} />
                    <p className="text-xs font-medium text-foreground capitalize">
                      {key}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
