# Next.js Component Audit Prompt

Audit this component for Next.js 16 App Router. Apply HireWire frontend rules from CLAUDE.md §12.

Check:
1. Server vs client boundary — is `"use client"` present only where hooks or browser APIs are used?
2. Hooks in wrong context (hooks cannot run in Server Components)
3. `useEffect` for primary data fetching in a new page (prefer Server Component fetch)
4. Prop drilling that should be a Server Component pattern instead
5. Missing loading state (Suspense boundary or skeleton)
6. Missing empty state — must be actionable, not blank
7. Accessibility gaps (missing aria-label, non-semantic elements)
8. Mobile layout — Tailwind v4 responsive utilities
9. Class naming — using `cn()` for conditionals, `hw-*` classes where they exist
10. shadcn/ui primitives available but not used
11. Readiness authority: component must not compute readiness independently
12. Data source: component must not read from `generated_documents` table

Return:
- **Component purpose**
- **Current problems** (with line references)
- **Minimal safe patch**
- **Placement**: `app/`, `components/`, `lib/`, or server action
- **Upstream impact**
- **Downstream impact**
