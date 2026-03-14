# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-13)

**Core value:** Service providers can record a client session conversation and instantly get a structured, categorized digital karute without writing anything down.
**Current focus:** Phase 6 — UI/UX Polish

## Current Position

Phase: 6 of 8 (UI/UX Polish)
Plan: 1 of 4 in current phase (06-01 complete)
Status: In progress
Last activity: 2026-03-14 — Completed 06-01 (dark theme infrastructure + dashboard layout shell)

Progress: [█░░░░░░░░░] ~3%

## Performance Metrics

**Velocity:**
- Total plans completed: 2
- Average duration: 5 min
- Total execution time: 0.2 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 06-ui-ux-polish | 1 | 5 min | 5 min |
| 03-customer-management | 1 | 5 min | 5 min |

**Recent Trend:**
- Last 5 plans: 06-01 (5 min), 03-01 (5 min)
- Trend: -

*Updated after each plan completion*

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- Phase 1 scope: User preference — recording feature belongs in Phase 1 alongside foundation and DB, not deferred to a later phase
- Recording format: iOS Safari uses mp4, Chrome uses webm — REC-02 requires both are handled at the API route level
- Audio privacy: Audio is never written to Supabase Storage — only transcript text is persisted (AI-05)
- 06-01: ThemeProvider in root layout (not [locale] layout) — ensures dark mode works on login and all routes
- 06-01: Noto Sans JP subsets=['latin'] only — next.js 16.1.6 types don't expose 'japanese' subset; Japanese glyphs load at runtime via unicode-range
- 06-01: Dashboard layout shell uses hardcoded hex (#2a2a2a, #3a3a3a) matching reference app exactly, not shadcn tokens
- 03-01: Duplicate name detection warns but does not block creation — duplicateWarning on ActionResult success case
- 03-01: listCustomers default sort: updated_at desc (proxy for last visit until karute_records linked)
- 03-01: checkDuplicateName non-fatal — Supabase errors return { exists: false } so creation never blocked
- 03-01: No redirect() in Server Actions — caller (sheet UI) handles navigation after success

### Pending Todos

None.

### Blockers/Concerns

Pre-existing TypeScript errors in backend files (actions/entries.ts, actions/staff.ts, lib/supabase) — Supabase client typing issues unrelated to Phase 06-01.

## Session Continuity

Last session: 2026-03-14
Stopped at: Completed 03-01-PLAN.md (customer data layer: migration, Server Actions, queries, utils, i18n)
Resume file: None
