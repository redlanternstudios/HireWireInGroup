# HireWire Alignment Audit Protocol

## Purpose
Ensure every code change, feature, and migration is fully aligned with CLAUDE.md and the live Supabase schema. Prevents drift, dead code, and security gaps.

## Audit Steps
1. Run `scripts/precommit-claude-md-schema-check.sh` before every commit.
2. Run `scripts/schema-drift-check.sh` before every deploy or major merge.
3. Use the PR checklist in `.github/PULL_REQUEST_TEMPLATE.md` for every pull request.
4. Run the following v0 audit prompt after every major merge:

---

**Prompt:**

You are an expert product and codebase auditor. Your task is to review the current state of the HireWire Career Intelligence OS implementation for strict alignment with the canonical CLAUDE.md specification and the intended v0 product vision.

- Audit all routes, pages, API endpoints, and supporting modules for:
  - Full compliance with CLAUDE.md (auth, tenant isolation, soft delete, naming, readiness logic, etc.)
  - UI/UX alignment with the Career Intelligence OS north star (progressive disclosure, actionable feedback, no data dumps)
  - Correct implementation of all intelligence modules (Resume Integrity, Consistency Engine, AI Content Detector, Verification Simulator, Gap Analyzer)
  - Proper data persistence in the new `career_*` tables, with no legacy or dead system usage
  - Sidebar and navigation links for all new modules
  - Empty state, error, and loading handling per spec
  - No v0/local repo drift: every referenced file and feature must exist locally and match the spec

- Deliverables:
  - A table of all detected misalignments, missing features, or spec violations, with file/route references
  - Severity and impact assessment for each issue
  - Concrete, actionable recommendations for each gap
  - A summary of overall solution health and next steps to reach full alignment

---

## Enforcement
- Commits and merges are blocked if any P0/P1 issues are found.
- All contributors must read CLAUDE.md and this protocol before contributing.
