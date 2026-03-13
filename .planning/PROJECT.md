# Karute

## What This Is

An AI-assisted digital karute (client record-keeping) app for Japanese service businesses — salons, spas, aesthetics clinics. Staff record session conversations via browser microphone, audio is transcribed and discarded, and AI extracts structured entries (preferences, treatments, lifestyle notes) that build a persistent client record. Replaces pen-and-paper karute with a sleek, dark-themed bilingual (EN/JP) interface.

## Core Value

Service providers can record a client session conversation and instantly get a structured, categorized digital karute without writing anything down.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Audio recording via browser microphone with visual waveform and timer
- [ ] Transcription of recorded audio via OpenAI Whisper (Japanese + English)
- [ ] AI extraction of structured entries from transcript (Preference, Treatment, Lifestyle, etc.) with confidence scores
- [ ] AI-generated session summary
- [ ] Customer management — create, list, view customers
- [ ] Karute records linked to customers with date-based history
- [ ] Staff profile switching — single business login, toggle between staff members
- [ ] Export karute as PDF or plain text
- [ ] Dark-themed UI matching mockup aesthetic
- [ ] Fully bilingual UI (EN/JP toggle)
- [ ] Audio discarded after transcription — only transcript and entries stored
- [ ] Manual entry addition (+ Add Entry) for entries AI missed
- [ ] Save karute records to Supabase

### Out of Scope

- AI chat / conversational AI assistant — defer to later milestone
- Multi-tenant / multi-business support — single business for v1
- OAuth / social login — single shared business login sufficient
- Mobile native app — web-first (responsive)
- Real-time streaming transcription — batch transcription after recording
- Data migration from existing systems — v2
- Appointment scheduling — not a karute concern
- Dashboard analytics — v2

## Context

- **Karute (カルテ)**: Japanese practice of maintaining detailed client records in service industries. Originally from German "Karte" (card). Standard in hair salons, spas, clinics. Records client preferences, treatment history, physical observations, lifestyle notes. Traditionally paper-based.
- **Previous version**: An earlier version exists at synq-karute.vercel.app — this is a complete rewrite ("reborn"). Reference for feature set but no code reuse.
- **Mockups**: PSD mockups provided showing dark UI with sidebar navigation (Recording, Dashboard, Customers, Karute, Data Migration, Ask AI, Settings), karute detail view with AI Summary + Transcript + categorized Entries, and recording modal with mic button/timer/waveform.
- **Target users**: Service providers (stylists, aestheticians, therapists) using a shared device (tablet/laptop) at their workplace.
- **Auth model**: One business account login, multiple staff profiles that can be toggled without re-authenticating. Like a shared POS system.

## Constraints

- **Tech stack**: Next.js + Supabase (prod and dev environments)
- **AI services**: OpenAI Whisper for transcription, GPT for entry extraction and summarization
- **CI/CD**: GitHub Actions with Claude (@claude tag for code changes via PR comments)
- **Git workflow**: PRs per task targeting an integration branch, integration branch targets main. Never commit directly to main.
- **Privacy**: Audio must be discarded after transcription — only text artifacts stored
- **Language**: Full bilingual support (EN/JP) from day one, not bolted on later

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Discard audio after transcription | Privacy-first — service conversations are sensitive, minimize stored data | — Pending |
| Single business login with staff toggle | Matches salon workflow — shared device, quick staff switching | — Pending |
| Next.js + Supabase | Team familiarity, rapid development, built-in auth/storage/realtime | — Pending |
| OpenAI for transcription + extraction | Whisper excels at Japanese audio, GPT for structured extraction | — Pending |
| Integration branch workflow | PRs per task → integration branch → main. Clean history, reviewable changes | — Pending |
| Dark theme | Matches mockup aesthetic, reduces eye strain in salon environments | — Pending |

---
*Last updated: 2026-03-13 after initialization*
