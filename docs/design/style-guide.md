# Island Fund: Style Guide & Design Tokens

Owner: UI/UX Designer · Status: v0.3 (simplicity first, Japanese-first, yen; decisions 0002–0006) · Companion files: `docs/design/mockup.html`, `docs/team/ui-ux-designer.md`

## 0. Simplicity budget (top constraint; it overrides everything else)

| Rule | Limit |
|---|---|
| Tabs | **3 max**: 島 Island · 旅の壺 Trip Jar · ふたり Us. Everything else is a sheet, never a tab |
| Words per screen | **≤ 20–25** visible words (Japanese: ≤ ~40 characters), *excluding numbers*. Count them for every new screen |
| Primary action | **One** per screen, in the thumb zone (Island: 今夜のチェック; Jar: 使う; Sunday: 壺に入れる) |
| Big numbers | The key number is ≥ 2.5rem (Fredoka 600). Secondary numbers ≥ 1rem. A screen has at most **one hero number** |
| Labels | Icons first; labels appear **on tap** (tooltip) when an icon is self-explanatory. No captions or explanations on screens |
| Explanations | Go in the one-time onboarding or the **"?" sheet** (top-right on every screen) |
| Rows | ≤ 5 rows per card, ≤ 3 cards per screen. Settlement ≤ 4 big rows + 1 purse row + promises |
| Check-in | 3 big switches + 2 chips. No other inputs, no free text |
| New feature test | If it adds a tab, a second primary action, or pushes a screen over the word budget, it goes into "?" or Us, or it's cut |
| Copy | Short, warm, specific. One Juniper line (≤ ~8 words / ~16 characters) per screen at most |

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
| `--leaf-ink` | `#2E6B38` | Green **text** (success labels, "+¥2,000") |
| `--sky` | `#8FD3F4` | Sky, water, info accents |
| `--sky-pale` | `#DDF2FB` | Info backgrounds, sea on the map |
| `--sky-deep` | `#2F86B8` | Links / focus-ring (on cream) |
| `--coral` | `#FF9B87` | Treat Purse (ごほうび財布) accent, secondary buttons |
| `--coral-soft` | `#FFD9CF` | Treat backgrounds |
| `--coral-ink` | `#B04A3B` | Coral **text** (rare; warnings phrased gently) |
| `--sun` | `#FFD66B` | Highlights, stars, "new!" badges |
| `--gold` | `#F2B53A` | Money glints, coin rims, jar lid |
| `--peach` | `#FFB38A` | Villager blush, warm accents |
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

### 1.3 Fruit colors (one per scoring category, decision 0002)

| Token | Hex | Fruit | Category (weight /100) |
|---|---|---|---|
| `--f-peach` | `#FFB38A` | Peach | Active minutes (30) |
| `--f-coconut` | `#9C6B45` | Coconut | Strength days (20) |
| `--f-apple` | `#FF8A7A` | Apple | Step days (10) |
| `--f-plum` | `#9FA8E8` | Moon-plum | Sleep & rest (15) |
| `--f-pear` | `#C9DE6E` | Pear | Eating habits (25) |

Each fruit also has a distinct silhouette (coconut = round with three "eyes", pear = teardrop, moon-plum = crescent mark, and so on), so color is never the only cue. Always pair it with the category label.

### 1.4 Partner colors

Each partner picks an accent from this set (defaults shown); used for their tree fruit ring, avatar backdrop, and chart series.

| Token | Hex | Default owner |
|---|---|---|
| `--p-plum` | `#B79CE0` | Mochi (cat) |
| `--p-apricot` | `#FFB38A` | Bean (dog) |
| `--p-mint` | `#8ED9C0` | option |
| `--p-berry` | `#F28BA8` | option |
| `--p-lemon` | `#FFD66B` | option |

### 1.5 Contrast rules (verified, WCAG 2.2)

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
| **Japanese (default UI language)** | **M PLUS Rounded 1c** | 500, 700, 800 | Rounded gothic with full Japanese coverage, OFL 1.1. Chosen over Zen Maru Gothic because its small kana (ェ, ッ) are tighter. Always `letter-spacing: 0` for Japanese |

**Japanese-first.** The UI is Japanese by default and switchable to English in ふたり → 言語 / Language. Latin digits and ¥ amounts stay in Fredoka, because the stack falls back per glyph and Fredoka has no CJK, so kana and kanji render in M PLUS Rounded 1c. Set `<html lang="ja">` (or `en`) so line breaking and the font fallback are correct. Use `font-feature-settings: "palt"` for proportional kana where supported. Japanese copy is denser, so budget about 40 characters per screen. Self-host only the subset you need (Japanese fonts are large): `pyftsubset` with the strings in use plus JIS level 1.

**Formats (Japan):** yen as `¥10,000` (integers, no decimals, comma thousands), times in 24 h JST (`19:30`), dates as `10月28日 水曜日` (JA) / `Wed 28 Oct` (EN), weeks as `第21週` / `Week 21`, metric units (km, kg, min).

Self-host the `.woff2` files in the PWA (offline + privacy); during prototyping use:

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fredoka:wght@500;600;700&family=Nunito:wght@400;600;700;800&family=M+PLUS+Rounded+1c:wght@500;700;800&display=swap" rel="stylesheet">
```

### Type scale (rem-based so iOS Dynamic Type / browser zoom scales it)

| Token | Size | Line height | Family/weight | Use |
|---|---|---|---|---|
| `--fs-hero` | 2.75rem (44px) | 1.05 | Fredoka 700 | Jar total, settlement total |
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

Layout: screen side padding `--sp-5`; card padding `--sp-4`; gap between cards `--sp-3`. Minimum tap target 44×44pt (Apple HIG); primary tiles and buttons use 48pt+. See §5.

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
  /* fruit = scoring categories */
  --f-peach:#FFB38A; --f-coconut:#9C6B45; --f-apple:#FF8A7A; --f-plum:#9FA8E8; --f-pear:#C9DE6E;

  /* semantic (swap these for night mode) */
  --bg: var(--cream); --surface: var(--paper); --edge: var(--paper-edge);
  --text: var(--ink); --text-soft: var(--ink-soft); --text-faint: var(--ink-faint);
  --accent: var(--leaf); --focus: var(--sky-deep);

  /* type */
  --font-display: "Fredoka", "M PLUS Rounded 1c", ui-rounded, "SF Pro Rounded", system-ui, sans-serif;
  --font-body: "Nunito", "M PLUS Rounded 1c", ui-rounded, "SF Pro Rounded", system-ui, sans-serif;
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

## 5. iPhone / PWA platform rules (mobile-first)

Target: iPhone in portrait, 375 to 430pt wide (SE 3 → Pro Max), mobile Safari **and** standalone PWA (Add to Home Screen). Design at 390×844 (iPhone 14/15/16), verify at 375×667 (SE) and 430×932 (Pro Max).

**Head tags**

```html
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="Island Fund">
<meta name="theme-color" content="#FFF8E7" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#1F2A44" media="(prefers-color-scheme: dark)">
<link rel="apple-touch-icon" href="/icons/apple-touch-icon-180.png">
```

Manifest: `"display": "standalone"`, `"orientation": "portrait"`, `"background_color": "#FFF8E7"`, `"theme_color": "#FFF8E7"`. Provide a 180×180 apple-touch-icon (cream background, the fund jar with a leaf; no transparency, iOS adds the corner mask).

**Safe areas (notch / Dynamic Island / home indicator)**

```css
:root {
  --safe-top: env(safe-area-inset-top, 0px);       /* ~59px on Dynamic Island phones */
  --safe-bottom: env(safe-area-inset-bottom, 0px); /* ~34px home-indicator zone */
  --safe-left: env(safe-area-inset-left, 0px);
  --safe-right: env(safe-area-inset-right, 0px);
  --tabbar-h: 64px;
}
.app-header { padding-top: calc(var(--safe-top) + var(--sp-2)); }
.tabbar {
  position: fixed; left: var(--sp-3); right: var(--sp-3);
  bottom: calc(var(--safe-bottom) + var(--sp-2));
  height: var(--tabbar-h);
}
.screen { padding-bottom: calc(var(--tabbar-h) + var(--safe-bottom) + var(--sp-6)); }
html, body { min-height: 100dvh; overscroll-behavior-y: none; }
```

- Island illustration bleeds *behind* the status bar (sky fills the Dynamic Island area); text/controls never sit inside `--safe-top`.
- Nothing interactive in the bottom 34px home-indicator zone; the tab bar floats above it.
- Use `100dvh`, not `100vh` (Safari's collapsing toolbar).

**Thumb zone**

- Primary actions (Check in, Collect, Drop in the jar) live in the bottom third, above the tab bar.
- The top area is for glanceable, read-only content (island scene, totals). No essential button in the top-left corner.
- Bottom sheets (not centered modals) for 今夜のチェック, the ごほうび財布 shop, the "?" help and confirmations; they open from the thumb.

**Touch & input**

- Minimum target: **44×44pt** (Apple HIG); our default is 48pt for primary tiles. Keep ≥ 8pt between targets.
- **No hover dependence.** Every hover style has an `:active` / `:focus-visible` twin; tooltips are replaced by tap-to-reveal or long-press.
- `touch-action: manipulation;` on buttons (removes double-tap-zoom delay); `-webkit-tap-highlight-color: transparent;` paired with our own pressed state.
- `user-select: none` on tiles/buttons only, never on text content.
- Inputs at ≥ 16px font size so iOS Safari doesn't auto-zoom.
- Haptics: the Web Vibration API is **not** supported on iOS Safari, so in the PWA haptics are best-effort/absent; real haptics come only with a native shell (see designer memo §8). Never rely on haptics alone for feedback.

**Dynamic Type**: sizes are in `rem`; in a native/WebView shell, map root font size to the iOS content-size category. In Safari, support at least 200% text zoom without horizontal scrolling; cards wrap, numbers stay on one line (they shrink via `clamp()` before truncating).

---

## 6. Component recipes

**Button (primary)**: `background: var(--leaf); color: var(--ink); font: 700 var(--fs-body-lg) var(--font-body); border-radius: var(--r-pill); padding: 14px 22px; box-shadow: 0 4px 0 #5FA862;` On `:active`: `transform: translateY(3px); box-shadow: 0 1px 0 #5FA862;` + light haptic.

**Card (paper)**: `background: var(--surface); border: 2px solid var(--edge); border-radius: var(--r-md); box-shadow: var(--sh-lip);` Optional paper texture: a tiny inline-SVG noise / dot background at 4% opacity (see mockup `.paper`).

**Speech bubble**: white fill, `--r-lg` radius, 2px `--edge` border, a 14px triangular tail pointing to the speaker, name tag pill overlapping the top-left corner in the speaker's color. Text uses `--fs-body-lg`. Text types in at ~40 chars/s (instant under reduce-motion; tap to skip).

**Progress bar ("rope")**: track `--leaf-soft` + `--sh-inset`, fill `--leaf` with a subtle diagonal stripe; ends fully rounded; label inside or right-aligned in tabular numbers.

**Fruit ring (weekly progress, no text)**: the category fruit (24–32px) inside a conic-gradient ring in its fruit color that fills to the % of that week's target. `background: conic-gradient(var(--c) calc(var(--p) * 1%), #EADFC8 0)` with a paper-colored inner disc (`inset: 4–5px`). Full = a 3px `--sun` halo plus a sparkle. Five rings sit on each tree on the Island. The label shows only on tap, as a tooltip ("筋トレ 1/2日").

**Hero score**: `43` at 2.6rem Fredoka + `/85` at 1rem `--ink-faint`, placed under each tree.

**Jar (Trip Jar)**: one hero number (`¥186,500`) + `目標 ¥520,000`. The jar drawing has three strata (partner B plum, partner A apricot, team leaf). The per-person mini-jars fill against **their own maximum** (¥208,000 personal / ¥104,000 team per year), so they never read as a leaderboard. Island shows only the combined total.

**Settlement row**: avatar 42px · score at 1.9rem · ✓ if ≥ 85 · yen right-aligned at 1.45rem `--moon`. The team row shows only the yen, and copy never says whose score set its rate. A "暫定 / provisional" pill sits next to the total.

**Promise row**: avatar · last week's marks (✓ kept, ○ not kept, **never ✗**) · next week's plan (when/where/what, ≤ 16 characters) · the partner's "応援してる" pill. No yen and no streak.

**Habit switch (check-in)**: a 76px-tall card row with a 50px icon, a ≤ 2-word label (each person's own habits, e.g. 昼ごはん, おやつ, 野菜 2食) and a 60×36 pill switch (off `--sand`, on `--leaf`), `role="switch"`, saved on tap. Co-log = the partner's face button with a small "+".

**Tab bar**: floating rounded "leaf" bar, **3 items** (島 Island, 旅の壺 Jar, ふたり Us), active item gets a sand pebble behind its icon and the label turns `--ink`.

**Icons**: 24px grid, 2.25px rounded stroke in `--ink` with optional single flat fill from palette. See designer memo §4.
