# Upstream Input Validation

This document reviews all upstream inputs to HireWire, their trustworthiness, provenance, editability, and risk of hallucination or unsupported claims.

## Inputs


### 1. User Account Data

- Source: Supabase Auth, user_profile
- Trust: High (tenant isolated, RLS enforced)
- Null/Malformed: Possible if incomplete signup
- Tenant Isolated: Yes
- User Approved: Yes
- Editable: Yes (profile)
- Hallucination Risk: Low
- Unsupported Claims: No
- Storage: Secure, Postgres
- Provenance: Auth events, profile edits

### 2. Career Context

- Source: evidence_library, source_resumes, user_profile, LinkedIn/manual imports
- Trust: Medium-High (user input, parsing, deduplication)
- Null/Malformed: Possible (bad parse, empty import)
- Tenant Isolated: Yes
- User Approved: Yes (is_user_approved flag)
- Editable: Yes
- Hallucination Risk: Medium (bad parse, user error)
- Unsupported Claims: Possible if not flagged
- Storage: Secure, Postgres
- Provenance: Resume import, manual entry, LinkedIn import

### 3. Job Intake

- Source: job URL, manual description, scrape, job board
- Trust: Medium (scrape can fail or be spoofed)
- Null/Malformed: Yes (bad URL, failed scrape)
- Tenant Isolated: Yes
- User Approved: Yes (manual edit)
- Editable: Yes
- Hallucination Risk: Medium (scrape errors)
- Unsupported Claims: Possible if not flagged
- Storage: Secure, Postgres
- Provenance: Intake event, scrape log

### 4. AI Inputs

- Source: Prompts for analysis, generation, coach, quality, package, humanizer, red team
- Trust: Medium (prompt injection risk, model drift)
- Null/Malformed: Yes (bad prompt, model error)
- Tenant Isolated: Yes (context filtered)
- User Approved: Yes (review step)
- Editable: No (system prompts)
- Hallucination Risk: Medium-High (AI risk)
- Unsupported Claims: Possible if not grounded
- Storage: Not stored unless output
- Provenance: Prompt logs

### 5. System Inputs

- Source: Stripe, auth, usage, audit, analytics
- Trust: High (system events)
- Null/Malformed: Possible (webhook error)
- Tenant Isolated: Yes
- User Approved: N/A
- Editable: No
- Hallucination Risk: None
- Unsupported Claims: No
- Storage: Secure, Postgres
- Provenance: Event logs
