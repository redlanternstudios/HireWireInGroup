import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { buildEvidenceMapForJob } from "@/lib/evidence/buildEvidenceMapForJob"
import { handleDomainEvent } from "@/lib/domain-events"

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
  }

  const { data: job, error: jobError } = await supabase
    .from("jobs")
    .select("id, user_id")
    .eq("id", id)
    .eq("user_id", user.id)
    .is("deleted_at", null)
    .maybeSingle()

  if (jobError || !job) {
    return NextResponse.json({ success: false, error: "Job not found" }, { status: 404 })
  }

  try {
    const evidenceMap = await buildEvidenceMapForJob({
      supabase,
      userId: user.id,
      jobId: id,
    })

    // Clear previous map build failure marker after a successful rebuild.
    if (
      evidenceMap &&
      typeof evidenceMap === "object" &&
      !Array.isArray(evidenceMap) &&
      "map_build_error" in (evidenceMap as Record<string, unknown>)
    ) {
      const cleanedMap = { ...(evidenceMap as Record<string, unknown>) }
      delete cleanedMap.map_build_error
      await supabase
        .from("jobs")
        .update({ evidence_map: cleanedMap })
        .eq("id", id)
        .eq("user_id", user.id)
    }

    await handleDomainEvent({
      supabase,
      event_type: "evidence_mapped",
      job_id: id,
      user_id: user.id,
      source: "system",
      payload: {
        action: "rebuild",
        matching_complete: true,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to rebuild evidence map"
    return NextResponse.json(
      {
        success: false,
        error: "rebuild_failed",
        user_message: message,
      },
      { status: 500 },
    )
  }
}
