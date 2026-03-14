---
phase: 03-customer-management
plan: "02"
subsystem: ui
tags: [nextjs, react, react-hook-form, zod, next-intl, sonner, use-debounce, tailwind]

# Dependency graph
requires:
  - phase: 03-customer-management
    plan: "01"
    provides: "listCustomers, createCustomer, getAvatarColor, getInitials, ActionResult type, full EN/JP i18n strings"

provides:
  - "Customers list page at /[locale]/(app)/customers with Server Component reading searchParams"
  - "CustomerSearch: debounced search input (300ms) updating ?query= URL param"
  - "CustomerTable: sortable columns, initials avatar with pastel colors, hover highlight, row click navigation"
  - "CustomerSheet: right-side slide-in sheet with CustomerForm for new customer creation"
  - "CustomerForm: react-hook-form + zod, 4 fields, duplicate warning toast, success/error handling"
  - "CustomerEmptyState: welcoming state with UserPlus icon and sheet CTA"
  - "Pagination: URL-param-based page navigation, hidden at 1 page"
  - "loading.tsx: animate-pulse skeleton matching full page layout"

affects:
  - "03-03 (customer profile page) — CustomerForm is reused for edit; CustomerSheet pattern reused"

# Tech tracking
tech-stack:
  added:
    - "use-debounce (useDebouncedCallback for 300ms search debounce)"
  patterns:
    - "Server Component page reads searchParams via await (Next.js 16 async pattern)"
    - "URL-as-state: search, page, sort, order all in URL params — no client state for filtering"
    - "Suspense boundary keyed on query+page to prevent stale flash on navigation"
    - "CustomerForm accepts customerId prop for dual create/update usage"

key-files:
  created:
    - src/app/[locale]/(app)/customers/page.tsx
    - src/app/[locale]/(app)/customers/loading.tsx
    - src/components/customers/CustomerSearch.tsx
    - src/components/customers/CustomerTable.tsx
    - src/components/customers/CustomerSheet.tsx
    - src/components/customers/CustomerForm.tsx
    - src/components/customers/CustomerEmptyState.tsx
    - src/components/customers/Pagination.tsx
  modified:
    - package.json (added use-debounce)

key-decisions:
  - "No cursor-pointer on table rows — per user decision, hover highlight only (hover:bg-muted/50)"
  - "Visits column shows 0 placeholder — real count deferred to Phase 4 when karute_records are linked"
  - "Last Visit column uses updated_at as proxy — same decision as 03-01"
  - "CustomerForm is created as reusable component accepting customerId for edit mode"
  - "CustomerSheet manages open state locally; success callback from form triggers close + toast"

patterns-established:
  - "URL-as-state pattern: all filter/sort/page params in URL, components read via useSearchParams"
  - "useDebouncedCallback(fn, 300) in CustomerSearch — debounce before router.replace"
  - "Sheet open/close via useState in CustomerSheet; form onSuccess triggers close"
  - "CustomerForm: dual-mode (create/update) via customerId prop"

# Metrics
duration: 2min
completed: 2026-03-14
---

# Phase 3 Plan 02: Customer List Page Summary

**Paginated customer list at /customers with debounced search, sortable table with initials avatars, and a right-side sheet for creating new customers via react-hook-form + zod**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-14T03:25:50Z
- **Completed:** 2026-03-14T03:27:50Z
- **Tasks:** 2
- **Files modified:** 9

## Accomplishments

- Customers page Server Component reads searchParams (query, page, sort, order) with Next.js 16 await pattern, calls listCustomers, shows empty state when no customers
- CustomerSearch uses useDebouncedCallback (300ms) to update ?query= URL param without losing other params; Pagination preserves ?query= when changing pages
- CustomerTable renders 4 columns (Name with initials avatar, Contact, Last Visit, Visits), sort toggles via URL params, hover:bg-muted/50 highlight without cursor change per user decision
- CustomerSheet slides in from right, closes + shows sonner toast on success; list auto-refreshes via revalidatePath
- CustomerForm is dual-mode (create via createCustomer / update via updateCustomer), handles duplicateWarning with toast.warning that does not block the save

## Task Commits

Each task was committed atomically:

1. **Task 1: Customer list page with search and pagination** - `4976029` (feat)
2. **Task 2: Customer table with sorting and new customer sheet** - `6b63e73` (feat)

**Plan metadata:** TBD (docs commit)

## Files Created/Modified

- `src/app/[locale]/(app)/customers/page.tsx` - Server Component: awaits searchParams, calls listCustomers, renders page layout
- `src/app/[locale]/(app)/customers/loading.tsx` - animate-pulse skeleton matching page layout
- `src/components/customers/CustomerSearch.tsx` - Debounced search input (300ms), updates URL ?query=
- `src/components/customers/CustomerTable.tsx` - Sortable table with initials avatars and hover highlight
- `src/components/customers/CustomerSheet.tsx` - Right-side Sheet wrapping CustomerForm
- `src/components/customers/CustomerForm.tsx` - react-hook-form + zod, dual create/update mode
- `src/components/customers/CustomerEmptyState.tsx` - Welcoming empty state with sheet CTA
- `src/components/customers/Pagination.tsx` - URL-based page navigation, hidden at 1 page
- `package.json` - Added use-debounce dependency

## Decisions Made

- No `cursor-pointer` on table rows per user's explicit decision — subtle hover highlight only
- Visits column shows 0 as placeholder — real count requires karute_records join, deferred to Phase 4
- CustomerForm designed as reusable dual-mode component (create vs update) anticipating 03-03 profile edit
- Sheet manages its own open/close state; onSuccess callback from form closes sheet and shows toast

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Created stub CustomerSheet and CustomerTable for page.tsx import resolution**
- **Found during:** Task 1 (creating page.tsx)
- **Issue:** page.tsx imports CustomerSheet and CustomerTable which are Task 2 files — needed stubs to avoid broken imports during Task 1 commit
- **Fix:** Created minimal stubs returning null; overwritten with full implementations in Task 2 commit
- **Files modified:** src/components/customers/CustomerSheet.tsx, src/components/customers/CustomerTable.tsx
- **Verification:** Task 2 commit overwrote stubs with full implementations; all verifications passed
- **Committed in:** `6b63e73` (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking — import dependency between tasks)
**Impact on plan:** No scope creep. Stubs resolved cross-task import dependency; Task 2 delivered full implementations.

## Issues Encountered

- No shadcn `table` or `form` UI components exist — the project uses base-ui primitives. Built the table with native `<table>` elements and Tailwind classes directly (no dependency on missing shadcn components). This is correct given the project's existing UI component pattern.

## User Setup Required

None — all components are client-side React. No external services or environment variables required.

## Next Phase Readiness

- 03-03 (customer profile page): CustomerForm is ready for reuse in edit mode (accepts customerId + defaultValues); all i18n strings including profile section are already in messages/
- CustomerSheet pattern established — profile page can use same Sheet/Form pattern for editing
- No blockers

---
*Phase: 03-customer-management*
*Completed: 2026-03-14*
