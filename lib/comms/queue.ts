import type { createClient } from "@/lib/supabase/server";
import type { CommunicationChannel, CommunicationPriority, CommunicationReason } from "./reasons";

type ServerSupabase = Awaited<ReturnType<typeof createClient>>;

export type QueueNotificationInput = {
  userId: string;
  reason: CommunicationReason;
  channel: Extract<CommunicationChannel, "email" | "notification" | "in_app">;
  body: string;
  subject?: string;
  templateId?: string;
  templateData?: Record<string, unknown>;
  priority?: Extract<CommunicationPriority, "low" | "normal" | "high"> | "urgent";
  recipient?: string;
  scheduledFor?: string;
  metadata?: Record<string, unknown>;
};

export async function queueNotification(
  supabase: ServerSupabase,
  input: QueueNotificationInput,
): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from("notification_queue")
      .insert({
        user_id: input.userId,
        reason: input.reason,
        channel: input.channel,
        status: "queued",
        priority: input.priority ?? "normal",
        subject: input.subject ?? null,
        body: input.body,
        template_id: input.templateId ?? null,
        template_data: input.templateData ?? {},
        recipient: input.recipient ?? null,
        scheduled_for: input.scheduledFor ?? null,
        metadata: input.metadata ?? {},
      })
      .select("id")
      .maybeSingle();

    if (error) return null;
    return data?.id ?? null;
  } catch {
    return null;
  }
}
