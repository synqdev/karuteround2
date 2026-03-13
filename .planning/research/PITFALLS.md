# Pitfalls Research

**Domain:** AI-assisted digital karute (client record-keeping) for Japanese service businesses
**Researched:** 2026-03-13
**Confidence:** MEDIUM — browser audio and Whisper findings verified via MDN, OpenAI community, and official docs; extraction/LLM findings from multiple corroborating sources; APPI/privacy from official legal sources; some salon-domain specifics are LOW confidence (no direct post-mortems available)

---

## Critical Pitfalls

### Pitfall 1: iOS Safari Audio Format Incompatibility Breaks Transcription

**What goes wrong:**
Safari on iPhone records in `audio/mp4` (AAC codec) while Chrome records in `audio/webm;codecs=opus`. If the backend accepts only one format, or the format check uses exact string matching (e.g., `audio/webm` fails to match `audio/webm;codecs=opus`), the Whisper API call receives an unsupported MIME type and returns an error. Salon staff using iPhones — which is the norm in Japan — hit a silent failure or a confusing error on their first recording.

**Why it happens:**
Developers test on desktop Chrome, never test on iPhone Safari. The format negotiation step is skipped or hardcoded. MediaRecorder format support varies significantly between browsers and is not standardized.

**How to avoid:**
- Call `MediaRecorder.isTypeSupported()` with a priority-ordered list at runtime, never hardcode a format
- Accept both `audio/mp4` and `audio/webm` at the server (Whisper API accepts both)
- Normalize MIME type matching to strip codec parameters before comparison: `mimeType.split(';')[0]`
- Test the full recording-to-transcription pipeline on actual iPhone Safari before any release, not just Chrome

**Warning signs:**
- "Recording works but transcription always fails" reports from iPhone users
- Error logs showing Whisper API 400 errors with unsupported file type messages
- QA only runs on Chrome/desktop

**Phase to address:** Audio recording MVP phase (first working recording feature)

---

### Pitfall 2: Whisper Hallucinating During Silence, Background Noise, or Short Utterances

**What goes wrong:**
Whisper generates plausible-sounding but entirely fabricated Japanese text when audio contains long silences, background salon noise (hair dryers, music, water), or incomplete sentences. A common hallucination is outputting stock phrases like "ご視聴ありがとうございました" (thank you for watching) even when the speaker said something completely different. These hallucinations enter the karute as if they were real client notes.

**Why it happens:**
Whisper was trained on diverse audio including videos with standard closing phrases. When audio is ambiguous or near-silent, it defaults to statistically probable completions from training. The API with default temperature settings allows this without warning.

**How to avoid:**
- Set `temperature=0` in the Whisper API call to force deterministic decoding and reduce hallucination loops
- Use Voice Activity Detection (VAD) to trim silence before sending audio to Whisper — the MediaRecorder API does not do this automatically
- Set `language="ja"` explicitly rather than relying on auto-detection; Japanese mixed with product names/English requires `language="ja"` with a context prompt
- Provide a context prompt parameter with domain vocabulary (treatment names, product brands used in salon) to ground the model
- Always show the raw transcript to the staff member before committing extracted fields; do not silently auto-save

**Warning signs:**
- Transcript contains "ありがとうございました" or other stock phrases not said during recording
- Transcript is identical across different recordings
- Short recordings (under 5 seconds) produce unrelated text

**Phase to address:** Transcription integration phase; also revisit in QA/testing phase with real salon audio samples

---

### Pitfall 3: GPT Extraction Fabricating Structured Fields Not in the Transcript

**What goes wrong:**
The GPT extraction step confidently fills in structured karute fields (product used, treatment type, next visit date, skin condition) with plausible values that were never spoken. Because the output is JSON that looks clean, developers assume it is correct. Salon staff may not catch subtle fabrications (e.g., "Shiseido HAKU serum" instead of the product that was actually named) especially when reviewing quickly.

**Why it happens:**
LLMs are optimized to produce complete, coherent outputs. When a schema field has no corresponding content in the transcript, the model infers a plausible value rather than returning null. Using JSON Mode (deprecated legacy mode) only enforces valid JSON syntax, not schema adherence or content fidelity. Structured Outputs with `strict: true` enforces schema shape but still allows hallucinated field content.

**How to avoid:**
- Use OpenAI Structured Outputs with `strict: true` and explicit JSON schema — never plain JSON mode
- Include a system prompt instruction: "If information for a field is not present in the transcript, return null. Do not infer or guess."
- Mark extracted fields with a confidence indicator (present in transcript / inferred) so staff can review uncertain fields
- Do not auto-populate required fields silently — require staff confirmation for any null-replaced values
- Include a `source_text` field in your extraction schema asking the model to quote the verbatim transcript excerpt that supports each value; empty `source_text` = flag for human review

**Warning signs:**
- Extracted product names that don't match the salon's actual inventory
- Fields populated for treatments that weren't mentioned
- Staff report karute data "looks right but isn't"
- All extractions return 100% completion with no null fields

**Phase to address:** GPT extraction pipeline phase; extraction schema design is load-bearing and hard to retrofit

---

### Pitfall 4: Japanese Personal Information Compliance (APPI) Violations from Audio Processing

**What goes wrong:**
Recording client voice and processing it through OpenAI's API constitutes processing of personal information under Japan's Act on the Protection of Personal Information (APPI). Sending audio containing client speech to a third-party AI provider (OpenAI) without a lawful basis and disclosure violates APPI. Japan's Personal Information Protection Commission explicitly warned in June 2023 that inputting personal data into AI systems may violate the law if data is retained or reused for training. Post-2025 APPI amendments add administrative fines analogous to GDPR-scale penalties.

**Why it happens:**
Developers treat audio-to-text as a technical feature, not a data processing activity. APPI disclosure requirements (notifying individuals of processing purpose, third-party provision) are skipped during MVP to "add later."

**How to avoid:**
- Obtain explicit client consent before any recording begins — a visible, audible notice before recording starts ("This conversation will be transcribed to create your care record")
- Configure OpenAI API to opt out of data training (`X-OpenAI-Opt-Out: training=true` header, or use the organization-level opt-out in platform settings)
- Implement the "audio discarded after transcription" commitment technically: delete the audio blob immediately after receiving the Whisper transcript; do not store audio in Supabase storage
- Document the processing purpose in a privacy notice accessible to clients
- Treat transcripts as personal information (they contain client health/beauty data) and apply appropriate RLS controls

**Warning signs:**
- No consent flow exists before recording
- Audio files persisting in storage buckets after transcription completes
- No privacy policy mentioning AI transcription
- No opt-out mechanism for clients

**Phase to address:** Foundation/authentication phase — consent flow must be built before recording goes live, not added later

---

### Pitfall 5: Wrong `lang` Attribute Causes Chinese Glyphs in Japanese UI

**What goes wrong:**
Browser font rendering for CJK text defaults to Simplified Chinese glyphs when no `lang` attribute is set. Japanese UI text, staff-entered notes, and AI-extracted content rendered without `<html lang="ja">` (or dynamic per-element `lang` attributes) displays using Chinese glyph variants, which are visually distinct and look unprofessional to Japanese users. This is especially visible with characters like 骨, 直, 必, where the Japanese and Chinese forms differ noticeably.

**Why it happens:**
Developers building in English-primary environments never see the problem. The default Next.js HTML template does not set `lang="ja"`. Dynamic content (transcript text, extracted notes) rendered inside a div may inherit the wrong `lang` from an ancestor if switching between EN/JP views is not carefully managed.

**How to avoid:**
- Set `<html lang="ja">` for the Japanese locale in Next.js `layout.tsx`; set `<html lang="en">` for English locale
- For dynamically rendered Japanese content inside English-locale views, wrap with `<span lang="ja">`
- Use a Japanese-native font stack that loads Japanese glyphs explicitly (e.g., "Noto Sans JP", "Hiragino Kaku Gothic ProN") rather than relying on system CJK fallback
- Test UI on a machine without Japanese system fonts installed to catch fallback failures

**Warning signs:**
- Kanji rendering looks "slightly off" to native Japanese speakers
- Characters appear in Chinese simplified style
- No `lang` attribute visible in rendered HTML

**Phase to address:** UI foundation / design system phase

---

## Moderate Pitfalls

### Pitfall 6: MediaRecorder Produces WebM Without Duration Metadata

**What goes wrong:**
Chrome's MediaRecorder produces `.webm` files that omit the duration metadata field. If the app displays recording duration, calculates expected transcript length, or enforces maximum recording time based on file metadata, it will get `NaN` or `0` instead of the actual duration.

**How to avoid:**
- Calculate recording duration client-side using a JavaScript timer running alongside the recorder, independent of file metadata
- Do not rely on audio file headers for duration display — track start/end timestamps in application state

**Phase to address:** Audio recording phase

---

### Pitfall 7: Supabase RLS Performance Degradation on Client Record Queries

**What goes wrong:**
Calling `auth.uid()` inside RLS policies causes the function to be re-evaluated for every row in a query result set. On a karute list with 200+ records per staff member, this creates a hidden n+1 pattern at the database level, degrading query performance proportionally with record count.

**How to avoid:**
- Wrap `auth.uid()` in a `(select auth.uid())` subquery in RLS policies to cache the result across the query
- Route all write mutations (create/update karute entries) through server-side API routes using the service role key, not client-side RLS
- Use RLS only for read access protection, not as the sole write authorization mechanism

**Phase to address:** Database schema / auth phase; must be applied during initial RLS policy authoring

---

### Pitfall 8: Staff Switching Without Audit Trail Creates Attribution Errors

**What goes wrong:**
The single-business-login with staff-switching model means multiple staff members share one authenticated session. If staff switching is tracked only in client-side state (React context or localStorage), a page refresh loses the current staff context. Karute entries then get attributed to the wrong staff member, or no staff member, corrupting the record audit trail.

**Why it happens:**
"Staff switching" feels like a UI convenience feature and gets implemented as local state rather than a persisted server-side record. Attribution is an afterthought.

**How to avoid:**
- Persist the active staff member selection server-side (e.g., in the Supabase session metadata or a `active_staff_id` column in the business session table)
- Write `staff_id` to every karute entry at the server level, never trust client-supplied staff identity
- Display the currently active staff member prominently and persistently in the UI to prevent accidental mis-attribution

**Warning signs:**
- Karute entries with null `staff_id`
- Staff attribution resets on page refresh
- No server-side record of which staff performed which action

**Phase to address:** Authentication / staff management phase

---

### Pitfall 9: Whisper Code-Switching Translates English Product Names Into Japanese

**What goes wrong:**
Japanese salon professionals commonly use English brand names and product names (e.g., "KERASTASE", "L'Oreal", "Schwarzkopf") mixed into Japanese speech. Without explicit language configuration, Whisper may transliterate or incorrectly translate these English words into katakana or Japanese approximations, corrupting product name data that needs exact matching for inventory or retail tracking.

**How to avoid:**
- Set `language="ja"` explicitly (do not use auto-detect) to establish primary language
- Provide a Whisper `prompt` parameter seeded with the salon's actual product vocabulary: "ケラスターゼ、ロレアル、シュワルツコフ、KERASTASE, L'Oreal..." — this seeds the decoder with expected vocabulary
- In the GPT extraction step, maintain a domain vocabulary list of product names; compare extracted product names against it and flag discrepancies

**Warning signs:**
- Product names in transcripts appear as katakana approximations that don't match any known product
- English brand names replaced with generic Japanese equivalents

**Phase to address:** Transcription integration phase

---

### Pitfall 10: Transcript-to-Extraction Latency Causes UX Stall

**What goes wrong:**
The pipeline of record → upload audio → Whisper transcription → GPT extraction → display takes 8–25 seconds for a typical 2-minute salon consultation. If implemented synchronously as a loading spinner, staff stand and wait before they can do anything. This is especially problematic at the end of a client visit when the next client is waiting.

**How to avoid:**
- Process transcription and extraction asynchronously; show "processing" status and allow staff to continue other tasks or switch clients
- Consider a two-step UI: show raw transcript immediately after Whisper returns (typically 3–8 seconds), then display extracted fields once GPT extraction completes
- Cache in-progress extractions in Supabase with status columns (`pending` / `transcribed` / `extracted`) so the UI can poll or subscribe for updates
- Set user expectations: show an estimated completion time or progress indication

**Phase to address:** Core recording-to-karute pipeline phase

---

## Minor Pitfalls

### Pitfall 11: Dark Theme Readability Failure with Japanese Text

**What goes wrong:**
Japanese characters at small sizes on dark backgrounds degrade readability faster than Latin text because stroke density is higher. A font size that reads clearly for ASCII becomes illegible for kanji at the same size on dark backgrounds. Staff using the app under salon lighting (often warm, indirect lighting) encounter eye strain.

**How to avoid:**
- Use minimum 14px (ideally 16px) for any body Japanese text
- Set line-height to at least 1.7 for Japanese body text (CJK standard) vs 1.4-1.5 for Latin
- Choose text color with high contrast ratio (minimum 4.5:1) on dark backgrounds
- Test UI with Japanese content under actual salon lighting conditions

**Phase to address:** UI design system phase

---

### Pitfall 12: Audio Permission Denied on First Load Has No Recovery Path

**What goes wrong:**
If a staff member denies microphone permission when first prompted, the browser blocks future permission requests for the same origin. The app shows an error but provides no guidance on how to re-enable permissions. Staff assume the app is broken and abandon the recording feature.

**How to avoid:**
- Display browser-specific instructions for re-enabling microphone permission (different steps for Chrome, Safari, Firefox on iOS/Android/desktop)
- Check `navigator.permissions.query({ name: 'microphone' })` before attempting recording and show proactive instructions if state is `denied`
- Do not suppress or swallow the permission error — surface it immediately with an actionable recovery message

**Phase to address:** Audio recording phase

---

### Pitfall 13: i18n String Hardcoding Creates Untranslatable UI Debt

**What goes wrong:**
During rapid development, UI strings get hardcoded in English directly in JSX. When the Japanese locale is wired up, dozens of hardcoded strings are missed and the JP interface shows English text intermixed, looking unprofessional to Japanese users.

**How to avoid:**
- Configure next-intl from day one of the project, before writing any UI components
- Enforce a lint rule or code review policy: no string literals in JSX (use `t('key')` exclusively)
- Use a translation management spreadsheet from the start — add both EN and JP strings simultaneously during development

**Phase to address:** Project foundation phase (before first UI component is built)

---

### Pitfall 14: Supabase Service Role Key Exposed in Client Bundle

**What goes wrong:**
The Supabase service role key bypasses all RLS. If it ends up in Next.js client-side code (used in a component, called from a non-`server` file), it is exposed in the browser and gives anyone full database access. This is a complete data breach risk given the sensitive nature of client health records.

**How to avoid:**
- The service role key must only be used in Next.js Server Actions, Route Handlers, and middleware — never in any file that may be bundled for the client
- Use `SUPABASE_SERVICE_ROLE_KEY` (no `NEXT_PUBLIC_` prefix) to prevent it from being included in client bundles
- Audit with `NEXT_PUBLIC_` prefix grep in CI to ensure no sensitive keys are accidentally exposed

**Warning signs:**
- Service role key visible in browser network tab requests
- Service role key in a file that imports React components or client hooks

**Phase to address:** Foundation / authentication phase

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| JSON Mode instead of Structured Outputs + strict schema | Faster GPT integration | Inconsistent field shapes, fragile parsing, hallucinated fields not caught | Never — strict mode is the same effort |
| RLS disabled during development | Faster local iteration | Forgotten before launch; data exposed | Only if enabled via migration before any staging/production deployment |
| Hardcoded language strings in JSX | Faster MVP builds | Full UI translation pass required; strings missed | Never — i18n setup is 1-2 hours up front |
| Single Supabase project for dev/staging/prod | Simplifies setup | Production data at risk from dev migrations; untestable schema changes | Never for production client data |
| Store audio after transcription "just in case" | Easier debugging | APPI violation; storage costs; scope creep on data retention | Never — privacy commitment must be architectural |

---

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Whisper API | Using auto language detection with Japanese+English mixed audio | Set `language="ja"` explicitly; provide a domain vocabulary prompt |
| Whisper API | Sending audio without trimming silence | VAD-trim or at minimum enforce minimum 3-second recording before sending |
| Whisper API | Treating transcript as ground truth without display to user | Always show transcript to staff before extracting/saving |
| OpenAI Structured Outputs | Using `response_format: { type: "json_object" }` (JSON mode) | Use `response_format: { type: "json_schema", json_schema: {...}, strict: true }` |
| MediaRecorder | Hardcoding `mimeType: "audio/webm"` | Use `isTypeSupported()` with priority list; handle `audio/mp4` for Safari |
| Supabase Storage | Storing audio files permanently for debugging | Delete audio from storage immediately after receiving Whisper transcript |
| Supabase RLS | Calling `auth.uid()` directly in policy | Wrap in `(select auth.uid())` to cache per-query |

---

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Synchronous Whisper + GPT pipeline | UI locked for 10–25 seconds after recording stops | Async processing with status polling via Supabase realtime | Every recording; worse on slower networks |
| RLS auth.uid() evaluated per row | Karute list queries slow proportionally with record count | Cache with `(select auth.uid())` in policy | ~100+ karute records per business |
| Loading all karute records client-side | Initial page load slow; memory grows | Server-side pagination; load 20 records at a time | ~500+ records |
| Re-fetching full karute list after each extraction update | Multiple network requests on busy days | Supabase realtime subscription to update individual records in-place | Multiple simultaneous staff recordings |

---

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| Supabase service role key in client code | Full database exposed; client health records readable by anyone | Never use in files with `'use client'` or React imports; no `NEXT_PUBLIC_` prefix |
| No RLS on karute table | Any authenticated user can read all businesses' records | Enable RLS on all tables; restrict by `business_id` |
| Staff switching tracked client-side only | Records attributed to wrong staff; audit trail corrupted | Persist active staff server-side; write staff_id in server action |
| Audio sent to OpenAI without APPI disclosure | Regulatory violation; trust damage | Client consent UI before recording; opt-out of OpenAI training |
| No input validation on transcript before GPT extraction | Prompt injection via spoken transcript content | Sanitize or escape user-generated text used as part of GPT prompt context |

---

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Recording starts immediately without clear visual indicator | Staff don't know if recording is active; may speak before or after the active window | Large, unmistakable recording indicator (red dot + timer) in consistent position |
| No way to discard a bad recording and re-record | Staff stuck with a failed/noise-only recording | Always provide "discard and re-record" option before submission |
| Showing AI-extracted fields without indicating they're AI-generated | Staff trust incorrect data; karute quality degrades silently | Label all AI-extracted fields; show source transcript excerpt inline |
| Switching staff context not visible mid-session | Notes attributed to wrong staff member | Show active staff name prominently in header throughout session; require tap to confirm before recording |
| Long text in Japanese fields truncated without ellipsis | Condition notes appear cut off | Expandable text fields for condition/memo fields; never hard truncate |

---

## "Looks Done But Isn't" Checklist

- [ ] **Audio recording:** Works on Chrome desktop but not tested on iPhone Safari — verify `audio/mp4` path end-to-end
- [ ] **Transcription:** Whisper returns text but hallucinations not checked — verify with salon-domain audio containing silence and background noise
- [ ] **GPT extraction:** All fields return values but source transcript review is missing — verify null fields are returned, not inferred
- [ ] **Staff switching:** UI shows staff name but `staff_id` not persisted after page refresh — verify server-side persistence
- [ ] **Audio deletion:** Code calls delete after transcription but deletion error is swallowed — verify audio is actually removed from Supabase storage
- [ ] **Japanese rendering:** Japanese text displays correctly on a machine without system Japanese fonts — verify font stack fallback
- [ ] **Consent flow:** Recording button is available but no consent notice precedes first recording — verify client-facing consent UI exists
- [ ] **RLS:** Development worked without RLS; enabled in production but not tested — run unauthorized-access test against staging

---

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| iOS Safari audio incompatibility discovered post-launch | MEDIUM | Add format negotiation; deploy server-side MIME type normalization; no data migration needed |
| Whisper hallucinations in existing karute records | HIGH | Manual audit of historic records; no automated correction; retranscription impossible (audio deleted) |
| GPT-fabricated karute fields in production | HIGH | No automated recovery; requires staff to manually review and correct all affected records; implement source_text verification going forward |
| APPI violation discovered (audio retained) | HIGH | Immediate deletion of retained audio; legal review; client notification may be required under APPI breach notification rules |
| Service role key exposed in client bundle | CRITICAL | Rotate key immediately; audit all database access logs; re-deploy with correct key handling; assume data breach |
| RLS disabled in production | CRITICAL | Enable RLS immediately; audit access logs for unauthorized reads; notify affected business owners |

---

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| iOS Safari audio format incompatibility | Audio recording MVP | Test on real iPhone Safari before phase sign-off |
| Whisper hallucinations | Transcription integration | Test with 5+ samples including silence, noise, short utterances |
| GPT extraction fabrication | GPT extraction pipeline | Verify null fields returned for unspoken content; source_text field populated |
| APPI / privacy compliance | Foundation / auth phase | Consent flow present; audio deletion confirmed in storage audit |
| Wrong lang attribute / Chinese glyphs | UI design system | Review on machine without Japanese system fonts |
| RLS performance (auth.uid caching) | Database schema phase | Benchmark karute list query with 200+ records under RLS |
| Staff attribution lost on refresh | Staff management phase | Refresh page mid-session; verify staff_id persists and karute entry is attributed correctly |
| Code-switching product name translation | Transcription integration | Test with recordings containing Japanese speech + English brand names |
| Service role key in client bundle | Foundation phase | CI grep check for service role key reference in client files |
| i18n hardcoded strings | Foundation phase | Enable missing-key warnings in next-intl; zero missing keys before any phase ships |

---

## Sources

- MDN Web Docs — MediaStream Recording API: https://developer.mozilla.org/en-US/docs/Web/API/MediaStream_Recording_API
- MDN Web Docs — MediaRecorder: https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder
- addpipe.com — MediaRecorder API cross-browser analysis: https://blog.addpipe.com/mediarecorder-api/
- OpenAI Community — Whisper hallucination patterns: https://community.openai.com/t/whisper-hallucination-how-to-recognize-and-solve/218307
- OpenAI Community — Whisper Japanese transcription issues: https://github.com/openai/whisper/discussions/2377
- OpenAI Whisper — VAD for Japanese accuracy: https://github.com/openai/whisper/discussions/397
- OpenAI Whisper — Best prompt for Japanese: https://github.com/openai/whisper/discussions/2151
- Calm-Whisper paper — Hallucination reduction via decoder head fine-tuning: https://arxiv.org/html/2505.12969v1
- catjam.fi — Next.js + Supabase production lessons: https://catjam.fi/articles/next-supabase-what-do-differently
- Supabase Docs — Storage file limits: https://supabase.com/docs/guides/storage/uploads/file-limits
- Supabase Docs — Realtime troubleshooting: https://supabase.com/docs/guides/realtime/troubleshooting
- AQ Works — Japanese typography rules: https://www.aqworks.com/blog/perfect-japanese-typography
- heistak.github.io — Your code displays Japanese wrong: https://heistak.github.io/your-code-displays-japanese-wrong/
- Japan APPI 2026 compliance guide: https://secureprivacy.ai/blog/appi-japan-privacy-compliance
- PPC warning on AI personal data processing (June 2023): https://www.reedsmith.com/our-insights/blogs/viewpoints/102l2yi/japan-in-focus-data-protection-and-ai-in-japan/
- Simon Willison — Structured data extraction with LLM schemas: https://simonwillison.net/2025/Feb/28/llm-schemas/
- OpenAI Structured Outputs developer guide: https://www.digitalapplied.com/blog/openai-structured-outputs-complete-guide
- buildwithmatija.com — iPhone Safari MediaRecorder transcription: https://www.buildwithmatija.com/blog/iphone-safari-mediarecorder-audio-recording-transcription

---
*Pitfalls research for: AI-assisted digital karute for Japanese service businesses (Next.js + Supabase + Whisper + GPT)*
*Researched: 2026-03-13*
