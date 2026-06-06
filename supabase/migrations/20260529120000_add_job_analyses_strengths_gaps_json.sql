-- Rich explainable fit data saved from analyzeJobCore.
-- strengths_json: FitStrength[] from calculateExplainableFit()
-- gaps_json: DetectedGap[] from detectGaps()
-- Safe to re-run.

alter table public.job_analyses
  add column if not exists strengths_json jsonb,
  add column if not exists gaps_json jsonb;
