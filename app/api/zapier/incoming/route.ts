import { NextResponse } from "next/server"

export async function POST(request: Request) {
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

