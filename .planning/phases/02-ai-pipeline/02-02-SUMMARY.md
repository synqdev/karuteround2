---
phase: 02-ai-pipeline
plan: "02"
subsystem: api
tags: [openai, gpt-4o-mini, zod, structured-output, extraction, summary, typescript]

requires:
  - phase: 02-ai-pipeline
    plan: "01"
    provides: ExtractionResultSchema, SummaryResultSchema, openai singleton, getExtractionSystemPrompt, getSummarySystemPrompt

provides:
  - POST /api/ai/extract — GPT structured extraction endpoint returning Entry[]
  - POST /api/ai/summarize — GPT session summary endpoint returning prose string
  - Both routes use zodResponseFormat for schema-guaranteed GPT output
  - Locale-aware prompts wired into both routes

affects:
  - 02-03-PLAN: Review screen displays entries from /api/ai/extract
  - 02-04-PLAN: Pipeline orchestration calls extract and summarize in parallel via Promise.all

tech-stack:
  added: []
  patterns:
    - zodResponseFormat wraps Zod schema for GPT structured output (no JSON-mode guessing)
    - locale ?? 'en' fallback — routes safe even if caller omits locale
    - Flat try/catch with string error messages (500 on GPT failure, 400 on missing input)

key-files:
  created:
    - src/app/api/ai/extract/route.ts
    - src/app/api/ai/summarize/route.ts
  modified: []

key-decisions:
  - "locale defaults to 'en' if omitted — routes never crash on missing locale"
  - "zodResponseFormat used (not JSON mode) — schema-guaranteed structured output"
  - "gpt-4o-mini for both extraction and summary — cost-efficient, matches Plan 01 decision"

patterns-established:
  - "AI route pattern: validate input → build locale prompt → openai.chat.completions.parse with zodResponseFormat → return parsed result"
  - "Error contract: 400 for missing transcript, 500 for GPT failure with string message"

duration: 1min
completed: 2026-03-13
---

# Phase 2 Plan 02: GPT Extraction and Summary API Routes

**Two GPT endpoints using zodResponseFormat structured output — /api/ai/extract returns schema-validated Entry[] and /api/ai/summarize returns a locale-aware prose string, both ready for parallel pipeline orchestration**

## Performance

- **Duration:** ~1 min
- **Started:** 2026-03-14T03:36:16Z
- **Completed:** 2026-03-14T03:37:02Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- `POST /api/ai/extract` — accepts `{ transcript, locale }`, calls gpt-4o-mini with ExtractionResultSchema via zodResponseFormat, returns `{ entries: Entry[] }` with category, title, source_quote, confidence_score
- `POST /api/ai/summarize` — accepts `{ transcript, locale }`, calls gpt-4o-mini with SummaryResultSchema via zodResponseFormat, returns `{ summary: string }` in requested locale language
- Both routes reuse the locale-aware system prompts and OpenAI singleton from Plan 01

## Task Commits

1. **Task 1: GPT structured extraction API route** - `8107cb0` (feat)
2. **Task 2: GPT session summary API route** - `595429f` (feat)

## Files Created/Modified

- `src/app/api/ai/extract/route.ts` — Extraction endpoint, zodResponseFormat with ExtractionResultSchema, maxDuration=60
- `src/app/api/ai/summarize/route.ts` — Summary endpoint, zodResponseFormat with SummaryResultSchema, maxDuration=60

## Decisions Made

- `locale ?? 'en'` fallback applied in both routes — safe if caller omits locale
- zodResponseFormat used over JSON mode — schema-guaranteed output, no post-parse validation needed
- gpt-4o-mini consistent with Plan 01 transcription model choice

## Deviations from Plan

None - plan executed exactly as written. All types, clients, and prompts from Plan 01 were in place.

## Issues Encountered

None.

## User Setup Required

None - no new external service configuration required. OPENAI_API_KEY from Plan 01 setup covers these routes.

## Next Phase Readiness

- `/api/ai/extract` and `/api/ai/summarize` are complete and ready to be called in parallel by Plan 04 pipeline orchestration
- Both routes return structured JSON matching the Zod schemas Plan 03 review screen expects
- TypeScript strict check passes with zero errors

---
*Phase: 02-ai-pipeline*
*Completed: 2026-03-13*

## Self-Check: PASSED

- src/app/api/ai/extract/route.ts: FOUND
- src/app/api/ai/summarize/route.ts: FOUND
- .planning/phases/02-ai-pipeline/02-02-SUMMARY.md: FOUND
- Task 1 commit 8107cb0: FOUND
- Task 2 commit 595429f: FOUND
