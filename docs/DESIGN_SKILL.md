# trackio Portal — Design Skill

> **This file is authoritative.** Every agent building or editing any UI in this project must read and follow every rule in this document before touching a single component, layout, form, or style.

---

## 0. Quick Reference — Most Common Rules

| Thing you're touching | Rule |
|---|---|
| Button | `rounded-full`, use `<Button variant="...">` — never custom button styles |
| Card | `<Card>` with `rounded-[20px]` glass surface — never plain `<div>` with ad-hoc borders |
| Input / Select | `rounded-full`, min-h-[44px], glass frosted surface — use `<Input>` / `<select>` with shared classes |
| Modal | `<Modal>` — `rounded-[20px]`, glass, focus-trapped, keyboard-dismissible |
| Page heading | `text-[28px] sm:text-[32px] font-bold leading-tight tracking-tight text-shark-900 dark:text-white` (Exo font) |
| Section label | `text-[11px] font-bold uppercase tracking-widest text-shark-500` |
| Body text | `text-sm text-shark-700 dark:text-shark-300` (Manrope font) |
| Spacing unit | 4px base — use `gap-4`, `gap-6`, `p-5 sm:p-6`, never arbitrary pixel values |
| Touch target | Always `min-h-[44px]` on every clickable element — no exceptions on mobile |
| Primary action colour | `#0057FF` (action-500) — never use blue shades outside this scale |
| Danger | `red-500` / `bg-red-50 text-red-700` — always pair with confirmation dialog |
| Animation | `cubic-bezier(0.22, 1, 0.36, 1)` spring — 220ms base, staggered 40/80/120ms |
| Dark mode | `dark:` classes only — never `@media (prefers-color-scheme)` — theme is class-driven |
| Empty state | Use `<EmptyState>` component — never roll a custom one |
| Loading state | Use `<PageSkeleton>` or `<Skeleton>` — never `animate-pulse` raw divs |

---

## 1. Brand Tokens — Authoritative Colour Palette

All colours come from the design token set in `globals.css`. **Never use raw hex values that fall outside these scales.**

### Action (Primary Interactive Colour)
```
action-50:  #eef2ff   ← tinted backgrounds, hover fills
action-100: #dde6ff   ← badge backgrounds
action-200: #b3c9ff   ← chart series 3
action-300: #80a8ff   ← chart series 2
action-400: #4d83ff   ← chart series 1, focus rings
action-500: #0057FF   ← primary buttons, active nav, links (THE brand blue)
action-600: #004de0   ← button pressed state
action-700: #003fba   ← deep interactive
action-800: #003294   ← rarely used
action-900: #00246e   ← rarely used
action-950: #00163d   ← darkest, rare
```
Interactive text: `text-[#1259C3]` on hover (slightly lighter than action-500 on white).

### Shark (Neutral / Text / Surface)
```
shark-50:  #f9f9fb   ← lightest background, hover fill on white surfaces
shark-100: #e2e3e5   ← dividers, subtle borders
shark-200: #c5c7cb   ← disabled states, placeholder borders
shark-300: #8b8f96   ← breadcrumb separators, muted icons
shark-400: #6b7080   ← placeholder text, inactive icons
shark-500: #616570   ← body secondary text, inactive nav labels
shark-600: #4d505a   ← body text on white
shark-700: #3f424a   ← body text, form labels
shark-800: #35373e   ← dark mode surface 2
shark-900: #292d34   ← page headings, dark mode text, dark mode surface 1
shark-950: #1a1c21   ← darkest surface (dark mode background)
```

### Navy (Brand Accent — use sparingly)
```
navy-500: #3b487d   ← stat card accents, branded elements
navy-900: #0f1b3d   ← hero elements, deep brand moments
```

### Gold (Brand Accent — use sparingly)
```
gold-400: #c9a84c   ← premium badges, "high value" markers
gold-500: #b8953f   ← subtle highlights
```

### Semantic Colours
```
Red (danger):   red-50/red-500  ← destructive actions, error states, critical alerts
Amber:          amber-50/amber-700  ← warnings, "proceed with caution"
Emerald:        emerald-50/emerald-700  ← success, active/healthy states
Purple:         purple-50/purple-700  ← informational accents (reporting)
```

---

## 2. Typography System

### Fonts
- **Exo** (`font-exo`) — all headings (h1, h2, h3, card titles, section labels)
- **Manrope** (`font-manrope`) — body text, descriptions, labels, table data
- Base font size: **16px** locked (prevents mobile OS zoom-induced layout shift)

### Type Scale — Use exactly these, do not invent new sizes

| Role | Classes | Font |
|---|---|---|
| Page title (h1) | `text-[28px] sm:text-[32px] font-bold leading-tight tracking-tight text-shark-900 dark:text-white` | Exo |
| Modal / sheet title (h2) | `text-lg font-bold tracking-tight text-shark-900 dark:text-shark-100` | Exo |
| Card / section title (h3) | `text-base font-bold tracking-tight text-shark-900 dark:text-white` | Exo |
| Section group label | `text-[11px] font-bold uppercase tracking-widest text-shark-500 dark:text-shark-400` | Exo |
| Body (default) | `text-sm text-shark-700 dark:text-shark-300` | Manrope |
| Body secondary | `text-sm text-shark-500 dark:text-shark-400` | Manrope |
| Small / meta | `text-xs text-shark-500 dark:text-shark-400` | Manrope |
| Micro / badge | `text-[10px] font-semibold tracking-wide` | Manrope |
| Stat number | `text-2xl sm:text-3xl font-bold tabular-nums` | Exo |
| Link | `text-[#1259C3] hover:underline transition-colors` | — |

### Rules
- Never mix Exo on body or Manrope on headings.
- All headings use `tracking-tight`.
- Section labels always use `uppercase tracking-widest`.
- Numbers in data displays always use `tabular-nums` (prevents layout jitter).
- Truncate long text with `truncate` rather than wrapping to multiple lines inside compact UI.

---

## 3. Spacing System

The base unit is **4px** (Tailwind default). All spacing must be a multiple of 4.

### Layout Spacing

| Context | Value |
|---|---|
| Page content top padding | `pt-6 lg:pt-8` |
| Content bottom padding (above mobile nav) | `pb-24 lg:pb-8` |
| Section-to-section gap | `space-y-6` or `gap-6` |
| Card-to-card gap in a grid | `gap-4` or `gap-6` |
| Card inner padding | `p-5 sm:p-6` (md) / `p-4 sm:p-5` (sm) / `p-6 sm:p-8` (lg) |
| Form field gap | `space-y-4` or `space-y-6` |
| Label-to-input gap | `space-y-1.5` |
| Icon-to-label gap | `gap-2` or `gap-2.5` |
| Badge padding | `px-2.5 py-0.5` (small) / `px-3 py-1` (standard) |

### Grid Layout

| Pattern | Classes |
|---|---|
| Stat cards | `grid grid-cols-2 lg:grid-cols-4 gap-4` |
| 2-column content | `grid grid-cols-1 md:grid-cols-2 gap-6` |
| 3-column content | `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6` |
| Full-width card | `w-full` |

---

## 4. Surface & Card Design

### The Glass Principle
All surfaces in this app use a **frosted glass aesthetic** (One UI inspired). Cards, modals, inputs, and nav bars are translucent, blurred, and subtly bordered — they feel light, layered, and premium.

**Never use a plain white flat div with a grey border as a card. Always use the Card component or the glass-card utility.**

### Card Variants (use `<Card variant="...">`)
```
default:  glass-card — frosted white/rgba(255,255,255,0.75), blur(20px) sat(1.8), white border
          dark: bg-shark-900/70 border-white/[0.07]
flat:     bg-white/40 backdrop-blur, border-white/50 — for nested or secondary cards
elevated: glass-card + stronger shadow — use for focal/hero cards
ghost:    bg-transparent — for invisible layout containers
```

### Border Radius Scale
These specific values are intentional and must not be changed:
```
rounded-[20px]  ← Cards, modals, modal containers, skeleton placeholders, inner panels
rounded-[14px]  ← Sidebar nav items, icon wrappers
rounded-[10px]  ← Small action buttons within cards
rounded-full    ← All buttons, inputs, badges, pills
```

### Card Composition Rules
- Card header: `flex items-center justify-between gap-4 mb-4`
- Card title: `text-base font-bold text-shark-900 dark:text-white tracking-tight` (Exo)
- Card dividers: `border-t border-white/55 dark:border-white/[0.08]`
- Stat highlight row inside card: colored top border `border-t-2 border-t-action-500`
- Never put a card inside a card's `default` variant — use `flat` or `ghost` for nesting.

---

## 5. Button Styles

**Always use the `<Button>` component. Never write custom button styles.**

### Variants
```
primary:   bg-[#0057FF] text-white hover:bg-[#1A6BFF] active:bg-[#004DE0]  ← main CTA
secondary: bg-[#f5f5f7] dark:bg-shark-800 text-[#1d1d1f] dark:text-shark-100  ← supporting action
danger:    bg-red-500 text-white hover:bg-red-600  ← destructive (delete, archive)
ghost:     hover:bg-[#f5f5f7] dark:hover:bg-shark-800 text-shark-600  ← tertiary / icon-only buttons
outline:   border border-[#d2d2d7] bg-white text-[#1d1d1f]  ← alternative to secondary
```

### Sizes
```
sm: px-4 py-2 text-xs min-h-[44px] sm:min-h-[34px]
md: px-5 py-2.5 text-sm min-h-[44px] sm:min-h-[42px]
lg: px-7 py-3 text-sm min-h-[52px] sm:min-h-[48px]
```

### Universal Button Rules
- All buttons are `rounded-full` — no exceptions.
- All buttons have `active:scale-[0.97]` press feedback built in.
- All buttons have `focus-visible:ring-2 focus-visible:ring-[#0057FF]/40` keyboard ring.
- All buttons are `disabled:opacity-50 disabled:pointer-events-none`.
- Minimum touch target: `min-h-[44px]` on mobile — never smaller.
- Add `loading` prop (shows spinner) instead of custom loading states inside buttons.
- Destructive actions (delete, archive, force-delete) always use `variant="danger"` and must be preceded by a confirmation dialog.

### Button Placement Rules
- Primary CTA = rightmost in a row of buttons.
- Cancel/secondary = left of primary.
- Destructive = separate from primary, visually distanced or behind confirmation.
- Floating action: use `<QuickActionsFab>` or the bottom-right FAB pattern — not a random fixed button.

---

## 6. Form Styles

**Always use `<FormField>` + `<Input>` components. Never write raw `<input>` elements without shared styles.**

### Input
```
rounded-full
border border-white/60 dark:border-white/[0.10]
bg-white/50 dark:bg-shark-800/60
backdrop-blur-[20px]
px-4 py-2.5 text-base sm:text-sm
min-h-[44px]
placeholder-shark-400
focus:border-[#0071e3]/40
focus-visible:ring-2 focus-visible:ring-[#0071e3]/20
focus:shadow-[0_0_0_4px_rgba(0,113,227,0.08)]
transition-all duration-200
```

### Select / Dropdown
- Same frosted glass styling as Input.
- Never use the browser default unstyled `<select>`.
- Use `<select>` with the same rounded-full + glass class pattern as Input, or a custom `<PortalDropdown>`.

### Textarea
- `rounded-[20px]` (not rounded-full — allows multi-line content to breathe).
- Same glass frosted surface as Input.
- `resize-none` — disable resize handle; set a fixed min-h instead.

### FormField Rules
- Label: `text-sm font-semibold text-shark-700 dark:text-shark-200`
- Required marker: `text-red-400` asterisk after label
- Error: `text-sm text-red-500` below input
- Hint: `text-sm text-shark-400` below input (only shows when no error)
- Gap between fields: `space-y-4` or `space-y-6` inside a form

### Form Layout
- Single-column forms: `max-w-xl` or `max-w-2xl` — never full-width on desktop
- Two-column grids for related fields (e.g. lat/long, first/last name): `grid grid-cols-1 sm:grid-cols-2 gap-4`
- Submit button always at the bottom right: `flex justify-end pt-2`
- Form sections should be wrapped in `<Card>` with a `<CardHeader>` separator

---

## 7. Modal & Dialog Design

**Always use the `<Modal>` component. Never build custom modal overlays.**

### Anatomy
```
Overlay:   fixed inset-0 z-50 bg-black/30 backdrop-blur-md
Container: rounded-[32px] backdrop-blur-2xl bg-white/72 dark:bg-shark-800/80
           border border-white/70 dark:border-white/[0.08]
           shadow-[0_2px_40px_rgba(100,140,220,0.24)]
           max-h-[85vh] sm:max-h-[90vh] overflow-y-auto
Header:    border-b border-white/55 dark:border-white/[0.08] px-5 sm:px-6 py-4
Body:      px-4 sm:px-6 py-4
```

### Modal Behaviour Rules
- ESC key closes the modal — built into `<Modal>`.
- Focus is trapped inside — built into `<Modal>`.
- Clicking the overlay backdrop closes the modal.
- Previous focus is restored on close.
- `aria-labelledby` and `role="dialog"` are required — built into `<Modal>`.
- Scroll is disabled on `<body>` while modal is open.
- Mobile: modal fills near-full-width (`w-[calc(100vw-1rem)]`), max-h constrained.

### Confirmation Dialog Rules
- Use `<Modal>` with a `<ConfirmDialog>` inner pattern — or the `confirm-dialog.tsx` component.
- Destructive confirmations must:
  1. Name the item being affected (e.g. "Delete **Cairns North**?")
  2. Explain consequences in plain English ("This will permanently remove all assets, supplies, and staff in this location.")
  3. Show counts if relevant ("23 assets, 14 supplies, 3 staff members")
  4. Require a `danger` variant button labelled clearly ("Yes, Delete Everything" not just "Delete")
  5. Offer a safe escape ("Cancel" or "Archive Instead")

---

## 8. Navigation & Layout

### Desktop Sidebar
- Fixed left column, 240px wide, full height.
- Nav items: `rounded-[14px] min-h-[44px] px-3`.
- Active: `bg-[#0057FF]/[0.08] text-shark-900 font-semibold` + `text-[#0057FF]` icon.
- Inactive: `text-shark-500 hover:bg-black/[0.04]`.
- Section headings: `text-[11px] font-bold uppercase tracking-[0.10em] text-shark-400`.
- Badge counts: `bg-red-500 text-white rounded-full` pill.

### Mobile Bottom Navigation
- Fixed at bottom: `fixed bottom-0 inset-x-0 z-40`.
- Glass surface: `backdrop-blur-[40px] backdrop-saturate-[180%] bg-white/30 border-white/50`.
- Safe area padding: `safe-bottom` or `pb-[env(safe-area-inset-bottom)]`.
- Active indicator: elastic spring-animated pill (built into `<BottomNav>`).
- Never render a sidebar on mobile — sidebar is `hidden lg:flex`.
- Never render bottom nav on desktop — bottom nav is `lg:hidden`.

### Page Layout Shell
```
<div className="min-h-screen bg-shark-50 dark:bg-shark-950">
  <Sidebar />          {/* lg: fixed left */}
  <main className="lg:pl-60 pb-24 lg:pb-8">
    <div className="px-4 sm:px-6 lg:px-8 py-6 max-w-7xl mx-auto">
      <Breadcrumbs />
      {/* page content */}
    </div>
  </main>
  <BottomNav />        {/* mobile only */}
</div>
```

### Breadcrumbs
- Always rendered via `<Breadcrumbs>` — never write custom breadcrumb HTML.
- H1 page title comes from `<Breadcrumbs>` (last segment, humanised) **or** from the page itself for dynamic routes (raw DB IDs → page renders its own `<h1>`).
- Never render a duplicate `<h1>` alongside breadcrumbs on static routes.

---

## 9. Colour Usage Rules — When to Use What

| Situation | Colour / Class |
|---|---|
| Primary action, main CTA | `action-500` (#0057FF) |
| Active nav / selected state | `bg-action-50 text-action-500` or `bg-action-500/[0.08]` |
| Hover fill on white | `hover:bg-black/[0.04]` or `hover:bg-shark-50` |
| Hover fill on dark | `dark:hover:bg-shark-800/30` |
| Success / healthy | `bg-emerald-50 text-emerald-700` |
| Warning / caution | `bg-amber-50 text-amber-700` |
| Danger / error | `bg-red-50 text-red-700` or `text-red-500` |
| Archived / muted state | `opacity-60` or `text-shark-400` + strikethrough |
| High-value badge | `bg-gold-50 text-gold-600` |
| Info accent | `bg-action-50 text-action-600 border-action-100` |
| Disabled | `opacity-50 pointer-events-none` |
| Border / divider | `border-white/55` (glass) or `border-shark-100` (solid) |

---

## 10. Dashboard Design Rules

### Stat Cards
- Arrange in a `grid grid-cols-2 lg:grid-cols-4 gap-4`.
- Each card: `<Card variant="default" padding="md">` with a colored `border-t-2` top stripe.
- Top stripe colours: action-500, red-500, emerald-500, amber-500 (rotate semantically).
- Icon: `rounded-[14px] bg-{color}-500 text-white p-2.5` — 40×40px icon container.
- Stat number: `text-2xl sm:text-3xl font-bold tabular-nums text-shark-900 dark:text-white` (Exo).
- Label: `text-sm text-shark-500 dark:text-shark-400` (Manrope).
- Trend / delta: small `text-xs` with arrow icon, green or red.

### Activity Feeds
- Each row: `flex items-start gap-3 py-3 border-b border-shark-100/60 dark:border-white/[0.06]`.
- Icon container: `rounded-full w-8 h-8 flex items-center justify-center` in semantic colour.
- Timestamp: `text-xs text-shark-400` right-aligned.
- Never show more than ~20 items without pagination.

### Charts
- Use the established 6-colour palette: `#0057FF`, `#4d83ff`, `#80a8ff`, `#ef4444`, `#6b7280`, `#b3c9ff`.
- Charts must be wrapped in a `<Card>` with a `<CardHeader>` + title.
- Always include a loading state (skeleton) — charts fetch data server-side.

### Dashboard Layout Order (top to bottom)
1. Page H1 (from Breadcrumbs)
2. Stat card grid
3. Alerts / warning banners (if any)
4. Main chart or map
5. Activity feed / recent transactions
6. Quick action links

---

## 11. Empty States

**Always use `<EmptyState>` — never write ad-hoc "no data" messages.**

```tsx
<EmptyState
  icon="box"                          // Icon from lucide set
  title="No assets yet"               // Short, specific
  description="Add your first asset to start tracking it across locations."
  action={{ label: "Add Asset", href: "/assets/new" }}
/>
```

### Rules
- Icon: `rounded-[20px]` glass container, 64×64px, `text-shark-400` icon.
- Title: `text-sm font-semibold text-shark-900`.
- Description: `text-sm text-shark-500 max-w-sm` — 1–2 sentences, plain language.
- Action: primary Button — only include if there is a meaningful next step.
- Padding: `py-16 px-6 text-center` centered in the container.
- Never use images or illustrations for empty states — use icons only.

---

## 12. Loading States

**Use `<PageSkeleton>` and `<Skeleton>` — never use raw `animate-pulse` divs.**

```tsx
// Full page loading (in loading.tsx files)
<PageSkeleton showStats statCount={4} />

// Single card loading
<Skeleton className="h-48 w-full rounded-[28px]" />

// Skeleton stat card
<SkeletonStatCard />
```

### Shimmer Animation
- Use `animate-shimmer` class from globals.css for shimmer effect.
- Skeletons are `bg-shark-200/60 dark:bg-shark-700/40` base.
- Rounded corners on skeletons match the component they represent: `rounded-[28px]` for cards.
- Never show a spinner alone for page-level loading — use skeletons.
- Inline loading inside a button: use `<Button loading>` — shows built-in spinner.
- Table/list row loading: skeleton rows of the same height as real rows.

---

## 13. Error States

### Inline Field Errors
- Below the input via `<FormField error="...">`.
- `text-sm text-red-500 dark:text-red-400`.
- Always explain what's wrong AND what to do: "Name is required" not just "Invalid".

### Page-Level Errors
- Use `<ErrorBoundary>` wrapper for unexpected crashes.
- Server action failures: show an inline error banner at top of form — `bg-red-50 border border-red-200 text-red-700 rounded-[14px] p-3 text-sm`.
- Never use browser `alert()` — always display errors in the UI.

### Toast Notifications
- Success: green pill, top-right, auto-dismisses at 3s.
- Error: red pill, top-right, manual dismiss (stays until dismissed).
- Never use toasts for destructive confirmations — use modals.

---

## 14. Mobile Responsiveness

### Breakpoint Strategy (mobile-first)
```
Default (0+):   mobile layout, single column, bottom nav
sm (640px+):    slight padding/text increases
md (768px+):    2-column grids unlock
lg (1024px+):   sidebar visible, bottom nav hidden, multi-column layouts
xl (1280px+):   max-width cap on content (max-w-7xl)
```

### Mobile-Specific Rules
- All interactive elements: `min-h-[44px]` (Apple/Google HIG minimum).
- Inputs: `font-size: 16px` on mobile to prevent iOS zoom (enforced globally in globals.css).
- Bottom nav safe area: `pb-[env(safe-area-inset-bottom)]` for iPhone notch.
- Tap highlight removed: `-webkit-tap-highlight-color: transparent` (global).
- No horizontal overflow: every component must fit within `max-w-100vw overflow-x: hidden`.
- Tables on mobile: `overflow-x-auto` wrapper with custom thin scrollbar (4px height).
- Modals on mobile: `w-[calc(100vw-1rem)]`, full-width feel.
- Cards on mobile: full-width, no side-by-side layout below `sm`.
- Never rely on hover for core functionality — mobile has no hover.

### Touch Interaction
- Hover effects on touch: handled globally (`@media (hover: none)` — hover → `:active`).
- Swipe gestures: `touch-action: manipulation` on all interactive elements (global).
- 300ms tap delay: removed globally with `touch-action: manipulation`.
- Pull-to-refresh: use `<PullToRefresh>` component — never interfere with native scroll.

---

## 15. Accessibility Standards

### Required for Every Component
- All images: `alt` attribute — empty string `""` for decorative images.
- All icon-only buttons: `aria-label="..."` describing the action.
- All modals: `role="dialog" aria-modal="true" aria-labelledby="..."`.
- All form inputs: associated `<label>` (via `htmlFor` or wrapping label).
- Focus management: modals trap focus; on close, focus returns to trigger.
- Keyboard navigation: all actions reachable via keyboard (Tab + Enter/Space).

### Colour Contrast
- Body text on white: shark-700 (#3f424a) — meets WCAG AA.
- Secondary text on white: shark-500 (#616570) — meets AA for large text.
- Never use shark-300 or lighter for meaningful text on white backgrounds.
- Action links: `#1259C3` on white — meets WCAG AA.

### Focus Styles
- All interactive elements: `focus-visible:ring-2 focus-visible:ring-[#0057FF]/40` (global in globals.css).
- Mouse/touch users see no ring — only keyboard users do (`:focus-visible` selector).
- Never use `outline: none` without providing an alternative focus indicator.

### Motion / Reduced Motion
- All animations respect `@media (prefers-reduced-motion: reduce)` — handled globally in globals.css.
- No component should set its own `animation` or `transition` overriding the global `prefers-reduced-motion` rule.

### Screen Readers
- Use semantic HTML: `<nav>`, `<main>`, `<header>`, `<section>`, `<article>`, `<button>`, `<a>`.
- Status badges: include text content, not just colour.
- Loading states: `aria-busy="true"` on the region being loaded.
- Live regions: use `aria-live="polite"` for dynamic content updates (toast notifications, count changes).

---

## 16. Animation & Micro-Interaction Rules

### Core Easing — One UI Spring
```
cubic-bezier(0.22, 1, 0.36, 1)
```
Use this for all primary animations. It creates a fast, slightly over-shooting spring feel — like Samsung One UI / iOS 16+.

### Timing Reference
```
Instantaneous (state toggle):  0ms     ← checked state, badge count
Micro (hover):                 150ms   ← colour/opacity transitions
Fast (element enter):          220ms   ← page sections, cards, modals
Medium (sheet/modal):          280ms   ← bottom sheets, drawers
Slow (stagger final):          320ms   ← last item in stagger chain
Stagger delay increment:       40ms    ← each subsequent card/item adds +40ms
```

### Standard Animation Classes (from globals.css — use these, don't write custom keyframes)
```
.animate-page-in          ← page enters (translateY + scale + fade, 220ms)
.animate-one-ui-enter     ← card/panel enters (translateY(18px) + scale(0.96) + fade)
.animate-one-ui-enter-1   ← stagger slot 1 (40ms delay)
.animate-one-ui-enter-2   ← stagger slot 2 (80ms delay)
.animate-one-ui-enter-3   ← stagger slot 3 (120ms delay)
.animate-sheet-up         ← bottom sheet slides up (280ms)
.animate-slide-in         ← horizontal slide-in (300ms)
.animate-fade-in          ← simple opacity fade (built-in Tailwind)
.animate-spinner          ← button loading spinner
.animate-shimmer          ← skeleton shimmer
.animate-pulse-soft       ← status pulse (subtle, 1.5s loop)
.animate-status-pulse     ← alert/status dot pulse (2s loop)
.card-spotlight           ← 30s inset ring highlight for deep-linked cards
.consumable-highlight     ← 30s inset glow for deep-linked supply rows
```

### Micro-Interaction Rules
- Hover: `transition-colors duration-150` for colour changes.
- Button press: `active:scale-[0.97]` — built into `<Button>`.
- Card hover (optional): `hover:shadow-md transition-shadow duration-200`.
- Nav active pill: spring animation via `useLayoutEffect` — do not recreate this.
- Never animate layout properties (width, height, margin) — only transform and opacity.
- Never use `transition-all` — always specify the property (`transition-colors`, `transition-opacity`, etc.).

---

## 17. Dark Mode

The app uses **class-based dark mode** (`dark:` classes on `.dark` root element). Never use `@media (prefers-color-scheme: dark)`.

### Rules
- Every component must support dark mode — no exceptions.
- Background surfaces: `bg-shark-900/70` to `bg-shark-950` (not pure black).
- Text: `dark:text-white` (headings) / `dark:text-shark-300` (body) / `dark:text-shark-400` (secondary).
- Borders: `dark:border-white/[0.07]` to `dark:border-white/[0.10]` (never solid dark borders).
- Hover fills: `dark:hover:bg-shark-800/30` or `dark:hover:bg-white/[0.06]`.
- Shadows: `dark:shadow-[0_2px_4px_rgba(0,0,0,0.20),0_12px_40px_rgba(0,0,0,0.40)]`.
- Focus rings: `dark:focus-visible:ring-offset-shark-900`.
- Never use plain `bg-white` without a `dark:` override.

---

## 18. Icon Usage

All icons are rendered via `<Icon name="..." size={N} />` using the Lucide icon set.

### Rules
- Use the `<Icon>` component — never import Lucide icons directly.
- Standard icon sizes: `16` (inline/badge), `18` (nav items), `20` (button icons), `24` (card headers), `26` (empty state icons).
- Nav icons: `18px`.
- Icon + label gap: `gap-2`.
- Decorative icons: `aria-hidden="true"` (the `<Icon>` component handles this).
- Semantic (action) icons in icon-only buttons: the button must have `aria-label`.
- Status icons: pair with text — never rely on icon colour alone for meaning.

---

## 19. Code Conventions for UI

### Component Authoring
- Server components by default — add `"use client"` only when needed (event handlers, hooks, browser APIs).
- UI state (modals, toggles, dropdowns) lives in the client component closest to where it's used.
- Never use `useState` for data that can be derived from props.
- Co-locate loading.tsx and error.tsx in every route segment that fetches data.

### Tailwind Best Practices
- Use `cn()` (`clsx` + `tailwind-merge`) for conditional class composition — never string interpolation.
- Never use inline `style` props for design values — always use Tailwind classes.
- Never use arbitrary values `[...]` for values that exist in the design system tokens.
- Responsive classes always mobile-first: `text-sm lg:text-base` (not `text-base sm:text-sm`).

### Naming Patterns
- Component files: `PascalCase.tsx`
- Utility/action files: `kebab-case.ts`
- CSS utility classes: `kebab-case`
- Never prefix component props with `is` unless it's a boolean toggle.

---

## 20. Do Not Do List

These are patterns that have appeared in the codebase at various points and must be avoided:

| Anti-pattern | Why | Correct alternative |
|---|---|---|
| Raw `<button>` with custom bg/text classes | Inconsistency | `<Button variant="...">` |
| `animate-pulse` on a raw `<div>` | Inconsistent with shimmer system | `<Skeleton>` component |
| Custom modal overlay `<div>` | No focus trap, no a11y | `<Modal>` component |
| `border border-gray-200` on a card | Outside design tokens | `<Card>` component |
| `text-blue-500` or any Tailwind blue | Outside design token system | `text-action-500` |
| `rounded-lg` or `rounded-xl` on cards | Wrong radius for this design system | `rounded-[32px]` |
| `font-sans` or `font-mono` | Outside the brand font system | `font-exo` or `font-manrope` |
| `transition-all` | Expensive, causes unexpected transitions | Specific property: `transition-colors` |
| `@media (prefers-color-scheme)` | App uses class-based dark mode | `dark:` utility classes |
| `alert()` or `confirm()` | Browser dialogs, no styling control | `<Modal>` with confirm pattern |
| Inline `style={{ color: '#...' }}` | Untracked, no dark mode | Tailwind class |
| Page without `loading.tsx` | No loading state | Add `loading.tsx` with `<PageSkeleton>` |
| Empty state with just plain text | Poor UX | `<EmptyState>` component |
| A `<h1>` on every page manually | Duplicate with Breadcrumbs | Let `<Breadcrumbs>` render h1, or use server data for dynamic routes |

---

## Appendix A — Design Token Quick-Lookup

```
Primary blue:       #0057FF  (action-500)
Primary hover:      #1A6BFF  (action-500 light)
Primary pressed:    #004DE0  (action-600)
Link hover:         #1259C3
Page bg light:      #f9f9fb  (shark-50)
Page bg dark:       #1a1c21  (shark-950)
Card surface light: rgba(255,255,255,0.75) + blur(20px)
Card surface dark:  rgba(41,45,52,0.70)   + border rgba(255,255,255,0.07)
Body text light:    #3f424a  (shark-700)
Body text dark:     #c5c7cb  (shark-200)
Heading light:      #292d34  (shark-900)
Heading dark:       #ffffff
Danger:             #ef4444  (red-500)
Success:            emerald-500 / #10b981
Warning:            amber-600 / #d97706
Font headline:      Exo
Font body:          Manrope
Base font size:     16px
Spring easing:      cubic-bezier(0.22, 1, 0.36, 1)
Base animation:     220ms
Touch target min:   44px height
Card radius:        32px
Button/input:       rounded-full
Modal radius:       32px
```

---

## Appendix B — Component Import Cheatsheet

```tsx
import { Button, Spinner }       from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input }                  from "@/components/ui/input";
import { Modal }                  from "@/components/ui/modal";
import { FormField }              from "@/components/ui/form-field";
import { Badge }                  from "@/components/ui/badge";
import { EmptyState }             from "@/components/ui/empty-state";
import { PageSkeleton, Skeleton } from "@/components/ui/page-skeleton";
import { Icon }                   from "@/components/ui/icon";
import { ConfirmDialog }          from "@/components/ui/confirm-dialog";
```
