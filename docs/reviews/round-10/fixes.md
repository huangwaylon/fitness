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

## Engineer A: shell, sheets, しまフォン, pair (ui/*, phone/*, NumberPad, HarvestOverlay, pair, layout, global CSS)

Verified in Chrome (Playwright, `channel: 'chrome'`, isMobile/hasTouch, ja-JP) at 320x568, 375x667, 390x844, 430x932;
every changed screen was screenshotted and inspected. Scroll audit = `S-`, sizing review = `#`.

| ID | Fix | Before → after (measured) |
|---|---|---|
| S-H1, #9 | 村人 search uses `--fs-input`; pair key `max(--fs-input, 1.1rem)`. New `lib/inputs.test.ts` scans every `.svelte` style rule that targets an input / textarea / select (by element or by a class the markup puts on one) and fails below 16px (tokens resolved; clamp = its minimum). | search 15px → 16px |
| S-H2 | `ui/scrollLock.ts`: ref-counted `:root.sheet-open` lock, taken by every Sheet while open and by HarvestOverlay (+ unit test). | /jar purse sheet, touch swipe on the backdrop: page scrollY 29-32 → 0 (control run without the class: 29) |
| S-H3 | Pair: no transform and no sticky lift. The page gets `--kb` of bottom padding; on focus `keyboardInset` scrolls the whole form (`data-kb-scroll`) to just above the keyboard; fields get `scroll-margin-bottom: --kb` globally, so "centre" means centre above the keyboard (sheets too). Sheet `.foot` uses `bottom: var(--kb)` instead of a transform. | simulated iOS keyboard (336px) at 375x667: button y 147-199 over the airport art → field 166-222, button 261-309, visible bottom 331; all four sizes keep field + button above the keyboard |
| S-M1 (part) | Every sheet `overflow: hidden auto` (and the harvest overlay), so a wide child can't make a sheet pan sideways. The `.types` grid itself is Kiroku (engineer B). | |
| S-M2 | Phone = non-scrolling flex column; status row + title bar fixed; `.phone-body` is the one scroller (`overscroll-behavior: contain`, bottom padding `--body-pad` = 22px + `--kb`, 96px while an undo banner is up). Villager grid is no longer a scroller. | 375x667 dialog 670/647 + grid 1228/307 → dialog 647/647, body 1481/533, grid 1228/1228 (no inner scroll); title y unchanged after scrolling the body |
| S-M3 | Root `overscroll-behavior: none` removed; only `html:has(.island)`. `html { overflow-x: clip }` replaces body `overflow-x: hidden`. | /jar `overscroll-behavior-y` none → auto |
| S-L2 | Undo banner `.hit` `touch-action: pan-y` (a vertical swipe on it scrolls the page / phone; it ends by itself, swipe-down dismiss is best effort). Top banner keeps `none` (its dismiss is swipe-up and it sits over the non-scrolling island / a sheet top). Deviation: the report's `pan-x` would still swallow vertical scrolls. | |
| S-L3 | `--vh-page` (svh) on `.page`, `.state`, /pair, html/body; `--vh-fill` (dvh) on the phone height and sheet max-height; both fall back to vh. | |
| S-L4, #4 | NumberPad: the `100dvh − … − 150px` min-height is gone; `.phone-body` stretches the pad screen and `.atm` aligns its content to the bottom. Keys full width at every size, height `--key-h`; けってい / やめる side by side, full width. | keys 60x54 (390), 101x46 (375) → 101x47 (375), 106x59 (390), 119x64 (430); last button bottom 30px above the body bottom at all sizes, body never scrolls (533/533, 710/710, 798/798) |
| #1, T3 | Phone shell `--surface` (paper); the ことば / 通信 rows use `--fill-on-surface`; `.card` in a sheet stays `--bg` (cream). | phone bg #FFF9E3 (= key fill) → #FFF3D6; keys and ✎ / × have a visible body |
| #5 | Yen `.bag { flex: none }`. | 320 purse bag 13px → 24px |
| #6 (part) | ChoiceList `min-width: clamp(112px, 30vw, 140px)`, `min-height: var(--hit)`. Ribbon / plate are engineer B's. | |
| #7, T4 | `--tile: clamp(52px, min(22vw, 11·vh1), 96px)` (follows height too); home grid centred slightly above the middle, row gap grows with height; tile label scales with the tile. | tiles 64 → 62 / 73 / 86 / 95px (320 / 375 / 390 / 430); 430x932 last tile bottom 365 → 637 of 924 |
| #8 (mine) | Sheet grabber 88x36 → 88x44 (`--hit`, above the title so the full area is tappable; layout unchanged). | |
| #17 | 島: the top banner sits at `safe-top + 100px`, below the score ribbon. | |
| #18 (part) | Undo text 12px → 13px (via `--fs-s`). Jar page padding while undo is up is engineer B's (jar route). | |
| #19 | Harvest `--fr: clamp(20px, 6.4vw, 30px)`; the 339px and compact hero-num overrides deleted (`--fs-hero` is fluid). | fruit 24 → 20 / 24 / 25 / 28px |
| Census (mine) | 村人 kind 11px → `--fs-s`; name / labels / pair hints / 見込み / help version / sync chip / tile labels 12 → 13px via the token. | |

Skipped / not mine:
- `.island { height: 100vh; height: 100dvh }` (S-L3) lives in `routes/+page.svelte`, which I don't own: use `height: var(--vh-fill)`.
- `jar/+page.svelte` still sets `--jar-h` 132 / 96 / 84: delete those three lines to adopt the fluid token.
- `dialog.phone .inner` safe-left/right (safe areas): added.
- S-L1 (Kiroku scroll restore) is engineer B's; Kiroku already finds the nearest scrolling ancestor, so it works with `.phone-body`.
- #20 (image resolution) is an asset fetch, not CSS.
