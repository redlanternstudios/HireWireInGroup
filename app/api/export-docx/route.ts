import { NextRequest, NextResponse } from 'next/server'
import { Document, Packer, Paragraph, TextRun } from 'docx'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const { validationError, documentGenerationError, unknownError } = await import("@/lib/errors/factory")
  const { logError: logErr } = await import("@/lib/errors/logger")
  const { toApiErrorResponse } = await import("@/lib/errors/response")
  const { createCorrelationId } = await import("@/lib/errors/correlation")
  const correlationId = createCorrelationId()
  let body: { text?: unknown; filename?: unknown }
  try {
    body = await req.json()
  } catch (error) {
    const err = validationError({ code: "INVALID_JSON", correlationId })
    logErr(err, { route: "/api/export-docx" })
    return NextResponse.json(toApiErrorResponse(err), { status: 400 })
  }
  const text = typeof body.text === 'string' ? body.text : ''
  const filename = typeof body.filename === 'string' ? body.filename : 'document'
  if (!text.trim()) {
    const err = validationError({ code: "EMPTY_TEXT", correlationId })
    logErr(err, { route: "/api/export-docx" })
    return NextResponse.json(toApiErrorResponse(err), { status: 400 })
  }
  try {
    const paragraphs = text.split('\n').map(line =>
      new Paragraph({
        children: [new TextRun({ text: line || ' ', font: 'Calibri', size: 22 })],
      })
    )
    const doc = new Document({
      sections: [{ properties: {}, children: paragraphs }],
    })
<<<<<<< HEAD
    const buffer = await Packer.toBuffer(doc)
    const safeName = filename.replace(/[^a-z0-9\-_]/gi, '').slice(0, 64) || 'document'
    return new NextResponse(buffer as unknown as BodyInit, {
      status: 200,
      headers: {
        'Content-Type':
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="${safeName}.docx"`,
        'Cache-Control': 'no-store',
      },
    })
  } catch (error) {
    const err = documentGenerationError({ code: "DOCX_EXPORT_FAILED", message: error instanceof Error ? error.message : 'Export failed', correlationId })
    logErr(err, { route: "/api/export-docx" })
    return NextResponse.json(toApiErrorResponse(err), { status: 500 })
  }
=======
  )

  const doc = new Document({
    sections: [{ properties: {}, children: paragraphs }],
  })

  const buffer = await Packer.toBuffer(doc)
  const safeName = filename.replace(/[^a-z0-9\-_]/gi, '').slice(0, 64) || 'document'

  return new NextResponse(buffer as unknown as BodyInit, {
    status: 200,
    headers: {
      'Content-Type':
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'Content-Disposition': `attachment; filename="${safeName}.docx"`,
      'Cache-Control': 'no-store',
    },
  })
>>>>>>> 7e1a8af916b56410048e0bfccadd90f00d881991
}
