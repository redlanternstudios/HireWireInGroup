/**
 * tests/helpers/api-client.ts
 *
 * Real HTTP API client for E2E tests. No mocks, no direct DB writes.
 * All state assertions go through the API. Uses node-fetch (already a dep).
 *
 * Auth: Supabase password-based sign-in. The session cookie is forwarded on
 * every subsequent request so Next.js route handlers see a real authenticated
 * user — identical to what the browser sends.
 */

import fetch, { type Response } from "node-fetch"

// ---------------------------------------------------------------------------
// Config — pulled from env. Set in .env.test or pass via shell.
// ---------------------------------------------------------------------------
export const BASE_URL = process.env.E2E_BASE_URL ?? "http://localhost:3000"
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error(
    "E2E tests require NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY env vars."
  )
}

// ---------------------------------------------------------------------------
// Session management
// ---------------------------------------------------------------------------
export interface Session {
  accessToken: string
  refreshToken: string
  userId: string
  email: string
  /** Raw Set-Cookie header values from the Supabase auth exchange */
  cookies: string[]
}

/**
 * Sign in with email/password via the Supabase REST auth endpoint.
 * Returns a Session that the API client forwards as cookies on every request.
 */
export async function signIn(email: string, password: string): Promise<Session> {
  const res = await fetch(
    `${SUPABASE_URL}/auth/v1/token?grant_type=password`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({ email, password }),
    }
  )

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`signIn failed (${res.status}): ${body}`)
  }

  const data = (await res.json()) as {
    access_token: string
    refresh_token: string
    user: { id: string; email: string }
  }

  // Collect Set-Cookie headers so we can replay them on app requests
  const rawCookies = (res.headers.raw()["set-cookie"] as string[] | undefined) ?? []

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    userId: data.user.id,
    email: data.user.email ?? email,
    cookies: rawCookies,
  }
}

// ---------------------------------------------------------------------------
// Core request helper
// ---------------------------------------------------------------------------
function cookieHeader(session: Session): string {
  // Strip directives like; Path=/, Secure, HttpOnly — keep name=value pairs only
  return session.cookies
    .map((c) => c.split(";")[0])
    .join("; ")
}

interface RequestOptions {
  method?: "GET" | "POST" | "PATCH" | "DELETE"
  body?: unknown
  headers?: Record<string, string>
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
  options: RequestOptions = {}
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

  let parsed: T
  const contentType = res.headers.get("content-type") ?? ""
  if (contentType.includes("application/json")) {
    parsed = (await res.json()) as T
  } else {
    parsed = (await res.text()) as unknown as T
  }

  return { status: res.status, ok: res.ok, body: parsed, raw: res }
}

// ---------------------------------------------------------------------------
// Typed API helpers — one per endpoint tested
// ---------------------------------------------------------------------------

export interface AnalyzeJobResult {
  success: boolean
  jobId?: string
  job?: {
    id: string
    role_title: string
    company_name: string
    qualifications_required: string[]
    status: string
  }
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

export interface GenerateDocumentsResult {
  success: boolean
  resume?: string
  cover_letter?: string
  governance?: {
    drift_score?: number
    is_blocking?: boolean
    claim_validation?: { hasFabricated: boolean }
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

export interface EvidenceRecord {
  id: string
  user_id: string
  title: string
  company_name?: string
  description?: string
}

export interface EvidenceExportResult {
  success: boolean
  evidence?: EvidenceRecord[]
  error?: string
}

export async function getEvidence(
  session: Session
): Promise<ApiResponse<EvidenceExportResult>> {
  return apiRequest<EvidenceExportResult>(session, "/api/evidence/export")
}

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
}

/**
 * Get a single job row. There is no dedicated /api/jobs/[id] GET endpoint,
 * so we fetch via Supabase REST directly using the session's access token.
 * This is still an API call — no direct DB client used.
 */
export async function getJob(
  session: Session,
  jobId: string
): Promise<JobRow | null> {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/jobs?id=eq.${jobId}&user_id=eq.${session.userId}&select=*&limit=1`,
    {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${session.accessToken}`,
        Accept: "application/json",
      },
    }
  )
  if (!res.ok) return null
  const rows = (await res.json()) as JobRow[]
  return rows[0] ?? null
}

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
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/applications?job_id=eq.${jobId}&user_id=eq.${session.userId}&select=*`,
    {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${session.accessToken}`,
        Accept: "application/json",
      },
    }
  )
  if (!res.ok) return []
  return (await res.json()) as ApplicationRow[]
}

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
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/domain_events?job_id=eq.${jobId}&order=created_at.asc&select=*`,
    {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${session.accessToken}`,
        Accept: "application/json",
      },
    }
  )
  if (!res.ok) return []
  return (await res.json()) as DomainEvent[]
}

/**
 * Poll a predicate at 1-second intervals until it returns true or timeout elapses.
 * Used to wait for async domain event propagation.
 */
export async function waitFor(
  predicate: () => Promise<boolean>,
  timeoutMs = 15_000,
  intervalMs = 1_000
): Promise<void> {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    if (await predicate()) return
    await new Promise((r) => setTimeout(r, intervalMs))
  }
  throw new Error(`waitFor timed out after ${timeoutMs}ms`)
}
