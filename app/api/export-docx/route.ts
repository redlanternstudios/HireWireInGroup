import { NextRequest, NextResponse } from 'next/server'
import { Document, HeadingLevel, Packer, Paragraph, TextRun } from 'docx'
import {
  RESUME_FONTS,
  RESUME_FORMATS,
  normalizeResumeFont,
  normalizeResumeFormat,
} from '@/lib/resume-formats'
import { createClient } from '@/lib/supabase/server'
import { handleDomainEvent } from '@/lib/domain-events'
import { validationError, documentGenerationError } from '@/lib/errors/factory'
import { logError as logErr } from '@/lib/errors/logger'
import { toApiErrorResponse } from '@/lib/errors/response'
import { createCorrelationId } from '@/lib/errors/correlation'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const correlationId = createCorrelationId()

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const userId = user.id

  let body: { text?: unknown; filename?: unknown; resumeFormat?: unknown; resumeFont?: unknown; job_id?: unknown }
  try {
    body = await req.json()
  } catch (error) {
    const err = validationError({ code: "INVALID_JSON", correlationId })
    logErr(err, { route: "/api/export-docx" })
    return NextResponse.json(toApiErrorResponse(err), { status: 400 })
  }
  const text = typeof body.text === 'string' ? body.text : ''
  const filename = typeof body.filename === 'string' ? body.filename : 'document'
  const jobId = typeof body.job_id === 'string' ? body.job_id : null
  const resumeFormat = normalizeResumeFormat(body.resumeFormat)
  const resumeFont = normalizeResumeFont(body.resumeFont, resumeFormat)
  const format = RESUME_FORMATS[resumeFormat]
  const font = RESUME_FONTS[resumeFont].docxName
  if (!text.trim()) {
    const err = validationError({ code: "EMPTY_TEXT", correlationId })
    logErr(err, { route: "/api/export-docx" })
    return NextResponse.json(toApiErrorResponse(err), { status: 400 })
  }
  try {
    const lines = text.split('\n')
    const paragraphs = lines.map((line, index) => {
      const trimmed = line.trim()
      const isHeading = isResumeHeading(trimmed, index)
      const isBullet = /^[-*•]\s+/.test(trimmed)
      const textValue = isBullet ? trimmed.replace(/^[-*•]\s+/, '') : trimmed || ' '

      return new Paragraph({
        heading: isHeading ? HeadingLevel.HEADING_2 : undefined,
        bullet: isBullet ? { level: 0 } : undefined,
        spacing: {
          before: isHeading ? format.spacing.sectionGap : 0,
          after: trimmed ? format.spacing.lineGap : 40,
        },
        children: [
          new TextRun({
            text: textValue,
            font,
            size: isHeading ? format.spacing.fontSize + 2 : format.spacing.fontSize,
            bold: isHeading || isLikelyNameLine(trimmed, index),
          }),
        ],
      })
    })
    const doc = new Document({
      styles: {
        default: {
          document: {
            run: {
              font,
              size: format.spacing.fontSize,
            },
          },
        },
      },
      sections: [{
        properties: {
          page: {
            margin: {
              top: 720,
              right: 720,
              bottom: 720,
              left: 720,
            },
          },
        },
        children: paragraphs,
      }],
    })
    const buffer = await Packer.toBuffer(doc)
    const safeName = filename.replace(/[^a-z0-9\-_]/gi, '').slice(0, 64) || 'document'

    void handleDomainEvent({
      supabase,
      event_type: 'resume_docx_exported',
      job_id: jobId,
      user_id: userId,
      source: 'export_route',
      payload: {
        format: 'docx',
        filename: safeName,
        resume_format: resumeFormat,
        resume_font: resumeFont,
        correlation_id: correlationId,
      },
    })

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
}

function isLikelyNameLine(line: string, index: number) {
  return index === 0 && line.length > 0 && line.length < 80 && !line.includes('|') && !line.includes('@')
}

function isResumeHeading(line: string, index: number) {
  if (!line || index === 0) return false
  const normalized = line.toLowerCase()
  return [
    'summary',
    'professional summary',
    'experience',
    'professional experience',
    'work experience',
    'skills',
    'technical skills',
    'education',
    'certifications',
    'projects',
    'selected projects',
    'achievements',
    'awards',
  ].includes(normalized)
}
