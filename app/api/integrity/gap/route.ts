import { requireUser } from "@/lib/supabase/require-user"
import { NextRequest, NextResponse } from "next/server"
import { analyzeJobProfileGap } from "@/lib/integrity/gap-analyzer"

export async function POST(req: NextRequest) {
  try {
    const { user } = await requireUser()
    const { jobDescription, resume } = await req.json()
    if (!jobDescription || !resume) {
      return NextResponse.json({ success: false, error: "Missing jobDescription or resume" }, { status: 400 })
    }
    const results = await analyzeJobProfileGap(jobDescription, resume)
    return NextResponse.json({ success: true, results })
  } catch (err) {
    return NextResponse.json({ success: false, error: "Unauthorized or error" }, { status: 401 })
  }
}
