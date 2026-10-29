# Round 10: fixes

## New tokens (use these; `app/src/lib/styles/tokens.css`)

| Token | Value | Use |
|---|---|---|
| `--fs-s` | 13px (was 12) | T1 floor for any content text. Replace literal `12px` with it. |
| `--fs-xs` | 11px | Only chart axes and table headers (`.hd`). Replace literal `11px` with it. |
| `--fs-input` | `max(16px, 1rem)` | Every `input` / `textarea` / `select` font size (iOS zooms below 16px). A test enforces ≥ 16px. |
| `--hit` | 44px | T2 tap-target floor: `min-height` (and `min-width` on icon-only controls), or an `::after` hit area. |
| `--vh-fill` | `100dvh` (`100vh` before Safari 15.4) | Heights that fill the visible screen and never scroll themselves: island, phone, sheet `max-height`. |
| `--vh-page` | `100svh` (`100vh` fallback) | `min-height` of pages the document scrolls (/jar, /pair, error). |
| `--vh1` | `1dvh` (`1vh` fallback) | Inside clamps: `calc(7 * var(--vh1))`. Never write raw `dvh` in a clamp (it has no fallback). |
| `--cta-h` | `clamp(48px, 6.6·vh1, 60px)` | The one action (was 56 / 48 compact; the step is gone). |
| `--tile`, `--tile-gap` | `clamp(52px, 18vw, 80px)`, `clamp(12px, 4.5vw, 22px)` | しまフォン grid (per-breakpoint overrides deleted). |
| `--jar-h` | `clamp(84px, 16·vh1, 160px)` | 旅の壺 hero jar. `jar/+page.svelte` still sets its own `--jar-h` (132 / 96 / 84): delete those to adopt it. |
| `--key-h` | `clamp(46px, 7·vh1, 64px)` | NumberPad key height. |
| `--fs-title`, `--fs-hero` | `clamp(1.375rem, 6.4vw, 1.625rem)`, `clamp(2.25rem, 11vw, 2.75rem)` | Fluid title / hero numbers. |
| `--fill-on-surface`, `--fill-on-bg` | cream, paper (navy pair at night) | T3: a control or card's fill must differ from its container. Paper sheets and the しまフォン shell are `--surface`; what sits on them is `--fill-on-surface`. Game-object controls (`.icon-btn`, keys, choices) stay `--c-cream`. |

Global rules (`theme.css`): `:root.sheet-open { overflow: hidden }` (set by Sheet / HarvestOverlay, ref-counted); `dialog { overscroll-behavior: contain }`;
no root `overscroll-behavior` except `html:has(.island)`; `html { overflow-x: clip }` (body `overflow-x: hidden` removed);
`html, body { min-height: var(--vh-page) }`; body `overflow-wrap: break-word; line-break: strict` (T7 base); inputs `font-size: var(--fs-input)`.
The しまフォン shell is `--surface` now (sizing #1), so cream controls and `.card`s inside it contrast.
