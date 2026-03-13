# Phase 5: Staff Profiles - Research

**Researched:** 2026-03-13
**Domain:** Staff profile CRUD, session-scoped active staff state, header switcher UI, karute attribution
**Confidence:** HIGH (core patterns verified against Next.js 16 official docs and Supabase official docs; UI patterns verified against shadcn/ui official docs)

---

## Summary

Phase 5 builds three distinct capabilities on top of the Phase 1 foundation: a data layer for CRUD on the `profiles` table (which already exists in the schema), a Settings UI for managing staff profiles, and a header-level staff switcher that propagates the active staff member into all karute save operations.

The central architectural challenge is not the database layer — that is straightforward Supabase CRUD via Server Actions — but rather **how to persist the active staff selection across page navigations without tying it to re-authentication**. Because the app uses a single business Supabase auth account (all staff share one login), staff identity is a UI-level concept, not an auth-level one. The chosen mechanism for persisting active staff must survive page refreshes, be server-readable so `staff_id` can be written at the server level, and be visible in the header at all times.

The recommended pattern is a **cookie-backed active staff selection**: when a staff member selects themselves from the header dropdown, a Server Action writes a `active_staff_id` cookie. The header reads this cookie server-side to display the current staff name. All save operations read `active_staff_id` from the cookie server-side, never trusting client-supplied identity. This is the right tradeoff: survives refresh, readable server-side, no re-auth required, no localStorage dependency.

**Primary recommendation:** Use cookie-backed active staff persistence (written via Server Action, read server-side in all save flows). Never store active staff identity only in React state or localStorage.

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@supabase/supabase-js` | ^2.99.1 | CRUD operations on `profiles` table | Already in stack from Phase 1 |
| `@supabase/ssr` | ^0.x latest | Server-side reads (Server Actions, Server Components) | Required for cookie-based auth in App Router |
| `next/headers` `cookies()` | Next.js 16 built-in | Read/write active staff cookie in Server Actions | Official Next.js API for server-side cookie access |
| `react-hook-form` | ^7.x | Staff profile edit/create form | Already in stack; pairs with Zod for validation |
| `zod` | ^4.3.6 | Form validation schema for staff name/display info | Already in stack |
| shadcn/ui `DropdownMenu` | CLI v4.0.5 | Header staff switcher UI | Accessible, keyboard-navigable, dark theme ready |
| shadcn/ui `Select` | CLI v4.0.5 | Staff picker in recording modal (Phase 1 integration) | Form-friendly controlled select component |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| shadcn/ui `Dialog` | CLI v4.0.5 | Create/edit staff profile modal | When inline editing is preferred over a separate page |
| shadcn/ui `Table` | CLI v4.0.5 | Staff list in Settings page | Standard list presentation |
| `@hookform/resolvers` | ^5.2.2 | Zod v4 integration with react-hook-form | Already in stack |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Cookie for active staff | `localStorage` + React context | `localStorage` is client-only — server-side save flows can't read it, so `staff_id` would have to be passed as a form field from the client. Cookies are readable server-side, keeping attribution logic server-authoritative. |
| Cookie for active staff | Supabase session metadata (`auth.updateUser({ data: { active_staff_id } })`) | Writes to Supabase on every staff switch (expensive, async, requires network). Cookies are synchronous, local, zero-latency. |
| Server Action for staff switch | API Route Handler | Server Actions are simpler for mutations with no large payloads. Route Handlers add boilerplate without benefit here. |

**Installation:** No new packages needed — all dependencies are in the Phase 1 stack.

---

## Architecture Patterns

### Recommended Project Structure

```
src/
├── app/
│   ├── (app)/
│   │   ├── layout.tsx          # Authenticated shell — reads active_staff_id cookie, passes to StaffSwitcher
│   │   └── settings/
│   │       └── page.tsx        # Settings page — staff list + create/edit UI
├── components/
│   ├── staff/
│   │   ├── StaffSwitcher.tsx   # 'use client' — header dropdown, calls setActiveStaff action
│   │   ├── StaffList.tsx       # Server Component — lists staff from DB
│   │   └── StaffForm.tsx       # 'use client' — create/edit form with react-hook-form
├── actions/
│   └── staff.ts                # 'use server' — createStaff, updateStaff, deleteStaff, setActiveStaff
├── lib/
│   └── staff.ts                # getStaffList(), getStaffById(), getActiveStaffId() helpers
└── types/
    └── database.ts             # Generated Supabase types (includes profiles table)
```

### Pattern 1: Cookie-Backed Active Staff

**What:** When a staff member is selected from the header dropdown, a Server Action writes `active_staff_id` to a cookie. Server Components and Server Actions read this cookie via `cookies()` from `next/headers`. The header reads it server-side to display the current name. All karute save operations read it server-side when writing `staff_id` to the record.

**When to use:** Any time active staff identity needs to be readable on the server (for attribution) while being changeable without re-authentication.

**Example:**
```typescript
// actions/staff.ts
'use server'

import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'

export async function setActiveStaff(staffId: string) {
  const cookieStore = await cookies()
  cookieStore.set('active_staff_id', staffId, {
    httpOnly: false,    // readable by JS for UI display
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30, // 30 days — persists across browser sessions
  })
  revalidatePath('/', 'layout') // re-render header with new staff name
}

// lib/staff.ts
import { cookies } from 'next/headers'

export async function getActiveStaffId(): Promise<string | null> {
  const cookieStore = await cookies()
  return cookieStore.get('active_staff_id')?.value ?? null
}
```
Source: Next.js 16 official docs — server actions and cookies API (HIGH confidence)

### Pattern 2: Staff CRUD via Server Actions

**What:** Create, update, and delete staff profiles using Server Actions that call the Supabase server client. After each mutation, call `revalidatePath('/settings')` to refresh the Settings page list.

**When to use:** All staff profile mutations — this is standard CRUD, no large payloads, no binary data.

**Example:**
```typescript
// actions/staff.ts
'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createStaff(data: { name: string; display_info?: string }) {
  const supabase = createClient()
  const { error } = await supabase
    .from('profiles')
    .insert([{ name: data.name, display_info: data.display_info }])

  if (error) throw new Error(error.message)
  revalidatePath('/settings')
}

export async function updateStaff(id: string, data: { name: string; display_info?: string }) {
  const supabase = createClient()
  const { error } = await supabase
    .from('profiles')
    .update({ name: data.name, display_info: data.display_info })
    .eq('id', id)

  if (error) throw new Error(error.message)
  revalidatePath('/settings')
}

export async function deleteStaff(id: string) {
  const supabase = createClient()
  const { error } = await supabase
    .from('profiles')
    .delete()
    .eq('id', id)

  if (error) throw new Error(error.message)
  revalidatePath('/settings')
}
```
Source: Supabase JS reference docs + Next.js 16 Server Actions docs (HIGH confidence)

### Pattern 3: Propagating Active Staff to Karute Save

**What:** When saving a karute record, the save Server Action reads `active_staff_id` from the cookie (server-side) and writes it to the `staff_id` column in the database. The client never passes `staff_id` — the server always authoritative-reads it from the cookie.

**When to use:** Every karute record save operation.

**Example:**
```typescript
// actions/karute.ts
'use server'

import { getActiveStaffId } from '@/lib/staff'
import { createClient } from '@/lib/supabase/server'

export async function saveKaruteRecord(karuteData: KaruteRecordInput) {
  const staffId = await getActiveStaffId()

  if (!staffId) {
    throw new Error('No active staff selected. Please select a staff member before saving.')
  }

  const supabase = createClient()
  const { data, error } = await supabase
    .from('karute_records')
    .insert([{ ...karuteData, staff_id: staffId }])
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}
```

### Pattern 4: Header Staff Switcher as Client Component

**What:** The `StaffSwitcher` in the header is a `'use client'` component that calls the `setActiveStaff` Server Action on selection. The parent layout (Server Component) fetches the current staff list and active staff name from the DB and cookie respectively, then passes them as props to `StaffSwitcher`.

**When to use:** Any interactive dropdown in the header that must trigger a server mutation (cookie write + revalidation).

**Example:**
```typescript
// app/(app)/layout.tsx (Server Component)
import { createClient } from '@/lib/supabase/server'
import { getActiveStaffId } from '@/lib/staff'
import StaffSwitcher from '@/components/staff/StaffSwitcher'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient()
  const { data: staffList } = await supabase.from('profiles').select('id, name').order('name')
  const activeStaffId = await getActiveStaffId()
  const activeStaff = staffList?.find(s => s.id === activeStaffId) ?? staffList?.[0] ?? null

  return (
    <div>
      <header>
        <StaffSwitcher staffList={staffList ?? []} activeStaff={activeStaff} />
      </header>
      <main>{children}</main>
    </div>
  )
}
```

```typescript
// components/staff/StaffSwitcher.tsx
'use client'

import { setActiveStaff } from '@/actions/staff'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'

interface StaffSwitcherProps {
  staffList: { id: string; name: string }[]
  activeStaff: { id: string; name: string } | null
}

export default function StaffSwitcher({ staffList, activeStaff }: StaffSwitcherProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">{activeStaff?.name ?? 'Select Staff'}</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        {staffList.map(staff => (
          <DropdownMenuItem key={staff.id} onClick={() => setActiveStaff(staff.id)}>
            {staff.name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
```
Source: Next.js 16 official docs (context providers, server/client composition) + shadcn/ui DropdownMenu docs (HIGH confidence)

### Pattern 5: Displaying Staff Attribution on Karute Records

**What:** When loading a karute record detail view, join the `profiles` table to fetch the staff name. Display the staff name as a read-only field on the record.

**When to use:** Karute detail view (implemented in Phase 4, updated in Phase 5 to show staff name).

**Example:**
```typescript
// Server Component query
const { data } = await supabase
  .from('karute_records')
  .select('*, profiles(name)')
  .eq('id', recordId)
  .single()

// data.profiles.name → staff member who created the record
```

### Anti-Patterns to Avoid

- **Active staff in React context only:** Context is destroyed on full-page navigation. `staff_id` written to the database would be null if the user navigates away and comes back. Use cookies.
- **Active staff in localStorage only:** Not readable server-side. Any save action would require the client to pass `staff_id` as a form field, making it spoofable and architecturally wrong.
- **Trusting client-passed `staff_id` in save actions:** If the client passes `staff_id` as a form field, it can be manipulated. Always read from the server-side cookie in save actions.
- **Fetching staff list in every Server Component:** Fetch once in the app layout and pass as props. Don't re-fetch the full staff list on every page render.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Accessible dropdown for staff selection | Custom `<div>` dropdown | shadcn/ui `DropdownMenu` | Keyboard navigation, ARIA roles, focus management — all handled |
| Staff profile form validation | Manual validation logic | `react-hook-form` + `zod` + `zodResolver` | Already in stack; type-safe, declarative, handles async validation |
| Cookie manipulation | Manual `document.cookie` or `setCookie` utility | `next/headers` `cookies()` in Server Actions | Official Next.js API, handles `SameSite`, `httpOnly`, path — no footguns |
| Staff list display | Custom table HTML | shadcn/ui `Table` | Consistent with app design system, accessible |

**Key insight:** This phase has no novel library requirements — everything needed is already in the Phase 1 stack. The challenge is purely architectural (cookie vs. context, server vs. client attribution), not a dependency selection problem.

---

## Common Pitfalls

### Pitfall 1: Staff Attribution Lost on Page Refresh

**What goes wrong:** Active staff is stored only in React context (e.g., `useState` in a provider). When the user refreshes the page, context is reset to null. The next save operation has no `staff_id` and either throws an error or silently saves a null attribution.

**Why it happens:** "Staff switching feels like a UI convenience feature" — developers reach for React state first, don't consider persistence.

**How to avoid:** Write `active_staff_id` to a cookie via Server Action on every staff switch. Read the cookie server-side in all save operations.

**Warning signs:** Karute entries with null `staff_id`; staff switcher shows "Select Staff" after page refresh even though a staff member was previously selected.

---

### Pitfall 2: Client-Supplied `staff_id` in Save Operations

**What goes wrong:** The karute save action accepts `staff_id` as a client-supplied form field. A user could manipulate this value to attribute records to a different staff member.

**Why it happens:** "We'll validate later" — the form just passes all fields through to the action.

**How to avoid:** In every save Server Action, read `staff_id` exclusively from the cookie via `getActiveStaffId()`. Never accept it as a form parameter.

**Warning signs:** The `saveKaruteRecord` action has `staff_id` in its input type/FormData extraction.

---

### Pitfall 3: No Guard When No Staff Selected

**What goes wrong:** A user opens the app fresh (no cookie set) or after clearing cookies and tries to save a karute record. With no `active_staff_id` cookie, the save fails with a database constraint violation (if `staff_id` is `NOT NULL`) or silently saves null (if nullable).

**Why it happens:** Happy-path development; the developer always has a staff selected during testing.

**How to avoid:**
- In `getActiveStaffId()`, fall back to the first staff member in the list if no cookie is set (auto-select).
- In save actions, throw a user-visible error if `staffId` is null: "Please select a staff member before saving."
- On first app load with no cookie, the layout's active staff logic should auto-select the first staff member and set the cookie.

**Warning signs:** Error 500 on first karute save after a fresh login or cookie clear.

---

### Pitfall 4: RLS Policy Blocks Staff List Read

**What goes wrong:** RLS on the `profiles` table is written to allow users to read only their own profile row. The header switcher needs to read ALL staff rows to populate the dropdown. A too-restrictive RLS policy silently returns zero rows.

**Why it happens:** Copy-pasting a "users can read their own profile" RLS template without considering the multi-staff switcher use case.

**How to avoid:** The SELECT policy on `profiles` should allow any authenticated user to read all profiles in the same business (not just their own). Example:
```sql
create policy "Any authenticated user can read staff profiles"
on profiles for select
to authenticated
using (true); -- all staff share one auth account, so any authenticated request can read all profiles
```

Note: Because this app uses a single shared business auth account (not per-staff accounts), RLS on `profiles` for SELECT can simply be `to authenticated using (true)`. Writes (INSERT, UPDATE, DELETE) should be more restricted.

**Warning signs:** Staff switcher dropdown is empty despite staff records existing in the database.

---

### Pitfall 5: Settings Page Accessible Without Auth Check

**What goes wrong:** The Settings page is reachable without an active Supabase session — unauthenticated users can view or modify staff profiles.

**Why it happens:** The route group middleware check is present but Settings is added as a new page without verifying it falls inside the `(app)` protected route group.

**How to avoid:** Ensure `settings/page.tsx` is nested inside `app/(app)/` where the layout's middleware check (via `getClaims()`) applies. Don't create a top-level `/settings` route.

---

## Code Examples

### Staff Data Layer — `lib/staff.ts`
```typescript
// Source: Supabase JS reference + Next.js 16 cookies API
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

export async function getStaffList() {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('profiles')
    .select('id, name, display_info, created_at')
    .order('name')
  if (error) throw new Error(error.message)
  return data ?? []
}

export async function getStaffById(id: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('profiles')
    .select('id, name, display_info')
    .eq('id', id)
    .single()
  if (error) return null
  return data
}

export async function getActiveStaffId(): Promise<string | null> {
  const cookieStore = await cookies()
  return cookieStore.get('active_staff_id')?.value ?? null
}
```

### RLS Policies for `profiles` Table
```sql
-- Source: Supabase RLS docs (HIGH confidence)

-- SELECT: Any authenticated user can read all staff profiles
-- (single business auth — all staff share one login)
create policy "Authenticated users can read all profiles"
on profiles for select
to authenticated
using (true);

-- INSERT: Any authenticated user can create a staff profile
create policy "Authenticated users can insert profiles"
on profiles for insert
to authenticated
with check (true);

-- UPDATE: Any authenticated user can update any profile
-- (v1 — no per-staff permission boundaries yet; admin-only permissions are v2)
create policy "Authenticated users can update profiles"
on profiles for update
to authenticated
using (true)
with check (true);

-- DELETE: Any authenticated user can delete a profile
create policy "Authenticated users can delete profiles"
on profiles for delete
to authenticated
using (true);
```

Note: v1 uses a single shared business auth account, so "any authenticated user" = the one business account. Per-staff permissions (MOD-01) are a v2 requirement.

### Zod Schema for Staff Profile Form
```typescript
// Source: Zod v4 docs + react-hook-form docs
import { z } from 'zod'

export const staffProfileSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name is too long'),
  display_info: z.string().max(500, 'Display info is too long').optional(),
})

export type StaffProfileInput = z.infer<typeof staffProfileSchema>
```

### Settings Page — Staff List (Server Component)
```typescript
// app/(app)/settings/page.tsx
import { getStaffList } from '@/lib/staff'
import StaffList from '@/components/staff/StaffList'

export default async function SettingsPage() {
  const staffList = await getStaffList()
  return (
    <div>
      <h1>Settings</h1>
      <section>
        <h2>Staff</h2>
        <StaffList staffList={staffList} />
      </section>
    </div>
  )
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `@supabase/auth-helpers-nextjs` | `@supabase/ssr` with `createBrowserClient` / `createServerClient` | January 2026 (deprecated) | All cookie handling now via `@supabase/ssr` — no migration needed for this phase (Phase 1 uses `@supabase/ssr`) |
| `revalidatePath` for all cache busting | `revalidatePath` still standard; `refresh()` from `next/cache` also available | Next.js 16 | Both work; `revalidatePath('/settings')` is the right call after staff mutations |
| `getSession()` for server auth checks | `getClaims()` | Current Next.js + Supabase guidance | `getClaims()` validates the JWT; `getSession()` does not — middleware must use `getClaims()` |

**Deprecated/outdated:**
- `useRouter().refresh()` for cache revalidation after mutations: still works but `revalidatePath` in Server Actions is the idiomatic App Router approach.

---

## Open Questions

1. **`profiles` table exact schema from Phase 1**
   - What we know: FOUND-02 in Phase 1 creates `profiles` table; the architecture research mentions `profiles` as storing staff data
   - What's unclear: The exact columns (is it `name`, `display_name`, `avatar_url`? Is there a `business_id`? Is `id` a UUID matching `auth.uid()` or an independent UUID?)
   - Recommendation: The Phase 1 DB plan (01-02) will define this. The staff data layer task (05-01) must confirm the actual schema before writing TypeScript types. The task description should include: "Read the Phase 1 migration file to confirm `profiles` table columns before writing types."

2. **Should deleting a staff member be allowed when they have attributed karute records?**
   - What we know: STAFF-03 requires every karute record to show the staff name. If the staff row is deleted, the foreign key `staff_id` in `karute_records` would either cascade-delete records or become a dangling reference.
   - What's unclear: Whether Phase 1 schema uses `ON DELETE SET NULL` or `ON DELETE RESTRICT` on the `staff_id` foreign key
   - Recommendation: Use `ON DELETE SET NULL` for the FK in Phase 1 schema (or verify it's set this way). In the Settings UI, warn the user before deleting a staff member who has attributed records. Display "This staff member has X karute records. Deleting them will remove attribution." Don't cascade-delete records.

3. **Auto-select on first load — which staff to default to?**
   - What we know: The app must handle the case where no `active_staff_id` cookie exists (first login, cleared cookies)
   - What's unclear: Should it auto-select the first staff alphabetically, prompt the user to select, or block saving until selection is made?
   - Recommendation: Auto-select the first alphabetical staff member and set the cookie silently. The switcher is visible in the header so the user can change it. This is the least friction path for a single-staff shop (most likely v1 user).

---

## Sources

### Primary (HIGH confidence)
- Next.js 16 official docs — Server Components, Client Components, context providers: https://nextjs.org/docs/app/building-your-application/rendering/composition-patterns — verified 2026-03-13
- Next.js 16 official docs — Server Actions and mutations, cookies in Server Actions: https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations — verified 2026-03-13
- Supabase official docs — Next.js App Router auth with `@supabase/ssr`: https://supabase.com/docs/guides/auth/server-side/nextjs — verified 2026-03-13
- Supabase JS reference — insert, update, delete operations: https://supabase.com/docs/reference/javascript/insert — verified 2026-03-13
- Supabase official docs — Row Level Security policies and `auth.uid()` caching: https://supabase.com/docs/guides/database/postgres/row-level-security — verified 2026-03-13
- shadcn/ui official docs — DropdownMenu component: https://ui.shadcn.com/docs/components/dropdown-menu — verified 2026-03-13
- shadcn/ui official docs — Select component: https://ui.shadcn.com/docs/components/select — verified 2026-03-13

### Secondary (MEDIUM confidence)
- Existing project research: `.planning/research/ARCHITECTURE.md` — Pattern 4 "Staff Profile Switching Without Re-Auth" — documents the single-auth + profiles-as-rows model

### Tertiary (LOW confidence)
- None

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries verified against official docs; no new dependencies required
- Architecture (cookie-backed active staff): HIGH — Next.js 16 cookies API verified in official docs; pattern is standard for session-scoped state in App Router
- CRUD patterns: HIGH — Supabase JS reference confirmed insert/update/delete syntax
- RLS policies: HIGH — verified against Supabase RLS docs; the `(select auth.uid())` caching pattern confirmed
- Pitfalls: HIGH — staff attribution pitfall documented in existing project pitfall research (Pitfall 8); others derived from official docs behavior

**Research date:** 2026-03-13
**Valid until:** 2026-04-13 (stable patterns; shadcn component API may have minor changes — re-verify if >30 days)
