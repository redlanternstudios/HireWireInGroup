'use client'

import { useRef, useState } from 'react'

type Tab = 'pdf' | 'text'
type Result = { count: number; label: string }

export function LinkedInImportWidget() {
  const [tab, setTab] = useState<Tab>('pdf')
  const [file, setFile] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [text, setText] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<Result | null>(null)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  function switchTab(next: Tab) {
    setTab(next)
    setResult(null)
    setError(null)
  }

  function handleFileChange(f: File | null) {
    if (!f) return
    if (f.type !== 'application/pdf') {
      setError('Only PDF files are accepted.')
      setFile(null)
      return
    }
    setError(null)
    setFile(f)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setIsDragging(false)
    handleFileChange(e.dataTransfer.files[0] ?? null)
  }

  async function handlePdfSubmit() {
    if (!file || isLoading) return
    setIsLoading(true)
    setError(null)
    setResult(null)
    try {
      const form = new FormData()
      form.append('file', file)
      const res = await fetch('/api/resume/upload', { method: 'POST', body: form })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Upload failed.')
      const count = (json.inserted ?? 0) + (json.education_count ?? 0)
      setResult({ count, label: `${count} item${count !== 1 ? 's' : ''} added to your evidence library` })
      setFile(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setIsLoading(false)
    }
  }

  async function handleTextSubmit() {
    if (text.trim().length < 50 || isLoading) return
    setIsLoading(true)
    setError(null)
    setResult(null)
    try {
      const res = await fetch('/api/linkedin/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rawText: text }),
      })
      const json = await res.json()
      if (!res.ok || !json.success) throw new Error(json.error ?? 'Import failed.')
      const count = json.itemsExtracted ?? 0
      setResult({ count, label: `${count} item${count !== 1 ? 's' : ''} added to your evidence library` })
      setText('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="rounded-xl border border-border bg-card w-full max-w-xl">
      {/* Header */}
      <div className="px-6 py-4 border-b border-border">
        <h2 className="text-sm font-semibold text-foreground">Import from LinkedIn</h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          Sync your LinkedIn profile to populate your evidence library.
        </p>
      </div>

      {/* Tab switcher */}
      <div className="flex border-b border-border px-6">
        {(['pdf', 'text'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => switchTab(t)}
            className={`py-2.5 mr-6 text-sm font-medium border-b-2 transition-colors ${
              tab === t
                ? 'border-black text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {t === 'pdf' ? 'Upload PDF' : 'Paste text'}
          </button>
        ))}
      </div>

      <div className="px-6 py-5 space-y-4">
        {tab === 'pdf' ? (
          <>
            <p className="text-xs text-muted-foreground">
              On LinkedIn: go to your profile &rarr; More (&bull;&bull;&bull;) &rarr; Save to PDF &rarr; upload that file here.
            </p>

            {/* Drop zone */}
            <div
              role="button"
              tabIndex={0}
              aria-label="Upload PDF drop zone"
              onClick={() => fileInputRef.current?.click()}
              onKeyDown={(e) => e.key === 'Enter' && fileInputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              className={`rounded-lg border-2 border-dashed py-8 cursor-pointer transition-colors text-center ${
                isDragging
                  ? 'border-black bg-muted/40'
                  : 'border-border hover:border-muted-foreground'
              }`}
            >
              {file ? (
                <span className="text-sm text-foreground font-medium">{file.name}</span>
              ) : (
                <span className="text-sm text-muted-foreground leading-relaxed">
                  Drop your PDF here<br />or click to browse
                </span>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={(e) => handleFileChange(e.target.files?.[0] ?? null)}
            />

            <button
              onClick={handlePdfSubmit}
              disabled={!file || isLoading}
              className="rounded-md bg-black text-white px-4 py-2 text-sm font-medium hover:bg-gray-800 disabled:opacity-50 transition-colors"
            >
              {isLoading ? 'Extracting…' : 'Extract & Import'}
            </button>
          </>
        ) : (
          <>
            <p className="text-xs text-muted-foreground">
              On LinkedIn: go to your profile &rarr; More (&bull;&bull;&bull;) &rarr; Save to PDF &rarr; open the PDF &rarr; select all &rarr; copy &rarr; paste below.
            </p>

            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Paste your LinkedIn profile text here…"
              rows={8}
              disabled={isLoading}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground disabled:opacity-50"
            />

            <button
              onClick={handleTextSubmit}
              disabled={text.trim().length < 50 || isLoading}
              className="rounded-md bg-black text-white px-4 py-2 text-sm font-medium hover:bg-gray-800 disabled:opacity-50 transition-colors"
            >
              {isLoading ? 'Importing…' : 'Extract & Import'}
            </button>
          </>
        )}

        {/* Feedback line */}
        {isLoading && (
          <p className="text-xs text-muted-foreground">Extracting your profile data — this takes 15–20 seconds…</p>
        )}
        {result && !isLoading && (
          <p className="text-xs text-green-600">&#10003; {result.label}</p>
        )}
        {error && !isLoading && (
          <p className="text-xs text-red-500">{error}</p>
        )}
      </div>
    </div>
  )
}
