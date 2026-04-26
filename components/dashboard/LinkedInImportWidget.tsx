"use client"

import { useState, useRef } from "react"
import { Upload, CheckCircle2, Loader2, ExternalLink, RotateCcw } from "lucide-react"
import type { LinkedInValidation } from "@/lib/linkedin/extractLinkedInProfile"

// ── Types ─────────────────────────────────────────────────────────────────────

type ImportState = "idle" | "uploading" | "extracting" | "success" | "error"

interface CaptureResult {
  count: number
  fieldsUpdated: string[]
  validation: LinkedInValidation
}

// ── Constants ─────────────────────────────────────────────────────────────────

const MAX_BYTES = 10 * 1024 * 1024 // 10 MB

// ── Validation ────────────────────────────────────────────────────────────────

function validateFile(file: File): string | null {
  if (file.type !== "application/pdf") {
    return "Only PDF files are accepted. Export your LinkedIn profile as a PDF first."
  }
  if (file.size > MAX_BYTES) {
    return "File is too large. Maximum size is 10MB."
  }
  return null
}

// ── Component ─────────────────────────────────────────────────────────────────

export function LinkedInImportWidget() {
  const [importState, setImportState] = useState<ImportState>("idle")
  const [result, setResult] = useState<CaptureResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [fileName, setFileName] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function processFile(file: File) {
    const validationError = validateFile(file)
    if (validationError) {
      setError(validationError)
      setImportState("error")
      return
    }

    setFileName(file.name)
    setError(null)
    setResult(null)
    setImportState("uploading")

    try {
      // ── Step 1: Extract text from the PDF server-side ──────────────────────
      const formData = new FormData()
      formData.append("file", file)

      const extractRes = await fetch("/api/linkedin/pdf-extract", {
        method: "POST",
        body: formData,
      })

      const extractData: { text?: string; error?: string } =
        await extractRes.json()

      if (!extractRes.ok || !extractData.text) {
        throw new Error(
          extractData.error ?? "Failed to read PDF. Please try again."
        )
      }

      // ── Step 2: Run LinkedIn-specific AI extraction ────────────────────────
      setImportState("extracting")

      const captureRes = await fetch("/api/linkedin/capture", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rawText: extractData.text }),
      })

      const captureData: {
        success?: boolean
        itemsExtracted?: number
        fieldsUpdated?: string[]
        validation?: LinkedInValidation
        error?: string
      } = await captureRes.json()

      if (!captureRes.ok || !captureData.success) {
        throw new Error(
          captureData.error ?? "Import failed. Please try again."
        )
      }

      setResult({
        count: captureData.itemsExtracted ?? 0,
        fieldsUpdated: captureData.fieldsUpdated ?? [],
        validation: captureData.validation as LinkedInValidation,
      })
      setImportState("success")
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again."
      )
      setImportState("error")
    }
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) processFile(file)
    // Reset so the same file can be re-selected after an error
    e.target.value = ""
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) processFile(file)
  }

  function handleDragOver(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setIsDragging(true)
  }

  function handleDragLeave() {
    setIsDragging(false)
  }

  function handleRetry() {
    setImportState("idle")
    setError(null)
    setResult(null)
    setFileName(null)
  }

  const isLoading =
    importState === "uploading" || importState === "extracting"
  const showUploadZone = importState === "idle" || importState === "error"

  return (
    <div className="rounded-xl border border-border bg-card">
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="px-6 py-4 border-b border-border">
        <h2 className="text-base font-medium">Import from LinkedIn</h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          Add your work history in seconds
        </p>
      </div>

      {/* ── Body ────────────────────────────────────────────────────────────── */}
      <div className="px-6 py-5 space-y-5">
        {/* Steps */}
        <ol className="space-y-5">
          {/* Step 1 */}
          <li className="flex items-start gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-semibold mt-0.5">
              1
            </span>
            <div className="space-y-1.5 pt-0.5">
              <p className="text-sm font-medium leading-none">
                Go to your LinkedIn profile
              </p>
              <a
                href="https://www.linkedin.com/in/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
              >
                Open LinkedIn
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </li>

          {/* Step 2 */}
          <li className="flex items-start gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-semibold mt-0.5">
              2
            </span>
            <div className="pt-0.5">
              <p className="text-sm font-medium leading-none">
                Click More → Save to PDF
              </p>
              <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                On your profile, click the{" "}
                <span className="font-medium text-foreground">More</span> button
                below your name, then select{" "}
                <span className="font-medium text-foreground">Save to PDF</span>
                .
              </p>
            </div>
          </li>

          {/* Step 3 */}
          <li className="flex items-start gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-semibold mt-0.5">
              3
            </span>
            <div className="w-full pt-0.5 space-y-3">
              <p className="text-sm font-medium leading-none">
                Upload your LinkedIn PDF
              </p>

              {/* Upload zone — idle or error */}
              {showUploadZone && (
                <>
                  <div
                    role="button"
                    tabIndex={0}
                    aria-label="Upload LinkedIn PDF"
                    onClick={() => fileInputRef.current?.click()}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ")
                        fileInputRef.current?.click()
                    }}
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    className={`flex flex-col items-center justify-center gap-2.5 rounded-lg border-2 border-dashed p-6 cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                      isDragging
                        ? "border-primary bg-primary/5"
                        : "border-muted-foreground/25 bg-muted/30 hover:border-muted-foreground/40 hover:bg-muted/50"
                    }`}
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                      <Upload className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium text-foreground">
                        {fileName && importState === "error"
                          ? fileName
                          : "Drop PDF here or click to upload"}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        PDF · Max 10MB
                      </p>
                    </div>
                  </div>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="application/pdf"
                    className="hidden"
                    onChange={handleInputChange}
                  />

                  {error && (
                    <p className="text-xs text-destructive">{error}</p>
                  )}
                </>
              )}

              {/* Loading state */}
              {isLoading && (
                <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/30 px-4 py-3">
                  <Loader2 className="h-4 w-4 shrink-0 animate-spin text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">
                      {importState === "uploading"
                        ? "Reading PDF…"
                        : "Analyzing your LinkedIn profile…"}
                    </p>
                    {importState === "extracting" && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        This takes 15–20 seconds
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Success state */}
              {importState === "success" && result && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-green-600">
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                    <span>
                      {result.count} item{result.count !== 1 ? "s" : ""} added
                      to your evidence library
                    </span>
                  </div>
                  {result.fieldsUpdated.length > 0 && (
                    <p className="text-xs text-muted-foreground">
                      Profile updated: {result.fieldsUpdated.join(", ")}
                    </p>
                  )}
                  {result.validation.requires_user_review && (
                    <p className="text-xs text-amber-600">
                      Review recommended — some entries need your confirmation
                      before they can be used in documents.
                    </p>
                  )}
                  <button
                    type="button"
                    onClick={handleRetry}
                    className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <RotateCcw className="h-3 w-3" />
                    Import another
                  </button>
                </div>
              )}
            </div>
          </li>
        </ol>

        {/* Primary CTA — only visible when user can act */}
        {showUploadZone && (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading}
            className="w-full rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            Import LinkedIn Profile
          </button>
        )}
      </div>
    </div>
  )
}
