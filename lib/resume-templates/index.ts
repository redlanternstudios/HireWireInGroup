// Deprecated: decorative resume template pack.
// Do not use for readiness-gated HireWire exports.
// Use lib/resume-formats instead.

// Components
export { ResumeBase } from "./components/ResumeBase";
export { ResumeRenderer } from "./components/ResumeRenderer";

// Types
export type {
  ResumeProps,
  ResumeContact,
  ResumeExperienceItem,
  ResumeEducationItem,
  ResumeCertification,
  ResumeSkillGroup,
  ResumeProject,
  ResumePublication,
  ScoringMetadata,
  TemplateId,
} from "./types/ResumeProps";

// Config utilities
export {
  TEMPLATE_CONFIGS,
  ALL_TEMPLATE_IDS,
  getTemplateConfig,
  getTemplatesByIndustry,
} from "./config/resumeTemplates.config";

export type {
  TemplateConfig,
  LayoutVariant,
  SectionKey,
} from "./config/resumeTemplates.config";
