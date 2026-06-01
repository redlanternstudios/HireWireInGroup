/**
 * Core job analysis logic, decoupled from the HTTP layer.
 *
 * This module is the single execution path for analyzing a job URL.
 * It is called directly by both:
 *   - /app/api/analyze/route.ts (HTTP handler)
 *   - lib/actions/jobs.ts (server action)
 *
 * Authentication contract: the caller MUST pass a Supabase client that has
 * already been created in a server context AND a pre-verified user object
 * obtained via supabase.auth.getUser(). user_id is NEVER derived from
 * client-supplied input.
 */

import { generateStructuredText } from "@/lib/ai/gateway";
import { z } from "zod";
import { runJobFlow } from "@/lib/orchestrator/runJobFlow";
import { withCoachStepMeta } from "@/lib/coach-step";
import { buildEvidenceMapForJob, initializeEvidenceMapForJob } from "@/lib/evidence/buildEvidenceMapForJob";
import {
  buildEvidenceLibraryContext,
  buildJobContext,
  isContextEngineEnabled,
  mirrorGapMatches,
  mirrorJobContext,
  mirrorProfileContext,
  runContextGapMatch,
} from "@/lib/context-engine";
import {
  inferRoleFromJobTitle,
  getWeightsForRole,
} from "@/lib/scoring-weights";
import {
  normalizeEvidenceRecord,
  normalizeProfileExperience,
  calculateExplainableFit,
  type CanonicalEvidence,
  type ExplainableFitScore,
  type FitBand,
} from "@/lib/canonical-evidence"
import { detectGaps } from "@/lib/gap-detection";
import {
  CLAUDE_MODELS,
  getActiveAnalysisModelName,
  isAnthropicConfigured,
} from "@/lib/ai/gateway";
import { parseJobPage, detectSource } from "@/lib/parsers";
import { findJobByUrl } from "@/lib/queries/jobs";
import { linkJobToCompany } from "@/lib/company-utils";
import {
  checkForDuplicate,
  getDuplicateResponse,
} from "@/lib/duplicate-detection";
import type { createClient } from "@/lib/supabase/server";
import type { User } from "@supabase/supabase-js";

function toDbScore(value: number | null | undefined): number {
  return Math.round(Number.isFinite(value ?? NaN) ? value! : 0);
}
import type { Job } from "@/lib/types";

type ServerSupabase = Awaited<ReturnType<typeof createClient>>;

const ROLE_FAMILIES = [
  "AI Technical Product Manager",
  "Technical Product Manager",
  "AI Product Manager",
  "Product Manager",
  "Senior Product Manager",
  "Systems Product Manager",
  "Workflow Product Manager",
  "Analytics Product Manager",
  "Product Owner",
  "Program Manager",
  "Other",
] as const;

const JobAnalysisSchema = z.object({
  title: z
    .string()
    .nullable()
    .describe("Job title as stated, or null if not found"),
  company: z.string().nullable().describe("Company name, or null if not found"),
  location: z.string().nullable().describe("Job location or Remote"),
  employment_type: z
    .string()
    .nullable()
    .describe("Full-time, Part-time, Contract, etc."),
  salary_text: z.string().nullable().describe("Salary range if mentioned"),
  description_summary: z
    .string()
    .nullable()
    .describe(
      "Brief 2-3 sentence summary of the role, or null if content not available",
    ),
  responsibilities: z
    .array(z.string())
    .describe("List of key responsibilities"),
  qualifications_required: z
    .array(z.string())
    .describe("Required qualifications"),
  qualifications_preferred: z
    .array(z.string())
    .describe("Preferred/nice-to-have qualifications"),
  keywords: z.array(z.string()).describe("Important keywords for ATS matching"),
  ats_phrases: z
    .array(z.string())
    .describe("Exact phrases to include in resume for ATS"),
  tech_stack: z
    .array(z.string())
    .describe("Technologies, tools, and frameworks mentioned"),
  role_family: z
    .enum(ROLE_FAMILIES)
    .describe("Best matching role family for categorization"),
  soc_major_group: z.number().int().min(11).max(55).nullable().describe("BLS SOC 2-digit major group code. 11=Management 13=Business/Financial 15=Computer/Mathematical 17=Architecture/Engineering 19=Life/Physical/Social_Science 21=Community/Social_Services 23=Legal 25=Education/Library 27=Arts/Design/Entertainment 29=Healthcare_Practitioners 31=Healthcare_Support 33=Protective_Service 35=Food_Preparation 37=Building/Grounds 39=Personal_Care 41=Sales 43=Office/Administrative 45=Farming/Fishing/Forestry 47=Construction/Extraction 49=Installation/Maintenance/Repair 51=Production 53=Transportation/Material_Moving 55=Military"),
  soc_group_name: z.string().nullable().describe("BLS SOC major group name e.g. Computer and Mathematical Occupations"),
  soc_category: z.enum(["Management","Business_Financial","Computer_Mathematical","Architecture_Engineering","Life_Physical_Social_Science","Community_Social_Services","Legal","Education_Library","Arts_Design_Entertainment_Sports_Media","Healthcare_Practitioners","Healthcare_Support","Protective_Service","Food_Preparation_Serving","Building_Grounds","Personal_Care_Service","Sales","Office_Administrative","Farming_Fishing_Forestry","Construction_Extraction","Installation_Maintenance_Repair","Production","Transportation_Material_Moving","Military"]).nullable().describe("BLS SOC category enum for scoring profile selection"),
  industry_guess: z
    .string()
    .nullable()
    .describe("Primary industry or null if unknown"),
  seniority_level: z
    .string()
    .nullable()
    .describe(
      "Seniority level: Entry, Mid, Senior, Lead, Principal, Director, VP, or C-Level",
    ),
  fit_signals: z.object({
    has_ai_focus: z.boolean(),
    has_technical_requirements: z.boolean(),
    has_workflow_focus: z.boolean(),
    has_startup_culture: z.boolean(),
    has_pure_engineering: z.boolean(),
    has_people_management: z.boolean(),
    product_ownership_level: z.enum(["low", "medium", "high"]),
  }),
});

const JOB_ANALYSIS_SCHEMA_DESCRIPTION = `{
  "title": string | null,
  "company": string | null,
  "location": string | null,
  "employment_type": string | null,
  "salary_text": string | null,
  "description_summary": string | null,
  "responsibilities": string[],
  "qualifications_required": string[],
  "qualifications_preferred": string[],
  "keywords": string[],
  "ats_phrases": string[],
  "tech_stack": string[],
  "role_family": "AI Technical Product Manager" | "Technical Product Manager" | "AI Product Manager" | "Product Manager" | "Senior Product Manager" | "Systems Product Manager" | "Workflow Product Manager" | "Analytics Product Manager" | "Product Owner" | "Program Manager" | "Other",
  "industry_guess": string | null,
  "seniority_level": string | null,
  "fit_signals": {
    "has_ai_focus": boolean,
    "has_technical_requirements": boolean,
    "has_workflow_focus": boolean,
    "has_startup_culture": boolean,
    "has_pure_engineering": boolean,
    "has_people_management": boolean,
    "product_ownership_level": "low" | "medium" | "high"
  }
}`;

export interface AnalyzeCoreResult {
  success: true;
  job_id: string;
  duplicate: boolean;
  duplicate_type?: string;
  message?: string;
  limited_content?: boolean;
  limited_content_message?: string | null;
  analysis: {
    title: string;
    company: string;
    location: string | null;
    employment_type: string | null;
    salary_text: string | null;
    responsibilities: string[];
    qualifications_required: string[];
    qualifications_preferred: string[];
    keywords: string[];
    ats_phrases: string[];
    tech_stack: string[];
    seniority_level: string;
    role_family: string;
    industry_guess: string;
    fit_signals?: z.infer<typeof JobAnalysisSchema>["fit_signals"];
  };
  job: Job;
  generation?: {
    attempted: boolean;
    success: boolean;
    error?: string | null;
    strategy?: string;
    quality_passed?: boolean;
  };
  flow?: {
    success: boolean;
    steps: unknown[];
  };
}

export type AnalyzeCoreError = {
  success: false;
  error: string;
  retryAfter?: number;
};

export type AnalyzeCoreOutput = AnalyzeCoreResult | AnalyzeCoreError;

async function fetchJobPage(url: string): Promise<string> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
      signal: controller.signal,
    });
    if (!response.ok)
      throw new Error(`Failed to fetch job page: ${response.status}`);
    const html = await response.text();
    const parsed = parseJobPage(html, url);
    return parsed.text;
  } finally {
    clearTimeout(timeoutId);
  }
}

function normalizeSeniority(level: string | null): string {
  if (!level) return "Mid";
  const lower = level.toLowerCase();
  if (
    lower.includes("entry") ||
    lower.includes("junior") ||
    lower.includes("associate")
  )
    return "Entry";
  if (
    lower.includes("senior") ||
    lower.includes("sr.") ||
    lower.includes("sr ")
  )
    return "Senior";
  if (
    lower.includes("lead") ||
    lower.includes("principal") ||
    lower.includes("staff")
  )
    return "Lead";
  if (lower.includes("director")) return "Director";
  if (lower.includes("vp") || lower.includes("vice president")) return "VP";
  if (
    lower.includes("c-level") ||
    lower.includes("chief") ||
    lower.includes("cto") ||
    lower.includes("cpo")
  )
    return "C-Level";
  return "Mid";
}

function collectNumberedSection(content: string, heading: string): string[] {
  const lines = content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  const start = lines.findIndex(
    (line) => line.toLowerCase().replace(/:$/, "") === heading.toLowerCase(),
  );
  if (start === -1) {
    const nextHeadings = [
      "Responsibilities",
      "Required Qualifications",
      "Preferred Qualifications",
    ]
      .filter((candidate) => candidate.toLowerCase() !== heading.toLowerCase())
      .join("|");
    const flatMatch = content.match(
      new RegExp(
        `${heading}:?\\s+([\\s\\S]*?)(?=\\s+(?:${nextHeadings}):?|$)`,
        "i",
      ),
    );
    const flatSection = flatMatch?.[1]?.trim();
    if (!flatSection) return [];
    return flatSection
      .split(/(?:^|\s)\d+\.\s+|(?<=\.)\s+(?=[A-Z][a-z]+ )/)
      .map((item) => item.trim())
      .filter((item) => item.length > 12)
      .slice(0, 10);
  }

  const items: string[] = [];
  for (const line of lines.slice(start + 1)) {
    if (
      /^[A-Z][A-Za-z\s]+:$/.test(line) ||
      /^(Required|Preferred) Qualifications:?$/i.test(line)
    )
      break;
    const cleaned = line.replace(/^\d+\.\s*/, "").trim();
    if (cleaned) items.push(cleaned);
  }
  return items;
}

function extractLabeledValue(content: string, label: string): string | null {
  const labels = [
    "Title",
    "Company",
    "Location",
    "Salary",
    "Job Description",
    "Responsibilities",
    "Required Qualifications",
    "Preferred Qualifications",
  ]
    .filter((candidate) => candidate.toLowerCase() !== label.toLowerCase())
    .join("|");
  const match = content.match(
    new RegExp(`${label}:\\s*([\\s\\S]+?)(?=\\s+(?:${labels}):?\\s|$)`, "i"),
  );
  return match?.[1]?.trim() || null;
}

function fallbackAnalyzeJob(
  content: string,
): z.infer<typeof JobAnalysisSchema> {
  const responsibilities = collectNumberedSection(content, "Responsibilities");
  const required = collectNumberedSection(content, "Required Qualifications");
  const preferred = collectNumberedSection(content, "Preferred Qualifications");
  const keywordCandidates = [
    "AI product management",
    "LLMs",
    "APIs",
    "cloud platforms",
    "product requirements",
    "Agile",
    "KPIs",
    "stakeholder management",
    "safe AI",
    "evaluation loops",
    "Salesforce",
    "SAP",
    "SQL",
    "GTM alignment",
  ];
  const lowerContent = content.toLowerCase();

  return {
    title: extractLabeledValue(content, "Title") || "Unknown Position",
    company: extractLabeledValue(content, "Company") || "Unknown Company",
    location: extractLabeledValue(content, "Location") || null,
    employment_type: "Full-time",
    salary_text: extractLabeledValue(content, "Salary") || null,
    description_summary:
      "AI Product Manager role focused on AI-powered workflow products, enterprise customers, product requirements, KPIs, safe AI experiences, and cross-functional delivery.",
    responsibilities,
    qualifications_required: required,
    qualifications_preferred: preferred,
    keywords: keywordCandidates.filter((keyword) =>
      lowerContent.includes(keyword.toLowerCase().replace("llms", "llm")),
    ),
    ats_phrases: keywordCandidates.filter((keyword) =>
      lowerContent.includes(keyword.toLowerCase().replace("llms", "llm")),
    ),
    tech_stack: [
      "LLMs",
      "APIs",
      "cloud platforms",
      "Salesforce",
      "SAP",
      "SQL",
    ].filter((tech) =>
      lowerContent.includes(tech.toLowerCase().replace("llms", "llm")),
    ),
    role_family: "AI Product Manager",
    soc_major_group: null,
    soc_group_name: null,
    soc_category: null,
    industry_guess: "Enterprise AI workflow software",
    seniority_level: "Mid",
    fit_signals: {
      has_ai_focus: true,
      has_technical_requirements: true,
      has_workflow_focus: true,
      has_startup_culture: lowerContent.includes("startup"),
      has_pure_engineering: false,
      has_people_management: false,
      product_ownership_level: "high",
    },
  };
}

/**
 * Executes the full job analysis pipeline in the current server context.
 *
 * @param job_url   - The validated job posting URL to analyze
 * @param supabase  - Server-side Supabase client (from createClient() in server.ts)
 * @param user      - Verified user from supabase.auth.getUser() — caller's responsibility
 */
export async function analyzeJobCore(
  job_url: string | null,
  supabase: ServerSupabase,
  user: User,
  job_description?: string | null,
): Promise<AnalyzeCoreOutput> {
  const source = job_url ? detectSource(job_url) : "OTHER";
  let pageContent = job_description?.trim() || "";
  const jobUrlForStorage =
    job_url ?? `manual://hirewire/${crypto.randomUUID()}`;

  // Check for existing job with this URL
  const { data: existingJob } = job_url
    ? ((await findJobByUrl(supabase, user.id, job_url)) as {
        data: Job | null;
        error: unknown;
      })
    : { data: null };

  if (existingJob) {
    return {
      success: true,
      job_id: existingJob.id,
      duplicate: true,
      message: `This job is already in your pipeline: ${existingJob.title} at ${existingJob.company}`,
      job: existingJob,
      analysis: {
        title: existingJob.title || "Unknown Title",
        company: existingJob.company || "Unknown Company",
        location: existingJob.location ?? null,
        employment_type: existingJob.employment_type ?? null,
        salary_text: existingJob.salary_range ?? null,
        responsibilities: existingJob.responsibilities || [],
        qualifications_required: existingJob.qualifications_required || [],
        qualifications_preferred: existingJob.qualifications_preferred || [],
        keywords:
          existingJob.ats_keywords || existingJob.keywords_extracted || [],
        ats_phrases: [],
        tech_stack: [],
        seniority_level: existingJob.seniority_level || "Unknown",
        role_family: existingJob.role_family || "Product Manager",
        industry_guess: existingJob.industry_guess || "Unknown",
      },
    };
  }

  if (!pageContent) {
    if (!job_url) {
      return {
        success: false,
        error: "No job_url or job_description provided",
      };
    }

    try {
      pageContent = await fetchJobPage(job_url);
    } catch (fetchError) {
      return {
        success: false,
        error: `Failed to fetch job page: ${fetchError instanceof Error ? fetchError.message : "Unknown error"}`,
      };
    }
  }

  const isLimitedContent = pageContent.length < 100;
  if (isLimitedContent) {
    pageContent = `[LIMITED CONTENT WARNING]
This job page returned minimal content, likely due to JavaScript rendering requirements.
URL: ${job_url ?? "manual-entry"}
Source: ${source}

Available content:
${pageContent}

Instructions: Extract whatever information is available. For any fields that cannot be determined from this limited content, use null or empty arrays as appropriate.`;
  }

  let analysis: z.infer<typeof JobAnalysisSchema>;

  if (isAnthropicConfigured()) {
    // Analyze with Claude
    analysis = await generateStructuredText({
      model: CLAUDE_MODELS.SONNET,
      schema: JobAnalysisSchema,
      schemaDescription: JOB_ANALYSIS_SCHEMA_DESCRIPTION,
      prompt: `Analyze this job posting and extract structured information.

Be precise and extract only what is explicitly stated. Do not invent or assume information.

Role family options for categorization:
- AI Technical Product Manager (AI products + technical depth)
- Technical Product Manager (technical products, systems, APIs)
- AI Product Manager (AI products, less technical)
- Product Manager (general product roles)
- Senior Product Manager (senior IC roles)
- Systems Product Manager (infrastructure, platform)
- Workflow Product Manager (automation, process)
- Analytics Product Manager (data, analytics products)
- Product Owner (scrum-focused)
- Program Manager (coordination, delivery)
- Other (doesn't fit above)

Job posting content:
${pageContent}

Extract the job details following the schema.`,
    });
  } else {
    analysis = fallbackAnalyzeJob(pageContent);
  }

  const validatedAnalysis = {
    ...analysis,
    title: analysis.title || "Unknown Position",
    company: analysis.company || "Unknown Company",
    description_summary:
      analysis.description_summary || "No description available",
  };

  const normalizedSeniority = normalizeSeniority(
    validatedAnalysis.seniority_level,
  );

  // Duplicate check by company + role name
  const duplicateCheck = await checkForDuplicate(
    supabase,
    user.id,
    validatedAnalysis.company,
    validatedAnalysis.title,
    job_url ?? undefined,
  );

  if (duplicateCheck.isDuplicate && duplicateCheck.existingJob) {
    const response = getDuplicateResponse(duplicateCheck);
    if (
      response.shouldBlock ||
      duplicateCheck.duplicateType === "exact_match"
    ) {
      return {
        success: true,
        job_id: duplicateCheck.existingJobId!,
        duplicate: true,
        duplicate_type: duplicateCheck.duplicateType,
        message: response.message,
        job: {
          id: duplicateCheck.existingJob.id,
          title: duplicateCheck.existingJob.title,
          company: duplicateCheck.existingJob.company,
          created_at: duplicateCheck.existingJob.created_at,
          status: duplicateCheck.existingJob.status,
          source_url: duplicateCheck.existingJob.source_url,
        } as unknown as Job,
        analysis: {
          title: validatedAnalysis.title,
          company: validatedAnalysis.company,
          location: validatedAnalysis.location,
          employment_type: validatedAnalysis.employment_type,
          salary_text: validatedAnalysis.salary_text,
          responsibilities: validatedAnalysis.responsibilities,
          qualifications_required: validatedAnalysis.qualifications_required,
          qualifications_preferred: validatedAnalysis.qualifications_preferred,
          keywords: validatedAnalysis.keywords,
          ats_phrases: validatedAnalysis.ats_phrases,
          tech_stack: validatedAnalysis.tech_stack,
          seniority_level: normalizedSeniority,
          role_family: validatedAnalysis.role_family,
          industry_guess: validatedAnalysis.industry_guess || "Unknown",
        },
      };
    }
  }

  // Fetch evidence and profile for evidence-based matching
  const [evidenceResult, profileResult] = await Promise.all([
    supabase
      .from("evidence_library")
      .select("*")
      .eq("user_id", user.id)
      .eq("is_active", true),
    supabase
      .from("user_profile")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle(),
  ]);

  const canonicalEvidence: CanonicalEvidence[] = [];
  if (evidenceResult.data) {
    for (const record of evidenceResult.data) {
      canonicalEvidence.push(normalizeEvidenceRecord(record));
    }
  }
  if (profileResult.data?.experience) {
    const experiences = Array.isArray(profileResult.data.experience)
      ? profileResult.data.experience
      : [];
    for (const exp of experiences) {
      canonicalEvidence.push(...normalizeProfileExperience(exp, user.id));
    }
  }

  const techStackMatch = validatedAnalysis.tech_stack.filter((tech) =>
    canonicalEvidence.some(
      (e) =>
        e.skills.some((s) => s.toLowerCase().includes(tech.toLowerCase())) ||
        e.text.toLowerCase().includes(tech.toLowerCase()),
    ),
  );
  const keywordMatches = validatedAnalysis.keywords.filter((kw) =>
    canonicalEvidence.some((e) =>
      e.text.toLowerCase().includes(kw.toLowerCase()),
    ),
  );

  const dimensionScores = {
    experience:
      canonicalEvidence.filter((e) => e.evidence_type === "work_experience")
        .length > 0
        ? 70
        : 40,
    evidence: Math.min(
      100,
      (canonicalEvidence.filter((e) => e.confidence === "high").length /
        Math.max(canonicalEvidence.length, 1)) *
        100,
    ),
    skills:
      techStackMatch.length > 0
        ? Math.min(
            100,
            (techStackMatch.length /
              Math.max(validatedAnalysis.tech_stack.length, 1)) *
              100,
          )
        : 40,
    seniority:
      normalizedSeniority === "Senior" || normalizedSeniority === "Lead"
        ? 70
        : 50,
    ats:
      keywordMatches.length > 0
        ? Math.min(
            100,
            (keywordMatches.length /
              Math.max(validatedAnalysis.keywords.length, 1)) *
              100,
          )
        : 40,
  };

  const inferredRole = inferRoleFromJobTitle(validatedAnalysis.title);
  const weights = getWeightsForRole(inferredRole, validatedAnalysis.soc_category ?? undefined);

  const explainableFit: ExplainableFitScore = calculateExplainableFit(
    canonicalEvidence,
    validatedAnalysis.qualifications_required,
    validatedAnalysis.qualifications_preferred,
    dimensionScores,
    weights,
  );

  const fitBandToLegacy: Record<FitBand, "HIGH" | "MEDIUM" | "LOW"> = {
    strong_match: "HIGH",
    moderate_match: "MEDIUM",
    stretch_but_viable: "MEDIUM",
    low_match: "LOW",
  };

  const fitResult = {
    fit: fitBandToLegacy[explainableFit.band],
    score: explainableFit.score,
    reasoning: [
      ...explainableFit.strengths
        .slice(0, 3)
        .map((s) => `Strong: ${s.requirement.slice(0, 50)}`),
      ...explainableFit.gaps
        .filter((g) => g.severity === "critical")
        .slice(0, 2)
        .map((g) => `Gap: ${g.requirement.slice(0, 50)}`),
    ],
  };

  const gapAnalysis = detectGaps(
    {
      qualifications_required: validatedAnalysis.qualifications_required,
      qualifications_preferred: validatedAnalysis.qualifications_preferred,
      tech_stack: validatedAnalysis.tech_stack,
      keywords: validatedAnalysis.keywords,
      responsibilities: validatedAnalysis.responsibilities,
      seniority_level: normalizedSeniority,
      industry_guess: validatedAnalysis.industry_guess || undefined,
    },
    evidenceResult.data || [],
    profileResult.data,
    fitResult.reasoning.filter((r: string) => /^Gap:/i.test(r))
      .map((r: string) => r.replace(/^Gap:\s*/i, "")),
  )

  // Insert job record
  const { data: job, error: insertError } = await supabase
    .from("jobs")
    .insert({
      user_id: user.id,
      role_title: validatedAnalysis.title,
      company_name: validatedAnalysis.company,
      source: source,
      job_url: jobUrlForStorage,
      job_description: pageContent.slice(0, 10000),
      status: "analyzed",
    })
    .select()
    .single();

  if (insertError) {
    console.error("Job insert error:", insertError);
    return { success: false, error: "Failed to save job" };
  }

  // Link to company (non-fatal)
  const companyResult = await linkJobToCompany(
    supabase,
    user.id,
    job.id,
    validatedAnalysis.company,
    {
      industry: validatedAnalysis.industry_guess || undefined,
    },
  );
  if ("error" in companyResult) {
    console.error("Company link error:", companyResult.error);
  }

  // Insert analysis record
  const { error: analysisError } = await supabase.from("job_analyses").insert({
    user_id: user.id,
    job_id: job.id,
    title: validatedAnalysis.title,
    company: validatedAnalysis.company,
    location: validatedAnalysis.location,
    employment_type: validatedAnalysis.employment_type,
    salary_text: validatedAnalysis.salary_text,
    description_raw: pageContent.slice(0, 10000),
    responsibilities: validatedAnalysis.responsibilities,
    qualifications_required: validatedAnalysis.qualifications_required,
    qualifications_preferred: validatedAnalysis.qualifications_preferred,
    keywords: validatedAnalysis.keywords,
    ats_phrases: validatedAnalysis.keywords,
    matched_skills: fitResult.reasoning.filter(
      (r: string) => !/^Gap:/i.test(r),
    ),
    known_gaps: fitResult.reasoning.filter((r: string) => /^Gap:/i.test(r)),
    strengths_json: explainableFit.strengths,
    gaps_json: gapAnalysis.gaps,
    soc_major_group: validatedAnalysis.soc_major_group ?? null,
    soc_group_name: validatedAnalysis.soc_group_name ?? null,
    soc_category: validatedAnalysis.soc_category ?? null,
    analysis_version: "3.0-explainable",
    analysis_model: getActiveAnalysisModelName(),
  });
  if (analysisError) console.error("Analysis insert error:", analysisError);

  // Insert scores record
  const confidenceMap: Record<string, number> = {
    HIGH: 0.9,
    MEDIUM: 0.7,
    LOW: 0.5,
  };
  const confidenceScore = confidenceMap[explainableFit.confidence] || 0.7;
  const { error: scoresError } = await supabase.from("job_scores").insert({
    job_id: job.id,
    overall_score: toDbScore(fitResult.score),
    confidence_score: confidenceScore,
    skills_match: toDbScore(dimensionScores.skills),
    experience_relevance: toDbScore(dimensionScores.experience),
    evidence_quality: toDbScore(dimensionScores.evidence),
    seniority_alignment: toDbScore(dimensionScores.seniority),
    ats_keywords: toDbScore(dimensionScores.ats),
    scoring_version: "3.0-explainable",
  });
  if (scoresError) console.error("Scores insert error:", scoresError);

  // Backfill the jobs row with extracted requirements so hasJobAnalysis() returns true
  // and the workflow stepper advances correctly without needing a separate join.
  // NOTE: jobs table uses role_title/company_name — NOT title/company.
  const gaps = fitResult.reasoning.filter((r: string) => /^Gap:/i.test(r));
  const strengths = fitResult.reasoning.filter(
    (r: string) => !/^Gap:/i.test(r),
  );
  const { error: backfillError } = await supabase
    .from("jobs")
    .update({
      role_title: validatedAnalysis.title,
      company_name: validatedAnalysis.company,
      score: toDbScore(fitResult.score),
      fit: fitResult.fit,
      // Ensure fit and score are always written
      score_gaps: gaps,
      score_strengths: strengths,
      evidence_map: withCoachStepMeta({}, gaps.length > 0 || fitResult.score < 70 ? "required" : "completed", {
        reason: "job_analyzed",
      }),
      seniority_level: normalizedSeniority,
      role_family: validatedAnalysis.role_family,
      industry_guess: validatedAnalysis.industry_guess,
    })
    .eq("id", job.id)
    .eq("user_id", user.id);
  if (backfillError) console.error("Jobs backfill error:", backfillError);
  if (!backfillError) {
    await initializeEvidenceMapForJob({
      supabase,
      userId: user.id,
      jobId: job.id,
    });

    try {
      await buildEvidenceMapForJob({
        supabase,
        userId: user.id,
        jobId: job.id,
      });
    } catch (evidenceMapError) {
      console.error("Evidence map build error:", evidenceMapError);
      await supabase
        .from("jobs")
        .update({
          evidence_map: withCoachStepMeta(
            {
              matching_complete: false,
              map_build_error: {
                code: "evidence_map_build_failed",
                message:
                  evidenceMapError instanceof Error
                    ? evidenceMapError.message
                    : "Unknown evidence map build error",
                failed_at: new Date().toISOString(),
              },
            },
            "required",
            {
              reason: "evidence_map_build_failed",
            },
          ),
        })
        .eq("id", job.id)
        .eq("user_id", user.id);
    }
  }

  if (isContextEngineEnabled()) {
    const jobContext = buildJobContext({
      jobId: job.id,
      jobText: pageContent,
      title: validatedAnalysis.title,
      company: validatedAnalysis.company,
      requirements: validatedAnalysis.qualifications_required,
      responsibilities: validatedAnalysis.responsibilities,
      keywords: validatedAnalysis.keywords,
    });
    const profileContext = buildEvidenceLibraryContext({
      userId: user.id,
      records: (evidenceResult.data ?? []) as Array<Record<string, any>>,
    });
    const gapContext = runContextGapMatch({
      userId: user.id,
      jobId: job.id,
      profile: profileContext,
      requirements: jobContext.requirements,
    });
    void mirrorProfileContext({ supabase, userId: user.id, context: profileContext });
    void mirrorJobContext({ supabase, jobId: job.id, jobContext });
    void mirrorGapMatches({
      supabase,
      userId: user.id,
      jobId: job.id,
      matches: gapContext.gapReport.matches,
    });
  }

  // Run orchestration flow
  const orchestration = await runJobFlow({
    supabase,
    userId: user.id,
    jobId: job.id,
  });

  // Fetch updated job with generated materials
  const { data: updatedJob } = await supabase
    .from("jobs")
    .select("*")
    .eq("id", job.id)
    .eq("user_id", user.id)
    .is("deleted_at", null)
    .single();

  return {
    success: true,
    job_id: job.id,
    duplicate: false,
    limited_content: isLimitedContent,
    limited_content_message: isLimitedContent
      ? "This job page returned limited content. Some details may need to be added manually."
      : null,
    analysis: {
      title: validatedAnalysis.title,
      company: validatedAnalysis.company,
      location: validatedAnalysis.location,
      employment_type: validatedAnalysis.employment_type,
      salary_text: validatedAnalysis.salary_text,
      responsibilities: validatedAnalysis.responsibilities,
      qualifications_required: validatedAnalysis.qualifications_required,
      qualifications_preferred: validatedAnalysis.qualifications_preferred,
      keywords: validatedAnalysis.keywords,
      ats_phrases: validatedAnalysis.ats_phrases,
      tech_stack: validatedAnalysis.tech_stack,
      seniority_level: normalizedSeniority,
      role_family: validatedAnalysis.role_family,
      industry_guess: validatedAnalysis.industry_guess || "Unknown",
      fit_signals: validatedAnalysis.fit_signals,
    },
    job: (updatedJob || job) as Job,
    generation: {
      attempted: orchestration.generation?.attempted || false,
      success: orchestration.generation?.success || false,
      error: orchestration.generation?.error || null,
      strategy: orchestration.generation?.strategy,
      quality_passed: orchestration.generation?.quality_passed,
    },
    flow: {
      success: orchestration.success,
      steps: orchestration.steps,
    },
  };
}
