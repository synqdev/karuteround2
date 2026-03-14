---
phase: 03-customer-management
plan: "03"
subsystem: ui
tags: [next-intl, react-hook-form, zod, supabase, lucide-react, sonner]

# Dependency graph
requires:
  - phase: 03-customer-management
    plan: "01"
    provides: "getCustomer, updateCustomer, getAvatarColor, getInitials, i18n strings, Customer type"
provides:
  - "Customer profile page at /customers/[id] with parallel data fetching (Promise.all)"
  - "CustomerProfileHeader with large initials avatar, name/furigana, contact info, visit stats, Edit button"
  - "CustomerInlineEdit with react-hook-form + zodResolver, updateCustomer Server Action, sonner toasts"
  - "KaruteHistoryList with session rows, empty state, historyPage URL param pagination"
  - "Loading skeleton for customer profile page"
  - "Corrected database.ts types: karute_records uses client_id/staff_profile_id/session_date per SQL schema"
affects:
  - "04-karute-records — KaruteHistoryList already wired to karute_records via client_id FK"
  - "Phase 4 does NOT need to modify this page — query scaffolded here"

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Promise.all parallel fetch in Next.js 16 Server Component: await params, await searchParams"
    - "Client Component inline edit toggle: useState(false) in parent, swap display/form views"
    - "KaruteHistoryList accepts records as Array<partial> — loose typing allows page to cast Supabase response"

key-files:
  created:
    - src/app/[locale]/(app)/customers/[id]/page.tsx
    - src/app/[locale]/(app)/customers/[id]/loading.tsx
    - src/components/customers/CustomerProfileHeader.tsx
    - src/components/customers/CustomerInlineEdit.tsx
    - src/components/customers/KaruteHistoryList.tsx
  modified:
    - src/types/database.ts
    - src/lib/supabase/karute.ts
    - src/actions/karute.ts

key-decisions:
  - "Route path is [locale]/(app)/customers/[id] not (app)/customers/[id] — matches actual Next.js [locale] routing structure"
  - "client_id (not customer_id) is the FK from karute_records to customers.id — used for profile page query"
  - "database.ts types corrected to match SQL schema: profiles.customer_id added, karute_records fields renamed"

patterns-established:
  - "Inline edit: parent holds isEditing state, swaps <DisplayView> and <EditForm> components in same card"
  - "KaruteHistoryList empty state: expected in Phase 3, card still renders with FileText icon + noVisits text"
  - "historyPage URL param: separate from main ?page= pagination to allow independent navigation"

# Metrics
duration: 8min
completed: 2026-03-14
---

# Phase 3 Plan 03: Customer Profile Page Summary

**Customer profile page with Promise.all parallel fetch, initials avatar header with inline editing via react-hook-form, and karute history list scaffolded against client_id FK for Phase 4 data**

## Performance

- **Duration:** 8 min
- **Started:** 2026-03-14T03:25:42Z
- **Completed:** 2026-03-14T03:33:42Z
- **Tasks:** 2
- **Files modified:** 8

## Accomplishments

- Profile page at `/customers/[id]` fetches customer + karute_records in parallel; calls `notFound()` on missing customer
- `CustomerProfileHeader` renders large initials avatar (64px) with deterministic color, name, furigana, phone/email with Lucide icons, visit stats, and Edit button toggling inline edit mode
- `CustomerInlineEdit` uses react-hook-form + zodResolver with same schema as customers.ts, calls `updateCustomer` Server Action, shows sonner toast on success/error
- `KaruteHistoryList` renders session rows (date, Staff placeholder, summary snippet) with click-to-karute navigation and `?historyPage` URL param pagination; shows FileText empty state for Phase 3
- `database.ts` corrected to match actual SQL schema: `profiles.customer_id` added, `karute_records` now has `client_id`/`staff_profile_id`/`session_date` replacing incorrect `staff_id`/`duration` columns

## Task Commits

Each task was committed atomically:

1. **Task 1: Customer profile page with parallel data fetching** - `03a7d43` (feat)
2. **Task 2: Profile header, inline edit, and karute history list** - `3625f50` (feat)

**Auto-fix commits:**
- `40762b5` fix: align KaruteHistoryList type with session_date field
- `dfc75fd` fix: align database types with actual SQL schema for karute_records
- `d764490` fix: update profiles type and karute queries to match actual SQL schema

## Files Created/Modified

- `src/app/[locale]/(app)/customers/[id]/page.tsx` - Server Component: parallel fetch, notFound, renders header + history list
- `src/app/[locale]/(app)/customers/[id]/loading.tsx` - Skeleton: avatar, name, contact, 3 history row skeletons
- `src/components/customers/CustomerProfileHeader.tsx` - Large avatar, name/contact display, visit stats, Edit toggle
- `src/components/customers/CustomerInlineEdit.tsx` - Inline edit form with react-hook-form + updateCustomer
- `src/components/customers/KaruteHistoryList.tsx` - Session list with date/staff/summary, empty state, historyPage pagination
- `src/types/database.ts` - Fixed karute_records (client_id, staff_profile_id, session_date) and profiles (customer_id)
- `src/lib/supabase/karute.ts` - getKaruteRecord query updated to use client_id, staff_profile_id, session_date
- `src/actions/karute.ts` - saveKaruteRecord insert updated to use client_id + staff_profile_id

## Decisions Made

- Route at `[locale]/(app)/customers/[id]` (not `(app)/customers/[id]`) matching the existing locale-prefixed routing structure
- Used `client_id` FK for filtering karute_records on the profile page — this is the FK to `customers.id` per the SQL schema; `customer_id` in karute_records is the business tenant UUID for RLS
- KaruteHistoryList type interface uses optional `session_date` with fallback to `created_at` for date display

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Correct routing path from (app) to [locale]/(app)**
- **Found during:** Task 1
- **Issue:** Plan specified `src/app/(app)/customers/[id]/page.tsx` but actual routing structure is `src/app/[locale]/(app)/customers/[id]/page.tsx`
- **Fix:** Created files at the correct path matching the existing layout structure
- **Files modified:** All created files at correct [locale]/(app) path
- **Verification:** Files exist, align with `src/app/[locale]/(app)/layout.tsx`
- **Committed in:** `03a7d43`

**2. [Rule 1 - Bug] Fixed database.ts types to match actual SQL schema**
- **Found during:** Task 2 (TypeScript compilation)
- **Issue:** `database.ts` had `karute_records` with `staff_id`/`duration` (wrong) instead of `client_id`/`staff_profile_id`/`session_date` (per SQL). Also `profiles` was missing `customer_id` column.
- **Fix:** Updated KaruteRecordRow to have `client_id`, `staff_profile_id`, `session_date`. Added `customer_id` to ProfileRow. Updated `lib/supabase/karute.ts` and `actions/karute.ts` to use correct column names.
- **Files modified:** `src/types/database.ts`, `src/lib/supabase/karute.ts`, `src/actions/karute.ts`
- **Verification:** `npx tsc --noEmit` passes with no errors
- **Committed in:** `dfc75fd`, `d764490`

**3. [Rule 3 - Blocking] 03-02 Pagination component not available**
- **Found during:** Task 2
- **Issue:** Plan references `<Pagination>` component from 03-02 but 03-02 was not executed
- **Fix:** Built pagination inline in KaruteHistoryList using ChevronLeft/ChevronRight buttons and URL param navigation
- **Files modified:** `src/components/customers/KaruteHistoryList.tsx`
- **Committed in:** `3625f50`

---

**Total deviations:** 3 auto-fixed (1 path correction, 1 type bug, 1 missing dependency)
**Impact on plan:** All auto-fixes necessary for correctness. The database type corrections fixed pre-existing issues in the codebase that would have caused runtime failures.

## Issues Encountered

- An active linter/formatter kept reverting file changes between writes. Required multiple attempts and immediate git staging after writes to preserve correct content. Root cause: linter was inferring schema from the incorrect database.ts types and reverting queries to match. Fixed by updating database.ts first.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- Phase 4 karute records can populate KaruteHistoryList without modifying the page — query already wired with `client_id` FK and `session_date` ordering
- `CustomerInlineEdit` handles name, furigana, phone, email — CUST-02 fulfilled
- Karute history empty state displays cleanly in Phase 3 — CUST-04 scaffolded
- TypeScript is fully clean with corrected database types

---
*Phase: 03-customer-management*
*Completed: 2026-03-14*
