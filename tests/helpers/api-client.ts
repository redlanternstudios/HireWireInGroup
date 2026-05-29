/**
 * tests/helpers/api-client.ts
 *
 * Real HTTP API client for E2E tests. No mocks, no direct DB writes.
 * All state assertions go through the API or Supabase REST (using the
 * session's access token — identical to what the browser sends via RLS).
 *
 * Auth: Supabase password-based sign-in via REST.
 */

import fetch, { type Response, FormData, Blob } from "node-fetch"
import { createServerClient } from "@supabase/ssr"

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------
export const BASE_URL = process.env.E2E_BASE_URL ?? "http://localhost:3000"
function cleanEnv(value: string | undefined): string {
  return (value ?? "").trim().replace(/^['"]|['"]$/g, "").replace(/[\r\n\t]/g, "")
}

const SUPABASE_URL = cleanEnv(process.env.NEXT_PUBLIC_SUPABASE_URL)
const SUPABASE_ANON_KEY = cleanEnv(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error(
    "E2E tests require NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY env vars."
  )
}

// ---------------------------------------------------------------------------
// Session
// ---------------------------------------------------------------------------
export interface Session {
  accessToken: string
  refreshToken: string
  userId: string
  email: string
  /** Raw Set-Cookie values — forwarded on every Next.js app request */
  cookies: string[]
}

export async function signIn(email: string, password: string): Promise<Session> {
  let authCookies: { name: string; value: string }[] = []
  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return authCookies
      },
      setAll(cookiesToSet) {
        authCookies = cookiesToSet.map(({ name, value }) => ({ name, value }))
      },
    },
  })

  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error || !data.session || !data.user) {
    throw new Error(`signIn failed: ${error?.message ?? "No session returned"}`)
  }

  return {
    accessToken: data.session.access_token,
    refreshToken: data.session.refresh_token,
    userId: data.user.id,
    email: data.user.email ?? email,
    cookies: authCookies.map(({ name, value }) => `${name}=${value}`),
  }
}

// ---------------------------------------------------------------------------
// Core helpers
// ---------------------------------------------------------------------------
function cookieHeader(session: Session): string {
  return session.cookies
    .map((c) => c.split(";")[0])
    .join("; ")
}

export interface ApiResponse<T = unknown> {
  status: number
  ok: boolean
  body: T
  raw: Response
}

export async function apiRequest<T = unknown>(
  session: Session,
  path: string,
  options: {
    method?: "GET" | "POST" | "PATCH" | "DELETE"
    body?: unknown
    headers?: Record<string, string>
  } = {}
): Promise<ApiResponse<T>> {
  const { method = "GET", body, headers = {} } = options
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      Cookie: cookieHeader(session),
      Authorization: `Bearer ${session.accessToken}`,
      ...headers,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })
  const contentType = res.headers.get("content-type") ?? ""
  const parsed = contentType.includes("application/json")
    ? ((await res.json()) as T)
    : ((await res.text()) as unknown as T)
  return { status: res.status, ok: res.ok, body: parsed, raw: res }
}

/** Supabase REST helper — uses bearer token directly, respects RLS */
async function sbGet<T>(
  session: Session,
  table: string,
  query: string
): Promise<T[]> {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/${table}?${query}`,
    {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${session.accessToken}`,
        Accept: "application/json",
      },
    }
  )
  if (!res.ok) return []
  return (await res.json()) as T[]
}

async function sbPost<T>(
  session: Session,
  table: string,
  payload: Record<string, unknown>,
  returning = "representation"
): Promise<T | null> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: "POST",
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${session.accessToken}`,
      "Content-Type": "application/json",
      Prefer: `return=${returning}`,
    },
    body: JSON.stringify(payload),
  })
  if (!res.ok) return null
  const data = await res.json()
  return (Array.isArray(data) ? data[0] : data) as T
}

async function sbDelete(
  session: Session,
  table: string,
  query: string
): Promise<boolean> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${query}`, {
    method: "DELETE",
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${session.accessToken}`,
    },
  })
  return res.ok
}

// ---------------------------------------------------------------------------
// API: Analyze
// ---------------------------------------------------------------------------
export interface AnalyzeJobResult {
  success: boolean
  jobId?: string
  job?: { id: string; role_title: string; company_name: string; qualifications_required: string[] }
  error?: string
}

export async function analyzeJob(
  session: Session,
  payload: { job_url?: string; job_description?: string }
): Promise<ApiResponse<AnalyzeJobResult>> {
  return apiRequest<AnalyzeJobResult>(session, "/api/analyze", {
    method: "POST",
    body: payload,
  })
}

// ---------------------------------------------------------------------------
// API: Re-analyze (triggers evidence mapping + full re-analysis)
// ---------------------------------------------------------------------------
export interface ReAnalyzeResult {
  success: boolean
  error?: string
}

export async function reAnalyzeJob(
  session: Session,
  jobId: string
): Promise<ApiResponse<ReAnalyzeResult>> {
  return apiRequest<ReAnalyzeResult>(session, "/api/re-analyze", {
    method: "POST",
    body: { job_id: jobId },
  })
}

// ---------------------------------------------------------------------------
// API: Generate documents
// ---------------------------------------------------------------------------
export interface GenerateDocumentsResult {
  success: boolean
  resume?: string
  cover_letter?: string
  governance?: {
    drift_score?: number
    is_blocking?: boolean
    claim_validation?: { hasFabricated: boolean; fabricatedClaims?: string[] }
  }
  error?: string
  reason?: string
  detail?: string
}

export async function generateDocuments(
  session: Session,
  jobId: string
): Promise<ApiResponse<GenerateDocumentsResult>> {
  return apiRequest<GenerateDocumentsResult>(session, "/api/generate-documents", {
    method: "POST",
    body: { job_id: jobId },
  })
}

// ---------------------------------------------------------------------------
// API: Evidence — CRUD via Supabase REST (RLS-gated by session token)
// ---------------------------------------------------------------------------
export interface EvidenceRecord {
  id: string
  user_id: string
  source_title: string
  source_type: string
  company_name?: string | null
  role_name?: string | null
  responsibilities?: string[]
  tools_used?: string[]
  outcomes?: string[]
  confidence_level?: string
  is_active?: boolean
}

/** Create a single evidence record directly via Supabase REST */
export async function createEvidence(
  session: Session,
  fields: Omit<EvidenceRecord, "id" | "user_id">
): Promise<EvidenceRecord | null> {
  return sbPost<EvidenceRecord>(session, "evidence_library", {
    ...fields,
    user_id: session.userId,
    is_active: true,
    is_user_approved: true,
    visibility_status: "active",
    evidence_weight: "medium",
  })
}

/** Update a single evidence record */
export async function updateEvidence(
  session: Session,
  evidenceId: string,
  fields: Partial<EvidenceRecord>
): Promise<boolean> {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/evidence_library?id=eq.${evidenceId}&user_id=eq.${session.userId}`,
    {
      method: "PATCH",
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${session.accessToken}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify(fields),
    }
  )
  return res.ok
}

/** Delete a single evidence record */
export async function deleteEvidence(
  session: Session,
  evidenceId: string
): Promise<boolean> {
  return sbDelete(
    session,
    "evidence_library",
    `id=eq.${evidenceId}&user_id=eq.${session.userId}`
  )
}

/** Get all active evidence records for the session user */
export async function listEvidence(
  session: Session
): Promise<EvidenceRecord[]> {
  return sbGet<EvidenceRecord>(
    session,
    "evidence_library",
    `user_id=eq.${session.userId}&is_active=eq.true&select=*&order=created_at.desc`
  )
}

// ---------------------------------------------------------------------------
// API: Evidence export (CSV)
// ---------------------------------------------------------------------------
export async function exportEvidenceCSV(
  session: Session
): Promise<{ status: number; ok: boolean; csv: string }> {
  const res = await fetch(`${BASE_URL}/api/evidence/export`, {
    headers: {
      Cookie: cookieHeader(session),
      Authorization: `Bearer ${session.accessToken}`,
    },
  })
  const csv = await res.text()
  return { status: res.status, ok: res.ok, csv }
}

/** Import evidence via CSV file upload to /api/evidence/import */
export async function importEvidenceCSV(
  session: Session,
  csvContent: string
): Promise<ApiResponse<{ imported: number; error?: string }>> {
  const fd = new FormData()
  fd.append("file", new Blob([csvContent], { type: "text/csv" }), "evidence.csv")
  const res = await fetch(`${BASE_URL}/api/evidence/import`, {
    method: "POST",
    headers: {
      Cookie: cookieHeader(session),
      Authorization: `Bearer ${session.accessToken}`,
    },
    body: fd,
  })
  const body = (await res.json()) as { imported: number; error?: string }
  return { status: res.status, ok: res.ok, body, raw: res }
}

// ---------------------------------------------------------------------------
// API: Job row (via Supabase REST)
// ---------------------------------------------------------------------------
export interface JobRow {
  id: string
  role_title: string
  company_name: string
  status: string
  applied_at: string | null
  generation_status: string | null
  quality_passed: boolean | null
  evidence_map: unknown
  fit: string | null
  score: number | null
  qualifications_required?: string[]
  blocked_reasons?: string[]
  readiness_state?: string
}

export async function getJob(
  session: Session,
  jobId: string
): Promise<JobRow | null> {
  const rows = await sbGet<JobRow>(
    session,
    "jobs",
    `id=eq.${jobId}&user_id=eq.${session.userId}&select=*&limit=1`
  )
  return rows[0] ?? null
}

// ---------------------------------------------------------------------------
// API: Applications (via Supabase REST)
// ---------------------------------------------------------------------------
export interface ApplicationRow {
  id: string
  job_id: string
  user_id: string
  method: string
  applied_at: string
}

export async function getApplications(
  session: Session,
  jobId: string
): Promise<ApplicationRow[]> {
  return sbGet<ApplicationRow>(
    session,
    "applications",
    `job_id=eq.${jobId}&user_id=eq.${session.userId}&select=*`
  )
}

// ---------------------------------------------------------------------------
// API: Domain events (via Supabase REST)
// ---------------------------------------------------------------------------
export interface DomainEvent {
  id: number
  event_type: string
  job_id: string
  payload: Record<string, unknown>
  created_at: string
}

export async function getDomainEvents(
  session: Session,
  jobId: string
): Promise<DomainEvent[]> {
  return sbGet<DomainEvent>(
    session,
    "domain_events",
    `job_id=eq.${jobId}&order=created_at.asc&select=*`
  )
}

// ---------------------------------------------------------------------------
// API: SightEngine events (via Supabase REST — table may not exist yet)
// ---------------------------------------------------------------------------
export interface SightEvent {
  id: string
  event_type: string
  job_id: string
  user_id: string
  created_at: string
  properties?: Record<string, unknown>
}

export async function getSightEvents(
  session: Session,
  jobId: string
): Promise<SightEvent[] | null> {
  // sight_events table is MVP Phase 1 — may not be deployed yet.
  // Returns null (not []) to distinguish "table missing" from "no rows".
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/sight_events?job_id=eq.${jobId}&user_id=eq.${session.userId}&order=created_at.asc&select=*`,
      {
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${session.accessToken}`,
          Accept: "application/json",
        },
      }
    )
    if (res.status === 404 || res.status === 400) return null // table not found
    if (!res.ok) return null
    return (await res.json()) as SightEvent[]
  } catch {
    return null
  }
}

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

/**
 * Poll predicate at 1s intervals until it returns true or timeout elapses.
 * Use for async domain event propagation assertions.
 */
export async function waitFor(
  predicate: () => Promise<boolean>,
  timeoutMs = 20_000,
  intervalMs = 1_000
): Promise<void> {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    if (await predicate()) return
    await new Promise((r) => setTimeout(r, intervalMs))
  }
  throw new Error(`waitFor timed out after ${timeoutMs}ms`)
}

/**
 * Generate a unique test run ID suffix to avoid cross-run collisions
 * on evidence records and job descriptions.
 */
export function testRunId(): string {
  return `e2e-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}
