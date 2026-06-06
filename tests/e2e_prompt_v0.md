# HireWire v0 E2E Evidence-to-Readiness Test Prompt

## Purpose
Simulate a full user journey for v0, verifying:
- Evidence upload/approval
- Job posting
- Requirement-to-evidence mapping
- Gap detection
- Coach gating
- Document generation
- Readiness/governance gates
- Provenance receipts

## Steps

1. **Simulate User Signup**
   - Email: `johnnytestv0@yopmail.com`
   - Password: `TestPass123!`
   - Confirm user exists or is created.

2. **Upload Sample Resume / Evidence**
   - Add two evidence records:
     - `Full Stack Developer at SaaSify` (work_experience, high confidence, approved)
     - `MBA, Business Analytics` (education, high confidence, approved)
   - Log evidence IDs and count.

3. **Add Job Post**
   - Job: `Product Owner (SaaS)` at `V0 AI`
   - Requirements: `SaaS experience`, `MBA`, `Scrum certification`
   - Responsibilities: `Lead agile teams`, `Drive product roadmap`
   - Log job details.

4. **Map Evidence to Job Requirements**
   - Map evidence to requirements:
     - `SaaS experience` → `Full Stack Developer at SaaSify`
     - `MBA` → `MBA, Business Analytics`
     - `Scrum certification` → (no evidence)
   - Compute and log:
     - Match score (percentage of requirements met)
     - Open gaps (requirements with no evidence)
     - Mapping details

5. **Coach Step**
   - If any open gaps, log: `Coach required: clarify <gap list>`
   - Else, log: `Coach: All requirements met.`

6. **Generate Documents / Gap Analysis**
   - Simulate document generation:
     - Resume chars: 410
     - Cover letter chars: 250
     - Generation status: `ready` if no gaps, else `needs_review`
     - Governance: passed, drift score 0
   - Log all values.

7. **Readiness & Governance Gates**
   - Log gate receipts:
     - evidence_verified: true
     - rls_scope: service-role simulation scoped by user_id
     - quality_passed: true
     - governance_passed: true
     - readiness: generation status

8. **Provenance Receipts**
   - Log all provenance:
     - simulation_run_id: v0-<timestamp>
     - user_id
     - job_id
     - evidence_ids
     - match_score
     - open_gaps
     - coach_step
     - generated_resume_chars
     - generated_cover_letter_chars

## Expected Output
- Each step logs a clear, structured receipt (JSON or object)
- Match score and open gaps are correct
- Coach step triggers if any gap
- Provenance receipt contains all IDs and metrics

---

## How to Run

1. Run the script:
   ```sh
   npx tsx tests/simulate_full_flow_v0.ts
   ```
2. Review the console output for all receipts and step logs.
3. Confirm all expected outputs and receipts are present and correct.
