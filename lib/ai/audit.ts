import { createClient } from "@/lib/supabase/server";

type AiAuditStatus = "success" | "error" | "timeout" | "rate_limited";

export type AiAuditEvent = {
  requestId: string;
  userId?: string | null;
  jobId?: string | null;
  route: string;
  operation: string;
  requestedModel?: string | null;
  selectedProvider: string;
  selectedModel: string;
  keySource?: string | null;
  timeoutMs?: number | null;
  success: boolean;
  latencyMs: number;
  failureReason?: string;
  usage?: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
  };
  finishReason?: string | null;
  metadata?: Record<string, unknown>;
};

function classifyStatus(event: AiAuditEvent): AiAuditStatus {
  if (event.success) return "success";
  const message = event.failureReason?.toLowerCase() ?? "";
  if (message.includes("timeout") || message.includes("abort")) return "timeout";
  if (message.includes("rate") || message.includes("429")) return "rate_limited";
  return "error";
}

export async function writeAiAuditEvent(event: AiAuditEvent): Promise<void> {
  try {
    const supabase = await createClient();
    const decidedAt = new Date().toISOString();

    await supabase.from("ai_routing_decisions").upsert(
      {
        request_id: event.requestId,
        user_id: event.userId ?? null,
        job_id: event.jobId ?? null,
        route: event.route,
        operation: event.operation,
        requested_model: event.requestedModel ?? event.selectedModel,
        selected_provider: event.selectedProvider,
        selected_model: event.selectedModel,
        key_source: event.keySource ?? null,
        timeout_ms: event.timeoutMs ?? null,
        selection_reason: "environment_config",
        fallback_used: false,
        fallback_count: 0,
        constraints_met: true,
        constraint_violations: [],
        metadata: event.metadata ?? {},
        decided_at: decidedAt,
      },
      { onConflict: "request_id" },
    );

    await supabase.from("ai_generation_audit_logs").insert({
      request_id: event.requestId,
      user_id: event.userId ?? null,
      job_id: event.jobId ?? null,
      route: event.route,
      operation: event.operation,
      provider: event.selectedProvider,
      model: event.selectedModel,
      status: classifyStatus(event),
      latency_ms: event.latencyMs,
      prompt_tokens: event.usage?.promptTokens ?? null,
      completion_tokens: event.usage?.completionTokens ?? null,
      total_tokens: event.usage?.totalTokens ?? null,
      finish_reason: event.finishReason ?? null,
      error_message: event.failureReason ?? null,
      metadata: event.metadata ?? {},
      created_at: decidedAt,
    });
  } catch {
    // AI audit must never block generation or health checks.
  }
}
