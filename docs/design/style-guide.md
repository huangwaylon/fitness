# Island Fund: Style Guide & Design Tokens

Owner: UI/UX Designer · Status: v0.1 (design phase) · Companion files: `docs/design/mockup.html`, `docs/team/ui-ux-designer.md`

All tokens below are plain CSS custom properties. Paste the `:root` block into the app's base stylesheet; the mockup uses exactly these names.

---

## 1. Color

### 1.1 Palette (day)

| Token | Hex | Use |
|---|---|---|
| `--cream` | `#FFF8E7` | App background, "paper" |
| `--paper` | `#FDF1D6` | Cards (sits on cream) |
| `--paper-edge` | `#EAD9B5` | Card borders, dividers, dashed stitching |
| `--sand` | `#E9D8B4` | Beach, secondary surfaces, inactive chips |
| `--sand-deep` | `#D4BC8E` | Pressed/inset states, card drop "lip" |
| `--leaf` | `#7BC67E` | Primary buttons, progress fill, grass |
| `--leaf-soft` | `#BFE5B9` | Progress track, success backgrounds |
| `--leaf-deep` | `#4E9A55` | Tree canopy shading, icon strokes (not text) |
| `--leaf-ink` | `#2E6B38` | Green **text** (success labels, "+$2.50") |
| `--sky` | `#8FD3F4` | Sky, water, info accents |
| `--sky-pale` | `#DDF2FB` | Info backgrounds, sea on the map |
| `--sky-deep` | `#2F86B8` | Links / focus-ring (on cream) |
| `--coral` | `#FF9B87` | Secondary buttons, treats, Shop accent |
| `--coral-soft` | `#FFD9CF` | Treat backgrounds |
| `--coral-ink` | `#B04A3B` | Coral **text** (rare; warnings phrased gently) |
| `--sun` | `#FFD66B` | Highlights, stars, "new!" badges |
| `--gold` | `#F2B53A` | Money glints, coin rims, jar lid |
| `--peach` | `#FFB38A` | Fruit (daily goals), villager blush |
| `--bark` | `#8A5A3B` | Tree trunks, wooden signs, dock |
| `--ink` | `#4A3A2C` | Body text (warm brown; never pure black) |
| `--ink-soft` | `#6B5544` | Secondary text |
| `--ink-faint` | `#7A6553` | Captions, meta (≥ 4.9:1 on cream/paper) |
| `--white` | `#FFFFFF` | Speech-bubble fill, highlights |

### 1.2 Palette (night, 19:00 to 06:00 or system dark)

| Token | Hex | Use |
|---|---|---|
| `--night-sky` | `#1F2A44` | Background |
| `--night-sky-2` | `#2B3A5C` | Gradient top / elevated surface |
| `--night-card` | `#33456B` | Cards |
| `--night-edge` | `#4A5E8A` | Card borders |
| `--night-ink` | `#F7EEDB` | Body text (12.4:1) |
| `--night-ink-soft` | `#B9C3DA` | Secondary text (8.1:1) |
| `--moon` | `#F6E7B0` | Moon, lantern glow, highlights |
| `--firefly` | `#E8F59A` | Sparkles, confetti at night |

### 1.3 Partner colors

Each partner picks an accent from this set (defaults shown); used for their tree fruit ring, avatar backdrop, and chart series.

| Token | Hex | Default owner |
|---|---|---|
| `--p-plum` | `#B79CE0` | Mochi (cat) |
| `--p-apricot` | `#FFB38A` | Bean (dog) |
| `--p-mint` | `#8ED9C0` | option |
| `--p-berry` | `#F28BA8` | option |
| `--p-lemon` | `#FFD66B` | option |

### 1.4 Contrast rules (verified, WCAG 2.2)

| Pair | Ratio | Verdict |
|---|---|---|
| `--ink` on `--cream` | 10.3:1 | AAA body |
| `--ink-soft` on `--cream` | 6.6:1 | AA body |
| `--ink-faint` on `--paper` | 4.9:1 | AA body (captions minimum) |
| `--ink` on `--leaf` | 5.3:1 | Primary button text |
| `--ink` on `--coral` | 5.3:1 | Secondary button text |
| `--ink` on `--sky` | 6.6:1 | OK |
| `--leaf-ink` on `--cream` | 6.1:1 | Green text |
| `--night-ink` on `--night-sky` | 12.4:1 | AAA |
| white on `--leaf-deep` | 3.5:1 | **Fail**: never put text on leaf-deep |

Rule of thumb: **buttons are light fills with brown ink text**. That's both more Animal Crossing–like and more accessible than white-on-saturated.

---

## 2. Typography

All fonts are from Google Fonts and licensed under the **SIL Open Font License 1.1** (free for commercial and private use, can be self-hosted and bundled in a PWA).

| Role | Family | Weights | Notes |
|---|---|---|---|
| Display / numbers | **Fredoka** | 500, 600, 700 | Rounded, chunky; for headings, money, big stats |
| Body / UI | **Nunito** | 400, 600, 700, 800 | Rounded terminals, highly legible at small sizes |
| CJK / alt display | **Zen Maru Gothic** | 500, 700 | Optional: soft rounded Japanese-flavored headings, or if either partner prefers Japanese UI |

Self-host the `.woff2` files in the PWA (offline + privacy); during prototyping use:

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fredoka:wght@500;600;700&family=Nunito:wght@400;600;700;800&display=swap" rel="stylesheet">
```

### Type scale (rem-based so iOS Dynamic Type / browser zoom scales it)

| Token | Size | Line height | Family/weight | Use |
|---|---|---|---|---|
| `--fs-hero` | 2.75rem (44px) | 1.05 | Fredoka 700 | Fund total, settlement total |
| `--fs-h1` | 1.75rem (28px) | 1.15 | Fredoka 600 | Screen titles |
| `--fs-h2` | 1.25rem (20px) | 1.2 | Fredoka 600 | Card titles |
| `--fs-body-lg` | 1.0625rem (17px) | 1.4 | Nunito 700 | Speech bubbles, primary copy (iOS body size) |
| `--fs-body` | 0.9375rem (15px) | 1.45 | Nunito 600 | Default text |
| `--fs-caption` | 0.8125rem (13px) | 1.35 | Nunito 700 | Labels, meta |
| `--fs-micro` | 0.6875rem (11px) | 1.2 | Nunito 800, uppercase, +0.06em | Tab labels, tiny badges (never essential info) |

Numbers: use `font-variant-numeric: tabular-nums;` for money in lists and tallies.

---

## 3. Shape, elevation, spacing

### Radii

| Token | Value | Use |
|---|---|---|
| `--r-xs` | 8px | Tags, small chips |
| `--r-sm` | 14px | Inputs, list rows |
| `--r-md` | 20px | Cards |
| `--r-lg` | 28px | Sheets, big tiles |
| `--r-xl` | 40px | Phone-level containers, hero panels |
| `--r-pill` | 999px | Buttons, progress bars, pills |
| `--r-blob` | `46% 54% 52% 48% / 55% 45% 55% 45%` | Organic "pebble" shapes (avatars, badges) |

### Shadows (warm, never grey-black)

| Token | Value | Use |
|---|---|---|
| `--sh-lip` | `0 4px 0 var(--sand-deep)` | The signature "chunky toy" lip under buttons & cards |
| `--sh-lip-pressed` | `0 1px 0 var(--sand-deep)` | Pressed (pair with `translateY(3px)`) |
| `--sh-soft` | `0 6px 18px rgba(138, 90, 59, .14)` | Floating cards, sheets |
| `--sh-float` | `0 14px 34px rgba(74, 58, 44, .22)` | Modals, settlement card |
| `--sh-inset` | `inset 0 2px 0 rgba(74, 58, 44, .10)` | Progress tracks, wells |
| `--sh-glow` | `0 0 0 6px rgba(255, 214, 107, .45)` | "Ready to collect" pulse |

### Spacing (4-pt base)

| Token | Value |
|---|---|
| `--sp-1` | 4px |
| `--sp-2` | 8px |
| `--sp-3` | 12px |
| `--sp-4` | 16px |
| `--sp-5` | 20px |
| `--sp-6` | 24px |
| `--sp-8` | 32px |
| `--sp-10` | 40px |
| `--sp-12` | 48px |

Layout: screen side padding `--sp-5`; card padding `--sp-4`; gap between cards `--sp-3`. Minimum tap target 48×48px (larger than Apple's 44 for chunky fingers + cuteness).

### Motion

| Token | Value | Use |
|---|---|---|
| `--ease-bounce` | `cubic-bezier(.34, 1.56, .64, 1)` | Pops, fruit appearing, button release |
| `--ease-soft` | `cubic-bezier(.25, .8, .25, 1)` | Sheets, fades |
| `--dur-quick` | 140ms | Press feedback |
| `--dur-base` | 260ms | Most transitions |
| `--dur-slow` | 600ms | Fruit grow, coin drop |
| `--dur-ceremony` | 1200ms | Settlement tally steps |

Under `prefers-reduced-motion: reduce`, all durations collapse to cross-fades ≤ 120ms, no bounce, no parallax, no looping idle animation.

---

## 4. Copy-paste token block

```css
:root {
  /* color: day */
  --cream:#FFF8E7; --paper:#FDF1D6; --paper-edge:#EAD9B5;
  --sand:#E9D8B4; --sand-deep:#D4BC8E;
  --leaf:#7BC67E; --leaf-soft:#BFE5B9; --leaf-deep:#4E9A55; --leaf-ink:#2E6B38;
  --sky:#8FD3F4; --sky-pale:#DDF2FB; --sky-deep:#2F86B8;
  --coral:#FF9B87; --coral-soft:#FFD9CF; --coral-ink:#B04A3B;
  --sun:#FFD66B; --gold:#F2B53A; --peach:#FFB38A; --bark:#8A5A3B;
  --ink:#4A3A2C; --ink-soft:#6B5544; --ink-faint:#7A6553; --white:#FFFFFF;
  /* color: night */
  --night-sky:#1F2A44; --night-sky-2:#2B3A5C; --night-card:#33456B; --night-edge:#4A5E8A;
  --night-ink:#F7EEDB; --night-ink-soft:#B9C3DA; --moon:#F6E7B0; --firefly:#E8F59A;
  /* partners */
  --p-plum:#B79CE0; --p-apricot:#FFB38A; --p-mint:#8ED9C0; --p-berry:#F28BA8; --p-lemon:#FFD66B;

  /* semantic (swap these for night mode) */
  --bg: var(--cream); --surface: var(--paper); --edge: var(--paper-edge);
  --text: var(--ink); --text-soft: var(--ink-soft); --text-faint: var(--ink-faint);
  --accent: var(--leaf); --focus: var(--sky-deep);

  /* type */
  --font-display: "Fredoka", "Zen Maru Gothic", ui-rounded, "SF Pro Rounded", system-ui, sans-serif;
  --font-body: "Nunito", "Zen Maru Gothic", ui-rounded, "SF Pro Rounded", system-ui, sans-serif;
  --fs-hero:2.75rem; --fs-h1:1.75rem; --fs-h2:1.25rem; --fs-body-lg:1.0625rem;
  --fs-body:.9375rem; --fs-caption:.8125rem; --fs-micro:.6875rem;

  /* shape */
  --r-xs:8px; --r-sm:14px; --r-md:20px; --r-lg:28px; --r-xl:40px; --r-pill:999px;
  --r-blob:46% 54% 52% 48% / 55% 45% 55% 45%;

  /* elevation */
  --sh-lip:0 4px 0 var(--sand-deep);
  --sh-lip-pressed:0 1px 0 var(--sand-deep);
  --sh-soft:0 6px 18px rgba(138,90,59,.14);
  --sh-float:0 14px 34px rgba(74,58,44,.22);
  --sh-inset:inset 0 2px 0 rgba(74,58,44,.10);
  --sh-glow:0 0 0 6px rgba(255,214,107,.45);

  /* spacing */
  --sp-1:4px; --sp-2:8px; --sp-3:12px; --sp-4:16px; --sp-5:20px;
  --sp-6:24px; --sp-8:32px; --sp-10:40px; --sp-12:48px;

  /* motion */
  --ease-bounce:cubic-bezier(.34,1.56,.64,1); --ease-soft:cubic-bezier(.25,.8,.25,1);
  --dur-quick:140ms; --dur-base:260ms; --dur-slow:600ms; --dur-ceremony:1200ms;
}

/* Night: driven by local clock (class set by JS at 19:00–06:00) OR system dark mode */
.is-night, :root[data-theme="night"] {
  --bg: var(--night-sky); --surface: var(--night-card); --edge: var(--night-edge);
  --text: var(--night-ink); --text-soft: var(--night-ink-soft); --text-faint: var(--night-ink-soft);
  --accent: var(--moon);
  --sh-lip: 0 4px 0 #18213A; --sh-soft: 0 6px 18px rgba(0,0,0,.35);
}
@media (prefers-color-scheme: dark) { :root:not([data-theme="day"]) { /* same overrides as .is-night */ } }

@media (prefers-reduced-motion: reduce) {
  :root { --dur-quick:0ms; --dur-base:120ms; --dur-slow:120ms; --dur-ceremony:120ms; --ease-bounce: ease; }
  *, *::before, *::after { animation-iteration-count: 1 !important; }
}
```

---

## 5. Component recipes

**Button (primary)**: `background: var(--leaf); color: var(--ink); font: 700 var(--fs-body-lg) var(--font-body); border-radius: var(--r-pill); padding: 14px 22px; box-shadow: 0 4px 0 #5FA862;` On `:active`: `transform: translateY(3px); box-shadow: 0 1px 0 #5FA862;` + light haptic.

**Card (paper)**: `background: var(--surface); border: 2px solid var(--edge); border-radius: var(--r-md); box-shadow: var(--sh-lip);` Optional paper texture: a tiny inline-SVG noise / dot background at 4% opacity (see mockup `.paper`).

**Speech bubble**: white fill, `--r-lg` radius, 2px `--edge` border, a 14px triangular tail pointing to the speaker, name tag pill overlapping the top-left corner in the speaker's color. Text uses `--fs-body-lg`. Text types in at ~40 chars/s (instant under reduce-motion; tap to skip).

**Progress bar ("rope")**: track `--leaf-soft` + `--sh-inset`, fill `--leaf` with a subtle diagonal stripe; ends fully rounded; label inside or right-aligned in tabular numbers.

**Fruit (daily goal)**: 28px circle in `--peach` (or the partner accent) with a leaf sprig; *unearned* = dashed outline at 40% opacity; *earned* = filled + 1px white highlight; *just earned* = bounce + sparkle.

**Tab bar**: floating rounded "leaf" bar, 5 items (Island, Fund, Shop, Museum, Us), active item gets a sand pebble behind its icon and the label turns `--ink`.

**Icons**: 24px grid, 2.25px rounded stroke in `--ink` with optional single flat fill from palette. See designer memo §4.
