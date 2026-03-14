---
phase: 03-customer-management
verified: 2026-03-14T18:15:00Z
status: passed
score: 8/8 must-haves verified
re_verification:
  previous_status: gaps_found
  previous_score: 7/8
  gaps_closed:
    - "User can click a table row to navigate to that customer's profile page — CustomerTable, KaruteHistoryList, and customers/[id]/page.tsx now import from @/i18n/navigation"
  gaps_remaining: []
  regressions: []
---

# Phase 03: Customer Management Verification Report

**Phase Goal:** Staff can create customers, find existing customers, and view a customer's complete session history at a glance.
**Verified:** 2026-03-14T18:15:00Z
**Status:** passed
**Re-verification:** Yes — after gap closure (plan 03-04 fixed locale-aware navigation imports)

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | User can create a new customer with name and optional contact info, and the record persists in Supabase | ✓ VERIFIED | `createCustomer` Server Action in `src/actions/customers.ts`: Zod validation, duplicate-warn-but-allow, `.insert().select().single()`, `revalidatePath('/customers')`. CustomerForm wired to action via direct call on submit. |
| 2 | User can edit an existing customer's name and contact info | ✓ VERIFIED | `updateCustomer` Server Action validated and wired. `CustomerInlineEdit.tsx` uses `useForm` + `zodResolver`, calls `updateCustomer(customer.id, values)`, shows sonner toast on success, calls `onSave()` to exit edit mode. |
| 3 | User can view a paginated/searchable customer list and find a customer by name | ✓ VERIFIED | `listCustomers` in `src/lib/customers/queries.ts` uses `.or('name.ilike.%q%,furigana.ilike.%q%,phone.ilike.%q%,email.ilike.%q%')` + `.range()` + exact count. Page calls `listCustomers` with searchParams. `CustomerSearch` debounces at 300ms via `useDebouncedCallback`. Pagination component hides at 1 page. |
| 4 | User can open a customer profile and see all past karute sessions in reverse-chronological order | ✓ VERIFIED | Profile page `Promise.all` parallel fetch: karute_records ordered by `session_date` descending, `client_id` FK used. `KaruteHistoryList` renders session rows with date/staff name/summary snippet and empty state. Pagination via `?historyPage=` param. |
| 5 | User can click a table row to navigate to that customer's profile page | ✓ VERIFIED | `CustomerTable` line 3: `useRouter` now imported from `@/i18n/navigation`. `router.push('/customers/${customerId}')` — the locale-aware router from `createNavigation(routing)` automatically injects the active locale prefix at runtime, resolving to `/en/customers/id` or `/ja/customers/id`. |
| 6 | Customer record creation persists with correct schema fields | ✓ VERIFIED | Migration `002_customer_fields.sql` adds furigana, phone, email columns. `src/types/database.ts` Customer interface includes all three as `string \| null`. TypeScript passes clean (tsc --noEmit exit 0). |
| 7 | Duplicate name detection warns but does not block creation | ✓ VERIFIED | `checkDuplicateName` called before insert in `createCustomer`. On match, `duplicateWarning` string is set on the success result. `CustomerForm` shows `toast.warning(result.duplicateWarning)` but still calls `onSuccess?.()`. |
| 8 | All customer UI uses i18n translations in EN and JP | ✓ VERIFIED | `messages/en.json` and `messages/ja.json` both contain `customers` key with form, table, profile, toast, empty state strings. Components use `useTranslations('customers')` throughout. |

**Score:** 8/8 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `supabase/migrations/002_customer_fields.sql` | ALTER TABLE adding furigana, phone, email | ✓ VERIFIED | Unchanged from initial verification. |
| `src/actions/customers.ts` | createCustomer + updateCustomer Server Actions | ✓ VERIFIED | Unchanged from initial verification. |
| `src/lib/customers/queries.ts` | listCustomers, getCustomer, checkDuplicateName | ✓ VERIFIED | Unchanged from initial verification. |
| `src/lib/customers/utils.ts` | getAvatarColor + getInitials | ✓ VERIFIED | Unchanged from initial verification. |
| `src/types/database.ts` | Customer type with furigana, phone, email | ✓ VERIFIED | Unchanged from initial verification. |
| `src/app/[locale]/(app)/customers/page.tsx` | Server Component reading searchParams | ✓ VERIFIED | Unchanged from initial verification. |
| `src/components/customers/CustomerSearch.tsx` | Debounced search with useDebouncedCallback | ✓ VERIFIED | Unchanged from initial verification. |
| `src/components/customers/CustomerTable.tsx` | Sortable table with avatars, row click navigation | ✓ VERIFIED | Line 3: `useRouter, usePathname` now from `@/i18n/navigation`. `router.push('/customers/${customerId}')` resolves with locale prefix via next-intl's `createNavigation`. |
| `src/components/customers/CustomerSheet.tsx` | Right-side Sheet with CustomerForm | ✓ VERIFIED | Unchanged from initial verification. |
| `src/components/customers/CustomerForm.tsx` | react-hook-form + zod dual-mode form | ✓ VERIFIED | Unchanged from initial verification. |
| `src/components/customers/Pagination.tsx` | URL-param page navigation | ✓ VERIFIED | Unchanged from initial verification. |
| `src/app/[locale]/(app)/customers/[id]/page.tsx` | Profile Server Component with parallel fetch | ✓ VERIFIED | Line 2: `Link` now from `@/i18n/navigation`. `href="/customers"` on Back link resolves with locale prefix. `notFound` correctly stays in `next/navigation`. |
| `src/components/customers/CustomerProfileHeader.tsx` | Header with avatar, visit stats, Edit button | ✓ VERIFIED | Unchanged from initial verification. |
| `src/components/customers/CustomerInlineEdit.tsx` | Inline edit form with updateCustomer | ✓ VERIFIED | Unchanged from initial verification. |
| `src/components/customers/KaruteHistoryList.tsx` | Karute history with empty state + pagination | ✓ VERIFIED | Line 3: `useRouter, usePathname` now from `@/i18n/navigation`. `router.push('/karute/${record.id}')` resolves with locale prefix. `useSearchParams` correctly stays in `next/navigation`. |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `src/app/[locale]/(app)/customers/page.tsx` | `src/lib/customers/queries.ts` | `listCustomers()` call | ✓ WIRED | Unchanged — `listCustomers(...)` called at line 48. |
| `src/components/customers/CustomerSearch.tsx` | URL search params | debounced `router.replace()` | ✓ WIRED | Unchanged. |
| `src/components/customers/CustomerForm.tsx` | `src/actions/customers.ts` | `createCustomer` on submit | ✓ WIRED | Unchanged. |
| `src/components/customers/CustomerTable.tsx` | `/customers/[id]` | `router.push` on row click | ✓ WIRED | Fixed. `useRouter` from `@/i18n/navigation` injects locale. Navigates to `/[locale]/customers/[id]`. |
| `src/app/[locale]/(app)/customers/[id]/page.tsx` | karute_records | `Promise.all` parallel fetch | ✓ WIRED | Unchanged. |
| `src/components/customers/CustomerInlineEdit.tsx` | `src/actions/customers.ts` | `updateCustomer` on save | ✓ WIRED | Unchanged. |
| `src/components/customers/KaruteHistoryList.tsx` | `/karute/[id]` | row click navigation | ✓ WIRED | Fixed. `useRouter` from `@/i18n/navigation` injects locale. Navigates to `/[locale]/karute/[id]`. |
| `src/app/[locale]/(app)/customers/[id]/page.tsx` | `/customers` back link | `Link` from `@/i18n/navigation` | ✓ WIRED | Fixed. `Link` from `createNavigation(routing)` injects locale. `href="/customers"` → `/[locale]/customers`. |

### Requirements Coverage

| Requirement | Status | Notes |
|-------------|--------|-------|
| CUST-01: Create customer with name + contact info | ✓ SATISFIED | createCustomer action + CustomerForm + CustomerSheet all wired end-to-end. |
| CUST-02: Edit existing customer name + contact info | ✓ SATISFIED | updateCustomer action + CustomerInlineEdit in profile page. |
| CUST-03: View paginated/searchable customer list | ✓ SATISFIED | listCustomers with ilike multi-column search + Pagination + CustomerSearch. |
| CUST-04: View customer's complete session history | ✓ SATISFIED | karute_records fetched in parallel on profile page, displayed in reverse-chron. Navigation to/from profile page now locale-correct. |

### Anti-Patterns Found

| File | Pattern | Severity | Impact |
|------|---------|----------|--------|
| `src/components/customers/CustomerTable.tsx` line 197 | Hardcoded `0` for Visits count | Info | Known deferral to Phase 4 — documented in code comment. |
| `src/components/customers/KaruteHistoryList.tsx` line 83 | `t('profile.staff')` placeholder for staff name | Info | Known deferral to Phase 5 — documented in code comment. |

All blocker anti-patterns from the initial verification have been resolved.

### Human Verification Required

### 1. Sheet opens from right and closes after create

**Test:** Click "+ New Customer", fill in name, click Save.
**Expected:** Sheet slides in from right, after save it closes, success toast appears, list refreshes with new customer.
**Why human:** Sonner toast appearance and sheet animation cannot be verified by static analysis.

### 2. Duplicate name warning toast

**Test:** Create a customer named "Test Customer". Create another with same name.
**Expected:** Second creation succeeds AND shows a yellow/warning toast with the duplicate message.
**Why human:** Toast variant (warning vs error) requires runtime verification.

### 3. Debounced search filtering

**Test:** Type "田中" in the search input, wait 300ms.
**Expected:** Customer list filters to show only matching customers without page reload.
**Why human:** Debounce timing and URL param update require browser interaction.

### 4. Inline edit save flow

**Test:** Navigate to a customer profile, click Edit, change name, click Save.
**Expected:** Fields swap to inputs, save updates the header in-place, toast "Customer updated" appears.
**Why human:** The inline edit toggle (display to form) and revalidation-triggered re-render require browser observation.

### 5. Row click locale navigation

**Test:** With locale set to `ja`, click a customer row.
**Expected:** Browser navigates to `/ja/customers/[id]`, not `/customers/[id]`.
**Why human:** next-intl locale injection only happens at runtime; static analysis can confirm the import is correct but not the actual URL produced.

## Gap Closure Summary

The single gap from initial verification is closed. All three affected files now import router/link from `@/i18n/navigation`:

- `src/components/customers/CustomerTable.tsx` — `useRouter, usePathname` from `@/i18n/navigation` (line 3)
- `src/components/customers/KaruteHistoryList.tsx` — `useRouter, usePathname` from `@/i18n/navigation` (line 3)
- `src/app/[locale]/(app)/customers/[id]/page.tsx` — `Link` from `@/i18n/navigation` (line 2)

Remaining `next/navigation` imports in these files (`useSearchParams`, `notFound`) are correct — those APIs are not provided by `@/i18n/navigation` and must remain in `next/navigation`.

TypeScript type check passes clean with no errors after the changes.

No regressions detected in previously passing artifacts.

---
_Verified: 2026-03-14T18:15:00Z_
_Verifier: Claude (gsd-verifier)_
