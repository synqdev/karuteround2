# Phase 6: UI/UX Polish — Research

**Researched:** 2026-03-13
**Domain:** Tailwind v4 design tokens, next-intl v4 locale switching, shadcn Sidebar active states, next-themes, next/font bilingual typography, tablet-responsive layout
**Confidence:** HIGH (all critical claims verified against official docs or the synqdev/karute reference codebase)

---

## Summary

Phase 6 is a polish phase — no new backend. The four tasks (dark theme audit, bilingual toggle, sidebar navigation, tablet responsive pass) share a single technical foundation: Tailwind v4 CSS-first design tokens, next-intl v4 locale routing, and the shadcn Sidebar primitive. All three of these were established in Phase 1, so Phase 6 is about wiring them correctly across every page built in Phases 1-5, not introducing new libraries.

The most important fact for planning: the reference app at `github.com/synqdev/karute` already demonstrates every pattern needed for this phase in working production code. The sidebar, top-bar with locale toggle, theme toggle, staff switcher, and record panel are all in `src/components/layout/`. The dark-mode tokens in `globals.css` use OKLCH color space with Tailwind v4's `@theme inline` block. The locale switch uses `router.replace(pathname, { locale: next })` from `@/i18n/navigation` (the typed navigation layer created by `createNavigation(routing)`).

AI outputs (transcripts, summaries, karute entries) are dynamic database content — they are NOT wrapped in `useTranslations`. Only UI chrome (labels, buttons, headings, placeholders, error messages) goes through `t()`. This means "bilingual" for AI outputs means displaying them as-is, and the locale switch only affects static UI strings. This is the correct behavior and matches the reference app.

**Primary recommendation:** Treat the `synqdev/karute` repo as the implementation reference. Every component pattern for Phase 6 is already working there — copy the structure, adapt to the new app's pages and data, and fill in missing translation keys for the new pages (recording, karute detail, customer management, staff settings) that were not in the reference app.

---

## Standard Stack

All libraries were already installed in Phase 1. Phase 6 introduces no new npm dependencies.

### Core (all installed in Phase 1)
| Library | Version | Purpose | Role in Phase 6 |
|---------|---------|---------|-----------------|
| tailwindcss | 4.x | CSS-first styling | Design token audit and enforcement |
| next-themes | latest | Class-based dark mode | ThemeProvider with `attribute="class"` |
| next-intl | 4.x | i18n translations and routing | Locale toggle, `t()` for UI strings |
| shadcn/ui sidebar | CLI-installed | Sidebar navigation primitive | Active state, collapsible behavior |
| next/font | bundled with Next.js 16 | Font optimization | Inter + Noto Sans JP variable fonts |
| tw-animate-css | latest | CSS animations | Sidebar transitions |
| framer-motion | (reference app uses it) | Panel slide animations | Recording panel, record panel open/close |

### Alternatives Considered
| Instead of | Could Use | Verdict |
|------------|-----------|---------|
| framer-motion (recording panel) | CSS transitions | Reference app uses framer-motion for the recording panel morph intro — replicate exactly for visual match |
| next-themes class mode | Manual body class | next-themes handles SSR hydration correctly; `suppressHydrationWarning` required on `<html>` |
| CSS custom variant dark | Tailwind v4 `@media` default | Must use `@custom-variant dark (&:where(.dark, .dark *))` — the reference app confirms this pattern |

**No new installations required for Phase 6.**

---

## Architecture Patterns

### Verified Layout Structure (from synqdev/karute)

The reference app's dashboard layout is the target structure for the karute app:

```
src/
├── app/
│   ├── layout.tsx                    # Root: ThemeProvider + Toaster (no locale here)
│   │   └── <html suppressHydrationWarning>
│   │       <body>{/* next-themes handles class injection */}</body>
│   └── [locale]/
│       ├── layout.tsx                # NextIntlClientProvider (messages passed here)
│       └── (app)/
│           ├── layout.tsx            # DashboardLayout: Sidebar + TopBar + main
│           └── [all pages]/
├── components/
│   ├── layout/
│   │   ├── sidebar.tsx               # Icon-only vertical sidebar (90px wide)
│   │   ├── top-bar.tsx               # Theme toggle + locale toggle + staff switcher
│   │   └── record-panel.tsx          # Slide-in recording panel (absolute position)
│   └── providers/
│       ├── theme-provider.tsx        # next-themes wrapper
│       └── org-provider.tsx          # Active staff context (cookie-persisted)
├── messages/
│   ├── en.json                       # All English UI strings
│   └── ja.json                       # All Japanese UI strings
└── app/globals.css                   # @theme inline tokens, @custom-variant dark, .dark {}
```

### Pattern 1: Dark Theme Token System (Tailwind v4)

**What:** All color values live as CSS custom properties in `globals.css`. Tailwind utility classes reference these via `@theme inline`. The `.dark` class on `<html>` activates overrides.

**Verified source:** `synqdev/karute` globals.css (confirmed matches Tailwind v4 official docs pattern).

```css
/* src/app/globals.css */
@import "tailwindcss";
@import "tw-animate-css";

/* Class-based dark mode — required for next-themes */
@custom-variant dark (&:where(.dark, .dark *));

/* Wire CSS vars into Tailwind token namespace */
@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-border: var(--border);
  --color-destructive: var(--destructive);
  --radius-lg: var(--radius);
  /* ...all shadcn tokens... */
}

/* Light mode values */
:root {
  --background: oklch(1 0 0);
  --foreground: oklch(0.145 0 0);
  --card: oklch(1 0 0);
  --primary: oklch(0.205 0 0);
  --radius: 0.625rem;
}

/* Dark mode overrides */
.dark {
  --background: oklch(0.145 0 0);
  --foreground: oklch(0.985 0 0);
  --card: oklch(0.205 0 0);
  --border: oklch(1 0 0 / 10%);
  --input: oklch(1 0 0 / 15%);
}
```

**The reference app's actual dark background values:**
- Page background: `bg-[#2a2a2a]` (hardcoded — not using token)
- Sidebar: `bg-[#4a4a4a]` (hardcoded)
- Content area: `bg-white dark:bg-[#3a3a3a]` (hardcoded)
- Outer wrapper: `bg-[#e8e8e8] dark:bg-[#2a2a2a] p-3` (padded, rounded layout)

**Critical:** The reference app uses a mix of shadcn token classes (`text-muted-foreground`, `border-border`) AND hardcoded hex values for the overall layout shell. Phase 6 must match this hybrid approach for visual consistency.

### Pattern 2: Locale Toggle (next-intl v4)

**What:** Client component reads current locale, calls `router.replace(pathname, { locale: next })` from the typed navigation layer.

**Source:** `synqdev/karute` top-bar.tsx (confirmed against next-intl official docs).

```typescript
// src/components/layout/top-bar.tsx
'use client'
import { useLocale } from 'next-intl'
import { useRouter, usePathname } from '@/i18n/navigation'  // typed navigation

export function LocaleToggle() {
  const locale = useLocale()
  const router = useRouter()
  const pathname = usePathname()  // returns path WITHOUT locale prefix

  function toggleLocale() {
    const next = locale === 'ja' ? 'en' : 'ja'
    router.replace(pathname as Parameters<typeof router.replace>[0], { locale: next })
  }

  return (
    <button onClick={toggleLocale} type="button">
      {locale === 'ja' ? 'JP/EN' : 'EN/JP'}
    </button>
  )
}
```

**Critical:** Import `useRouter` and `usePathname` from `@/i18n/navigation` (the typed navigation layer), NOT from `next/navigation` — the typed layer handles locale prefix injection automatically.

### Pattern 3: Theme Toggle (next-themes)

**What:** Root layout wraps everything in `ThemeProvider`. Toggle calls `setTheme()`. `suppressHydrationWarning` on `<html>` prevents SSR mismatch.

**Source:** `synqdev/karute` theme-provider.tsx + root layout.

```typescript
// src/components/providers/theme-provider.tsx
'use client'
import { ThemeProvider as NextThemesProvider } from 'next-themes'

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem={false}
    >
      {children}
    </NextThemesProvider>
  )
}
```

```typescript
// src/app/layout.tsx (root)
export default function RootLayout({ children }) {
  return (
    <html suppressHydrationWarning>  {/* Required — next-themes injects .dark here */}
      <body className={`${inter.variable} ${notoSansJP.variable} font-sans antialiased`}>
        <ThemeProvider>
          {children}
        </ThemeProvider>
        <Toaster />  {/* sonner — outside providers, at body level */}
      </body>
    </html>
  )
}
```

### Pattern 4: Bilingual Fonts (Inter + Noto Sans JP)

**What:** Two `next/font` variables applied to `<body>` via CSS variables. CSS then chains fallbacks so Japanese glyphs fall through to Noto Sans JP.

**Source:** Next.js official docs (version 16.1.6, lastUpdated 2026-02-27).

```typescript
// src/app/layout.tsx
import { Inter, Noto_Sans_JP } from 'next/font/google'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
})

const notoSansJP = Noto_Sans_JP({
  subsets: ['latin'],  // 'japanese' subset exists but requires weight specification
  weight: ['400', '500', '700'],
  variable: '--font-noto-sans-jp',
})

// In globals.css @theme:
// --font-sans: var(--font-inter), var(--font-noto-sans-jp), ui-sans-serif, system-ui;
```

**Note:** Noto Sans JP is not a variable font — must specify explicit weights. The `japanese` subset is available but significantly increases bundle size. For a salon app used in Japan, include it: `subsets: ['latin', 'japanese']`.

### Pattern 5: Sidebar Navigation with Active State

**What:** The reference app implements a custom icon-only sidebar (90px wide, `bg-[#4a4a4a]`), NOT the shadcn Sidebar primitive. It uses `usePathname()` from `@/i18n/navigation` to detect active route, applies `text-white` vs `text-white/60` classes.

**Source:** `synqdev/karute` sidebar.tsx.

The Phase 6 plan calls for "shadcn Sidebar" — this needs a decision: replicate the reference app's custom sidebar exactly, or use the shadcn primitive. Research supports either, but the reference app's custom implementation is simpler and already proven for this use case.

```typescript
// Reference app pattern (custom sidebar):
const activeId = NAV_ROUTES.find((r) => pathname.startsWith(r.href))?.id ?? 'dashboard'

// Each nav button:
className={`flex w-full flex-col items-center gap-1 px-2 py-3 transition ${
  active ? 'text-white' : 'text-white/60 hover:text-white/90'
}`}
```

If using shadcn `SidebarMenuButton`:
```typescript
// shadcn Sidebar pattern (alternative):
<SidebarMenuButton asChild isActive={pathname.startsWith(item.href)}>
  <Link href={item.href}>
    <item.icon />
    <span>{item.label}</span>
  </Link>
</SidebarMenuButton>
```

**Known bug:** shadcn Sidebar has a bug where `isActive={false}` (explicit false) activates styles because `data-active=false` matches `data-active:bg-sidebar-accent`. The fix: only pass `isActive` as `true` when active, omit the prop when inactive (letting it default to `undefined`).

### Pattern 6: Translation File Structure

**What:** All UI strings in `messages/en.json` and `messages/ja.json`. Structure mirrors namespaces used in `useTranslations('namespace')`. Pages from Phases 1-5 each need their namespaces.

**Source:** `synqdev/karute` messages/en.json (provides the full template).

Required namespaces for this app (based on phase scope):

| Namespace | Used By |
|-----------|---------|
| `common` | Shared buttons/labels across all pages |
| `auth` | Login page |
| `sidebar` | Sidebar nav labels + logout |
| `recording` | Recording panel |
| `customers` | Customer list + profile pages |
| `customerForm` | New customer sheet |
| `karute` | Karute list + detail pages |
| `settings` | Settings page (staff management) |

AI outputs (transcript text, AI summary, karute entry content) are stored in the database in the language they were produced — they do NOT go through `t()`. The locale toggle only affects UI chrome.

### Pattern 7: Tablet Responsive Layout

**What:** The reference app's dashboard layout uses `flex h-screen flex-col p-3` with a fixed 90px sidebar and flex-1 main content. This holds at 1024px (landscape tablet). The main concern is the recording panel (360px wide absolute) and the overall content area.

**Key breakpoints:**
- 1024px and above: sidebar visible, full layout
- Below 768px: sidebar collapses (reference app has no explicit mobile handling — the new app needs to add this)

**Touch targets:** Minimum 44x44px for all interactive elements (iOS HIG standard). The reference app uses `py-3 px-2` on 90px-wide sidebar buttons, which gives ~44px height naturally.

```css
/* Tablet-safe minimum touch target utility — add to globals.css if needed */
.touch-target {
  min-height: 44px;
  min-width: 44px;
}
```

### Anti-Patterns to Avoid

- **Importing `useRouter`/`usePathname` from `next/navigation`:** Always import from `@/i18n/navigation` in components that need locale-aware routing. The typed navigation layer from `createNavigation(routing)` handles locale prefix injection.
- **Wrapping AI output strings in `t()`:** Database content (transcript, summary, entry text) is not translatable UI copy — it's user-generated content in a specific language. Only wrap static UI chrome in `t()`.
- **Using `isActive={false}` on `SidebarMenuButton`:** Omit the prop when not active to avoid the `data-active=false` bug. Only pass `isActive={true}` when the route is active.
- **Missing `suppressHydrationWarning` on `<html>`:** next-themes injects `.dark` class server-side; without this attribute React will complain about server/client mismatch.
- **Hardcoding color hex values in new components:** Use shadcn token classes (`bg-card`, `text-muted-foreground`) for new page content. The reference app's hardcoded hex values (`#2a2a2a`, `#4a4a4a`) are only for the layout shell that needs to match the mockup exactly.
- **Putting `ThemeProvider` inside the `[locale]` layout:** It must be in the root `app/layout.tsx` body so it wraps all routes including login.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Locale switching | Custom URL manipulation | `router.replace(pathname, { locale })` from `@/i18n/navigation` | The typed navigation layer handles locale prefix, cookie, and history correctly |
| Dark mode persistence | Custom localStorage + useEffect | `next-themes` ThemeProvider | Handles SSR hydration, system preference detection, and class injection without FOUC |
| Sidebar active state detection | Exact match comparison | `pathname.startsWith(item.href)` | Handles sub-routes correctly (e.g., `/customers/123` stays active on `/customers` nav item) |
| Touch-friendly modal on tablet | Custom bottom sheet | shadcn Sheet with `side="bottom"` | handles focus trap, accessibility, touch dismiss natively |
| Font loading with Japanese subset | Custom @font-face | `next/font/google` with Noto Sans JP | Self-hosting, zero layout shift, automatic subset splitting |

**Key insight:** Every major concern in Phase 6 (dark mode, locale switching, sidebar active state, font loading) already has a battle-tested library handling the hard parts. The work is configuration and wiring, not implementation.

---

## Common Pitfalls

### Pitfall 1: Locale Stacking in URLs
**What goes wrong:** Switching locale from `/en/customers` produces `/en/ja/customers` instead of `/ja/customers`.
**Why it happens:** If you import `usePathname` from `next/navigation` instead of `@/i18n/navigation`, the returned pathname includes the locale prefix. When passed to `router.replace`, the locale segment doubles up.
**How to avoid:** Always import `usePathname` and `useRouter` from `@/i18n/navigation` in any component that does locale switching.
**Warning signs:** URL has two locale segments (`/en/ja/...`) after switching.

### Pitfall 2: Theme Flash on Initial Load
**What goes wrong:** Page loads in light mode for a split second before switching to dark.
**Why it happens:** Missing `suppressHydrationWarning` on `<html>`, or ThemeProvider placed inside a client component boundary that renders after hydration.
**How to avoid:** Add `suppressHydrationWarning` to `<html>` tag in root layout. Keep ThemeProvider as the outermost wrapper in root layout body.
**Warning signs:** Visible white flash on every hard reload or navigation in dark mode.

### Pitfall 3: Translation Namespace Mismatch
**What goes wrong:** `useTranslations('recording')` works but `t('title')` returns a key string instead of text.
**Why it happens:** JSON key path doesn't match what the component calls. For example, calling `t('recording.title')` when the namespace is already `recording` (so it would look up `recording.recording.title`).
**How to avoid:** `useTranslations('recording')` + `t('title')` — the namespace is the first argument, the key is the second. Never nest namespace in the key string.
**Warning signs:** UI shows raw key strings like `"recording.title"` instead of translated text.

### Pitfall 4: Missing Translation Keys for New Pages
**What goes wrong:** Pages from Phases 3-5 (customers, karute, settings) don't have translation keys, so toggling locale shows key strings on those pages.
**Why it happens:** Translation files were set up in Phase 1 but may not include namespaces for pages built in later phases.
**How to avoid:** In task 06-02, audit ALL pages built in Phases 1-5 and ensure every UI string has a key in both `en.json` and `ja.json`. The reference app's `en.json` is a complete template — use it as the baseline.
**Warning signs:** Switching to Japanese on settings page shows English or raw key strings.

### Pitfall 5: shadcn SidebarMenuButton isActive Bug
**What goes wrong:** Inactive sidebar items appear with active background color.
**Why it happens:** Passing `isActive={false}` sets `data-active="false"` on the element, which Tailwind matches as truthy for `data-active:` variants.
**How to avoid:** Only set `isActive` when the value is `true`. Omit the prop entirely (or use `isActive={undefined}`) for inactive items.
**Warning signs:** All sidebar nav items look "selected" at once.

### Pitfall 6: Touch Targets Too Small on Tablet
**What goes wrong:** Buttons are difficult to tap accurately on a touchscreen.
**Why it happens:** shadcn defaults and compact icon-only sidebar use small hit areas that are fine with a mouse but difficult with a finger.
**How to avoid:** Ensure all interactive elements have `min-h-[44px] min-w-[44px]`. Sidebar nav buttons at 90px width with `py-3` are typically fine. Icon-only buttons in forms and tables need padding added explicitly.
**Warning signs:** Tapping the wrong button on tablet frequently.

### Pitfall 7: Noto Sans JP Not Loading Japanese Glyphs
**What goes wrong:** Japanese text renders in a fallback CJK font instead of Noto Sans JP.
**Why it happens:** Noto Sans JP configured with only `subsets: ['latin']` — Japanese glyphs are in the `japanese` subset which must be explicitly requested.
**How to avoid:** Configure with both `subsets: ['latin', 'japanese']` and explicit `weight` array (not `variable` — Noto Sans JP is not a variable font).
**Warning signs:** Japanese text appears noticeably different from expected Noto Sans JP rendering; incorrect stroke weight.

---

## Code Examples

Verified patterns from the synqdev/karute reference codebase and official docs:

### Dashboard Layout Shell
```typescript
// Source: synqdev/karute src/app/[locale]/(dashboard)/layout.tsx
export default function DashboardLayout({ children }) {
  return (
    <OrgProvider>
      <RecordPanelProvider>
        <div className="flex h-screen flex-col bg-[#e8e8e8] p-3 dark:bg-[#2a2a2a]">
          <div className="flex items-center justify-end px-4 py-1">
            <TopBar />
          </div>
          <div className="flex flex-1 gap-3 min-h-0">
            <div className="relative">
              <Sidebar />
              <RecordPanel />
            </div>
            <main className="relative flex-1 overflow-y-auto rounded-[28px] bg-white dark:bg-[#3a3a3a]">
              <div className="mx-auto max-w-7xl p-6">{children}</div>
            </main>
          </div>
        </div>
      </RecordPanelProvider>
    </OrgProvider>
  )
}
```

### Locale Toggle in TopBar
```typescript
// Source: synqdev/karute src/components/layout/top-bar.tsx
'use client'
import { useLocale } from 'next-intl'
import { useRouter, usePathname } from '@/i18n/navigation'

function toggleLocale() {
  const next = locale === 'ja' ? 'en' : 'ja'
  router.replace(pathname as Parameters<typeof router.replace>[0], { locale: next })
}
```

### Sidebar Nav with Active Detection
```typescript
// Source: synqdev/karute src/components/layout/sidebar.tsx
const NAV_ROUTES = [
  { id: 'recording', href: '/recording', labelKey: 'recording', iconKey: 'recording' },
  { id: 'customers', href: '/customers', labelKey: 'customers', iconKey: 'customers' },
  { id: 'karute', href: '/karute', labelKey: 'karute', iconKey: 'karute' },
  { id: 'settings', href: '/settings', labelKey: 'settings', iconKey: 'settings' },
]

const activeId = NAV_ROUTES.find((r) => pathname.startsWith(r.href))?.id

// Button className:
className={`flex w-full flex-col items-center gap-1 px-2 py-3 transition ${
  route.id === activeId ? 'text-white' : 'text-white/60 hover:text-white/90'
}`}
```

### ThemeProvider Setup
```typescript
// Source: synqdev/karute src/components/providers/theme-provider.tsx
'use client'
import { ThemeProvider as NextThemesProvider } from 'next-themes'

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider attribute="class" defaultTheme="dark" enableSystem={false}>
      {children}
    </NextThemesProvider>
  )
}
```

### Bilingual Font Setup
```typescript
// Source: Next.js official docs (v16.1.6, lastUpdated 2026-02-27)
import { Inter, Noto_Sans_JP } from 'next/font/google'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
})

const notoSansJP = Noto_Sans_JP({
  subsets: ['latin', 'japanese'],
  weight: ['400', '500', '700'],
  variable: '--font-noto-sans-jp',
})

// Root layout:
<html suppressHydrationWarning>
  <body className={`${inter.variable} ${notoSansJP.variable} font-sans antialiased`}>
```

```css
/* globals.css @theme: */
@theme inline {
  --font-sans: var(--font-inter), var(--font-noto-sans-jp), ui-sans-serif, system-ui;
}
```

### Translation Usage (Client Component)
```typescript
// Source: next-intl official docs
'use client'
import { useTranslations } from 'next-intl'

export function CustomerListHeader() {
  const t = useTranslations('customers')  // namespace
  return (
    <div>
      <h1>{t('title')}</h1>                    // → "Customers" / "顧客"
      <button>{t('new')}</button>              // → "+ New Customer" / "新規顧客"
    </div>
  )
}
```

### Translation Usage (Server Component)
```typescript
// Source: next-intl official docs
import { getTranslations } from 'next-intl/server'

export default async function CustomerPage() {
  const t = await getTranslations('customers')
  return <h1>{t('title')}</h1>
}
```

---

## State of the Art

| Old Approach | Current Approach | Impact |
|--------------|------------------|--------|
| `darkMode: 'class'` in tailwind.config.js | `@custom-variant dark (&:where(.dark, .dark *))` in globals.css | Tailwind v4 CSS-first; no JS config |
| HSL color values in CSS vars | OKLCH color values | Perceptually uniform; reference app uses oklch() |
| `tailwindcss-animate` | `tw-animate-css` imported in globals.css | tailwindcss-animate incompatible with v4 |
| `middleware.ts` for next-intl locale routing | `proxy.ts` | Already handled in Phase 1 — do not re-introduce middleware.ts |
| `useTranslations` only in Client Components | Works in both Server and Client Components | Use `getTranslations` (async) for Server Components, `useTranslations` for client |

---

## Open Questions

1. **Custom sidebar vs shadcn Sidebar primitive**
   - What we know: The phase plan says "shadcn Sidebar" but the reference app uses a custom 90px icon sidebar that does not use the shadcn Sidebar primitive
   - What's unclear: Whether the planner intends to use shadcn's `<Sidebar>` component or replicate the reference app's custom sidebar
   - Recommendation: Replicate the reference app's custom sidebar exactly — it's 90px, icon-only with labels, `bg-[#4a4a4a]`, no collapse mechanism needed for tablet since content area still fits at 1024px. Use the shadcn `collapsible="icon"` approach only if the product decision changes to a wider sidebar with labels.

2. **framer-motion dependency**
   - What we know: The reference app's recording panel uses framer-motion for its morph intro animation and slide-in behavior; Phase 1 may or may not have installed it
   - What's unclear: Whether framer-motion was included in Phase 1's installation
   - Recommendation: Check `package.json` before Phase 6 begins; add `npm install framer-motion` if missing. The recording panel animation is part of the Phase 1 work (recording modal), not Phase 6, but if Phase 6 rebuilds the panel it needs this dependency.

3. **Japanese subset size impact on build**
   - What we know: Noto Sans JP with the `japanese` subset is large; next/font self-hosts it and splits by unicode range
   - What's unclear: Whether the reference app uses the `japanese` subset or relies on OS fallback fonts for Japanese characters
   - Recommendation: Include `japanese` subset — next/font's unicode-range subsetting means only glyphs actually used on a page are downloaded. For a Japanese-facing salon app this is the correct choice.

4. **Translation completeness for AI-generated content**
   - What we know: AI outputs (transcript, summary, entry content) are not translatable UI strings
   - What's unclear: Whether category labels (SYMPTOM, TREATMENT, etc.) stored as enum values in the database need translation keys — they do appear in the UI as badges
   - Recommendation: Yes — category badges are UI labels, not AI-generated content. Add them to `en.json` under `karute.categories` (matching the reference app's pattern). The database stores the enum key; the UI displays `t('karute.categories.SYMPTOM')`.

---

## Sources

### Primary (HIGH confidence)
- `github.com/synqdev/karute` — Working reference codebase; all layout components, globals.css tokens, translation files, and locale toggle pattern verified directly from source
- https://next-intl.dev/docs/routing/navigation — Locale switching via `router.replace(pathname, { locale })` from typed navigation
- https://next-intl.dev/docs/environments/server-client-components — `useTranslations` vs `getTranslations`, server/client usage
- https://tailwindcss.com/docs/dark-mode — `@custom-variant dark (&:where(.dark, .dark *))` for class-based dark mode in v4
- https://nextjs.org/docs/app/getting-started/fonts (v16.1.6, lastUpdated 2026-02-27) — `next/font/google` with multiple fonts and variable CSS
- https://ui.shadcn.com/docs/components/sidebar — `isActive` prop, `collapsible="icon"`, `SidebarProvider`, `useSidebar` hook

### Secondary (MEDIUM confidence)
- https://github.com/shadcn-ui/ui/issues/9134 — `isActive={false}` bug with `data-active` attribute activating styles; fix is to omit prop when false

### Tertiary (LOW confidence — flag for validation)
- Framer-motion installation in Phase 1: Not verified from Phase 1 research/plans — check package.json before Phase 6 starts.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — verified from synqdev/karute working production code and official library docs
- Architecture patterns: HIGH — all patterns traced directly to the reference app source files
- Translation structure: HIGH — complete `en.json` and `ja.json` reviewed from reference app
- Pitfalls: HIGH — all based on either official bug reports or patterns confirmed broken in official docs
- Tablet responsive: MEDIUM — touch target minimums from official iOS HIG (44x44px); specific breakpoint behavior at 1024px is validated against the reference app's layout math but not tested on physical device

**Research date:** 2026-03-13
**Valid until:** 2026-04-13 (30 days — all libraries are in stable release cycles; next-intl v4 and Tailwind v4 are both stable)
