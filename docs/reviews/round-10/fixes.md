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

## Engineer B: 島, きろく, sheets, 旅の壺 (island/*, kiroku/* but NumberPad, sheets/* but HarvestOverlay, routes/+page, routes/jar)

Verified in Chrome (Playwright, `channel: 'chrome'`, isMobile/hasTouch, DPR 3) at 320x568, 375x667, 390x844, 430x932 in ja and en;
every changed screen screenshotted and inspected. `scrollWidth − innerWidth` = 0 and dialog `scrollWidth = clientWidth` in every capture.

| ID | Fix | Before → after (measured) |
|---|---|---|
| #2 | `Hud`: `.hud:has(.chip) ~ .ribbon-wrap { top: safe-top + 84px }`: the chip (≤ 74px with its lip) pushes the ribbon down. | overlap 98–101 × 14–16px → 0, 10px apart (ribbon y 56 → 84 while the chip shows) |
| #3, S-M1 | `Kiroku .types` `repeat(2, minmax(0, 1fr))`, `.type { min-width: 0; overflow-wrap: anywhere }`. | dialog 413/359 (375), 413/374 (390) → 359/359, 374/374; columns 245 + 140 → 135 + 135 (320), 164 + 164 (390) |
| #6 | Scene: on tall phones (`max-aspect-ratio: 1/2`) the stage may grow until the grass is 12px inside the edges (beach and shallows run off the sides), and the sky is capped at 27% of the scene (`--sky-max`): the spare height is open sea behind the island. Ribbon: `height: var(--hit)`, type `clamp(1.5rem, 3.4·vh1, 1.875rem)`, `.wk` `clamp(15px, 1.9·vh1, 18px)`, padding `clamp(22px, 6vw, 28px)`. Plate in stage units `clamp(13px, 14u, 16px)`. Emotes `clamp(36px, 44u, 56px)` (T5; the compact override is gone). Choices: done in ChoiceList by A. | horizon 347 → 252 (430x932: sky 37% → 27%), 298 → 228 (390x844: 35% → 27%); 320 / 375 unchanged (24% / 26%). Ribbon 140x36 → 165x44 (430), 98x36 → 99x44 (320). Plate ¥ 12px → 13 / 15 / 16px (320 / 390 / 430) |
| #8 | Ribbon h 36 → 44; check-in 今日 / 昨日 56x40 → 56x44; きろく pills 104x40 → 104x44; DayDetail ✎ 44x36 → 44x44; MoneyLog なかったことに / Void h 36 → 44 (min-width 44: en 43 → 45); meal chips keep 36 visual with an `::after` hit area of 44. | |
| #10 | Fruit popup: one column on narrow stages (`@container (max-width: 359px)`), kept under the 44px ribbon (112px), closes when a sheet / the harvest covers the scene (`FruitTree covered`). | 320: 270x68 at x 9–279 → 151x124 over its own tree; labels 12 → 13px |
| #11 | WeekDetail weekday column `var(--wd-w)`: 22px for 1 kanji, `2.1rem` for `:lang(en)`; grids `minmax(0, 1fr)` (T6); 「22 min」 `nowrap` (it wrapped to two lines once the cells went 12 → 13px). | 「Wed」 column 22 → 34px; no spill into the steps cell |
| #12 | PartnerSheet: the 2-column rule is gone; ≤ 359: ring `--ring: 60px`, `gap: 10px 2px; padding: 12px 4px`. | 320: 2×2, 200px tall → one row, 101px |
| #13, T7 | DayDetail workout / visit row: label on its own line at body size, time + chips + ✎ right-aligned under it. New `kiroku/TypeName.svelte` + `fmt.ts typeParts` (+ test): Japanese workout labels break only at word joints (筋力 / トレーニング, 高強度 / インターバル / トレーニング; `nowrap` pieces with `<wbr>`), used by the type grid, the day rows and the workout card. 「ワークアウトを追加」 heading kept on one line. | label 12 → 15px; en 3 lines → 1; ja 「筋力トレーニ / ング」 → 「筋力 / トレーニング」 at worst |
| #14 | MoneyLog rung labels `--fs-xs` on a `--fill-on-surface` chip, so the step line never crosses the words. | |
| #15 | 島 `.below` gap 8 → 12 and `--chrome-below` +4 (slot height constant). | box → CTA 4px visual → 8px visual |
| #16 (part) | 旅の壺: the 132 / 96 / 84 `--jar-h` overrides deleted (fluid token); hero total `var(--fs-hero)` (the 339px override is gone). | hero jar 84 / 96 / 132 / 132 → 91 / 107 / 135 / 149px |
| #5 (part) | `.purse .purse-yen` `clamp(1.25rem, 6.5vw, --fs-title)`, `.purse .bag { flex: none }` (with A's Yen fix). | 320 bag 24px, no overlap with ¥ |
| #18 (part) | `.jar-screen.undoing { padding-bottom: pad-bottom + 88px }` while an undo banner is up. | 320, scrolled to the end: last card bottom 543 under the banner (488) → 472 |
| T6 | `minmax(0, 1fr)`: jar `.layers`, `.shelf`; PartnerSheet `.fruits`; WeekDetail `.people`, `.day`, `.head`. | |
| Census | 11px literals → `--fs-xs` (week table `.hd`, WeekList weekday row, chart rungs) or `--fs-s` (DayDetail chips, MoneyLog chips, ChangeLog date, WeekDetail `.num` at ≤ 374); 12px plate → stage clamp. Everything else rose with `--fs-s` = 13px. | remaining < 13px in my screens: only `--fs-xs` headers / rung labels |
| T3 | DayDetail read-only card and the rung chip use `--fill-on-surface`. Game-object controls (✎, types, chips) stay `--c-cream`. | |
| S-L1 | Kiroku stores `scrollTop` per stack level in `go()` and restores it after `tick()` in `back()`; it scrolls the nearest scrolling ancestor (A's `.phone-body`, or the dialog). | list at 300, open a week, ◀ → 300 (was 0) |
| S-L3 | `.island` `height: var(--vh-fill)` (+ `--scene-h`); /jar `min-height: var(--vh-page)`. | |

Skipped / left:
- #16 "≤ 3 cards" on 旅の壺: a content / design decision (payday banner + trip + purse + recent), not a sizing fix. At 320 the recent card still starts below the fold (y 512); the page scrolls normally.
- T7 elsewhere in my files (check-in habit names, the void question, payday text): left on the T7 base (`line-break: strict`) plus `auto-phrase` for Chromium; only workout labels and the add-workout heading got explicit joints. Re-check on a real iPhone.
- #17 (A's Toast): the top banner sits at `safe-top + 100px`; the ribbon (44px at `safe-top + 56`) ends at 100 + its 4px lip, and at 140 + 4 while the sync chip shows. Suggest `safe-top + 112px` (or 152 with `:has(.hud .chip)`).
- Meal chips (`.tick`) and the sync chip still measure 36 / 32px tall as boxes; both have a 44px `::after` hit area.
