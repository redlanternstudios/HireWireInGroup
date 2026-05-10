# HireWire Error Handling Architecture

This document describes the solution-wide error handling system for HireWire, including error philosophy, taxonomy, types, factories, safe responses, logging, correlation IDs, UI components, boundaries, and implementation order. See CLAUDE.md for full requirements and acceptance criteria.

## Key Principles
- Every error is classified, logged, user-friendly, actionable, traceable, and recoverable where possible.
- No raw stack traces or sensitive data are exposed to users.
- Consistent error shapes for server actions and API routes.
- Correlation IDs for all errors.

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

## Error Shape
See `lib/errors/types.ts` for the canonical error shape and fields.

## AppError Class
See `lib/errors/app-error.ts` for the implementation.

## Error Factories
See `lib/errors/factory.ts` for helpers to create categorized errors.

## Safe Responses
See `lib/errors/response.ts` for helpers to return safe error shapes to the client.

## Logging
See `lib/errors/logger.ts` for logging patterns and context.

## Correlation IDs
See `lib/errors/correlation.ts` for utilities.

## UI Components
See `components/error/` for ErrorCard, InlineError, FormError, RetryPanel, EmptyWithAction.

## Error Boundaries
See `app/error.tsx`, `app/global-error.tsx`, `app/not-found.tsx` for global and route error handling.

## Implementation Order
1. Types, factories, responses, logger, correlation IDs, UI components, global error boundaries.
2. Apply to server actions, API routes, Supabase, AI, scraping, document export, readiness, apply action.
3. Add test plan and documentation.

## Acceptance Criteria
- All major errors are categorized and logged.
- Users see actionable, friendly messages.
- Developers get traceable logs with correlation IDs.
- No fake success or stack traces exposed.
- See CLAUDE.md for full criteria.
