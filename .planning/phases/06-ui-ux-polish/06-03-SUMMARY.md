---
phase: 06-ui-ux-polish
plan: "03"
subsystem: ui
tags: [next-intl, i18n, translation, react, typescript]

# Dependency graph
requires:
  - phase: 06-01
    provides: Dashboard layout shell with ThemeProvider and Noto Sans JP font
  - phase: 06-02
    provides: Custom Sidebar and TopBar components with locale/theme toggles

provides:
  - Complete EN/JP translation files covering 7 namespaces and 107 keys
  - Dashboard layout confirmed: Sidebar + TopBar wired into shell (verified from 06-02)
  - All customer components use t() for UI strings
  - Category badge labels translatable via karute.categories namespace
  - Pagination component uses common.previous/common.next translations
  - KaruteHistoryList staff label uses customers.profile.staff translation

affects:
  - 07-recording-ui
  - 08-final-polish
  - Any future pages or components adding UI strings

# Tech tracking
tech-stack:
  added: []
  patterns:
    - next-intl useTranslations/getTranslations for all UI chrome
    - Nested JSON namespace structure (namespace.key or namespace.subkey.key)
    - CategoryBadge uses 'use client' + useTranslations to enable runtime locale switching

key-files:
  created:
    - messages/en.json (complete EN translations - 107 keys, 7 namespaces)
    - messages/ja.json (matching JP translations - 107 keys, 7 namespaces)
    - .planning/phases/06-ui-ux-polish/06-03-SUMMARY.md
  modified:
    - src/components/customers/Pagination.tsx (hardcoded Previous/Next replaced with t())
    - src/components/customers/KaruteHistoryList.tsx (hardcoded Staff replaced with t())
    - src/components/karute/CategoryBadge.tsx (added useTranslations for category labels)
    - src/components/karute/CustomerCombobox.tsx (translated No customers found / New customer)
    - src/components/karute/QuickCreateCustomer.tsx (all form strings via customers namespace)
    - src/components/karute/SaveKaruteFlow.tsx (Customer, Save karute, noDraftFound via karute namespace)

key-decisions:
  - "Translation namespace structure uses 7 namespaces: common, auth, sidebar, recording, customers, karute, settings"
  - "Category keys use snake_case values matching categories.ts constants (symptom, body_area, next_visit) not the plan's UPPERCASE spec"
  - "CategoryBadge converted to 'use client' to support useTranslations for runtime locale switching"
  - "AI-generated content (transcript, summary, entry content) intentionally NOT wrapped in t() -- database values displayed as-is"
  - "Task 1 (layout wiring) was already complete from 06-02 -- no changes needed to layout.tsx"

patterns-established:
  - "All UI chrome strings must use t() from next-intl -- no hardcoded English text in JSX"
  - "Translation keys follow en.json structure exactly in ja.json -- validated with deepKeys check"
  - "Pagination uses common namespace for Previous/Next/pageN -- reusable across list pages"

# Metrics
duration: 25min
completed: 2026-03-13
---

# Phase 6 Plan 03: Layout Integration and Translation Completion Summary

**Complete bilingual translation system: 107 EN/JP keys across 7 namespaces with all customer, karute, and layout components using useTranslations instead of hardcoded strings**

## Performance

- **Duration:** ~25 min
- **Started:** 2026-03-13T00:00:00Z
- **Completed:** 2026-03-13T00:25:00Z
- **Tasks:** 2 (Task 1 pre-verified, Task 2 implemented)
- **Files modified:** 8

## Accomplishments

- Verified dashboard layout was already fully wired from 06-02 (Sidebar + TopBar in layout shell)
- Expanded translation files from 2 namespaces (sidebar, customers) to 7 namespaces (common, auth, sidebar, recording, customers, karute, settings) with 107 matching EN/JP keys
- Fixed 6 components that had hardcoded English strings — all now use useTranslations
- Category badges now render translated labels when locale toggles (CategoryBadge converts to client component)
- TypeScript type check passes with zero errors

## Task Commits

1. **Task 1: Wire Sidebar and TopBar into dashboard layout** — pre-existing (verified from 06-02, no changes needed)
2. **Task 2: Complete EN/JP translation files for all pages** — `cbf8009` (feat)

## Files Created/Modified

- `messages/en.json` — Expanded from 2 to 7 namespaces, 107 total translation keys
- `messages/ja.json` — Matching 107 Japanese translation keys
- `src/components/customers/Pagination.tsx` — Replaced "Previous"/"Next" with t('common.previous')/t('common.next')
- `src/components/customers/KaruteHistoryList.tsx` — Replaced "Staff" with t('customers.profile.staff')
- `src/components/karute/CategoryBadge.tsx` — Added 'use client' + useTranslations for category label i18n
- `src/components/karute/CustomerCombobox.tsx` — "No customers found" and "New customer" use customers namespace
- `src/components/karute/QuickCreateCustomer.tsx` — All form strings use customers namespace
- `src/components/karute/SaveKaruteFlow.tsx` — Customer, Save karute, error messages use karute namespace

## Decisions Made

- Category translation keys use snake_case (matching categories.ts values: `body_area`, `next_visit`) rather than the plan's UPPERCASE spec (`BODY_AREA`) — keeping consistent with the actual data values used at runtime
- CategoryBadge added `'use client'` directive to enable `useTranslations` hook — acceptable since it's already embedded in client component trees
- Task 1 was pre-complete; skipped empty commit and documented verification instead

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing i18n] Extended translation scope to untracked karute components**
- **Found during:** Task 2 (translation audit)
- **Issue:** SaveKaruteFlow, CustomerCombobox, and QuickCreateCustomer (untracked files from prior phases) had hardcoded English strings that would not toggle on locale switch
- **Fix:** Added useTranslations to all three components using existing customers and karute namespaces
- **Files modified:** src/components/karute/CustomerCombobox.tsx, src/components/karute/QuickCreateCustomer.tsx, src/components/karute/SaveKaruteFlow.tsx
- **Verification:** TypeScript passes, no new translation keys needed (reused existing namespaces)
- **Committed in:** cbf8009

**2. [Rule 2 - Missing i18n] CategoryBadge converted to client component for runtime locale support**
- **Found during:** Task 2 (translation audit)
- **Issue:** CategoryBadge used hardcoded config.label (English only) with no locale awareness
- **Fix:** Added 'use client' + useTranslations('karute.categories') with fallback to config.label
- **Files modified:** src/components/karute/CategoryBadge.tsx
- **Verification:** TypeScript passes, category translation keys match categories.ts values
- **Committed in:** cbf8009

---

**Total deviations:** 2 auto-fixed (both Rule 2 — missing critical i18n)
**Impact on plan:** Both fixes essential for locale toggle to work correctly on all pages. No scope creep.

## Issues Encountered

- Translation key structure in plan spec used UPPERCASE category names (SYMPTOM, TREATMENT) but categories.ts uses snake_case (symptom, body_area, next_visit). Used snake_case to match runtime values exactly.
- `git stash` during investigation temporarily reverted edits; stash pop restored all changes. Final state verified by type check pass.

## Next Phase Readiness

- Translation infrastructure complete — all future pages should use the established namespace structure
- Remaining missing pages (sessions, karute list/detail, settings, login) will use the pre-defined namespaces from this plan
- Ready for 06-04 or next phase

---
*Phase: 06-ui-ux-polish*
*Completed: 2026-03-13*
