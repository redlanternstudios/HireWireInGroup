/**
 * HireWire AI Prompts
 * Centralized system prompts for all AI workflows
 *
 * This allows prompts to be:
 * - Easily iterated and improved
 * - Tested in isolation
 * - Versioned and tracked
 */

export { COACH_SYSTEM_PROMPT, COACH_SYSTEM_PROMPT_SHORT } from "./coach"
export {
  JOB_ANALYSIS_PROMPT,
  buildJobAnalysisPrompt,
} from "./job-analysis"
export {
  DOCUMENT_GENERATION_PROMPTS,
  EVIDENCE_MAPPING_PROMPT,
  RESUME_GENERATION_PROMPT,
  COVER_LETTER_PROMPT,
  QUALITY_CHECK_PROMPT,
  buildEvidenceMappingPrompt,
  buildResumeGenerationPrompt,
  buildCoverLetterPrompt,
  buildQualityCheckPrompt,
} from "./document-generation"
