"use client"
// UploadResumeAndScore.tsx
import React, { useRef, useState } from "react"

export function UploadResumeAndScore() {
  const fileInput = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(false)
    const file = fileInput.current?.files?.[0]
    if (!file) {
      setError("No file selected")
      return
    }
    setUploading(true)
    try {
      // Upload to /api/resume/upload (assume exists)
      const formData = new FormData()
      formData.append("file", file)
      const uploadRes = await fetch("/api/resume/upload", { method: "POST", body: formData })
      if (!uploadRes.ok) throw new Error("Upload failed")
      const { resume_version_id, bullets } = await uploadRes.json()
      // Score bullets
      const scoreRes = await fetch("/api/integrity/score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resume_version_id, bullets })
      })
      if (!scoreRes.ok) throw new Error("Scoring failed")
      setSuccess(true)
    } catch (err: any) {
      setError(err.message || "Unknown error")
    } finally {
      setUploading(false)
    }
  }

  return (
    <form onSubmit={handleUpload} className="space-y-4">
      <input type="file" accept=".pdf,.docx" ref={fileInput} disabled={uploading} />
      <button type="submit" className="btn btn-primary" disabled={uploading}>Upload & Score</button>
      {uploading && <div className="text-xs text-muted-foreground">Uploading and scoring...</div>}
      {error && <div className="text-xs text-destructive">{error}</div>}
      {success && <div className="text-xs text-success">Resume uploaded and scored!</div>}
    </form>
  )
}
