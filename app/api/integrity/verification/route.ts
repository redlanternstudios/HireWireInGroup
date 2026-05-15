import { requireUser } from "@/lib/supabase/require-user"
import { NextRequest, NextResponse } from "next/server"
import { simulateEmployerVerification } from "@/lib/integrity/verification-simulator"
import { isAnthropicConfigured } from "@/lib/adapters/anthropic"

export async function POST(req: NextRequest) {
  try {
    const auth = await requireUser()
    if (!auth.ok) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    const { claims } = await req.json()
    if (!Array.isArray(claims)) {
      return NextResponse.json({ success: false, error: "Missing claims array" }, { status: 400 })
    }
    if (!isAnthropicConfigured()) {
      return NextResponse.json({ success: false, error: "AI not configured. Add GROQ_API_KEY to enable integrity checks." }, { status: 503 })
    }
    const results = await simulateEmployerVerification(claims)
    return NextResponse.json({ success: true, results })
  } catch (err) {
    return NextResponse.json({ success: false, error: err instanceof Error ? err.message : "Integrity check failed" }, { status: 500 })
  }
}
