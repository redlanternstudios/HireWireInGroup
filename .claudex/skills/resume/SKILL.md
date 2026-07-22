---
name: resume
command: /resume
description: Build, tailor, audit, and release employer-facing resumes using Rory Semeah's locked content, layout, branding, safety, and QA standards.
---

# /resume - Employer-Safe Resume Production Standard

## Purpose
Create or audit a one-page employer-facing resume that tells Rory Semeah's complete career story, remains ATS-readable, uses the page well, and contains no internal HireWire or RedLantern Studios branding.

## Source of truth
Use `Rory_Semeah_AI_Technical_Product_Manager_Resume` as the content-density, chronology, hierarchy, spacing, and sizing reference. Do not copy its RedLantern footer or any studio branding.

## Identity and branding rules
- The resume belongs to Rory Semeah, not RedLantern Studios or HireWire.
- RedLantern Studios may appear only as an employer inside Professional Experience.
- Never place RedLantern logos, slogans, footer bars, brand marks, company identity systems, or `Truth - Technology - Trajectory` anywhere on an employer-facing resume.
- Never place HireWire, Claudex, CTP, application-pack, candidate-profile, match-score, readiness, audit, or strategy labels on the resume.
- Use neutral professional styling. A target-company accent may be used sparingly for headings or rules only.

## Locked career narrative
Every tailored resume must preserve, with truthful role-specific emphasis:

### loanDepot - Application Support Analyst to Supervisor
- Progression from hands-on application support into supervision.
- Leadership of a 30+ person support organization.
- Weekly one-on-ones with each direct team member.
- Coaching, performance management, career growth, escalations, accountability, and service standards.
- Elimination of a 1,000+ ticket backlog through intake, triage, sprint resolution, root-cause analysis, and knowledge management.
- Above-95% SLA performance.
- Engineering, InfoSec, vendor, Jenkins, and GitHub Actions context.

### Ingram Micro - three distinct roles
1. Associate Integration Lead
2. Product Owner
3. Technical Product Manager

Preserve the 60-country SAP invoice-platform rollout, OpenAI and Python workflow automation across 20+ countries, and relevant SAP S/4HANA, SAP BRIM, Salesforce, AWS, Kubernetes, Terraform, APIs, SQL, Looker, BillTrust, and PlanetPress context.

### RedLantern Studios
Preserve production AI, SaaS, internal-platform, web, and iOS delivery context, including Next.js, Supabase, Vercel, OpenAI, Anthropic, Authentic Hadith, Amina, HireWire, The Lantern Daily, SwarmClaw, and ByRedLanternOS when relevant. Do not overstate engineering ownership.

## One-page layout rules
- Target 80-90% of usable page height; avoid a crowded page and avoid a half-empty page.
- Margins: approximately 0.45-0.65 inches.
- Name: 17-21 pt.
- Target title: 10-13 pt. Long titles must wrap or be shortened truthfully; never dominate Rory's name.
- Section headings: 8.5-10 pt.
- Body: 8.5-10 pt; never microscopic.
- Dates and metadata: 8-9 pt.
- Line spacing: approximately 1.0-1.08.
- Maintain clear, compact spacing between sections and roles.
- Use the full width. Do not compress the resume into a narrow top block.
- No oversized footer, decorative bottom bar, side panel, or empty decorative area.
- The page must look balanced at 100% zoom.

## Content rules
- Keep all major employers and role progression.
- Separate the three Ingram roles.
- Do not reduce loanDepot leadership to a token bullet.
- Lead with verified evidence and outcomes, not generic keyword lists.
- Tailoring may change the headline, summary emphasis, technology order, accomplishment order, and verified role-specific keywords.
- Tailoring may not invent tools, certifications, clearances, scope, metrics, or responsibilities.
- Never include `status to confirm` or any uncertainty note in the employer document.

## Employer-safety exclusions
Never include:
- candidate profiles;
- match, fit, confidence, readiness, or ATS scores;
- weaknesses, missing qualifications, hard gates, or risk analysis;
- CTP decisions or internal reasoning;
- application strategy or instructions to the applicant;
- job-posting records or source notes;
- unverified-qualification warnings;
- internal portfolio commentary;
- RedLantern or HireWire branding.

A combined employer-facing application pack may contain only:
1. tailored resume;
2. tailored cover letter.

## Required audit before release
Fail the resume if any condition is true:
- RedLantern/HireWire/internal branding is visible.
- Employer-unsafe analysis is visible.
- Body text is below readable size.
- More than roughly 20% of usable page height is unnecessarily empty.
- Text is clipped, overlapping, or outside margins.
- Rory's career progression is flattened or incomplete.
- Ingram roles are improperly merged.
- loanDepot leadership context is materially absent.
- Unverified claims appear.
- PDF text extraction is broken or ATS-hostile.

## QA workflow
1. Generate the resume.
2. Render the PDF to PNG at 200 DPI.
3. Inspect the entire page at 100% zoom.
4. Run text and prohibited-phrase checks.
5. Verify one page, readable sizing, balanced page utilization, clean hierarchy, and complete chronology.
6. Regenerate until all checks pass.
7. Release only the final resume and cover letter to employer-facing folders.
8. Keep internal evaluation in a separate internal-only location.

## Batch rule
For Roles 30-65, every existing resume and combined application pack must be treated as rejected until it passes this skill. Replace files in local, Drive, and Claudex stores; do not mix corrected and rejected files in the same release folder.
