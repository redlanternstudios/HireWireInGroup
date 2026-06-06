import { NextResponse } from "next/server"
import { requireUser } from "@/lib/supabase/require-user"

export async function POST(request: Request) {
  const auth = await requireUser()
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const { eventType, payload } = await request.json()
    // Accept N8N_JOB_INTAKE_WEBHOOK_URL as alias for ZAPIER_WEBHOOK_URL
    const zapierWebhookUrl = process.env.ZAPIER_WEBHOOK_URL || process.env.N8N_JOB_INTAKE_WEBHOOK_URL

    if (!zapierWebhookUrl) {
      return NextResponse.json(
        { error: "Webhook URL not configured (set ZAPIER_WEBHOOK_URL or N8N_JOB_INTAKE_WEBHOOK_URL)" },
        { status: 500 }
      )
    }

    const response = await fetch(zapierWebhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ eventType, payload }),
    })

    if (!response.ok) {
      throw new Error(`Zapier webhook failed with status ${response.status}`)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to relay Zapier event" },
      { status: 500 }
    )
  }
}

