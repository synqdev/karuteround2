---
phase: 03-customer-management
plan: "01"
subsystem: database
tags: [supabase, typescript, zod, server-actions, i18n, next-intl]

# Dependency graph
requires:
  - phase: 01-foundation-recording
    provides: "Supabase client utilities (src/lib/supabase/server.ts), initial schema (001_initial_schema.sql), TypeScript database types"
provides:
  - "SQL migration adding furigana, phone, email columns to customers table"
  - "Updated Customer TypeScript interface with new fields"
  - "createCustomer and updateCustomer Server Actions with Zod validation and duplicate name detection"
  - "listCustomers with multi-column ilike search and pagination, getCustomer, checkDuplicateName query helpers"
  - "getAvatarColor (deterministic pastel from UUID) and getInitials (Latin + CJK) utility functions"
  - "Full EN and JP i18n strings for all customer UI (form, table, profile, toast, empty state)"
affects:
  - "03-02 (customer list page) — depends on listCustomers, createCustomer, getAvatarColor, getInitials, i18n strings"
  - "03-03 (customer profile page) — depends on getCustomer, updateCustomer, getAvatarColor, getInitials, i18n strings"

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Server Actions return ActionResult union type (success: true | success: false) — consistent with staff.ts and karute.ts patterns"
    - "checkDuplicateName non-fatal: errors return { exists: false } so creation is never blocked by a failed duplicate check"
    - "Deterministic avatar color via djb2-style hash mod palette length — pure function, no randomness"
    - "CJK detection via Unicode ranges for initials extraction (hiragana, katakana, CJK unified)"

key-files:
  created:
    - supabase/migrations/002_customer_fields.sql
    - src/actions/customers.ts
    - src/lib/customers/queries.ts
    - src/lib/customers/utils.ts
    - messages/en.json
    - messages/ja.json
  modified:
    - src/types/database.ts

key-decisions:
  - "Duplicate name detection: warn but allow creation — duplicateWarning on ActionResult success case, not a blocking error"
  - "listCustomers default sort: updated_at desc (proxy for last visit until karute_records are linked)"
  - "Avatar colors: 10-color pastel palette with /20 opacity backgrounds for dark theme contrast"
  - "No redirect() in Server Actions — UI handles navigation after sheet closes per user decision"

patterns-established:
  - "ActionResult: { success: true; id: string; duplicateWarning?: string } | { success: false; error: string }"
  - "Query helpers in src/lib/customers/ separate from Server Actions in src/actions/"
  - "ilike search string: name.ilike.%q%,furigana.ilike.%q%,phone.ilike.%q%,email.ilike.%q% via .or()"

# Metrics
duration: 5min
completed: 2026-03-14
---

# Phase 3 Plan 01: Customer Data Layer Summary

**Supabase migration adding furigana/phone/email columns, Server Actions with Zod validation and duplicate-warn-but-allow logic, multi-column ilike search with pagination, deterministic avatar colors, and full EN/JP i18n strings**

## Performance

- **Duration:** 5 min
- **Started:** 2026-03-14T03:16:51Z
- **Completed:** 2026-03-14T03:21:51Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments

- Schema migration adds furigana, phone, email columns to customers table with column comments
- Server Actions validate with Zod, detect duplicate names (warn + allow), revalidate /customers and /customers/[id]
- listCustomers queries across name + furigana + phone + email using .or() with ilike, returns paginated results with exact count
- Deterministic avatar color function hashes customer UUID to pick from 10-color pastel palette (dark-theme optimized)
- All customer UI strings added to both EN and JP translation files (form, table, profile, toast, empty states)

## Task Commits

Each task was committed atomically:

1. **Task 1: Schema migration and updated TypeScript types** - `f867f00` (feat)
2. **Task 2: Server Actions, query helpers, and utility functions** - `fd2084a` (feat, committed as part of earlier execution)

**Plan metadata:** TBD (docs commit)

## Files Created/Modified

- `supabase/migrations/002_customer_fields.sql` - ALTER TABLE adding furigana, phone, email with column comments
- `src/types/database.ts` - Customer interface updated with new fields, Database type improved with Relationships metadata
- `src/actions/customers.ts` - createCustomer and updateCustomer Server Actions
- `src/lib/customers/queries.ts` - listCustomers, getCustomer, checkDuplicateName
- `src/lib/customers/utils.ts` - getAvatarColor, getInitials
- `messages/en.json` - Full customer domain i18n strings (EN)
- `messages/ja.json` - Full customer domain i18n strings (JP)

## Decisions Made

- Duplicate name detection warns but does not block creation — `duplicateWarning` field on the success case of ActionResult
- `listCustomers` defaults to `updated_at desc` sort (closest proxy for last visit until karute_records are linked to customers in Phase 4)
- `checkDuplicateName` is non-fatal: Supabase errors return `{ exists: false }` so a failed lookup never blocks customer creation
- No `redirect()` in Server Actions — caller (sheet UI) handles navigation after success

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Created prerequisite scaffold files**
- **Found during:** Task 1 (discovery phase)
- **Issue:** Plan referenced `src/types/database.ts` and `src/lib/supabase/server.ts` from Phase 1 as existing files, but the codebase had already been scaffolded by a previous session with all files present in the initial commit
- **Fix:** Verified existing files matched spec; wrote improved `database.ts` with proper Relationships metadata; confirmed all prerequisite files existed
- **Files modified:** `src/types/database.ts`
- **Verification:** All grep checks passed against committed files
- **Committed in:** `f867f00` (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking — prerequisite files already present from prior scaffold)
**Impact on plan:** No scope creep. Prerequisite check confirmed all Phase 1 artifacts were in place.

## Issues Encountered

- Task 2 files (customers.ts, queries.ts, utils.ts, messages/) were already committed in `fd2084a` as part of a prior Phase 06 scaffolding session. Git showed no diff — files matched exactly. This is expected behavior in a project where multiple phase plans were executed before this formal GSD run.

## User Setup Required

None — no external service configuration required. Supabase migration (`002_customer_fields.sql`) must be run against the Supabase project when the database is being configured (handled in Phase 1 Plan 02 human-verify checkpoint).

## Next Phase Readiness

- 03-02 (customer list page): `listCustomers`, `createCustomer`, `getAvatarColor`, `getInitials`, and all i18n strings are ready
- 03-03 (customer profile page): `getCustomer`, `updateCustomer`, `getAvatarColor`, `getInitials`, and profile/toast i18n strings are ready
- No blockers

---
*Phase: 03-customer-management*
*Completed: 2026-03-14*
