---
phase: 01-foundation-recording
plan: "03"
subsystem: auth
tags: [supabase, auth, login, signup, protected-routes, middleware]

# Dependency graph
requires:
  - phase: 01-01
    provides: Next.js 16 scaffold, app directory structure
  - phase: 01-02
    provides: Supabase client/server helpers (createClient), profiles table, RLS
  - phase: 01-04
    provides: proxy.ts with getClaims() + i18n middleware composition, locale routing

provides:
  - Login page at /[locale]/login with email/password form and inline error display
  - Signup page at /[locale]/signup with email/password/confirm form and inline error
  - Auth guard in (app)/layout.tsx — unauthenticated requests redirect to /[locale]/login
  - middleware.ts wired to proxy() — activates getClaims() token refresh on every request
  - LoginForm and SignupForm client components using Supabase browser client

affects:
  - All phases — every route under [locale]/(app)/ is now protected by auth guard
  - Phase 8 (integration testing) — auth flow is a key test scenario

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Auth guard pattern: (app)/layout.tsx calls getUser() server-side, redirects to /[locale]/login on failure
    - Inline error pattern: useState for error string, displayed below form without page reload
    - Middleware wiring: middleware.ts re-exports proxy() so getClaims() runs on every request

key-files:
  created:
    - src/components/login-form.tsx
    - src/components/signup-form.tsx
    - src/app/[locale]/login/page.tsx
    - src/app/[locale]/signup/page.tsx
  modified:
    - src/app/[locale]/(app)/layout.tsx
    - src/middleware.ts

key-decisions:
  - "(app)/layout.tsx auth guard uses getUser() not getClaims() — server-side check is authoritative; getClaims() in middleware handles token refresh"
  - "middleware.ts re-exports proxy() via named export — activates both i18n routing and Supabase token refresh that were deferred in 01-04"
  - "Login/signup use href links (not next-intl Link) — public pages outside the (app) group don't need locale-aware navigation helpers"

patterns-established:
  - "Auth guard: (app)/layout.tsx reads params.locale, calls getUser(), redirects to /[locale]/login on failure"
  - "Client auth forms: useState for error/loading, createClient() browser client, router.push + router.refresh() on success"

# Metrics
duration: 4min
completed: 2026-03-14
---

# Phase 1 Plan 03: Auth Summary

**Supabase email/password login and signup with inline error display, server-side auth guard on (app) route group, and proxy.ts wired to middleware.ts activating getClaims() token refresh on every request**

## Performance

- **Duration:** ~4 min
- **Started:** 2026-03-14T18:06:06Z
- **Completed:** 2026-03-14T18:10:10Z
- **Tasks:** 1
- **Files modified:** 6

## Accomplishments

- Created `src/components/login-form.tsx` — client component using `signInWithPassword`, shows inline error, redirects to /[locale]/sessions on success
- Created `src/components/signup-form.tsx` — client component using `signUp`, client-side password confirmation check, inline error display
- Created login and signup page routes under `[locale]/login` and `[locale]/signup`
- Updated `(app)/layout.tsx` with `getUser()` auth guard — unauthenticated access to any app route redirects to `/[locale]/login`
- Wired `middleware.ts` to re-export `proxy()` — activates the getClaims() token refresh and i18n middleware composition that was deferred in 01-04

## Task Commits

Each task was committed atomically:

1. **Task 1: Login form, signup form, auth guard, and middleware wiring** - `40655ce` (feat)

**Plan metadata:** (docs commit follows)

## Files Created/Modified

- `src/components/login-form.tsx` - Client Component: signInWithPassword, inline error, redirect on success
- `src/components/signup-form.tsx` - Client Component: signUp, password confirmation, inline error
- `src/app/[locale]/login/page.tsx` - Public login page rendering LoginForm with locale prop
- `src/app/[locale]/signup/page.tsx` - Public signup page rendering SignupForm with locale prop
- `src/app/[locale]/(app)/layout.tsx` - Added getUser() auth guard with redirect; preserved dashboard shell (Sidebar, TopBar, StaffSwitcher)
- `src/middleware.ts` - Rewired to re-export proxy() from ./proxy — activates getClaims() + i18n on every request

## Decisions Made

- `(app)/layout.tsx` already had a full dashboard shell (Sidebar, TopBar, StaffSwitcher from Phase 5/6 evolution) — auth guard was added at the top of the function body without disturbing the existing shell rendering
- `middleware.ts` was previously a standalone intl-only middleware; replaced with a re-export of `proxy()` which subsumes the intl middleware (proxy.ts already calls `createMiddleware(routing)` internally)
- Login and signup links use plain `<a href>` not next-intl `Link` — these are public pages outside the auth-protected group and don't need locale stacking protection

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Wired middleware.ts to call proxy()**
- **Found during:** Task 1 (verifying plan artifacts)
- **Issue:** `middleware.ts` was a standalone next-intl middleware that did NOT call `proxy()`. The 01-04 SUMMARY documented this as explicitly deferred. Without this wiring, `getClaims()` token refresh never runs, meaning auth tokens can expire mid-session without refresh.
- **Fix:** Replaced `middleware.ts` content with `export { proxy as default, config } from './proxy'` — proxy.ts already composes intl middleware + getClaims(), so this single line activates both
- **Files modified:** `src/middleware.ts`
- **Verification:** `grep "getClaims" src/proxy.ts` and `grep "createMiddleware" src/proxy.ts` both found; middleware.ts re-exports proxy
- **Committed in:** `40655ce` (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (missing critical — middleware wiring required for auth token refresh)
**Impact on plan:** Auto-fix was essential for Supabase session persistence. proxy.ts was already complete from 01-04; only the entry point wiring was missing. No scope creep.

## Issues Encountered

- `src/app/[locale]/(app)/layout.tsx` had no `params` prop and no auth guard — the Phase 5/6 dashboard shell was added but auth guard was never applied. Added `params: Promise<{ locale: string }>` to the function signature and auth check at the top of the body.
- `src/app/[locale]/login/` and `src/app/[locale]/signup/` directories did not exist despite the app being functionally operational in later phases — created as specified.
- `src/components/login-form.tsx` and `src/components/signup-form.tsx` did not exist — created as specified.

## User Setup Required

None - Supabase configuration established in Phase 01-02.

## Next Phase Readiness

- Auth flow complete: login, signup, protected routes, and token refresh all active
- Unauthenticated users are redirected to /[locale]/login by the (app) layout guard
- Session persistence via getClaims() in proxy.ts active on every request
- All app routes under [locale]/(app)/ are protected

---
*Phase: 01-foundation-recording*
*Completed: 2026-03-14*
