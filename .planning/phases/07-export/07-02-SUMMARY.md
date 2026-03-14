---
phase: 07-export
plan: 02
subsystem: api
tags: [plain-text-export, text-formatter, export-buttons, file-download]

# Dependency graph
requires:
  - phase: 04-karute-records
    provides: "getKaruteRecord query helper and KaruteWithRelations type"
  - phase: 07-export-01
    provides: "PDF export route (linked from ExportButtons)"
  - phase: 01-foundation-recording
    provides: "createClient Supabase server client for auth checks"

provides:
  - "formatKaruteAsText pure function for structured plain text output"
  - "GET /api/karute/[id]/export/text — authenticated text download route"
  - "ExportButtons client component with PDF and text download links"

affects:
  - "08-integration-testing: text route needs auth verification test coverage"

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Pure text formatter: no side effects, Japanese section headers, UTF-8 safe"
    - "Text route: export const runtime = 'nodejs', auth check, Content-Disposition attachment"
    - "ExportButtons: <a href download> pattern with shadcn buttonVariants"

key-files:
  created:
    - "src/lib/karute/formatKaruteText.ts — Pure function formatting karute as Japanese plain text"
    - "src/app/api/karute/[id]/export/text/route.ts — GET handler with auth, fetch, text download"
    - "src/components/karute/ExportButtons.tsx — Client component with PDF and text anchor links"
  modified:
    - "src/components/karute/KaruteDetailView.tsx — ExportButtons imported and rendered"

key-decisions:
  - "ExportButtons uses <a href download> pattern (not fetch + blob) for native browser download"
  - "Text formatter uses Japanese section headers (カルテ, AI サマリー, エントリー, トランスクリプト)"
  - "Customer name and entries accessed via any cast due to PostgREST alias type inference issues"

patterns-established:
  - "Text route pattern: mirrors PDF route (runtime nodejs, auth check, fetch, format, Content-Disposition)"

# Metrics
duration: 3min
completed: 2026-03-14
---

# Phase 7 Plan 02: Plain Text Export + ExportButtons Summary

**Plain text export route and ExportButtons client component — GET /api/karute/[id]/export/text returns authenticated, downloadable .txt file with Japanese section headers**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-14
- **Completed:** 2026-03-14
- **Tasks:** 2
- **Files created:** 3
- **Files modified:** 1

## Accomplishments

- Created `formatKaruteAsText` pure function — formats karute record as structured plain text with Japanese section headers (カルテ, AI サマリー, エントリー, トランスクリプト)
- Created text export route at `/api/karute/[id]/export/text` with auth check (401), karute fetch (404), UTF-8 Content-Type, and Content-Disposition attachment header
- Created `ExportButtons` client component using shadcn `buttonVariants` with `<a href download>` pattern for both PDF and text exports
- Wired ExportButtons into KaruteDetailView

## Task Commits

1. **Task 1: Plain text formatter and text export route** - `4bf8d53` (feat)
2. **Task 2: ExportButtons client component** - `b74174c` (feat)

## Files Created/Modified

- `src/lib/karute/formatKaruteText.ts` — Pure function formatting karute data as structured Japanese plain text
- `src/app/api/karute/[id]/export/text/route.ts` — GET route with auth (401), fetch (404), text/plain response with download headers
- `src/components/karute/ExportButtons.tsx` — Client component with PDF (default variant) and text (outline variant) download links
- `src/components/karute/KaruteDetailView.tsx` — ExportButtons imported and rendered in detail view

## Deviations from Plan

None — implementation matches plan exactly.

## Issues Encountered

None.

## User Setup Required

None.

## Next Phase Readiness

- Phase 7 (Export) is fully complete — both PDF and text export routes work with authentication
- ExportButtons is wired into the karute detail view
- Phase 8 (Integration Testing) can proceed

## Self-Check: PASSED

- `src/lib/karute/formatKaruteText.ts` — FOUND
- `src/app/api/karute/[id]/export/text/route.ts` — FOUND
- `src/components/karute/ExportButtons.tsx` — FOUND
- ExportButtons imported in KaruteDetailView — FOUND
- `npx tsc --noEmit` — PASSED (0 errors)
- Commit `4bf8d53` — FOUND
- Commit `b74174c` — FOUND

---
*Phase: 07-export*
*Completed: 2026-03-14*
