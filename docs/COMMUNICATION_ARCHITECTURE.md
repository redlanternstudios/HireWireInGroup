# HireWire Communication Architecture

## Purpose
This document defines the solution-wide communications system for HireWire, governing every message the product sends or displays, including UI copy, coach responses, status updates, system alerts, empty states, error recovery, onboarding, readiness blockers, next best actions, emails, follow ups, recruiter messages, referrals, application notes, notifications, billing emails, and support replies.

## Core Principles
- Every message has a purpose, tone, trigger, audience, and next action.
- No random copy in components; all messages are registered and governed.
- Internal and external messages share one architecture.
- No message claims readiness, achievements, or application status unless proven by data.
- All external messages require approval and preview before sending.

## Architecture Overview
- **lib/comms/types.ts**: Core types for domains, audience, intent, channel, tone, and message shape.
- **lib/comms/registry.ts**: Central registry for all internal system messages and UI copy.
- **lib/comms/render.ts**: Message rendering and variable interpolation.
- **lib/comms/tone.ts**: Tone helpers and descriptions.
- **lib/comms/client-messages.ts**: Client-facing message resolver.
- **lib/comms/coach-rules.ts**: Coach response modes and rules.
- **lib/comms/external-templates.ts**: External communication templates (recruiter, referral, follow up, etc.).
- **lib/comms/notifications.ts**: Notification templates and logic.

## Domains
- PRODUCT_UI, SYSTEM_STATUS, ERROR_RECOVERY, AI_COACH, NOTIFICATIONS, EMAIL_TRANSACTIONAL, EMAIL_CAREER_OUTREACH, APPLICATION_COMMS, INTERVIEW_COMMS, BILLING_COMMS, SUPPORT_COMMS, INTERNAL_ADMIN, INTEGRATION_COMMS

## Audience Types
- USER, RECRUITER, HIRING_MANAGER, REFERRAL_CONTACT, COACH_OR_MENTOR, SUPPORT_TEAM, SYSTEM_ADMIN, BILLING_CONTACT

## Intent Types
- INFORM, GUIDE, WARN, CONFIRM, REQUEST, REMIND, ESCALATE, SEND_EXTERNAL, SUMMARIZE, COACH, SELL_OR_UPGRADE

## Channels
- in_app, toast, banner, modal, email, sms, push, chat, external_email, exported_text, system_log, audit_event

## Tone
- calm, direct, strategic, encouraging, formal, warm, urgent, neutral

## Message Lifecycle
1. Registered in registry or template file
2. Rendered with variables as needed
3. Displayed, sent, or previewed in the appropriate channel
4. External messages require approval and preview

## Safety and Truth Rules
- Never fabricate achievements, certifications, employment, or application status.
- Never claim readiness unless proven by readiness logic.
- All external communications default to draft/approval mode.

## Integration Points
- Error system, coach, empty states, notifications, writing, package builder, onboarding, billing, support, and all user-facing flows.

## Future Extensions
- Email provider integration, SMS/push, communication preferences, audit logging.
