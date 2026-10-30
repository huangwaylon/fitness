# Round 21: final UI polish

**Team:** senior UI engineer · visual designer · NH art director. **Brief:** one last measured pass over every screen;
fix alignment, spacing, sizing, wraps, overlaps and stacking (user, via the lead: "make sure UI elements don't overlap
where possible; check the ordering of elements"); then fold in the top UI follow-ups from
[code-review.md](code-review.md).

## Method

- `npm run build` + `vite preview` (127.0.0.1:4196). The baseline is `ff5005f` (the commit before this round), rebuilt
  in a worktree and served on :4197, so before and after are the same walk on two builds.
- Playwright with the installed Chrome (`channel: 'chrome'`), touch, `ja-JP`, `Asia/Tokyo`, DPR 2, emulated safe areas
  (`Emulation.setSafeAreaInsetsOverride`: 320×568 and 375×667 20/0, 390×844 47/34, 393×852 and 430×932 59/34).
- 12 walks: the five sizes × day (`T12:10`) and night (`T21:10`) on `?demo&date=2026-10-30`, plus v2 milestones
  (`?demo&date=2026-11-03`) at 390 day and 393 night. 44 screens each: the island, both tree popups, the partner card,
  しまフォン and every app (あそびかた top/middle/end, 村人 with とくべつ, search, no match, ことば, つうしん, サウンド,
  きろく からだ / ベル / weight / inputs / week / day / keypad / workout / add / void), ごほうび (tiles, the 2かいめ
  pill, the buy confirm, the bought banner, a second buy with the banner up, the menu editor), the harvest (both steps),
  pair, 404 and the not-set-up screen. 528 screenshots per build, looked at.
- The baseline walk forces `word-break: normal` on ja text: that is what iPhone Safari did with the old
  `word-break: auto-phrase` (WebKit ignores it), so the line-break numbers are the phone's, not Chrome's.
- `measure-page.js` per screen: title / hero / dock centring, nav button insets, grid gaps and cell overlap, tap
  targets ≥ 44 and `data-sfx`, horizontal overflow and clipped text, ja line breaks inside a phrase, contrast (WCAG on
  the composited background), art scaling, and the new audit: **pairwise overlaps** of visible controls (clipped to
  their scrollers and the sticky title bar / footer), of text blocks and of the HUD + scene pieces (ribbon, sync chip,
  しまフォン, canopies, fruit rows, jar, plate, villagers, emotes, balloon, popup, banner); **stacking** (the topmost
  element at each control's centre must be the control); **focus order** against the visual order.
- Scripts (not committed): `/tmp/r21-final/walk.mjs`, `measure-page.js`, `summary.mjs`, `run.sh`.

Screenshots (`<w>-<day|night>-ja-<v1|v2>-<nn-screen>.png`):
- before: `/tmp/r21-final/before/` (baseline `ff5005f`)
- after: `/tmp/r21-final/after/` (HEAD)
- measurements: `before/*.json`, `after/*.json` (one per walk)

## Audit totals (12 walks, 528 screens)

| Check | Before | After | Note |
|---|---|---|---|
| ja line breaks inside a phrase | 279 | **0** | rotated nameplates (日曜の収穫, しずえ) excluded: per-glyph rects of a tilted plate read as lines |
| Sheet footer (やめる / 保存 / 買う！) under the undo banner | 72 | **0** | |
| Controls whose centre a tap does not reach (all) | 78 | 15 | the 15 left: the wallet page's ✎ / last tile under the 5 s banner (left, below) |
| Control-on-control overlaps (all) | 120 | 94 | the rest: the jar's 64px box over the fruit-row / canopy hit areas (invisible padding, the jar on top) and the wallet banner |
| Island focus order against the visual order | 36 inversions | **0** | heading, ribbon, scene, しまフォン |
| Harvest step dots off the screen's centre | 36 | **0** | |
| Text contrast below WCAG (excluding the input-unit false positive) | 38 | **0** | |
| Horizontal overflow, clipped text, tap targets < 44 without a hit area | 0 | 0 | |

## Fixed

| # | Issue | Fix | Before → after | Shots (before → after) |
|---|---|---|---|---|
| 1 | Japanese broke inside words on iPhone (ごほう/び, がんばろ/う, ふ/えるよ, めや/す): `auto-phrase` is Chrome-only | `html[lang=ja] body { word-break: keep-all }`, the 17 `auto-phrase` lines removed: lines break only at the copy's spaces or after 、。！ | 279 → 0 mid-phrase breaks | `390-day-ja-v1-06-app-help-end`, `-04-partner` |
| 2 | Tree popup over the jar at 320 let a tap fall through to a live jar (83 × 32px of the lid) | the popup takes its taps (pointer-events, `tick`); the scene's tap-away closes it | a tap on the popup opened ごほうび → closes the popup; e2e test added | `320-day-ja-v1-02-tree-mine` |
| 3 | The undo banner covered an open sheet's footer (やめる / 保存 / 買う！) for 5 s | `dialog.toasting .foot` grows by the banner (56 + 16 + lip + 10) | 72 → 0 covered taps | `390-day-ja-v1-20c-buy-2nd`, `-21-editor` |
| 4 | No single stacking order: literal z-indexes in 11 files | one `--z-*` scale in `tokens.css` (stage < HUD < dock; trees < canopy < fruit < fruit-row tap < villagers < tint < jar + plate < flourishes < coins < "+N" < popup), documented in design.md §T | 22 literal z-indexes → 0 | |
| 5 | Island DOM / VoiceOver order: heading, ribbon, **phone**, scene | the dock moved after the scene (z keeps it on top) | 36 → 0 inversions | |
| 6 | Harvest step dots sat right of centre (the plate is wider than ✕) | head as `1fr auto 1fr` | 27–30px → 0.0px | `390-day-ja-v1-22-harvest` |
| 7 | 村人 heads: five 64px in 315px at 375 (circles overlapped by 5px), 2.5px apart at 390, 12px rows | 5 × 56px to 419px, 5 × 64px from 420, 4 × 56px under 360 | col gap −1.25 / 2.5 → 8.75 / 12.5px (row 12) | `375-day-ja-v1-06-app-villager-list` |
| 8 | Wallet: a tile beside the 2かいめ pill sat 10px lower (content centred) | tiles top-anchored | icon / name / price Δ 10px → 0 | `390-day-ja-v1-18-wallet` |
| 9 | Menu editor: the intro line tucked 6px under the sticky title bar | margin 0 | −6px → +2px clear | `390-day-ja-v1-21-editor` |
| 10 | ✎ buttons touched the dashed dividers (Goal card, weight log, day rows) | `--row-obj` (54px) rows; `.pen-btn` lifted by half its lip | ≈ 1.5px → 3px above and under the lip | `390-day-ja-v1-07-kiroku-body`, `-08-weight-end`, `-12-day` |
| 11 | The keypad hung under the title, ~230px empty below it (the stretch chain stopped at `.kiroku`) | `.kiroku:has(.atm)` flex column, `.lvl` grows | keys' bottom → 26px from the phone's bottom (thumb zone, as designed) | `390-day-ja-v1-13-numpad` |
| 12 | Keypad C: a thin 15px UI-font letter beside 24px Fredoka digits | 18px Fredoka 700 | | `-13-numpad` |
| 13 | ベル ledger: the second person's avatar wandered 0–20px day to day | a fixed 4.6em slot per person | x spread 20px → 0 | `390-day-ja-v1-16-kiroku-money` |
| 14 | Week table: the unit-less 🥥 head icon 7.5px below the other icons | `.hc { align-self: start }` | 7.5px → 0 | `-11-week` |
| 15 | Day title in the thin UI face, the week title in bold Fredoka | the date in Fredoka 700 | | `-12-day` |
| 16 | Week cards: the five badges bunched left, ~120px empty at 390 | badges spread (max 240px), 6vw size | | `-07-kiroku-body` |
| 17 | しまフォン ✕ / ‹ 10px from the phone's top, 18px from its side; rows cut at a hard edge under the title | inner padding 14px; the paper sheet's 14px fade under the title bar | 10 / 18 → 18 / 18px | `-05-phone`, `-06-app-villager-list` |
| 18 | あそびかた: the ごほうび tile icon read larger than the other section icons | 30 → 26px | | `-06-app-help-end` |
| 19 | Night: step-cell amounts 3.5:1; unearned badge discs dark holes in the navy card | `--text` on the cells; a 14% cream disc | 3.5 → 4.6:1 | `393-night-ja-v2-06-app-help-mid`, `390-night-ja-v1-07-kiroku-body` |
| 20 | Not set up / error on the sea blue: the soft line 2.1:1 | those screens on the tan panel | 2.1 → ≥ 5.6:1 | `-26-unconfigured` |
| 21 | Partner card: "11:30 に とどいた" 6px left of the bubble; the line ended in a lone ね！ | flush with the bubble; `text-wrap: balance` (+ keep-all) | 6px → 0 | `-04-partner` |
| 22 | 村人 search: the browser's blue clear ✕ | an ink ✕ (mask) | | `-06-app-villager-search` |
| 23 | Tree popup at 320: 2,384/8,000歩 ran into its fruit | 4px left padding on the value | 1 → 5px | `320-day-ja-v1-03-tree-partner` |

### Code review UI follow-ups (code-review.md)

| # | Item | Done |
|---|---|---|
| 1 | Buy sheet could confirm a stale price | the sheet follows the live item by id: a price that steps up while it is open shows before 買う！ |
| 2 | A failed harvest import left the page inert and empty | loaded in script; inert only once the overlay can show; a failed load counts as あとで |
| 3 | Jar plate could overshoot the wallet (two changes in 450 ms) | `jarBells = Math.min(target, jarBells + rest)` |
| 4 | 0-minute manual workout: けってい looked enabled | NumberPad `min` |
| 7 | BellsLog's own Tokyo formatter | `localDateAt` |
| 8, 9 (part) | The tap walk's fixed 260 ms sleep | `expect.poll` on the cue + wait for sheet animations |
| 11 | Stale words in comments (お金, check-in, 壺に入れる) | fixed |
| 12 | pot / 壺 names in e2e | treats / ごほうび (the `[data-pot]` absence check kept) |
| 19 | Badge aria-label could say 6/5 | capped like the visible count |
| 20 | きろく had no load-failure branch | `{:catch}` line |
| 22 | Villager name saved only on blur | also on teardown |
| 23 | `daysBetween` re-export | WeightChart imports `time/dates`; re-export deleted |

Not done in this round (low, no visible effect): 5 (one `asleepHour`), 6 (badge stagger constant), the other fixed
e2e sleeps in 9, 10 (~150 history-narrating comments; this round's own comments keep the why and the measured
before-value only where it explains the rule), 13, 14 (one count-up tween), 15, 16, 17, 18, 21, 24.

## Deliberately left

- **Art below 2× on the screen:** the item icons (96px drawn at 60), the phone tiles (92 at 65), the glyphs (96 at
  51) and the hedge bushes (100–107 at 52–62) are drawn under their file size in CSS px, as §A says, but are soft on a
  3× iPhone. Fixing it needs larger source files, not CSS.
- **The undo banner over the wallet page's ✎ and last tile** (5 s after a buy, 393 and 320): the page has 88px of
  scroll room under them, and moving the banner up would cover the balance, the screen's focal point.
- **The jar's 64px hit box over the fruit-row / canopy hit areas** (4–11px of invisible padding): the jar is on top,
  which is the intent (≥ 64px jar).
- **Emote marks over the fruit row / plate** (art on art, `pointer-events: none`).
- **Opening the menu editor during the undo window scrolls it 17px** (the intro line goes under the bar); rare.
- **The 320 sun behind the ribbon's swallow-tail** (as in round 19).

## Verification

`npm run check` 0 errors · `npx vitest run` 854 passed · `npm run build` ok · `npm run e2e` 26 passed (one new) ·
`npx knip` clean · Pages deploys green after each push.
