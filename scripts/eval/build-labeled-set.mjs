#!/usr/bin/env node
/**
 * Phase 0 (Matching & Extraction spec) — assemble the labeled evaluation set.
 *
 * Pulls (requirement, evidence, current-matcher-verdict) triples from the live
 * corpus (jobs.evidence_map.requirement_matches, joined to evidence_library)
 * and emits a review sheet for a HUMAN to judge the correct verdict. Per the
 * spec, this set is the precondition for calibrating extraction + matching:
 * every 0.65/0.35 threshold is a guess until it exists.
 *
 * The sheet deliberately surfaces where the current matcher is likely wrong —
 * e.g. status=met with a seniority_mismatch risk flag — so judging is efficient.
 *
 * Output CSV columns:
 *   job, requirement, priority, matcher_status, matcher_method, matcher_risk,
 *   evidence (titles + brief content), human_verdict [blank], human_notes [blank]
 *
 * Requires env: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 * Run: node scripts/eval/build-labeled-set.mjs [targetCount=100] [outPath]
 *
 * NOTE: output contains real user evidence — do NOT commit it. Deliver privately.
 */
import { writeFileSync } from "node:fs"

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!URL || !KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY")
  process.exit(1)
}
const TARGET = Number(process.argv[2] || 100)
const OUT = process.argv[3] || "labeled-set-candidates.csv"

async function rest(path) {
  const res = await fetch(`${URL}/rest/v1/${path}`, {
    headers: { apikey: KEY, Authorization: `Bearer ${KEY}` },
  })
  if (!res.ok) throw new Error(`${path}: ${res.status} ${await res.text()}`)
  return res.json()
}

function briefEvidence(ev) {
  if (!ev) return ""
  const parts = [
    ev.source_title,
    ev.role_name && ev.company_name ? `${ev.role_name} @ ${ev.company_name}` : ev.company_name,
    ...(Array.isArray(ev.responsibilities) ? ev.responsibilities.slice(0, 2) : []),
    ...(Array.isArray(ev.outcomes) ? ev.outcomes.slice(0, 2) : []),
    ...(Array.isArray(ev.tools_used) ? [ev.tools_used.slice(0, 6).join(", ")] : []),
  ].filter(Boolean)
  return parts.join(" · ")
}

function csvCell(v) {
  const s = String(v ?? "").replace(/\s+/g, " ").trim()
  return `"${s.replace(/"/g, '""')}"`
}

async function main() {
  // evidence lookup
  const evidence = await rest(
    "evidence_library?select=id,source_title,source_type,role_name,company_name,responsibilities,outcomes,tools_used&is_active=eq.true",
  )
  const evById = new Map(evidence.map((e) => [e.id, e]))

  // jobs with a matcher-produced evidence_map
  const jobs = await rest(
    "jobs?select=id,role_title,company_name,evidence_map&evidence_map=not.is.null&order=updated_at.desc",
  )

  const triples = []
  const seenReq = new Set() // dedup by requirement_id, keep variety
  for (const job of jobs) {
    const matches = job.evidence_map?.requirement_matches
    if (!Array.isArray(matches)) continue
    for (const m of matches) {
      if (!m?.requirement_text) continue
      const key = m.requirement_id || m.normalized_requirement || m.requirement_text
      if (seenReq.has(key)) continue
      seenReq.add(key)
      const evText = (m.matched_evidence_ids || [])
        .map((id) => briefEvidence(evById.get(id)))
        .filter(Boolean)
        .join("  ||  ")
      triples.push({
        job: `${job.role_title || "?"} @ ${job.company_name || "?"}`,
        requirement: m.requirement_text,
        priority: m.priority || "",
        status: m.status || "",
        method: m.match_method || "",
        risk: Array.isArray(m.riskFlags) ? m.riskFlags.join(",") : "",
        evidence: evText || "(no matched evidence)",
      })
    }
  }

  // Rank so the most informative rows come first, then balance:
  //  1) met/partial WITH a risk flag (likely matcher over-scores) — highest signal
  //  2) required-priority
  //  3) a spread across met/partial/gap
  const score = (t) => {
    let s = 0
    if (t.risk && (t.status === "met" || t.status === "partial")) s += 100
    if (t.priority === "required") s += 10
    if (t.status === "partial") s += 3 // boundary cases are informative
    return s
  }
  triples.sort((a, b) => score(b) - score(a))

  const picked = triples.slice(0, TARGET)
  const header = [
    "job", "requirement", "priority", "matcher_status", "matcher_method",
    "matcher_risk", "evidence", "human_verdict", "human_notes",
  ]
  const rows = picked.map((t) =>
    [t.job, t.requirement, t.priority, t.status, t.method, t.risk, t.evidence, "", ""]
      .map(csvCell).join(","),
  )
  writeFileSync(OUT, [header.map(csvCell).join(","), ...rows].join("\n"))

  const byStatus = picked.reduce((a, t) => ((a[t.status] = (a[t.status] || 0) + 1), a), {})
  const withRisk = picked.filter((t) => t.risk).length
  console.log(`corpus: ${jobs.length} jobs, ${evidence.length} evidence, ${triples.length} unique requirement triples`)
  console.log(`wrote ${picked.length} triples -> ${OUT}`)
  console.log(`  by matcher_status:`, byStatus)
  console.log(`  carrying a matcher risk flag (likely over-scores to scrutinize): ${withRisk}`)
}

main().catch((e) => { console.error(e); process.exit(1) })
