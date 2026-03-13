# Stack Research

**Domain:** AI-assisted digital karute (client records) for Japanese salons/spas
**Researched:** 2026-03-13
**Confidence:** HIGH (core stack verified via official sources and npm registry as of research date)

---

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Next.js | 16.1.6 (latest LTS) | Full-stack React framework | App Router + Server Actions handle audio upload pipeline cleanly. Turbopack is now default (stable), React 19.2 built-in. Node.js 20.9+ required — check host. |
| React | 19.2 (via Next.js 16) | UI runtime | Bundled with Next.js 16; use `npm install next@latest react@latest react-dom@latest`. Do not pin React separately. |
| TypeScript | 5.x (5.1+ required by Next.js 16) | Type safety | Required by Next.js 16 minimum. CSS-first Tailwind v4 + shadcn v4 CLI expect TypeScript. |
| Supabase | @supabase/supabase-js ^2.99.1 | Database, auth, storage | Postgres + RLS + real-time. Single-business login + staff switching maps cleanly to one auth tenant with profile rows. |
| @supabase/ssr | ^0.x latest | SSR cookie auth for Next.js App Router | **Required** — replaces deprecated `auth-helpers`. `createBrowserClient` for client, `createServerClient` for server/middleware. Do not use the old `@supabase/auth-helpers-nextjs`. |
| OpenAI SDK | ^6.27.0 (latest v6) | Transcription + GPT extraction | SDK is now v6 (not v4 as training data suggests). Whisper API stays at model `whisper-1` or newer `gpt-4o-mini-transcribe` / `gpt-4o-transcribe`. |
| Tailwind CSS | ^4.2.1 | Utility styling | v4 is now stable and default for new Next.js 16 projects. CSS-first config — no `tailwind.config.js`, configuration lives in the main CSS file via `@import "tailwindcss"`. |
| shadcn/ui | CLI v4.0.5 (`npx shadcn@latest`) | Component library | Full Tailwind v4 + React 19 compatibility as of February 2026. Use `npx shadcn@latest init`. Dark mode built-in, well-suited for dark-themed UI. |

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| next-intl | ^4.8.3 | EN/JP bilingual i18n | App Router–native, Server Component support, zero client JS for server-rendered translations. Standard pick for Japanese + English. Set `locales: ['en', 'ja']` with `defaultLocale: 'ja'` since target market is Japan. |
| @react-pdf/renderer | ^4.3.2 | PDF karute export | React-component–based PDF generation, runs browser-side or Node.js. Correct for styled documents. Do NOT use jsPDF — no external CSS support, no Japanese font handling. |
| zod | ^4.3.6 | Runtime schema validation | v4 is stable (August 2025 release). 14x faster than v3. Use for OpenAI response parsing (structured extraction output) and form validation. |
| react-hook-form | ^7.x stable (v8 beta — avoid) | Form management | Pairs with zod via `@hookform/resolvers ^5.2.2`. v8 is in beta (avoid until stable). Use v7 + `zodResolver`. |
| @hookform/resolvers | ^5.2.2 | Zod ↔ react-hook-form bridge | Required for zod v4 integration with react-hook-form v7. |

### Audio Recording (browser)

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Native MediaRecorder API | Browser built-in | Capture microphone audio | Use directly — no wrapper library needed. `navigator.mediaDevices.getUserMedia({ audio: true })` → `MediaRecorder` → collect Blob chunks. Supported in all modern browsers (Chrome 111+, Safari 16.4+, Firefox 111+ — matches Next.js 16 browser requirements exactly). |
| — | — | — | Avoid `react-media-recorder` and `react-mic` — both are poorly maintained and add unnecessary abstraction over a stable browser API. |

**Audio format guidance:** Record as `audio/webm` (Chrome/Firefox default). Safari records as `audio/mp4`. Both are accepted by the Whisper API. The 25MB file size limit is per-request — for typical salon consultation recordings (5–15 min), webm at default bitrate stays well under 25MB. No chunking needed unless you expect recordings over ~30 minutes.

**Whisper API note:** The newer `gpt-4o-mini-transcribe` model (December 2025 snapshot) has significantly better Japanese accuracy than `whisper-1` — specifically improved for "short user utterances and noisy backgrounds" and shows 90% fewer hallucinations than Whisper v2. **Use `gpt-4o-mini-transcribe` as the default transcription model for Japanese.**

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| Supabase CLI | Local dev DB + migrations | Run `supabase start` for local Postgres. Use `supabase db push` for schema migrations. Maintain separate projects for dev and prod — environment variable switching via `.env.local` (dev) vs hosting provider secrets (prod). |
| Vercel | Hosting for Next.js | First-party Next.js 16 support including Turbopack. Use preview deployments for integration branch. Environment variables scoped per environment (Development / Preview / Production). |
| GitHub Actions + anthropics/claude-code-action@v1 | CI/CD + automated PR review | Official Anthropic action. Set `ANTHROPIC_API_KEY` as repository secret. Use for: lint, type-check, tests on PR; Claude review on `integration` → `main` PRs. |
| ESLint (Flat Config) | Linting | Next.js 16 defaults to ESLint Flat Config format. Note: `next lint` command removed in Next.js 16 — run `eslint` directly. |

---

## Installation

```bash
# Bootstrap project
npx create-next-app@latest karute --typescript --tailwind --app --turbopack

# Core Supabase (install both — supabase-js is the client, ssr handles cookies)
npm install @supabase/supabase-js @supabase/ssr

# OpenAI SDK
npm install openai

# i18n
npm install next-intl

# PDF export
npm install @react-pdf/renderer

# Form validation
npm install zod react-hook-form @hookform/resolvers

# shadcn CLI (run interactively to add components)
npx shadcn@latest init
```

```bash
# Dev dependencies
npm install -D @types/node @types/react @types/react-dom typescript eslint
```

---

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| gpt-4o-mini-transcribe | whisper-1 | Only if cost is the primary constraint and Japanese accuracy is acceptable at lower quality. whisper-1 is still available but gpt-4o-mini-transcribe is cheaper per minute AND more accurate for Japanese. |
| @react-pdf/renderer | jsPDF | Never for this project — jsPDF lacks external CSS support and Japanese font support requires a custom converter. @react-pdf/renderer handles CJK fonts natively if you embed a Japanese font (e.g. Noto Sans JP). |
| next-intl | react-i18next | If you need client-only i18n in a non-App Router context. For App Router + Server Components, next-intl is strictly better — zero client JS for server-rendered strings. |
| @supabase/ssr | @supabase/auth-helpers-nextjs | auth-helpers deprecated as of January 2026. Do not use. |
| Native MediaRecorder | react-media-recorder | If you need very quick prototyping and don't want to write custom hook. But the package is unmaintained and the API is stable enough to wrap yourself in ~50 lines. |
| Vercel | Self-hosted / Railway | Self-host only if you have data residency requirements (Japanese data sovereignty). Vercel supports region selection (Tokyo) to keep data in Japan. |
| Tailwind CSS v4 | Tailwind CSS v3 | If you're adding this stack to an existing v3 project. For greenfield, use v4 — it's the new default and shadcn v4 CLI targets it. |

---

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| `@supabase/auth-helpers-nextjs` | Deprecated January 2026, no longer receiving bug fixes | `@supabase/ssr` with `createBrowserClient` / `createServerClient` |
| `openai` v4 or v5 | SDK is now at v6 — if you pin an old version you miss breaking changes and new model support | `openai@latest` (currently ^6.27.0) |
| `whisper-1` as primary transcription model | For Japanese, gpt-4o-mini-transcribe has dramatically lower error rates and hallucinations. Whisper-1 accuracy on noisy Japanese is poor. | `gpt-4o-mini-transcribe` (December 2025 snapshot) |
| Streaming audio to Whisper API | Whisper/transcription API requires a complete file — not a stream. Record fully, then send. | Collect MediaRecorder chunks into a single Blob, then POST as `multipart/form-data`. |
| Sending audio via Next.js Server Action body | Next.js imposes a 1MB body limit on Server Actions by default — audio blobs will exceed this | Use signed Supabase storage upload URLs (client uploads directly to storage), or a Next.js Route Handler (`/api/transcribe`) which can handle larger payloads. |
| `tailwindcss-animate` | Not compatible with Tailwind v4 | `tw-animate-css` (drop-in replacement) |
| `react-i18next` | Requires wrapper components for Server Component support; larger bundle than next-intl | `next-intl` which renders translations on the server with zero client JS |
| Storing audio in Supabase Storage | Project spec: audio discarded after transcription. Don't create a storage bucket for audio — it creates GDPR/privacy surface and storage costs | Upload audio directly to Next.js Route Handler → forward to Whisper → delete the blob — never persist audio |
| `next lint` CLI command | Removed in Next.js 16 | Run `eslint` directly; configure `eslint.config.mjs` (Flat Config format) |
| `middleware.ts` | Deprecated in Next.js 16 (renamed) | `proxy.ts` — rename file and exported function to `proxy` |

---

## Stack Patterns by Variant

**Audio upload approach — because audio files can easily exceed Server Action body limits:**
- Use a Next.js **Route Handler** (`app/api/transcribe/route.ts`) instead of a Server Action
- Client sends `FormData` with audio Blob via `fetch`
- Route Handler forwards to OpenAI Whisper, returns transcript as JSON
- Audio is never written to disk or Supabase

**Bilingual UI — because both EN and JP staff will use the app:**
- Use `next-intl` with `defaultLocale: 'ja'` (primary market)
- Message files: `messages/en.json`, `messages/ja.json`
- Use middleware (in `proxy.ts` for Next.js 16) for locale detection
- Japanese text: ensure Noto Sans JP is loaded via `next/font/google` for proper CJK rendering in both the app UI and PDF export

**PDF export — Japanese fonts must be embedded:**
- @react-pdf/renderer requires fonts to be explicitly embedded for CJK characters
- Load Noto Sans JP or similar from Google Fonts, embed in the PDF Document component
- Generate PDF client-side (PDFDownloadLink component) to avoid serverless function timeout on large documents

**Dark theme:**
- Use shadcn/ui with `dark` class on `<html>` — the project is dark-only, so don't bother with theme toggling
- Set `darkMode: 'class'` is the default in Tailwind v4 via CSS custom properties

**CI/CD integration branch workflow:**
- PRs to `integration` branch: run `eslint`, `tsc --noEmit`, unit tests via GitHub Actions
- PRs from `integration` → `main`: add Claude Code review action (`anthropics/claude-code-action@v1`)
- Set `ANTHROPIC_API_KEY` as repo secret; set GitHub token `permissions: pull-requests: write`

---

## Version Compatibility

| Package | Compatible With | Notes |
|---------|-----------------|-------|
| next@16.x | react@19.2, typescript@5.1+ | Node.js minimum is now 20.9.0 (LTS). Node.js 18 is dropped. |
| @supabase/supabase-js@2.99.x | @supabase/ssr@0.x | Both must be v2/v0 respectively — do not mix with v1 ssr package |
| tailwindcss@4.x | shadcn CLI v4.0.x | shadcn v4 CLI generates Tailwind v4 compatible CSS. Use `@import "tailwindcss"` not `tailwind.config.js`. |
| zod@4.x | @hookform/resolvers@5.x | Resolvers v5 added Zod v4 support. v4 incompatible with @hookform/resolvers v4 or below. |
| openai@6.x | Node.js 18.x+ | SDK v6 is the current major. Breaking changes from v4→v5→v6 include response format changes. |
| @react-pdf/renderer@4.x | React 18 or 19 | Works in both; renders in a separate reconciler so React version doesn't matter for the PDF output. |
| next-intl@4.x | Next.js 15+ (App Router) | next-intl 4.0 dropped Pages Router support; App Router only. |

---

## Sources

- [Next.js 16 release blog](https://nextjs.org/blog/next-16) — version number, React 19.2, Node.js 20.9+ requirement, proxy.ts, Turbopack stable (HIGH confidence — official source)
- [Next.js 16.1 release blog](https://nextjs.org/blog/next-16-1) — 16.1.6 LTS confirmed February 2026 (HIGH confidence)
- [Supabase @supabase/ssr migration docs](https://supabase.com/docs/guides/troubleshooting/how-to-migrate-from-supabase-auth-helpers-to-ssr-package-5NRunM) — auth-helpers deprecated January 2026 (HIGH confidence — official Supabase docs)
- [Supabase Next.js quickstart](https://supabase.com/docs/guides/getting-started/quickstarts/nextjs) — SSR client setup pattern (HIGH confidence)
- [@supabase/supabase-js npm](https://www.npmjs.com/package/@supabase/supabase-js) — version 2.99.1 confirmed current (HIGH confidence — npm registry)
- [openai npm package](https://www.npmjs.com/package/openai) — version 6.27.0 confirmed current March 2026 (HIGH confidence — npm registry)
- [OpenAI gpt-4o-transcribe/gpt-4o-mini-transcribe announcement](https://openai.com/index/introducing-our-next-generation-audio-models/) — Japanese accuracy improvements, 90% fewer hallucinations than Whisper v2 (HIGH confidence — official OpenAI)
- [Tailwind CSS v4 release](https://tailwindcss.com/blog/tailwindcss-v4) — CSS-first config, version 4.2.1 current (HIGH confidence — official)
- [shadcn/ui Tailwind v4 docs](https://ui.shadcn.com/docs/tailwind-v4) — full v4 + React 19 compatibility confirmed (HIGH confidence — official)
- [shadcn CLI v4 changelog (March 2026)](https://ui.shadcn.com/docs/changelog/2026-03-cli-v4) — CLI v4.0.5 current (HIGH confidence — official)
- [next-intl npm](https://www.npmjs.com/package/next-intl) — version 4.8.3 current (HIGH confidence — npm registry)
- [next-intl docs](https://next-intl.dev/docs/getting-started/app-router) — App Router setup, Server Component support (HIGH confidence — official)
- [@react-pdf/renderer npm](https://www.npmjs.com/package/@react-pdf/renderer) — version 4.3.2 current (HIGH confidence — npm registry)
- [zod v4 release notes](https://zod.dev/v4) — 4.3.6 current, August 2025 GA (HIGH confidence — official)
- [@hookform/resolvers npm](https://www.npmjs.com/package/@hookform/resolvers) — version 5.2.2, Zod v4 support (HIGH confidence — npm registry)
- [OpenAI Whisper audio formats FAQ](https://help.openai.com/en/articles/7031512-audio-api-faq) — 25MB limit, supported formats including webm (MEDIUM confidence — official but accessed via community references)
- [Supabase managing environments](https://supabase.com/docs/guides/deployment/managing-environments) — dev/prod separation pattern (HIGH confidence — official)
- [anthropics/claude-code-action GitHub](https://github.com/anthropics/claude-code-action) — v1 action for GitHub Actions CI (HIGH confidence — official Anthropic)

---
*Stack research for: AI-assisted digital karute app (Next.js + Supabase + OpenAI)*
*Researched: 2026-03-13*
