import { NextRequest, NextResponse } from 'next/server'
import { Document, Packer, Paragraph, TextRun } from 'docx'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  let body: { text?: unknown; filename?: unknown }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const text = typeof body.text === 'string' ? body.text : ''
  const filename = typeof body.filename === 'string' ? body.filename : 'document'

  if (!text.trim()) {
    return NextResponse.json({ error: 'Empty text' }, { status: 400 })
  }

  const paragraphs = text.split('\n').map(line =>
    new Paragraph({
      children: [new TextRun({ text: line || ' ', font: 'Calibri', size: 22 })],
    })
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
}
