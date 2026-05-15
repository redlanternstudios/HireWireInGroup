import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { eventType, payload } = body

    if (!eventType || typeof eventType !== "string") {
      return NextResponse.json(
        { status: "error", received: false, message: "eventType is required" },
        { status: 400 }
      )
    }

    return NextResponse.json({
      status: "scaffold",
      message: "MCP receiver is not configured yet",
      received: true,
      eventType,
      payload,
    })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
