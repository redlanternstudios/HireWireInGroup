# HireWire Rory Unbiased E2E Receipt 20260707

## Objective

Use Rory Semeah as the candidate example without biasing the job post toward Rory or toward product management.

## CTP Lock

GOAL: HireWire reads the job post first, breaks requirements into proof targets, then matches or asks for candidate proof one by one.

CONSTRAINTS: no custom fit bias, no product manager only bias, no job written around the candidate, no synthetic candidate evidence.

FORMAT: job requirement to matched proof to gap question to enriched evidence to resume claim.

FAILURE: if the system starts from make Rory look good, it becomes a generic resume bot instead of HireWire.

## Reality Check

VERIFIED: Previous synthetic receipt was not acceptable as product proof.

VERIFIED: The disposable account contained synthetic evidence from earlier tests. The clean run deleted 16 prior evidence rows before uploading Rory resume evidence.

VERIFIED: The clean run used Rory resume PDF text extracted from `/Users/rorysemeah/Downloads/Rory Semeah's Resume.pdf`.

VERIFIED: Resume upload returned 200 and inserted 13 evidence rows from Rory resume.

VERIFIED: The neutral job post was Lead Engineering Manager, SaaS at Innovate AI.

VERIFIED: The generated job result was `needs_review`, not application ready.

## Receipts

Account: `hirewire.cdx.20260707183739@yopmail.com`

Source resume: `/Users/rorysemeah/Downloads/Rory Semeah's Resume.pdf`

Extracted resume text length: 5,716 characters

Job post URL: `http://127.0.0.1:4321/hirewire-e2e-engineering-manager-existing-fixture-20260707.html?run=1783495086272`

HireWire job URL: `http://localhost:3000/jobs/3c10b02c-7265-41ad-b241-1e6b3d30cbf2`

Resume output: `docs/ops/HIREWIRE_RORY_UNBIASED_GENERATED_RESUME_20260707.txt`

## Evidence Created

1. Technical Product Manager at RedLantern Studios
2. Technical Product Manager at Ingram Micro
3. Product Owner / Associate Integration Lead at Ingram Micro
4. Application Support Supervisor at loanDepot
5. M.S. Information Systems, University of Phoenix
6. B.S. Business Management, University of Phoenix
7. Professional Skills
8. SAFe, Scaled Agile Framework
9. Certified Scrum Master
10. CPMAI, Certified Product Manager AI in progress
11. By Red OS
12. HireWire
13. Authentic Hadith

## Result

Job role: Lead Engineering Manager, SaaS

Company: Innovate AI

Score: 82

Fit: HIGH

Status: needs_review

Generation status: needs_review

Quality passed: false

Generated resume length: 1,253 characters

Generated cover letter length: 1,884 characters

## Quality Gate Findings

VERIFIED: Quality check failed even though generation returned 200.

VERIFIED: The quality checker flagged `various tenants` as vague.

VERIFIED: The quality checker marked two weak bullets:

1. Redesigned support workflows and introduced CI/CD automation, clearing a 1,000+ ticket backlog and maintaining over 95% SLA compliance.
2. Coordinated complex SAP and cloud platform migrations, ensuring seamless integration and enhanced system reliability.

PARTIAL: The generated resume is much better than the synthetic receipt because it uses Rory only, but it is still not application ready.

UNKNOWN: The coach enrichment loop still needs a dedicated proof receipt showing unresolved requirements converted into questions, then approved evidence, then regenerated resume claims.

## Product Findings

VERIFIED: Resume upload can now recover when AI parsing stalls because `app/api/resume/upload/route.ts` has a route level timeout and fallback parser.

VERIFIED: Requirement first matching exists in the job analysis result. It produced capability packets and matched evidence titles against requirements.

PARTIAL: The generation layer still compresses the requirement proof map into a generic resume too aggressively.

VERIFIED: The correct next product test is not another generic generation test. It is a coach loop test:

1. Parse job requirements.
2. Show each required proof target.
3. Match existing evidence.
4. Ask candidate only for missing or weak proof.
5. Save enriched evidence.
6. Regenerate claims from approved proof only.

