# BRAND_SURFACE_VALIDATION.md

# Verified: 2026-05-10 | Branch: v0/rsemeah-8ad75be8

## Scope

Every surface where HireWire brand appears: logo, metadata, favicon, error pages, auth pages, sidebar. Verify no emoji icons, no generic placeholder brand.

## Findings

### Logo Asset

- **Path:** `/public/brand/hirewire-logo.png` — barbed wire logo saved
- **Component:** `components/hirewire-logo.tsx` — exports `color | white | red | dark` variants
- **Sidebar:** Uses `variant="color"` — full barbed wire logo
- **Auth layout:** Logo above auth card — `variant="color"`
- **not-found:** HireWireLogo component rendered
- **global-error:** Inline `<img>` (correct — Next.js Image unavailable in global-error boundary)
- **Status:** PASS

### Metadata

- `app/layout.tsx`: Title `HireWire — AI-Powered Career OS`, template `%s | HireWire`
- OpenGraph: site name, title, description — all set
- Icons: `/brand/favicon.ico`, `/brand/apple-touch-icon.png` — paths set (assets needed from design team)
- **Status:** PASS (favicon asset pending from design team — see BRAND_ASSET_REQUESTS.md)

### Emoji Icons — Eliminated

- Sidebar category section headers: Removed bordered icon-box containers, icons now render directly
- All Jobs, Ready to Apply, Applied, Materials, Career Context, Job Detail pages: Icon boxes removed
- dead `iconBg` field removed from evidence config
- Grep for emoji characters in `.tsx`/`.ts` files: 0 results (only in `.md` files and test scripts)
- **Status:** PASS

### Nav Label

- Sidebar: "Evidence" → "Career Context" — updated
- Page title: "Evidence Library" → "Career Context" — updated
- Route `/evidence` unchanged — correct
- **Status:** PASS

### Console Log Prefix

- All `[v0]` prefixes replaced with `[hirewire]` — 2 instances fixed
- **Status:** PASS

## Overall: PASS — 3 fixes applied. Favicon asset pending design team delivery.
