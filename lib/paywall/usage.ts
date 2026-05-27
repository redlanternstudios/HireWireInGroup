import type { createClient } from "@/lib/supabase/server";

type ServerSupabase = Awaited<ReturnType<typeof createClient>>;

export type UsageResourceType =
  | "document_generation"
  | "job_analysis"
  | "ai_request"
  | "export";

export async function recordUsage(
  supabase: ServerSupabase,
  input: {
    userId: string;
    resourceType: UsageResourceType;
    quantity?: number;
    unit?: string;
    occurredAt?: string;
    metadata?: Record<string, unknown>;
  },
): Promise<void> {
  try {
    await supabase.from("usage_records").insert({
      user_id: input.userId,
      resource_type: input.resourceType,
      quantity: input.quantity ?? 1,
      unit: input.unit ?? "count",
      occurred_at: input.occurredAt ?? new Date().toISOString(),
      metadata: input.metadata ?? {},
    });
  } catch {
    // Usage records are audit infrastructure; existing counters remain canonical.
  }
}
