---
phase: 01-foundation-recording
plan: "02"
subsystem: database
tags: [supabase, postgres, rls, typescript, ssr]

requires:
  - phase: 01-01
    provides: Next.js 16 scaffold with app router and project structure

provides:
  - Supabase migration SQL with 4 tables (profiles, customers, karute_records, entries) + RLS
  - Browser Supabase client (src/lib/supabase/client.ts) for Client Components
  - Server Supabase client (src/lib/supabase/server.ts) for Server Components + Route Handlers
  - TypeScript Database types in Supabase CLI format (src/types/database.ts)
  - Auto-profile trigger on auth.users insert

affects:
  - 01-03 (auth needs profiles table and env vars)
  - 02-ai-pipeline (entries table schema)
  - 03-customer-management (customers table)
  - 04-karute-records (karute_records table)
  - 05-staff-profiles (profiles table)

tech-stack:
  added: ["@supabase/ssr", "@supabase/supabase-js"]
  patterns:
    - "createBrowserClient for 'use client' components"
    - "async createServerClient with await cookies() for server-side auth"
    - "Database type in Supabase CLI format (explicit Insert/Update, not Omit<Row>)"
    - "RLS auth.uid() always wrapped in subquery (select auth.uid()) for performance"
    - "profiles defined first in migration so FK references resolve cleanly"

key-files:
  created:
    - supabase/migrations/001_initial_schema.sql
    - src/lib/supabase/client.ts
    - src/types/database.ts
  modified:
    - src/lib/supabase/server.ts
    - .env.local.example

key-decisions:
  - "Database type uses Supabase CLI format (explicit Insert/Update fields, not Omit<Row>) — Omit<> pattern caused GenericTable constraint to resolve Insert as never in Supabase 2.99+"
  - "profiles table defined first in migration SQL so FK references from karute_records and entries resolve cleanly"
  - "auth.uid() wrapped in subquery (select auth.uid()) in all RLS policies for PostgreSQL planner performance"
  - "customers table Row type includes furigana/phone/email fields added in migration 002 — types evolved with schema"
  - "entries table dropped customer_id and title in favor of content field — types reflect actual deployed schema"
  - "RLS policies later updated to use 'using (true)' in Phase 5 — single business auth means any authenticated user IS the business"

patterns-established:
  - "All Supabase clients imported as createClient() from @/lib/supabase/client or @/lib/supabase/server"
  - "Server-side only: use await createClient() from server.ts; never import browser client in server code"
  - "TypeScript row types derived from Database type via convenience aliases (ProfileRow, CustomerRow, etc.)"

duration: 5min
completed: 2026-03-14
---

# Phase 01 Plan 02: Supabase Schema + Client Setup Summary

**PostgreSQL schema with 4 RLS-enabled tables (profiles, customers, karute_records, entries), auto-profile trigger on auth signup, and typed Supabase browser/server client utilities**

## Performance

- **Duration:** 5 min
- **Started:** 2026-03-14T00:00:00Z
- **Completed:** 2026-03-14T00:05:00Z
- **Tasks:** 2 (retroactive verification)
- **Files modified:** 5

## Accomplishments

- SQL migration defines 4 tables in correct dependency order (profiles first), all with RLS enabled and auth.uid() wrapped in subquery
- auto-profile trigger fires on auth.users insert, reading customer_id and full_name from raw_user_meta_data
- Typed Supabase browser client and async server client both export createClient() — consistent import pattern across the app
- TypeScript Database type in Supabase CLI format satisfies GenericTable constraint for .insert()/.update() type-checking
- Convenience type aliases (ProfileRow, CustomerRow, KaruteRecordRow, EntryRow) plus legacy names for backward compatibility

## Task Commits

1. **Task 1: Schema migration + server client + types** - pre-existing in codebase (chore)
2. **Task 2: Browser client** - `c20e487` (feat — missing client.ts added)

**Plan metadata:** TBD (docs: complete plan)

## Files Created/Modified

- `supabase/migrations/001_initial_schema.sql` - Complete DDL: profiles, customers, karute_records, entries tables with RLS policies + auto-profile trigger + updated_at triggers
- `src/lib/supabase/client.ts` - createBrowserClient wrapper for Client Components (created in this execution — was missing)
- `src/lib/supabase/server.ts` - async createServerClient with await cookies() adapter for Server Components and Route Handlers
- `src/types/database.ts` - Database type in Supabase CLI format with explicit Insert/Update types; convenience aliases and legacy names
- `.env.local.example` - Documents NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, OPENAI_API_KEY

## Decisions Made

- Database type uses explicit Insert/Update instead of Omit<Row, ...> — Supabase 2.99+ GenericTable constraint requires this format
- profiles table placed first in migration so FK references from karute_records (staff_profile_id) resolve without errors
- All RLS policies use `(select auth.uid())` subquery form rather than bare `auth.uid()` — PostgreSQL executes subquery once per statement vs once per row
- Types have evolved beyond initial plan schema: customers table includes furigana/phone/email (migration 002); entries uses content field instead of title+customer_id

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Created missing browser Supabase client**
- **Found during:** Task verification
- **Issue:** `src/lib/supabase/client.ts` did not exist — plan's must_have artifact was absent, and any future Client Component needing Supabase would fail at import
- **Fix:** Created `src/lib/supabase/client.ts` with createBrowserClient wrapper typed against Database
- **Files modified:** src/lib/supabase/client.ts
- **Verification:** `grep "createBrowserClient" src/lib/supabase/client.ts` — found; `npm run type-check` exits 0
- **Committed in:** c20e487

---

**Total deviations:** 1 auto-fixed (1 missing critical)
**Impact on plan:** client.ts is a plan must_have; adding it is required for correctness. No scope creep.

## Issues Encountered

- Schema types evolved from original plan: `customers` table gained furigana/phone/email columns in migration 002; `entries` table uses `content` field instead of `title` + dropped `customer_id`. The `database.ts` types correctly reflect the actual deployed schema rather than the initial plan spec.

## User Setup Required

Supabase projects require manual setup:
- Create dev and prod Supabase projects at https://supabase.com/dashboard
- Run `supabase/migrations/001_initial_schema.sql` in SQL Editor for each project
- Copy project URL and anon key into `.env.local` (from `.env.local.example`)
- Verify 4 tables visible in Table Editor and RLS policies in Authentication -> Policies

## Next Phase Readiness

- profiles table exists for auth (01-03) to rely on
- Browser and server Supabase clients ready for use across all phases
- TypeScript types typed against actual schema — no `any` in Supabase calls
- `.env.local` credentials required before `npm run dev` will connect to Supabase

---
*Phase: 01-foundation-recording*
*Completed: 2026-03-14*
