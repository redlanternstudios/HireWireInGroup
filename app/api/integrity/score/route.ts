// app/api/integrity/score/route.ts
import { requireUser } from "@/lib/supabase/require-user"
import { NextRequest, NextResponse } from "next/server"
import { scoreResumeBullets } from "@/lib/integrity/scorer"

export async function POST(req: NextRequest) {
  try {
    const { user, supabase } = await requireUser()
    const body = await req.json()
    const { resume_version_id, bullets } = body
    if (!Array.isArray(bullets) || !resume_version_id) {
      return NextResponse.json({ success: false, error: "Missing bullets or resume_version_id" }, { status: 400 })
    }
    const results = await scoreResumeBullets(bullets)
    // Store results in DB
    for (let i = 0; i < results.length; i++) {
      const r = results[i]
      await supabase.from("career_integrity_scores").insert({
        user_id: user.id,
        resume_version_id,
        bullet_index: i,
        bullet_text: r.bullet,
        risk_score: r.risk_score,
        risk_level: r.risk_level,
        flag_reason: r.flag_reason,
        suggested_rewrite: r.suggested_rewrite,
      })
    }
    return NextResponse.json({ success: true, results })
  } catch (err) {
    return NextResponse.json({ success: false, error: "Unauthorized or error" }, { status: 401 })
  }
}
