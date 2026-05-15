import { requireUser } from "@/lib/supabase/require-user"
import { NextRequest, NextResponse } from "next/server"
import { analyzeJobProfileGap } from "@/lib/integrity/gap-analyzer"
import { isAnthropicConfigured } from "@/lib/ai/gateway"

export async function POST(req: NextRequest) {
  try {
    const auth = await requireUser()
    if (!auth.ok) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    const { jobDescription, resume } = await req.json()
    if (!jobDescription || !resume) {
      return NextResponse.json({ success: false, error: "Missing jobDescription or resume" }, { status: 400 })
    }
    if (!isAnthropicConfigured()) {
      return NextResponse.json({ success: false, error: "AI Gateway not configured. Integrity checks require an AI_GATEWAY_API_KEY." }, { status: 503 })
    }
    const results = await analyzeJobProfileGap(jobDescription, resume)
    return NextResponse.json({ success: true, results })
  } catch (err) {
    return NextResponse.json({ success: false, error: err instanceof Error ? err.message : "Integrity check failed" }, { status: 500 })
  }
}
