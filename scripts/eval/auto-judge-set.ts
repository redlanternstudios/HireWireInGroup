/**
 * Autonomous labeling — run the entailment judge over the corpus triples and
 * compare its verdict to the current token-overlap matcher. No human judging:
 * the judge (Subsystem B) produces the labels, with a citation and reasoning.
 *
 * Surfaces exactly what the spec targets: matcher "met" that the judge downgrades
 * (over-scores), and requirements the judge flags as not_a_requirement (boilerplate).
 *
 * Run: node --import tsx scripts/eval/auto-judge-set.ts [N=24] [outCsv]
 * Requires env: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, OPENAI_API_KEY
 */
import { loadEnvConfig } from "@next/env"
loadEnvConfig(process.cwd())
import { writeFileSync } from "node:fs"
import { judgeRequirement } from "@/lib/matching/entailment-judge"

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!
const N = Number(process.argv[2] || 24)
const OUT = process.argv[3] || ""

async function rest(path: string) {
  const res = await fetch(`${URL}/rest/v1/${path}`, {
    headers: { apikey: KEY, Authorization: `Bearer ${KEY}` },
  })
  if (!res.ok) throw new Error(`${path}: ${res.status} ${await res.text()}`)
  return res.json() as Promise<any[]>
}

function evText(ev: any): string {
  if (!ev) return ""
  return [
    ev.source_title,
    ev.role_name && ev.company_name ? `${ev.role_name} at ${ev.company_name}` : ev.company_name,
    ...(Array.isArray(ev.responsibilities) ? ev.responsibilities : []),
    ...(Array.isArray(ev.outcomes) ? ev.outcomes : []),
    ...(Array.isArray(ev.tools_used) ? [ev.tools_used.join(", ")] : []),
  ].filter(Boolean).join(". ").slice(0, 900)
}

async function main() {
  const evidence = await rest(
    "evidence_library?select=id,source_title,source_type,role_name,company_name,responsibilities,outcomes,tools_used&is_active=eq.true",
  )
  const evById = new Map(evidence.map((e) => [e.id, e]))
  const jobs = await rest(
    "jobs?select=id,role_title,company_name,evidence_map&evidence_map=not.is.null&order=updated_at.desc",
  )

  type T = { job: string; requirement: string; priority: string; matcher: string; risk: string; ids: string[] }
  const triples: T[] = []
  const seen = new Set<string>()
  for (const job of jobs) {
    const matches = job.evidence_map?.requirement_matches
    if (!Array.isArray(matches)) continue
    for (const m of matches) {
      if (!m?.requirement_text) continue
      const key = m.requirement_id || m.requirement_text
      if (seen.has(key)) continue
      seen.add(key)
      triples.push({
        job: `${job.role_title || "?"} @ ${job.company_name || "?"}`,
        requirement: m.requirement_text,
        priority: m.priority || "",
        matcher: m.status || "",
        risk: Array.isArray(m.riskFlags) ? m.riskFlags.join(",") : "",
        ids: m.matched_evidence_ids || [],
      })
    }
  }
  // Highest-signal first: matcher met/partial + a risk flag.
  triples.sort((a, b) => {
    const s = (t: T) => (t.risk && (t.matcher === "met" || t.matcher === "partial") ? 100 : 0) + (t.priority === "required" ? 10 : 0)
    return s(b) - s(a)
  })

  const picked = triples.slice(0, N)
  console.log(`Judging ${picked.length} of ${triples.length} triples with the entailment judge...\n`)

  const rows: string[] = []
  let agree = 0, metDowngraded = 0, boilerplate = 0
  for (const t of picked) {
    const ev = t.ids.map((id) => ({ id, text: evText(evById.get(id)) })).filter((e) => e.text)
    let v
    try {
      v = await judgeRequirement(t.requirement, ev)
    } catch (e: any) {
      console.log(`  ! judge error on "${t.requirement.slice(0, 40)}": ${e?.message}`)
      continue
    }
    if (v.status === t.matcher) agree++
    if (t.matcher === "met" && v.status !== "met") metDowngraded++
    if (v.status === "not_a_requirement") boilerplate++
    const flag = v.status === t.matcher ? "=" : "≠"
    console.log(`${flag} matcher:${t.matcher.padEnd(7)} judge:${v.status.padEnd(17)} | ${t.requirement.slice(0, 66)}`)
    console.log(`    ${v.reasoning.slice(0, 150)}${v.cited_evidence_id ? `  [cite:${v.cited_evidence_id.slice(0, 8)}]` : ""}`)
    rows.push([t.job, t.requirement, t.priority, t.matcher, v.status, v.confidence, v.cited_evidence_id || "", v.reasoning]
      .map((c) => `"${String(c ?? "").replace(/\s+/g, " ").replace(/"/g, '""')}"`).join(","))
  }

  const n = rows.length
  console.log(`\n--- summary (${n} judged) ---`)
  console.log(`judge↔matcher agreement:       ${agree}/${n}  (${Math.round((100 * agree) / n)}%)`)
  console.log(`matcher "met" downgraded:      ${metDowngraded}  (over-scores the judge caught)`)
  console.log(`flagged not_a_requirement:     ${boilerplate}  (extraction boilerplate)`)
  if (OUT) {
    writeFileSync(OUT, ["job,requirement,priority,matcher_status,judge_status,judge_confidence,judge_citation,judge_reasoning", ...rows].join("\n"))
    console.log(`wrote auto-labeled set -> ${OUT}`)
  }
}

main().catch((e) => { console.error(e); process.exit(1) })
