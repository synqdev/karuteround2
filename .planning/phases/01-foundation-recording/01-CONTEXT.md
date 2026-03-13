# Phase 1: Foundation + Recording - Context

**Gathered:** 2026-03-13
**Status:** Ready for planning

<domain>
## Phase Boundary

Project scaffold (Next.js 16 + Supabase + Tailwind v4 + shadcn), database schema with RLS, auth, i18n (EN/JP), CI/CD, and working browser mic recording with staff selection. No AI transcription (Phase 2), no customer management (Phase 3).

</domain>

<decisions>
## Implementation Decisions

### Recording Experience
- Tap mic button → recording starts immediately (no countdown, no confirmation)
- After recording stops → send to AI immediately (auto-send to Whisper, show loading state) — note: Whisper integration is Phase 2, but the POST to `/api/transcribe` route should be wired
- Recording panel is a left panel overlay that slides in from left over the sidebar area (matches mockup)
- Waveform and recording flow should match the existing synq-karute app (https://github.com/synqdev/karute) as closely as possible
- Recording state machine: idle → recording → recorded (then auto-send)

### Dark Theme / Visual Direction
- Pixel-match the existing synq-karute repo UI — that codebase is the design reference
- Also reference the provided PSD mockups for any screens not in the existing app
- Inter font for English, Noto Sans JP for Japanese
- Sidebar collapses to icons only on smaller/tablet screens
- Header matches mockup exactly: sun icon (theme toggle), EN/JP toggle, user avatar + name dropdown

### Staff Switching
- Avatar dropdown in header — click avatar/name → dropdown list of staff → tap to switch
- Switching staff only changes attribution — new recordings get tagged with selected staff
- All staff see all records (no filtering by staff)
- Staff profiles managed in Settings page (name only — no role, no avatar upload)
- Auto-generated initials badge for the avatar display (like "AL" in mockup)

### Login / Onboarding
- Minimal dark login page — dark background, centered card with email/password fields, app logo above
- Self-service signup — sign up page with email/password creates business account
- Onboarding flow should match the existing synq-karute app
- After login → straight to the app (no mandatory setup wizard)

### Claude's Discretion
- Forgot password flow — include if low effort, skip if complex
- Loading skeleton design during recording send
- Exact spacing and component sizing (follow shadcn defaults where mockup is ambiguous)
- Error state handling for failed recordings
- AudioContext resume strategy

</decisions>

<specifics>
## Specific Ideas

- **Primary design reference**: https://github.com/synqdev/karute — match the UI of this existing codebase as closely as possible. This is the "reborn" of that app.
- **Mockup PSD**: Provided screenshots show the karute detail view, recording modal with dotted waveform, sidebar nav with icons + labels
- The recording panel overlays from the left side (not centered modal)
- Header shows: theme toggle (sun icon), EN/JP language toggle, staff avatar with initials + name + dropdown chevron

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 01-foundation-recording*
*Context gathered: 2026-03-13*
