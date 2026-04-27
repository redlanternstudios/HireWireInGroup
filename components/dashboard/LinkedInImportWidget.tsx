"use client"

import { useState, useRef } from "react"
import {
  ExternalLink,
  Download,
  Upload,
  UploadCloud,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
  RotateCcw,
} from "lucide-react"

// ── Types ─────────────────────────────────────────────────────────────────────

export interface UserProfileContext {
  full_name?: string | null
  headline?: string | null
  location?: string | null
  summary?: string | null
}

interface LinkedInImportWidgetProps {
  onImport?: () => void
  userProfile: UserProfileContext
}

type Tab = "pdf" | "paste"
type ImportState = "idle" | "loading" | "success" | "error"

interface CaptureResult {
  newItemsAdded: number
  duplicatesSkipped: number
  requiresReview: boolean
  rewriteOpportunities: string[]
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const MAX_SIZE = 5 * 1024 * 1024 // 5 MB

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function validateFile(file: File): string | null {
  if (file.type !== "application/pdf") return "Please upload a PDF file under 5MB."
  if (file.size > MAX_SIZE) return "Please upload a PDF file under 5MB."
  return null
}

async function extractPdfText(file: File): Promise<string> {
  const pdfjsLib = await import("pdfjs-dist")
  // Pin worker to the same version as the package install
  pdfjsLib.GlobalWorkerOptions.workerSrc =
    "//cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js"

  const buffer = await file.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({ data: buffer }).promise
  const pages: string[] = []

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const content = await page.getTextContent()
    const pageText = content.items
      .map((item: Record<string, unknown>) =>
        typeof item.str === "string" ? item.str : ""
      )
      .join(" ")
    pages.push(pageText)
  }

  return pages.join("\n")
}

// ── Component ─────────────────────────────────────────────────────────────────

export function LinkedInImportWidget({
  onImport,
  userProfile,
}: LinkedInImportWidgetProps) {
  const [tab, setTab] = useState<Tab>("pdf")
  const [importState, setImportState] = useState<ImportState>("idle")
  const [file, setFile] = useState<File | null>(null)
  const [fileError, setFileError] = useState<string | null>(null)
  const [pasteText, setPasteText] = useState("")
  const [isDragging, setIsDragging] = useState(false)
  const [result, setResult] = useState<CaptureResult | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // ── File handling ────────────────────────────────────────────────────────────

  function handleFileSelect(f: File) {
    const err = validateFile(f)
    if (err) {
      setFileError(err)
      setFile(null)
    } else {
      setFileError(null)
      setFile(f)
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setIsDragging(false)
    const f = e.dataTransfer.files[0]
    if (f) handleFileSelect(f)
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault()
    setIsDragging(true)
  }

  function handleDragLeave() {
    setIsDragging(false)
  }

  // ── Import ───────────────────────────────────────────────────────────────────

  async function handleImport() {
    setImportState("loading")
    setErrorMessage(null)

    try {
      let rawText = ""

      if (tab === "pdf") {
        if (!file) return
        rawText = await extractPdfText(file)
      } else {
        rawText = pasteText.trim()
      }

      const res = await fetch("/api/linkedin/capture", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rawText }),
      })

      const data: {
        success?: boolean
        newItemsAdded?: number
        duplicatesSkipped?: number
        requiresReview?: boolean
        rewriteOpportunities?: string[]
        error?: string
      } = await res.json()

      if (!res.ok || !data.success) {
        throw new Error(data.error ?? "Import failed. Please try again.")
      }

      setResult({
        newItemsAdded: data.newItemsAdded ?? 0,
        duplicatesSkipped: data.duplicatesSkipped ?? 0,
        requiresReview: data.requiresReview ?? false,
        rewriteOpportunities: data.rewriteOpportunities ?? [],
      })
      setImportState("success")
      onImport?.()
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : "Something went wrong. Please try again."
      )
      setImportState("error")
    }
  }

  function handleReset() {
    setImportState("idle")
    setFile(null)
    setFileError(null)
    setPasteText("")
    setResult(null)
    setErrorMessage(null)
    setTab("pdf")
  }

  const isLoading = importState === "loading"
  const showResult = importState === "success" || importState === "error"
  const canImportPdf = tab === "pdf" && !!file && !isLoading
  const canImportPaste = tab === "paste" && pasteText.trim().length > 0 && !isLoading

  return (
    <div className="space-y-4">
      {/* ── Steps panel ──────────────────────────────────────────────────────── */}
      <div className="bg-zinc-900 rounded-lg p-4">
        <div className="flex items-start gap-2">
          {/* Step 1 */}
          <div className="flex-1 flex flex-col items-center text-center gap-2">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-sky-500 text-white text-xs font-semibold">
              1
            </div>
            <ExternalLink className="h-4 w-4 text-zinc-400" strokeWidth={1.75} />
            <p className="text-xs font-semibold text-zinc-200 uppercase tracking-wide">
              Go to LinkedIn
            </p>
            <p className="text-[11px] text-zinc-500 leading-tight">
              Open your LinkedIn profile in a browser
            </p>
          </div>

          <ChevronRight className="h-4 w-4 text-zinc-600 mt-5 shrink-0" strokeWidth={1.75} />

          {/* Step 2 */}
          <div className="flex-1 flex flex-col items-center text-center gap-2">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-sky-500 text-white text-xs font-semibold">
              2
            </div>
            <Download className="h-4 w-4 text-zinc-400" strokeWidth={1.75} />
            <p className="text-xs font-semibold text-zinc-200 uppercase tracking-wide">
              Save to PDF
            </p>
            <p className="text-[11px] text-zinc-500 leading-tight">
              Click More → Save to PDF on your profile page
            </p>
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-md px-3 py-2 text-amber-400 text-[10px] leading-snug text-left w-full">
              On mobile: tap the share icon → Save as PDF. On desktop: click the
              More... button under your name.
            </div>
          </div>

          <ChevronRight className="h-4 w-4 text-zinc-600 mt-5 shrink-0" strokeWidth={1.75} />

          {/* Step 3 */}
          <div className="flex-1 flex flex-col items-center text-center gap-2">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-sky-500 text-white text-xs font-semibold">
              3
            </div>
            <Upload className="h-4 w-4 text-zinc-400" strokeWidth={1.75} />
            <p className="text-xs font-semibold text-zinc-200 uppercase tracking-wide">
              Drop it here
            </p>
            <p className="text-[11px] text-zinc-500 leading-tight">
              Drag the file below or click to browse
            </p>
          </div>
        </div>
      </div>

      {/* ── Import zone ──────────────────────────────────────────────────────── */}
      {!showResult ? (
        <div className="bg-zinc-900 rounded-lg overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-zinc-800">
            <button
              type="button"
              onClick={() => setTab("pdf")}
              className={`px-4 py-3 text-sm font-medium transition-colors ${
                tab === "pdf"
                  ? "text-zinc-100 border-b-2 border-sky-500 -mb-px"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              Upload PDF
            </button>
            <button
              type="button"
              onClick={() => setTab("paste")}
              className={`px-4 py-3 text-sm font-medium transition-colors ${
                tab === "paste"
                  ? "text-zinc-100 border-b-2 border-sky-500 -mb-px"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              Paste Text
            </button>
          </div>

          <div className="p-4 space-y-3">
            {tab === "pdf" ? (
              <>
                {!file ? (
                  /* Drop zone */
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
                    className={`flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed p-10 text-center cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 ${
                      isDragging
                        ? "border-sky-500 bg-sky-500/10"
                        : "border-zinc-700 hover:border-sky-500/50 hover:bg-sky-500/5"
                    }`}
                  >
                    <UploadCloud
                      className={`h-8 w-8 transition-colors ${
                        isDragging ? "text-sky-400" : "text-zinc-500"
                      }`}
                      strokeWidth={1.75}
                    />
                    <div>
                      <p className="text-sm font-medium text-zinc-200">
                        Drop your LinkedIn PDF here
                      </p>
                      <p className="text-xs text-zinc-500 mt-1">
                        or click to browse — PDF only, max 5MB
                      </p>
                    </div>
                  </div>
                ) : (
                  /* File chip */
                  <div className="flex items-center justify-between bg-zinc-800 rounded-md px-3 py-2">
                    <div className="flex items-center gap-2 text-sm text-zinc-200 min-w-0">
                      <Upload
                        className="h-4 w-4 shrink-0 text-zinc-400"
                        strokeWidth={1.75}
                      />
                      <span className="truncate">{file.name}</span>
                      <span className="text-zinc-500 shrink-0">
                        {formatBytes(file.size)}
                      </span>
                    </div>
                    <button
                      type="button"
                      aria-label="Remove file"
                      onClick={() => {
                        setFile(null)
                        setFileError(null)
                      }}
                      className="ml-2 shrink-0 text-zinc-500 hover:text-zinc-200 transition-colors"
                    >
                      <X className="h-4 w-4" strokeWidth={1.75} />
                    </button>
                  </div>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,application/pdf"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0]
                    if (f) handleFileSelect(f)
                    e.target.value = ""
                  }}
                />

                {fileError && (
                  <p className="text-xs text-red-400">{fileError}</p>
                )}

                {canImportPdf && (
                  <button
                    type="button"
                    onClick={handleImport}
                    disabled={isLoading}
                    className="w-full rounded-md px-4 py-2.5 text-sm font-semibold text-white transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
                    style={{ backgroundColor: "#d90009" }}
                  >
                    Extract & Import
                  </button>
                )}
              </>
            ) : (
              /* Paste tab */
              <>
                <textarea
                  value={pasteText}
                  onChange={(e) => setPasteText(e.target.value)}
                  disabled={isLoading}
                  placeholder="Paste your full LinkedIn profile text here — include Experience, Education, and Skills sections…"
                  className="w-full h-40 rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-600 resize-none focus:outline-none focus:ring-2 focus:ring-sky-500 disabled:opacity-50"
                />

                {canImportPaste && (
                  <button
                    type="button"
                    onClick={handleImport}
                    disabled={isLoading}
                    className="w-full rounded-md px-4 py-2.5 text-sm font-semibold text-white transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
                    style={{ backgroundColor: "#d90009" }}
                  >
                    Extract & Import
                  </button>
                )}
              </>
            )}

            {/* Loading overlay (replaces button during extraction) */}
            {isLoading && (
              <button
                type="button"
                disabled
                className="w-full rounded-md px-4 py-2.5 text-sm font-semibold text-white opacity-70 flex items-center justify-center gap-2"
                style={{ backgroundColor: "#d90009" }}
              >
                <Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.75} />
                Extracting & importing…
              </button>
            )}
          </div>
        </div>
      ) : importState === "success" && result ? (
        /* ── Success card ──────────────────────────────────────────────────── */
        <div className="border border-emerald-500/40 bg-emerald-500/5 rounded-lg p-5 space-y-3">
          <div className="flex items-center gap-2">
            <CheckCircle2
              className="h-5 w-5 shrink-0 text-emerald-400"
              strokeWidth={1.75}
            />
            <p className="text-sm font-semibold text-zinc-100">
              LinkedIn imported
            </p>
          </div>
          <div>
            <p className="text-sm text-zinc-200">
              {userProfile.full_name
                ? `Added to ${userProfile.full_name}'s evidence library`
                : "Added to your evidence library"}
            </p>
            <p className="text-xs text-zinc-500 mt-0.5">
              {result.newItemsAdded} new item
              {result.newItemsAdded !== 1 ? "s" : ""} added
              {result.duplicatesSkipped > 0
                ? ` · ${result.duplicatesSkipped} already existed`
                : ""}
            </p>
          </div>
          {result.requiresReview && (
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-md px-3 py-2 text-amber-400 text-xs leading-snug">
              {userProfile.headline
                ? `Based on your profile as ${userProfile.headline}, your profile has improvement opportunities — review suggested`
                : "Your profile has improvement opportunities — review suggested"}
            </div>
          )}
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center gap-1.5 text-sm text-zinc-400 hover:text-zinc-100 underline transition-colors"
          >
            <RotateCcw className="h-3 w-3" strokeWidth={1.75} />
            Import again
          </button>
        </div>
      ) : (
        /* ── Error card ────────────────────────────────────────────────────── */
        <div className="border border-red-500/40 bg-red-500/5 rounded-lg p-5 space-y-3">
          <div className="flex items-center gap-2">
            <AlertCircle
              className="h-5 w-5 shrink-0 text-red-400"
              strokeWidth={1.75}
            />
            <p className="text-sm font-semibold text-zinc-100">Import failed</p>
          </div>
          <p className="text-xs text-zinc-400">{errorMessage}</p>
          <button
            type="button"
            onClick={handleReset}
            className="text-sm text-zinc-400 hover:text-zinc-100 underline transition-colors"
          >
            Try again
          </button>
        </div>
      )}
    </div>
  )
}
