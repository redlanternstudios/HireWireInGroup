# v0 UI Alignment Prompt

You are improving UI only. Backend logic, routes, and data contracts are frozen.

Do NOT:
- Build new features
- Change route behavior or API calls
- Rename or remove database fields
- Remove or change existing props
- Invent new data requirements
- Touch `lib/readiness/evaluator.ts`, `lib/actions/apply.ts`, or any generation route

Design direction:
- Premium editorial — Supreme × Off-White × Apple influence
- Clean red-accented system (`hw-*` tokens where defined)
- Strong visual hierarchy, generous whitespace
- No generic SaaS look, no AI-generated text aesthetic
- Mobile first — Tailwind v4 responsive breakpoints
- Empty states must be actionable (link or CTA, not just text)
- Calm but capable — every CTA should feel intentional

Stack:
- Tailwind CSS v4 (use `@apply` and utility classes, not v3 `theme()` calls)
- shadcn/ui primitives (use existing components, don't reinvent)
- `cn()` for conditional classes
- `"use client"` only if component needs event handlers, hooks, or browser APIs

Return:
- **Visual changes only** — exact file and line
- **Components touched**
- **Props preserved** — confirm no prop changes
- **Backend untouched** — confirm no logic changes
- **Assumptions** — any design decisions made without explicit direction
