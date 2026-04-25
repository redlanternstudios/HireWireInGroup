/**
 * scripts/test-linkedin-capture.ts
 *
 * Validates the LinkedIn capture pipeline using a representative fixture.
 *
 * Tests text cleaning, schema structure, and evidence mapping logic.
 * Does NOT make live AI or Supabase calls — a pre-baked fixture simulates
 * what the AI would return, allowing the mapping layer and invariants to be
 * verified deterministically.
 *
 * Run:
 *   npx tsx scripts/test-linkedin-capture.ts
 *
 * Fixture shape matches the spec:
 *   - Current role at studio/agency (full-time, remote)
 *   - 2+ yrs at enterprise tech with multiple role progressions (Meridian)
 *   - 4+ yrs at financial services with 4 role progressions (First National)
 *   - Master's + bachelor's
 *   - LinkedIn certifications
 *   - Activity feed contains mostly reposts
 *   - 1,000+ followers, 500+ connections
 */

import { cleanProfileText } from "../lib/linkedin/cleanProfileText"
import { mapLinkedInToEvidence } from "../lib/linkedin/mapLinkedInToEvidence"
import {
  LinkedInCaptureResultSchema,
  type LinkedInCaptureResult,
} from "../lib/linkedin/extractLinkedInProfile"
import { dedupeKey } from "../lib/mapResumeToEvidence"

// ── Test utilities ────────────────────────────────────────────────────────────

let passed = 0
let failed = 0
const failures: string[] = []

function assert(condition: boolean, label: string): void {
  if (condition) {
    console.log(`  ✓ ${label}`)
    passed++
  } else {
    console.error(`  ✗ ${label}`)
    failures.push(label)
    failed++
  }
}

function section(title: string): void {
  console.log(`\n${title}`)
  console.log("─".repeat(title.length))
}

// ── Fixture: noisy LinkedIn profile text ──────────────────────────────────────
// Representative of real copy-paste from a LinkedIn profile page.
// Contains engagement buttons, premium upsells, nav chrome, reposts.

const NOISY_LINKEDIN_FIXTURE = `
Home My Network Jobs Messaging Notifications Me Work Gaming

Alex Rivera
Senior Product Designer · Remote · New York, NY
DesignStudio Co.
Stanford University
1,243 followers · 500+ connections

Connect Message More...

View Alex Rivera's full profile

Try Premium for free and get AI-powered insights on who viewed your profile.

About
I'm a product designer with 7+ years of experience building B2B and consumer SaaS products.
I've led end-to-end design for fintech and enterprise software, partnering closely with engineering and product leadership.

Experience

DesignStudio Co.
Senior Product Designer · Full-time · Remote
Jun 2023 – Present · 1 yr 10 mos

Meridian Technologies
3 yrs 4 mos · New York, NY

Lead Product Designer · Full-time
Jan 2022 – May 2023 · 1 yr 5 mos
Led redesign of core platform dashboard, reducing support tickets by 34%.

Senior Product Designer
Oct 2020 – Dec 2021 · 1 yr 3 mos
Owned design system migration from Sketch to Figma.

First National Financial Group
4 yrs 8 mos · Chicago, IL

Principal Product Designer · Full-time
Mar 2020 – Sep 2020 · 7 mos

Senior UX Designer
Feb 2019 – Feb 2020 · 1 yr 1 mo

UX Designer
Aug 2017 – Jan 2019 · 1 yr 6 mos

Junior UX Designer
Jan 2016 – Jul 2017 · 1 yr 7 mos

Education

Stanford University
Master of Science · Human-Computer Interaction
2014 – 2016

University of Michigan
Bachelor of Fine Arts · Graphic Design
2010 – 2014

Licenses & Certifications

Google UX Design Certificate
Google · Issued Jun 2022

Nielsen Norman Group UX Certification
Nielsen Norman Group · Issued Mar 2021

Skills

Product Design · UX Research · Figma · Design Systems · Prototyping
User Testing · A/B Testing · SQL · Agile · Leadership

Analytics
1,243 profile views in the last 90 days
234 post impressions in the last 7 days
89 search appearances in the last week

Activity
1,243 followers

Alex Rivera reposted
Sarah Chen · Product Design Lead at Meta
"Design systems save 40% of engineering time — here's how we did it at Meta."
42 reactions · 8 comments

Alex Rivera reposted
TechCrunch
"The future of AI in product design"
127 reactions · 14 comments

Alex Rivera
"Excited to share that we just shipped our new onboarding flow at DesignStudio.
Three months of iteration and user research. Proud of the team."
89 reactions · 12 comments

Like Comment Repost Send
Like Comment Repost Send

Report this profile · Block

Suggested for you
Jane Doe · UX Director at Spotify
Connect

View Alex Rivera's full profile
`

// ── Fixture: pre-baked extraction result ──────────────────────────────────────
// Simulates what the AI would return for the above profile.
// Used to test mapping logic without live AI calls.

const FIXTURE_EXTRACTION: LinkedInCaptureResult = {
  identity: {
    full_name: "Alex Rivera",
    headline: "Senior Product Designer · Remote · New York, NY",
    location: "New York, NY",
    current_company: "DesignStudio Co.",
    education_brand: "Stanford University",
    followers: 1243,
    connections: "500+",
    contact_info_present: false,
  },
  experience: [
    {
      status: "explicit",
      source_excerpt:
        "DesignStudio Co.\nSenior Product Designer · Full-time · Remote\nJun 2023 – Present · 1 yr 10 mos",
      company: "DesignStudio Co.",
      role_title: "Senior Product Designer",
      employment_type: "Full-time",
      start_date: "Jun 2023",
      end_date: "Present",
      duration: "1 yr 10 mos",
      location: "Remote",
      work_mode: "Remote",
      skills_attached: [],
      impact_claims_present: [],
      impact_claims_missing: ["quantified impact metrics", "team size"],
      promotion_or_progression: false,
    },
    {
      status: "explicit",
      source_excerpt:
        "Lead Product Designer · Full-time\nJan 2022 – May 2023 · 1 yr 5 mos\nLed redesign of core platform dashboard, reducing support tickets by 34%.",
      company: "Meridian Technologies",
      role_title: "Lead Product Designer",
      employment_type: "Full-time",
      start_date: "Jan 2022",
      end_date: "May 2023",
      duration: "1 yr 5 mos",
      location: "New York, NY",
      work_mode: null,
      skills_attached: [],
      impact_claims_present: ["reducing support tickets by 34%"],
      impact_claims_missing: [],
      promotion_or_progression: true,
    },
    {
      status: "explicit",
      source_excerpt:
        "Senior Product Designer\nOct 2020 – Dec 2021 · 1 yr 3 mos\nOwned design system migration from Sketch to Figma.",
      company: "Meridian Technologies",
      role_title: "Senior Product Designer",
      employment_type: "Full-time",
      start_date: "Oct 2020",
      end_date: "Dec 2021",
      duration: "1 yr 3 mos",
      location: "New York, NY",
      work_mode: null,
      skills_attached: ["Figma"],
      impact_claims_present: ["design system migration from Sketch to Figma"],
      impact_claims_missing: [],
      promotion_or_progression: false,
    },
    {
      status: "explicit",
      source_excerpt:
        "Principal Product Designer · Full-time\nMar 2020 – Sep 2020 · 7 mos",
      company: "First National Financial Group",
      role_title: "Principal Product Designer",
      employment_type: "Full-time",
      start_date: "Mar 2020",
      end_date: "Sep 2020",
      duration: "7 mos",
      location: "Chicago, IL",
      work_mode: null,
      skills_attached: [],
      impact_claims_present: [],
      impact_claims_missing: ["quantified outcomes"],
      promotion_or_progression: true,
    },
    {
      status: "explicit",
      source_excerpt: "Senior UX Designer\nFeb 2019 – Feb 2020 · 1 yr 1 mo",
      company: "First National Financial Group",
      role_title: "Senior UX Designer",
      employment_type: "Full-time",
      start_date: "Feb 2019",
      end_date: "Feb 2020",
      duration: "1 yr 1 mo",
      location: "Chicago, IL",
      work_mode: null,
      skills_attached: [],
      impact_claims_present: [],
      impact_claims_missing: ["impact metrics"],
      promotion_or_progression: false,
    },
    {
      status: "explicit",
      source_excerpt: "UX Designer\nAug 2017 – Jan 2019 · 1 yr 6 mos",
      company: "First National Financial Group",
      role_title: "UX Designer",
      employment_type: "Full-time",
      start_date: "Aug 2017",
      end_date: "Jan 2019",
      duration: "1 yr 6 mos",
      location: "Chicago, IL",
      work_mode: null,
      skills_attached: [],
      impact_claims_present: [],
      impact_claims_missing: ["impact metrics"],
      promotion_or_progression: false,
    },
    {
      status: "explicit",
      source_excerpt: "Junior UX Designer\nJan 2016 – Jul 2017 · 1 yr 7 mos",
      company: "First National Financial Group",
      role_title: "Junior UX Designer",
      employment_type: "Full-time",
      start_date: "Jan 2016",
      end_date: "Jul 2017",
      duration: "1 yr 7 mos",
      location: "Chicago, IL",
      work_mode: null,
      skills_attached: [],
      impact_claims_present: [],
      impact_claims_missing: ["impact metrics"],
      promotion_or_progression: false,
    },
  ],
  career_progression: [
    {
      company: "Meridian Technologies",
      roles: ["Senior Product Designer", "Lead Product Designer"],
      promotions_detected: true,
    },
    {
      company: "First National Financial Group",
      roles: [
        "Junior UX Designer",
        "UX Designer",
        "Senior UX Designer",
        "Principal Product Designer",
      ],
      promotions_detected: true,
    },
  ],
  education: [
    {
      status: "explicit",
      source_excerpt:
        "Stanford University\nMaster of Science · Human-Computer Interaction\n2014 – 2016",
      institution: "Stanford University",
      degree: "Master of Science",
      field: "Human-Computer Interaction",
      start_date: "2014",
      end_date: "2016",
      honors: null,
    },
    {
      status: "explicit",
      source_excerpt:
        "University of Michigan\nBachelor of Fine Arts · Graphic Design\n2010 – 2014",
      institution: "University of Michigan",
      degree: "Bachelor of Fine Arts",
      field: "Graphic Design",
      start_date: "2010",
      end_date: "2014",
      honors: null,
    },
  ],
  certifications: [
    {
      status: "explicit",
      source_excerpt:
        "Google UX Design Certificate\nGoogle · Issued Jun 2022",
      certification_name: "Google UX Design Certificate",
      issuer: "Google",
      issued_date: "Jun 2022",
      credential_url_present: false,
    },
    {
      status: "explicit",
      source_excerpt:
        "Nielsen Norman Group UX Certification\nNielsen Norman Group · Issued Mar 2021",
      certification_name: "Nielsen Norman Group UX Certification",
      issuer: "Nielsen Norman Group",
      issued_date: "Mar 2021",
      credential_url_present: false,
    },
  ],
  skills: {
    raw_skills: [
      "Product Design",
      "UX Research",
      "Figma",
      "Design Systems",
      "Prototyping",
      "User Testing",
      "A/B Testing",
      "SQL",
      "Agile",
      "Leadership",
    ],
    normalized_skills: [
      "Product Design",
      "UX Research",
      "Figma",
      "Design Systems",
      "Prototyping",
      "User Testing",
      "A/B Testing",
      "SQL",
      "Agile",
      "Leadership",
    ],
    categorized: {
      product: ["Product Design", "Design Systems", "Prototyping"],
      technical: ["Figma", "SQL", "A/B Testing"],
      leadership: ["Leadership", "Agile"],
      sales: [],
      operations: [],
      ai: [],
    },
    missing_high_value_skills: ["quantitative research", "product strategy"],
  },
  about: {
    raw_text:
      "I'm a product designer with 7+ years of experience building B2B and consumer SaaS products. I've led end-to-end design for fintech and enterprise software, partnering closely with engineering and product leadership.",
    core_claims: [
      "7+ years product design experience",
      "B2B and consumer SaaS",
      "fintech and enterprise software",
    ],
    leadership_signals: [
      "led end-to-end design",
      "partnering with product leadership",
    ],
    methodologies: [],
    business_outcomes: [],
    weak_language: ["I'm a product designer", "experience building"],
    rewrite_opportunities: [
      "Add quantified outcomes",
      "Replace vague claims with specific impact metrics",
    ],
  },
  social_proof: {
    followers: 1243,
    connections: "500+",
    profile_views: 1243,
    post_impressions: 234,
    search_appearances: 89,
  },
  activity: [
    {
      post_type: "repost",
      topic: "design systems ROI",
      engagement: "42 reactions, 8 comments",
      capture_for_resume: false,
    },
    {
      post_type: "repost",
      topic: "AI in product design",
      engagement: "127 reactions, 14 comments",
      capture_for_resume: false,
    },
    {
      post_type: "original",
      topic: "product launch — new onboarding flow at DesignStudio",
      engagement: "89 reactions, 12 comments",
      capture_for_resume: false,
    },
  ],
  noise_removed: [
    "engagement_buttons",
    "view_profile_links",
    "premium_upsell",
    "suggested_for_you",
    "nav_chrome",
    "profile_actions",
    "report_links",
  ],
  validation: {
    explicit_claim_count: 11,
    inferred_claim_count: 0,
    missing_field_count: 0,
    safe_for_resume_generation: true,
    safe_for_job_matching: true,
    requires_user_review: false,
  },
}

// ── Tests ─────────────────────────────────────────────────────────────────────

section("Test 1 — Text Cleaning: UI noise is stripped")
{
  const { cleanedText, removedNoise } = cleanProfileText(NOISY_LINKEDIN_FIXTURE)

  assert(
    !cleanedText.match(/^(Like|Comment|Repost|Send)$/m),
    "Reaction buttons (Like/Comment/Repost/Send) stripped"
  )
  assert(
    !cleanedText.includes("Try Premium") &&
      !cleanedText.includes("AI-powered insights"),
    "Premium upsell block stripped"
  )
  assert(
    !cleanedText.match(/View Alex Rivera.{0,10}profile/),
    "View profile artifacts stripped"
  )
  assert(
    !cleanedText.includes("Suggested for you"),
    "Suggested for you block stripped"
  )
  assert(removedNoise.length > 0, `removedNoise array populated (${removedNoise.length} categories)`)
  assert(
    cleanedText.includes("Senior Product Designer"),
    "Experience content preserved after cleaning"
  )
  assert(
    cleanedText.includes("Stanford University"),
    "Education content preserved after cleaning"
  )
  assert(
    cleanedText.includes("About"),
    "About section preserved after cleaning"
  )
}

section("Test 2 — Schema Validation: Output matches schema shape")
{
  const parseResult = LinkedInCaptureResultSchema.safeParse(FIXTURE_EXTRACTION)
  assert(parseResult.success, "Fixture passes LinkedInCaptureResultSchema Zod validation")

  if (!parseResult.success) {
    console.error(
      "    Zod errors:",
      JSON.stringify(parseResult.error.errors, null, 2)
    )
  }

  const requiredKeys: (keyof LinkedInCaptureResult)[] = [
    "identity",
    "experience",
    "career_progression",
    "education",
    "certifications",
    "skills",
    "about",
    "social_proof",
    "activity",
    "noise_removed",
    "validation",
  ]

  for (const key of requiredKeys) {
    assert(key in FIXTURE_EXTRACTION, `Top-level key "${key}" present`)
  }
}

section("Test 3 — Reposts in activity only, capture_for_resume false")
{
  const reposts = FIXTURE_EXTRACTION.activity.filter(
    (a) => a.post_type === "repost"
  )
  assert(
    reposts.length >= 2,
    `At least 2 reposts captured in activity (found ${reposts.length})`
  )
  assert(
    reposts.every((r) => r.capture_for_resume === false),
    "All reposted activity items have capture_for_resume: false"
  )
  // No repost topic bleeds into experience role_title
  const experienceRoles = FIXTURE_EXTRACTION.experience.map(
    (e) => e.role_title?.toLowerCase() ?? ""
  )
  const repostTopics = reposts
    .map((r) => r.topic?.toLowerCase() ?? "")
    .filter(Boolean)
  const bleed = repostTopics.filter((t) =>
    experienceRoles.some((r) => r.includes(t) || t.includes(r))
  )
  assert(bleed.length === 0, "No repost topic bleeds into experience role_title")
}

section("Test 4 — All company roles captured as separate experience entries")
{
  const meridianRoles = FIXTURE_EXTRACTION.experience.filter(
    (e) => e.company === "Meridian Technologies"
  )
  const fnfgRoles = FIXTURE_EXTRACTION.experience.filter(
    (e) => e.company === "First National Financial Group"
  )

  assert(
    meridianRoles.length >= 2,
    `Meridian Technologies: ${meridianRoles.length} separate role entries (expected ≥2)`
  )
  assert(
    fnfgRoles.length >= 4,
    `First National Financial Group: ${fnfgRoles.length} separate role entries (expected ≥4)`
  )
  assert(
    FIXTURE_EXTRACTION.experience.length >= 7,
    `Total experience entries: ${FIXTURE_EXTRACTION.experience.length} (expected ≥7)`
  )
}

section("Test 5 — Education entries captured")
{
  assert(
    FIXTURE_EXTRACTION.education.length >= 2,
    `${FIXTURE_EXTRACTION.education.length} education entries captured`
  )
  const hasGrad = FIXTURE_EXTRACTION.education.some(
    (e) => e.degree?.toLowerCase().includes("master") ?? false
  )
  const hasUndergrad = FIXTURE_EXTRACTION.education.some(
    (e) => e.degree?.toLowerCase().includes("bachelor") ?? false
  )
  assert(hasGrad, "Master's degree captured")
  assert(hasUndergrad, "Bachelor's degree captured")
}

section("Test 6 — Follower and connection counts in social_proof")
{
  assert(
    FIXTURE_EXTRACTION.social_proof.followers !== null &&
      FIXTURE_EXTRACTION.social_proof.followers >= 1000,
    `social_proof.followers = ${FIXTURE_EXTRACTION.social_proof.followers} (≥1000)`
  )
  assert(
    FIXTURE_EXTRACTION.social_proof.connections !== null,
    `social_proof.connections = "${FIXTURE_EXTRACTION.social_proof.connections}"`
  )
  assert(
    FIXTURE_EXTRACTION.social_proof.followers ===
      FIXTURE_EXTRACTION.identity.followers,
    "social_proof.followers matches identity.followers"
  )
}

section("Test 7 — No explicit item is missing a source_excerpt")
{
  const explicitExpWithoutExcerpt = FIXTURE_EXTRACTION.experience.filter(
    (e) => e.status === "explicit" && !e.source_excerpt
  )
  const explicitEduWithoutExcerpt = FIXTURE_EXTRACTION.education.filter(
    (e) => e.status === "explicit" && !e.source_excerpt
  )
  const explicitCertWithoutExcerpt = FIXTURE_EXTRACTION.certifications.filter(
    (c) => c.status === "explicit" && !c.source_excerpt
  )

  assert(
    explicitExpWithoutExcerpt.length === 0,
    `All explicit experience entries have source_excerpt (violations: ${explicitExpWithoutExcerpt.length})`
  )
  assert(
    explicitEduWithoutExcerpt.length === 0,
    `All explicit education entries have source_excerpt (violations: ${explicitEduWithoutExcerpt.length})`
  )
  assert(
    explicitCertWithoutExcerpt.length === 0,
    `All explicit certifications have source_excerpt (violations: ${explicitCertWithoutExcerpt.length})`
  )
}

section("Test 8 — capture_for_resume false on all reposted activity items")
{
  const repostedWithTrue = FIXTURE_EXTRACTION.activity.filter(
    (a) => a.post_type === "repost" && a.capture_for_resume === true
  )
  assert(
    repostedWithTrue.length === 0,
    `No repost has capture_for_resume: true (violations: ${repostedWithTrue.length})`
  )
}

section("Test 9 — evidence_library upsert called with correct item count")
{
  const evidenceRows = mapLinkedInToEvidence(FIXTURE_EXTRACTION)

  const workExpRows = evidenceRows.filter(
    (r) => r.source_type === "work_experience"
  )
  const educationRows = evidenceRows.filter(
    (r) => r.source_type === "education"
  )
  const certRows = evidenceRows.filter(
    (r) => r.source_type === "certification"
  )
  const skillRows = evidenceRows.filter((r) => r.source_type === "skill")

  const expectedWorkExp = FIXTURE_EXTRACTION.experience.filter(
    (e) => e.status !== "noise" && (e.company !== null || e.role_title !== null)
  ).length
  const expectedEdu = FIXTURE_EXTRACTION.education.filter(
    (e) => e.status !== "noise" && (e.institution !== null || e.degree !== null)
  ).length
  const expectedCerts = FIXTURE_EXTRACTION.certifications.filter(
    (c) => c.status !== "noise" && c.certification_name !== null
  ).length

  assert(
    workExpRows.length === expectedWorkExp,
    `Work experience rows: ${workExpRows.length} (expected ${expectedWorkExp})`
  )
  assert(
    educationRows.length === expectedEdu,
    `Education rows: ${educationRows.length} (expected ${expectedEdu})`
  )
  assert(
    certRows.length === expectedCerts,
    `Certification rows: ${certRows.length} (expected ${expectedCerts})`
  )
  assert(skillRows.length === 1, "Exactly 1 consolidated skill row")

  // Verify activity never produces evidence rows
  const activityTopics = FIXTURE_EXTRACTION.activity
    .map((a) => a.topic?.toLowerCase() ?? "")
    .filter(Boolean)
  const activityInEvidence = evidenceRows.filter((r) =>
    activityTopics.some((t) => r.source_title.toLowerCase().includes(t))
  )
  assert(
    activityInEvidence.length === 0,
    `No activity content in evidence rows (violations: ${activityInEvidence.length})`
  )

  // All deduplication keys must be unique
  const keys = evidenceRows.map(dedupeKey)
  const uniqueKeys = new Set(keys)
  assert(
    uniqueKeys.size === evidenceRows.length,
    `All ${evidenceRows.length} evidence rows have unique deduplication keys`
  )

  const expectedTotal =
    workExpRows.length +
    educationRows.length +
    certRows.length +
    skillRows.length
  assert(
    evidenceRows.length === expectedTotal,
    `evidence_library upsert would be called with ${evidenceRows.length} rows total`
  )
}

// ── Summary ───────────────────────────────────────────────────────────────────

console.log(`\n${"─".repeat(50)}`)
console.log(`Results: ${passed} passed, ${failed} failed`)
if (failures.length > 0) {
  console.log("\nFailed assertions:")
  failures.forEach((f) => console.log(`  ✗ ${f}`))
  process.exit(1)
} else {
  console.log("All tests passed.")
  process.exit(0)
}
