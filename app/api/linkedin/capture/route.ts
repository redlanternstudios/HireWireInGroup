/**
 * POST /api/linkedin/capture
 *
 * LinkedIn profile ingestion for HireWire.
 * Extends the existing evidence pipeline — same tables, same upsert pattern,
 * same AI provider as app/api/resume/upload/route.ts.
 *
 *   1. Auth check
 *   2. Validate rawText (min 200 chars)
 *   3. Clean text (strip LinkedIn UI noise)
 *   4. AI extraction (LinkedIn-specific schema with status labels)
 *   5. Write to evidence_library (experience, education, certifications, skills)
 *   6. Update user_profile if fields are empty (never overwrites existing values)
 *   7. Return full result with validation object and fieldsUpdated list
 */

import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { cleanProfileText } from "@/lib/linkedin/cleanProfileText"
import { extractLinkedInProfile } from "@/lib/linkedin/extractLinkedInProfile"
import { mapLinkedInToEvidence } from "@/lib/linkedin/mapLinkedInToEvidence"
import { dedupeKey } from "@/lib/mapResumeToEvidence"

export const maxDuration = 60

export async function POST(request: NextRequest) {
  try {
    // ── 1. Auth check ────────────────────────────────────────────────────────
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      )
    }

    const userId = user.id

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

    // ── 3. Clean text ────────────────────────────────────────────────────────
    const { cleanedText, removedNoise } = cleanProfileText(rawText)

    // ── 4. AI extraction ─────────────────────────────────────────────────────
    let captureResult
    try {
      captureResult = await extractLinkedInProfile(cleanedText)
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

    // Merge noise labels from text cleaning with anything the AI also flagged
    const allNoiseRemoved = [
      ...new Set([...removedNoise, ...captureResult.noise_removed]),
    ]

    // ── 5. Write to evidence_library ─────────────────────────────────────────
    const candidateRows = mapLinkedInToEvidence(captureResult)

    // Deduplicate against existing evidence — same pattern as resume/upload
    const { data: existing } = await supabase
      .from("evidence_library")
      .select(
        "id, source_type, source_title, role_name, company_name, date_range"
      )
      .eq("user_id", userId)

    const existingMap = new Map<string, string>()
    for (const row of existing ?? []) {
      const key = [
        row.source_type ?? "",
        (row.source_title ?? "").toLowerCase().trim(),
        (row.role_name ?? "").toLowerCase().trim(),
        (row.company_name ?? "").toLowerCase().trim(),
        (row.date_range ?? "").toLowerCase().trim(),
      ].join("|")
      existingMap.set(key, row.id)
    }

    const rowsToInsert = candidateRows.filter(
      (row) => !existingMap.has(dedupeKey(row))
    )

    let itemsExtracted = 0

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

      itemsExtracted = insertedData?.length ?? 0
    }

    // ── 6. Update user_profile if fields are empty ───────────────────────────
    // Never overwrite existing values — only fill in what is missing.
    const fieldsUpdated: string[] = []
    const identity = captureResult.identity

    const { data: profile } = await supabase
      .from("user_profile")
      .select("full_name, location, summary")
      .eq("user_id", userId)
      .maybeSingle()

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

    // ── 7. Return result ─────────────────────────────────────────────────────
    return NextResponse.json({
      success: true,
      itemsExtracted,
      fieldsUpdated,
      validation: captureResult.validation,
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
