# Round 22: UI/UX review

**Team:** senior UI engineer, UX designer (kids and young adults), game designer (NH / Pocket Camp), front-end
performance engineer. **Scope:** `components/`, `routes/`, `styles/`, `i18n/`, `e2e/`, `static/art` (later also
the scenery files and the service worker's precache). The code engineer worked in parallel. The handoff between us is
in [handoff.md](handoff.md).

## Method

- Builds of HEAD in a separate worktree, served as static files (`/tmp/r22-ui/serve.mjs`, SPA fallback). The
  baseline is `4c4215e`, the commit before this round, served on :4198.
- Playwright with the installed Chrome, touch, DPR 2, `ja-JP` / `Asia/Tokyo`, emulated safe areas: 320×568 and
  375×667 20/0, 390×844 47/34, 393×852 and 430×932 59/34. Each walk covers 16 configurations: all 5 sizes in day and
  night (ja v1), v2 at 390 day, 393 night and 320, and en at 375, 430 and 320. That is 41–44 screens per walk, about
  680 screenshots per iteration, and every screen family was looked at.
- `measure-page.js` checks every screen for these:
  - centring, nav insets, and grid gaps;
  - tap targets and `data-sfx`;
  - overflow and clipping;
  - ja breaks inside a phrase;
  - WCAG contrast;
  - art scaling;
  - pairwise overlaps of controls, text, and HUD and scene pieces (now with critters, the bobber and the catch);
  - `elementFromPoint` stacking;
  - focus order against the visual order;
  - safe areas;
  - new this round: equal left and right margins (±1px) and the root's side padding.
- Perf (`/tmp/r22-ui/perf.mjs`, 390×844 DPR 3, CPU throttled 4×): CDP `Performance.getMetrics`, longtask and
  layout-shift observers, wrapped timers / rAF / listeners, `Memory.getDOMCounters`, heap after GC, and Chrome traces.
  Frame timing comes from `PipelineReporter`. Lighthouse 12 (mobile) runs on the live Pages site.
- Code-size counts (`/tmp/r22-ui/counts.mjs`), and unused props, tokens, CSS classes and art (`propuse`, `tokuse`,
  `cssuse`, `artuse`).
- Scripts are in `/tmp/r22-ui/` and none are committed.

Screenshots:
- `/tmp/r22-ui/i1/`: baseline walk, the しまフォン design
- `/tmp/r22-ui/i2/`: after iteration 1
- `/tmp/r22-ui/i3/`: first walk of the panel; it found the banner and footer regression
- `/tmp/r22-ui/i5/`: final, the panel in two tabs
- `/tmp/r22-ui/panel3/`, `panel4/`, `tabs/`: the panel at 320–430 in day, night and standalone, both tabs
- `/tmp/r22-ui/ribbon2/`: the ribbon centred in the sky
- `/tmp/r22-ui/pop/`: the tree popups with the sync line
- `/tmp/r22-ui/catch-320.png`: a catch caption

## Iteration 1 (the しまフォン design): findings and fixes

| # | Finding (measured) | Fix |
|---|---|---|
| 1 | **Whose data is being edited** was a soft `うめ · 10/26(月)` in a subtitle, and nothing at all for my own data. | Every edit screen opened with an avatar + name chip (`· あなた` for mine). Manual health edits were later removed. The two goal screens keep the chip. |
| 2 | **404 overflowed**: the page measured 336px at 320 and 395px at 390. The keep-all title 「このページは見つかりませんでした」 was one 16-character word. The **harvest overlay** also showed over the error page. | Spaces were added to 17 ja strings that had runs of 11–24 unbreakable characters. `linebreaks.test.ts` now caps a run at 12. The grid column can't grow past the screen, and there is no harvest on error pages. |
| 3 | **A sheet opened during the undo banner scrolled 43px**, hiding the editor's intro under the bar. Round 21 had left this. Cause: `showModal()` focused the banner's とりけす first. | `focus({preventScroll})` + `scrollTop = 0`; covered by e2e. |
| 4 | **A sheet's scene loops kept running** with the phone open: 5 animations, compositor frames at 60 fps. | Clouds, glints, stars, fireflies and the idle bob pause under `[data-covered]`. Now 0 running animations and 0 style recalcs in 10 s. |
| 5 | **Idle life polled every 2 s forever** when covered or under reduced motion: 5 timeouts per 10 s. | It sleeps until a touch or a key. Now 0 timeouts. |
| 6 | Canopy `aria-label` had a double space when a fruit had no ベル. `ウェイ· あなた` lost its space. | Fixed. |
| 7 | Partner card and tree popup (user request): show when each person last synced. | A soft last line in the popup: 「15:24 に とどいた」, 「きのう 21:10」, 「10/29」 or 「まだ とどいていません」. A dot appears once the data is more than `SYNC_LATE_MS` (6 h) old. The minute clock ticks only while a popup is open. The partner card dropped its line (one home per datum). The popup grew 18px and still sits under the ribbon at 320–430. |
| 8 | Week screen: how long the week stays editable wasn't shown. | Done, then removed with manual edits. |

## Iteration 2: re-walk (`i2`)

- **Removed:** 21 rotated-plate false positives (the 404 page) and the 404 overflow.
- **New:** the taller popup now covers more of the canopy, and at 320 it covers the jar's lid (51 instead of 33px).
  This is by design: a tap on the popup closes it, and the measured stacking is right. It is left as is.
- **Stacking overlaps: none new.** Text overlaps were up 20, all from content scrolled under a sticky title (a
  measurement artifact).

## Iteration 3: the panel redesign (lead's top priority)

- **No しまフォン:** tapping the ribbon opens a top sheet, 「しまの てちょう」.
- **Two tabs,** pinned under the title (a user request):
  - **きろく:** the ベル ledger, からだ, 目標 and the weeks;
  - **せってい:** むらびと, サウンド, ことば, つうしん and あそびかた.
- **Tab behaviour:** it opens on きろく and remembers the last tab for the session; the tabs hide while a level is open.
- **Levels:** a week, a day, the weight screen, a goal, the picker and the guide push a level with ‹.
- **Loading:** the panel is lazy-loaded on the first tap.
- **Island:** centred in the whole ocean, horizon to the home indicator: above = below = 55 / 64 / 95 / 96 / 105px at
  the five sizes (±0).
- **Removed:**
  - the voice setting and the blips (with a subagent);
  - the phone shell, its tiles and 6 phone art files;
  - the `i-note` sprite, `NOOKPHONE`, `openKiroku` and `phoneEntry`.
- **Regression found and fixed:** the first panel walk found 97 new `stolen` taps. My Sheet rewrite had dropped the
  undo banner's footer lift, so 買う！ and やめる sat under the banner for 5 s. The lift is restored, and e2e now checks
  that a tap on 買う！ reaches it.
- **User bug (tabs clipped, gap at the bottom).** Two causes:
  - The fade under the tab row painted over the tabs' 4px lip.
  - The sheet stopped 24px + the safe area short of the bottom.

  Measured after the fix: 0px of lip clipped and a 0px bottom gap at all 5 sizes, day and night, in the browser and
  standalone (`--doc-height`). e2e pins both.
- **The ribbon lowered** (user request) so its centre sits in the middle of the sky: 135 vs the band's middle 137.5 at
  390, within ±2px at every size.
  - The sun and moon moved low-left, cloud C1 high and C2 low, so nothing hides behind the ribbon.
  - **Balloons:** their lane now starts under the ribbon. The old lane sat above the ribbon's bottom, so `onMount`
    skipped every balloon, which is why none were seen.
  - The tree popups still open under the ribbon; their nameplate's top stays at or below the ribbon's bottom.

## Final audit (`i5`, HEAD `43382a7` + the ribbon)

| Check | Baseline `i1` | Final `i5` | Note |
|---|---|---|---|
| Taps that don't reach their control (`stolen`) | 18 | **12** | <ul><li>4: the open tree popup over its own canopy at 320. Intended: a tap closes it.</li><li>6: the wallet's ✎ under the 5 s undo banner at 393, left since round 21.</li><li>2: the same with a bug flying.</li></ul> |
| ja breaks inside a phrase | 71 | **50** | All 50 are rotated nameplates (日曜の収穫, しずえ), which the checker reads per glyph. |
| Unequal margins / off-centre titles | not measured | **0** | |
| Overflow, clipping, taps < 44px, missing `data-sfx` | 0 | 0 | |
| Control overlaps | 92 | 168 | 84 are the jar's 64px box against the canopy and fruit-row boxes (an r21 decision, the jar on top). The rest are content under the panel's sticky title/tabs, which the checker doesn't clip. |
| Contrast below WCAG | 14 | 14 | All false positives: the editor's `ベル` unit is drawn on the input's own cream fill. |

## Performance (390×844, CPU 4×)

| Scenario | Baseline | Final |
|---|---|---|
| Island idle, 10 s: main-thread CPU / rAF / intervals / long tasks | 0.20% / 0 / 0 / 0 | **0.10%** / 0 / 0 / 0 |
| Island idle: running animations (all CSS, compositor) | 7 | 7 |
| A sheet open, 10 s: running animations / style recalcs | 5 / 1 | **0 / 0** |
| Hidden tab, 10 s: CPU / layouts / style recalcs | 0.36% / 11 / 39 | **0.14% / 0 / 1** |
| Reduced motion, 10 s idle: timeouts set | 5 | **0** |
| Tree popup open/close: CPU, long tasks, CLS | 81 ms, 0, 0 | 78 ms, 0, 0 |
| Open きろく → a week → back → close | phone: 284 ms CPU, 0 long tasks | panel: 299 ms, 1 long task (62 ms, TBT 12, the first open's chunk + mount) |
| The panel open: DOM nodes | phone + きろく: 1,103 | 1,290. First version: 2,555 with 2 long tasks (101 ms max). Fixed by showing the newest 3 ledger weeks and 4 week cards first, with 「まえの週も 見る」 for the rest. |
| Wallet buy → undo; the harvest | 0 long tasks, CLS 0 | 0 long tasks, CLS 0 |
| Frames during transitions (PipelineReporter) | 0 dropped frames affecting smoothness | ≤ 2 (run-to-run noise; the baseline re-run shows the same) |
| Leak check: 10 cycles of popup + partner card + panel (all tabs and pushes) | heap +0.81 MB, DOM nodes −41, JS listeners −3, timers 12 → 6 | heap +0.82 MB, DOM nodes −20, JS listeners −2, timers 7 → 7: no growth |
| A minute tick | — | ≈ 10 ms of task time at 4× (≈ 2.5 ms real) |
| First load JS on the island (node 2 chunk) | 79.1 kB (27.9 kB gzip) | 67.4 kB (24.1 kB gzip) before the panel; every phone app was split out, then the panel became one lazy chunk |
| Warm load from the service worker (4×, slow 4G) | — | FCP 160 ms, LCP 276 ms |
| Install precache | — | −23 critter files (92 kB on disk, cached on first use) |

**Lighthouse, mobile, live Pages:** Performance **92–94**, Accessibility **100**, Best Practices **100**. FCP 1.3–1.6 s,
LCP 3.1–3.3 s, TBT 20–30 ms, CLS 0. The LCP is the oak image; 51% of LCP is load delay, because the image is only
discoverable after JS renders the scene. The oaks now load with `fetchpriority=high`. Lighthouse against the local
static server (no gzip) gave 68–79, which is useful only for comparing builds with each other.

## Code quality (user priority)

- **Never-passed props removed:**
  - `Fx.count`, `Jar.band` / `Jar.class`, `Bells.bag`, `OfficialArt.class` (it gained `priority`), `LeafCoin.kind`;
  - `WeightChart.weeks` (always the same value), the formatters' `locale` parameters, and `hedgePair`'s season.
- **Tokens removed:**
  - `--hud`, `--dur-slow`, `--fill-on-bg`, `--stage-h`, `--phone-h`, `--tile`, `--tile-gap`, `--r-tile`;
  - three CSS variables that were never set (`--dur-bob`, `--isle-pad`, `--sky-max`) were inlined.
- **One helper per job:**
  - `md()`, `formatNum`, `dayTitle`, `mulberry32`;
  - `badgeGoals` was replaced by the view's `weekGoalDays`;
  - the island's host line now comes from `view.harvest` alone;
  - single-file types were un-exported.
- **Comments:** about 230 history notes (review-round tags, ADR numbers, "used to") were rewritten, plus 54 doc
  references that pointed at deleted files. They now say the rule and its why, and point at the current `design.md`
  / `backend.md` headings.
- **e2e:**
  - dead absence checks (gym chip, 🥥, pots, grabber) removed;
  - fixed sleeps replaced by waits on animations or on `toBeEnabled`;
  - 8 new tests: the 404 at 320, a sheet opened during the undo banner, the footer above the banner, the tab memory,
    the tabs and the bottom gap, the light first open, the sync line, and the partner card without a sync line.
  - The suite went from 26 to 36 tests, plus the critter specs.

| Count | Before | After | Without the new critters (another engineer's) |
|---|---|---|---|
| UI files / lines | 104 / 10,995 | 106 / 11,701 | 10,642 lines (−353) |
| Components (.svelte) | 68 | 65 | 64 |
| CSS rules | 1,301 | 1,346 | 1,258 (−43) |
| Tokens | 163 | 156 | 156 |
| Sprites | 12 | 11 | 11 |
| i18n keys | 255 | 246 | 221 (37 of the −34 net went with the edit removal) |
| Art files / bytes | 439 / 5.17 MB | 450 / 5.20 MB | 427 / 5.15 MB (−12 files: 6 reactions, 6 phone) |

## Left, and why

- **Art drawn below 2× on a 3× screen** (items 96px at 60, bushes, the airport): this needs larger source files. The
  villager renders are the reverse: 512px tall for an 80px draw, about 58 kB more than needed. Both are fetch-size
  changes in `scripts/fetch-assets.ts`, flagged for the code engineer.
- **13 render-blocking CSS files** on the first load: SvelteKit links the lazy chunks' CSS up front. Raising
  `kit.inlineStyleThreshold` (svelte.config) is suggested in the handoff.
- **The wallet's ✎ under the 5 s undo banner at 393:** left since round 21. Moving the banner up would cover the
  balance.
- **The open popup over the jar's lid at 320:** a tap on the popup closes it, by design.
- **The undo banner hold during Playwright runs:** the mouse rests where the banner appears and pauses it. This is a
  test artifact; on a phone, a touch ends with pointerleave.

## Last batch (user feedback on the scenery)

- **Fishing (ad8992e):** the bite now has a 「！」 pop, a bigger dip and its own sound; nibbles are small wiggles. The bite
  window is 1.6 s. The first early tap only makes the fish hesitate; a second one scares it off. While the bobber is
  out, a tap anywhere on the sea reels in. The cast reaches 1.5× as far. Played in Playwright with real timing,
  reacting to the 「！」 after about 400 ms, at 390 and 320 (`/tmp/r22-fish/bite-390.png`, `bite-320.png`).
- **More bugs:** 11 more NH species, with official icons cached on first use (`/tmp/r22-fish/bug-*.png`).
- **Balloons are back:** they had been skipped because their lane sat above the ribbon. They now fly in a lane under
  the ribbon at every size (`/tmp/r22-fish/balloon-*.png`, `balloon-real-320.png`).
- **"For fun, frequent":**
  - Seasons only weight the odds: 3× in a species' NH months. Hours still keep butterflies to the day and fireflies
    and moths to the night.
  - A critter visits every 8–15 s; a fish comes whenever the sea is empty.
  - A shaken bush lets a bug out 1 in 3.
  - A balloon every 45–90 s by day; a shooting star every 15–40 s at night.
  - `?critter=` now shows that one critter alone, so the e2e is deterministic: `critters.spec` passed 3 runs in a row
    (`--repeat-each`).
- **Economy leftovers:**
  - the low-week beat now fires under 6 ベル by Thursday;
  - `dayScore`'s unused argument is gone;
  - the `remove` cue and its `poof` sound are gone;
  - the Gallery sample now shows 26 ベル.

## Not started

The next scenery brief: more fish, more bugs, beach finds, villager chats, island care, visitors and a shared ずかん
with a `find` event and a Code.js change. It touches `scripts/fetch-assets.ts` and `static/art/manifest.json` while the
roster engineer has uncommitted work in both, and it needs a backend change. It should start from a clean tree, after
the roster commit lands.
