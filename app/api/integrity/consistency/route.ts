import { requireUser } from "@/lib/supabase/require-user"
import { NextRequest, NextResponse } from "next/server"
import { checkResumeLinkedInConsistency } from "@/lib/integrity/consistency-checker"
import { isAnthropicConfigured } from "@/lib/ai/gateway"

export async function POST(req: NextRequest) {
  try {
    const auth = await requireUser()
    if (!auth.ok) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    const { resume, linkedin } = await req.json()
    if (!resume || !linkedin) {
      return NextResponse.json({ success: false, error: "Missing resume or LinkedIn data" }, { status: 400 })
    }
    if (!isAnthropicConfigured()) {
      return NextResponse.json({ success: false, error: "AI Gateway not configured. Integrity checks require an AI_GATEWAY_API_KEY." }, { status: 503 })
    }
    const flags = await checkResumeLinkedInConsistency(resume, linkedin)
    return NextResponse.json({ success: true, flags })
  } catch (err) {
    return NextResponse.json({ success: false, error: err instanceof Error ? err.message : "Integrity check failed" }, { status: 500 })
  }
}
