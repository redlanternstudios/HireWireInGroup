/**
 * lib/intelligence/job-signal-weights.ts
 *
 * Phase 2: Job Signal Weighting Engine
 *
 * Purpose: Extract weighted signals from a job description so the
 * generation layer knows which dimensions to emphasize — with reasons.
 *
 * Every signal includes:
 *   - weight (0–10)
 *   - confidence (0–1)
 *   - reasoning[]  ← WHY this matters (no fake scores)
 *
 * Consumed by:
 *   - Narrative Mode selector (Phase 3)
 *   - Resume generation prompt builder
 *   - Cover letter emphasis
 *   - Recruiter Scan Report (Phase 5)
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export interface JobSignal {
  /** Short label, e.g. "AI/ML Systems" */
  label: string
  /** 0–10 importance in this job */
  weight: number
  /** 0–1 confidence in this weight assignment */
  confidence: number
  /** Why this signal matters here — no fake certainty */
  reasoning: string[]
  /** Which section of the JD this was detected in */
  detected_in: Array<"title" | "responsibilities" | "required_quals" | "preferred_quals" | "description">
}

export interface JobSignalProfile {
  job_id: string
  /** Top signals by weight, max 10 */
  signals: JobSignal[]
  /** Dominant dimension (highest weight) */
  dominant_signal: string
  /** Quick read: what does this job actually care most about? */
  summary: string
  /** ATS survival keywords extracted from signal analysis */
  ats_priority_keywords: string[]
  /** Computed at */
  computed_at: string
}

// ─── Signal Taxonomy ──────────────────────────────────────────────────────────
// Each entry: [label, keywords that strongly indicate this signal]

export const SIGNAL_TAXONOMY: Array<{ label: string; keywords: string[] }> = [
  {
    label: "AI/ML Systems",
    keywords: ["ai", "machine learning", "llm", "gpt", "claude", "openai", "anthropic",
      "neural", "model", "inference", "fine-tuning", "rag", "embedding", "vector", "ai-powered",
      "generative ai", "ai strategy", "ai roadmap", "foundation model"],
  },
  {
    label: "Technical Depth",
    keywords: ["api", "sql", "python", "typescript", "javascript", "react", "node",
      "database", "architecture", "system design", "backend", "frontend", "full-stack",
      "cloud", "aws", "gcp", "azure", "infrastructure", "devops", "ci/cd"],
  },
  {
    label: "Product Strategy",
    keywords: ["roadmap", "strategy", "vision", "prioritization", "product vision",
      "go-to-market", "gtm", "launch", "product-led", "product strategy", "discovery",
      "product lifecycle", "0 to 1", "zero to one", "product thinking"],
  },
  {
    label: "Data & Analytics",
    keywords: ["data-driven", "metrics", "kpi", "analytics", "dashboards", "reporting",
      "a/b test", "experiment", "sql", "bi tools", "looker", "tableau", "mixpanel",
      "amplitude", "retention", "funnel", "cohort"],
  },
  {
    label: "Cross-functional Leadership",
    keywords: ["cross-functional", "stakeholder", "alignment", "influence", "collaborate",
      "partner", "executive", "c-suite", "vp", "director", "program", "portfolio",
      "initiative", "org-wide", "company-wide"],
  },
  {
    label: "People Management",
    keywords: ["manage", "manage a team", "direct reports", "hire", "grow the team",
      "mentorship", "coaching", "performance", "1:1", "manager", "head of", "vp of",
      "director of", "team lead"],
  },
  {
    label: "Enterprise/B2B",
    keywords: ["enterprise", "b2b", "saas", "fortune 500", "large accounts", "procurement",
      "compliance", "security", "sla", "integration", "api-first", "platform",
      "customer success", "sales partnership", "revenue"],
  },
  {
    label: "Startup/Growth",
    keywords: ["startup", "early stage", "series a", "series b", "growth", "scrappy",
      "wear many hats", "fast-paced", "high-growth", "ambiguous", "0 to 1",
      "founding team", "seed", "pre-ipo"],
  },
  {
    label: "Automation & Workflows",
    keywords: ["automate", "automation", "workflow", "process improvement", "efficiency",
      "reduce manual", "streamline", "pipeline", "orchestration", "zapier", "make",
      "n8n", "agentic", "agent"],
  },
  {
    label: "GTM & Revenue",
    keywords: ["revenue", "gtm", "go-to-market", "sales", "pipeline", "enablement",
      "partnership", "commercial", "pricing", "packaging", "monetization",
      "demand gen", "growth marketing"],
  },
  {
    label: "Compliance & Risk",
    keywords: ["compliance", "regulatory", "hipaa", "sox", "gdpr", "privacy", "security",
      "audit", "risk", "governance", "legal", "contract", "policy"],
  },
  {
    label: "Customer-Facing",
    keywords: ["customer", "user research", "ux", "discovery", "interview", "feedback",
      "nps", "csat", "onboarding", "adoption", "retention", "support",
      "customer journey", "voice of customer"],
  },
  {
    label: "Communication & Narrative",
    keywords: ["communicate", "present", "executive communication", "storytelling",
      "writing", "documentation", "spec", "prd", "stakeholder communication",
      "narrative", "pitch", "persuade"],
  },
  {
    label: "Systems Thinking",
    keywords: ["systems", "platform", "architecture", "scalable", "infrastructure",
      "ecosystem", "integration", "holistic", "end-to-end", "interconnected",
      "dependencies", "upstream", "downstream"],
  },
  {
    label: "Operational Execution",
    keywords: ["execution", "delivery", "ship", "launch", "program management", "pmo",
      "milestone", "deadline", "operational", "on-time", "scrum", "agile", "sprint",
      "kanban", "project management"],
  },
]

// ─── Core Extractor ───────────────────────────────────────────────────────────

interface JobText {
  title?: string | null
  responsibilities?: string[]
  qualifications_required?: string[]
  qualifications_preferred?: string[]
  description?: string | null
  ats_phrases?: string[]
  keywords?: string[]
}

/**
 * Compute a weighted signal profile from raw job text.
 * Pure function — no AI call, deterministic, testable.
 */
export function computeJobSignalProfile(jobId: string, job: JobText): JobSignalProfile {
  const signals: JobSignal[] = []

  for (const entry of SIGNAL_TAXONOMY) {
    const detectedIn: JobSignal["detected_in"] = []
    const reasoning: string[] = []
    let occurrenceScore = 0

    // Weight by where a keyword appears (title > required > responsibilities > preferred > description)
    const SECTION_WEIGHTS = {
      title: 4,
      required_quals: 3,
      responsibilities: 2,
      preferred_quals: 1,
      description: 1,
    } as const

    for (const kw of entry.keywords) {
      const lkw = kw.toLowerCase()

      if (job.title?.toLowerCase().includes(lkw)) {
        if (!detectedIn.includes("title")) detectedIn.push("title")
        reasoning.push(`Appears in job title`)
        occurrenceScore += SECTION_WEIGHTS.title
      }

      const inRequired = job.qualifications_required?.some(q => q.toLowerCase().includes(lkw))
      if (inRequired) {
        if (!detectedIn.includes("required_quals")) detectedIn.push("required_quals")
        occurrenceScore += SECTION_WEIGHTS.required_quals
      }

      const respCount = job.responsibilities?.filter(r => r.toLowerCase().includes(lkw)).length || 0
      if (respCount > 0) {
        if (!detectedIn.includes("responsibilities")) detectedIn.push("responsibilities")
        occurrenceScore += SECTION_WEIGHTS.responsibilities * Math.min(respCount, 3)
      }

      const inPreferred = job.qualifications_preferred?.some(q => q.toLowerCase().includes(lkw))
      if (inPreferred) {
        if (!detectedIn.includes("preferred_quals")) detectedIn.push("preferred_quals")
        occurrenceScore += SECTION_WEIGHTS.preferred_quals
      }

      const inDescription = job.description?.toLowerCase().includes(lkw)
      if (inDescription) {
        if (!detectedIn.includes("description")) detectedIn.push("description")
        occurrenceScore += SECTION_WEIGHTS.description
      }

      const inAts = job.ats_phrases?.some(p => p.toLowerCase().includes(lkw)) ||
        job.keywords?.some(k => k.toLowerCase().includes(lkw))
      if (inAts) {
        occurrenceScore += 1
      }
    }

    if (occurrenceScore === 0) continue

    // Build reasoning list (deduplicated)
    if (detectedIn.includes("title")) {
      reasoning.push(`"${entry.label}" language appears in the job title — maximum signal weight`)
    }
    if (detectedIn.includes("required_quals")) {
      reasoning.push(`Listed as a required qualification — non-negotiable for this role`)
    }
    if (detectedIn.includes("responsibilities")) {
      reasoning.push(`Mentioned in core responsibilities — day-to-day work involves this`)
    }
    if (detectedIn.includes("preferred_quals")) {
      reasoning.push(`Listed as preferred — nice to have but not a hard gate`)
    }

    // Normalize weight to 0–10
    const rawWeight = Math.min(occurrenceScore, 30)
    const weight = Math.round((rawWeight / 30) * 10 * 10) / 10

    // Confidence increases with multiple detection points
    const confidence = Math.min(0.5 + detectedIn.length * 0.15, 0.95)

    signals.push({
      label: entry.label,
      weight,
      confidence,
      reasoning: [...new Set(reasoning)],
      detected_in: detectedIn,
    })
  }

  // Sort by weight descending, take top 10
  const sortedSignals = signals
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 10)

  const dominantSignal = sortedSignals[0]?.label || "General"

  // Build ATS priority keywords from top 3 signals
  const atsPriorityKeywords: string[] = []
  for (const sig of sortedSignals.slice(0, 3)) {
    const taxonomy = SIGNAL_TAXONOMY.find(t => t.label === sig.label)
    if (taxonomy) {
      atsPriorityKeywords.push(...taxonomy.keywords.slice(0, 4))
    }
  }

  const summary = buildSignalSummary(sortedSignals)

  return {
    job_id: jobId,
    signals: sortedSignals,
    dominant_signal: dominantSignal,
    summary,
    ats_priority_keywords: [...new Set(atsPriorityKeywords)],
    computed_at: new Date().toISOString(),
  }
}

function buildSignalSummary(signals: JobSignal[]): string {
  if (signals.length === 0) return "No strong signals detected in this job description."
  const top = signals.slice(0, 3).map(s => s.label)
  if (top.length === 1) return `This role is primarily about ${top[0]}.`
  if (top.length === 2) return `This role combines ${top[0]} with ${top[1]}.`
  return `This role centers on ${top[0]}, with strong emphasis on ${top[1]} and ${top[2]}.`
}
