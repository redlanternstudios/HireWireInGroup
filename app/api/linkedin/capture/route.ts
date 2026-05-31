/**
 * POST /api/linkedin/capture
 *
 * LinkedIn profile ingestion for HireWire.
 * Extends the existing evidence pipeline — same tables, same upsert pattern,
 * same AI provider as app/api/resume/upload/route.ts.
 *
 *   1. Auth check
 *   2. Validate rawText (min 200 chars)
 *   3. Fetch user_profile — injected into AI prompt + reused for prefill
 *   4. Clean text (strip LinkedIn UI noise)
 *   5. AI extraction (LinkedIn-specific, with user context)
 *   6. Map to evidence rows
 *   7. Dual deduplication:
 *      a. 5-field dedup against ALL existing evidence (prevents exact duplicates)
 *      b. 3-field dedup against resume-sourced rows (tracks what came from resume)
 *   8. Upsert new rows
 *   9. Post-process "we/our" team voice check (belt-and-suspenders after AI)
 *  10. Update user_profile if fields are empty
 *  11. Return enriched response with newItemsAdded + duplicatesSkipped
 */

import { type NextRequest, NextResponse } from "next/server"
import { cleanProfileText } from "@/lib/linkedin/cleanProfileText"
import {
  extractLinkedInProfile,
  type UserProfileContext,
} from "@/lib/linkedin/extractLinkedInProfile"
import { mapLinkedInToEvidence } from "@/lib/linkedin/mapLinkedInToEvidence"
import { dedupeKey } from "@/lib/mapResumeToEvidence"
import { detectEvidenceDuplicates } from "@/lib/evidence/duplicates"
import { requireUser } from "@/lib/supabase/require-user"

export const maxDuration = 60

// 3-field key used to match against resume-sourced rows
function resumeDedupeKey(row: {
  source_type: string
  company_name: string | null
  date_range: string | null
}): string {
  return [
    row.source_type,
    (row.company_name ?? "").toLowerCase().trim(),
    (row.date_range ?? "").toLowerCase().trim(),
  ].join("|")
}

const TEAM_VOICE_PATTERNS = /\b(we |our team|our processes|our clients|we built|we developed|we launched|we drove|we created)\b/i
const TEAM_VOICE_FLAG =
  "About section uses team voice ('we/our') — rewrite in first person to reflect your individual contributions."

export async function POST(request: NextRequest) {
  try {
    // ── 1. Auth check ────────────────────────────────────────────────────────
    const auth = await requireUser()
    if (!auth.ok) return auth.response
    const { supabase, userId } = auth

    // ── 2. Validate input ────────────────────────────────────────────────────
    let body: unknown
    try {
      body = await request.json()
    } catch {
      return NextResponse.json(
        { success: false, error: "Request body must be valid JSON." },
        { status: 400 }
      )
    }

    if (
      typeof body !== "object" ||
      body === null ||
      typeof (body as Record<string, unknown>).rawText !== "string"
    ) {
      return NextResponse.json(
        { success: false, error: "rawText field is required." },
        { status: 400 }
      )
    }

    const rawText = (
      (body as Record<string, unknown>).rawText as string
    ).trim()

    if (rawText.length < 200) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Text is too short. Paste your full LinkedIn profile including Experience and Education sections.",
        },
        { status: 400 }
      )
    }

    // ── 3. Fetch user profile — used for context injection + prefill ──────────
    // Degrade gracefully if this fails — proceed without context rather than error.
    const { data: profile } = await supabase
      .from("user_profile")
      .select("full_name, headline, location, summary")
      .eq("user_id", userId)
      .maybeSingle()

    const userContext: UserProfileContext | undefined = profile
      ? {
          full_name: profile.full_name,
          headline: profile.headline,
          location: profile.location,
          summary: profile.summary,
        }
      : undefined

    // ── 4. Clean text ────────────────────────────────────────────────────────
    const { cleanedText, removedNoise } = cleanProfileText(rawText)

    // ── 5. AI extraction (with user context) ─────────────────────────────────
    let captureResult
    try {
      captureResult = await extractLinkedInProfile(cleanedText, userContext)
    } catch (aiError) {
      console.error("[linkedin/capture] AI extraction failed:", aiError)
      return NextResponse.json(
        {
          success: false,
          error:
            "AI extraction failed. The pasted text may not contain a recognisable LinkedIn profile. Please try again.",
        },
        { status: 500 }
      )
    }

    const allNoiseRemoved = [
      ...new Set([...removedNoise, ...captureResult.noise_removed]),
    ]

    // ── 6. Map to evidence rows ───────────────────────────────────────────────
    const candidateRows = mapLinkedInToEvidence(captureResult)
    const totalFound = candidateRows.length

    // ── 7. Dual deduplication ─────────────────────────────────────────────────
    // Single query — build both maps from the result.
    const { data: existing } = await supabase
      .from("evidence_library")
      .select(
        "id, source_type, source_title, role_name, company_name, date_range, responsibilities, tools_used, outcomes, proof_snippet, source_resume_id"
      )
      .eq("user_id", userId)

    // 5-field map: all existing rows (exact duplicate prevention)
    const existingMap = new Map<string, string>()
    // 3-field set: resume-sourced rows only (tracks what already came from resume)
    const resumeSourcedSet = new Set<string>()

    for (const row of existing ?? []) {
      const fiveKey = [
        row.source_type ?? "",
        (row.source_title ?? "").toLowerCase().trim(),
        (row.role_name ?? "").toLowerCase().trim(),
        (row.company_name ?? "").toLowerCase().trim(),
        (row.date_range ?? "").toLowerCase().trim(),
      ].join("|")
      existingMap.set(fiveKey, row.id)

      if (row.source_resume_id) {
        resumeSourcedSet.add(
          resumeDedupeKey({
            source_type: row.source_type ?? "",
            company_name: row.company_name,
            date_range: row.date_range,
          })
        )
      }
    }

    // Filter: skip rows that match either dedup check
    let rowsToInsert = candidateRows.filter((row) => {
      if (existingMap.has(dedupeKey(row))) return false
      if (
        resumeSourcedSet.has(
          resumeDedupeKey({
            source_type: row.source_type,
            company_name: row.company_name,
            date_range: row.date_range,
          })
        )
      )
        return false
      return true
    })

    const duplicateCandidates = detectEvidenceDuplicates(rowsToInsert, existing ?? [])
    const duplicateIndexes = new Set(
      duplicateCandidates.map((candidate) => candidate.group_id.replace("evidence-duplicate-", ""))
    )
    rowsToInsert = rowsToInsert.filter((_row, index) => !duplicateIndexes.has(String(index)))

    const duplicatesSkipped = totalFound - rowsToInsert.length

    // ── 8. Upsert new rows ────────────────────────────────────────────────────
    let newItemsAdded = 0

    if (rowsToInsert.length > 0) {
      const { data: insertedData, error: insertError } = await supabase
        .from("evidence_library")
        .upsert(
          rowsToInsert.map((row) => ({
            ...row,
            user_id: userId,
          })),
          {
            onConflict: "user_id,source_title,source_type",
            ignoreDuplicates: true,
          }
        )
        .select("id")

      if (insertError) {
        console.error("[linkedin/capture] evidence upsert error:", insertError)
        return NextResponse.json(
          { success: false, error: "Failed to save evidence items." },
          { status: 500 }
        )
      }

      newItemsAdded = insertedData?.length ?? 0
    }

    // ── 9. Post-process team voice check (belt-and-suspenders) ───────────────
    // The AI prompt already instructs flagging of "we/our" language.
    // This server-side check ensures the flag is always present if the pattern
    // exists, regardless of model compliance.
    const aboutText = captureResult.about.raw_text ?? ""
    let requiresReview = captureResult.validation.requires_user_review

    if (TEAM_VOICE_PATTERNS.test(aboutText)) {
      const alreadyFlagged = captureResult.about.rewrite_opportunities.some(
        (r) => r.includes("team voice")
      )
      if (!alreadyFlagged) {
        captureResult.about.rewrite_opportunities.push(TEAM_VOICE_FLAG)
      }
      requiresReview = true
    }

    const rewriteOpportunities = captureResult.about.rewrite_opportunities

    // ── 10. Update user_profile if fields are empty ───────────────────────────
    // Reuses the profile fetched in step 3 — no second DB round-trip.
    const fieldsUpdated: string[] = []
    const identity = captureResult.identity

    if (profile) {
      const updates: Record<string, unknown> = {}

      if (!profile.full_name && identity.full_name) {
        updates.full_name = identity.full_name
        fieldsUpdated.push("full_name")
      }
      if (!profile.location && identity.location) {
        updates.location = identity.location
        fieldsUpdated.push("location")
      }
      if (!profile.summary && captureResult.about.raw_text) {
        updates.summary = captureResult.about.raw_text
        fieldsUpdated.push("summary")
      }

      if (Object.keys(updates).length > 0) {
        updates.updated_at = new Date().toISOString()
        await supabase
          .from("user_profile")
          .update(updates)
          .eq("user_id", userId)
      }
    }

    // ── 11. Return enriched response ──────────────────────────────────────────
    return NextResponse.json({
      success: true,
      itemsExtracted: totalFound,
      newItemsAdded,
      duplicatesSkipped,
      duplicates_found: duplicateCandidates.length,
      duplicate_candidates: duplicateCandidates,
      fieldsUpdated,
      requiresReview,
      rewriteOpportunities,
      validation: {
        ...captureResult.validation,
        requires_user_review: requiresReview,
      },
      data: {
        ...captureResult,
        noise_removed: allNoiseRemoved,
      },
    })
  } catch (error) {
    console.error("[linkedin/capture] unhandled error:", error)
    return NextResponse.json(
      { success: false, error: "Capture failed. Please try again." },
      { status: 500 }
    )
  }
}
