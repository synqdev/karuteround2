# Feature Research

**Domain:** AI-assisted digital karute — salon/spa/aesthetics client record-keeping, Japan market
**Researched:** 2026-03-13
**Confidence:** MEDIUM-HIGH (Japanese market verified via multiple product sites; AI voice extraction verified via ClinicHub press release and ai-calte.com; global salon software verified via multiple 2026 sources)

---

## Feature Landscape

### Table Stakes (Users Expect These)

These are non-negotiable. A salon switching from paper karute will not adopt a digital tool that fails to match paper's basic capabilities.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Customer profile creation | Every digital karute product has this. Name, contact, basic info. | LOW | Required fields: name, phone, email, birthday, allergies/sensitivities |
| Visit history log | Staff need to see past sessions before a client sits down. Core utility of any karute. | LOW | Chronological list of visits with date, staff, treatments |
| Treatment/service record per visit | The karute *is* the treatment record. No treatment record = no karute. | LOW | What was done, products used, formulas (especially for color/chemical) |
| Client preferences and notes | Stylists change. Institutional memory lives in the karute. | LOW | Free text + structured fields for key preferences (hair concerns, lifestyle, dislikes) |
| Before/After photo storage | Japanese karute culture expects photos. Every competitor supports this. | MEDIUM | Camera capture + upload; organized per visit; color, nail, and skin karute rely heavily on photos |
| Search and filter customers | Paper's biggest failure is retrieval speed. Digital must do better. | LOW | Search by name, phone. Filter by visit date, treatment type |
| Multi-staff access | Single-owner shops rarely exist. Staff coverage is normal in Japanese salons. | LOW | Staff log in, see shared customer records, add their own notes |
| Staff-level permissions | Customer data is sensitive. Junior staff should not see owner financials. | MEDIUM | Read/write karute vs. admin vs. owner tiers |
| Mobile-first / tablet operation | Japanese salons work at chair-side. Desktop-only is unusable. | LOW | iOS-first is standard. iPad + iPhone. |
| Data security / encryption | Customer PII (personal information) stored under Japan's APPI law. All competitors mention this. | MEDIUM | APPI compliance, encrypted storage, login-protected |
| CSV / data export | Salons need to migrate or back up data. Missing this = vendor lock-in anxiety. | LOW | Export customer list + karute entries to CSV or PDF |
| Offline / low-connectivity resilience | Japanese salons sometimes have poor in-salon wifi. Data loss during session = deal-breaker. | MEDIUM | At minimum: draft saving, retry on reconnect |
| Free-text memo field | Paper always had the margin. Staff write informal notes everywhere. | LOW | Rich text or simple plain text per visit |
| Customizable karute fields | Nail, hair, and esthetics karute have very different required fields. | MEDIUM | Add/remove fields; rename labels; toggle field visibility |
| Counseling sheet / intake form | Digital intake on arrival replaces paper questionnaires. All major JP competitors support this. | MEDIUM | First-visit questionnaire; allergen history; consent acknowledgement |

### Differentiators (Competitive Advantage)

These are where this product wins. Competitors do not have the AI voice pipeline. The goal is to make karute creation effortless so staff spend time on clients, not documentation.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Session audio recording | Captures the consultation conversation for later transcription. Nothing else in the JP salon market does this as a native feature. ClinicHub exists for beauty clinics but not mass-market salons. | MEDIUM | In-app audio recorder; tap to start/stop; stored per visit; needs privacy-aware UX (client awareness) |
| AI transcription (JP + EN) | Converts session audio to text automatically. Eliminates manual typing of notes during or after session. | HIGH | Whisper or equivalent; Japanese is primary language; bilingual output support |
| AI structured entry extraction | The core differentiator. AI reads the transcript and pulls out structured fields: preferences, treatment decisions, product reactions, lifestyle notes, follow-up flags. Reduces karute creation from 10+ minutes to seconds. | HIGH | LLM-based extraction (GPT-4o or equivalent); outputs structured JSON mapped to karute fields; human review step before save |
| AI-suggested field values | After extraction, AI pre-fills fields and highlights confidence. Staff confirm or edit. Much faster than typing from scratch. | HIGH | Confidence indicators per field; easy accept/reject; staff always has final say |
| Human review / edit before save | Addresses the core trust problem with AI — staff must be able to see what AI extracted and correct it before it goes to the karute. Critical for medical/personal accuracy. | LOW | Review screen showing AI suggestions side-by-side with transcript excerpts; confirm or edit each field |
| Transcript search | Search across all past session transcripts to find when a client mentioned a specific concern, preference, or product. Radically improves staff prep. | MEDIUM | Full-text search of transcript corpus per customer |
| Timeline view of karute entries | Visual timeline of a client's evolution over months/years. Skin, hair color, treatments over time. Hard to replicate with paper or a flat list. | MEDIUM | Visual timeline component; entries filterable by category |
| Before/after photo pairing per entry | Tie photos directly to a specific session's karute entry, not just to a customer. Tracks progression chronologically. | MEDIUM | Photo attached to visit record, not floating in a photo gallery |
| Dark-themed, sleek UI | Japanese salon staff skew design-conscious. A beautiful tool gets adopted. A generic-looking SaaS tool gets ignored. | MEDIUM | Proper design system; dark theme as default; bilingual EN/JP |
| Bilingual EN/JP interface | Foreign staff are common in urban Japanese salons; owners may be non-Japanese. No competitor has this as a feature. | MEDIUM | i18n framework; all labels, errors, and notifications in both languages; user-level language toggle |
| Export to PDF (shareable karute) | Staff switching salons, referrals to partner clinics, or franchise expansion require portable karute records. | LOW | Per-customer PDF export; formatted karute view |
| Single business / multi-staff model | Designed for the individual salon owner. Not a multi-location enterprise system. Not a solo stylist freelance tool. Clean fit for a 2-8 person salon team. | LOW | Business account + staff profiles; owner sees all; staff see their own + shared |

### Anti-Features (Commonly Requested, Often Problematic)

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Online reservation / booking system | Every competitor bundles it. Users will ask for it. | Huge scope: calendar sync, client-facing booking portal, cancellation logic, reminders. Doubles the product surface area. Competitors (Bireki, KaruteKun, LiME) took years to build reliable booking. Building it poorly creates more problems than it solves. Competitors already own this space. | Integrate with existing reservation tools (e.g. Hotpepper Beauty, LINE, or Google Calendar) via export/link. Do not build a booking engine in v1. |
| POS / payment processing | Natural pairing with client records. | Payment processing in Japan requires card acquirer contracts, QR code integration (PayPay, LINE Pay), and significant compliance work. Entirely separate domain from karute. | Link to Square or Stripe-based tools via reference. Note the appointment cost in the karute as a free-text field. |
| AI chat assistant / generative recommendations | "Ask AI about this client" sounds powerful. | Without a strong factual grounding in the customer's specific history, LLM chat produces plausible-sounding but unreliable recommendations. Trust erodes fast when staff catch errors. Also requires full RAG infrastructure. Explicitly out of scope for v1 per project context. | Let AI do extraction (bounded, verifiable task) not open-ended conversation. Add AI chat in v2 after extraction quality is proven. |
| Loyalty points / membership management | Clients and owners ask for it. | Complex redemption logic, expiry rules, multi-purchase tracking. Business logic explodes. Entirely separate from karute creation value prop. | Note membership status as a karute field (custom text). Do not build a point engine. |
| SMS / email marketing campaigns | Salons want to send campaigns from the app. | Deliverability infrastructure, unsubscribe compliance under Japan's Specified Commercial Transactions Act, template management. Another full product. | Export customer list with contact info + last visit date. Staff handles outreach in their own tool. |
| Inventory management | Stylists track product usage. | Separate domain — purchase orders, SKU management, stock levels. Adds significant complexity with zero relationship to the karute creation core loop. | Note products used in karute entry (free text). Inventory remains in a separate system. |
| Client-facing app / portal | Let clients view their own karute. | Requires authentication for a separate user type, privacy review of what's shareable, client communication channel management. High complexity, low immediate value. | Export PDF for client handoff if needed. Build client portal in v2+. |
| Real-time multi-user collaborative editing | Two staff editing the same karute at the same time. | Conflict resolution (OT or CRDT) is complex. For a single-salon product, two staff rarely edit the same record simultaneously. | Last-write-wins with a timestamp is sufficient for v1. Add optimistic locking if conflicts prove real. |
| Advanced analytics / BI dashboard | Owners want to see revenue, retention, churn trends. | At v1 scale, the dataset is tiny. A full analytics layer is engineering-heavy for marginal value when the core loop (record → karute) is unproven. | Show simple stats: total customers, total visits, last visit date per customer. Full analytics in v2. |

---

## Feature Dependencies

```
[Audio Recording]
    └──required by──> [AI Transcription]
                          └──required by──> [AI Structured Extraction]
                                                └──required by──> [AI Field Suggestions]
                                                └──required by──> [Human Review / Edit Before Save]
                                                └──required by──> [Transcript Search]

[Customer Profile]
    └──required by──> [Visit History Log]
                          └──required by──> [Treatment Record per Visit]
                                                └──required by──> [Before/After Photo per Visit Entry]
                                                └──required by──> [AI Structured Extraction] (context source)
                                                └──required by──> [Timeline View]

[Staff Profiles]
    └──required by──> [Multi-Staff Access]
                          └──required by──> [Staff-Level Permissions]

[Customizable Karute Fields]
    └──enhances──> [AI Structured Extraction] (extraction targets depend on defined schema)

[Audio Recording] ──conflicts with──> [Real-time Collaborative Editing]
    (audio is per-session, per-staff; concurrent editing is not a natural use case here)

[Counseling Sheet / Intake Form]
    └──enhances──> [AI Structured Extraction] (intake answers provide baseline context)
```

### Dependency Notes

- **Audio Recording requires no upstream features** — it is the root of the AI pipeline and can ship as standalone in an earlier phase.
- **AI Transcription requires Audio Recording** — transcription without a recording source has no data to process.
- **AI Structured Extraction requires AI Transcription** — the LLM works on transcript text, not raw audio.
- **Human Review requires AI Structured Extraction** — the review screen only exists to confirm/correct AI output; it has no standalone purpose.
- **Visit History requires Customer Profile** — a visit has no home without a customer record to attach to.
- **Timeline View requires Treatment Records** — the visual timeline is a rendering of visit records. Must have several records to be useful.
- **Customizable Karute Fields enhances AI Extraction** — if fields are defined (e.g. "hair texture", "color sensitivity"), the extraction prompt can target them specifically. The dependency is soft: extraction works without customization, but improves with it.
- **Staff-Level Permissions requires Multi-Staff Access** — permissions only matter if there are multiple staff. Build together.

---

## MVP Definition

### Launch With (v1)

Minimum viable product — validates the core loop: record session → get AI karute → confirm and save.

- [x] **Customer profile management** — name, contact, notes, allergen history. The record anchor.
- [x] **Visit history log** — list of past visits per customer, chronological.
- [x] **Treatment record per visit** — free-text + structured fields per session.
- [x] **Before/after photo per visit entry** — attach photos to specific session records.
- [x] **Audio recording (in-app)** — tap to record during consultation. Core of the AI pipeline.
- [x] **AI transcription (JP + EN)** — converts session audio to searchable text.
- [x] **AI structured entry extraction** — pulls preferences, treatments, notes from transcript.
- [x] **Human review / edit before save** — staff confirms AI output before it enters the karute.
- [x] **Multi-staff access + permissions** — owner and staff log in; role-based visibility.
- [x] **Search and filter customers** — find clients by name or phone quickly.
- [x] **CSV export** — basic data portability; export customer list and visit records.
- [x] **Dark-themed, bilingual EN/JP UI** — non-negotiable for target audience and staff.
- [x] **Offline draft saving** — session notes survive connectivity loss; sync on reconnect.

### Add After Validation (v1.x)

Add once core loop proves reliable and staff trust the AI output quality.

- [ ] **Transcript search** — search across all past transcripts. Trigger: users ask "can I find when a client mentioned X?"
- [ ] **Timeline view** — visual evolution of client over time. Trigger: enough data accumulated (6+ months of records) to make it useful.
- [ ] **Counseling sheet / intake form** — digital first-visit questionnaire. Trigger: salons report awkward first visits without it.
- [ ] **PDF export per client** — formatted karute download. Trigger: staff request it for referrals or client transfers.
- [ ] **Customizable karute fields** — add/rename/hide fields per business type. Trigger: esthetics clinics have different fields than hair salons.

### Future Consideration (v2+)

Defer until product-market fit is established and v1 is stable.

- [ ] **AI chat assistant** — conversation about a client's history. Defer: requires RAG infrastructure + significant trust-building in extraction first.
- [ ] **Client-facing portal** — clients view their own karute. Defer: separate auth type, privacy review, different UX domain.
- [ ] **Advanced analytics / BI** — retention rates, visit frequency, treatment trends. Defer: data set too small to be meaningful at v1 scale.
- [ ] **Reservation/booking system** — appointment scheduling. Defer: separate product domain; integrate rather than build.
- [ ] **Loyalty points / membership** — points engine. Defer: complex business logic, no relationship to core karute loop.
- [ ] **POS / payment** — payment processing. Defer: requires payment acquirer; entirely separate domain.

---

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Customer profile management | HIGH | LOW | P1 |
| Visit history log | HIGH | LOW | P1 |
| Treatment record per visit | HIGH | LOW | P1 |
| Multi-staff access + permissions | HIGH | MEDIUM | P1 |
| Audio recording (in-app) | HIGH | MEDIUM | P1 |
| AI transcription | HIGH | HIGH | P1 |
| AI structured extraction + review | HIGH | HIGH | P1 |
| Before/after photo per visit | HIGH | MEDIUM | P1 |
| Search and filter | HIGH | LOW | P1 |
| Bilingual EN/JP UI | HIGH | MEDIUM | P1 |
| Dark-themed UI | MEDIUM | MEDIUM | P1 |
| CSV export | MEDIUM | LOW | P1 |
| Offline draft saving | MEDIUM | MEDIUM | P1 |
| Counseling sheet / intake | MEDIUM | MEDIUM | P2 |
| Transcript search | MEDIUM | MEDIUM | P2 |
| PDF export | MEDIUM | LOW | P2 |
| Timeline view | MEDIUM | MEDIUM | P2 |
| Customizable fields | MEDIUM | HIGH | P2 |
| AI chat assistant | LOW (v1) | HIGH | P3 |
| Client portal | LOW (v1) | HIGH | P3 |
| Analytics / BI | LOW (v1) | HIGH | P3 |
| Booking / reservation | LOW (scope) | HIGH | P3 |
| POS / payments | LOW (scope) | HIGH | P3 |

**Priority key:**
- P1: Must have for launch
- P2: Should have, add when possible
- P3: Nice to have, future consideration

---

## Competitor Feature Analysis

| Feature | KaruteKun | LiME | Bireki | AI Beauty Karute (ai-calte.com) | Our Approach |
|---------|-----------|------|--------|---------------------------------|--------------|
| Customer profile management | Yes | Yes | Yes | Unknown | Yes — v1 |
| Visit history | Yes | Yes | Yes | Unknown | Yes — v1 |
| Treatment records | Yes | Yes | Yes | Unknown | Yes — v1 |
| Photo management | Yes | Yes | Yes | Yes | Yes — per-visit entry |
| Audio recording | No | No | No | Yes (core feature) | Yes — native in-app |
| AI transcription | No | No | No | Yes | Yes — JP + EN |
| AI extraction to structured fields | No | No | No | Partial (unclear depth) | Yes — full structured extraction |
| Human review step | No | No | No | Unknown | Yes — mandatory before save |
| Transcript search | No | No | No | Unknown | v1.x |
| Multi-staff access | Yes | Yes | Yes | Unknown | Yes — v1 |
| Reservations / booking | Yes | Yes | Yes | No | No — defer/integrate |
| POS / payments | Yes (add-on) | Yes | Yes | No | No — out of scope |
| LINE integration | Yes | Yes | Yes | No | No — v2 consideration |
| Bilingual EN/JP | No | No | No | No | Yes — v1 differentiator |
| Dark-themed UI | No | No | No | No | Yes — v1 differentiator |
| CSV export | Yes | Yes | Yes | Unknown | Yes — v1 |
| PDF export | Some | Some | Yes | Unknown | v1.x |
| Customizable fields | Some | Some | Yes | Unknown | v1.x |
| Analytics / reporting | Yes | Yes | Yes | No | v2 |
| Loyalty / points | Some | Some | Yes | No | Out of scope |
| Marketing / messaging | Some | Yes | Yes | No | Out of scope |

---

## Sources

- **KaruteKun product page**: https://karutekun.com/ — feature list, LINE integration, multi-device operation
- **Bireki product page**: https://bireki.jp/ — counseling sheets, POS, loyalty, EC, messaging
- **SalonWorks product page**: https://salonworks.jp/ — multi-tier pricing, feature modules, data security
- **ASPIC Japan karute comparison (14 products)**: https://www.aspicjapan.org/asu/article/30929 — market-wide feature survey
- **medimo.ai 17-product karute comparison**: https://medimo.ai/column/hairsalon-emr — all-in-one vs. specialized breakdown
- **ClinicHub AI voice karute press release**: https://prtimes.jp/main/html/rd/p/000000010.000158176.html — 98% time reduction claim; specialized medical vocabulary; one-click EHR integration
- **AIビューティーカルテ (ai-calte.com)**: https://ai-calte.com/ — beauty salon AI voice karute; closest existing competitor
- **ASPIC Japan AI/voice karute services (12 products)**: https://www.aspicjapan.org/asu/article/84059 — AI transcription + summarization products in Japan market
- **Zylu salon software features 2026**: https://zylu.co/top-salon-software-features-2026/ — global must-have and differentiating features
- **Zylu 10 must-have features 2026**: https://zylu.co/10-must-have-features-salon-software-management-2026/ — standard features baseline
- **Dingg: Top 5 salon client management mistakes**: https://dingg.app/blogs/top-5-mistakes-salons-make-with-client-management — what fails without good software
- **Meevo: Salon AI 2026**: https://www.meevo.com/blog/salon-ai-experiences/ — human-AI partnership model; AI for automation not replacement
- **Japan APPI compliance**: https://iclg.com/practice-areas/data-protection-laws-and-regulations/japan — personal data obligations relevant to customer records

---

*Feature research for: AI-assisted digital karute, salon/spa/aesthetics, Japan market*
*Researched: 2026-03-13*
