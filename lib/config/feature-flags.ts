import type { createClient } from "@/lib/supabase/server";

type ServerSupabase = Awaited<ReturnType<typeof createClient>>;

export type FeatureFlagKey =
  | "prove_fit_v0"
  | "receipt_backed_domain_events"
  | "silent_ai_audit"
  | "notification_queue"
  | "paywall_usage_records";

export async function isFeatureEnabled(
  supabase: ServerSupabase,
  flagKey: FeatureFlagKey,
  userId?: string | null,
  fallback = false,
): Promise<boolean> {
  try {
    const { data, error } = await supabase.rpc("is_feature_enabled", {
      p_flag_key: flagKey,
      p_user_id: userId ?? null,
    });

    if (!error && typeof data === "boolean") return data;
  } catch {
    // Fall through to direct table read.
  }

  try {
    const { data } = await supabase
      .from("feature_flags")
      .select("status")
      .eq("flag_key", flagKey)
      .maybeSingle();

    return data?.status === "enabled";
  } catch {
    return fallback;
  }
}
