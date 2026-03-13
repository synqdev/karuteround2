# Architecture Research

**Domain:** AI-assisted service record-keeping (digital karute) — Next.js + Supabase
**Researched:** 2026-03-13
**Confidence:** HIGH (core patterns verified against official docs and multiple sources)

## Standard Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         BROWSER (Client)                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐   │
│  │  Recording   │  │  Karute UI   │  │  Auth / Staff Switcher   │   │
│  │  Component   │  │  Pages       │  │  (Supabase browser SDK)  │   │
│  └──────┬───────┘  └──────┬───────┘  └────────────┬─────────────┘   │
│         │  audio Blob     │  mutations             │ session cookie   │
└─────────┼─────────────────┼────────────────────────┼─────────────────┘
          │                 │                         │
┌─────────┼─────────────────┼────────────────────────┼─────────────────┐
│         ↓                 ↓                         ↓                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐   │
│  │ POST /api/   │  │  Server      │  │  Middleware              │   │
│  │ transcribe   │  │  Actions     │  │  (auth token refresh)    │   │
│  │ (Route       │  │  (CRUD ops)  │  │                          │   │
│  │  Handler)    │  │              │  └──────────────────────────┘   │
│  └──────┬───────┘  └──────┬───────┘                                 │
│         │                 │           NEXT.JS SERVER                 │
└─────────┼─────────────────┼───────────────────────────────────────┘
          │                 │
          ↓                 ↓
┌─────────────────────────────────────────────────────────────────────┐
│                      EXTERNAL SERVICES                               │
│  ┌──────────────────┐   ┌─────────────────────────────────────┐     │
│  │  OpenAI Whisper  │   │  OpenAI GPT (structured extraction) │     │
│  │  (transcription) │   │  zodResponseFormat + parse()         │     │
│  └──────────────────┘   └─────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────────────┘
          │ transcript text + structured entries
          ↓
┌─────────────────────────────────────────────────────────────────────┐
│                         SUPABASE                                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐   │
│  │  Auth        │  │  Postgres DB  │  │  Storage (temp audio)    │   │
│  │  (sessions,  │  │  customers    │  │  deleted after           │   │
│  │   profiles)  │  │  karute_recs  │  │  transcription           │   │
│  │              │  │  entries      │  │                          │   │
│  └──────────────┘  └──────────────┘  └──────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Communicates With |
|-----------|----------------|-------------------|
| Recording Component | Capture audio via MediaRecorder API, hold Blob in memory, POST to `/api/transcribe` | `/api/transcribe` Route Handler |
| `/api/transcribe` Route Handler | Receive audio Blob, call Whisper API, call GPT extraction, save transcript + entries, delete audio | OpenAI Whisper, OpenAI GPT, Supabase DB |
| Server Actions | CRUD for customers, karute records, entries — triggered from UI | Supabase server client |
| Middleware | Refresh Supabase auth tokens on every request via `getClaims()`, set cookies | Supabase Auth |
| Supabase Browser Client | Session management, staff profile switching, real-time subscriptions if needed | Supabase Auth |
| Supabase Server Client | Authenticated DB reads in Server Components and Server Actions | Supabase Postgres |
| Karute UI Pages | Server-rendered list/detail views for customers and records | Server Actions, Supabase server client |
| PDF/Text Export | Generate and stream export documents | Browser File API or server-side pdf lib |

## Recommended Project Structure

```
src/
├── app/
│   ├── (auth)/
│   │   └── login/           # Login page (server component)
│   ├── (app)/
│   │   ├── layout.tsx        # Authenticated shell, staff switcher
│   │   ├── customers/
│   │   │   ├── page.tsx      # Customer list
│   │   │   └── [id]/
│   │   │       ├── page.tsx  # Customer detail + karute records
│   │   │       └── record/
│   │   │           └── page.tsx  # New session recording view
│   │   └── export/
│   │       └── [id]/route.ts # PDF/text export Route Handler
│   └── api/
│       └── transcribe/
│           └── route.ts      # Audio → Whisper → GPT → DB pipeline
├── components/
│   ├── recording/
│   │   ├── AudioRecorder.tsx # MediaRecorder hook + UI
│   │   └── useAudioRecorder.ts
│   ├── karute/
│   │   ├── EntryCard.tsx
│   │   ├── KaruteRecord.tsx
│   │   └── StaffSwitcher.tsx
│   └── ui/                   # Shared primitives (shadcn/radix)
├── lib/
│   ├── supabase/
│   │   ├── client.ts         # createBrowserClient singleton
│   │   ├── server.ts         # createServerClient (cookies)
│   │   └── middleware.ts     # Token refresh proxy
│   ├── openai/
│   │   ├── whisper.ts        # transcribeAudio(blob) → string
│   │   └── extract.ts        # extractEntries(transcript) → Entry[]
│   └── export/
│       ├── pdf.ts            # generatePDF(record) → Buffer
│       └── text.ts           # generateText(record) → string
├── actions/
│   ├── customers.ts          # createCustomer, updateCustomer
│   ├── karute.ts             # createRecord, updateRecord
│   └── entries.ts            # updateEntry, deleteEntry
├── types/
│   ├── database.ts           # Supabase generated types
│   └── karute.ts             # Entry, KaruteRecord, Customer interfaces
└── middleware.ts              # Auth token refresh (Supabase SSR)
```

### Structure Rationale

- **`app/api/transcribe/`:** Route Handler (not Server Action) because audio Blobs exceed Server Action's default 1MB payload limit; Route Handlers have configurable body size and better control over streaming responses.
- **`lib/supabase/`:** Separate browser/server clients required by `@supabase/ssr` — browser client uses `createBrowserClient` (singleton), server client uses `createServerClient` (request-scoped cookies).
- **`lib/openai/`:** Isolated modules for Whisper and GPT extraction keep the transcribe Route Handler thin and each concern testable independently.
- **`actions/`:** Server Actions for all CRUD operations — they run server-side, have automatic TypeScript types client-to-server, and suit internal mutations from React components.
- **`types/database.ts`:** Generated from Supabase CLI (`supabase gen types`) — regenerate whenever schema changes.

## Architectural Patterns

### Pattern 1: Route Handler for the Audio Pipeline

**What:** The full pipeline (audio receive → Whisper → GPT → DB write → audio delete) runs in a single `POST /api/transcribe` Route Handler, not a Server Action.

**When to use:** Any time payload > 1MB or you need fine-grained HTTP response control (streaming progress, custom status codes).

**Trade-offs:** More boilerplate than a Server Action but avoids silent payload truncation. The 1MB default Server Action cap is a hard limit with no runtime error — it silently fails for larger audio.

**Example:**
```typescript
// app/api/transcribe/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { transcribeAudio } from '@/lib/openai/whisper'
import { extractEntries } from '@/lib/openai/extract'
import { createServerClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const formData = await req.formData()
  const audioBlob = formData.get('audio') as File
  const karuteId = formData.get('karuteId') as string

  const transcript = await transcribeAudio(audioBlob)
  const entries = await extractEntries(transcript)

  const supabase = createServerClient()
  await supabase.from('karute_records').update({ transcript }).eq('id', karuteId)
  await supabase.from('entries').insert(entries.map(e => ({ ...e, karute_id: karuteId })))

  return NextResponse.json({ ok: true, entryCount: entries.length })
}
```

### Pattern 2: OpenAI Structured Outputs with Zod

**What:** Use `zodResponseFormat` from `openai/helpers/zod` and `openai.chat.completions.parse()` to get typed, validated entry arrays from GPT. No manual JSON parsing or validation loops.

**When to use:** Any GPT extraction that needs a guaranteed schema — entries, categories, confidence scores.

**Trade-offs:** Requires `openai` SDK >= 4.55.0. Model must be `gpt-4o-2024-08-06` or newer for full structured output support. Older models fall back to function calling with less reliability.

**Example:**
```typescript
// lib/openai/extract.ts
import { z } from 'zod'
import { zodResponseFormat } from 'openai/helpers/zod'
import openai from './client'

const EntrySchema = z.object({
  entries: z.array(z.object({
    category: z.string(),
    title: z.string(),
    quote: z.string(),
    confidence: z.number().min(0).max(1),
  }))
})

export async function extractEntries(transcript: string) {
  const completion = await openai.chat.completions.parse({
    model: 'gpt-4o-2024-08-06',
    messages: [
      { role: 'system', content: 'Extract karute entries from this service session transcript.' },
      { role: 'user', content: transcript },
    ],
    response_format: zodResponseFormat(EntrySchema, 'karute_entries'),
  })
  return completion.choices[0].message.parsed?.entries ?? []
}
```

### Pattern 3: Two Supabase Clients (Browser vs Server)

**What:** `@supabase/ssr` provides `createBrowserClient` for use in `'use client'` components and `createServerClient` for Server Components, Server Actions, Route Handlers, and Middleware. They differ in how they read/write the session cookie.

**When to use:** Always. Using the wrong client causes auth token mismatch, stale sessions, and RLS policy failures.

**Trade-offs:** Slightly more setup than a single universal client, but required by Next.js App Router's split rendering model.

**Example:**
```typescript
// lib/supabase/server.ts — for Server Components, Actions, Route Handlers
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export function createClient() {
  const cookieStore = cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: (c) => c.forEach(({ name, value, options }) => cookieStore.set(name, value, options)) } }
  )
}
```

### Pattern 4: Staff Profile Switching Without Re-Auth

**What:** Single Supabase auth account for the business. Staff members are rows in a `profiles` table (not separate auth users). A `current_staff_id` is stored in React context (or `localStorage` as a hint) and included in DB writes, not in RLS decisions.

**When to use:** When the business model is one account per salon/clinic and staff selection is a UI convenience, not an access control boundary.

**Trade-offs:** Simpler auth model. RLS policies protect by business (the authenticated user) rather than individual staff. If per-staff data isolation is ever needed, this requires refactoring to separate auth users.

## Data Flow

### Primary Flow: Audio Session → Structured Entries

```
Staff selects customer
    ↓
Staff presses Record
    ↓
Browser MediaRecorder captures audio → Blob in memory
    ↓
Staff presses Stop
    ↓
POST /api/transcribe (FormData: audio Blob + karuteId)
    ↓
Route Handler: audioBlob → OpenAI Whisper API → transcript string
    ↓
Route Handler: transcript string → OpenAI GPT (structured output) → Entry[]
    ↓
Route Handler: INSERT INTO karute_records (transcript)
              + INSERT INTO entries (category, title, quote, confidence, karute_id)
    ↓
Route Handler: DELETE audio Blob (never stored — stays in FormData memory only)
    ↓
Response { ok: true, entryCount: N } → UI updates to show entries
```

Note: Audio is NOT uploaded to Supabase Storage. It flows as a FormData payload directly to the Route Handler and is discarded after Whisper processes it. This avoids storage costs and privacy concerns.

### Secondary Flow: CRUD via Server Actions

```
UI form submission (e.g., new customer, edit entry)
    ↓
Server Action (actions/customers.ts or actions/entries.ts)
    ↓
createServerClient() with request cookies
    ↓
Supabase Postgres via RLS-enforced query
    ↓
revalidatePath() → Server Component re-renders with fresh data
```

### Auth Flow

```
Request arrives
    ↓
middleware.ts: createServerClient + supabase.auth.getClaims()
    → refreshes token if expired
    → sets cookie on request (for Server Components)
    → sets cookie on response (for browser)
    ↓
Protected route: Server Component reads session
    → redirect to /login if no session
```

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| 0-100 businesses | Current architecture is fine. Single Supabase project, Vercel hobby/pro. |
| 100-1k businesses | Monitor Whisper API costs per transcription. Add request queuing (Supabase Edge Function queue or Inngest) if concurrent session recordings spike. |
| 1k+ businesses | Separate Supabase projects per tenant for data isolation. Move transcription pipeline to background job (no longer inline in HTTP request). |

### Scaling Priorities

1. **First bottleneck:** OpenAI API latency in the transcribe Route Handler. The pipeline is synchronous — recording stops → user waits for Whisper + GPT. At scale, use optimistic UI and background processing via Supabase Edge Functions or a job queue.
2. **Second bottleneck:** Supabase connection pooling. Use PgBouncer (built into Supabase) and prefer Server Actions + server components over direct client queries.

## Anti-Patterns

### Anti-Pattern 1: Using Server Action for Audio Upload

**What people do:** Mark the transcribe function as `'use server'` and pass the audio Blob directly.

**Why it's wrong:** Next.js Server Actions have a default 1MB body size limit. A 5-minute audio recording easily exceeds this. The failure mode is silent truncation or an opaque 413 error, not a clear developer warning. The `bodySizeLimit` config option can raise it, but Route Handlers are the correct tool for binary file uploads.

**Do this instead:** Use a `POST` Route Handler at `app/api/transcribe/route.ts` which accepts `FormData` with no enforced default limit.

### Anti-Pattern 2: Storing Audio in Supabase Storage

**What people do:** Upload audio to Supabase Storage, trigger a webhook or Edge Function to transcribe, then delete.

**Why it's wrong:** Adds latency (upload → webhook → download → transcribe), storage costs, and privacy surface area. The project requirement is "audio discarded after transcription" — routing through storage contradicts this.

**Do this instead:** Stream the audio Blob directly from browser FormData to the Route Handler. The audio never touches persistent storage.

### Anti-Pattern 3: Calling OpenAI API from the Browser

**What people do:** Use the OpenAI SDK in a `'use client'` component to avoid a round-trip to their own server.

**Why it's wrong:** Exposes the OpenAI API key in the browser bundle. Any user can extract it from DevTools and run up the bill.

**Do this instead:** All OpenAI calls go through the Route Handler (`/api/transcribe`) where the key stays server-side in environment variables.

### Anti-Pattern 4: Using `getSession()` for Server-Side Auth Checks

**What people do:** Call `supabase.auth.getSession()` in Server Components or Middleware to verify auth.

**Why it's wrong:** `getSession()` returns the session from the cookie without revalidating the token with Supabase Auth servers. A revoked or expired token is not detected.

**Do this instead:** Use `supabase.auth.getClaims()` in Middleware (which revalidates the token) and trust the resulting session downstream in Server Components.

### Anti-Pattern 5: One Supabase Client for Everything

**What people do:** Create one `supabase` instance (often `createClient()` at module level) and import it everywhere.

**Why it's wrong:** In Next.js App Router, server and client contexts have different cookie access mechanisms. A browser-style client in a Server Component cannot properly read or write session cookies, breaking auth.

**Do this instead:** Import from `@/lib/supabase/client.ts` in `'use client'` components and from `@/lib/supabase/server.ts` in Server Components, Server Actions, and Route Handlers.

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| OpenAI Whisper | HTTP POST to `api.openai.com/v1/audio/transcriptions` via `openai` SDK in Route Handler | Model: `whisper-1`. Pass audio as `File` object. Supported formats: webm, mp4, wav, m4a. Browser `MediaRecorder` default is `audio/webm` on Chrome/Edge, `audio/mp4` on Safari — both supported. |
| OpenAI GPT | `openai.chat.completions.parse()` with `zodResponseFormat` in Route Handler | Use `gpt-4o-2024-08-06` or newer for full structured output guarantees. |
| Supabase Auth | `@supabase/ssr` package — browser client for session, server client for protected queries | Middleware handles token refresh. |
| Supabase Postgres | Supabase server client in Server Actions and Route Handlers, browser client for real-time | RLS policies enforce single-business data isolation. |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| Recording Component → Transcribe API | `fetch()` POST with `FormData` (audio Blob + karuteId) | No Server Action — size limit concern. |
| Server Actions → Supabase | Direct `createServerClient()` call per action | Cookies accessed fresh per action invocation. |
| Middleware → Server Components | `request.cookies.set()` / `response.cookies.set()` | Standard `@supabase/ssr` middleware pattern. |
| Route Handler → OpenAI | `openai` Node.js SDK (server-only, API key in env) | Never import openai SDK in client components. |
| Export Route Handler → PDF lib | Server-side only | `react-pdf` or `pdf-lib` — generate PDF Buffer, stream as response. |

## Build Order Implications

The component dependency graph determines a natural build order:

1. **Foundation first:** Supabase schema (tables, RLS), Next.js project scaffold, auth middleware, two Supabase client utilities. Everything else depends on this.

2. **Data layer second:** Server Actions for customers and karute records, Supabase generated types. The UI needs something to read/write before it's useful.

3. **Core pipeline third:** The `/api/transcribe` Route Handler with Whisper + GPT extraction. This is the primary value delivery and should be working end-to-end (even with stub UI) before investing in UI polish.

4. **UI fourth:** Recording component, karute views, customer list/detail. These consume the pipeline and data layer built in steps 1-3.

5. **Export last:** PDF and text export are independent of the recording pipeline and can be added after core flows are validated.

## Sources

- Supabase Next.js App Router auth architecture: [Setting up Server-Side Auth for Next.js](https://supabase.com/docs/guides/auth/server-side/nextjs) — HIGH confidence
- Supabase Storage deletion: [Delete Objects](https://supabase.com/docs/guides/storage/management/delete-objects) — HIGH confidence
- OpenAI Structured Outputs with Zod: [Structured model outputs](https://developers.openai.com/api/docs/guides/structured-outputs/) — HIGH confidence
- Server Actions vs Route Handlers: [When to Use Each in Next.js](https://makerkit.dev/blog/tutorials/server-actions-vs-route-handlers) — MEDIUM confidence (community source, aligns with official Next.js docs)
- Next.js Server Action 1MB body limit: [GitHub Discussion #49891](https://github.com/vercel/next.js/discussions/49891) — MEDIUM confidence (community confirmed, aligns with Next.js config docs)
- Audio transcription with Whisper + Next.js App Router: [Build an AI Speech to Text App](https://medium.com/@muhammadarifineffendi/build-an-ai-speech-to-text-app-with-openai-whisper-next-js-app-router-part-2-992f49700472) — LOW confidence (community blog, pattern consistent with official Whisper docs)
- Next.js project structure best practices: [App Router best practices 2025](https://medium.com/better-dev-nextjs-react/inside-the-app-router-best-practices-for-next-js-file-and-directory-structure-2025-edition-ed6bc14a8da3) — LOW confidence (community, consistent with official Next.js conventions)

---
*Architecture research for: AI-assisted digital karute — Next.js + Supabase*
*Researched: 2026-03-13*
