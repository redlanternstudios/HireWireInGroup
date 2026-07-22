---
name: resume
command: /resume
description: Build, tailor, audit, and release employer-facing resumes using Rory Semeah's locked content, layout, branding, safety, ATS, and QA standards.
---

# /resume - Employer-Safe Resume Production Standard

## Purpose
Create or audit a one-page employer-facing resume that tells Rory Semeah's complete career story, remains ATS-readable, uses the page deliberately, and contains no internal HireWire or RedLantern Studios branding.

## Source of truth
Use `Rory_Semeah_AI_Technical_Product_Manager_Resume` as the content-density, chronology, hierarchy, spacing, and sizing reference. Do not copy its RedLantern footer or any studio branding.

## Open-source foundations
This standard incorporates proven patterns from:
- RenderCV: structured source data, strict schema validation, US Letter output, reproducible typography, consistent spacing, and text-based PDFs.
- Jake's Resume: 11 pt document base, compact one-page structure, full-width single-column layout, no footer, Unicode glyph mapping, and hidden-link treatment.
- dphang/resume and other minimalist open-source technical-resume templates: one-page prioritization, standard sections, restrained formatting, and selectable text.

These are references, not branding. Do not copy logos, personal content, or decorative identity from any template.

## Identity and branding rules
- The resume belongs to Rory Semeah, not RedLantern Studios or HireWire.
- RedLantern Studios may appear only as an employer inside Professional Experience.
- Never place RedLantern logos, slogans, footer bars, brand marks, company identity systems, or `Truth - Technology - Trajectory` anywhere on an employer-facing resume.
- Never place HireWire, Claudex, CTP, application-pack, candidate-profile, match-score, readiness, audit, or strategy labels on the resume.
- Use neutral professional styling. A target-company accent may be used sparingly for headings or thin rules only.
- No icons are required. Contact details must remain readable as plain text when extracted.

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

## Canonical page and typography formula
Use US Letter: 8.5 x 11 inches.

### Default geometry
- Top margin: 0.52 in
- Bottom margin: 0.52 in
- Left margin: 0.58 in
- Right margin: 0.58 in
- Usable width: approximately 7.34 in
- Usable height: approximately 9.96 in
- Footer: disabled
- Header: disabled except the candidate identity block

Allowed adjustment range after rendering:
- Horizontal margins: 0.50-0.68 in
- Vertical margins: 0.48-0.68 in
- Never go below 0.48 in solely to force content onto one page.

### Default type scale
Use a common, ATS-safe, open-source or system font with embedded/selectable glyphs. Preferred order:
1. Source Sans 3
2. Noto Sans
3. Liberation Sans
4. Arial or Helvetica fallback

Do not use decorative display fonts.

- Name: 20 pt, bold, line height 1.0
- Target title: 11.5 pt, semibold/bold, line height 1.0-1.05
- Specialty line: 9.2 pt, medium, line height 1.0
- Contact lines: 8.6 pt, regular, line height 1.0
- Section headings: 9.2 pt, bold, uppercase or small caps, line height 1.0
- Role title/company line: 8.9 pt, bold/semibold
- Role context line: 8.2 pt, medium or italic only when extractable
- Body accomplishments: 8.6 pt, regular, minimum 8.4 pt
- Education/certifications: 8.3-8.6 pt

Hard minimums:
- Body text: never below 8.4 pt
- Contact metadata: never below 8.1 pt
- Dates: never below 8.1 pt

### Spacing scale
- Paragraph line spacing: 1.02-1.08
- After name: 2-4 pt
- After target title: 1-3 pt
- After contact block: 5-7 pt
- Before section heading: 5-7 pt
- After section heading: 2-4 pt
- Between roles: 4-6 pt
- Between accomplishment paragraphs: 1.5-3 pt
- Section rule: 0.5-0.75 pt, optional, restrained

Do not solve overflow by globally shrinking all text. Adjust content priority and spacing first.

## Adaptive one-page fitting algorithm
Render first, then measure. The page must use 82-92% of usable vertical height. The preferred target is 86-89%.

### If page utilization is below 82%
Apply in this order:
1. Increase body text by 0.2 pt, up to 9.2 pt.
2. Increase role and section spacing within allowed ranges.
3. Expand verified high-value accomplishment context.
4. Restore omitted career progression or leadership detail.
5. Increase top/bottom margins only when the content already uses at least 86% after type correction.

Never add decorative whitespace, a footer bar, slogans, logos, or filler keywords.

### If page utilization exceeds 92% or content overflows
Apply in this order:
1. Remove redundant adjectives and repeated technology lists.
2. Consolidate overlapping accomplishment wording without removing role progression.
3. Reduce paragraph spacing in 0.5 pt steps.
4. Reduce line spacing toward 1.02.
5. Reduce body type in 0.1 pt steps, never below 8.4 pt.
6. Reduce margins only within the allowed range.
7. If the page still fails, rewrite for precision; never hide, clip, overlap, or scale the rendered page.

### Header title control
- Rory's name must remain the strongest visual element.
- Target title should normally fit one line.
- If a job title exceeds approximately 52 characters, use a truthful normalized title and place the exact posting title in the cover letter or file metadata.
- Never use an employer's entire verbose title as a giant headline.

## Layout rules
- Use a single-column, full-width layout.
- Do not use sidebars, text boxes, floating shapes, tables for primary reading order, skill meters, charts, portraits, logos, QR codes, or icon-only contact fields.
- Dates may be right-aligned only when extraction order remains correct.
- Keep sections in a conventional order: identity, summary, selected platforms/technologies, professional experience, education/certifications.
- Use the full width. Do not compress the resume into a narrow top block.
- No oversized footer, decorative bottom bar, or empty decorative area.
- The page must look balanced at 100% zoom and remain readable at normal laptop scale.

## ATS and PDF requirements
- Export a real text PDF, not an image or flattened canvas.
- All characters must be selectable and map correctly to Unicode.
- Embed fonts when possible.
- Preserve a sensible text extraction order: name, title, contact, summary, technologies, experience, education.
- Use plain-text email, phone, location, LinkedIn, GitHub, and portfolio URLs.
- Hyperlinks may be visually neutral, but their visible text must remain meaningful.
- No password protection, editing restrictions, annotations, comments, hidden layers, or internal metadata notes.
- File name format: `Rory_Semeah_<Company>_<Normalized_Role>_Resume.pdf`.

## Content rules
- Keep all major employers and role progression.
- Separate the three Ingram roles.
- Do not reduce loanDepot leadership to a token bullet.
- Lead with verified evidence and outcomes, not generic keyword lists.
- Tailoring may change the headline, summary emphasis, technology order, accomplishment order, and verified role-specific keywords.
- Tailoring may not invent tools, certifications, clearances, scope, metrics, or responsibilities.
- Never include `status to confirm` or any uncertainty note in the employer document.
- Prefer accomplishment paragraphs or compact bullets with evidence, scope, action, and outcome.
- Avoid keyword stuffing. A technology should appear where its verified context is clear.

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
- Body text is below 8.4 pt or metadata below 8.1 pt.
- Page utilization is outside 82-92% without a documented exception.
- More than roughly 18% of usable page height is unnecessarily empty.
- Text is clipped, overlapping, rasterized, or outside margins.
- Rory's career progression is flattened or incomplete.
- Ingram roles are improperly merged.
- loanDepot leadership context is materially absent.
- Unverified claims appear.
- PDF text extraction is broken, out of order, or ATS-hostile.
- A footer, slogan, decorative identity bar, logo, or internal label appears.

## QA workflow
1. Validate source content against the locked career record.
2. Generate the resume from structured data.
3. Export a selectable-text PDF.
4. Render the PDF to PNG at 200 DPI.
5. Inspect the entire page at 100% zoom.
6. Measure usable-height occupancy and verify 82-92% page utilization.
7. Inspect type sizes, spacing, wrapping, alignment, and title dominance.
8. Extract text and compare reading order to the source.
9. Run prohibited-phrase, branding, and internal-content checks.
10. Verify one page, complete chronology, truthful tailoring, and clean hierarchy.
11. Regenerate until every check passes.
12. Release only the final resume and cover letter to employer-facing folders.
13. Keep internal evaluation in a separate internal-only location.

## /hwsubs integration contract
- `/hwsubs` may analyze jobs and provide verified tailoring inputs.
- `/hwsubs` must delegate all resume generation, fitting, auditing, and verification to `/resume`.
- `/hwsubs` may not independently alter fonts, margins, spacing, chronology, branding, or resume content.
- `/hwsubs` receives a final resume only after `/resume verify` returns PASS.
- Any conflict is resolved in favor of this `/resume` skill.

## Batch rule
For Roles 30-65, every existing resume and combined application pack must be treated as rejected until it passes this skill. Replace files in local, Drive, and Claudex stores; do not mix corrected and rejected files in the same release folder.
