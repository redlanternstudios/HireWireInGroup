# Coach 3x Deep Audit

Audit the full HireWire coach loop like a user and like a QA reviewer.
Do not edit files.

Read first:

- `CLAUDE.md`
- `.claude/context/product.md`
- `.claude/context/data-contracts.md`
- `.claude/context/routes.md`
- `.claude/context/verification.md`
- `docs/PROOF_STANDARD.md`

Use the user supplied criteria below as the audit contract:

What the coach should feel like:

1. Evidence first, not vibes first.
2. Clear gap reporting before generation.
3. Output grounded in real experience, links, and portfolio.
4. Visible reason for every recommendation.
5. Consistent tone like a sharp recruiter, not an interrogator.

What the coach should not feel like:

1. Repeated or oversized context dumps.
2. Cross examination instead of guided coaching.
3. Invented or polished but unsupported claims.
4. A resume that stops short when source material has more depth.
5. Different parts of the flow disagreeing about the same fact.

CTP this 3x deep, upstream and downstream.

Upstream checks:

- job post capture
- job analysis
- requirement extraction
- match score creation
- fit threshold logic
- gap detection before generation
- coach trigger below threshold
- user prompt quality

Midstream checks:

- resume intake
- LinkedIn intake
- GitHub intake
- websites and social links intake
- profile normalization
- evidence ranking
- claim provenance
- coach tone and autonomy
- gap report quality
- user controlled confirmation and skip paths

Downstream checks:

- resume generation
- cover letter generation
- quality gate
- governance gate
- unsupported skill removal
- blocked claim handling
- persistence to `jobs.generated_resume`
- persistence to `jobs.generated_cover_letter`
- readiness updates
- apply gate compatibility
- user visible receipts and errors

For each stage, verify:

1. what data enters
2. what logic transforms it
3. what leaves the stage
4. where it is stored
5. what the user sees
6. what can fail
7. whether the failure is honest and helpful

Inspect at minimum:

- `app/(dashboard)/jobs/[id]/evidence-match/page.tsx`
- `app/(dashboard)/jobs/[id]/documents/page.tsx`
- `app/(dashboard)/coach/page.tsx`
- `app/api/generate-documents/route.ts`
- `app/api/jobs/[id]/evidence-map/route.ts`
- `app/api/jobs/[id]/coach-step/route.ts`
- `app/api/jobs/[id]/outcome/route.ts`
- `lib/coach/`
- `lib/readiness/evaluator.ts`
- `lib/evidence/`
- `lib/actions/apply.ts`
- `docs/ops/GENERATION_INTEGRITY_PLAN.md` if present
- any audit or QA docs that touch coach, evidence, generation, or readiness

Determine:

- whether the coach is truly evidence first
- whether the coach feels helpful, not interrogative
- whether profile, GitHub, LinkedIn, and links are actually used as retrieval context
- whether the generated resume preserves real depth
- whether gap reporting is visible before generation
- whether unsupported or invented claims are blocked
- whether reasons are visible when content is removed or blocked
- whether downstream readiness and apply flows stay consistent with coach output
- whether any route, page, or component computes its own competing truth

Return:

1. user experience verdict
2. upstream audit
3. midstream audit
4. downstream audit
5. broken links between UI, API, DB, and readiness
6. P0, P1, P2 fixes
7. what is already strong
8. what feels noisy or misleading
9. final go or no go

Every major claim must include file references.
