# Project Research Summary

**Project:** AI-Assisted Digital Karute (Salon Client Records)
**Domain:** AI voice-to-structured-record, salon/spa/aesthetics, Japan market
**Researched:** 2026-03-13
**Confidence:** HIGH (stack and architecture verified against official sources; features verified via Japanese competitor sites and market surveys; pitfalls corroborated by multiple sources)

## Executive Summary

This is an AI-assisted client record-keeping product (karute) for Japanese salons, spas, and aesthetics businesses. The core value proposition is a voice pipeline: staff record the consultation audio, AI transcribes it and extracts structured karute fields, staff review and confirm, and the record is saved. No competitor in the mass-market Japanese salon space offers this as a native feature. The recommended build is Next.js 16 + Supabase + OpenAI (Whisper transcription + GPT-4o extraction), deployed on Vercel, with a dark-themed bilingual (EN/JP) interface. The architecture is straightforward: a Route Handler handles the audio-to-karute pipeline; Server Actions handle all other CRUD; Supabase provides auth, Postgres, and RLS; and the staff model is a single business account with staff profile rows (not separate auth users).

The primary technical risks are in the AI pipeline itself. Whisper hallucinations on silence and background salon noise, GPT fabricating structured fields not present in the transcript, and iOS Safari audio format incompatibility are the three most failure-prone areas. All three have known mitigations that must be built from the start, not retrofitted. A second category of risk is compliance: audio containing client speech sent to OpenAI is personal information under Japan's APPI, and a client consent flow before any recording is legally required. Audio must be discarded immediately after transcription — never persisted in storage.

The recommended approach is to build in strict dependency order: schema and auth first, then the data layer (customer and karute record CRUD), then the audio pipeline end-to-end, then the UI, then exports. The AI pipeline should be working end-to-end before any UI polish investment. Scope discipline is critical — booking, POS, loyalty, marketing, and client-facing portal are all explicitly deferred to v2+. The product wins on AI extraction quality, bilingual design, and UX simplicity; it should not compete with established Japanese salon management platforms on feature breadth in v1.

## Key Findings

### Recommended Stack

The stack is modern, greenfield-optimized, and all versions are confirmed current as of 2026-03-13. Next.js 16.1.6 (LTS) with App Router is the right choice — Turbopack is now stable, React 19.2 is bundled, and Server Actions handle all CRUD cleanly. Tailwind v4 and shadcn/ui v4 are now the defaults for new Next.js 16 projects and are fully compatible. For Supabase, the `@supabase/ssr` package (not the deprecated `auth-helpers`) is required. The OpenAI SDK is at v6 (not v4/v5 as older training data suggests), and `gpt-4o-mini-transcribe` is significantly better than `whisper-1` for Japanese accuracy and costs less per minute. One critical structural constraint: audio uploads must use a Route Handler (`/api/transcribe`), not a Server Action — Server Actions have a default 1MB body limit that audio blobs silently exceed.

**Core technologies:**
- Next.js 16.1.6: Full-stack framework — App Router + Server Actions + Route Handlers for audio pipeline
- Supabase (@supabase/supabase-js ^2.99.1 + @supabase/ssr): Database, auth, storage — RLS enforces per-business data isolation
- OpenAI SDK ^6.27.0: `gpt-4o-mini-transcribe` for Japanese transcription (90% fewer hallucinations than whisper-1); GPT-4o for structured extraction with `zodResponseFormat`
- Tailwind CSS v4 + shadcn/ui v4: Dark-themed UI — CSS-first config, no `tailwind.config.js`
- next-intl ^4.8.3: Bilingual EN/JP — App Router–native, zero client JS for server-rendered strings, `defaultLocale: 'ja'`
- zod ^4.3.6 + react-hook-form ^7.x + @hookform/resolvers ^5.2.2: Schema validation and form management
- @react-pdf/renderer ^4.3.2: PDF export with embedded Noto Sans JP (required for CJK characters)

**Version constraints that matter:**
- Node.js minimum is 20.9.0 — Node 18 is dropped by Next.js 16
- `middleware.ts` is renamed to `proxy.ts` in Next.js 16
- `next lint` command removed in Next.js 16 — run `eslint` directly
- `@hookform/resolvers` must be v5.x for Zod v4 compatibility
- `tailwindcss-animate` is incompatible with Tailwind v4 — use `tw-animate-css`

### Expected Features

The product is entering a market where established players (KaruteKun, LiME, Bireki) offer full-featured salon management suites including booking and POS. This product does not compete on breadth — it competes on the AI voice pipeline, bilingual design, and UX quality. No competitor has native audio recording, AI transcription, or bilingual EN/JP support.

**Must have (table stakes):**
- Customer profile management — name, contact, allergies, notes
- Visit history log — chronological sessions per customer
- Treatment/service record per visit — what was done, products used
- Before/after photo per visit entry — tied to specific session, not floating gallery
- Multi-staff access + role-based permissions — owner and staff tiers
- Search and filter customers — by name and phone
- Offline draft saving — session notes survive connectivity loss
- CSV export — data portability; reduces vendor lock-in anxiety
- Dark-themed bilingual EN/JP UI — non-negotiable for target audience

**Should have (AI differentiators — these are the product's reason to exist):**
- In-app session audio recording — tap to start/stop during consultation
- AI transcription JP + EN — `gpt-4o-mini-transcribe` as default model
- AI structured entry extraction — GPT-4o pulls preferences, treatments, notes from transcript
- Human review step before save — mandatory; staff confirms AI output before karute is written
- AI-suggested field values with confidence indicators

**Add after v1 validation (v1.x):**
- Transcript search — search across past transcripts
- Timeline view — visual evolution of client over time
- Counseling sheet / intake form — digital first-visit questionnaire
- PDF export per client — formatted karute download
- Customizable karute fields — different field sets for hair vs. nail vs. esthetics

**Defer to v2+:**
- Booking/reservation system, POS/payments, loyalty points, marketing campaigns, client-facing portal, AI chat assistant, advanced analytics — all explicitly out of scope

### Architecture Approach

The architecture is a clean Next.js App Router application with a single Supabase project. The audio-to-karute pipeline runs in a Route Handler (`POST /api/transcribe`): audio Blob arrives as FormData, flows synchronously through Whisper and GPT extraction, entries are written to the database, and the audio blob is discarded — it never touches Supabase Storage. All other CRUD (customers, karute records, entries) runs through Server Actions. Auth is handled by `@supabase/ssr` with a middleware layer that refreshes tokens on every request. The staff model uses a single business auth account with `profiles` rows for individual staff — not separate Supabase auth users. RLS policies enforce per-business data isolation.

**Major components:**
1. `app/api/transcribe/route.ts` — Route Handler: receives audio, calls Whisper, calls GPT extraction with `zodResponseFormat`, writes transcript + entries to DB, discards audio
2. `lib/openai/whisper.ts` + `lib/openai/extract.ts` — isolated modules for transcription and extraction (thin Route Handler, testable concerns)
3. `lib/supabase/client.ts` + `lib/supabase/server.ts` — required separate browser/server clients via `@supabase/ssr`
4. `actions/` — Server Actions for all customer and karute CRUD
5. `components/recording/AudioRecorder.tsx` + `useAudioRecorder.ts` — MediaRecorder hook with format negotiation (`isTypeSupported()`)
6. `proxy.ts` (Next.js 16 middleware) — Supabase token refresh on every request

**Build order dictated by dependencies:** schema + auth → data layer (CRUD) → audio pipeline end-to-end → UI → exports

### Critical Pitfalls

1. **iOS Safari audio format incompatibility** — Safari records `audio/mp4`, Chrome records `audio/webm`. Never hardcode format; use `MediaRecorder.isTypeSupported()` with priority list; normalize MIME type by stripping codec parameters before comparison. Test on real iPhone Safari before any release.

2. **Whisper hallucinations (silence, noise, short utterances)** — Set `temperature=0`; set `language="ja"` explicitly; provide a domain vocabulary context prompt with salon product names; always show raw transcript to staff before extraction auto-populates fields. Never silently auto-save.

3. **GPT extraction fabricating fields not in the transcript** — Use Structured Outputs with `strict: true` (not JSON mode); include a system prompt instruction to return `null` for absent fields rather than inferring; include a `source_text` field requiring verbatim transcript quote per extracted value; flag empty `source_text` for mandatory human review.

4. **APPI (Japan privacy law) violation from audio processing** — Audio containing client speech sent to OpenAI is personal information under APPI. Client consent notice is legally required before any recording. Opt out of OpenAI training data retention. Delete audio immediately after Whisper transcript is received — never persist in storage. This is an architectural commitment, not a feature to add later.

5. **Supabase service role key exposed in client bundle** — Never use the service role key in any file that may be bundled for the client. Enforce by using `SUPABASE_SERVICE_ROLE_KEY` (no `NEXT_PUBLIC_` prefix) and adding a CI grep check.

## Implications for Roadmap

Based on the dependency graph in FEATURES.md and the build order dictated by ARCHITECTURE.md, six phases are suggested:

### Phase 1: Foundation — Schema, Auth, and i18n
**Rationale:** Everything else depends on this. Database schema, RLS policies, Supabase client setup, auth middleware, and i18n configuration must exist before any UI or pipeline work. Doing i18n from day one (not as a retrofit) is a specific pitfall prevention measure.
**Delivers:** Working authenticated session with staff profile model; Supabase schema with RLS; next-intl configured with `defaultLocale: 'ja'`; ESLint with i18n string lint rule; separate dev/prod Supabase projects; `proxy.ts` middleware; two Supabase client utilities (browser + server)
**Addresses:** Customer profile management (schema), multi-staff access (profiles table)
**Avoids:** Pitfall 4 (APPI — consent flow scaffolded here), Pitfall 14 (service role key), Pitfall 7 (RLS auth.uid caching), Pitfall 13 (i18n hardcoding debt)

### Phase 2: Customer and Karute Data Layer
**Rationale:** The AI pipeline and the recording UI both need customer records and karute record stubs to attach data to. Build the data layer before the pipeline that writes to it.
**Delivers:** Customer profile CRUD (create, read, update, search/filter); visit history log; treatment record per visit (structured fields + free text); before/after photo upload per visit entry; CSV export; Server Actions for all mutations
**Addresses:** Customer profile management, visit history log, treatment records, photo storage, search and filter, CSV export
**Avoids:** Pitfall 8 (staff attribution — write `staff_id` at server level in Server Actions)

### Phase 3: Audio Recording Component
**Rationale:** Audio recording is the root of the AI pipeline. Build and validate it in isolation before connecting to Whisper — this is where iOS Safari format compatibility must be proven.
**Delivers:** In-app audio recorder with start/stop UI; `useAudioRecorder` hook with `isTypeSupported()` format negotiation; client-visible consent notice before first recording; recording duration timer (client-side, not metadata-based); permission denied recovery flow; "discard and re-record" option
**Addresses:** Session audio recording (core AI pipeline input)
**Avoids:** Pitfall 1 (iOS Safari format), Pitfall 6 (WebM duration metadata), Pitfall 12 (permission denied recovery)
**Research flag:** No additional research needed — browser MediaRecorder API is stable and well-documented.

### Phase 4: AI Transcription and Extraction Pipeline
**Rationale:** This is the core value delivery. Build the Route Handler with Whisper + GPT extraction end-to-end, then build the human review UI. Get this working with real salon audio samples before any UI polish.
**Delivers:** `POST /api/transcribe` Route Handler; Whisper integration with `gpt-4o-mini-transcribe`, `language="ja"`, `temperature=0`, domain vocabulary prompt; GPT structured extraction with `zodResponseFormat`, `strict: true`, `source_text` field, null-for-absent-fields instruction; human review screen (AI suggestions + transcript excerpts side-by-side); async processing status (pending/transcribed/extracted) with Supabase realtime polling
**Addresses:** AI transcription, AI structured extraction, human review before save, AI-suggested field values with confidence indicators
**Avoids:** Pitfall 2 (Whisper hallucinations), Pitfall 3 (GPT fabrication), Pitfall 9 (code-switching product names), Pitfall 10 (synchronous pipeline UX stall)
**Research flag:** This phase likely benefits from `/gsd:research-phase` to verify: (1) current `gpt-4o-mini-transcribe` API parameters and latency characteristics; (2) OpenAI Structured Outputs `zodResponseFormat` API with latest SDK v6; (3) Supabase realtime subscription pattern for status polling.

### Phase 5: UI — Karute Views and Staff Experience
**Rationale:** UI consumes the pipeline and data layer built in Phases 1-4. Build UI after the pipeline is proven correct — not before.
**Delivers:** Customer list with search/filter; customer detail page with karute timeline; session recording view (recorder + review flow integrated); staff switcher with server-persisted active staff; dark-themed bilingual UI with Noto Sans JP; `<html lang="ja">` set per locale; all UI strings in next-intl translation files; offline draft saving with retry on reconnect
**Addresses:** Dark-themed bilingual EN/JP UI, timeline view prep, staff switching UX, offline resilience
**Avoids:** Pitfall 5 (wrong lang attribute / Chinese glyphs), Pitfall 8 (staff switching attribution), Pitfall 11 (dark theme Japanese readability — 16px min, 1.7 line-height), Pitfall 13 (hardcoded strings)
**Research flag:** Standard UI patterns — no additional research needed.

### Phase 6: Exports and v1.x Features
**Rationale:** PDF export and v1.x features (transcript search, intake form, customizable fields) are independent of the core pipeline and can be added after the core loop is validated with real users.
**Delivers:** PDF export per client (Noto Sans JP embedded via @react-pdf/renderer); transcript search (full-text search of transcript corpus per customer); counseling sheet / intake form (first-visit questionnaire); customizable karute fields (add/remove/rename per business type)
**Addresses:** PDF export, transcript search, counseling sheet, customizable fields
**Avoids:** Pitfall on PDF CJK font rendering (embed Noto Sans JP explicitly)
**Research flag:** No additional research needed for PDF — @react-pdf/renderer with embedded Japanese fonts is well-documented.

### Phase Ordering Rationale

- Schema and auth must come first because every other component depends on authenticated data access and RLS-protected tables.
- i18n must be configured in Phase 1, not Phase 5 — retrofitting translation keys across a completed UI is a known pitfall with high correction cost.
- Data layer (Phase 2) precedes the pipeline (Phase 4) because the transcribe Route Handler needs a `karute_id` to write entries against.
- Audio recording (Phase 3) is isolated from the pipeline (Phase 4) so that format compatibility on iOS Safari can be proven before Whisper integration is added.
- UI (Phase 5) is built after the pipeline because the review flow UI is tightly coupled to extraction output structure — building it before extraction is defined wastes effort.
- The APPI consent flow scaffolding appears in Phase 1 even though audio recording is Phase 3 — the legal requirement means the consent architecture should be designed upfront, not added as a last step.

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 4 (AI Pipeline):** Verify current `gpt-4o-mini-transcribe` API parameters (prompt, temperature, language fields) and latency benchmarks for 2-minute Japanese audio; confirm `zodResponseFormat` API surface in openai SDK v6; confirm Supabase realtime channel subscription pattern for status polling updates.

Phases with standard patterns (skip research-phase):
- **Phase 1 (Foundation):** Well-documented — official Supabase SSR + Next.js 16 quickstart covers auth setup; next-intl App Router docs are comprehensive.
- **Phase 2 (Data Layer):** Standard CRUD via Server Actions — no novel patterns.
- **Phase 3 (Audio Recording):** MDN MediaRecorder API is stable and well-documented; browser support matrix is known.
- **Phase 5 (UI):** shadcn/ui + next-intl patterns are standard.
- **Phase 6 (Exports):** @react-pdf/renderer CJK font embedding is documented; transcript search is standard Postgres full-text.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All versions verified via npm registry and official release blogs as of 2026-03-13. Breaking changes (proxy.ts, no next lint, tailwind v4 CSS-first, openai v6) are documented. |
| Features | MEDIUM-HIGH | Japanese competitor feature sets verified via product sites and ASPIC Japan market surveys. AI competitor (ai-calte.com) feature depth is unclear — product page is marketing-focused. |
| Architecture | HIGH | Core patterns (Route Handler for audio, two Supabase clients, Server Actions for CRUD) verified against official Supabase and Next.js docs. Server Action 1MB limit verified via GitHub community discussion corroborated by Next.js config docs. |
| Pitfalls | MEDIUM | Browser audio pitfalls verified via MDN and addpipe.com cross-browser analysis. Whisper hallucination patterns verified via OpenAI community and GitHub discussions. APPI legal risk verified via official PPC warning and compliance guides. Salon-specific UX pitfalls are inferred from general pattern — no direct post-mortems available. |

**Overall confidence:** HIGH

### Gaps to Address

- **ai-calte.com extraction depth:** The closest competitor's AI extraction capability is unknown. Its product page is vague on whether it does structured field extraction or just transcription + summary. Validate during user research — knowing what it does poorly informs what this product must do well.
- **OpenAI training data opt-out mechanism:** The APPI analysis recommends an `X-OpenAI-Opt-Out: training=true` header, but the current mechanism (as of March 2026) may be organization-level account settings rather than a per-request header. Verify during Phase 4 implementation before going live.
- **Whisper VAD tooling:** The pitfall research recommends silence trimming before sending audio to Whisper, but does not specify a specific JS VAD library. Evaluate during Phase 3 — options include `@ricky0123/vad-web` (ONNX-based, browser-native) vs. server-side trimming via ffmpeg in the Route Handler.
- **Offline draft saving approach:** The feature is required (table stakes) but the implementation pattern was not researched in depth. Evaluate during Phase 5 — options include IndexedDB for local draft persistence, Supabase optimistic writes, or a simple localStorage draft with reconnect sync.

## Sources

### Primary (HIGH confidence)
- Next.js 16 + 16.1 release blogs (nextjs.org) — version, React 19.2, Node.js 20.9+, proxy.ts, Turbopack, removed next lint
- Supabase @supabase/ssr migration docs (supabase.com) — auth-helpers deprecated January 2026; SSR client setup
- Supabase Next.js App Router auth architecture (supabase.com) — two-client pattern, middleware token refresh
- OpenAI gpt-4o-transcribe announcement (openai.com) — Japanese accuracy improvements, 90% fewer hallucinations vs Whisper v2
- OpenAI Structured Outputs developer guide — zodResponseFormat, strict mode
- Tailwind CSS v4 release blog (tailwindcss.com) — CSS-first config
- shadcn/ui Tailwind v4 docs + CLI v4 changelog (ui.shadcn.com) — React 19 + Tailwind v4 compatibility
- npm registry — version pins for all packages verified 2026-03-13
- Japan APPI compliance guide + PPC June 2023 AI data warning — legal risk assessment
- KaruteKun, Bireki, LiME product pages — competitor feature baseline
- ASPIC Japan karute comparison articles — market-wide feature survey

### Secondary (MEDIUM confidence)
- OpenAI Community — Whisper hallucination patterns and Japanese transcription issues
- OpenAI Whisper GitHub discussions — VAD for Japanese accuracy, best prompt for Japanese
- addpipe.com — MediaRecorder cross-browser format analysis
- ASPIC Japan AI/voice karute services — 12-product survey of AI transcription tools in Japan
- catjam.fi — Next.js + Supabase production lessons (RLS performance, server client patterns)
- AQ Works / heistak.github.io — Japanese typography rules and CJK glyph rendering

### Tertiary (LOW confidence)
- ai-calte.com — closest AI competitor; feature depth unclear from product page
- Community blog posts on Next.js App Router project structure — pattern consistent with official conventions but community-sourced
- Salon-specific UX failure patterns — inferred from general SaaS patterns; no direct post-mortems available

---
*Research completed: 2026-03-13*
*Ready for roadmap: yes*
