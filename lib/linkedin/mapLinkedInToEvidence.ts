/**
 * lib/linkedin/mapLinkedInToEvidence.ts
 *
 * Translates a LinkedInCaptureResult into evidence_library rows.
 * Follows the same mapping conventions as lib/mapResumeToEvidence.ts.
 *
 * Rules:
 *   - Items with status "explicit" or "inferred" are written.
 *   - Items with status "noise" are silently discarded.
 *   - Items with status "missing" produce no rows (nothing to write).
 *   - Activity is intentionally excluded — it NEVER becomes an evidence row.
 */

import type { MappedEvidenceRow } from "@/lib/mapResumeToEvidence"
import type { LinkedInCaptureResult } from "./extractLinkedInProfile"

// ── Experience → work_experience ──────────────────────────────────────────────

function mapExperienceToEvidence(
  experience: LinkedInCaptureResult["experience"]
): MappedEvidenceRow[] {
  const rows: MappedEvidenceRow[] = []

  for (const entry of experience) {
    if (entry.status === "noise") continue
    // Need at minimum one of company or role_title to form a meaningful row
    if (!entry.company && !entry.role_title) continue

    const company = entry.company ?? "Unknown Company"
    const role = entry.role_title ?? "Unknown Role"

    const dateRange =
      [entry.start_date, entry.end_date].filter(Boolean).join(" – ") || null

    rows.push({
      source_type: "work_experience",
      source_title: `${role} at ${company}`,
      role_name: role,
      company_name: company,
      date_range: dateRange,
      responsibilities:
        entry.impact_claims_present.length > 0
          ? entry.impact_claims_present
          : null,
      tools_used:
        entry.skills_attached.length > 0 ? entry.skills_attached : null,
      outcomes: null,
      industries: null,
      confidence_level: entry.status === "explicit" ? "high" : "medium",
      evidence_weight: entry.status === "explicit" ? "high" : "medium",
      is_user_approved: false,
      is_active: true,
      priority_rank: 0,
    })
  }

  return rows
}

// ── Education → education ─────────────────────────────────────────────────────

function mapEducationToEvidence(
  education: LinkedInCaptureResult["education"]
): MappedEvidenceRow[] {
  const rows: MappedEvidenceRow[] = []

  for (const entry of education) {
    if (entry.status === "noise") continue
    if (!entry.institution && !entry.degree) continue

    const institution = entry.institution ?? "Unknown Institution"
    const degree = entry.degree ?? "Degree"
    const field = entry.field

    const sourceTitle = field
      ? `${degree} in ${field}, ${institution}`
      : `${degree}, ${institution}`

    const dateRange =
      [entry.start_date, entry.end_date].filter(Boolean).join(" – ") || null

    rows.push({
      source_type: "education",
      source_title: sourceTitle,
      role_name: degree,
      company_name: institution,
      date_range: dateRange,
      responsibilities: entry.honors ? [entry.honors] : null,
      tools_used: null,
      outcomes: null,
      industries: null,
      confidence_level: entry.status === "explicit" ? "high" : "medium",
      evidence_weight: "medium",
      is_user_approved: false,
      is_active: true,
      priority_rank: 0,
    })
  }

  return rows
}

// ── Certifications → certification ────────────────────────────────────────────

function mapCertificationsToEvidence(
  certifications: LinkedInCaptureResult["certifications"]
): MappedEvidenceRow[] {
  const rows: MappedEvidenceRow[] = []

  for (const entry of certifications) {
    if (entry.status === "noise") continue
    if (!entry.certification_name) continue

    rows.push({
      source_type: "certification",
      source_title: entry.certification_name,
      role_name: null,
      company_name: entry.issuer ?? null,
      date_range: entry.issued_date ?? null,
      responsibilities: null,
      tools_used: null,
      outcomes: null,
      industries: null,
      confidence_level: entry.status === "explicit" ? "high" : "medium",
      evidence_weight: "medium",
      is_user_approved: false,
      is_active: true,
      priority_rank: 0,
    })
  }

  return rows
}

// ── Skills → one consolidated skill row ──────────────────────────────────────
// Follows the same pattern as mapResumeToEvidence: one row per import session.

function mapSkillsToEvidence(
  skills: LinkedInCaptureResult["skills"]
): MappedEvidenceRow[] {
  const allSkills =
    skills.normalized_skills.length > 0
      ? skills.normalized_skills
      : skills.raw_skills

  if (allSkills.length === 0) return []

  return [
    {
      source_type: "skill",
      source_title: "Professional Skills",
      role_name: null,
      company_name: null,
      date_range: null,
      responsibilities: null,
      tools_used: allSkills,
      outcomes: null,
      industries: null,
      confidence_level: "medium",
      evidence_weight: "medium",
      is_user_approved: false,
      is_active: true,
      priority_rank: 0,
    },
  ]
}

// ── Main mapper ───────────────────────────────────────────────────────────────

/**
 * Returns all evidence rows ready for upsert into evidence_library.
 * Activity entries are intentionally excluded — they never become evidence.
 */
export function mapLinkedInToEvidence(
  result: LinkedInCaptureResult
): MappedEvidenceRow[] {
  return [
    ...mapExperienceToEvidence(result.experience),
    ...mapEducationToEvidence(result.education),
    ...mapCertificationsToEvidence(result.certifications),
    ...mapSkillsToEvidence(result.skills),
  ]
}
