# ContextEngine Backbone

ContextEngine is the repo-native provenance layer for ATS-safe parsing, evidence
normalization, capability inference, job requirement modeling, gap matching, and
claim validation.

It is a mirror-first backbone. Existing `source_resumes`, `evidence_library`,
`job_analyses`, `job_scores`, governance, and readiness flows continue to work.
ContextEngine records are written best-effort when the migration is present and
the feature flag is enabled.

## Feature Flag

Enable runtime route wiring with:

```bash
CONTEXT_ENGINE_ENABLED=true
```

or for client-aware environments:

```bash
NEXT_PUBLIC_CONTEXT_ENGINE_ENABLED=true
```

## Provenance Model

The graph connects:

- source artifact
- extracted evidence item
- normalized entity
- inferred capability
- job requirement
- generated claim
- claim verdict

Generated content should never be saved without either evidence references or a
clear generic-framing designation. Prior generated documents are low-trust and
must not be the sole support for new resume claims. Coach memory is coach-only or
interview-only until the user confirms it as evidence.

## Extension Points

- Profile and resume sources: `buildProfileContext`
- Job posts: `buildJobContext`
- Matching: `runContextGapMatch`
- Generation governance: `validateGeneratedClaims`
- Persistence mirrors: `mirrorProfileContext`, `mirrorJobContext`,
  `mirrorGapMatches`, `mirrorClaimVerdicts`

## Manual Checks

1. Upload a resume with real metrics and tools.
2. Confirm `context_sources`, `context_evidence_items`,
   `context_normalized_entities`, and `context_capabilities` receive mirror rows.
3. Analyze a job and confirm `job_requirement_models` receives rows.
4. Generate documents and confirm blocked claims do not save, while verdicts are
   mirrored into `context_claim_verdicts`.
