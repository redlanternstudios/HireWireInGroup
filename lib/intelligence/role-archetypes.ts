/**
 * lib/intelligence/role-archetypes.ts
 *
 * Phase 3: Role Archetype Engine
 *
 * Purpose: Classify a job into a named archetype so the generation layer
 * can tune tone, evidence selection, and narrative density appropriately.
 *
 * Each archetype defines:
 *  - preferred evidence types
 *  - narrative tone
 *  - technical/leadership/outcome density targets
 *  - recruiter expectations and risk factors
 *  - ATS language fingerprint
 */

import type { JobSignalProfile } from "./job-signal-weights"

// ─── Archetype Registry ───────────────────────────────────────────────────────

export const ROLE_ARCHETYPES = [
  "AI Product Manager",
  "Technical Product Manager",
  "Enterprise TPM",
  "Startup AI PM",
  "AI Solutions Consultant",
  "GTM Systems Lead",
  "Product Operations Manager",
  "Implementation Strategist",
  "Platform PM",
  "Automation Architect",
  "Senior Software Engineer",
  "Staff Engineer",
  "Data Engineer",
  "ML Engineer",
  "Engineering Manager",
  "Revenue Operations Lead",
  "Growth PM",
  "Design Technologist",
  "General PM",
  "Unknown",
] as const

export type RoleArchetype = typeof ROLE_ARCHETYPES[number]

export interface ArchetypeProfile {
  archetype: RoleArchetype
  confidence: number

  /** Evidence types that recruiters expect to see for this archetype */
  preferred_evidence_types: string[]

  /** Tone descriptors for generation prompts */
  preferred_tone: string

  /** 0–10 density targets for generation */
  density_targets: {
    technical: number
    leadership: number
    ai: number
    enterprise: number
    startup: number
    outcome: number
    metrics: number
  }

  /** What a recruiter likely cares about most */
  recruiter_priority: string

  /** Risk factors — what raises red flags for THIS archetype */
  risk_factors: string[]

  /** ATS language fingerprint */
  ats_language: string[]

  /** Brief rationale for classification */
  rationale: string
}

// ─── Archetype Definitions ────────────────────────────────────────────────────

const ARCHETYPE_DEFINITIONS: Record<
  Exclude<RoleArchetype, "Unknown">,
  Omit<ArchetypeProfile, "archetype" | "confidence" | "rationale">
> = {
  "AI Product Manager": {
    preferred_evidence_types: ["work_experience", "shipped_product", "project"],
    preferred_tone: "Strategic and forward-thinking, grounded in technical fluency",
    density_targets: { technical: 6, leadership: 5, ai: 9, enterprise: 4, startup: 5, outcome: 7, metrics: 6 },
    recruiter_priority: "Proof you can work alongside AI/ML engineers and translate AI capabilities into product value",
    risk_factors: ["Pure PM with no AI exposure", "No shipped AI product", "Vague AI understanding"],
    ats_language: ["AI roadmap", "LLM", "model evaluation", "AI-powered", "generative AI", "prompting", "AI strategy"],
  },
  "Technical Product Manager": {
    preferred_evidence_types: ["work_experience", "shipped_product", "project"],
    preferred_tone: "Technically credible and delivery-focused",
    density_targets: { technical: 8, leadership: 5, ai: 4, enterprise: 5, startup: 4, outcome: 7, metrics: 7 },
    recruiter_priority: "Evidence you can go deep on APIs, data models, or system architecture with engineers",
    risk_factors: ["No technical background", "Can't speak to system tradeoffs", "No engineering collaboration"],
    ats_language: ["API", "system design", "technical spec", "PRD", "data model", "backend", "integration"],
  },
  "Enterprise TPM": {
    preferred_evidence_types: ["work_experience", "achievement"],
    preferred_tone: "Rigorous, process-oriented, scaled-thinking",
    density_targets: { technical: 7, leadership: 8, ai: 3, enterprise: 9, startup: 1, outcome: 6, metrics: 7 },
    recruiter_priority: "Multi-team coordination, program delivery at scale, stakeholder management across org layers",
    risk_factors: ["Only startup experience", "Small team scope", "No enterprise customer exposure"],
    ats_language: ["program management", "stakeholder alignment", "OKR", "delivery", "roadmap", "cross-functional", "enterprise"],
  },
  "Startup AI PM": {
    preferred_evidence_types: ["shipped_product", "project", "work_experience"],
    preferred_tone: "Scrappy, direct, outcome-obsessed",
    density_targets: { technical: 7, leadership: 4, ai: 8, enterprise: 2, startup: 9, outcome: 9, metrics: 7 },
    recruiter_priority: "Ship velocity, founder-like ownership, AI product intuition, comfort with ambiguity",
    risk_factors: ["Only enterprise background", "Slow-moving portfolio", "Process-heavy narrative"],
    ats_language: ["0 to 1", "launched", "shipped", "AI-native", "growth", "fast-paced", "ownership"],
  },
  "AI Solutions Consultant": {
    preferred_evidence_types: ["work_experience", "achievement", "certification"],
    preferred_tone: "Client-facing, authoritative, solution-oriented",
    density_targets: { technical: 6, leadership: 5, ai: 8, enterprise: 7, startup: 3, outcome: 8, metrics: 6 },
    recruiter_priority: "Can you walk an enterprise client through AI adoption without losing them or overselling?",
    risk_factors: ["No customer-facing experience", "Pure internal PM", "Weak enterprise narrative"],
    ats_language: ["solutions", "client", "implementation", "AI enablement", "consulting", "advisory", "ROI"],
  },
  "GTM Systems Lead": {
    preferred_evidence_types: ["work_experience", "project", "achievement"],
    preferred_tone: "Commercial, revenue-minded, operationally sharp",
    density_targets: { technical: 5, leadership: 6, ai: 5, enterprise: 6, startup: 5, outcome: 9, metrics: 9 },
    recruiter_priority: "Revenue impact, sales/marketing alignment, systems that scale GTM operations",
    risk_factors: ["No revenue-tied outcomes", "Pure product with no GTM exposure", "Weak metrics"],
    ats_language: ["GTM", "revenue", "pipeline", "CRM", "sales enablement", "conversion", "funnel"],
  },
  "Product Operations Manager": {
    preferred_evidence_types: ["work_experience", "achievement"],
    preferred_tone: "Process-oriented, scaling-focused, cross-team facilitator",
    density_targets: { technical: 4, leadership: 6, ai: 3, enterprise: 6, startup: 4, outcome: 7, metrics: 8 },
    recruiter_priority: "Scaling processes, reducing friction across product teams, measurement systems",
    risk_factors: ["No ops-specific work", "Only individual contributor", "No process improvement evidence"],
    ats_language: ["product ops", "process improvement", "tooling", "documentation", "efficiency", "scaling"],
  },
  "Implementation Strategist": {
    preferred_evidence_types: ["work_experience", "project", "achievement"],
    preferred_tone: "Methodical, client-aligned, delivery-confident",
    density_targets: { technical: 6, leadership: 5, ai: 4, enterprise: 8, startup: 2, outcome: 8, metrics: 7 },
    recruiter_priority: "Complex implementation delivery with enterprise clients, technical depth + client management",
    risk_factors: ["No implementation track record", "No enterprise client exposure", "Weak delivery narrative"],
    ats_language: ["implementation", "onboarding", "deployment", "technical customer success", "delivery"],
  },
  "Platform PM": {
    preferred_evidence_types: ["work_experience", "shipped_product", "project"],
    preferred_tone: "Infrastructure-minded, developer-empathetic, systemic",
    density_targets: { technical: 9, leadership: 5, ai: 5, enterprise: 6, startup: 4, outcome: 6, metrics: 7 },
    recruiter_priority: "Understanding of platform economics, developer needs, API-first design, scalable systems",
    risk_factors: ["No platform/infra experience", "Only consumer-facing PM", "Weak technical understanding"],
    ats_language: ["platform", "developer experience", "API", "infrastructure", "ecosystem", "SDK", "scalability"],
  },
  "Automation Architect": {
    preferred_evidence_types: ["project", "work_experience", "shipped_product"],
    preferred_tone: "Systems thinker, automation-first, high-leverage mindset",
    density_targets: { technical: 8, leadership: 4, ai: 7, enterprise: 5, startup: 5, outcome: 8, metrics: 8 },
    recruiter_priority: "Proof of automation systems built, tools used, measurable efficiency gains",
    risk_factors: ["No automation portfolio", "Weak tool depth", "No measurable outcomes"],
    ats_language: ["automation", "workflow", "no-code", "n8n", "zapier", "make", "agentic", "pipeline"],
  },
  "Senior Software Engineer": {
    preferred_evidence_types: ["work_experience", "open_source", "project"],
    preferred_tone: "Technically precise, impact-focused, collaborative",
    density_targets: { technical: 10, leadership: 3, ai: 5, enterprise: 4, startup: 4, outcome: 7, metrics: 6 },
    recruiter_priority: "Code quality, system design, technical breadth, measurable engineering impact",
    risk_factors: ["Vague technical claims", "No engineering metrics", "Missing tech stack alignment"],
    ats_language: ["engineer", "built", "shipped", "architecture", "performance", "refactor", "system design"],
  },
  "Staff Engineer": {
    preferred_evidence_types: ["work_experience", "achievement", "project"],
    preferred_tone: "Cross-team technical leader, high-leverage systems thinker",
    density_targets: { technical: 9, leadership: 7, ai: 5, enterprise: 6, startup: 3, outcome: 8, metrics: 7 },
    recruiter_priority: "Cross-team technical influence, architecture decisions, leveling up the organization",
    risk_factors: ["Only IC scope", "No org-wide impact", "Missing technical leadership evidence"],
    ats_language: ["staff", "principal", "technical leadership", "architecture", "org-wide", "multiplier"],
  },
  "Data Engineer": {
    preferred_evidence_types: ["work_experience", "project", "open_source"],
    preferred_tone: "Data-fluent, pipeline-obsessed, reliability-focused",
    density_targets: { technical: 9, leadership: 3, ai: 5, enterprise: 5, startup: 4, outcome: 7, metrics: 8 },
    recruiter_priority: "Pipeline architecture, data quality, tooling fluency, scale",
    risk_factors: ["No pipeline work", "Weak SQL/Python", "No data quality emphasis"],
    ats_language: ["dbt", "airflow", "spark", "SQL", "data pipeline", "ETL", "warehouse", "Snowflake", "BigQuery"],
  },
  "ML Engineer": {
    preferred_evidence_types: ["work_experience", "project", "open_source"],
    preferred_tone: "Research-informed, production-focused, model-fluent",
    density_targets: { technical: 10, leadership: 3, ai: 10, enterprise: 4, startup: 5, outcome: 7, metrics: 8 },
    recruiter_priority: "Model training, deployment, evaluation pipelines, ML infrastructure",
    risk_factors: ["Only research, no production", "No MLOps exposure", "Weak model metrics"],
    ats_language: ["model training", "inference", "MLOps", "fine-tuning", "deployment", "PyTorch", "evaluation"],
  },
  "Engineering Manager": {
    preferred_evidence_types: ["work_experience", "achievement"],
    preferred_tone: "People-first technical leader, delivery-accountable",
    density_targets: { technical: 6, leadership: 10, ai: 3, enterprise: 5, startup: 4, outcome: 7, metrics: 7 },
    recruiter_priority: "Team growth, delivery track record, technical credibility to be taken seriously by ICs",
    risk_factors: ["No people management", "No hiring experience", "Weak team outcomes"],
    ats_language: ["managed team", "direct reports", "hiring", "mentorship", "performance", "roadmap ownership"],
  },
  "Revenue Operations Lead": {
    preferred_evidence_types: ["work_experience", "achievement"],
    preferred_tone: "Data-driven, process-oriented, revenue-focused",
    density_targets: { technical: 5, leadership: 6, ai: 4, enterprise: 7, startup: 4, outcome: 10, metrics: 10 },
    recruiter_priority: "Revenue impact, CRM ownership, sales/marketing/CS alignment, forecasting",
    risk_factors: ["No revenue numbers", "No CRM experience", "No cross-functional ops"],
    ats_language: ["revenue ops", "CRM", "Salesforce", "forecasting", "pipeline", "ARR", "churn", "NRR"],
  },
  "Growth PM": {
    preferred_evidence_types: ["work_experience", "shipped_product", "achievement"],
    preferred_tone: "Experiment-driven, metric-obsessed, user-fluent",
    density_targets: { technical: 6, leadership: 4, ai: 5, enterprise: 3, startup: 7, outcome: 10, metrics: 10 },
    recruiter_priority: "A/B test velocity, activation/retention metrics, growth loops built",
    risk_factors: ["No experiment history", "No growth metrics", "Pure strategy without execution"],
    ats_language: ["A/B test", "activation", "retention", "funnel", "growth loop", "conversion", "experiment"],
  },
  "Design Technologist": {
    preferred_evidence_types: ["project", "portfolio_entry", "shipped_product"],
    preferred_tone: "Craft-focused, systems-aware, code-meets-design",
    density_targets: { technical: 8, leadership: 3, ai: 4, enterprise: 4, startup: 6, outcome: 6, metrics: 5 },
    recruiter_priority: "Portfolio quality, bridging design and engineering, component systems experience",
    risk_factors: ["No code samples", "No design system work", "Portfolio-only without technical evidence"],
    ats_language: ["design system", "component library", "React", "Figma", "tokens", "accessibility", "UX engineering"],
  },
  "General PM": {
    preferred_evidence_types: ["work_experience", "shipped_product"],
    preferred_tone: "Balanced, user-focused, delivery-oriented",
    density_targets: { technical: 5, leadership: 5, ai: 3, enterprise: 5, startup: 5, outcome: 7, metrics: 6 },
    recruiter_priority: "Shipped products, user outcomes, cross-team collaboration",
    risk_factors: ["No shipped products", "Weak user outcome evidence"],
    ats_language: ["product manager", "roadmap", "shipped", "user research", "stakeholder", "OKR"],
  },
}

// ─── Classifier ───────────────────────────────────────────────────────────────

/**
 * Classify a job into a role archetype using its signal profile
 * and extracted text signals.
 */
export function classifyRoleArchetype(
  jobTitle: string | null | undefined,
  roleFamily: string | null | undefined,
  signalProfile: JobSignalProfile
): ArchetypeProfile {
  const title = (jobTitle || "").toLowerCase()
  const family = (roleFamily || "").toLowerCase()
  const topSignals = signalProfile.signals.slice(0, 5).map(s => s.label)

  // Title-first classification (highest confidence)
  if (title.includes("staff engineer") || title.includes("principal engineer")) {
    return buildArchetype("Staff Engineer", 0.92, signalProfile, "Job title explicitly indicates Staff/Principal Engineer level")
  }
  if (title.includes("ml engineer") || title.includes("machine learning engineer")) {
    return buildArchetype("ML Engineer", 0.92, signalProfile, "Job title explicitly indicates ML Engineering role")
  }
  if (title.includes("data engineer")) {
    return buildArchetype("Data Engineer", 0.92, signalProfile, "Job title explicitly indicates Data Engineering role")
  }
  if (title.includes("engineering manager") || title.includes("head of engineering")) {
    return buildArchetype("Engineering Manager", 0.90, signalProfile, "Job title indicates Engineering Management")
  }
  if (title.includes("software engineer") || title.includes("swe") || title.includes("full stack") || title.includes("backend engineer") || title.includes("frontend engineer")) {
    return buildArchetype("Senior Software Engineer", 0.88, signalProfile, "Job title indicates Software Engineering role")
  }
  if (title.includes("revenue operations") || title.includes("rev ops") || title.includes("revops")) {
    return buildArchetype("Revenue Operations Lead", 0.92, signalProfile, "Job title explicitly indicates Revenue Operations")
  }
  if (title.includes("automation") && (title.includes("architect") || title.includes("engineer") || title.includes("lead"))) {
    return buildArchetype("Automation Architect", 0.88, signalProfile, "Automation-focused title with architect/lead signal")
  }
  if (title.includes("platform pm") || title.includes("platform product")) {
    return buildArchetype("Platform PM", 0.88, signalProfile, "Job title explicitly indicates Platform PM")
  }
  if (title.includes("growth pm") || title.includes("growth product")) {
    return buildArchetype("Growth PM", 0.88, signalProfile, "Growth PM title detected")
  }
  if (title.includes("solutions consultant") || title.includes("solutions engineer") || title.includes("solutions architect")) {
    return buildArchetype("AI Solutions Consultant", 0.84, signalProfile, "Solutions-facing title with client/consulting focus")
  }
  if (title.includes("implementation") || title.includes("onboarding") || title.includes("customer success")) {
    return buildArchetype("Implementation Strategist", 0.82, signalProfile, "Implementation/onboarding-focused title")
  }
  if (title.includes("product operations") || title.includes("product ops")) {
    return buildArchetype("Product Operations Manager", 0.88, signalProfile, "Product Operations title detected")
  }
  if (title.includes("gtm") || title.includes("go-to-market")) {
    return buildArchetype("GTM Systems Lead", 0.85, signalProfile, "GTM explicitly in job title")
  }

  // Signal-combination classification
  const hasAI = topSignals.includes("AI/ML Systems")
  const hasTechnical = topSignals.includes("Technical Depth")
  const hasEnterprise = topSignals.includes("Enterprise/B2B")
  const hasStartup = topSignals.includes("Startup/Growth")
  const hasGTM = topSignals.includes("GTM & Revenue")
  const hasAutomation = topSignals.includes("Automation & Workflows")
  const hasPlatform = topSignals.includes("Systems Thinking")

  const isEngineeringFamily = family.includes("engineer") || family.includes("technical")
  const isPMFamily = family.includes("product") || family.includes("pm")

  // AI + Technical + PM signals
  if (hasAI && hasTechnical && isPMFamily) {
    if (hasStartup) return buildArchetype("Startup AI PM", 0.82, signalProfile, "AI + Technical + Startup signals with PM family")
    if (hasEnterprise) return buildArchetype("Enterprise TPM", 0.78, signalProfile, "AI + Technical + Enterprise signals")
    return buildArchetype("AI Product Manager", 0.80, signalProfile, "Strong AI and Technical signals with PM role family")
  }

  // Technical heavy + PM
  if (hasTechnical && isPMFamily && !hasAI) {
    if (hasEnterprise) return buildArchetype("Enterprise TPM", 0.78, signalProfile, "Technical + Enterprise PM signals")
    if (hasPlatform) return buildArchetype("Platform PM", 0.75, signalProfile, "Technical + Platform signals")
    return buildArchetype("Technical Product Manager", 0.75, signalProfile, "Strong technical signals with PM family")
  }

  // GTM signals
  if (hasGTM && isPMFamily) {
    return buildArchetype("GTM Systems Lead", 0.78, signalProfile, "GTM + PM signals")
  }

  // Automation signals
  if (hasAutomation && (hasAI || hasTechnical)) {
    return buildArchetype("Automation Architect", 0.76, signalProfile, "Automation + technical/AI signals")
  }

  // AI-only PM
  if (hasAI && isPMFamily) {
    return buildArchetype("AI Product Manager", 0.72, signalProfile, "AI signal dominant with PM family")
  }

  // Technical engineering family
  if (isEngineeringFamily && hasTechnical) {
    return buildArchetype("Senior Software Engineer", 0.72, signalProfile, "Technical engineering signals")
  }

  // Default PM
  if (isPMFamily) {
    return buildArchetype("General PM", 0.60, signalProfile, "PM family detected but signals are mixed")
  }

  // Fallback
  return buildArchetype("General PM", 0.40, signalProfile, "Unable to classify with confidence — using General PM as fallback")
}

function buildArchetype(
  archetype: Exclude<RoleArchetype, "Unknown">,
  confidence: number,
  signalProfile: JobSignalProfile,
  rationale: string
): ArchetypeProfile {
  const def = ARCHETYPE_DEFINITIONS[archetype]
  return {
    archetype,
    confidence,
    rationale,
    ...def,
  }
}
