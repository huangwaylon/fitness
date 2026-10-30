# Round 16: whole-codebase code review (senior engineer)

**Date:** 2026-10-30. **Scope:** all of `app/` (`src/lib/**`, `src/routes/**`, `src/service-worker/`, `gas/`, `scripts/`,
`e2e/`), `.github/`, `package.json`, `knip.json`. This review was written after the day's parallel work landed: the ベル economy
(ADR 0019 and its amendments), the weight trend (ADR 0020), the one-format Shortcut ingest, the button tiers, sound and music,
158 villagers, tree popups, scene taps (`783436c`), the app icon and the viewport fix. **No code was changed.** Line numbers
refer to `574f966`.

## Numbers

| Command | Result |
|---|---|
| `npm run check` | 551 files, **0 errors, 0 warnings** |
| `npx vitest run` | at `aeb8615`: **4 failed** / 712 passed (716), all four in `styles/fonts.test.ts` because the glyph 鳴 (the new `sound.silentNote`) wasn't in the font subset. This made CI run 41012059767 fail and blocked the deploy. At `574f966` (font re-subset): **43 files, 716/716 passed**, 0.9 s |
| `npx knip` (6.44.0) | clean. The only hit was the untracked `app/.r16ux-walk.mjs`, another reviewer's scratch file, not repo code |
| `npm run build` | OK, client built in about 0.35 s |
| First island load (`/`: entry + layout node 0 + page node 2 and their static imports) | **JS 20 files, 360 KB raw, 129 KB gzip; CSS 8 files, 133 KB raw, 30.7 KB gzip** (fonts not included; they load lazily) |
| Of which sound | about **5.5 KB gzip** (engine 3.0, sound.svelte 1.5, manifest 0.7, ambient 0.35). `synth.ts` is a lazy chunk (1.9 KB gzip). No audio is bundled |
| Of which villagers | roster + species about **7 KB gzip** (chunk `CxjDVo4s`), plus the inlined art manifest (388 entries, 316 of them villager) about **3.6 KB gzip** in the main chunk |
| Service worker precache | **134 files, 1.43 MB**: `_app/immutable` 632 KB, **icons 423 KB** (two 512 px PNGs at 186 KB and 162 KB), trees 104 KB, host 67 KB, villagers 54 KB (only goldie and anchovy, render and icon = 4 of 316 files). **No audio** (14 MB of music stays runtime-cached with LRU 3) and no fonts |
| `npm run bench` (year 3, hourly, compacted, 13,213 rows) | reduce 8.3 ms, reduce + buildWeekView 18.8 ms, historyWeeks 12.2 ms, bellsLedger 8.1 ms, weekDetail 1.0 ms. Year 3 raw (50k rows): reduce + view 28.9 ms. compactRows (year 3) 12.0 ms. Golden: reduce + view 1.0 ms |
| Secrets | no 64-hex string in the tracked tree, the untracked files or git history (`git log --all -p -G`) |
| Lockfile | 129/129 `resolved` URLs are `registry.npmjs.org`. `.npmrc` pins it and `lockfile.test.ts` enforces it |

Verdict: the codebase is in good shape for a day of parallel landings. Types are clean, knip is clean, the bundle is modest,
and the precache rule holds. The problems are mostly at the seams: a time-of-day-dependent e2e test, half-wired scene sound,
error paths that leave sync stuck, some removed concepts still accepted by the contract, and a lot of stale provenance comments.

---

## Findings by severity

Each finding is marked **[M]** (safe mechanical: can be done in bulk with no design decision) or **[J]** (needs judgement).

### High

**H1. [M] The scenery e2e test fails at night in Tokyo.** `app/e2e/scenery.spec.ts:39` does `page.goto('?demo')` without
`&date=`, so the scene uses the real JST time (`playwright.config.ts:20` sets `timezoneId: 'Asia/Tokyo'`, and the demo clock
is the wall clock). From 19:00 to 05:00 `.orb` is the moon: `SceneTaps.svelte` makes `data-fx="moon"`, but the `['sun', …, 'sun']` row
(line 52) expects `sun`. **Why:** CI gates the deploy on `npm run e2e`, so any push in the evening is red. `retries: 1` doesn't help
because the failure is deterministic. **Fix:** `await page.goto('?demo&date=2026-11-04T12:00');`. Add a second test,
`'night sky: the moon and a shooting star'`, with `date=2026-11-04T22:00`, asserting `[data-fx="moon"]` and then `[data-fx="star"]`.

**H2. [M] A rejected snapshot fetch wedges sync until reload.** In `app/src/lib/sync/cache.ts:190-196` (`refreshSnapshot`) and the
same pattern in `app/src/lib/sync/queue.ts:184-195` (`flushing`), `void p.then(() => { if (fetching === p) fetching = null; })`
only clears the in-flight promise when it succeeds. If `fetchSnapshot` rejects (for example an `ok: true` reply without `rows` makes
`mergeRows` throw at `model/snapshot.ts:56`, or an IndexedDB write fails), every later call returns the same rejected promise
forever, and the rejection is unhandled. In `app/src/lib/store/live.ts:88-93` `h.syncing = true` has no `try/finally`, so
the throw also leaves the SyncPill spinning and the sync buttons disabled. **Why:** the app looks frozen offline with no way to
recover except a reload, and nothing gets logged. **Fix:**
```ts
// cache.ts / queue.ts
void p.finally(() => { if (fetching === p) fetching = null; }).catch(() => {});
// live.ts refresh()
h.syncing = true;
try { await this.#flush(false); const r = await refreshSnapshot(); /* … */ }
finally { if (seq === this.#refreshSeq) h.syncing = false; }
```
Also wrap `fetchSnapshot`'s body in `try/catch → { ok: false, error: 'unavailable' }`. Add the test
`sync.test.ts: 'refreshSnapshot recovers after a malformed ok reply'` (first call rejects or returns an error, second call
issues a new request).

**H3. [J] Scene taps are silent: `sceneSfx` is still a no-op although sound has landed.** At `app/src/lib/components/island/sceneTaps.ts:72-79`
the comment says "A no-op until src/lib/sound/ lands on main". `src/lib/sound/cues.ts` is on main, so all 14 `sceneSfx(...)`
calls in `SceneTaps.svelte` (lines 128-189) do nothing. **Why:** the feature is half wired and the comment is false. Two features
were built in parallel and nobody owned the join. **Fix:** add `SCENE_CUES: Record<SceneSfx, Cue>` to `sound/cues.ts`, all with
`world: true` so they're muted while a sheet is open, and make `sceneSfx = (k) => cue(SCENE_CUES[k])`. Add the cue ids to
`sound/ids.ts` and synth placeholders. Test: `'every SceneSfx maps to a world cue'`. Note the unlock order: SceneTaps fires on
`pointerdown` (`SceneTaps.svelte:111`) but audio unlocks on `pointerup` (`sound.svelte.ts:154`), so the very first tap's sound is
lost. Unlock on `pointerdown` as well.

**H4. [M] Music can stay muted after the app goes to the background and comes back.** `app/src/lib/sound/engine.ts:375`: the
delayed `setTimeout(() => d.key === key && d.el.play())` in `#fadeIn` checks only the deck key, not `#token` or `document.hidden`.
`pause()` (lines 440-451) bumps `#token`, zeroes the gain and pauses, but keeps `d.key`. If the page hides inside the fade
window (up to 1 s), the timer restarts playback in the background. On return, `setTrack` takes the same-key branch
(`:332-333`), which only fades in `if (cur.el.paused)`, so the gain stays at 0 until the next hour. **Fix:**
`const token = this.#token; setTimeout(() => token === this.#token && d.key === key && !document.hidden && d.el.play().catch(() => {}), …)`,
and at `:333` use `if (cur.el.paused || cur.gain.gain.value < 0.01)`.

### Medium

**M1. [J] Removed event types are still accepted end to end.** `approve`, `transfer` and `transfer_undo` remain in
`app/src/lib/contract/api.ts:26,28` (`EVENT_TYPES`), `api.ts:44-45` (`MONTH_RE`), `app/gas/main.ts:492-493` (server validation),
`app/src/lib/sync/queue.ts:108-109` and `app/src/lib/model/state.ts:403-404,453` (`ON_EVENT`, the `ignored` set). No client emits them.
**Why:** the server will still append rows of a concept that was removed with yen, and `Code.js` carries the dead validation. Old rows
are already harmless, because `state.ts:301` ignores types not in `EVENT_TYPES`. **Fix:** delete them from all five places, delete
`MONTH_RE` and `ignored`, reword `state.ts:299-300` to say that old `share`/`approve`/`transfer`/`transfer_undo` rows are unknown types and
are ignored, then run `npm run gas:build` and redeploy. Check the tests that build these events.

**M2. [J] Shortcut step and minute values have no upper bound.** At `app/gas/parse.ts:126`, a non-weight value is stored as
`Math.round(n)` with no check against `METRIC_BOUNDS` (`contract/api.ts:52`: 100,000 steps, 1,440 min), which manual edits do get.
Steps and minutes keep the day's maximum (`gas/main.ts:386,393`), and the model doesn't bound uploaded rows either. **Why:** one bad
Shortcut line (for example `856400`) becomes that day's permanent step count. Bells are capped by the goals, but きろく and the chart
would show it. **Fix:** `if (n > METRIC_BOUNDS[metric]) { skipped++; warnings.push(…); return; }`. Test:
`'a step value above METRIC_BOUNDS is skipped with a warning'`. Then rebuild `Code.js` and redeploy. Separately, at `parse.ts:66`
seconds aren't range-checked: `T08:59:75` parses to NaN and a workout is stored with `durationMin: NaN`. Add `|| Number(sec ?? 0) > 59`
and an `isNaN` guard.

**M3. [M] A failed synth chunk load kills effects for the session.** `app/src/lib/sound/engine.ts:129`:
`this.#synthLoad ??= import('./synth.ts').then(…)` has no catch. After a deploy the old chunk hash returns 404 (the case
`e2e/stale.spec.ts` covers for きろく), `whenReady().then(play)` (`sound.svelte.ts:61,130`) rejects unhandled, and because of `??=`
there's no retry. **Fix:** `.catch(() => { this.#synthLoad = null; })`. Also, at `engine.ts:347-358`, `setTrack` waits only for
`loadedmetadata`. Listen for `error` too (`{ once: true }`) so an undecodable file doesn't hang the hour.

**M4. [M] しずえ never falls asleep at 22:00 in a running session.** `app/src/lib/components/characters/Host.svelte:49-53`: `night`
is re-derived only when `theme.tod` changes, which happens at 19:00 and 05:00 (`ui-state/season.ts:46-48`). **Fix:**
`const night = $derived.by(() => { const h = jst(minuteNow()).hour; return h >= 22 || h < 5; });`

**M5. [M] Four host keys that the model emits don't exist in the catalog.** `app/src/lib/model/week.ts:126-129` returns
`host.pending_confirm`, `host.checkin_done`, `host.evening` and `host.morning`, and none of them is in `ja.json`/`en.json`.
`usage.test.ts` only scans the UI folders, so it doesn't notice. Today only `harvest_ready` is rendered (`routes/+page.svelte:68`),
so they're dead. **Why:** anything that later does `t(view.host.key)` would show a raw key. **Fix:** cut `hostLine` down to the
branches that are rendered (`harvest_ready`, `harvest_waiting`, `default`), or add the test
`'every host key the model emits exists in ja and en'`, which scans `lib/model` for `'host\.[a-z_]+'`.

**M6. [M] CI permissions and pinning.** `.github/workflows/pages.yml:14-17` grants `pages: write` and `id-token: write` to the whole
workflow, so the build job holds them while it runs dependency code (vite plugins, svelte-check, Playwright). Actions are pinned to
tags (`pages.yml:30,31,50,63`, `health.yml:20`), and checkout keeps `persist-credentials: true`. **Fix:**
- set `permissions: contents: read` at the top level and `permissions: { pages: write, id-token: write }` on the `deploy` job;
- pin each action to its commit SHA with a `# vX.Y.Z` comment (the existing Dependabot github-actions entry keeps SHAs current);
- add `with: { persist-credentials: false }` to both checkouts.

`cancel-in-progress: true` (`pages.yml:21`) can also cancel a deploy halfway. Use
`${{ github.event_name == 'pull_request' }}` [J].

**M7. [J] The ADR 0020 rule "weight is never rewarded" isn't enforced structurally.** `deps.test.ts` skips imports within a folder
(`if (from !== to)`), so nothing stops `model/bells.ts` from importing `model/weight.ts`. The behavioural test at `weight.test.ts:188` is
good. **Fix:** add the test `'model/bells.ts and scoring/* never import weight'` to `deps.test.ts`.

**M8. [M] ADR 0019's headline number isn't tested.** Nothing asserts **14,250 ベル** a week on target. `model/bells.test.ts:100` only
covers the every-day maximum. **Fix:** in `scoring/bells.test.ts`, add `'ADR 0019 amendment: a minimum on-target week is 14,250 ベル'`
(5×225 + 4×200 + 3×400 + 15×100 daily, plus 2,000 in badges each, plus the 1,000 duo bonus).

**M9. [M] ぜんぶできた has no test.** `app/src/lib/components/sheets/CheckinSheet.svelte:52-61` (`tickAll`, `disabled={allDone}`) is
covered by neither a unit test nor e2e. **Fix:** add the e2e test `'check-in: ぜんぶできた ticks every open habit'`, asserting that
every switch is `aria-checked="true"`, the button is disabled, and the ribbon goes up by `perTick ×` the number of habits that were open.
Also, `en.json:45` says "All three done" while the count comes from the versioned `HABITS` [J].

**M10. [J] The store and ui-state boundary allows a cycle.** `app/src/lib/deps.test.ts:20-21` lets `store` import `ui-state` (it does,
for toasts: `store/live.ts:7`, `store/actions.ts:6`) and `ui-state` import `store` (it doesn't). The header (line 2) states the
direction as store → ui-state. The regex (line 45) only matches single-quoted specifiers, and line 49 skips `$lib/…`. **Fix:**
remove `'store'` from ui-state's list, or move the toast queue below store. Match `['"]`, treat `$lib/` like `#lib/`, and fail on any
unrecognised relative or aliased specifier.

**M11. [J] Page-visibility handling is inconsistent, and some timers run while hidden.** There are four separate
`visibilitychange` listeners:
- sound suspends audio (`sound.svelte.ts:156`);
- `idleLife.svelte.ts:85` keeps polling every 2 s while hidden, for up to 10 minutes;
- `islandLife.svelte.ts:179-189` keeps a 30 s balloon check running while hidden;
- the layout only refreshes (`+layout.svelte:59`).

`IslandLife.hidden` starts as `false` (`islandLife.svelte.ts:52`), so a scene that mounts while the page is hidden isn't paused.
"Covered" is also defined twice: `ui.sheets.length > 0 || showHarvest` (`+layout.svelte:68`) and `paused || ui.overlay`
(`IslandScene.svelte:96`). **Fix:** add one `pageVisible` in ui-state through `createSubscriber`, like `minuteTick`. idleLife and
islandLife should clear their timers on hide and re-arm on show instead of polling, and a single `covered` getter in `ui.svelte.ts`
should replace both definitions. At minimum, seed `hidden = $state(typeof document !== 'undefined' && document.hidden)`.

### Low

**L1. [M] Leaked timers and frames.** `components/sheets/FruitRing.svelte:35-46`: the 2.6 s timer isn't cleared on unmount. Add
`$effect(() => () => timer && clearTimeout(timer))`. `ui-state/viewport.ts:38,51-56`: the cleanup doesn't cancel the pending rAF;
add `if (raf) cancelAnimationFrame(raf)`. `sound/engine.ts:462`: `sleep()`'s 800 ms suspend timer isn't cancelled by `resume()`/`unlock()`, so
turning sound off and on quickly leaves the context suspended. Keep the id and clear it.

**L2. [M] Unhandled rejection on an aborted navigation.** `ui-state/jarTransition.ts:43,53`: `nav.complete` rejects on abort. Use
`await nav.complete.catch(() => {})` in both places.

**L3. [J] The whole island re-renders once a minute.** `store/week.svelte.ts:75,84-88` assigns a new deep-reactive `view` on every
minute tick, so every `view.*` reader re-runs (the IslandScene derivations, FruitTree `spots`, the JarSpot effect at `JarSpot.svelte:75-77`).
The cost is small. **Fix:** declare `view` with `$state.raw`, since it's always replaced whole, and skip the assignment when the
minute tick didn't change the derived day or hour.

**L4. [J] Tree popup accessibility.** `FruitTree.svelte:179` puts `role="status"` on an element that appears already filled, so many
screen readers don't announce it. Keep the live region mounted and fill it, or use `aria-describedby` on the canopy button.
`IslandScene.svelte:108-126` closes the popup on pointerdown or Esc, but not when focus moves away; close on `focusout` too.

**L5. [M] Duplicated logic.**
- `components/pots/flow.ts:6-9` `potShare` repeats `splitPots` (`scoring/bells.ts:193-196`). Use
  `export const potShare = (pot, total) => splitPots(total)[pot];`.
- `scoring/bells.ts:119` `FRUIT_KEYS` repeats `FRUITS` (`config/rules.ts:9`). Import it.
- `components/island/progress.ts:15` hardcodes `3 * r.bells.perTick`. Use `DAILY.maxTicks * r.bells.perTick`.
- `RRect` is declared twice (`island/scene.ts:149`, `island/sceneTaps.ts:16`). Export it once from `scene.ts`.
- `scoring/targets.ts:17` re-normalises a value that is already a `WeekKey` (`weekKeyOf(weekKey)`). Drop it.

**L6. [J] Duplicated time and RNG helpers.**
- The Tokyo zone math lives in `time/dates.ts`, `time/clock.ts:58,67-76` (`JST_MS`, `jst`, `dayKey`) and `model/state.ts:53`. `nowInZone(new Date(t)).date`
  in `week.ts:23`, `view.ts:27` and `demo/rows.ts:32,37` is just `localDateOfMs(t)`, and `weight.ts:41-42` re-parses dates instead of
  using `dateMs`. Build `dayKey` and `daysBetween` on `dates.ts`, with one zone constant.
- There are three seeded RNGs: `island/scene.ts:140` (LCG), `sound/synth.ts:112` (mulberry32) and `store/demo/rows.ts:14` (mulberry32
  plus a hash). Share one mulberry32 between synth and demo. Leave the scene's LCG alone, because changing it would move the art layout.

**L7. [J] Three teardown styles.** Cleanup is written as `onDestroy` (`FruitTree.svelte:45`, `routes/+page.svelte:51`),
`$effect(() => () => …)` (`SceneTaps.svelte:67`, `CheckinSheet.svelte:37`) and an `onMount` return (`islandLife.svelte.ts:87`). The same
"timer bag" pattern is hand-rolled five times (`+page.svelte:43-54`, `SceneTaps.svelte:56-70`, `ui/keyboardInset.ts:13-22`,
`FruitTree.svelte:44-47,92-96`, `islandLife.svelte.ts:60`). Pick `$effect` returns and add one `timerBag()` helper (`later`, `clear`).
State management itself is consistent (rune singletons in `.svelte.ts`, no writable stores, no context).

**L8. [M] Components reach across folders by relative path.** Five files import `../../time/clock.ts` instead of `#lib/time/clock.ts`:
`ui/keyboardInset.ts:8`, `ui/Bubble.svelte:12`, `motion/director.svelte.ts:7`, `island/JarSpot.svelte:18`, `characters/Fx.svelte:20`.
Use the alias. [J]: the generic `ui/Bubble.svelte:10-11` imports `characters/Host` and `motion/director`. Consider moving it out of `ui/`.

**L9. [M] Repo hygiene.** `FruitTree.svelte:19-20` has a mis-indented, duplicated import from `#lib/art.ts`. Merge it into
`import { fruitArt, seasonArt, treeArt } from '#lib/art.ts';`. `.DS_Store` is now ignored (`574f966`).

**L10. [M] Lockfile test regex.** `src/lib/lockfile.test.ts:9` only matches `https://`, so an `http://` or `git+ssh://` `resolved`
would pass. Use `/"resolved": "([a-z+]+:\/\/[^/"]+)/g` and expect `['https://registry.npmjs.org']`.

**L11. [M] The key link stays in back history.** `store/live.ts:72` does `goto(resolve('/pair') + location.hash)`, which pushes a new
entry. The `/#key=…` entry stays in back/forward history (`pair/+page.svelte:27` only cleans `/pair`). Use `{ replaceState: true }`.

**L12. [J] knip isn't wired in.** `knip.json` exists, but knip isn't a devDependency, isn't a script and isn't in CI, so the clean result
here was luck. Add `knip` to devDependencies, a `"knip": "knip"` script and a `npm run knip` step after `check` in `pages.yml`.

**L13. [J] The bench has no budget.** `scripts/bench-model.ts:4` states "≤ 15 ms, year 3, compacted", but only in a comment. Today
reduce + buildWeekView is **18.8 ms**, already over that line, and nothing fails. The synthetic rows have no weight data, and
`weightTrend` isn't timed. **Fix:** add `model/perf.test.ts` with a loose budget (median below 50 ms) to catch order-of-magnitude regressions,
add daily weight rows to `syntheticRows`, and either update the comment's target or treat 18.8 ms as a regression to look at.

**L14. [J] Precache weight: the icons.** The two 512 px PNGs (186 KB and 162 KB) are 30% of the 1.43 MB install. They're 8-bit RGB,
so run them through `oxipng -o max` / `pngquant` in `scripts/icons.ts`. A 2-3× saving is typical for flat art. **[U]** Not measured.

**L15. [J] The app and backend disagree on minimum key length.** The app accepts 16+ hex characters (`sync/pairing.ts:19`,
`pair/+page.svelte:21`), but `gas/main.ts:26,28` requires 32+, so a short key just gets "wrong key". Use `{32,128}` in both places.

**L16. [M] Small test gaps.**
- `villagers/roster.test.ts`: add `expect(ROSTER_IDS).toHaveLength(158)` so a dropped row is noticed.
- `sceneTaps.test.ts`: add boundary cases for the horizon clamp and the bush and flower bands.
- `WeightChart.svelte:33-66`: extract `chartDomain(shown, carry, goal, mini)` and test the minimum span and tick steps [J].
- Sound orchestration (`sound.svelte.ts` opening flag, the 15 s announce window, `cues.ts:68` world cues muted while covered) is untested. Add `cues.test.ts`.

---

## Comments and docs

The codebase norm is a header of a few lines explaining *why*, with an ADR or design-doc link, terse `/** */` one-liners on exports
and few inline comments (median about 12% comment lines; the median Svelte header is 3 lines). The new sound, villager and weight files match
it. The outliers are `IslandScene.svelte` (a 32-line header mixing layout contract, history and process roles), `SceneTaps.svelte`
(13 lines listing every effect, already in `docs/design/scene-interactions.md`), `Ground.svelte` and `Host.svelte` (14 each).

### Safe mechanical comment fixes (one PR)

| Where | Stale text | Replace with |
|---|---|---|
| `scoring/bells.ts:126` | "confirmed gym visits max 2/week" | "max `STRENGTH.maxConfirmedVisitsPerWeek`/week" (it's 3, `rules.ts:71`) |
| `components/pots/flow.ts:11` | "100,000 … (about a weekend trip)" | a weekend trip is 28,000 now: "(a little under a trip abroad)", or retune `FULL_AT` [J] |
| `island/IslandScene.svelte:15`, `routes/+page.svelte:2` | "HUD (clock, NookPhone, score ribbon) is Builder B's" | "The HUD (sync chip, today's ベル ribbon, NookPhone) overlays the sky" |
| `IslandScene.svelte:11`, `scene.ts:28` | "the week's fruit" | "today's fruit" |
| `scene.ts:33,41` | "thirds of that kind's target" | "thirds of today's goal (todayPct)" |
| `art.ts:75` | "(Bells bag, = yen)" | "(the Bells bag)" |
| `ui/LeafCoin.svelte:2-3` | "savings ¥ amount (amounts stay ¥)" | "next to ベル amounts" |
| `ui/Toast.svelte:107` | 「映画 ¥4,000 使いました！」 | 「アイス 1,000 ベル つかいました！」 |
| `model/compact.ts:50` | "(the yen payout taken then is gone…)" | delete the parenthesis |
| `sync/cache.ts:22` | "the model's payouts of past cutoffs" | "earnings of locked weeks (`model/bells.ts` lockedWeeks)" |
| `model/bells.ts:51` | "(like week.ts' past payouts)" | delete |
| `sync/queue.ts:138` | "a held payday" | "a held spend" |
| `Toast.svelte:93`, `Hud.svelte:68`, `ShimaPhone.svelte:86`, `ui-state/ui.svelte.ts:22` | "score ribbon" / "the score" | "today's ベル ribbon" |
| `model/state.ts:358-364` | the `ON_EVENT` doc is separated from `ON_EVENT` by `ignored` | move `ignored` above the doc (or delete it with M1) |
| `sceneTaps.ts:72-79` | "no-op until src/lib/sound/ lands" | fix with H3, or say why it's silent |
| `docs/design/design.md:88` | おやつ 1,500–5,000 | 800–5,000 |

### Needs judgement

- **Dangling references.** There are 33 "v5 §N" references to a doc deleted in round 8 (`Hud.svelte:2`, `+page.svelte:2`, `theme.css:1`,
  `reactions.ts:124`, …) and a "Style guide v4 §R.7" reference (`pair/+page.svelte:60`). Sections §S.6, §S.10 and §S.13 are cited
  (`scene.ts:48,119`, `Sky.svelte:55`, `tokens.css:229`), but `design.md` only has S.1–S.5. Remap them to current sections or drop them.
- **Provenance tags.** There are 158 "round N" tags in about 50 files. Rounds 2-6 have no review docs any more (`rules.ts:75`, `actions.ts:14,20`,
  `scene.ts:26,33,113`, `FruitTree.svelte:2`, `tokens.css:309`, `roster.ts:105`, …), and "Builder A"/"game-designer" process roles appear in
  `tokens.css:9,32,147,152`, `reactions.ts:6`, `Ground.svelte:16`, `jarTransition.ts:5`, `scene.ts:33`. Strip the dangling ones (mechanical).
  Whether to drop all round tags is a policy call.
- **`model/weight.ts:6`** says the Shortcut sends "the day's first Body Mass sample". `gas/parse.ts:8` and `shortcut-health-sync.md:60`
  say "that day's Body Mass" (Group by Day). Align the wording, or confirm on a phone.
- **Header trims.** Move the layout contract out of `IslandScene.svelte` into `design.md` §S.1 and keep about 5 lines. Trim the
  `SceneTaps.svelte` header to purpose and constraints.

---

## Checked and fine

- **Keys.** The key is in `localStorage` (`sync/storage.ts:14,119`) and sent only in the `text/plain` POST body
  (`transport.ts:36-40`), never in a query string. There's no `doGet`, and `bundle.test.ts:16` checks that. The comparison is
  constant-time (`gas/main.ts:88-119`). The keys are in Script Properties with a 300 s cache. `#key=` is stripped with `replaceState`. The audit log never
  stores the key.
- **CSP.** `vite.config.ts` `kit.csp` (hash mode) emits a meta CSP with `script-src 'self' 'sha256-…'`, `connect-src` limited to
  script.google.com and script.googleusercontent.com, `media-src 'self' blob:`, `object-src 'none'`, `base-uri 'self'` and `form-action 'none'`.
  `style-src 'unsafe-inline'` is needed for Svelte `style:`. GitHub Pages can't send headers, so `frame-ancestors` and
  `Referrer-Policy` aren't possible. The key is in the fragment, which is never sent as a referrer.
- **Service worker.** Caches are versioned, one previous shell generation is kept, the music LRU holds 3, the villager runtime cache
  is unbounded but capped by the roster (about 316 small webp files), `.ok` guards prevent caching opaque or error responses, and navigation falls back to the shell after 3 s.
- **Backend.** It has a 1 MB body cap, JSON-only replies, a top-level try/catch, `tryLock(10s)` returning `busy`, a limit of 120/min per key and
  per-action validation, all tested.
- **AudioContext.** It's created lazily on the first gesture, resumed on gestures and on return to the page, and suspended when hidden. Music
  loads one hour at a time plus a one-minute prefetch, and failures fall back to synth.
- **Scene taps.** They're deliberately decorative (`aria-hidden`, no focus stops) and yield to buttons, links and `[role=button]`.
  Hiding the page pauses all CSS animation (`tokens.css:230`).
- **Villager roster tests.** They check unique ids, ja and en names, valid species, personality and colour, and that every id has a render and an icon on disk.
- **Dependabot.** It covers npm in `/app` and github-actions in `/`. Node 24 in CI matches `engines`.
- **Leftovers that are gone.** Old habit ids (only a deliberate negative test remains), purse, calibration, rungs, `TODO`/`FIXME`,
  Mac/Funnel/SQLite in code (only the historical note at `golden.test.ts:4-6`), the `full` refetch path, and old Shortcut
  formats.

## Suggested order

1. H1 (keeps the evening deploys green), H2, H4, M3 and L1-L2: one "error paths" PR.
2. H3 together with whoever owns sound.
3. M6 and L10-L12: one CI-hardening PR.
4. The mechanical comment table, L5, L8 and L9: one cleanup PR.
5. M1 and M2 together, since both change `Code.js` and need a redeploy.
