import { NextResponse } from "next/server"

import { createClient } from "@/lib/supabase/server"
import { mergeStringArrays } from "@/lib/evidence/duplicates"
import { handleDomainEvent } from "@/lib/domain-events"

type MergeBody = {
  target_id?: string
  duplicate_ids?: string[]
  merged_fields?: {
    source_title?: string
    source_type?: string
    role_name?: string | null
    company_name?: string | null
    date_range?: string | null
    responsibilities?: string[] | null
    tools_used?: string[] | null
    outcomes?: string[] | null
    proof_snippet?: string | null
    confidence_level?: "high" | "medium" | "low"
  }
}

export async function PATCH(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })

  const body = await request.json() as MergeBody
  const targetId = body.target_id
  const duplicateIds = Array.from(new Set(body.duplicate_ids ?? [])).filter((id) => id && id !== targetId)

  if (!targetId || duplicateIds.length === 0) {
    return NextResponse.json(
      { success: false, error: "target_id and duplicate_ids are required" },
      { status: 400 },
    )
  }

  const allIds = [targetId, ...duplicateIds]
  const { data: rows, error: loadError } = await supabase
    .from("evidence_library")
    .select("*")
    .eq("user_id", user.id)
    .in("id", allIds)

  if (loadError) {
    return NextResponse.json({ success: false, error: loadError.message }, { status: 500 })
  }
  if (!rows || rows.length !== allIds.length) {
    return NextResponse.json({ success: false, error: "One or more evidence records were not found" }, { status: 404 })
  }

  const target = rows.find((row) => row.id === targetId)
  if (!target) return NextResponse.json({ success: false, error: "Target not found" }, { status: 404 })

  const mergedFields = body.merged_fields ?? {}
  const updatePayload = {
    source_title: mergedFields.source_title ?? target.source_title,
    source_type: mergedFields.source_type ?? target.source_type,
    role_name: mergedFields.role_name ?? target.role_name,
    company_name: mergedFields.company_name ?? target.company_name,
    date_range: mergedFields.date_range ?? target.date_range,
    responsibilities: mergedFields.responsibilities ?? mergeStringArrays(...rows.map((row) => row.responsibilities)),
    tools_used: mergedFields.tools_used ?? mergeStringArrays(...rows.map((row) => row.tools_used)),
    outcomes: mergedFields.outcomes ?? mergeStringArrays(...rows.map((row) => row.outcomes)),
    proof_snippet: mergedFields.proof_snippet ?? target.proof_snippet,
    confidence_level: mergedFields.confidence_level ?? target.confidence_level,
    updated_at: new Date().toISOString(),
  }

  const { data: merged, error: updateError } = await supabase
    .from("evidence_library")
    .update(updatePayload)
    .eq("id", targetId)
    .eq("user_id", user.id)
    .select("*")
    .single()

  if (updateError) {
    return NextResponse.json({ success: false, error: updateError.message }, { status: 500 })
  }

  const { error: archiveError } = await supabase
    .from("evidence_library")
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq("user_id", user.id)
    .in("id", duplicateIds)

  if (archiveError) {
    return NextResponse.json({ success: false, error: archiveError.message }, { status: 500 })
  }

  void handleDomainEvent({
    supabase,
    event_type: "evidence_updated",
    job_id: null,
    user_id: user.id,
    source: "evidence_action",
    payload: {
      action: "merge_duplicates",
      target_id: targetId,
      archived_duplicate_ids: duplicateIds,
    },
  })

  return NextResponse.json({ success: true, merged })
}
