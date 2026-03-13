# Phase 1: Foundation + Recording — Research

**Researched:** 2026-03-13
**Domain:** Next.js 16 App Router, Supabase SSR Auth, Tailwind v4, shadcn, next-intl v4, MediaRecorder API, GitHub Actions CI
**Confidence:** HIGH (all critical claims verified against official docs or Context7-equivalent sources)

---

## Summary

Phase 1 establishes the entire project scaffold in one shot: Next.js 16 App Router with TypeScript, Tailwind v4 (CSS-first config), shadcn components including the Sidebar primitive, Supabase SSR auth (email/password), i18n with next-intl v4, GitHub Actions CI, and browser-based audio recording with waveform visualization. Several API surfaces have changed significantly since 2024 and require specific attention.

The most critical breaking changes to be aware of: (1) Next.js 16 renamed `middleware.ts` to `proxy.ts` — this affects both the auth token refresh pattern and next-intl routing; (2) `@supabase/auth-helpers-nextjs` is fully deprecated — use `@supabase/ssr` with `createBrowserClient`/`createServerClient` exclusively; (3) Tailwind v4 has no `tailwind.config.js` — configuration lives in CSS via `@theme` and `@custom-variant`; (4) next-intl v4 is ESM-only and requires `locale` returned from `getRequestConfig`.

The audio recording feature has one non-obvious constraint: iOS Safari may support `audio/webm;codecs=opus` in newer versions (Safari 18.4+), but you must still use `MediaRecorder.isTypeSupported()` to negotiate the format at runtime. Audio must never pass through a Server Action (1MB limit) — use a Route Handler (`app/api/transcribe/route.ts`) receiving a `FormData` multipart POST instead.

**Primary recommendation:** Scaffold with `create-next-app@latest` (Next.js 16.1.6, includes Turbopack and App Router defaults), then layer in Supabase SSR, shadcn, next-intl v4, and the MediaRecorder module in order, validating each layer works before adding the next.

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| next | 16.1.6 | Framework, App Router, Route Handlers | Current stable LTS; Turbopack default |
| react / react-dom | 19.x (bundled) | UI runtime | Required by Next.js 16 |
| typescript | 5.1+ | Type safety | Required by Next.js 16 |
| @supabase/supabase-js | latest | Supabase client | Required peer of @supabase/ssr |
| @supabase/ssr | latest | SSR-safe Supabase clients | Official replacement for deprecated auth-helpers |
| tailwindcss | 4.x | Styling | CSS-first, no config file needed |
| @tailwindcss/postcss | 4.x | PostCSS integration for Tailwind v4 | Required for build pipeline |
| tw-animate-css | latest | CSS animations | Official replacement for tailwindcss-animate in v4 |
| next-intl | 4.x | i18n (EN/JP) | First-class App Router support, ESM-only in v4 |
| next-themes | latest | Dark mode toggle | Standard for class-based dark mode with Next.js |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| shadcn/ui (CLI) | latest (v4 CLI) | Component library scaffold | Run `npx shadcn@latest init` — not installed as npm package |
| zod | 3.x | Form/API validation | Validate auth form inputs, API route bodies |
| sonner | latest | Toast notifications | shadcn v4 deprecated the old Toast in favor of sonner |

### shadcn Components Needed for Phase 1
- `sidebar` — collapsible sidebar navigation (install via CLI)
- `button` — UI primitive
- `dialog` / `sheet` — recording modal
- `avatar` — staff profile selector

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| @supabase/ssr | @supabase/auth-helpers-nextjs | DEPRECATED — do not use |
| tw-animate-css | tailwindcss-animate | tailwindcss-animate does not support Tailwind v4 |
| next-intl v4 | next-intl v3 | v3 lacks type-safe locales; v4 is current |
| next-themes | Manual dark mode | next-themes handles SSR hydration correctly |
| sonner | shadcn Toast | shadcn Toast is deprecated in v4 |

### Installation
```bash
# Start from create-next-app scaffold (includes Next.js 16, TypeScript, Tailwind v4, ESLint, App Router)
npx create-next-app@latest karute --typescript --tailwind --eslint --app --src-dir

# Supabase
npm install @supabase/supabase-js @supabase/ssr

# i18n
npm install next-intl

# Dark mode
npm install next-themes

# Animation (replace tailwindcss-animate)
npm install tw-animate-css

# Validation
npm install zod

# Notifications (shadcn v4 standard)
npm install sonner

# shadcn CLI (run init, then add components)
npx shadcn@latest init -t next
npx shadcn@latest add sidebar button dialog sheet avatar
```

---

## Architecture Patterns

### Recommended Project Structure
```
src/
├── app/
│   ├── [locale]/            # next-intl locale segment
│   │   ├── layout.tsx       # NextIntlClientProvider, SidebarProvider
│   │   ├── page.tsx         # Dashboard root
│   │   ├── login/
│   │   │   └── page.tsx     # Auth page (public)
│   │   └── (app)/           # Protected route group
│   │       ├── layout.tsx   # Auth guard — redirect if no session
│   │       └── sessions/
│   │           └── page.tsx
│   ├── api/
│   │   └── transcribe/
│   │       └── route.ts     # Audio upload Route Handler (NOT Server Action)
│   └── globals.css          # Tailwind v4 @import, @theme, @custom-variant dark
├── components/
│   ├── ui/                  # shadcn output (auto-generated by CLI)
│   ├── app-sidebar.tsx      # Business sidebar using shadcn Sidebar primitive
│   ├── recording-modal.tsx  # MediaRecorder state machine UI
│   └── waveform.tsx         # Canvas-based waveform visualization
├── i18n/
│   ├── routing.ts           # defineRouting({ locales: ['en', 'ja'], defaultLocale: 'en' })
│   ├── navigation.ts        # createNavigation(routing) — typed Link/useRouter
│   └── request.ts           # getRequestConfig — returns { locale, messages }
├── lib/
│   └── supabase/
│       ├── client.ts        # createBrowserClient (Client Components)
│       └── server.ts        # createServerClient with cookie handling (Server Components)
├── messages/
│   ├── en.json              # English translations
│   └── ja.json              # Japanese translations
└── proxy.ts                 # next-intl middleware (Next.js 16: proxy.ts, NOT middleware.ts)
```

### Pattern 1: Supabase SSR Client Setup

**What:** Two separate client creation functions — browser client for Client Components, server client for Server Components/Route Handlers. Both use `@supabase/ssr`.

**Critical:** The server client requires a cookie adapter. Cookies are async in Next.js 16.

```typescript
// src/lib/supabase/client.ts
// Source: https://supabase.com/docs/guides/auth/server-side/nextjs
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  )
}
```

```typescript
// src/lib/supabase/server.ts
// Source: https://supabase.com/docs/guides/auth/server-side/nextjs
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // setAll called from Server Component — ignore, Proxy handles refresh
          }
        },
      },
    }
  )
}
```

### Pattern 2: Auth Token Refresh Proxy (proxy.ts)

**What:** The auth token refresh MUST happen in `proxy.ts` (Next.js 16 name for `middleware.ts`). Use `getClaims()` not `getSession()`.

**Critical:** File MUST be named `proxy.ts` in Next.js 16. `middleware.ts` is deprecated.

```typescript
// src/proxy.ts
// Source: https://supabase.com/docs/guides/auth/server-side/nextjs
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import createIntlMiddleware from 'next-intl/middleware'
import { routing } from './i18n/routing'

const intlMiddleware = createIntlMiddleware(routing)

export async function proxy(request: NextRequest) {
  // Handle i18n routing first
  const intlResponse = intlMiddleware(request)

  let response = intlResponse ?? NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refreshes token — use getClaims() not getSession()
  await supabase.auth.getClaims()

  return response
}

export const config = {
  matcher: '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)',
}
```

### Pattern 3: next-intl v4 Setup

**What:** Route group under `[locale]`, translations in `messages/`, config in `i18n/`.

**Critical for v4:**
- Must return `locale` from `getRequestConfig`
- `NextIntlClientProvider` is now required (not optional) for any client component using `useTranslations`
- File is `proxy.ts` not `middleware.ts` in Next.js 16
- Module is ESM-only — no CommonJS imports

```typescript
// src/i18n/routing.ts
// Source: https://next-intl.dev/docs/routing/setup
import { defineRouting } from 'next-intl/routing'

export const routing = defineRouting({
  locales: ['en', 'ja'],
  defaultLocale: 'en'
})
```

```typescript
// src/i18n/request.ts
import { getRequestConfig } from 'next-intl/server'
import { hasLocale } from 'next-intl'
import { routing } from './routing'

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale
  const locale = hasLocale(routing.locales, requested)
    ? requested
    : routing.defaultLocale

  return {
    locale,  // v4 REQUIRED — was optional in v3
    messages: (await import(`../../messages/${locale}.json`)).default
  }
})
```

```typescript
// src/app/[locale]/layout.tsx
import { NextIntlClientProvider, hasLocale } from 'next-intl'
import { getMessages } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { routing } from '@/i18n/routing'
import { SidebarProvider } from '@/components/ui/sidebar'

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  if (!hasLocale(routing.locales, locale)) notFound()
  const messages = await getMessages()

  return (
    <html lang={locale} className="dark">
      <body>
        <NextIntlClientProvider messages={messages}>
          <SidebarProvider>
            {children}
          </SidebarProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
```

### Pattern 4: Tailwind v4 Dark Mode

**What:** CSS-first config. No `tailwind.config.js`. Dark mode via `@custom-variant`.

```css
/* src/app/globals.css */
/* Source: https://tailwindcss.com/docs/dark-mode */
@import "tailwindcss";
@import "tw-animate-css";

@custom-variant dark (&:where(.dark, .dark *));

/* shadcn CSS variables */
:root {
  --background: hsl(0 0% 100%);
  --foreground: hsl(0 0% 3.9%);
  /* ...other tokens */
}

.dark {
  --background: hsl(224 71% 4%);
  --foreground: hsl(213 31% 91%);
  /* ...other tokens */
}

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
}
```

### Pattern 5: MediaRecorder with Format Negotiation

**What:** Browser audio recording with cross-browser format detection. iOS Safari behavior varies by version.

**Critical:** Always negotiate format via `isTypeSupported()` — never hardcode `audio/webm`. Safari 18.4+ supports `audio/webm;codecs=opus` but older versions do not. The returned MIME type must be passed with the blob to the Route Handler so it can set the correct `Content-Type` for the downstream AI API.

```typescript
// src/components/recording-modal.tsx (simplified logic)
// Source: https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder/isTypeSupported_static

function getSupportedMimeType(): string {
  const formats = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/mp4',
    'audio/ogg;codecs=opus',
    'audio/wav',
  ]
  return formats.find(f => MediaRecorder.isTypeSupported(f)) ?? ''
}

// In component:
const mimeType = getSupportedMimeType()
const mediaRecorder = new MediaRecorder(stream,
  mimeType ? { mimeType } : undefined
)
```

### Pattern 6: Audio Upload via Route Handler

**What:** Client sends audio blob as `FormData` to a Route Handler — NOT a Server Action (1MB limit would reject audio files).

```typescript
// Client-side upload
async function uploadAudio(blob: Blob, mimeType: string) {
  const formData = new FormData()
  formData.append('audio', blob, 'recording')
  formData.append('mimeType', mimeType)

  const res = await fetch('/api/transcribe', {
    method: 'POST',
    body: formData,  // Browser sets Content-Type: multipart/form-data automatically
  })
  return res.json()
}
```

```typescript
// src/app/api/transcribe/route.ts
// Source: https://nextjs.org/docs/app/api-reference/file-conventions/route (v16.1.6)
export async function POST(request: Request) {
  const formData = await request.formData()
  const audio = formData.get('audio') as File
  const mimeType = formData.get('mimeType') as string

  // Validate auth before processing
  // Forward to Whisper API or store transcript

  return Response.json({ transcript: '...' })
}
```

### Pattern 7: Waveform Visualization

**What:** Live waveform using Web Audio API `AnalyserNode` connected to microphone stream, drawn via Canvas with `requestAnimationFrame`.

```typescript
// Source: https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Visualizations_with_Web_Audio_API
function useWaveform(stream: MediaStream | null) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animFrameRef = useRef<number>()

  useEffect(() => {
    if (!stream || !canvasRef.current) return

    const audioCtx = new AudioContext()
    const analyser = audioCtx.createAnalyser()
    analyser.fftSize = 2048
    analyser.smoothingTimeConstant = 0.8

    const source = audioCtx.createMediaStreamSource(stream)
    source.connect(analyser)

    const dataArray = new Uint8Array(analyser.frequencyBinCount)
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')!

    function draw() {
      animFrameRef.current = requestAnimationFrame(draw)
      analyser.getByteTimeDomainData(dataArray)
      // Draw waveform on canvas...
    }
    draw()

    return () => {
      cancelAnimationFrame(animFrameRef.current!)
      audioCtx.close()
    }
  }, [stream])

  return canvasRef
}
```

### Pattern 8: Supabase Schema with RLS

**What:** All tables get RLS enabled from creation. Multi-tenancy via `customer_id` foreign key. Profiles auto-created via trigger.

```sql
-- Source: https://supabase.com/docs/guides/database/postgres/row-level-security

-- Profiles: one per auth user
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  customer_id uuid references customers(id) not null,
  full_name text,
  role text default 'staff'
);
alter table profiles enable row level security;

create policy "Users can view profiles in same customer"
  on profiles for select to authenticated
  using (
    customer_id = (select customer_id from profiles where id = (select auth.uid()))
  );

-- karute_records: scoped to customer
alter table karute_records enable row level security;

create policy "Authenticated users access own customer records"
  on karute_records for all to authenticated
  using (
    customer_id = (select customer_id from profiles where id = (select auth.uid()))
  )
  with check (
    customer_id = (select customer_id from profiles where id = (select auth.uid()))
  );
```

**Key RLS note:** Wrap `auth.uid()` in a subquery `(select auth.uid())` — Postgres caches it per statement rather than re-executing per row, which is a significant performance improvement documented in Supabase official docs.

### Pattern 9: Supabase Sidebar with shadcn

```typescript
// src/components/app-sidebar.tsx
// Source: https://ui.shadcn.com/docs/components/radix/sidebar
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarHeader,
  SidebarFooter, SidebarTrigger
} from '@/components/ui/sidebar'

export function AppSidebar() {
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>{/* Logo / app name */}</SidebarHeader>
      <SidebarContent>
        <SidebarGroup>{/* Nav items */}</SidebarGroup>
      </SidebarContent>
      <SidebarFooter>{/* User profile / logout */}</SidebarFooter>
    </Sidebar>
  )
}
```

### Anti-Patterns to Avoid
- **Using `middleware.ts` in Next.js 16:** Rename to `proxy.ts`, export `proxy` function. `middleware.ts` is deprecated and will break next-intl routing.
- **Using `@supabase/auth-helpers-nextjs`:** Fully deprecated. Import from `@supabase/ssr` only.
- **Using `getSession()` server-side:** Use `getClaims()` for token refresh in proxy, `getUser()` for page protection (makes network call, guaranteed fresh).
- **Uploading audio via Server Action:** 1MB request body limit will reject audio blobs. Use `app/api/transcribe/route.ts` instead.
- **Hardcoding `audio/webm` in MediaRecorder:** iOS Safari may not support it. Always use `isTypeSupported()` negotiation first.
- **Using `tailwindcss-animate`:** Does not work with Tailwind v4. Use `tw-animate-css` imported in CSS.
- **CommonJS imports from next-intl v4:** next-intl v4 is ESM-only. Ensure `tsconfig.json` targets ESM-compatible module resolution.
- **Not returning `locale` from `getRequestConfig` in next-intl v4:** Required in v4, was optional in v3. Will throw "Unable to find next-intl locale" at runtime.
- **Skipping RLS on any table in a public schema:** Supabase docs state RLS MUST be enabled on all tables in exposed schemas.
- **Setting cookies in Server Components:** The `setAll` in the server client must have a try/catch — Next.js throws if cookies are set from a Server Component (only Proxy can set cookies).

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Auth token refresh on every request | Custom cookie/JWT validation | `@supabase/ssr` + proxy pattern | Token rotation, refresh logic, and secure cookie handling have many edge cases |
| i18n routing and locale detection | Custom URL parsing middleware | `next-intl` createMiddleware | Accept-Language negotiation, cookie persistence, locale prefix handling are all provided |
| Dark mode toggle with SSR | Manual localStorage + useEffect | `next-themes` | Eliminates FOUC (flash of incorrect theme) via SSR class injection |
| Animated transitions | Custom CSS keyframes | `tw-animate-css` | Pre-built Tailwind v4 compatible animation utilities |
| Sidebar navigation with mobile | Custom drawer/sidebar | `shadcn sidebar` | Persistent state via cookies, keyboard shortcuts, mobile Sheet fallback built-in |
| Form validation | Manual regex/type checks | `zod` | Type-safe schema validation with automatic TypeScript inference |

**Key insight:** The auth + i18n + dark mode combination has multiple server/client hydration interactions. Each of these libraries was specifically designed to handle Next.js App Router's server/client split correctly. Custom implementations reliably produce hydration mismatches and auth race conditions.

---

## Common Pitfalls

### Pitfall 1: middleware.ts vs proxy.ts in Next.js 16
**What goes wrong:** next-intl locale routing silently fails; auth token refresh never runs; pages redirect incorrectly.
**Why it happens:** Next.js 16 renamed the file and the export. `middleware.ts` still exists for Edge runtime but is deprecated. next-intl v4 docs show `proxy.ts` as the file name.
**How to avoid:** Create `src/proxy.ts` with `export default function proxy(...)` — not `export default function middleware(...)`.
**Warning signs:** Locale segments not appearing in URLs; auth state lost between requests; all pages redirect to login.

### Pitfall 2: next-intl v4 locale not returned from getRequestConfig
**What goes wrong:** Runtime error "Unable to find next-intl locale" in any component using `useTranslations`.
**Why it happens:** In v3, `locale` in `getRequestConfig` return was optional. In v4 it is required.
**How to avoid:** Always return `{ locale, messages }` from `getRequestConfig`.
**Warning signs:** Server component crashes with next-intl locale error on first render.

### Pitfall 3: Audio upload via Server Action
**What goes wrong:** Transcription requests fail silently or with a 413 body size error for any recording over ~1MB (which is a ~10-second recording at typical bitrates).
**Why it happens:** Next.js Server Actions have a 1MB default request body limit.
**How to avoid:** Use `app/api/transcribe/route.ts` (Route Handler). Client sends `FormData` via `fetch`. No body size limit (beyond server memory).
**Warning signs:** Short recordings (<5s) work; longer recordings fail.

### Pitfall 4: iOS Safari audio/webm hardcoded
**What goes wrong:** `MediaRecorder` constructor throws `NotSupportedError` or produces silent audio on older iOS Safari.
**Why it happens:** Safari < 18.4 does not support `audio/webm`. The supported format varies by device/OS version.
**How to avoid:** Always call `MediaRecorder.isTypeSupported()` before instantiating. Use the negotiation pattern in the Code Examples section.
**Warning signs:** Recording works on Chrome, fails silently or throws on iPhone.

### Pitfall 5: Supabase cookies set in Server Component
**What goes wrong:** Runtime error: "Cookies can only be modified in a Server Action or Route Handler."
**Why it happens:** The `setAll` callback in `createServerClient` is called when a token needs refreshing. Server Components cannot set cookies — only `proxy.ts` can.
**How to avoid:** Wrap `setAll` in `try/catch` in the server client utility. The proxy handles actual cookie writes; Server Components only need to read.
**Warning signs:** Intermittent cookie errors on pages that read auth state.

### Pitfall 6: Tailwind v4 — no tailwind.config.js
**What goes wrong:** shadcn `init` may still generate a `tailwind.config.js` if run incorrectly. Custom Tailwind configuration written in `tailwind.config.js` is silently ignored.
**Why it happens:** Some older guides and the shadcn CLI's v3 behavior created a JS config.
**How to avoid:** After `shadcn init`, verify configuration is in `globals.css` via `@theme`. Remove any `tailwind.config.js` if generated and move config to CSS.
**Warning signs:** Custom color tokens defined in `tailwind.config.js` not applying; shadcn component colors wrong.

### Pitfall 7: `getUser()` vs `getClaims()` confusion
**What goes wrong:** Using `getSession()` server-side returns stale/unvalidated session data, creating auth bypass vulnerabilities.
**Why it happens:** `getSession()` reads from the cookie without validating the token signature — explicitly warned against in Supabase docs.
**How to avoid:** In `proxy.ts` use `getClaims()` (fast, validates JWT locally). In page/layout protected routes use `getUser()` (slower, validates with Supabase server). Never use `getSession()` server-side.
**Warning signs:** Users appear authenticated after token expiry; RLS policies don't apply correctly.

### Pitfall 8: AudioContext suspended on page load
**What goes wrong:** Waveform visualization shows flat line even when recording; `AudioContext.state` is `"suspended"`.
**Why it happens:** Browsers require a user gesture before creating/resuming an `AudioContext`. If created at module load time or in a useEffect without user interaction, it starts suspended.
**How to avoid:** Create `AudioContext` inside the button click handler that starts recording (inside the user gesture event). Call `.resume()` if state is `"suspended"`.
**Warning signs:** `analyser.getByteTimeDomainData()` returns all 128 (midpoint) values; waveform flat at center.

---

## Code Examples

### Supabase Email/Password Sign-In (Client Component)
```typescript
// Source: https://supabase.com/docs/guides/auth/server-side/nextjs
'use client'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export function LoginForm() {
  const supabase = createClient()
  const router = useRouter()

  async function handleSubmit(formData: FormData) {
    const { error } = await supabase.auth.signInWithPassword({
      email: formData.get('email') as string,
      password: formData.get('password') as string,
    })
    if (!error) router.push('/en/sessions')
  }

  return <form action={handleSubmit}>{/* fields */}</form>
}
```

### Protected Route Check (Server Component)
```typescript
// Source: https://supabase.com/docs/guides/auth/server-side/nextjs
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function ProtectedPage() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (!user || error) {
    redirect('/en/login')
  }

  return <div>Protected content for {user.email}</div>
}
```

### GitHub Actions CI Workflow
```yaml
# .github/workflows/ci.yml
name: CI

on:
  pull_request:
    branches: [integration, main]

jobs:
  ci:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run lint          # ESLint (direct, not via next lint — removed in Next.js 16)
      - run: npm run type-check    # tsc --noEmit
      - run: npm test -- --passWithNoTests
```

**Note:** `next lint` command was removed in Next.js 16. Run ESLint directly via `eslint .` or configure a `lint` npm script.

### Recording State Machine
```typescript
// Recommended state transitions for RecordingModal
type RecordingState = 'idle' | 'recording' | 'recorded'

// idle → recording: user presses mic button (triggers getUserMedia + MediaRecorder.start())
// recording → recorded: user presses stop (MediaRecorder.stop() → onstop produces Blob)
// recorded → idle: user presses discard
// recorded → [upload]: user confirms → POST to /api/transcribe
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `middleware.ts` | `proxy.ts` | Next.js 16 (Oct 2025) | Must rename file and exported function |
| `@supabase/auth-helpers-nextjs` | `@supabase/ssr` | 2024 | auth-helpers is deprecated; ssr is required |
| `getSession()` server-side | `getClaims()` for refresh, `getUser()` for protection | 2024-2025 | Security: getSession doesn't revalidate token |
| `tailwind.config.js` | `globals.css` with `@theme` | Tailwind v4 (Jan 2025) | No JS config; CSS-first configuration |
| `tailwindcss-animate` | `tw-animate-css` | shadcn v4 (early 2025) | tailwindcss-animate incompatible with v4 |
| `next-intl` locale optional in getRequestConfig | locale required return value | next-intl v4 (2025) | Runtime error if not returned |
| `NextIntlClientProvider` optional | `NextIntlClientProvider` required | next-intl v4 (2025) | Client components throw without provider |
| `middleware.ts` for next-intl | `proxy.ts` for next-intl | next-intl v4 + Next.js 16 | Same file rename applies |
| `next lint` command | Direct ESLint CLI | Next.js 16 (Oct 2025) | Remove from CI scripts; use `eslint .` |

**Deprecated/outdated:**
- `@supabase/auth-helpers-nextjs`: Deprecated, remove from all docs/guides
- `tailwindcss-animate`: Does not work with Tailwind v4
- `middleware.ts` (Next.js 16): Deprecated, use `proxy.ts`
- `next lint` CLI command: Removed in Next.js 16

---

## Open Questions

1. **Next.js 16 `next lint` removal impact on CI**
   - What we know: `next lint` was removed in Next.js 16; direct ESLint CLI is the replacement
   - What's unclear: whether `create-next-app` scaffold still adds a `lint` npm script or if it needs manual configuration for ESLint flat config
   - Recommendation: After scaffold, verify `package.json` lint script and add `"lint": "eslint src"` if missing; the default ESLint config is now flat config format

2. **next-intl v4 + Next.js 16 `proxy.ts` function name conflict**
   - What we know: next-intl creates its middleware via `createMiddleware(routing)` — this must be composed with the Supabase auth refresh in the same `proxy.ts` file
   - What's unclear: whether the two middlewares can be composed cleanly or require a specific ordering
   - Recommendation: Run intl middleware first (it handles redirects for locale-less URLs), then run Supabase token refresh. Return intl response if it's a redirect, otherwise return auth-refreshed response.

3. **Supabase publishable key vs anon key naming**
   - What we know: Supabase docs mention renaming `NEXT_PUBLIC_SUPABASE_ANON_KEY` to `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` as part of a key architecture change
   - What's unclear: Whether this rename is complete/required now or still optional
   - Recommendation: Use `NEXT_PUBLIC_SUPABASE_ANON_KEY` in env files for compatibility and alias it if/when Supabase forces the rename. Check Supabase project settings for current key naming.

4. **iOS Safari audio/webm;codecs=opus in Safari 18.4+**
   - What we know: Multiple sources indicate Safari 18.4+ supports audio/webm with opus codec; the `isTypeSupported()` pattern handles both old and new Safari
   - What's unclear: Exact iOS version in the field for this app's users
   - Recommendation: The `isTypeSupported()` negotiation pattern handles all cases correctly — whichever format Safari reports as supported will be used. No special-casing needed beyond that negotiation.

---

## Sources

### Primary (HIGH confidence)
- https://nextjs.org/blog/next-16 — Next.js 16 official release notes (Oct 2025); proxy.ts rename, breaking changes table
- https://nextjs.org/docs/app/api-reference/file-conventions/route — Route Handler docs, verified version 16.1.6, lastUpdated 2026-02-27
- https://supabase.com/docs/guides/auth/server-side/nextjs — Official Supabase SSR + Next.js setup; createBrowserClient, createServerClient, getClaims
- https://supabase.com/docs/guides/database/postgres/row-level-security — Official RLS docs; auth.uid() patterns, policy SQL examples
- https://tailwindcss.com/docs/dark-mode — Tailwind v4 official dark mode; @custom-variant syntax
- https://ui.shadcn.com/docs/tailwind-v4 — shadcn v4 Tailwind changes; tw-animate-css migration
- https://ui.shadcn.com/docs/installation/next — shadcn CLI init command for Next.js
- https://ui.shadcn.com/docs/components/radix/sidebar — shadcn Sidebar component docs; SidebarProvider, collapsible patterns
- https://next-intl.dev/docs/routing/setup — next-intl v4 App Router setup; proxy.ts, defineRouting, getRequestConfig
- https://next-intl.dev/blog/next-intl-4-0 — next-intl v4 changelog; ESM-only, locale required, NextIntlClientProvider required
- https://supabase.com/docs/guides/deployment/managing-environments — Supabase multi-environment patterns; separate projects, GitHub Actions secrets

### Secondary (MEDIUM confidence)
- https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder/isTypeSupported_static — isTypeSupported API; cross-browser negotiation pattern
- https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Visualizations_with_Web_Audio_API — AnalyserNode waveform visualization pattern
- https://www.buildwithmatija.com/blog/next-intl-nextjs-16-proxy-fix — Verified against official next-intl docs; next-intl + proxy.ts integration

### Tertiary (LOW confidence — flag for validation)
- Safari 18.4 audio/webm;codecs=opus support: Multiple WebSearch sources claim this but MDN does not document browser-specific MediaRecorder MIME type support per version. **Validate with isTypeSupported() at runtime; do not assume.**

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries verified against official docs; versions confirmed from release notes
- Architecture: HIGH — patterns taken directly from official Supabase, Next.js, next-intl, and shadcn documentation
- Pitfalls: HIGH — all pitfalls grounded in official deprecation notices or documented breaking changes
- MediaRecorder cross-browser: MEDIUM — isTypeSupported pattern is official API; specific Safari version behavior is LOW confidence

**Research date:** 2026-03-13
**Valid until:** 2026-04-13 (30 days — all libraries are in stable release cycles except Supabase key naming which is actively changing)
