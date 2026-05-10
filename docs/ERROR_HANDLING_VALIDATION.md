# Error Handling Validation

This document reviews solution-wide error handling for category, code, safe user message, next action, and branding.


## Error Categories

- AUTH_ERROR
- VALIDATION_ERROR
- NOT_FOUND_ERROR
- PERMISSION_ERROR
- SUPABASE_ERROR
- AI_PROVIDER_ERROR
- AI_OUTPUT_ERROR
- SCRAPE_ERROR
- DOCUMENT_GENERATION_ERROR
- FILE_PARSE_ERROR
- READINESS_ERROR
- QUALITY_GATE_ERROR
- APPLICATION_ERROR
- PAYMENT_ERROR
- RATE_LIMIT_ERROR
- NETWORK_ERROR
- INTEGRATION_ERROR
- UNKNOWN_ERROR

## Validation

- Every error has code, category, safe user message, next action, correlation ID if possible
- No raw stack traces
- No provider leakage
- No dead end messages
