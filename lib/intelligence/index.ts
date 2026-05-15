/**
 * lib/intelligence/index.ts
 *
 * Public API for the HireWire Career Signal Orchestration Engine.
 *
 * Import from "@/lib/intelligence" to access all intelligence modules.
 *
 * Phase 2: Job Signal Weighting
 * Phase 3: Role Archetype Classification
 * Phase 4: Narrative Mode Selection
 * Phase 5: Recruiter Scan Report
 */

// Phase 2 — Job Signal Weighting
export {
  computeJobSignalProfile,
  SIGNAL_TAXONOMY,
} from "./job-signal-weights"
export type {
  JobSignal,
  JobSignalProfile,
} from "./job-signal-weights"

// Phase 3 — Role Archetype Engine
export {
  classifyRoleArchetype,
  ROLE_ARCHETYPES,
} from "./role-archetypes"
export type {
  RoleArchetype,
  ArchetypeProfile,
} from "./role-archetypes"

// Phase 4 — Narrative Mode
export {
  selectNarrativeMode,
  NARRATIVE_MODES,
} from "./narrative-mode"
export type {
  NarrativeMode,
  NarrativeModeProfile,
} from "./narrative-mode"

// Phase 5 — Recruiter Scan Report
export {
  generateRecruiterScanReport,
} from "./recruiter-scan"
export type {
  RecruiterScanReport,
  RecruiterFinding,
  RecruiterRiskFlag,
  RecruiterSentiment,
} from "./recruiter-scan"
