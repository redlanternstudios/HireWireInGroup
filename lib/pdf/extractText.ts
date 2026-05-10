/**
 * lib/pdf/extractText.ts
 *
 * Shared PDF text extraction utility.
 * Uses pdf-parse (already a project dependency) with a Node.js Buffer.
 * Must run server-side — not compatible with the browser runtime.
 *
 * Consumed by:
 *   - app/api/linkedin/pdf-extract/route.ts
 *
 * Note: app/api/resume/upload/route.ts contains an identical private copy.
 * Do not modify that route — this shared version is the canonical export.
 */

export async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  const pdfParse = (await import("pdf-parse")).default
  const data = await pdfParse(buffer)
  return data.text
}
