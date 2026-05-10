/**
 * POST /api/linkedin/pdf-extract
 *
 * Accepts a LinkedIn profile PDF export (multipart/form-data),
 * extracts its text content, and returns { text: string }.
 *
 * The client then forwards that text to POST /api/linkedin/capture.
 * Keeping extraction and AI processing as separate round-trips lets
 * the widget show distinct "Reading PDF…" and "Analyzing…" states.
 *
 * Constraints:
 *   - PDF only (application/pdf)
 *   - Max 10 MB
 *   - Authenticated users only
 */

import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { extractTextFromPDF } from "@/lib/pdf/extractText"

export const maxDuration = 30

export async function POST(request: NextRequest) {
  try {
    // ── Auth ──────────────────────────────────────────────────────────────────
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // ── Parse form data ───────────────────────────────────────────────────────
    const contentType = request.headers.get("content-type") ?? ""
    if (!contentType.includes("multipart/form-data")) {
      return NextResponse.json(
        { error: "Request must be multipart/form-data." },
        { status: 400 }
      )
    }

    const formData = await request.formData()
    const file = formData.get("file") as File | null

    if (!file) {
      return NextResponse.json({ error: "No file provided." }, { status: 400 })
    }

    // ── Validate ──────────────────────────────────────────────────────────────
    if (file.type !== "application/pdf") {
      return NextResponse.json(
        { error: "Only PDF files are accepted." },
        { status: 400 }
      )
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 10MB." },
        { status: 400 }
      )
    }

    // ── Extract text ──────────────────────────────────────────────────────────
    const buffer = Buffer.from(await file.arrayBuffer())

    let text: string
    try {
      text = await extractTextFromPDF(buffer)
    } catch (parseError) {
      console.error("[linkedin/pdf-extract] PDF parse error:", parseError)
      return NextResponse.json(
        {
          error:
            "Failed to read PDF. Make sure you uploaded a valid LinkedIn profile export.",
        },
        { status: 400 }
      )
    }

    if (!text || text.trim().length < 100) {
      return NextResponse.json(
        {
          error:
            "The PDF appears to be empty or unreadable. Please export your LinkedIn profile again.",
        },
        { status: 400 }
      )
    }

    return NextResponse.json({ text })
  } catch (error) {
    console.error("[linkedin/pdf-extract] unhandled error:", error)
    return NextResponse.json(
      { error: "Failed to process PDF. Please try again." },
      { status: 500 }
    )
  }
}
