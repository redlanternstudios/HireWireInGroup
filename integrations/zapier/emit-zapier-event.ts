// --- ZAPIER EMIT HELPER ---
import fetch from 'node-fetch'
import type { DomainEvent } from "@/lib/domain-events/event-types"

export async function emitZapierEvent(event: DomainEvent) {
  const zapierWebhookUrl = process.env.ZAPIER_WEBHOOK_URL
  if (!zapierWebhookUrl) return
  try {
    await fetch(zapierWebhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(event)
    })
  } catch {
    // Never throw
  }
}
