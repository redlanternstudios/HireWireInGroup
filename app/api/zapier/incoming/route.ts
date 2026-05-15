import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  // Incoming webhooks are called by Zapier servers, not user browsers — session
  // auth doesn't apply. If ZAPIER_WEBHOOK_SECRET is set, verify the shared secret.
  const secret = process.env.ZAPIER_WEBHOOK_SECRET
  if (secret) {
    const provided = request.headers.get("x-zapier-secret")
    if (provided !== secret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
  }

  try {
    const body = await request.json()
    const { eventType, payload } = body

    return NextResponse.json({
      received: true,
      eventType,
      payload,
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Invalid Zapier payload" },
      { status: 400 }
    )
  }
}

