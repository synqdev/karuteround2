# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-13)

**Core value:** Service providers can record a client session conversation and instantly get a structured, categorized digital karute without writing anything down.
**Current focus:** Phase 6 — UI/UX Polish

## Current Position

Phase: 6 of 8 (UI/UX Polish)
Plan: 2 of 4 in current phase (06-01, 06-02 complete)
Status: In progress
Last activity: 2026-03-14 — Completed 05-01 (staff data layer: Server Actions, helpers, Zod schema, RLS migration)

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
| Phase 03-customer-management P02 | 2 min | 2 tasks | 9 files |
| Phase 05-staff-profiles P01 | 14 | 2 tasks | 4 files |
| Phase 04-karute-records P03 | 3 | 2 tasks | 5 files |
| Phase 02 P01 | 17 | 3 tasks | 8 files |

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
- 06-02: Custom sidebar (not shadcn Sidebar primitive) matching reference app exactly at 90px width
- 06-02: usePathname and useRouter imported from @/i18n/navigation to prevent locale URL stacking bug
- 06-02: sidebar namespace added to en.json and ja.json for translated nav labels
- 03-01: Duplicate name detection warns but does not block creation — duplicateWarning on ActionResult success case
- 03-01: listCustomers default sort: updated_at desc (proxy for last visit until karute_records linked)
- 03-01: checkDuplicateName non-fatal — Supabase errors return { exists: false } so creation never blocked
- 03-01: No redirect() in Server Actions — caller (sheet UI) handles navigation after success
- 04-01: Database type uses Supabase CLI format (explicit Insert/Update fields, not Omit<Row>) — Omit<> pattern caused GenericTable constraint to resolve Insert as never in Supabase 2.99+
- 04-01: staffId falls back to first profiles row with TODO for Phase 5 staff switcher wiring
- 04-01: getKaruteRecord returns null (not throws) on PGRST116 so page can call notFound() cleanly
- [Phase 03-customer-management]: No cursor-pointer on table rows — hover highlight only (hover:bg-muted/50) per user decision
- [Phase 03-customer-management]: Visits column shows 0 placeholder — real count deferred to Phase 4 when karute_records are linked
- [Phase 05-staff-profiles]: Active staff stored in httpOnly:false cookie for both server-side attribution and client-side UI reads
- [Phase 05-staff-profiles]: RLS policies use 'using (true)' — single business auth means any authenticated user IS the business; Phase 1 restrictive policies dropped
- [Phase 04-03]: Simple input+dropdown for CustomerCombobox (no cmdk/radix) — neither library installed
- [Phase 04-03]: onMouseDown+e.preventDefault() in dropdown items prevents blur-before-select race condition
- [Phase 04-03]: hasMounted guard in SaveKaruteFlow: render skeleton server-side, load sessionStorage after mount
- [Phase 04-03]: NEXT_REDIRECT re-throw: catch block re-throws redirect() exceptions so Next.js navigation works from client components
- [Phase 02-01]: ENTRY_CATEGORIES for AI extraction: Preference, Treatment, Lifestyle, Health, Allergy, Style (6 categories per CONTEXT.md decision)
- [Phase 02-01]: Audio never persisted: Buffer held in memory only, discarded after transcription (AI-05 compliance)

### Pending Todos

None.

### Blockers/Concerns

None. (Pre-existing TypeScript errors from Supabase 2.99 type format resolved in 04-01.)

## Session Continuity

Last session: 2026-03-13
Stopped at: Completed 02-01-PLAN.md (shared AI types, OpenAI client, locale-aware prompts, Whisper transcription route)
Resume file: None
