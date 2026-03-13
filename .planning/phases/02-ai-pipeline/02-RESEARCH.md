# Phase 2: AI Pipeline - Research

**Researched:** 2026-03-13
**Domain:** OpenAI Whisper transcription, GPT structured extraction, Next.js API routes, multilingual AI outputs
**Confidence:** HIGH

## Summary

Phase 2 wires a recorded audio blob through two OpenAI API calls (Whisper transcription, then GPT extraction + summary) and presents the results on a human review screen before saving. The key technical challenges are: passing a Blob through a Next.js Route Handler to OpenAI's Whisper API without ever touching the filesystem or Supabase Storage; using GPT structured outputs (Zod + `zodResponseFormat`) to guarantee schema-valid extraction results; and threading the active locale (EN/JP) through the prompt so AI text output honors the language toggle.

The recommended transcription model is `gpt-4o-mini-transcribe` — it is newer than `whisper-1`, has lower word error rates across benchmarks including Japanese, and costs less than `gpt-4o-transcribe`. The recommended extraction model is `gpt-4o-mini` with structured outputs; it scores perfectly on schema adherence and is sufficient for extraction tasks of this complexity. Audio is passed to OpenAI via the `toFile` helper from `openai` — no temporary file, no disk write, no Storage write. The review screen uses local React state (array of entry objects) managed with React Hook Form's `useFieldArray`.

**Primary recommendation:** Use `gpt-4o-mini-transcribe` for transcription and `gpt-4o-mini` with `zodResponseFormat` for structured extraction. Pass audio as `FormData` through a Route Handler using `toFile`. Thread locale into every GPT prompt. Keep all AI state local until the user confirms on the review screen.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `openai` (npm) | ^6.29.0 | OpenAI SDK — Whisper + GPT calls | Official SDK; includes `toFile`, `zodResponseFormat`, typed responses |
| `zod` | ^3.x | Schema definition for structured outputs | `zodResponseFormat` converts Zod schemas to JSON Schema for API; type-safe |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `react-hook-form` | ^7.x | Review screen form state, `useFieldArray` for entry list | Editing/adding/removing entries without re-renders |
| `@hookform/resolvers` | ^3.x | Zod resolver for RHF | Validation on the review screen (title required, category valid) |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `gpt-4o-mini-transcribe` | `whisper-1` | `whisper-1` is legacy; newer models have lower WER and better Japanese support. Use `whisper-1` only if translation endpoint is required (it is the only model that supports `/translations`) |
| `gpt-4o-mini` extraction | `gpt-4o` extraction | `gpt-4o` costs ~10x more per token; for structured extraction from a transcript, `gpt-4o-mini` achieves 100% schema adherence and is sufficient quality |
| `zodResponseFormat` (Chat Completions) | Responses API `zodTextFormat` | Responses API is OpenAI's new direction, but Chat Completions remains supported. Either works; Chat Completions is more widely documented. Revisit in Phase 8 if Responses API matures |
| Parallel extraction + summary | Sequential calls | Parallel saves latency (~50%); run extraction and summary concurrently with `Promise.all` after transcription completes |

**Installation:**
```bash
npm install openai zod react-hook-form @hookform/resolvers
```

Note: `openai` and `zod` may already be installed from Phase 1 scaffolding. Verify before installing.

## Architecture Patterns

### Recommended Project Structure
```
src/
├── app/
│   └── api/
│       └── ai/
│           ├── transcribe/
│           │   └── route.ts      # Whisper transcription endpoint
│           ├── extract/
│           │   └── route.ts      # GPT structured entry extraction
│           └── summarize/
│               └── route.ts      # GPT session summary
├── lib/
│   └── openai.ts                 # Singleton OpenAI client
├── types/
│   └── ai.ts                     # Shared types: Entry, ExtractionResult, etc.
└── components/
    └── review/
        ├── ReviewScreen.tsx       # Top-level review page/modal
        ├── EntryCard.tsx          # Single editable entry card
        └── AddEntryDialog.tsx     # Dialog for adding new entries
```

### Pattern 1: Audio Upload via FormData + toFile (No Filesystem)

**What:** Client posts audio Blob as `multipart/form-data`; Route Handler reads it as a `File`, passes it to OpenAI via `toFile` — audio never touches disk or Storage.

**When to use:** Required for AI-05 (audio must never be persisted). The `toFile` helper converts a `Buffer` or `Blob` to a file-like object the SDK accepts without any disk I/O.

**Example:**
```typescript
// Source: OpenAI Node SDK docs — toFile helper
// src/app/api/ai/transcribe/route.ts
import { NextRequest, NextResponse } from 'next/server';
import OpenAI, { toFile } from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const audioFile = formData.get('audio') as File;
  const locale = formData.get('locale') as string ?? 'ja';

  if (!audioFile) {
    return NextResponse.json({ error: 'No audio provided' }, { status: 400 });
  }

  const buffer = Buffer.from(await audioFile.arrayBuffer());

  // Determine MIME type from format (mp4 for iOS, webm for Chrome)
  const mimeType = audioFile.type || 'audio/webm';
  const extension = mimeType.includes('mp4') ? 'audio.mp4' : 'audio.webm';

  const transcription = await openai.audio.transcriptions.create({
    file: await toFile(buffer, extension, { type: mimeType }),
    model: 'gpt-4o-mini-transcribe',
    language: locale === 'ja' ? 'ja' : 'en',
    response_format: 'text',
  });

  // Audio buffer goes out of scope — never persisted
  return NextResponse.json({ transcript: transcription });
}
```

### Pattern 2: GPT Structured Extraction with zodResponseFormat

**What:** Pass transcript text to GPT; receive a guaranteed schema-valid array of entries. Use `chat.completions.parse()` with `zodResponseFormat`.

**When to use:** AI-02 requires structured entries with specific fields. `zodResponseFormat` guarantees every field is present and typed correctly — no post-processing needed.

**Example:**
```typescript
// Source: OpenAI Node SDK helpers.md + official structured outputs guide
// src/app/api/ai/extract/route.ts
import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { zodResponseFormat } from 'openai/helpers/zod';
import { z } from 'zod';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const EntrySchema = z.object({
  category: z.enum(['Preference', 'Treatment', 'Lifestyle', 'Concern', 'Other']),
  title: z.string(),
  source_quote: z.string(),
  confidence_score: z.number().min(0).max(1),
});

const ExtractionResultSchema = z.object({
  entries: z.array(EntrySchema),
});

export async function POST(req: NextRequest) {
  const { transcript, locale } = await req.json();

  const systemPrompt = locale === 'ja'
    ? 'あなたは美容室のカルテを作成するアシスタントです。会話から顧客の情報を抽出してください。タイトルと説明は日本語で記述してください。'
    : 'You are an assistant creating salon karute records. Extract client information from the conversation. Write titles in English.';

  const completion = await openai.chat.completions.parse({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `Extract karute entries from this transcript:\n\n${transcript}` },
    ],
    response_format: zodResponseFormat(ExtractionResultSchema, 'extraction_result'),
  });

  const result = completion.choices[0].message.parsed;
  return NextResponse.json(result);
}
```

### Pattern 3: Parallel GPT Calls for Extraction + Summary

**What:** After transcription, run extraction and summary concurrently with `Promise.all`. Saves ~50% of sequential wait time.

**When to use:** Always — extraction and summary are independent; both depend only on the transcript.

**Example:**
```typescript
// src/lib/ai-pipeline.ts
export async function runAIPipeline(audioBlob: Blob, locale: string) {
  // Step 1: Transcription (must complete first)
  const formData = new FormData();
  formData.append('audio', audioBlob);
  formData.append('locale', locale);
  const transcriptRes = await fetch('/api/ai/transcribe', { method: 'POST', body: formData });
  const { transcript } = await transcriptRes.json();

  // Step 2: Extraction + Summary in parallel
  const [extractionRes, summaryRes] = await Promise.all([
    fetch('/api/ai/extract', {
      method: 'POST',
      body: JSON.stringify({ transcript, locale }),
      headers: { 'Content-Type': 'application/json' },
    }),
    fetch('/api/ai/summarize', {
      method: 'POST',
      body: JSON.stringify({ transcript, locale }),
      headers: { 'Content-Type': 'application/json' },
    }),
  ]);

  const [{ entries }, { summary }] = await Promise.all([
    extractionRes.json(),
    summaryRes.json(),
  ]);

  return { transcript, entries, summary };
}
```

### Pattern 4: Review Screen with useFieldArray

**What:** Load AI entries into `useFieldArray` so the user can edit titles, remove entries, and add new ones inline before confirming.

**When to use:** AI-06 requires human review. `useFieldArray` from React Hook Form is the standard for dynamic arrays of editable form rows.

**Example:**
```typescript
// src/components/review/ReviewScreen.tsx
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const ReviewFormSchema = z.object({
  entries: z.array(z.object({
    category: z.string(),
    title: z.string().min(1),
    source_quote: z.string(),
    confidence_score: z.number(),
  })),
});

export function ReviewScreen({ aiEntries, onConfirm }) {
  const { control, handleSubmit } = useForm({
    resolver: zodResolver(ReviewFormSchema),
    defaultValues: { entries: aiEntries },
  });
  const { fields, append, remove } = useFieldArray({ control, name: 'entries' });

  return (
    <form onSubmit={handleSubmit(onConfirm)}>
      {fields.map((field, index) => (
        <EntryCard key={field.id} index={index} control={control} onRemove={() => remove(index)} />
      ))}
      <button type="button" onClick={() => append({ category: 'Other', title: '', source_quote: '', confidence_score: 1 })}>
        + Add Entry
      </button>
      <button type="submit">Confirm</button>
    </form>
  );
}
```

### Anti-Patterns to Avoid

- **Writing audio to Supabase Storage before transcription:** Violates AI-05 and creates privacy risk. Audio must stay in memory only (Buffer → OpenAI → discard).
- **Using JSON mode (`type: "json_object"`) instead of `json_schema`:** JSON mode only guarantees valid JSON syntax, not schema adherence. Extraction will occasionally return missing fields or wrong types. Use `zodResponseFormat` with `chat.completions.parse()`.
- **Sequential extraction → summary:** They are independent — run with `Promise.all` to reduce perceived latency.
- **Storing AI state in Zustand or Context before user confirms:** Keep entries in local React Hook Form state until the user presses Confirm. Only write to Supabase after confirmation (Phase 4 concern, but the review screen should not assume persistence).
- **Sending audio as base64 in a JSON body:** Base64 encoding inflates size by ~33%. Use `FormData` with binary Blob directly.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| JSON schema enforcement from GPT | Custom response parser + retry loop | `zodResponseFormat` + `chat.completions.parse()` | OpenAI's constrained decoding guarantees 100% schema adherence — no retry needed |
| Converting audio buffer to file-like object | `fs.writeFileSync` then `createReadStream` | `toFile(buffer, filename, { type: mimeType })` from `openai` | No filesystem required; works in serverless environments |
| Detecting audio MIME type | Custom format detection | Trust the `File.type` from FormData; default to `audio/webm` | Browser sets this correctly from MediaRecorder; both mp4 and webm are supported by Whisper |
| Dynamic form array for entries | `useState` array + manual splice | `useFieldArray` from React Hook Form | Handles field identity across renders, animations, and validation correctly |
| Locale-aware GPT prompting | Runtime locale injection | Pass locale from request body; branch system prompt per locale | Simple, explicit, no abstraction needed for two locales |

**Key insight:** The OpenAI SDK's `toFile` + `zodResponseFormat` + `chat.completions.parse()` combination handles the two hardest problems (audio-without-filesystem, schema-guaranteed extraction) with first-party utilities. Do not build custom solutions for either.

## Common Pitfalls

### Pitfall 1: Next.js Route Handler Body Size Limit

**What goes wrong:** Audio files from a salon session (1–10 minutes) can easily exceed Next.js's default body parsing limits, returning 413 errors.

**Why it happens:** Next.js App Router Route Handlers have a default 4MB request body limit. A 5-minute webm recording at typical quality can approach or exceed this.

**How to avoid:** Configure `bodySizeLimit` for Server Actions, OR — more reliably for Route Handlers — check whether the audio duration is bounded. If sessions are limited to ~5 minutes, webm audio at 128kbps stays well under 5MB. Configure the limit explicitly in `next.config.ts` if needed. For Route Handlers, the configuration path is less standardized than for Server Actions — verify behavior in the specific Next.js version.

**Warning signs:** 413 HTTP error from the transcription route. Test early with a ~3 minute audio recording.

### Pitfall 2: Vercel Serverless Function Timeout

**What goes wrong:** The Whisper API call for a 5-minute audio file can take 10–30 seconds. Vercel's default serverless timeout on Hobby is 10 seconds; on Pro it's 60 seconds but must be configured.

**Why it happens:** Whisper transcription is synchronous — the API call blocks until transcription completes. Longer audio = longer wait.

**How to avoid:** Export `maxDuration` from each AI route handler. Set to 60 for Pro or 300 for Fluid Compute if available. For development, this is not an issue. Confirm Vercel plan tier before deployment.

```typescript
// At the top of each AI route handler
export const maxDuration = 60; // seconds; requires Vercel Pro
```

**Warning signs:** `Function execution timed out` error in Vercel logs. Transcription works locally but fails in production.

### Pitfall 3: Audio MIME Type Mismatch

**What goes wrong:** iOS Safari records as `audio/mp4`, Chrome records as `audio/webm`. If the Route Handler hardcodes one MIME type when calling `toFile`, the wrong-format files fail to transcribe.

**Why it happens:** Phase 1 (REC-02) handles format differences at the recording level; Phase 2 must propagate the correct MIME type to OpenAI.

**How to avoid:** Read `audioFile.type` from the uploaded `File` object — the browser sets this correctly via `FormData`. Pass it through to `toFile({ type: audioFile.type })`. Fall back to `audio/webm` if the type is empty.

**Warning signs:** Transcription returns empty string or error for iOS-recorded audio only.

### Pitfall 4: GPT Language Leakage

**What goes wrong:** GPT may produce entry titles or summaries in Japanese even when locale is EN (or vice versa), especially when the transcript contains mixed-language speech.

**Why it happens:** GPT defaults to the language of the input content. Without an explicit locale instruction in the system prompt, output language follows transcript language.

**How to avoid:** Make the output language instruction the first and most prominent directive in the system prompt, not the last. Explicitly instruct the model: "IMPORTANT: Respond ONLY in [English/Japanese]. Regardless of the language spoken in the transcript, all output fields must be in [English/Japanese]."

**Warning signs:** Japanese titles appear when UI is set to EN, or vice versa.

### Pitfall 5: Structured Output Schema Restrictions

**What goes wrong:** Zod schemas passed to `zodResponseFormat` may fail if they include unsupported features (e.g., `.optional()` fields, union discriminators, `z.record()`, etc.).

**Why it happens:** OpenAI's structured output uses constrained decoding with a specific subset of JSON Schema. Not all Zod constructs map cleanly.

**How to avoid:** Keep extraction schemas simple and flat: `z.object`, `z.array`, `z.string`, `z.number`, `z.enum`. Avoid optional fields (use `.nullable()` or provide defaults). Validate the schema works before building the review screen.

**Warning signs:** `Invalid schema for response_format` 400 error from the API.

### Pitfall 6: whisper-1 vs gpt-4o-mini-transcribe Prompt Parameter

**What goes wrong:** The `prompt` parameter behavior differs between models. For `whisper-1`, the prompt is a text hint about vocabulary/style. For `gpt-4o-mini-transcribe`, it may behave differently or not be supported in all configurations.

**Why it happens:** Model generations handle prompts differently. Documentation for newer models is still evolving.

**How to avoid:** Use the `language` parameter (`"ja"` or `"en"`) as the primary accuracy lever — this is reliable across all models. Use `prompt` only as an optional vocabulary hint and test its effect.

**Warning signs:** Transcription accuracy is poor for Japanese. Check that `language: 'ja'` is being passed.

## Code Examples

Verified patterns from official sources:

### Whisper Transcription (No Filesystem)
```typescript
// Source: OpenAI Node SDK — toFile helper (openai v6.x)
import OpenAI, { toFile } from 'openai';

const openai = new OpenAI();

// audioBuffer: Buffer from await audioFile.arrayBuffer()
const transcription = await openai.audio.transcriptions.create({
  file: await toFile(audioBuffer, 'audio.webm', { type: 'audio/webm' }),
  model: 'gpt-4o-mini-transcribe',
  language: 'ja',
  response_format: 'text',
});
// transcription is a string (plain text)
```

### GPT Structured Extraction
```typescript
// Source: OpenAI structured outputs guide + openai/helpers/zod
import { zodResponseFormat } from 'openai/helpers/zod';
import { z } from 'zod';

const EntrySchema = z.object({
  category: z.enum(['Preference', 'Treatment', 'Lifestyle', 'Concern', 'Other']),
  title: z.string(),
  source_quote: z.string(),
  confidence_score: z.number().min(0).max(1),
});

const ExtractionResultSchema = z.object({
  entries: z.array(EntrySchema),
});

const completion = await openai.chat.completions.parse({
  model: 'gpt-4o-mini',
  messages: [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: transcript },
  ],
  response_format: zodResponseFormat(ExtractionResultSchema, 'extraction_result'),
});

// completion.choices[0].message.parsed is typed as ExtractionResult
const { entries } = completion.choices[0].message.parsed!;
```

### FormData Audio Upload from Client
```typescript
// Client-side: send audio blob to transcription route
async function transcribeAudio(audioBlob: Blob, locale: string): Promise<string> {
  const formData = new FormData();
  formData.append('audio', audioBlob);  // Browser sets correct MIME type
  formData.append('locale', locale);

  const res = await fetch('/api/ai/transcribe', {
    method: 'POST',
    body: formData,
    // Do NOT set Content-Type header — browser handles multipart boundary
  });

  if (!res.ok) throw new Error(`Transcription failed: ${res.status}`);
  const { transcript } = await res.json();
  return transcript;
}
```

### Locale-Aware System Prompts
```typescript
// src/lib/prompts.ts
export function getExtractionSystemPrompt(locale: string): string {
  if (locale === 'ja') {
    return `あなたは美容室・サロンのカルテ記録を作成するアシスタントです。
提供された会話の書き起こしから、顧客に関する重要な情報を抽出してください。
重要: すべての出力フィールド（title、source_quote）は必ず日本語で記述してください。`;
  }
  return `You are an assistant creating salon karute (client records).
Extract important client information from the provided conversation transcript.
IMPORTANT: All output fields (title, source_quote) must be written in English.`;
}

export function getSummarySystemPrompt(locale: string): string {
  if (locale === 'ja') {
    return `以下の会話の書き起こしから、サロンセッションの要約を日本語で作成してください。
要約は2〜4文のテキストとして記述してください。`;
  }
  return `Create a prose summary of this salon session from the conversation transcript.
Write the summary in English, 2-4 sentences.`;
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `whisper-1` only model | `gpt-4o-mini-transcribe`, `gpt-4o-transcribe` also available | March 2025 | New models have lower WER; `whisper-1` still works but is "legacy" for transcription |
| JSON mode (`type: "json_object"`) | Structured outputs (`zodResponseFormat`) | August 2024 | 100% schema adherence guaranteed; no more prompt-engineered JSON parsing |
| `createTranscription()` (old SDK) | `audio.transcriptions.create()` (openai v4+) | 2023 | API redesign; old methods removed |
| `fs.createReadStream(file)` for audio | `toFile(buffer, name, {type})` | v4 SDK | Works in serverless/Edge environments without filesystem |
| OpenAI Assistants API for multi-step tasks | Chat Completions + Responses API | Announced 2025, sunset Aug 2026 | Do not use Assistants API for this phase |

**Deprecated/outdated:**
- `type: "json_object"` (JSON mode): Still works but does not enforce schema; replaced by `json_schema` / `zodResponseFormat` for extraction tasks.
- `whisper-1` for new projects: Still fully functional, required for translation endpoint only. Prefer `gpt-4o-mini-transcribe` for transcription.
- OpenAI Assistants API: Scheduled for sunset August 2026. Do not introduce it here.

## Open Questions

1. **Next.js Route Handler body size limit for audio**
   - What we know: Default is 4MB; configuration for Route Handlers is less clear than for Server Actions in the App Router. Multiple GitHub discussions confirm this is a known gap.
   - What's unclear: Whether `next.config.ts` `serverActions.bodySizeLimit` applies to Route Handlers, or only to Server Actions.
   - Recommendation: Test with a 5-minute audio recording early in task 02-01. If the 413 error occurs, switch to sending audio as Server Action with explicit `bodySizeLimit: '20mb'` configured, OR impose a session recording time cap in the UI.

2. **Vercel deployment tier and `maxDuration`**
   - What we know: Hobby tier caps at 10 seconds; Pro allows up to 60 seconds (configurable). Whisper for long audio can exceed 10 seconds.
   - What's unclear: Whether this project deploys to Hobby or Pro tier.
   - Recommendation: Set `export const maxDuration = 60` in AI route handlers as standard practice. This is a no-op in local dev and will be enforced by Vercel only on deploy.

3. **gpt-4o-mini-transcribe response_format options**
   - What we know: The model supports `json` and `text` response formats. `whisper-1` additionally supports `srt`, `verbose_json`, `vtt`.
   - What's unclear: Whether `verbose_json` (which includes word-level timestamps) is available on `gpt-4o-mini-transcribe`.
   - Recommendation: Use `response_format: 'text'` for transcription — the plain transcript string is all that is needed for extraction. This is confirmed to work on all models.

## Sources

### Primary (HIGH confidence)
- `https://developers.openai.com/api/docs/guides/speech-to-text/` — Whisper API parameters, models, file format support, 25MB limit
- `https://developers.openai.com/api/docs/guides/structured-outputs/` — zodResponseFormat pattern, model support, schema restrictions
- OpenAI Node SDK v6.29.0 (verified via `npm info openai version`) — toFile helper, audio.transcriptions.create, chat.completions.parse

### Secondary (MEDIUM confidence)
- WebSearch: "openai npm package version 4.x audio transcriptions toFile TypeScript 2025" — confirmed `toFile` import from `openai`, buffer conversion pattern
- WebSearch: "OpenAI whisper-1 vs gpt-4o-transcribe Japanese accuracy 2025" — confirmed newer models outperform whisper-1 on Japanese WER; gpt-4o-mini-transcribe-2025-12-15 specifically cited as strong on Japanese
- WebSearch: "Next.js Route Handler FormData file upload" — confirmed `request.formData()` pattern, `formData.get()` returns `File`
- WebSearch: "OpenAI Whisper API audio formats" — confirmed supported formats: m4a, mp3, webm, mp4, mpga, wav, mpeg; 25MB limit
- WebSearch: "Next.js vercel serverless function timeout audio processing" — confirmed `export const maxDuration = 60`; Hobby=10s, Pro=60s limits

### Tertiary (LOW confidence)
- WebSearch: "Next.js App Router route handler body size limit 4MB" — multiple GitHub discussions confirm the limit exists and configuration is unclear for Route Handlers vs Server Actions. Needs empirical testing.
- WebSearch: "react-hook-form useFieldArray AI entries review screen" — pattern is from RHF docs and community examples, not OpenAI-specific. Pattern is well-established.

## Metadata

**Confidence breakdown:**
- Standard stack (openai SDK, zod, models): HIGH — confirmed via `npm info`, official OpenAI docs
- Architecture (Route Handlers, toFile, zodResponseFormat): HIGH — confirmed via official docs and SDK
- Audio MIME type handling: HIGH — confirmed by Whisper API docs (both mp4 and webm supported)
- Pitfalls (body size limit): MEDIUM — known issue, configuration details need empirical validation
- Pitfalls (Vercel timeout): HIGH — documented in Vercel official docs
- i18n/locale prompting: MEDIUM — pattern is standard prompt engineering, not library-specific

**Research date:** 2026-03-13
**Valid until:** 2026-04-13 (30 days; OpenAI model lineup is fast-moving — verify `gpt-4o-mini-transcribe` availability if approaching this date)
