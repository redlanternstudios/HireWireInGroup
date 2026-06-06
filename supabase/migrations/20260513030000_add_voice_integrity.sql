-- HireWire Voice Integrity System: DB migrations

alter table source_resumes
add column if not exists voice_profile jsonb,
add column if not exists voice_extracted_at timestamptz,
add column if not exists voice_source_confidence numeric,
add column if not exists voice_source_quality text;

alter table user_profile
add column if not exists active_voice_profile jsonb,
add column if not exists default_voice_mode text default 'preserve_original',
add column if not exists voice_locked boolean default false;

alter table jobs
add column if not exists voice_mode text default 'preserve_original',
add column if not exists voice_profile_snapshot jsonb,
add column if not exists voice_drift_result jsonb,
add column if not exists voice_integrity_passed boolean,
add column if not exists voice_review_status text default 'needs_review',
add column if not exists voice_reviewed_at timestamptz;

alter table application_events
add column if not exists voice_mode text,
add column if not exists voice_drift_level text,
add column if not exists voice_integrity_passed boolean,
add column if not exists voice_override_reason text;
