# HireWire Alpha — Schema Migrations

> **Generated**: 2026-06-03
> **Live Supabase**: 131 tables verified
> **Migrations in repo**: 34 files

---

## CRITICAL FINDING: NO NEW TABLES NEEDED

After inspecting the live Supabase schema, all tables required for Alpha **already exist**.

### Tables That EXIST

| Table | Alpha Role | Status |
|-------|------------|--------|
| `jobs` | Core job tracking | ✓ Has `resume_provenance`, `governance_passed`, `evidence_map` |
| `job_analyses` | Requirements extraction | ✓ Has `requirements_structured`, `strengths_json`, `gaps_json` |
| `job_scores` | Fit scoring | ✓ Complete |
| `evidence_library` | User evidence | ✓ Has `is_user_approved`, `proof_snippet` |
| `coach_sessions` | Coach conversations | ✓ Complete |
| `coach_messages` | Message history | ✓ Complete |
| `coach_evidence_drafts` | Draft evidence from coach | ✓ Complete |
| `prove_fit_decisions` | User proof confirmations | ✓ Has `requirement_id`, `evidence_id`, `decision` |
| `generation_governance_runs` | Governance audit | ✓ Complete |
| `generation_quality_checks` | Quality checks | ✓ Complete |
| `governance_claim_verdicts` | Per-claim verdicts | ✓ Has `claim_text`, `evidence_exists`, `claim_grounded` |
| `document_generation_traces` | Generation provenance | ✓ Complete |
| `job_requirement_models` | Context engine requirements | ✓ Complete |

### Tables That DO NOT EXIST (And Why We Don't Need Them)

| Table | Why Not Needed |
|-------|----------------|
| `job_requirements` | Use `job_analyses.requirements_structured` — already populated by analyze |
| `generated_claims` | Use `governance_claim_verdicts` — already has claim text, evidence linkage, grounded status |
| `proof_cases` | Abstraction not needed — `prove_fit_decisions` handles proof tracking |
| `proof_statements` | Not needed — evidence is in `evidence_library` |
| `claim_evidence_links` | Not needed — linkage is in `resume_provenance` and `governance_claim_verdicts` |

---

## SCHEMA VERIFICATION QUERIES

Codex should run these to verify before any code changes:

### 1. Verify Coach Tables Exist

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('coach_sessions', 'coach_messages', 'coach_evidence_drafts')
ORDER BY table_name;
```

**Expected**: 3 rows

### 2. Verify Governance Tables Exist

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('generation_governance_runs', 'generation_quality_checks', 'governance_claim_verdicts')
ORDER BY table_name;
```

**Expected**: 3 rows

### 3. Verify jobs Has Governance Columns

```sql
SELECT column_name
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'jobs'
AND column_name IN ('resume_provenance', 'governance_passed', 'governance_drift_score', 'governance_version', 'last_governance_run_id', 'evidence_map')
ORDER BY column_name;
```

**Expected**: 6 rows

### 4. Verify prove_fit_decisions Structure

```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'prove_fit_decisions'
ORDER BY ordinal_position;
```

**Expected columns**: `id`, `user_id`, `job_id`, `requirement_id`, `evidence_id`, `decision`, `requirement_text`, `claim_text`, etc.

### 5. Verify governance_claim_verdicts Structure

```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'governance_claim_verdicts'
ORDER BY ordinal_position;
```

**Expected columns**: `id`, `user_id`, `job_id`, `run_id`, `claim_text`, `evidence_exists`, `claim_grounded`, `confidence`, etc.

---

## IF SCHEMA DRIFT IS FOUND

Only if the verification queries fail, apply idempotent fixes:

### Coach Tables (if missing)

```sql
-- Only if coach_sessions is missing
CREATE TABLE IF NOT EXISTS coach_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  job_id uuid REFERENCES jobs(id) ON DELETE CASCADE,
  gap_requirement text,
  gap_requirement_id text,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Only if coach_messages is missing
CREATE TABLE IF NOT EXISTS coach_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES coach_sessions(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Only if coach_evidence_drafts is missing
CREATE TABLE IF NOT EXISTS coach_evidence_drafts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id uuid REFERENCES coach_sessions(id) ON DELETE CASCADE,
  job_id uuid REFERENCES jobs(id) ON DELETE CASCADE,
  requirement_id text,
  proof_snippet text,
  source_title text,
  source_type text,
  skills text[],
  confidence_level text,
  status text DEFAULT 'draft',
  confirmed_row_id uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- RLS
ALTER TABLE coach_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE coach_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE coach_evidence_drafts ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users own coach sessions" ON coach_sessions FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Users own coach messages" ON coach_messages FOR ALL USING (
  session_id IN (SELECT id FROM coach_sessions WHERE user_id = auth.uid())
);
CREATE POLICY "Users own coach evidence drafts" ON coach_evidence_drafts FOR ALL USING (user_id = auth.uid());
```

### Governance Tables (if missing)

```sql
-- Only if governance_claim_verdicts is missing
CREATE TABLE IF NOT EXISTS governance_claim_verdicts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  job_id uuid NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  run_id uuid REFERENCES generation_governance_runs(id) ON DELETE CASCADE,
  document_type text,
  claim_text text NOT NULL,
  evidence_exists boolean DEFAULT false,
  claim_grounded boolean DEFAULT false,
  metrics_traceable boolean DEFAULT false,
  confidence text,
  cited_evidence_id uuid REFERENCES evidence_library(id),
  failure_reason text,
  created_at timestamptz DEFAULT now()
);

-- RLS
ALTER TABLE governance_claim_verdicts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own claim verdicts" ON governance_claim_verdicts FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert own claim verdicts" ON governance_claim_verdicts FOR INSERT WITH CHECK (user_id = auth.uid());
```

---

## INDEXES (Add if missing)

```sql
-- Coach performance
CREATE INDEX IF NOT EXISTS idx_coach_sessions_user_job ON coach_sessions(user_id, job_id);
CREATE INDEX IF NOT EXISTS idx_coach_messages_session ON coach_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_coach_evidence_drafts_session ON coach_evidence_drafts(session_id);

-- Governance lookups
CREATE INDEX IF NOT EXISTS idx_governance_claim_verdicts_job ON governance_claim_verdicts(job_id);
CREATE INDEX IF NOT EXISTS idx_prove_fit_decisions_job ON prove_fit_decisions(job_id, requirement_id);
```

---

## ROLLBACK NOTES

All SQL above uses `IF NOT EXISTS` and `IF NOT EXISTS` patterns. To rollback:

```sql
-- Only if you need to undo (dangerous)
-- DROP TABLE IF EXISTS coach_messages;
-- DROP TABLE IF EXISTS coach_evidence_drafts;
-- DROP TABLE IF EXISTS coach_sessions;
-- DROP TABLE IF EXISTS governance_claim_verdicts;
```

**Do not run DROP statements unless explicitly needed for recovery.**

---

## MIGRATION FILE NAMING

If any migration is needed, use this naming convention:

```
supabase/migrations/YYYYMMDDHHMMSS_alpha_schema_drift_fix.sql
```

Example: `20260603180000_alpha_schema_drift_fix.sql`

---

## SUMMARY

| Action | Status |
|--------|--------|
| Create job_requirements table | **NOT NEEDED** |
| Create generated_claims table | **NOT NEEDED** |
| Create proof tables | **NOT NEEDED** |
| Verify coach tables exist | **RUN QUERY** |
| Verify governance tables exist | **RUN QUERY** |
| Add indexes if missing | **OPTIONAL** |

The live schema is complete for Alpha. Run verification queries before any code changes.
