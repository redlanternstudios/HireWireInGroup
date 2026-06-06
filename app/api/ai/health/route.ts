import { NextResponse } from "next/server"
import {
  AI_MODELS,
  generateText,
  getAiGatewayStatus,
  isAiGatewayConfigured,
} from "@/lib/ai/gateway"

export async function GET() {
  const startedAt = Date.now()
  const status = getAiGatewayStatus()

  if (!isAiGatewayConfigured()) {
    return NextResponse.json(
      {
        healthy: false,
        provider: status.provider,
        model: status.model,
        keyExists: false,
        reachable: false,
        latencyMs: Date.now() - startedAt,
        message: "AI Gateway is not configured. Add AI_GATEWAY_API_KEY to enable live AI.",
      },
      { status: 503 }
    )
  }

  try {
    const result = await generateText(
      {
        model: AI_MODELS.QUALITY,
        prompt: "Reply with exactly: ok",
      },
      { route: "/api/ai/health", operation: "health_check" }
    )

    const text = result.text.trim().toLowerCase()
    const healthy = text.includes("ok")

    return NextResponse.json(
      {
        healthy,
        provider: status.provider,
        model: status.model,
        keyExists: true,
        reachable: healthy,
        latencyMs: Date.now() - startedAt,
        message: healthy ? "AI Gateway is healthy." : "AI Gateway responded unexpectedly.",
      },
      { status: healthy ? 200 : 502 }
    )
  } catch (error) {
    return NextResponse.json(
      {
        healthy: false,
        provider: status.provider,
        model: status.model,
        keyExists: true,
        reachable: false,
        latencyMs: Date.now() - startedAt,
        message: error instanceof Error ? error.message : "AI Gateway health check failed.",
      },
      { status: 502 }
    )
  }
}
