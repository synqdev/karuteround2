# Phase 5: Staff Profiles - Context

**Gathered:** 2026-03-13
**Status:** Ready for planning

<domain>
## Phase Boundary

Staff identity management: creating/editing/deleting staff members, switching the active staff in the header without re-authenticating, and attributing every karute record to the staff member who created it. No per-staff permissions, no avatars, no roles — just names.

</domain>

<decisions>
## Implementation Decisions

### Staff profile fields
- Name only — single text field, no role, no avatar, no initials circle
- Single name field (not dual JP/EN) — staff enters whatever they prefer
- No limit on number of staff members
- Switcher displays name only (no initials circle, no avatar)

### Settings page layout
- Settings page accessible from sidebar navigation link
- Page has "Settings" title at top, then "Staff Members" section heading
- Staff section only for now — no placeholder sections for future settings
- Simple vertical list of staff names with edit/delete icons and "Added [date]" metadata
- "Add Staff" button positioned top-right of the "Staff Members" section heading
- Shared modal component for add and edit — title changes ("Add Staff Member" / "Edit Staff Member")
- Modal has loading spinner on save button while Server Action completes
- Toast notification for success/error feedback (not inline in modal)
- Empty state: "No staff members yet" message with prominent "Add Staff Member" button
- Show "Active" badge next to the currently active staff member in the list
- Staff list always shows all members — no pagination, no search
- Staff list sorted alphabetically — no manual reordering
- Name required validation only — no duplicate name check
- Editing a staff name updates everywhere immediately (DB-driven, single source of truth)
- Delete button uses red/destructive variant

### Staff deletion rules
- Block deletion of staff with existing karute records — show count: "This staff member has X karute records and cannot be deleted."
- Block deletion of the last remaining staff member — must always have at least one
- Staff with no records: confirmation dialog ("Delete [Name]? This action cannot be undone.") then permanent delete
- Record count check happens server-side when delete is attempted (not pre-loaded in list)
- No undo period — deletion is permanent immediately after confirmation
- No audit logging for deletions in v1
- If the currently active staff member is deleted, auto-switch to first alphabetical remaining

### Switcher behavior
- On first login (no cookie), auto-select first alphabetical staff member
- Simple dropdown: click name in header, see list of all staff (including current), click to switch
- Immediate switch on click — no confirmation dialog
- Positioned right side of header
- Dropdown shows all staff members including the currently active one

### Claude's Discretion
- Whether to show a "Staff:" label prefix before the name in the header, or just the name
- Whether to include a chevron/down-arrow icon on the switcher trigger
- Sort order of staff in the header dropdown (alphabetical vs. other)
- Whether to show the switcher as a dropdown or static text when only one staff member exists

</decisions>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches. The existing karute app (synqdev/karute) can be referenced for general UI patterns.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 05-staff-profiles*
*Context gathered: 2026-03-13*
