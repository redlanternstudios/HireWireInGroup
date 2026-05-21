import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { handleDomainEvent } from "@/lib/domain-events"
import { mapConfirmedEvidenceToRequirement } from "@/lib/evidence/mapConfirmedEvidenceToRequirement"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })

    const userId = user.id
    const { id: jobId } = await params
    const body = await request.json()
    const requirementId = String(body.requirementId ?? "").trim()
    const evidenceId = String(body.evidenceId ?? "").trim()

    if (!requirementId || !evidenceId) {
      return NextResponse.json(
        { success: false, error: "missing_fields", user_message: "Choose a requirement and evidence item." },
        { status: 400 }
      )
    }

    const [{ data: job }, { data: evidence }] = await Promise.all([
      supabase
        .from("jobs")
        .select("id")
        .eq("id", jobId)
        .eq("user_id", userId)
        .is("deleted_at", null)
        .maybeSingle(),
      supabase
        .from("evidence_library")
        .select("id, source_title, source_type")
        .eq("id", evidenceId)
        .eq("user_id", userId)
        .eq("is_active", true)
        .maybeSingle(),
    ])

    if (!job) {
      return NextResponse.json({ success: false, error: "job_not_found" }, { status: 404 })
    }
    if (!evidence) {
      return NextResponse.json({ success: false, error: "evidence_not_found" }, { status: 404 })
    }

    const mappingResult = await mapConfirmedEvidenceToRequirement({
      supabase,
      userId,
      jobId,
      sessionId: "evidence-match-ui",
      requirementId,
      evidenceId,
      evidenceTitle: evidence.source_title,
      evidenceType: evidence.source_type,
    })

    await handleDomainEvent({
      supabase,
      event_type: "evidence_mapped",
      job_id: jobId,
      user_id: userId,
      source: "evidence_action",
      payload: {
        requirement_id: requirementId,
        evidence_id: evidenceId,
        prev_status: mappingResult.prevStatus,
        new_status: mappingResult.newStatus,
        source_title: evidence.source_title,
        source_type: evidence.source_type,
        via: "evidence_match_ui",
      },
    })

    return NextResponse.json({
      success: true,
      requirementId,
      evidenceId,
      prevStatus: mappingResult.prevStatus,
      newStatus: mappingResult.newStatus,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to map evidence"
    const status = message === "evidence_map_conflict" ? 409 : 500
    return NextResponse.json({ success: false, error: message }, { status })
  }
}
