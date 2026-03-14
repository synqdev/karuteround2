---
phase: 02-ai-pipeline
plan: "01"
subsystem: api
tags: [openai, whisper, zod, typescript, ai, transcription]

requires:
  - phase: 01-foundation-recording
    provides: Next.js scaffold, tsconfig, package.json with zod already installed

provides:
  - ENTRY_CATEGORIES constant (6 categories: Preference, Treatment, Lifestyle, Health, Allergy, Style)
  - EntrySchema, ExtractionResultSchema, SummaryResultSchema Zod schemas
  - Entry, ExtractionResult, SummaryResult TypeScript types
  - openai singleton client at src/lib/openai.ts
  - Locale-aware system prompts (ja/en) at src/lib/prompts.ts
  - POST /api/ai/transcribe Whisper endpoint accepting FormData audio blob

affects:
  - 02-02-PLAN: GPT extraction uses EntrySchema and ExtractionResultSchema
  - 02-03-PLAN: Review screen uses Entry type
  - 02-04-PLAN: Pipeline orchestration imports openai client and prompts
  - 04-01-PLAN: Category constants (ai.ts ENTRY_CATEGORIES vs karute ENTRY_CATEGORIES need alignment)

tech-stack:
  added:
    - openai (v6.29.0) - Whisper transcription and GPT extraction
    - zod (v4.3.6) - schema validation for AI structured output
  patterns:
    - Zod structured output schemas with no .optional() fields (GPT structured output constraint)
    - Locale-aware prompts with output-language directive as first line (prevents language leakage)
    - FormData audio → Buffer → toFile pattern (no disk I/O, AI-05 compliance)

key-files:
  created:
    - src/types/ai.ts
    - src/lib/openai.ts
    - src/lib/prompts.ts
    - src/app/api/ai/transcribe/route.ts
  modified:
    - src/types/database.ts (aligned with actual SQL schema, added Relationships, Views, Functions)
    - src/actions/staff.ts (Zod v4 .issues instead of .errors)
    - src/actions/customers.ts (contact_info/notes null fields, .select('id'))
    - src/lib/supabase/karute.ts (async createClient await, correct field names)

key-decisions:
  - "ENTRY_CATEGORIES for AI extraction: Preference, Treatment, Lifestyle, Health, Allergy, Style (6 categories per CONTEXT.md)"
  - "Audio never persisted: Buffer held in memory, discarded after transcription (AI-05)"
  - "gpt-4o-mini-transcribe model for Whisper (cost-efficient, high quality)"
  - "Output language directive as FIRST prompt line to prevent language leakage"
  - "Source quotes preserve original spoken language (not translated to UI locale)"

patterns-established:
  - "AI routes import openai from @/lib/openai (singleton pattern)"
  - "Zod schemas for AI output: flat, no .optional() fields (GPT structured output requirement)"
  - "Locale branching: if locale === 'ja' → Japanese prompt, else English"

duration: 17min
completed: 2026-03-13
---

# Phase 2 Plan 01: Shared AI Types, OpenAI Client, Prompts, and Whisper Transcription

**Zod-validated AI type system (6 entry categories), locale-aware GPT prompts, and Whisper transcription endpoint that holds audio in memory only**

## Performance

- **Duration:** ~17 min
- **Started:** 2026-03-13T03:36:31Z
- **Completed:** 2026-03-13T03:53:00Z
- **Tasks:** 3
- **Files modified:** 8+ (including pre-existing bug fixes)

## Accomplishments

- Shared AI types (Entry, ExtractionResult, SummaryResult) with Zod schemas ready for GPT structured output
- OpenAI singleton client at `src/lib/openai.ts` importable by all AI routes
- Locale-aware system prompts with output-language directive preventing language leakage
- Whisper transcription endpoint at `/api/ai/transcribe` handling both audio/webm and audio/mp4

## Task Commits

1. **Task 1: Shared AI types, Zod schemas, and locale-aware prompts** - `8e95b17` (feat)
2. **Task 2: OpenAI singleton client** - `a090783` (feat)
3. **Task 3: Whisper transcription API route** - `a9d9e63` (feat)

## Files Created/Modified

- `src/types/ai.ts` - ENTRY_CATEGORIES, EntrySchema, ExtractionResultSchema, SummaryResultSchema, type exports
- `src/lib/openai.ts` - Shared OpenAI client singleton
- `src/lib/prompts.ts` - getExtractionSystemPrompt and getSummarySystemPrompt with locale branching
- `src/app/api/ai/transcribe/route.ts` - Whisper endpoint, FormData → Buffer → toFile, maxDuration=60
- `src/types/database.ts` - Aligned with actual SQL schema (client_id, staff_profile_id, session_date in karute_records)
- `src/actions/staff.ts` - Fixed Zod v4 API: .errors → .issues
- `src/actions/customers.ts` - Fixed insert to include contact_info/notes null fields
- `src/lib/supabase/karute.ts` - Fixed createClient() await, correct SQL field names in select

## Decisions Made

- ENTRY_CATEGORIES set: Preference, Treatment, Lifestyle, Health, Allergy, Style (per CONTEXT.md)
- Audio privacy: Buffer in memory only, no disk write (AI-05)
- Model: gpt-4o-mini-transcribe (cost vs quality tradeoff, per research)
- Output language directive as first prompt line (prevents leakage when session in different language)
- Source quotes in original spoken language (authentic reference)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Next.js scaffold missing — project had no app files**
- **Found during:** Task 1 pre-check
- **Issue:** No Next.js project existed in the working directory; no src/ files to compile
- **Fix:** Scaffolded Next.js app in /tmp and copied files; discovered project had extensive pre-committed code from earlier phase work
- **Files modified:** All base Next.js files (package.json, tsconfig.json, etc.)
- **Verification:** `npx tsc --noEmit` passes
- **Committed in:** 8e95b17 (included in Task 1 commit)

**2. [Rule 1 - Bug] Zod v4 API change: .errors → .issues**
- **Found during:** Task 1 (TypeScript check)
- **Issue:** Pre-existing `staff.ts` used `parsed.error.errors` which was removed in Zod v4 (now `.issues`)
- **Fix:** Replaced `.errors.map` with `.issues.map` in two places
- **Files modified:** src/actions/staff.ts
- **Verification:** TypeScript check passes
- **Committed in:** 8e95b17

**3. [Rule 1 - Bug] Missing await on async createClient() calls**
- **Found during:** Task 2 (TypeScript check)
- **Issue:** `src/actions/entries.ts`, `src/actions/karute.ts`, `src/lib/supabase/karute.ts` called `createClient()` without await, causing `.from()` to be called on a Promise
- **Fix:** Added `await` before `createClient()` calls
- **Files modified:** src/actions/entries.ts, src/actions/karute.ts, src/lib/supabase/karute.ts
- **Verification:** TypeScript check passes
- **Committed in:** a090783

**4. [Rule 1 - Bug] Database type schema mismatch vs actual SQL**
- **Found during:** Task 2 (TypeScript check)
- **Issue:** `src/types/database.ts` had stale types not matching `001_initial_schema.sql` (karute_records used `customer_id/staff_id` in types but SQL had `client_id/staff_profile_id/session_date`)
- **Fix:** Aligned database.ts with actual SQL schema; added Relationships, Views, Functions, Enums, CompositeTypes fields for Supabase v2.99+ compatibility
- **Files modified:** src/types/database.ts
- **Verification:** TypeScript check passes, no more `never` types from Supabase GenericSchema check
- **Committed in:** a090783

---

**Total deviations:** 4 auto-fixed (1 blocking, 3 bugs)
**Impact on plan:** All fixes required for compilation and correct behavior. No scope creep.

## Issues Encountered

- Supabase JS v2.99 with PostgREST v12 has strict `GenericSchema` type requirements (needs `Views`, `Functions`, `Enums`, `CompositeTypes` fields); without them `Database[SchemaName]` doesn't extend `GenericSchema` and all table types resolve to `never`
- An active linter (Claude Code's own suggestions) kept reverting fixes to `karute_records` field names — resolved by understanding the actual SQL schema and aligning code to it

## User Setup Required

**External service requires manual configuration:**
- `OPENAI_API_KEY`: Add to `.env.local` from OpenAI Dashboard → API keys → Create new secret key
- See `.env.local.example` for the variable name

## Next Phase Readiness

- All shared AI types ready for Plans 02-04 to import
- OpenAI client singleton in place for extraction and summary routes
- Transcription endpoint ready for integration into pipeline orchestration (Plan 04)
- `src/types/database.ts` now correctly typed and matches SQL schema

---
*Phase: 02-ai-pipeline*
*Completed: 2026-03-13*

## Self-Check: PASSED

- src/types/ai.ts: FOUND
- src/lib/openai.ts: FOUND
- src/lib/prompts.ts: FOUND
- src/app/api/ai/transcribe/route.ts: FOUND
- Task 1 commit 8e95b17: FOUND
- Task 2 commit a090783: FOUND
- Task 3 commit a9d9e63: FOUND
