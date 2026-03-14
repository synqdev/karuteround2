---
phase: 04-karute-records
plan: 03
subsystem: ui
tags: [react, next-js, typescript, sessionStorage, server-actions, sonner]

# Dependency graph
requires:
  - phase: 04-01
    provides: saveKaruteRecord Server Action and SaveKaruteInput type
  - phase: 03-01
    provides: createCustomer and customer data model
provides:
  - KaruteDraft type with saveDraft/loadDraft/clearDraft sessionStorage helpers (1-hour TTL, SSR-safe)
  - CustomerCombobox component: searchable input+dropdown with inline '+ New customer' option
  - QuickCreateCustomer component: inline name-only customer creation form
  - SaveKaruteFlow component: end-to-end save UI connecting Phase 2 draft output to Phase 4 persistence
  - createQuickCustomer Server Action: minimal name-only customer creation for inline flow
affects:
  - 02-ai-pipeline (writes KaruteDraft to sessionStorage; SaveKaruteFlow reads it)
  - 04-02 (karute detail view is the redirect target after saveKaruteRecord)
  - 05-staff (staffId in SaveKaruteFlow falls back to first profile; Phase 5 wires real switcher)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - sessionStorage draft handoff pattern: Phase 2 writes draft, Phase 4 reads and clears after persist
    - onMouseDown e.preventDefault() in dropdown items to prevent input blur race before selection
    - hasMounted guard for sessionStorage-dependent React rendering (avoids SSR/hydration mismatch)
    - NEXT_REDIRECT error re-throw pattern: catch block must re-throw redirect() exceptions so Next.js navigation works

key-files:
  created:
    - src/lib/karute/draft.ts
    - src/components/karute/CustomerCombobox.tsx
    - src/components/karute/QuickCreateCustomer.tsx
    - src/components/karute/SaveKaruteFlow.tsx
  modified:
    - src/actions/customers.ts

key-decisions:
  - "Simple input+dropdown for CustomerCombobox (no cmdk/radix-ui) — neither library is installed in this project"
  - "onMouseDown + e.preventDefault() in dropdown list items to prevent input blur firing before selection handler"
  - "hasMounted state guard in SaveKaruteFlow renders skeleton during SSR/hydration then loads sessionStorage on client"
  - "clearDraft() called before saveKaruteRecord to clean up optimistically; draft restored in state on error"
  - "NEXT_REDIRECT exception re-thrown from catch block so Next.js redirect() works correctly from SaveKaruteFlow"

patterns-established:
  - "Pattern: sessionStorage draft TTL — loadDraft() discards entries older than 1 hour; always call clearDraft() after persist"
  - "Pattern: hasMounted guard — render skeleton server-side, load sessionStorage after useEffect mount"
  - "Pattern: createQuickCustomer — name-only Server Action for inline creation without leaving the flow"

# Metrics
duration: 3min
completed: 2026-03-14
---

# Phase 4 Plan 03: Karute Save Flow Summary

**sessionStorage draft helpers (saveDraft/loadDraft/clearDraft with 1-hour TTL) + searchable CustomerCombobox + inline QuickCreateCustomer + SaveKaruteFlow connecting Phase 2 AI output to Phase 4 persistence via saveKaruteRecord**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-14T03:28:59Z
- **Completed:** 2026-03-14T03:31:30Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments

- Created `KaruteDraft` type and `saveDraft/loadDraft/clearDraft` helpers with 1-hour TTL expiry and full SSR safety (typeof window guards throughout)
- Built `CustomerCombobox` with real-time filtering, keyboard-accessible dropdown, onMouseDown+preventDefault to prevent blur-before-select race condition, and inline "+ New customer" option
- Built `QuickCreateCustomer` inline form calling `createQuickCustomer` Server Action — auto-focuses, handles Escape, immediately selects created customer via `onCreated` callback
- Built `SaveKaruteFlow` that loads draft from sessionStorage on mount (with hasMounted skeleton to prevent SSR mismatch), shows customer selector, saves on click with loading state, and properly re-throws NEXT_REDIRECT exceptions so Next.js navigation works
- Added `createQuickCustomer` Server Action to `src/actions/customers.ts` for name-only inline customer creation

## Task Commits

1. **Task 1: Create sessionStorage draft helpers** - `fa81b06` (feat)
2. **Task 2: Create customer combobox and save flow components** - `00c9e4b` (feat)

**Plan metadata:** (see final commit)

## Files Created/Modified

- `src/lib/karute/draft.ts` - KaruteDraft type + saveDraft/loadDraft/clearDraft with 1-hour TTL and SSR safety
- `src/components/karute/CustomerCombobox.tsx` - Searchable input+dropdown with '+ New customer' option
- `src/components/karute/QuickCreateCustomer.tsx` - Inline name-only customer creation form
- `src/components/karute/SaveKaruteFlow.tsx` - Save flow: loads draft, customer selector, save button with redirect
- `src/actions/customers.ts` - Added createQuickCustomer Server Action (name-only insert, returns id+name)

## Decisions Made

- **No cmdk/radix:** CustomerCombobox uses plain input+dropdown — cmdk and @radix-ui/react-popover are not installed in this project. The simple pattern delivers the same UX without adding dependencies.
- **onMouseDown + e.preventDefault():** Dropdown list items use onMouseDown instead of onClick. When a user clicks a list item, the browser fires blur on the input first (which would close the dropdown before the click registers). Using onMouseDown with preventDefault() intercepts before blur.
- **hasMounted guard:** SaveKaruteFlow renders a skeleton div server-side and only reads sessionStorage after the first useEffect. This prevents React hydration mismatch warnings.
- **Optimistic clearDraft:** `clearDraft()` is called before `saveKaruteRecord()` so sessionStorage is clean even if the redirect throws. On error, the component stays mounted and shows a toast (the draft is gone but the user can go back to Phase 2 to re-generate).
- **NEXT_REDIRECT re-throw:** The catch block in `handleSave` checks for NEXT_REDIRECT message and re-throws — Next.js redirect() works by throwing a special internal error that must propagate to the React/Next.js runtime.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Added createQuickCustomer Server Action to actions/customers.ts**
- **Found during:** Task 2 (QuickCreateCustomer implementation)
- **Issue:** Plan specified QuickCreateCustomer should call a Server Action for customer creation. Phase 3's `createCustomer` validates full form data including optional furigana/phone/email and runs duplicate detection — too heavyweight for an inline quick-create. No minimal action existed.
- **Fix:** Added `createQuickCustomer(name: string)` to `src/actions/customers.ts`: name-only validation, direct insert, returns `{ id, name }` for immediate selection.
- **Files modified:** `src/actions/customers.ts`
- **Verification:** TypeScript compilation passes (exit code 0)
- **Committed in:** `00c9e4b` (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 Rule 2 - missing critical functionality)
**Impact on plan:** The createQuickCustomer action was required for QuickCreateCustomer to function. Adding it to the existing customers actions file keeps all customer mutations co-located. No scope creep.

## Issues Encountered

None — TypeScript compilation passed with exit code 0 after all files were created.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Save flow is complete: Phase 2 AI review screen can call `saveDraft()`, and `SaveKaruteFlow` reads and clears it after persist
- Phase 4 Plan 02 (karute detail view) is the redirect target of `saveKaruteRecord` — SaveKaruteFlow wires directly to it
- Phase 5 (staff management): `SaveKaruteFlow` passes `draft.staffId` to `saveKaruteRecord`; the draft's `staffId` field is ready to be populated by Phase 5's staff switcher

---
*Phase: 04-karute-records*
*Completed: 2026-03-14*
