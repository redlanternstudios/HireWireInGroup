// Canonical TypeScript types for the HireWire jobs pipeline
// Version: 2026-05-09

import { z } from "zod"

// ---
// 1. Canonical Job Object
// ---

export type JobStatus =
  | "NEW"
  | "PARSED"
  | "ANALYZED"
  | "EVIDENCE_MAPPED"
  | "MATERIALS_READY"
  | "QUALITY_REVIEW"
  | "READY"
  | "APPLIED"
  | "ARCHIVED"

export interface Job {
  jobId: string // UUID
  title: string
  company: string
  location?: string
  sourceType: string // e.g., LinkedIn, Lever, Manual
  sourceUrl: string
  createdAt: string // ISO date
  status: JobStatus
  lastActivityAt: string // ISO date
}

// ---
// 2. Job Enrichment (AI/analysis/fit/readiness)
// ---

export interface JobEnrichment {
  jobId: string
  fitScore?: number // 0-100
  fitBand?: "HIGH" | "MEDIUM" | "LOW"
  confidenceScore?: number // 0-1
  gapCount?: number
  readinessStage: JobStatus
  nextAction: string
  matchedEvidenceIds?: string[]
  requirements?: string[]
  responsibilities?: string[]
  keywords?: string[]
  blockers?: string[]
}

// ---
// 3. User Context
// ---

export interface UserContext {
  userId: string
  profile: {
    skills: string[]
    experience: string[]
    education: string[]
    certifications: string[]
  }
  evidenceLibrary: EvidenceItem[]
  docInventory: MaterialVersion[]
}

export interface EvidenceItem {
  id: string
  sourceType: string
  sourceTitle: string
  companyName?: string
  confidenceScore: number
  isUserApproved: boolean
  outcomes?: string[]
  // ...other fields as needed
}

export interface MaterialVersion {
  id: string
  jobId: string
  type: "resume" | "cover_letter"
  createdAt: string
  usedForApplication: boolean
}

// ---
// 4. System Signals
// ---

export interface SystemSignals {
  qualityChecks: QualityCheckResult[]
  reminders: Reminder[]
  analytics: AnalyticsCounters
}

export interface QualityCheckResult {
  jobId: string
  unsupportedClaims: string[]
  aiFiller: string[]
  missingEvidence: string[]
  passed: boolean
}

export interface Reminder {
  jobId: string
  remindAt: string // ISO date
  channel: "email" | "push" | "sms"
  message: string
}

export interface AnalyticsCounters {
  [key: string]: number
}

// ---
// 5. API/Mutation Contracts
// ---

export interface UpdateJobStatusInput {
  jobId: string
  status: JobStatus
  reason?: string
}

export interface GenerateMaterialsInput {
  jobId: string
  options?: Record<string, unknown>
}

export interface RecordApplicationInput {
  jobId: string
  method: string
  timestamp: string
  docVersionIds: string[]
}

export interface CreateReminderInput {
  jobId: string
  remindAt: string
  channel: "email" | "push" | "sms"
}

export interface LogEventInput {
  type: string
  payload: Record<string, unknown>
}

// ---
// 6. Zod Schemas (optional, for runtime validation)
// ---

export const JobStatusSchema = z.enum([
  "NEW",
  "PARSED",
  "ANALYZED",
  "EVIDENCE_MAPPED",
  "MATERIALS_READY",
  "QUALITY_REVIEW",
  "READY",
  "APPLIED",
  "ARCHIVED",
])

export const JobSchema = z.object({
  jobId: z.string().uuid(),
  title: z.string(),
  company: z.string(),
  location: z.string().optional(),
  sourceType: z.string(),
  sourceUrl: z.string(),
  createdAt: z.string(),
  status: JobStatusSchema,
  lastActivityAt: z.string(),
})

export const JobEnrichmentSchema = z.object({
  jobId: z.string().uuid(),
  fitScore: z.number().min(0).max(100).optional(),
  fitBand: z.enum(["HIGH", "MEDIUM", "LOW"]).optional(),
  confidenceScore: z.number().min(0).max(1).optional(),
  gapCount: z.number().optional(),
  readinessStage: JobStatusSchema,
  nextAction: z.string(),
  matchedEvidenceIds: z.array(z.string()).optional(),
  requirements: z.array(z.string()).optional(),
  responsibilities: z.array(z.string()).optional(),
  keywords: z.array(z.string()).optional(),
  blockers: z.array(z.string()).optional(),
})

// ... (add Zod schemas for other interfaces as needed)
