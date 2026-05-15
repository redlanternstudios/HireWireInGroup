/**
 * lib/intelligence/narrative-mode.ts
 *
 * Phase 4: Narrative Mode Tracking
 *
 * Purpose: Given a role archetype and signal profile, select the optimal
 * narrative mode for resume generation. This becomes a tracked field on
 * every resume version — so the system can learn which modes convert.
 *
 * Narrative modes shape:
 *  - Resume summary tone
 *  - Bullet ordering and selection
 *  - Skills section emphasis
 *  - Cover letter opening strategy
 */

import type { ArchetypeProfile } from "./role-archetypes"
import type { JobSignalProfile } from "./job-signal-weights"

// ─── Types ────────────────────────────────────────────────────────────────────

export const NARRATIVE_MODES = [
  "ats_optimized",
  "recruiter_optimized",
  "executive_optimized",
  "startup_optimized",
  "enterprise_optimized",
  "technical_optimized",
  "leadership_optimized",
  "hybrid_optimized",
] as const

export type NarrativeMode = typeof NARRATIVE_MODES[number]

export interface NarrativeModeProfile {
  mode: NarrativeMode
  confidence: number
  rationale: string
  /** Generation instructions derived from this mode */
  generation_guidance: {
    summary_tone: string
    bullet_priority: string
    skills_emphasis: string
    cover_letter_strategy: string
    /** Variables as 0–10 targets */
    density: {
      technical: number
      leadership: number
      ai: number
      outcome: number
      metrics: number
    }
    /** What to put FIRST in bullets */
    lead_with: "impact" | "action" | "context" | "metric"
    /** Ideal bullet length */
    bullet_length: "tight" | "medium" | "expanded"
    /** Include or suppress certain sections */
    section_emphasis: {
      professional_summary: "prominent" | "standard" | "minimal"
      skills_section: "prominent" | "standard" | "minimal"
      projects_section: "prominent" | "standard" | "minimal" | "suppress"
    }
  }
}

// ─── Mode Selector ────────────────────────────────────────────────────────────

/**
 * Select the optimal narrative mode for document generation.
 * Deterministic. No AI call needed — this is strategic logic.
 */
export function selectNarrativeMode(
  archetype: ArchetypeProfile,
  signalProfile: JobSignalProfile
): NarrativeModeProfile {
  const topSignals = signalProfile.signals.slice(0, 4).map(s => s.label)
  const { archetype: archetypeName, density_targets } = archetype

  // Hard archetype → mode mappings
  switch (archetypeName) {
    case "Staff Engineer":
    case "Engineering Manager":
    case "Enterprise TPM":
      return buildMode("leadership_optimized", 0.88, archetype, {
        rationale: "Leadership density must dominate for this archetype — org impact over individual contribution",
      })

    case "ML Engineer":
    case "Data Engineer":
    case "Senior Software Engineer":
    case "Platform PM":
      return buildMode("technical_optimized", 0.88, archetype, {
        rationale: "Technical depth is the primary signal — lead with system-level and code-level evidence",
      })

    case "AI Product Manager":
    case "Startup AI PM":
      if (topSignals.includes("Startup/Growth") && density_targets.startup >= 7) {
        return buildMode("startup_optimized", 0.84, archetype, {
          rationale: "Startup context with AI signals — velocity, ownership, and shipping velocity matter most",
        })
      }
      return buildMode("hybrid_optimized", 0.82, archetype, {
        rationale: "AI PM roles need both technical credibility and product strategy — hybrid balances both",
      })

    case "Enterprise TPM":
    case "Implementation Strategist":
    case "AI Solutions Consultant":
      return buildMode("enterprise_optimized", 0.86, archetype, {
        rationale: "Enterprise context requires reliability, process, and stakeholder management signals",
      })

    case "GTM Systems Lead":
    case "Revenue Operations Lead":
    case "Growth PM":
      return buildMode("recruiter_optimized", 0.84, archetype, {
        rationale: "Revenue-facing roles — recruiters scan for outcome numbers first, then strategy",
      })

    case "Automation Architect":
    case "Technical Product Manager":
      return buildMode("hybrid_optimized", 0.80, archetype, {
        rationale: "Combines technical depth with product delivery — neither purely technical nor purely strategic",
      })

    case "Product Operations Manager":
    case "General PM":
    case "Design Technologist":
    default: {
      // Signal-based fallback
      const hasStrongATS = signalProfile.signals.some(s => s.weight >= 7)
      if (!hasStrongATS) {
        return buildMode("ats_optimized", 0.72, archetype, {
          rationale: "Weak signal profile detected — prioritize ATS keyword coverage to survive initial parsing",
        })
      }
      return buildMode("recruiter_optimized", 0.70, archetype, {
        rationale: "Standard PM role — optimize for recruiter scan pattern (outcome first)",
      })
    }
  }
}

// ─── Mode Definitions ─────────────────────────────────────────────────────────

type ModeOverrides = {
  rationale: string
}

function buildMode(
  mode: NarrativeMode,
  confidence: number,
  archetype: ArchetypeProfile,
  overrides: ModeOverrides
): NarrativeModeProfile {
  const { density_targets } = archetype
  const density = {
    technical: density_targets.technical,
    leadership: density_targets.leadership,
    ai: density_targets.ai,
    outcome: density_targets.outcome,
    metrics: density_targets.metrics,
  }

  const modeConfigs: Record<NarrativeMode, NarrativeModeProfile["generation_guidance"]> = {
    ats_optimized: {
      summary_tone: "Keyword-dense but natural; open with your title, core skills, and years of experience",
      bullet_priority: "Match job keywords directly; use exact phrasing from the job description",
      skills_emphasis: "Lead with required skills that directly match the job; sort by JD priority",
      cover_letter_strategy: "Mirror the company's language; reference exact qualifications listed",
      density,
      lead_with: "action",
      bullet_length: "tight",
      section_emphasis: {
        professional_summary: "prominent",
        skills_section: "prominent",
        projects_section: "standard",
      },
    },
    recruiter_optimized: {
      summary_tone: "Start with what you've shipped and the impact — recruiter has 10 seconds",
      bullet_priority: "Lead with outcome metrics or scale, then describe the action",
      skills_emphasis: "Group by category; put most-matched category first",
      cover_letter_strategy: "Open with one impressive result, then explain the fit",
      density,
      lead_with: "impact",
      bullet_length: "medium",
      section_emphasis: {
        professional_summary: "prominent",
        skills_section: "standard",
        projects_section: "standard",
      },
    },
    executive_optimized: {
      summary_tone: "Strategic and directional; speak to vision and organization-level impact",
      bullet_priority: "Program/org outcomes first; tactical detail minimal",
      skills_emphasis: "Leadership and strategic capabilities; suppress junior-level tools",
      cover_letter_strategy: "Lead with strategic alignment; reference company mission",
      density,
      lead_with: "context",
      bullet_length: "expanded",
      section_emphasis: {
        professional_summary: "prominent",
        skills_section: "minimal",
        projects_section: "suppress",
      },
    },
    startup_optimized: {
      summary_tone: "Direct and specific — what you built, at what scale, moving fast",
      bullet_priority: "Ship velocity and ownership signals first; avoid corporate language",
      skills_emphasis: "Tools and capabilities that matter to a small team; avoid buzzwords",
      cover_letter_strategy: "Open with what you shipped; be direct about why this company",
      density,
      lead_with: "action",
      bullet_length: "tight",
      section_emphasis: {
        professional_summary: "standard",
        skills_section: "standard",
        projects_section: "prominent",
      },
    },
    enterprise_optimized: {
      summary_tone: "Reliable, process-aware, stakeholder-aligned; convey you've operated at scale",
      bullet_priority: "Org-wide impact, stakeholder management, delivery at scale",
      skills_emphasis: "Enterprise tools, compliance awareness, program management; process signals",
      cover_letter_strategy: "Reference governance, reliability, and cross-functional execution",
      density,
      lead_with: "context",
      bullet_length: "expanded",
      section_emphasis: {
        professional_summary: "prominent",
        skills_section: "standard",
        projects_section: "minimal",
      },
    },
    technical_optimized: {
      summary_tone: "Technically precise; name systems built, not just 'I worked on X'",
      bullet_priority: "Technical specifics first — stack, scale, architecture decision",
      skills_emphasis: "Group by technical category; lead with most relevant stack",
      cover_letter_strategy: "Demonstrate technical fluency; reference specific challenges you'd solve",
      density,
      lead_with: "action",
      bullet_length: "medium",
      section_emphasis: {
        professional_summary: "standard",
        skills_section: "prominent",
        projects_section: "prominent",
      },
    },
    leadership_optimized: {
      summary_tone: "People-first; speak to team growth, direction-setting, cross-org impact",
      bullet_priority: "Team outcomes and org-level influence; attribute wins to team where appropriate",
      skills_emphasis: "Leadership capabilities; suppress individual-contributor technical details",
      cover_letter_strategy: "Lead with how you develop teams and deliver through others",
      density,
      lead_with: "impact",
      bullet_length: "expanded",
      section_emphasis: {
        professional_summary: "prominent",
        skills_section: "minimal",
        projects_section: "suppress",
      },
    },
    hybrid_optimized: {
      summary_tone: "Balanced — technical credibility + strategic awareness; show you can go deep or wide",
      bullet_priority: "Alternate between technical achievement and business outcome",
      skills_emphasis: "Even mix of technical and strategic capabilities; ordered by JD signal weight",
      cover_letter_strategy: "Show range: open with a technical achievement, close with strategic alignment",
      density,
      lead_with: "action",
      bullet_length: "medium",
      section_emphasis: {
        professional_summary: "prominent",
        skills_section: "standard",
        projects_section: "standard",
      },
    },
  }

  return {
    mode,
    confidence,
    rationale: overrides.rationale,
    generation_guidance: modeConfigs[mode],
  }
}
