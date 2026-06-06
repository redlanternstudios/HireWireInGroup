import { NextResponse } from "next/server";

// In-memory event queue for MCP receivers to poll
// In production, this would be persisted to Redis or Supabase
const eventQueue: Array<{ eventType: string; payload: any; timestamp: Date }> = [];
const MAX_QUEUE_SIZE = 1000;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { eventType, payload } = body;

    if (!eventType || typeof eventType !== "string") {
      return NextResponse.json(
        { status: "error", received: false, message: "eventType is required" },
        { status: 400 },
      );
    }

    // Add event to queue
    eventQueue.push({ eventType, payload, timestamp: new Date() });

    // Maintain queue size limit
    if (eventQueue.length > MAX_QUEUE_SIZE) {
      eventQueue.shift();
    }

    // If an external MCP_RECEIVER_URL is configured, forward immediately
    const receiverUrl = process.env.MCP_RECEIVER_URL;
    if (receiverUrl) {
      try {
        await fetch(receiverUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-mcp-secret": process.env.MCP_RECEIVER_SECRET || "",
          },
          body: JSON.stringify({ eventType, payload }),
        });
      } catch (err) {
        console.error("[MCP] Failed to forward to receiver:", err);
        // Continue anyway - event is queued for polling
      }
    }

    return NextResponse.json({
      status: "received",
      eventType,
      queued: true,
      queueSize: eventQueue.length,
    });
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 },
    );
  }
}

// GET endpoint for MCP receivers to poll events
export async function GET(request: Request) {
  const url = new URL(request.url);
  const limit = parseInt(url.searchParams.get("limit") || "10", 10);

  // Return oldest events (FIFO)
  const events = eventQueue.splice(0, Math.min(limit, eventQueue.length));

  return NextResponse.json({
    events,
    remaining: eventQueue.length,
  });
}
