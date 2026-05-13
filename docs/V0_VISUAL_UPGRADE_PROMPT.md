# v0 Visual Upgrade Prompt for HireWire

Use this prompt in v0 or any external design/AI agent to drive a full visual and layout upgrade for all major HireWire dashboard pages, based on the global direction and page-by-page critique above.

---

**Prompt:**

> Redesign the currently shown HireWire dashboard pages for stronger desktop visual appeal, hierarchy, contrast, and product purpose.
>
> Pages to improve:
> Dashboard / Home
> All Jobs
> Ready to Apply
> Applications
> Career Context
> Analytics
> Activity Log
> Profile
>
> Current issue:
> The pages are functional but visually stale. Most pages use the same narrow centered layout, pale cards, weak contrast, and large empty desktop space. The UI feels like a mobile app stretched across a web canvas. It does not yet feel like a premium Career OS.
>
> Product context:
> HireWire is a truth based AI Career OS. It helps users build Career Context, analyze jobs, generate truthful application packages, pass quality review, track applications, and learn from outcomes.
>
> Global design goal:
> Make each page feel like a distinct Career OS workspace while keeping one coherent visual system.
>
> Design language:
> Premium but calm
> Career command center
> Apple clarity
> CRM usefulness
> HireWire red accents
> Soft off white background
> White or cream cards
> Subtle shadows
> Rounded 2xl or 3xl surfaces
> Clear contrast between page, cards, panels, and inputs
> Stronger section hierarchy
> No hard edges
> No generic SaaS clutter
> No v0 or Supabase looking surfaces
>
> Do not:
> Add fake data
> Invent backend behavior
> Break existing routing
> Break auth
> Break server actions
> Break existing sidebar
> Show provider branding
> Create giant empty gray cards
> Use the same exact layout on every page
> Overuse random colors
> Hide core actions
>
> Global desktop layout pattern:
> Use desktop space intentionally.
> Most major pages should use:
> page header
> metric strip
> main workspace area
> right side intelligence or action panel when useful
> stronger empty states
> next best action cards
>
> Mobile:
> Keep single column.
> Stack panels cleanly.
> Do not overload mobile.
>
> PAGE SPECIFIC REQUIREMENTS
>
> 1. Dashboard / Home: daily command center, "Today's Focus", Pipeline Health, Recent Jobs, Quick Actions, Setup/Import Profile only when relevant, Next Best Action.
> 2. All Jobs: pipeline hub, summary tiles, analyze job card, search, filter chips, sort, rich opportunity cards, readiness stage, next action, blockers, fit score, pipeline intelligence side panel.
> 3. Ready to Apply: readiness gate, Ready, Blocked, explicit checklist, override modal, Application Confidence panel, Readiness Rules panel, Next Best Actions, show why nothing is ready and route every apply action through `/ready-to-apply`.
> 4. Applications: outcome tracker, applied/follow up/interviewing/offered/rejected, submitted list, follow up guidance, how applications get here, draft follow up CTA, explain empty state.
> 5. Career Context: proof vault, context health panel, core vs extended, search, category accordions, experience grouped by company, used in resume indicators, missing proof suggestions, add evidence actions.
> 6. Analytics: intelligence, free snapshot, pipeline breakdown, useful explanation for limited data, premium preview, outcome quality framing, upgrade card.
> 7. Activity Log: audit trail, timeline, event filters, processing categories, what gets logged panel, better empty state, links to Add Job and Pipeline.
> 8. Profile: career identity, two column desktop, profile form, profile strength panel, missing fields, used by HireWire explanation, resume upload context, save action visibility, cleaner grouping.
>
> VISUAL SYSTEM REQUIREMENTS
>
> Increase contrast between: page background, cards, input fields, side panels, empty states, buttons.
> Use HireWire red for: primary buttons, active nav, important action accents (not every icon).
> Metric tiles: clickable where appropriate, stronger number hierarchy, subtle color coding, short helper labels.
> Empty states: always include what this page is for, why it is empty, what action to take next.
> Cards: avoid overly flat gray, use soft white/cream, subtle border/shadow, consistent radius/spacing.
> Side panels: for intelligence, not filler (Pipeline Intelligence, Application Confidence, Context Health, Next Best Actions, Profile Strength, What Gets Logged).
>
> FUNCTIONAL RULES
>
> Preserve existing sidebar, routes, data fetching. Use safe fallbacks for missing data. Do not invent counts. Do not claim readiness unless real readiness data supports it. Do not show fake applications or analytics. Do not break buttons. If a button is not wired, use a safe route or remove it.
>
> ACCEPTANCE CRITERIA
>
> Each page feels visually stronger on desktop. Each page has a distinct purpose. The app no longer feels like one repeated template. Empty states are useful. There is better contrast. There is less dead space. HireWire brand feels stronger. No fake backend behavior is introduced. Mobile remains clean.

---

**One sentence anchor:**

Stop designing HireWire pages as centered mobile cards on desktop. Redesign them as distinct Career OS workspaces with stronger contrast, right side intelligence, useful empty states, and clear next actions.
