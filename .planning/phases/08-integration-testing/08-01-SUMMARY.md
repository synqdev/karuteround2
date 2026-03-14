---
phase: 08-integration-testing
plan: 01
subsystem: testing
tags: [jest, supabase, openai, integration-tests, next-jest, ts-node]

# Dependency graph
requires:
  - phase: 01-foundation-recording
    provides: Next.js scaffold and tsconfig with @/* path aliases
  - phase: 02-ai-pipeline
    provides: OpenAI client singleton at @/lib/openai, ExtractionResult/SummaryResult types
  - phase: 03-customer-management
    provides: customers table, createCustomer server action
  - phase: 04-karute-records
    provides: karute_records/entries tables, saveKaruteRecord server action
provides:
  - Jest configured for integration testing with node environment
  - testSupabase (service role) client with teardown helpers
  - OpenAI mock factories for transcription, extraction, summary routes
  - server-action-mocks: TEST_STAFF_PROFILE_ID and next/headers mock patterns
  - jest.setup.ts: env validation and production safety guard
  - test:integration npm script (sequential, passWithNoTests)
affects: [08-02, 08-03]

# Tech tracking
tech-stack:
  added: [next-test-api-route-handler, ts-node]
  patterns:
    - Service role Supabase client for test teardown (bypasses RLS)
    - jest.mock hoisting: mocks declared at top-level of test file, not in helpers
    - FK-safe teardown order: entries -> karute_records -> customers -> profiles

key-files:
  created:
    - jest.config.ts
    - .env.test.local.example
    - src/__tests__/integration/helpers/supabase.ts
    - src/__tests__/integration/helpers/openai-mocks.ts
    - src/__tests__/integration/helpers/server-action-mocks.ts
    - src/__tests__/integration/setup/jest.setup.ts
  modified:
    - package.json
    - package-lock.json
    - .gitignore

key-decisions:
  - "test:integration uses --passWithNoTests so script exits 0 before any test files are written"
  - ".gitignore updated with !.env*.example negation so template files can be committed"
  - "jest.mock calls documented as copy-paste reference in server-action-mocks.ts — cannot be runtime utilities due to hoisting"
  - "createTestProfile uses id as customer_id for test isolation (avoids auth trigger dependency)"
  - "testEnvironment is node (not jsdom) for server-side action testing"

patterns-established:
  - "FK-safe teardown: entries -> karute_records -> customers -> profiles"
  - "Service role key for test DB access (bypasses RLS, needed for cross-table cleanup)"
  - "Test staff profile created directly via testSupabase.from('profiles').insert() without auth trigger"

# Metrics
duration: 4min
completed: 2026-03-14
---

# Phase 8 Plan 1: Integration Test Infrastructure Summary

**Jest configured with node environment, service-role Supabase test client, OpenAI mock factories, and next/headers mocks for server action integration testing.**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-14T02:43:36Z
- **Completed:** 2026-03-14T02:47:16Z
- **Tasks:** 2
- **Files modified:** 9

## Accomplishments

- Jest configured with `next/jest` for Next.js integration, `testEnvironment: 'node'`, and `testMatch` targeting only `__tests__/integration/**/*.test.ts`
- `testSupabase` service-role client with `created` tracker and `teardownTestData()` for FK-safe cleanup; `createTestProfile()` helper for staff FK requirements
- OpenAI mock factories for all 3 AI routes (transcription, extraction, summary) plus `getOpenAIMockFactory()` for `jest.mock('@/lib/openai',...)`
- `jest.setup.ts` validates env vars and guards against production URL at test-time startup
- `.env.test.local.example` committed as template (`.gitignore` updated to allow `*.example` files)

## Task Commits

Each task was committed atomically:

1. **Task 1: Install dependencies and create Jest configuration** - `807eeee` (chore)
2. **Task 2: Create test helper modules** - `93174f8` (feat)

## Files Created/Modified

- `jest.config.ts` - Jest config with next/jest, node environment, integration testMatch
- `.env.test.local.example` - Template for test Supabase credentials (no secrets, committed to repo)
- `package.json` - Added test:integration script, next-test-api-route-handler, ts-node devDeps
- `.gitignore` - Added `!.env*.example` negation to allow template files
- `src/__tests__/integration/helpers/supabase.ts` - testSupabase, created tracker, teardownTestData, createTestProfile
- `src/__tests__/integration/helpers/openai-mocks.ts` - mockTranscriptionResult, mockExtractionResult, mockSummaryResult, getOpenAIMockFactory
- `src/__tests__/integration/helpers/server-action-mocks.ts` - TEST_STAFF_PROFILE_ID and documented jest.mock patterns
- `src/__tests__/integration/setup/jest.setup.ts` - Env var validation and production safety guard

## Decisions Made

- `test:integration` uses `--passWithNoTests` so the script exits 0 before any test files exist — matches plan verification requirement
- `jest.mock()` patterns documented as JSDoc copy-paste reference in `server-action-mocks.ts` rather than callable functions, since Jest hoists mock calls at compile time
- `createTestProfile()` sets `customer_id = id` to avoid dependency on the `handle_new_user` auth trigger in the test DB
- `.gitignore` negation rule `!.env*.example` added so both `.env.local.example` (pre-existing) and `.env.test.local.example` (new) can be committed

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Added --passWithNoTests to test:integration script**
- **Found during:** Task 1 verification
- **Issue:** `jest --testPathPattern='__tests__/integration' --runInBand` exits code 1 when no tests found; plan requires exit 0
- **Fix:** Added `--passWithNoTests` flag to script
- **Files modified:** package.json
- **Verification:** `npm run test:integration` exits 0 with "No tests found, exiting with code 0"
- **Committed in:** 807eeee (Task 1 commit)

**2. [Rule 3 - Blocking] Updated .gitignore to allow .env*.example files**
- **Found during:** Task 1 (creating .env.test.local.example)
- **Issue:** `.env*` gitignore pattern blocked `.env.test.local.example` from being tracked; plan requires it be committed to repo
- **Fix:** Added `!.env*.example` negation rule to .gitignore
- **Files modified:** .gitignore
- **Verification:** `git status` shows `.env.test.local.example` as untracked (trackable), successfully added to commit
- **Committed in:** 807eeee (Task 1 commit)

---

**Total deviations:** 2 auto-fixed (1 bug, 1 blocking)
**Impact on plan:** Both necessary for correctness. No scope creep.

## Issues Encountered

None.

## User Setup Required

**External services require manual configuration before running integration tests:**
- Create a separate Supabase test project (NOT production)
- Run `001_initial_schema.sql` migration on test project via SQL Editor
- Copy `.env.test.local.example` to `.env.test.local` and fill in:
  - `NEXT_PUBLIC_SUPABASE_URL` — test project URL
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY` — test anon key
  - `SUPABASE_SERVICE_ROLE_KEY` — test service_role key (for teardown)

## Next Phase Readiness

- 08-02 and 08-03 can import from `src/__tests__/integration/helpers/` to write test files
- `npm run test:integration` will execute all `__tests__/integration/**/*.test.ts` files sequentially
- `jest.setup.ts` will validate env vars automatically when tests run — no manual check needed

## Self-Check: PASSED

All files verified present:
- FOUND: jest.config.ts
- FOUND: .env.test.local.example
- FOUND: src/__tests__/integration/helpers/supabase.ts
- FOUND: src/__tests__/integration/helpers/openai-mocks.ts
- FOUND: src/__tests__/integration/helpers/server-action-mocks.ts
- FOUND: src/__tests__/integration/setup/jest.setup.ts

All commits verified:
- FOUND: 807eeee (Task 1)
- FOUND: 93174f8 (Task 2)

---
*Phase: 08-integration-testing*
*Completed: 2026-03-14*
