---
phase: 05-staff-profiles
plan: "02"
subsystem: ui
tags: [react, shadcn, react-hook-form, zod, sonner, dialog, server-components]

requires:
  - phase: 05-staff-profiles
    plan: "01"
    provides: Staff Server Actions (createStaff, updateStaff, deleteStaff), data helpers (getStaffList, getActiveStaffId), Zod schema (staffProfileSchema)

provides:
  - Settings page at /[locale]/(app)/settings — Server Component fetching staff list + active staff ID
  - StaffList client component with edit/delete actions, Active badge, Added date metadata
  - StaffForm dialog for create and edit modes using react-hook-form + Zod

affects:
  - 05-03-staff-switcher

tech-stack:
  added: []
  patterns:
    - Server Component fetches data, passes to client component for interactivity
    - StaffForm as controlled Dialog with open state from parent (StaffList)
    - Toast-only feedback pattern — no inline errors in modal forms
    - Loading spinner on submit button via isSubmitting from react-hook-form

key-files:
  created:
    - src/app/[locale]/(app)/settings/page.tsx
    - src/components/staff/StaffList.tsx
    - src/components/staff/StaffForm.tsx
  modified: []

key-decisions:
  - "StaffList manages open state for StaffForm — local useState for showCreateForm and editingStaff; no separate modal manager needed"
  - "Browser confirm() used for delete confirmation — acceptable for v1, avoids additional Dialog state"
  - "StaffForm renders as always-open Dialog (open={true}) controlled by parent mounting/unmounting — simpler than tracking open state inside form"

patterns-established:
  - "Pattern 1: Server Component settings page — fetch server-side, pass as props to client list component"
  - "Pattern 2: Modal form from parent state — parent useState controls which form is shown; onClose unmounts the form"

duration: 10min
completed: 2026-03-14
---

# Phase 5 Plan 02: Staff Settings UI Summary

**Settings page with staff management: StaffList (Active badge, Added date, edit/delete), StaffForm dialog (create/edit, name-only, react-hook-form + Zod, toast feedback)**

## Performance

- **Duration:** 10 min
- **Started:** 2026-03-14T03:35:23Z
- **Completed:** 2026-03-14T03:45:00Z
- **Tasks:** 2
- **Files created:** 3

## Accomplishments

- Settings page Server Component at `/[locale]/(app)/settings` fetches staffList and activeStaffId server-side, passes to StaffList client component
- StaffList renders each staff member with name, "Added [date]" metadata, "Active" badge for the cookie-selected staff, and Edit/Delete action buttons (delete is red/destructive variant)
- StaffForm Dialog component handles both create and edit modes: name-only field, react-hook-form + zodResolver, loading spinner on save button, toast-only success/error feedback

## Task Commits

Each task was committed atomically:

1. **Task 1: Settings page and StaffList component** - `31019be` (feat)
2. **Task 2: StaffForm component for create and edit** - `aa13b64` (feat)

## Files Created/Modified

- `src/app/[locale]/(app)/settings/page.tsx` — Server Component settings page; fetches `getStaffList()` and `getActiveStaffId()` in parallel, renders heading + StaffList
- `src/components/staff/StaffList.tsx` — Client component; renders staff list with name, "Added [date]", Active badge, Edit/Delete buttons; manages StaffForm open state via local useState; empty state shows "No staff members yet" + Add Staff Member button
- `src/components/staff/StaffForm.tsx` — Client component; Dialog modal for create/edit; react-hook-form + zodResolver(staffProfileSchema); loading spinner on submit; toast.success/toast.error; calls createStaff or updateStaff Server Action

## Decisions Made

- `StaffForm` is mounted/unmounted by parent (`StaffList`) rather than using an internal `open` prop — cleaner state reset between usages, no stale form data
- `window.confirm()` for delete confirmation — v1 acceptable, avoids additional Dialog state complexity; guards (last-member, has-records) are enforced server-side via `deleteStaff` throwing errors shown as toasts
- `Dialog open={true}` with `onOpenChange` calling `onClose` — allows the base-ui Dialog to handle its own overlay click and Escape key dismissal

## Deviations from Plan

None - plan executed exactly as written.

---

**Total deviations:** 0
**Impact on plan:** Clean execution, no scope changes.

## Issues Encountered

None.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- Staff management UI is complete: admin can list, create, edit, and delete staff via the Settings page at `/settings`
- Ready for Phase 5 Plan 03: Staff Switcher in the header top bar (reads `active_staff_id` cookie, calls `setActiveStaff`)
- The `StaffSwitcher` component already exists at `src/components/staff/StaffSwitcher.tsx` from the initial commit; Plan 03 wires it into `TopBar`

---
*Phase: 05-staff-profiles*
*Completed: 2026-03-14*

## Self-Check: PASSED

All required files exist and all commits verified:
- `src/app/[locale]/(app)/settings/page.tsx` — FOUND
- `src/components/staff/StaffList.tsx` — FOUND
- `src/components/staff/StaffForm.tsx` — FOUND
- `.planning/phases/05-staff-profiles/05-02-SUMMARY.md` — FOUND
- Commit `31019be` (Task 1 — Settings page + StaffList) — FOUND
- Commit `aa13b64` (Task 2 — StaffForm) — FOUND
