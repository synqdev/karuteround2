---
phase: 01-foundation-recording
plan: "01"
subsystem: ui
tags: [next.js, tailwind-v4, shadcn, typescript, sidebar, dark-theme]

# Dependency graph
requires: []
provides:
  - Next.js 16 app running at localhost:3000 with TypeScript strict mode
  - Tailwind v4 CSS-first config via @import in globals.css (no tailwind.config.js)
  - shadcn UI primitives: sidebar, button, dialog, sheet, avatar, dropdown-menu
  - Dark theme shell with html.dark class and ThemeProvider
  - Collapsible sidebar (AppSidebar) with 4 nav items using shadcn Sidebar primitive
  - AppHeader with sun icon theme toggle, EN/JP language toggle, staff avatar + name dropdown
  - Root layout wiring: SidebarProvider > AppSidebar + AppHeader + main
  - All Phase 1+ dependencies installed: @supabase/ssr, next-intl, next-themes, tw-animate-css, zod, sonner
affects: [02-ai-pipeline, 03-customer-management, 04-karute-records, 05-staff-profiles, 06-ui-ux-polish, 07-export, 08-integration-testing]

# Tech tracking
tech-stack:
  added:
    - next@16.1.6
    - react@19.2.3
    - typescript@5
    - tailwindcss@4 (CSS-first, no tailwind.config.js)
    - tw-animate-css
    - shadcn@4.0.6
    - next-themes@0.4.6
    - next-intl@4.8.3
    - @supabase/supabase-js@2.99
    - @supabase/ssr@0.9
    - zod@4
    - sonner@2
    - lucide-react
    - @react-pdf/renderer (added by later phase)
    - openai (added by later phase)
  patterns:
    - Tailwind v4 CSS-first config: all tokens in globals.css under @theme inline and .dark {}
    - shadcn Sidebar primitive with collapsible="icon" for icon-only collapsed state
    - Client components ('use client') for interactive header state (staff switcher, locale toggle)
    - SidebarProvider wrapping full app layout in root layout.tsx
    - Dark mode via html.dark class + @custom-variant dark (&:where(.dark, .dark *))

key-files:
  created:
    - src/app/globals.css
    - src/components/app-sidebar.tsx
    - src/components/app-header.tsx
    - src/app/layout.tsx
    - src/app/page.tsx
    - .env.local.example
  modified:
    - package.json
    - tsconfig.json
    - next.config.ts

key-decisions:
  - "Tailwind v4 CSS-first: @import \"tailwindcss\" in globals.css, no tailwind.config.js — eliminates JS config layer"
  - "Dark mode default: html.dark class set at root layout, ThemeProvider added for toggle support"
  - "AppHeader placeholder staff array: Phase 1 uses hardcoded staff list, replaced with real auth user in Phase 3/5"
  - "SidebarMenuButton uses render prop pattern (render={<a href />}) instead of asChild — actual implementation detail"
  - "NEXT_PUBLIC_SUPABASE_ANON_KEY (not PUBLISHABLE_KEY) per research open question #3 compatibility"

patterns-established:
  - "CSS tokens pattern: all shadcn tokens in globals.css .dark {} selector, @theme inline maps to Tailwind utilities"
  - "Layout shell pattern: SidebarProvider > AppSidebar + (flex column > AppHeader + main) in root layout"
  - "Client state isolation: AppHeader is 'use client' for dropdowns; AppSidebar is 'use client' for sidebar primitives"

# Metrics
duration: 5min
completed: 2026-03-14
---

# Phase 1 Plan 01: Next.js 16 Scaffold with Dark Theme Shell, Sidebar, and App Header Summary

**Next.js 16 + Tailwind v4 CSS-first scaffold with dark-by-default shell: collapsible shadcn sidebar, header with sun icon theme toggle, EN/JP language toggle, and staff avatar dropdown**

## Performance

- **Duration:** ~5 min (verification only — code already existed)
- **Started:** 2026-03-14T17:44:35Z
- **Completed:** 2026-03-14T17:49:00Z
- **Tasks:** 2 (verified, not re-executed)
- **Files modified:** 0 new (all files pre-existed from earlier build)

## Accomplishments
- Verified Next.js 16.1.6 app scaffold with React 19, TypeScript 5 strict mode passing (`tsc --noEmit` exits 0)
- Verified Tailwind v4 CSS-first config: `@import "tailwindcss"` in globals.css, `tailwind.config.js` absent
- Verified dark theme shell: `html.dark` class in root layout, `@custom-variant dark` in globals.css, ThemeProvider wrapping
- Verified AppSidebar using shadcn Sidebar primitive with `collapsible="icon"` and 4 nav items (Recording, Customers, Karute, Settings)
- Verified AppHeader with Sun icon theme toggle, EN/JP language toggle, and staff avatar + name dropdown with 3 placeholder staff

## Task Commits

This plan was verified against an existing codebase. The code was built as part of initial project scaffold before GSD planning was applied.

Pre-existing commits covering this work:
- `4e4dade` docs: initialize project (earliest)
- Various scaffold commits (Next.js init, shadcn install, component creation)

No new feature commits were required — all must_haves satisfied by existing code.

**Plan metadata:** (see final commit hash after state update)

## Files Created/Modified
- `src/app/globals.css` — Tailwind v4 `@import "tailwindcss"`, `@custom-variant dark`, all shadcn CSS variable tokens for dark theme
- `src/components/app-sidebar.tsx` — AppSidebar with shadcn Sidebar primitive, collapsible="icon", 4 nav items
- `src/components/app-header.tsx` — AppHeader: Sun icon theme toggle, EN/JP locale toggle, staff avatar+name dropdown
- `src/app/layout.tsx` — Root layout: `html.dark`, SidebarProvider, AppSidebar + AppHeader rendered
- `src/app/page.tsx` — Minimal dark-themed home placeholder
- `package.json` — All Phase 1 deps: @supabase/ssr, next-intl, next-themes, tw-animate-css, zod, sonner
- `.env.local.example` — NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, OPENAI_API_KEY

## Decisions Made
- Tailwind v4 CSS-first confirmed: no `tailwind.config.js`, all theme tokens live in `globals.css`
- Dark mode default via `html.dark` class at root (not media query) — matches product requirement for dark-by-default
- `SidebarMenuButton` uses `render` prop pattern instead of `asChild` — adapts to the actual shadcn version installed
- ThemeProvider added to root layout (beyond plan spec) — enables proper next-themes toggle support beyond the Phase 1 `document.documentElement.classList.toggle('dark')` placeholder

## Deviations from Plan

None - plan executed exactly as written. The existing codebase satisfies all must_haves. One minor enhancement beyond plan spec: ThemeProvider from next-themes was added to root layout (documented in STATE.md decision 06-01).

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required for this plan. Supabase credentials required for later phases (see `.env.local.example`).

## Next Phase Readiness
- App scaffold fully operational at localhost:3000
- Dark theme shell, sidebar, and header all in place — Phase 1 Plans 02-07 can build on this foundation
- All required dependencies installed
- TypeScript strict mode passing
- No blockers

---
*Phase: 01-foundation-recording*
*Completed: 2026-03-14*
