import { requireUser } from "@/lib/supabase/require-user"
import { NextRequest, NextResponse } from "next/server"
import { simulateEmployerVerification } from "@/lib/integrity/verification-simulator"

export async function POST(req: NextRequest) {
  try {
    const { user } = await requireUser()
    const { claims } = await req.json()
    if (!Array.isArray(claims)) {
      return NextResponse.json({ success: false, error: "Missing claims array" }, { status: 400 })
    }
    const results = await simulateEmployerVerification(claims)
    return NextResponse.json({ success: true, results })
  } catch (err) {
    return NextResponse.json({ success: false, error: "Unauthorized or error" }, { status: 401 })
  }
}
