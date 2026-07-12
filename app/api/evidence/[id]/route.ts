import { NextResponse } from "next/server"
import type { SupabaseClient } from "@supabase/supabase-js"

import { handleDomainEvent } from "@/lib/domain-events"
import { requireUser } from "@/lib/supabase/require-user"
import { revalidatePath } from "next/cache"

async function unlinkEvidenceFromJobs(supabase: SupabaseClient, userId: string, evidenceId: string) {
  const { data: jobs } = await supabase
    .from("jobs")
    .select("id, evidence_map")
    .eq("user_id", userId)

  for (const job of jobs || []) {
    const map = job.evidence_map && typeof job.evidence_map === "object" && !Array.isArray(job.evidence_map)
      ? job.evidence_map as { requirement_matches?: Array<Record<string, unknown>> }
      : null
    if (!map) continue

    let changed = false
    if (map.requirement_matches && Array.isArray(map.requirement_matches)) {
      for (const req of map.requirement_matches as Array<{
        matched_evidence_ids?: string[]
        status?: string
      }>) {
        const matchedEvidenceIds = Array.isArray(req.matched_evidence_ids) ? req.matched_evidence_ids : []
        if (matchedEvidenceIds.includes(evidenceId)) {
          req.matched_evidence_ids = matchedEvidenceIds.filter((id: string) => id !== evidenceId)
          if (req.matched_evidence_ids.length === 0 && req.status !== "gap") {
            req.status = "gap"
          }
          changed = true
        }
      }
    }

    if (changed) {
      await supabase.from("jobs").update({ evidence_map: map }).eq("id", job.id)
    }
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireUser()
  if (!auth.ok) return auth.response
  const { supabase, userId } = auth

  const { id } = await params
  const url = new URL(_request.url)
  const permanent = url.searchParams.get("permanent") === "true"

  const { error } = await supabase
    .from("evidence_library")
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", userId)

  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 })

  await unlinkEvidenceFromJobs(supabase, userId, id)

  if (permanent) {
    const { error: deleteError } = await supabase
      .from("evidence_library")
      .delete()
      .eq("id", id)
      .eq("user_id", userId)

    if (deleteError) return NextResponse.json({ success: false, error: deleteError.message }, { status: 500 })
  }

  void handleDomainEvent({
    supabase,
    event_type: "evidence_deleted",
    job_id: null,
    user_id: userId,
    source: "evidence_action",
    payload: { evidence_id: id, action: permanent ? "permanently_deleted" : "archived" },
  })

  revalidatePath("/evidence")
  revalidatePath("/dashboard")
  revalidatePath("/jobs")

  return NextResponse.json({ success: true })
}
