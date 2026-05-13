import { requireUser } from "@/lib/supabase/require-user"
import { NextRequest, NextResponse } from "next/server"
import { detectAIContent } from "@/lib/integrity/ai-content-detector"

export async function POST(req: NextRequest) {
  try {
    const result = await requireUser()
    if (!result.ok) return result.response
    const { resumeText } = await req.json()
    if (!resumeText) {
      return NextResponse.json({ success: false, error: "Missing resumeText" }, { status: 400 })
    }
    const flags = await detectAIContent(resumeText)
    return NextResponse.json({ success: true, flags })
  } catch (err) {
    return NextResponse.json({ success: false, error: "Unauthorized or error" }, { status: 401 })
  }
}
