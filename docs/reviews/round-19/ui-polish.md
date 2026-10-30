# Round 19: final UI review, polish and cleanup

**Team:** senior UI engineer · game designer (NH / Pocket Camp) · UX designer (kids and young adults).
**Scope:** `components/**`, `routes/**`, `i18n/**`, `styles/**`, `e2e/**`. The model, scoring, config and docs belong to
the code/docs engineer; changes needed there are under [Requests](#requests).

**Method.** `npm run build`, then `vite preview` on 127.0.0.1:4194. Playwright with the installed Chrome
(`channel: 'chrome'`), touch emulation, `ja-JP`, `Asia/Tokyo`, `?demo` / `?demo=harvest`, `?date=2026-10-30T12:10` (day)
and `T21:10` (night). For the v2 milestone screens the page clock is pinned to 2026-11-03 (`page.clock.install`),
because the demo builds its data from `Date.now()`, not `?date=`. Every screen and state (26 per run: island, both tree
popups, partner card, phone home, the five apps, きろく からだ / ベル / week / day / weight / inputs / keypad / workout /
add / void, wallet, buy, bought, menu editor, harvest, harvest end, pair) was shot at 320×568, 375×667, 390×844 and
430×932, day and night, ja and en (568 shots), and looked at. The scripts live in `/tmp/r19-ui/` (`walk.mjs`,
`walk2.mjs` for v2, `measure.mjs`) and were copied into `app/` only to run.

Screenshots (not committed):
- before: `/tmp/r19-ui/shots/390-day-ja-*.png` (the whole walk at the round's start) and `/tmp/r19-ui/full/` (320
  night en, 375 day en, 430 night ja);
- after: `/tmp/r19-ui/after/` (per fix), `/tmp/r19-ui/after/v2/` (milestones), `/tmp/r19-ui/final/` (the full matrix
  at the end, `<w>-<day|night>-<ja|en>-<nn-screen>.png`).

## Priority fixes (user requests via the lead)

| # | Request | Fix | Commit | Shots (before → after) |
|---|---|---|---|---|
| 1 | The island sat low; the しまフォン overlapped its beach | The stage is top-anchored and **centred** in the band between the ribbon's lip (`--hud-bottom`) and the phone's top (`--island-bottom`); its size is the smaller of that band (12px pad above and below) and the width fit, so a short screen scales it down. `--phone-h` (92px) fixes the phone slot. Measured below | `edf67e3` | `shots/390-day-ja-01-island.png` → `after/390-day-ja-01-island.png`, `after/320-night-ja-01-island.png` |
| 1b | (follow-on) at 320 the centred island put the tree popup over its own canopy | A popup that can't fit above its canopy hangs **under the fruit row** (tail up), tighter rows on short screens | `edf67e3` | `after/320-day-ja-03-tree-partner.png`, `after/375-night-ja-02-tree-mine.png` |
| 2 | しまフォン: remove the clock and the leaf | Status row removed; デモ is a small chip under the grid (it was also clipped by the sheet's top) | `28b0124` | `shots/390-day-ja-05-phone.png` → `after/390-day-ja-05-phone.png` |
| 3 | Outline every app tile, like あそびかた / サウンド | One squircle for all six: the fill, the round-13 edge (2px outline + 4px lip in a darker shade of the fill, via `::after` so the art can't cover it); the three official full tiles sit on their own background colour (`#8B97EB`, `#76D787`, `#FD5967`) so their baked-in corners vanish | `28b0124` | `after/390-night-ja-05-phone.png`, `after/320-night-ja-05-phone.png` |
| 4 | Tiles got a stray outline after ‹ back | `ui/modality.ts` keeps `<html data-input="pointer|keyboard">`; while the last input is a pointer, `:focus-visible` draws nothing (text fields excepted). Focus is still restored for keyboard / VoiceOver everywhere (‹ back, きろく edits, sheets). No `:hover` styles exist; `:active` transforms end with the element. e2e: tap → back has no ring and `data-input=pointer`; Tab shows it | `d0d6b2c` | e2e `focus ring` |

**Island measurements** (Chrome, `?demo`, day; island = hedge top 32u to beach foam 356u; "cold" = `--doc-height`
20px shorter):

| Size | ribbon bottom | island (px) | centre − band midpoint | island → phone gap | stage width |
|---|---|---|---|---|---|
| 320×568 | 64 | 110–414 | 0.0 | 45.8 | 366 |
| 320×568 cold | 64 | 100–404 | 0.0 | 35.8 | 366 |
| 375×667 | 64 | 132–491 | 0.0 | 68.3 | 431 |
| 390×844 | 64 | 202–594 | 0.0 | 137.7 | 473 |
| 393×852 | 64 | 204–600 | 0.0 | 140.1 | 477 |
| 430×932 | 64 | 224–660 | 0.0 | 160.2 | 524 |

(cold launches: every size 0.0 off centre, gap ≥ 35.8px.) Before: the island's centre sat 70–193px below the midpoint
and the beach ran 20–28px under the phone.

## Lead additions

| Request | Fix | Commit | Shots |
|---|---|---|---|
| Treat guide (no cap) + protein tip | あそびかた: 「食べものの ごほうびは、ふたりで 週3回くらいが めやす。のこりの ベルは ほしいものや 旅のごほうびに ためよう！」 under ごほうび, and a 「たんぱく質の ヒント」 card (1.6 g per kg a day; per person from the goal weight, else the trend, rounded to 5 g: ウェイ 約105 g・うめ 約90 g in the demo; "not tracked, just a tip"). The wallet: one quiet line 「食べものは 週3回くらいが めやす。あとは ためよう！」 | `9340d1b` | `after/390-day-ja-06-app-help-end.png`, `after/390-day-en-18-wallet-end.png` |
| Milestones (v2 from 11-02) | Tree popup: today's **4 yuzu pips** per ring fruit (none for 🥥), the week as a small 「2/5」 (✓ disc at the badge), so the two kinds of pips can't be confused; **one** nudge line under the rows, 「あと 44 kcalで +34」, for the tapped fruit or the fruit nearest its next step (one clear next goal, not five). v1 weeks show neither. あそびかた: 「ベルは 4つの だんかいで ふえるよ…さいごの だんかいが いちばん 大きい！」 and per fruit a 4-cell step table (amount over ベル, the goal step ringed). e2e pins the clock for the v1 test and adds a v2 one | `6f9ed44` | `after/v2/390-day-ja-02-tree-mine.png`, `after/v2/320-night-en-02-tree-mine.png`, `after/v2/390-day-ja-06-app-help.png` |
| Imports from `time/dates.ts` | きろく imports `addDays` / `weekKeyOf` / `localDateAt` from `time/dates.ts`; `scoring/index.ts` deleted (nothing else used it). `model/state.ts`'s `localDateAt` re-export stays: `model/history.ts`, `weight.ts` and `bells.ts` still import it | `6c0da4d` | |

## Polish findings → fixes

| Finding | Fix | Commit | Shots |
|---|---|---|---|
| Sheets scroll their title bar (and ✕) away (the menu editor opened with its title cut off) | The sheet title bar is sticky with a fade | `6babd86` | `shots/390-day-ja-21-editor.png` → `after/390-day-ja-21-editor.png` |
| きろく ベル wrote 10月30日(金); every other screen 10/30(金) | `dayTitle` everywhere; Fredoka for the dates | `6babd86` | `shots/390-day-ja-16-kiroku-money.png` → `after/320-day-ja-16-kiroku-money.png` |
| とりけす wrapped onto its own line under a spend | Sits on the spend's line (wraps only on a narrow phone) | `6babd86` | same |
| Adult です/ます and stiff copy for a 10-year-old | 「20〜300 kgで 入れてね」, 「まだ なおしてないよ」, 「まだ 記録が ないよ」, 「あせらず、ゆっくり いこうね」, the sound note rewritten, 体重を **なおす** (not 修正: one word for fix), 「見つからなかったよ」, 「まだ とどいてないよ」 | `6babd86` | |
| Harvest end said 「うめさんの番です」 (whose turn, for what?) | 「あとは うめさんが 受け取るだけ」 / しずえ 「あとは うめさんの ばんですよ！」 (en "Now it's Ume's turn to collect") | `6babd86` | `shots/390-day-ja-23-harvest-end.png` |
| Night: yuzu 30% over navy turned the day's ベル strip grey | `--hl` token: yuzu by day, cream 14% at night; used by the strip, pressed rows and the help chips | `eaf8a14` | `full/320-night-en-12-day.png` → `after/320-night-en-12-day.png` |
| あそびかた's Move line wrapped on 「（きろくで かえられる）」 | Dropped (the goal's home is きろく 目標) | `eaf8a14` | `full/375-day-en-06-app-help.png` |
| Weight table ✎ were bare pencils (no edge: breaks "brown edge = tappable") | One `.pen-btn` (edged cream object) for every ✎ | `75a81f6` | `after/390-night-ja-08-weight-end.png` |
| A gym arrival's chip said 筋トレ✓ | ジム✓ / Gym✓ | `75a81f6` | `after/390-night-ja-12-day-end.png` |
| Wallet item art read small in big tiles | 48 → 60px | `9340d1b` | `after/390-day-en-18-wallet-end.png` |
| Harvest at 320: 「200 ベル」 orphaned on its own line | Phrase-aware wrapping | `8fffa01` | `final/320-night-ja-22-harvest.png` → `after/320-night-ja-22-harvest.png` |

Checked and fine: ✕ top-right / ‹ top-left on every sheet and app (e2e navigation walk), centred titles, one rise /
one slide motion and none under reduced motion, `data-sfx` on every tappable (`taps.test.ts`), targets ≥ 44px, no
horizontal scroll at 320, the ribbon / plate / dialogue cream at night.

## Debloat

| Removed | Lines |
|---|---|
| `PhoneButton`'s small variant (its one user is the island) | −10 |
| `IslandScene` `onme`, `night`; `Fx` `scale` (no caller) | −20 |
| `sheets/ripeness.ts` (old ring sheet; inlined as islandLife's `stage`) | −5 |
| Three copies of the ✎ button and two of the ＋ add button → `.pen-btn` / `.add-btn` in `theme.css` | −20 |
| Dead `theme.css`: `.btn.yuzu`, the wallet's old `.cards` entrance rule, an empty "round icon button" header | −4 |
| しまフォン status row (clock, leaf, their imports and CSS) | −11 |
| `scoring/index.ts` re-export | −3 |
| e2e: the "answer しずえ's questions" helpers (no questions since ADR 0021) | −30 |
| Past-design words: the harvest's `.pot`, "visit" / "pot" in comments | 0 |

**UI lines** (`components` + `routes` + `i18n` + `styles`, no tests, no generated `fonts.css`): **9,504 → 9,610**. The
cleanup removed ≈ 100 lines; the round added ≈ 210 for new behaviour the user asked for (the milestone pips, nudge and
help tables, the treat guide and protein tip, the input-modality focus fix, the popup flip, the island layout). e2e
696 → 714 (+2 tests, −the question helpers). `npx knip` clean, `usage.test` / `taps.test` / `nav.test` / `fonts.test`
green.

## Verification (each chunk)

`npm run check` 0 errors · `npx vitest run` 790 passed (while the engine engineer had uncommitted work, some engine
tests were red in the shared tree; never from these files) · `npm run build` · `npm run e2e` 23 passed · `npx knip`
clean · `npm run fonts:subset` after every ja change. Every push's Pages deploy succeeded.

## Remaining ideas

- **Ground fruit vs milestones.** The ground still drops thirds of the goal (0–3 items); with v2's four steps, one item
  per step (0–4, the 4th = the goal) would make the island say exactly what the popup says.
- **Tall phones.** At 390–430 the centred island leaves 140–160px of sea above the phone; a gentle wake/boat or a
  second glint band there would be cheap NH-faithful life. Or let the stage grow a little more on tall screens.
- **The undo banner** sits at the bottom inside sheets and covers the menu editor's やめる / 保存 for 5 s; design.md
  T says the banner belongs under the status row (top).
- **v1 help lines** (`help.pay.*`) go dead after Sun 11-01; delete them (and the v1 branch in `HelpApp`) next week.
- **Night badges**: unearned badge discs are dark on navy (hard to count at a glance); a lighter disc at night.
- **320 sky**: the sun / moon hide behind the ribbon's swallow-tail at 320×568 (the sky band is 85px); nudge the orb
  right or lower on compact screens.

## Requests

To the code/docs engineer:

1. **`DayDetail.visits` → `arrivals`.** `model/history.ts` still exposes the gym arrivals as `visits` ("keeps its old
   name for DayDetail.svelte"). Rename the field to `arrivals` (type `DayArrival`); tell me and I'll switch
   `kiroku/DayDetail.svelte` in the same push, or change the one line (`x.visits` → `x.arrivals`) yourself.
2. **`model/state.ts` `export { localDateAt }`.** No component uses it any more; `model/history.ts`, `weight.ts` and
   `bells.ts` do. Point them at `#lib/time/dates.ts` and delete the re-export.
3. **design.md updates** (docs are yours): §1.1 / §R island: centred between the ribbon and the phone, `--hud-bottom`,
   `--island-bottom` = the phone's top, `--phone-h` 92px, no front-beach tuck (`TUCK_U` and `PLATEAU_BOTTOM` deleted from `scene.ts`); §1.3 しまフォン: no status row (デモ chip under the grid), every tile one squircle with the
   round-13 edge; §N: the sheet title bar is sticky; §T buttons: `.pen-btn`, `.add-btn`, `--hl`; the focus rule
   (`data-input`, no ring after a touch); §1.1 tree popup: today's milestone pips, the week as 「n/m」, the one nudge;
   あそびかた: treat guide, protein tip, the step tables.
4. **Demo clock.** The demo builds its rows from `Date.now()` and ignores `?date=`; a `?date=` that also moved the demo
   calendar would let anyone preview v2 weeks without a pinned clock.
