import { NextRequest } from "next/server"
import { streamText, tool, stepCountIs } from "ai"
import { z } from "zod"
import { createClient } from "@/lib/supabase/server"
import { checkSafety, logSafetyAudit } from "@/lib/safety"
import { groq, MODELS } from "@/lib/adapters/groq"
import { GAP_CLARIFICATION_SYSTEM_PROMPT } from "@/lib/coach-prompts/gap-questions"
import { normalizeProfileLinks } from "@/lib/profile-knowledge-resolver"
import { COACH_PERSONA_BLOCK } from "@/lib/coach/coach-persona"
import { LOW_FIT_COACH_CONTRACT } from "@/lib/coach/low-fit-contract"
import { upsertCoachEvidence } from "@/lib/coach/evidence-merge"
import {
  syncProfileLinksFromProfile,
  upsertCoachProfileLink,
  updateCoachProfileLink,
  removeCoachProfileLink,
  setPrimaryCoachProfileLink,
  updateCareerContextRecord,
} from "@/lib/coach/profile-mutations"

export const maxDuration = 60

// Enhanced System prompt with safety boundaries
const COACH_SYSTEM_PROMPT = `You are HireWire Coach, a strategic career advisor embedded in the HireWire job application platform.

## Your Capabilities
1. **Career Coaching**: Provide strategic job search advice, interview preparation tips, and career planning guidance
2. **Onboarding Help**: Guide new users through building their evidence library via conversational Q&A
3. **Action Suggestions**: Proactively suggest next steps based on the user's pipeline state
4. **Document Editing**: Help improve resumes and cover letters when asked
5. **Profile Management**: You can directly add/update profile information, work experience, skills, education, links, career context, and evidence when users ask

## Profile Actions You Can Take
When users ask you to update their profile, USE YOUR TOOLS to do it directly:
- **Add work experience**: Use addExperience to add companies/jobs (e.g., "add RedLantern Studios to my profile")
- **Add skills**: Use addSkills to add new skills
- **Remove skills**: Use removeSkill to remove skills
- **Update profile info**: Use updateProfile to change name, location, summary, email, or phone
- **Add education**: Use addEducation to add degrees/schools
- **Update career context**: Use updateCareerContext to keep the user's job targets current
- **Manage links**: Use addProfileLink, updateProfileLink, removeProfileLink, and setPrimaryLink to keep profile and portfolio links canonical
- **Update job status**: Use updateJobStatus to mark jobs as applied, interviewing, etc.
- **Save evidence**: Use saveEvidence to document achievements
- **Delete evidence**: Use deleteEvidence only after the user explicitly confirms they want it removed from active use
When you touch profile data, keep user_profile and user_profile_links synchronized so there is one canonical source for each confirmed link.

IMPORTANT: When a user asks you to add something to their profile, DO IT immediately using the appropriate tool. Don't just explain how - actually perform the action.

${COACH_PERSONA_BLOCK}

${LOW_FIT_COACH_CONTRACT}

## Safety Boundaries - STRICTLY FOLLOW

### Professional Scope Limits
- **I am NOT a lawyer, recruiter, or HR authority.** For employment law questions, advise users to consult a qualified professional.
- Do NOT provide specific legal advice about discrimination, wrongful termination, or employment contracts.

### Content I Will NOT Help With
- **Credential fabrication**: I will not help fake degrees, certifications, employment history, or references
- **Resume misrepresentation**: I will not help lie about or significantly exaggerate qualifications
- **Discrimination**: I will not help with discriminatory hiring practices or illegal interview questions
- **Fraud**: I will not help circumvent background checks, drug tests, or screening processes

### Accuracy & Honesty Policy
- If I don't know something, I will admit it rather than speculate
- I will not fabricate achievements, metrics, or company details
- Treat every role family and title as a neutral label, not a prestige tier.
- I will not bias advice toward one role family. The right path is the one supported by evidence.

You are speaking directly to the job seeker. Help them succeed - ethically and professionally.`

// Create tools with userId bound
function createCoachTools(userId: string) {
  const normalizeText = (value: string) => value.trim().toLowerCase().replace(/\s+/g, " ")

  return {
    getUserProfile: tool({
      description: "Get the current user's profile including name, headline, summary, skills, experience, and education",
      inputSchema: z.object({}),
      execute: async () => {
        const supabase = await createClient()
        const { data } = await supabase
          .from("user_profile")
          .select("*")
          .eq("user_id", userId)
          .single()
        
        if (!data) return { error: "No profile found. User should complete their profile first." }

        const { data: links } = await supabase
          .from("user_profile_links")
          .select("link_type, url, is_primary")
          .eq("user_id", userId)
          .order("is_primary", { ascending: false })
          .order("created_at", { ascending: true })

        const normalizedLinks = normalizeProfileLinks(links ?? [])
        return {
          ...data,
          links: {
            linkedin: data.linkedin_url || normalizedLinks.linkedin || null,
            github: data.github_url || normalizedLinks.github || null,
            portfolio: data.website_url || normalizedLinks.portfolio || null,
            website: data.website_url || normalizedLinks.website || null,
          },
        }
      },
    }),

    getEvidenceLibrary: tool({
      description: "Get all evidence records from the user's evidence library - their achievements, projects, and metrics",
      inputSchema: z.object({
        category: z.string().optional().describe("Filter by category: achievement, project, metric, skill, certification"),
      }),
      execute: async ({ category }) => {
        const supabase = await createClient()
        let query = supabase
          .from("evidence_library")
          .select("*")
          .eq("user_id", userId)
          .eq("is_active", true)
          .order("priority_rank", { ascending: true })
        
        if (category) {
          query = query.eq("category", category)
        }
        
        const { data } = await query
        return data || []
      },
    }),

    getJobPipeline: tool({
      description: "Get the user's job pipeline - all jobs they're tracking with status and fit scores",
      inputSchema: z.object({
        status: z.string().optional().describe("Filter by status: ANALYZING, REVIEWING, READY, APPLIED, INTERVIEWING, OFFER, REJECTED, WITHDRAWN"),
      }),
      execute: async ({ status }) => {
        const supabase = await createClient()
        let query = supabase
          .from("jobs")
          .select(`
            id,
            company_name,
            role_title,
            status,
            created_at,
            job_scores (
              overall_score
            ),
            applications (
              applied_at
            )
          `)
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
        
        if (status) {
          query = query.eq("status", status)
        }
        
        const { data } = await query.limit(20)
        // Transform to expected format
        return (data || []).map(job => ({
          ...job,
          job_title: job.role_title,
          fit_score: job.job_scores?.[0]?.overall_score || null,
          applied_at: job.applications?.[0]?.applied_at || null,
        }))
      },
    }),

    getJobDetails: tool({
      description: "Get detailed information about a specific job including analysis, generated documents, and evidence map",
      inputSchema: z.object({
        jobId: z.string().describe("The job ID to fetch details for"),
      }),
      execute: async ({ jobId }) => {
        const supabase = await createClient()
        const { data } = await supabase
          .from("jobs")
          .select("*")
          .eq("id", jobId)
          .eq("user_id", userId)
          .single()
        
        if (!data) return { error: "Job not found or access denied" }
        return data
      },
    }),

    suggestNextAction: tool({
      description: "Analyze the user's pipeline state and suggest the most impactful next action they should take",
      inputSchema: z.object({}),
      execute: async () => {
        const supabase = await createClient()
        
        // Get pipeline summary with scores from job_scores table
        const { data: jobs } = await supabase
          .from("jobs")
          .select(`
            status,
            job_scores (
              overall_score
            )
          `)
          .eq("user_id", userId)
        
        const { data: evidence } = await supabase
          .from("evidence_library")
          .select("id")
          .eq("user_id", userId)
          .eq("is_active", true)
        
        const { data: profile } = await supabase
          .from("user_profile")
          .select("headline, summary")
          .eq("user_id", userId)
          .single()
        
        const jobsByStatus: Record<string, number> = {}
        jobs?.forEach(j => {
          jobsByStatus[j.status] = (jobsByStatus[j.status] || 0) + 1
        })
        
        const evidenceCount = evidence?.length || 0
        const hasProfile = !!(profile?.headline && profile?.summary)
        
        // Determine priority action
        if (!hasProfile) {
          return {
            action: "complete_profile",
            message: "Complete your profile first - add a headline and summary to help tailor your applications.",
            priority: "high"
          }
        }
        
        if (evidenceCount < 5) {
          return {
            action: "build_evidence",
            message: `You have ${evidenceCount} evidence items. Add more achievements and projects to strengthen your applications.`,
            priority: "high"
          }
        }
        
        if (jobsByStatus["READY"] && jobsByStatus["READY"] > 0) {
          return {
            action: "apply",
            message: `You have ${jobsByStatus["READY"]} jobs ready to apply. Don't let them sit too long!`,
            priority: "medium"
          }
        }
        
        if (jobsByStatus["REVIEWING"] && jobsByStatus["REVIEWING"] > 0) {
          return {
            action: "review",
            message: `You have ${jobsByStatus["REVIEWING"]} jobs awaiting your review. Check the generated materials.`,
            priority: "medium"
          }
        }
        
        return {
          action: "add_jobs",
          message: "Your pipeline is looking good! Add more jobs to analyze by pasting a job posting URL.",
          priority: "low"
        }
      },
    }),

    saveEvidence: tool({
      description: "Save a new evidence record to the user's evidence library. Use this when helping users document their achievements.",
      inputSchema: z.object({
        title: z.string().describe("Brief title for the evidence"),
        description: z.string().describe("Full description of the achievement, project, or skill"),
        category: z.enum(["achievement", "project", "metric", "skill", "certification"]),
        tags: z.array(z.string()).describe("Relevant tags/keywords"),
        metrics: z.string().optional().describe("Quantifiable results if applicable"),
      }),
      execute: async ({ title, description, category, tags, metrics }) => {
        const supabase = await createClient()

        try {
          const result = await upsertCoachEvidence(supabase, userId, {
            source_title: title,
            source_type: category,
            proof_snippet: description,
            approved_achievement_bullets: description ? [description] : [],
            tools_used: tags,
            outcomes: metrics ? [metrics] : [],
            confidence_level: "medium",
            evidence_weight: "medium",
            is_user_approved: true,
            raw_resume_section: "coach",
          })

          return {
            success: true,
            evidence: result.evidence,
            merged: result.merged,
            duplicateConfidence: result.duplicateConfidence ?? null,
          }
        } catch (error) {
          return { error: error instanceof Error ? error.message : "Failed to save evidence" }
        }
      },
    }),

    updateCareerContext: tool({
      description: "Update the user's job search context like target role, openness to other roles, alternate roles, and notes.",
      inputSchema: z.object({
        target_role: z.string().optional().describe("Primary role the user is targeting"),
        open_to_other_roles: z.boolean().optional().describe("Whether the user is open to other roles"),
        other_roles: z.array(z.string()).optional().describe("Other roles the user is open to"),
        notes: z.string().optional().describe("Additional career context notes"),
      }),
      execute: async (updates) => {
        const supabase = await createClient()
        try {
          const { data: { user } } = await supabase.auth.getUser()
          if (!user) return { error: "Not authenticated" }
          const data = await updateCareerContextRecord(supabase, user.id, updates)
          return { success: true, career_context: data.career_context ?? null }
        } catch (error) {
          return { error: error instanceof Error ? error.message : "Failed to update career context" }
        }
      },
    }),

    // ========== PROFILE MANAGEMENT TOOLS ==========
    
    updateProfile: tool({
      description: "Update the user's profile information like name, location, phone, email, summary, headline, links, or career context. Use this when users want to change their core profile details.",
      inputSchema: z.object({
        full_name: z.string().optional().describe("User's full name"),
        location: z.string().optional().describe("User's location (e.g., 'San Francisco, CA')"),
        phone: z.string().optional().describe("User's phone number"),
        email: z.string().optional().describe("User's email address"),
        summary: z.string().optional().describe("Professional summary/bio"),
        headline: z.string().optional().describe("Short headline or role summary"),
        linkedin_url: z.string().optional().describe("LinkedIn profile URL"),
        github_url: z.string().optional().describe("GitHub profile URL"),
        website_url: z.string().optional().describe("Website or portfolio URL"),
        career_context: z.object({
          target_role: z.string().optional(),
          open_to_other_roles: z.boolean().optional(),
          other_roles: z.array(z.string()).optional(),
          notes: z.string().optional(),
        }).optional().describe("Career context from onboarding or coaching"),
      }),
      execute: async (updates) => {
        const supabase = await createClient()
        
        // Get existing profile
        const { data: existing } = await supabase
          .from("user_profile")
          .select("*")
          .eq("user_id", userId)
          .single()
        
        if (!existing) {
          return { error: "No profile found. User should create their profile first." }
        }
        
        // Filter out undefined values
        const cleanUpdates = Object.fromEntries(
          Object.entries(updates).filter(([_, v]) => v !== undefined)
        )
        
        if (Object.keys(cleanUpdates).length === 0) {
          return { error: "No updates provided" }
        }
        
        const { data, error } = await supabase
          .from("user_profile")
          .update({
            ...cleanUpdates,
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", userId)
          .select()
          .single()
        
        if (error) return { error: "Failed to update profile" }
        await syncProfileLinksFromProfile(supabase, userId, {
          linkedin_url: String(data.linkedin_url ?? ""),
          github_url: String(data.github_url ?? ""),
          website_url: String(data.website_url ?? ""),
          links: data.links,
        })
        return { success: true, message: "Profile updated successfully", updated_fields: Object.keys(cleanUpdates) }
      },
    }),

    addProfileLink: tool({
      description: "Add a canonical profile, portfolio, or social link for the user.",
      inputSchema: z.object({
        link_type: z.enum(["linkedin", "github", "portfolio", "website", "other"]),
        url: z.string().min(3),
        label: z.string().optional(),
        is_primary: z.boolean().optional(),
      }),
      execute: async ({ link_type, url, label, is_primary }) => {
        const supabase = await createClient()
        try {
          const { data: { user } } = await supabase.auth.getUser()
          if (!user) return { error: "Not authenticated" }
          const result = await upsertCoachProfileLink(supabase, user.id, { link_type, url, label, is_primary })
          return { success: true, link: result.link, merged: result.merged }
        } catch (error) {
          return { error: error instanceof Error ? error.message : "Failed to add profile link" }
        }
      },
    }),

    updateProfileLink: tool({
      description: "Update an existing profile link by id.",
      inputSchema: z.object({
        id: z.string().describe("Profile link id"),
        url: z.string().optional(),
        label: z.string().optional(),
        link_type: z.enum(["linkedin", "github", "portfolio", "website", "other"]).optional(),
        is_primary: z.boolean().optional(),
      }),
      execute: async ({ id, url, label, link_type, is_primary }) => {
        const supabase = await createClient()
        try {
          const { data: { user } } = await supabase.auth.getUser()
          if (!user) return { error: "Not authenticated" }
          const result = await updateCoachProfileLink(supabase, user.id, id, { url, label, link_type, is_primary })
          return { success: true, link: result.link, merged: result.merged }
        } catch (error) {
          return { error: error instanceof Error ? error.message : "Failed to update profile link" }
        }
      },
    }),

    removeProfileLink: tool({
      description: "Remove a profile link the user no longer wants in their canonical profile.",
      inputSchema: z.object({
        id: z.string().describe("Profile link id"),
      }),
      execute: async ({ id }) => {
        const supabase = await createClient()
        try {
          const { data: { user } } = await supabase.auth.getUser()
          if (!user) return { error: "Not authenticated" }
          const result = await removeCoachProfileLink(supabase, user.id, id)
          return { success: true, removed: result.removed, link_type: result.link_type ?? null, url: result.url ?? null }
        } catch (error) {
          return { error: error instanceof Error ? error.message : "Failed to remove profile link" }
        }
      },
    }),

    setPrimaryLink: tool({
      description: "Mark a profile link as primary for its type.",
      inputSchema: z.object({
        id: z.string().describe("Profile link id"),
      }),
      execute: async ({ id }) => {
        const supabase = await createClient()
        try {
          const { data: { user } } = await supabase.auth.getUser()
          if (!user) return { error: "Not authenticated" }
          const result = await setPrimaryCoachProfileLink(supabase, user.id, id)
          return { success: true, updated: result.updated, link: result.link ?? null }
        } catch (error) {
          return { error: error instanceof Error ? error.message : "Failed to set primary link" }
        }
      },
    }),

    addExperience: tool({
      description: "Add a work experience entry to the user's profile. Use this when users want to add a company or job to their work history.",
      inputSchema: z.object({
        title: z.string().describe("Job title (e.g., 'Senior Product Manager')"),
        company: z.string().describe("Company name (e.g., 'RedLantern Studios')"),
        start_date: z.string().describe("Start date (e.g., 'Jan 2022' or '2022')"),
        end_date: z.string().optional().describe("End date (e.g., 'Dec 2023' or 'Present')"),
        description: z.string().optional().describe("Job description and key achievements"),
      }),
      execute: async ({ title, company, start_date, end_date, description }) => {
        const supabase = await createClient()
        
        // Get existing profile
        const { data: existing } = await supabase
          .from("user_profile")
          .select("experience")
          .eq("user_id", userId)
          .single()
        
        if (!existing) {
          return { error: "No profile found. User should create their profile first." }
        }
        
        const currentExperience = Array.isArray(existing.experience) ? existing.experience : []
        const newExperience = {
          title,
          company,
          start_date,
          end_date: end_date || "Present",
          description: description || "",
        }

        const experienceKey = normalizeText(`${title} ${company} ${start_date} ${end_date || "Present"}`)
        const existingIndex = currentExperience.findIndex((entry: Record<string, unknown>) =>
          normalizeText(`${String(entry.title ?? "")} ${String(entry.company ?? "")} ${String(entry.start_date ?? "")} ${String(entry.end_date ?? "Present")}`) === experienceKey
        )

        const nextExperience = existingIndex >= 0
          ? currentExperience.map((entry: Record<string, unknown>, index: number) =>
              index === existingIndex
                ? {
                    ...entry,
                    description: [String(entry.description ?? ""), description || ""].filter(Boolean).join("\n").trim(),
                  }
                : entry
            )
          : [...currentExperience, newExperience]
        
        const { data, error } = await supabase
          .from("user_profile")
          .update({
            experience: nextExperience,
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", userId)
          .select()
          .single()
        
        if (error) return { error: "Failed to add experience" }
        return { 
          success: true, 
          message: `Added ${title} at ${company} to your work experience.`,
          experience: existingIndex >= 0 ? nextExperience[existingIndex] : newExperience
        }
      },
    }),

    addSkills: tool({
      description: "Add one or more skills to the user's profile. Use this when users want to add new skills.",
      inputSchema: z.object({
        skills: z.array(z.string()).describe("Array of skills to add (e.g., ['React', 'TypeScript', 'Product Management'])"),
      }),
      execute: async ({ skills }) => {
        const supabase = await createClient()
        
        // Get existing profile
        const { data: existing } = await supabase
          .from("user_profile")
          .select("skills")
          .eq("user_id", userId)
          .single()
        
        if (!existing) {
          return { error: "No profile found. User should create their profile first." }
        }
        
        const currentSkills = Array.isArray(existing.skills) ? existing.skills : []
        const normalizedCurrent = new Set(currentSkills.map((skill: string) => normalizeText(skill)))
        const newSkills = skills.filter(s => !normalizedCurrent.has(normalizeText(s)))
        
        if (newSkills.length === 0) {
          return { message: "All skills already exist in profile", added: [] }
        }
        
        const { data, error } = await supabase
          .from("user_profile")
          .update({
            skills: [...currentSkills, ...newSkills],
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", userId)
          .select()
          .single()
        
        if (error) return { error: "Failed to add skills" }
        return { 
          success: true, 
          message: `Added ${newSkills.length} skill(s) to your profile.`,
          added: newSkills
        }
      },
    }),

    removeSkill: tool({
      description: "Remove a skill from the user's profile.",
      inputSchema: z.object({
        skill: z.string().describe("The skill to remove"),
      }),
      execute: async ({ skill }) => {
        const supabase = await createClient()
        
        // Get existing profile
        const { data: existing } = await supabase
          .from("user_profile")
          .select("skills")
          .eq("user_id", userId)
          .single()
        
        if (!existing) {
          return { error: "No profile found" }
        }
        
        const currentSkills = existing.skills || []
        const updatedSkills = currentSkills.filter((s: string) => s.toLowerCase() !== skill.toLowerCase())
        
        if (updatedSkills.length === currentSkills.length) {
          return { error: `Skill "${skill}" not found in profile` }
        }
        
        const { error } = await supabase
          .from("user_profile")
          .update({
            skills: updatedSkills,
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", userId)
        
        if (error) return { error: "Failed to remove skill" }
        return { success: true, message: `Removed "${skill}" from your skills.` }
      },
    }),

    addEducation: tool({
      description: "Add an education entry to the user's profile.",
      inputSchema: z.object({
        degree: z.string().describe("Degree or certification (e.g., 'BS Computer Science', 'MBA')"),
        school: z.string().describe("School or institution name"),
        year: z.string().describe("Graduation year or date range"),
      }),
      execute: async ({ degree, school, year }) => {
        const supabase = await createClient()
        
        // Get existing profile
        const { data: existing } = await supabase
          .from("user_profile")
          .select("education")
          .eq("user_id", userId)
          .single()
        
        if (!existing) {
          return { error: "No profile found" }
        }
        
        const currentEducation = Array.isArray(existing.education) ? existing.education : []
        const newEducation = { degree, school, year }

        const educationKey = normalizeText(`${degree} ${school} ${year}`)
        const existingIndex = currentEducation.findIndex((entry: Record<string, unknown>) =>
          normalizeText(`${String(entry.degree ?? "")} ${String(entry.school ?? "")} ${String(entry.year ?? "")}`) === educationKey
        )

        const nextEducation = existingIndex >= 0
          ? currentEducation.map((entry: Record<string, unknown>, index: number) =>
              index === existingIndex ? { ...entry, degree, school, year } : entry
            )
          : [...currentEducation, newEducation]
        
        const { error } = await supabase
          .from("user_profile")
          .update({
            education: nextEducation,
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", userId)
        
        if (error) return { error: "Failed to add education" }
        return { 
          success: true, 
          message: `Added ${degree} from ${school} to your education.`,
          education: existingIndex >= 0 ? nextEducation[existingIndex] : newEducation
        }
      },
    }),

    updateJobStatus: tool({
      description: "Update the status of a job in the user's pipeline. Use this when users want to mark a job as applied, interviewing, rejected, etc.",
      inputSchema: z.object({
        jobId: z.string().describe("The job ID to update"),
        status: z.enum(["ANALYZING", "REVIEWING", "READY", "APPLIED", "INTERVIEWING", "OFFER", "REJECTED", "WITHDRAWN"]).describe("The new status"),
        notes: z.string().optional().describe("Optional notes about the status change"),
      }),
      execute: async ({ jobId, status }) => {
        const supabase = await createClient()
        
        // Update job status
        const { data, error } = await supabase
          .from("jobs")
          .update({ status })
          .eq("id", jobId)
          .eq("user_id", userId)
          .select("id, role_title, company_name, status")
          .single()
        
        if (error) return { error: "Failed to update job status" }
        if (!data) return { error: "Job not found or access denied" }
        
        // If marking as applied, create an application record
        if (status === "APPLIED") {
          await supabase
            .from("applications")
            .upsert({
              job_id: jobId,
              user_id: userId,
              status: "applied",
              applied_at: new Date().toISOString(),
            })
        }
        
        return { 
          success: true, 
          message: `Updated ${data.role_title} at ${data.company_name} to ${status}.`,
          job: data
        }
      },
    }),
  }
}

export async function POST(req: NextRequest) {
  try {
    const { messages, conversationId, gapContext } = await req.json()

    if (!messages || !Array.isArray(messages)) {
      return new Response(
        JSON.stringify({ error: "messages array required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      )
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      )
    }

    // Safety check
    const safetyResult = checkSafety(messages, {
      userId: user.id,
      sessionId: conversationId,
      strictMode: false,
    })
    logSafetyAudit(safetyResult.auditRecord, { supabase }).catch(() => {})
    if (!safetyResult.allowed) {
      const refusalResponse = safetyResult.blockedResponse ||
        "I'm here to help with your career journey! Let's focus on job searching, resume writing, interview prep, or career advice."
      return new Response(
        JSON.stringify({ role: "assistant", content: refusalResponse }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      )
    }

    // Create tools with userId bound
    const tools = createCoachTools(user.id)
    const { data: profile } = await supabase
      .from("user_profile")
      .select("full_name, headline, summary, career_context")
      .eq("user_id", user.id)
      .maybeSingle()

    const careerContext = profile && typeof profile.career_context === "object" && !Array.isArray(profile.career_context)
      ? profile.career_context as Record<string, unknown>
      : null

    const careerContextLines = careerContext
      ? [
          "## Career Context from onboarding",
          `Target role: ${String(careerContext.target_role ?? "Not set")}`,
          `Open to other roles: ${String(careerContext.open_to_other_roles ?? "Not set")}`,
          `Other roles: ${String(careerContext.other_roles ?? "Not set")}`,
          `Notes: ${String(careerContext.notes ?? "None")}`,
        ].join("\n")
      : "## Career Context from onboarding\nTarget role: Not set\nOpen to other roles: Not set\nOther roles: Not set\nNotes: None"

    // Build system prompt - add gap clarification mode if context provided
    let systemPrompt = `${COACH_SYSTEM_PROMPT}\n\n${careerContextLines}`
    if (gapContext) {
      systemPrompt = `${systemPrompt}\n\n${GAP_CLARIFICATION_SYSTEM_PROMPT}\n\n## Current Gap Context\nThe user is asking about gaps for job: "${gapContext.jobTitle}" at "${gapContext.company}".\n${gapContext.gap ? `Specific gap to address: ${gapContext.gap.requirement} (${gapContext.gap.category})` : "Help the user address their evidence gaps for this role."}`
    }

    const result = streamText({
      model: groq(MODELS.VERSATILE),
      system: systemPrompt,
      messages,
      tools,
      stopWhen: stepCountIs(10),
    })

    return result.toUIMessageStreamResponse()
  } catch (error) {
    console.error("[Coach API Error]", error)
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    )
  }
}
