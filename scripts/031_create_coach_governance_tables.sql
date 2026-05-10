-- Coach Governance Tables Proposal
-- Check existing tables before running. Add compatibility bridges if needed.

-- job_requirements
CREATE TABLE IF NOT EXISTS job_requirements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid REFERENCES jobs(id) ON DELETE CASCADE,
  requirement_text text NOT NULL,
  requirement_type text,
  priority integer,
  keywords text[],
  confidence float,
  created_at timestamptz DEFAULT now()
);

-- evidence_items
CREATE TABLE IF NOT EXISTS evidence_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  source_type text,
  source_id text,
  title text,
  content text,
  skills text[],
  confidence float,
  created_at timestamptz DEFAULT now()
);

-- coach_claims
CREATE TABLE IF NOT EXISTS coach_claims (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  claim_type text,
  claim_text text,
  truth_state text,
  confidence float,
  source text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- claim_evidence_links
CREATE TABLE IF NOT EXISTS claim_evidence_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  claim_id uuid REFERENCES coach_claims(id) ON DELETE CASCADE,
  evidence_id uuid REFERENCES evidence_items(id) ON DELETE CASCADE,
  support_strength float,
  created_at timestamptz DEFAULT now()
);

-- claim_requirement_links
CREATE TABLE IF NOT EXISTS claim_requirement_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  claim_id uuid REFERENCES coach_claims(id) ON DELETE CASCADE,
  requirement_id uuid REFERENCES job_requirements(id) ON DELETE CASCADE,
  match_strength float,
  created_at timestamptz DEFAULT now()
);

-- coach_generation_runs
CREATE TABLE IF NOT EXISTS coach_generation_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  job_id uuid REFERENCES jobs(id) ON DELETE CASCADE,
  artifact_type text,
  generation_intent text,
  strategy_profile text,
  evidence_locked boolean,
  status text,
  quality_passed boolean,
  drift_score float,
  created_at timestamptz DEFAULT now()
);

-- artifact_versions
CREATE TABLE IF NOT EXISTS artifact_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  generation_run_id uuid REFERENCES coach_generation_runs(id) ON DELETE CASCADE,
  job_id uuid REFERENCES jobs(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  artifact_type text,
  version_number integer,
  title text,
  snapshot_markdown text,
  snapshot_json jsonb,
  quality_report jsonb,
  change_log text,
  created_at timestamptz DEFAULT now()
);

-- artifact_outcomes
CREATE TABLE IF NOT EXISTS artifact_outcomes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  artifact_version_id uuid REFERENCES artifact_versions(id) ON DELETE CASCADE,
  job_id uuid REFERENCES jobs(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  outcome_type text,
  outcome_notes text,
  created_at timestamptz DEFAULT now()
);
