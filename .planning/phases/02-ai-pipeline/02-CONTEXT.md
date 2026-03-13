# Phase 2: AI Pipeline - Context

**Gathered:** 2026-03-13
**Status:** Ready for planning

<domain>
## Phase Boundary

Recorded audio flows through Whisper transcription and GPT extraction, producing a transcript, categorized entries with confidence scores, and a session summary — with a human review screen before anything is saved. Audio is discarded after transcription. No audio is ever written to storage.

</domain>

<decisions>
## Implementation Decisions

### Entry categories & structure
- Fixed set of predefined categories (Preference, Treatment, Lifestyle, Health, Allergy, Style) with ability for AI or user to add new categories over time
- Confidence scores visible to staff as a badge on each entry (e.g., 95%, 72%)
- Target 5-10 entries per session — moderate detail, captures most useful information
- Granularity: Claude's discretion on splitting vs grouping related ideas

### Human review screen
- Card list layout — each entry is a card with category tag, title, source quote, confidence score in a vertical stack
- Inline editing — click any field to edit directly in place, no modals
- Transcript visible side by side with entries — staff can cross-reference source quotes against full transcript
- AI summary shown at top of review screen, editable — staff can tweak text before saving
- + Add Entry button to manually add entries during review

### Processing experience
- Step-by-step progress display: "Transcribing..." → "Extracting entries..." → "Generating summary..." with status for each stage
- Blocking modal — user stays on a processing screen while AI works
- Auto-retry once on API failure, then show error with manual retry button
- Typical recordings are 1-5 minutes — processing should complete within 10-20 seconds

### Language behavior
- AI outputs (entry titles, summary text) match the active UI locale — if UI is English, entries come back in English regardless of spoken language
- Mixed-language sessions are common (Japanese + English terms) — AI handles gracefully, preserves foreign terms as-is
- Source quotes on entries preserve the original spoken language — authentic reference
- Transcript stays in original spoken language (Whisper output as-is)

### Claude's Discretion
- Entry granularity — whether to split "short layers and warm tones" into separate entries or group them
- Exact card component design and spacing
- Error state visual design
- Retry timing and backoff strategy

</decisions>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 02-ai-pipeline*
*Context gathered: 2026-03-13*
