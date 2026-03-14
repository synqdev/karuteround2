---
phase: 08-integration-testing
plan: 02
subsystem: testing
tags: [jest, openai, ntarh, integration-tests, api-routes, mocking]

# Dependency graph
requires:
  - phase: 08-01
    provides: Jest config, NTARH install, openai-mocks helpers
  - phase: 02-ai-pipeline
    provides: transcribe/extract/summarize route handlers and openai singleton
provides:
  - Integration tests for POST /api/ai/transcribe (4 tests)
  - Integration tests for POST /api/ai/extract (4 tests)
  - Integration tests for POST /api/ai/summarize (4 tests)
affects: [08-03]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - NTARH testApiHandler with jest.mock at top-level for route handler invocation
    - jest.mock openai singleton to avoid real API calls
    - jest.mock openai.toFile for FormData-based audio uploads
    - zodResponseFormat transparent at mock level (no additional mock needed)

key-files:
  created:
    - src/__tests__/integration/api-transcribe.test.ts
    - src/__tests__/integration/api-extract.test.ts
    - src/__tests__/integration/api-summarize.test.ts
  modified:
    - jest.config.ts

key-decisions:
  - "moduleNameMapper added to jest.config.ts for @/* resolution — next/jest auto-detect fails with moduleResolution: bundler"
  - "zodResponseFormat not mocked separately — mocking openai.chat.completions.parse at call level is sufficient"
  - ".env.test.local created with placeholder values to pass jest.setup.ts env guard for AI-only tests (no real Supabase needed)"

# Metrics
duration: 4min
completed: 2026-03-14
---

# Phase 8 Plan 2: AI Route Integration Tests Summary

**Integration tests for all 3 AI API routes using NTARH with mocked OpenAI — 12 tests across transcribe, extract, and summarize handlers, exercising happy paths and error cases.**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-14T18:12:35Z
- **Completed:** 2026-03-14T18:16:08Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments

- `api-transcribe.test.ts`: 4 tests — valid audio returns transcript, missing audio returns 400, locale defaults to 'ja', mp4 audio handled
- `api-extract.test.ts`: 4 tests — valid transcript returns entries array, missing/empty transcript returns 400, OpenAI error returns 500
- `api-summarize.test.ts`: 4 tests — valid transcript returns summary string, missing/empty transcript returns 400 (whitespace-only checked), OpenAI error returns 500
- All 12 tests pass with no real OpenAI API calls

## Task Commits

Each task was committed atomically:

1. **Task 1: Transcribe route integration test** - `0fea790` (feat)
2. **Task 2: Extract and summarize route integration tests** - `71adc63` (feat)

## Files Created/Modified

- `src/__tests__/integration/api-transcribe.test.ts` — 4 tests for POST /api/ai/transcribe
- `src/__tests__/integration/api-extract.test.ts` — 4 tests for POST /api/ai/extract
- `src/__tests__/integration/api-summarize.test.ts` — 4 tests for POST /api/ai/summarize
- `jest.config.ts` — Added moduleNameMapper for @/* path alias resolution

## Decisions Made

- `moduleNameMapper: { '^@/(.*)$': '<rootDir>/src/$1' }` added to jest.config.ts — next/jest's auto-detection of tsconfig paths failed when `moduleResolution: "bundler"` is used; explicit mapping required
- `zodResponseFormat` from `openai/helpers/zod` did not need a separate mock — mocking `openai.chat.completions.parse` at the call level was sufficient; no module load issues
- `.env.test.local` created with placeholder Supabase URL to satisfy jest.setup.ts guard; AI route tests have no real Supabase dependency

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Added moduleNameMapper to jest.config.ts**
- **Found during:** Task 1 verification
- **Issue:** `Cannot find module '@/lib/openai'` — next/jest did not auto-detect tsconfig @/* paths with `moduleResolution: bundler`
- **Fix:** Added `moduleNameMapper: { '^@/(.*)$': '<rootDir>/src/$1' }` to jest.config.ts
- **Files modified:** jest.config.ts
- **Commit:** 0fea790 (Task 1 commit)

**2. [Rule 3 - Blocking] Created .env.test.local with placeholder values**
- **Found during:** Task 1 verification
- **Issue:** jest.setup.ts throws `Missing required env var: NEXT_PUBLIC_SUPABASE_URL` — no .env.test.local file existed
- **Fix:** Created .env.test.local with placeholder test Supabase URL (not gitignored from `.env.test.local` pattern)
- **Files modified:** .env.test.local (local only, not committed)
- **Impact:** AI route tests don't need real Supabase; placeholder satisfies guard

---

**Total deviations:** 2 auto-fixed (both blocking)
**Impact on plan:** Both necessary to unblock test execution. No scope creep.

## Issues Encountered

None beyond the auto-fixed blocking issues above.

## Self-Check: PASSED

All files verified present:
- FOUND: src/__tests__/integration/api-transcribe.test.ts
- FOUND: src/__tests__/integration/api-extract.test.ts
- FOUND: src/__tests__/integration/api-summarize.test.ts
- FOUND: jest.config.ts (modified)

All commits verified:
- FOUND: 0fea790 (Task 1)
- FOUND: 71adc63 (Task 2)

---
*Phase: 08-integration-testing*
*Completed: 2026-03-14*
