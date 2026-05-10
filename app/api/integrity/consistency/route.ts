import { requireUser } from "@/lib/supabase/require-user"
import { NextRequest, NextResponse } from "next/server"
import { checkResumeLinkedInConsistency } from "@/lib/integrity/consistency-checker"

export async function POST(req: NextRequest) {
  try {
    const { user } = await requireUser()
    const { resume, linkedin } = await req.json()
    if (!resume || !linkedin) {
      return NextResponse.json({ success: false, error: "Missing resume or LinkedIn data" }, { status: 400 })
    }
    const flags = await checkResumeLinkedInConsistency(resume, linkedin)
    return NextResponse.json({ success: true, flags })
  } catch (err) {
    return NextResponse.json({ success: false, error: "Unauthorized or error" }, { status: 401 })
  }
}
