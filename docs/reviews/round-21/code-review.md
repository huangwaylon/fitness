# Round 21: code quality and consistency review

Reviewer: senior engineer (code review with fixes), 2026-10-31. Scope: the SvelteKit app in `app/` and the Apps Script
backend (`app/gas` → `app/apps-script/Code.js`). The UI polish engineer was editing `components/`, `routes/`, `styles/`,
`i18n/` and `e2e/` at the same time. Those files were reviewed read-only, and the findings are listed under
[UI follow-ups](#ui-follow-ups) for the lead to apply after the polish pass.

**Code.js did not change** (build `6fd29d1e1dda`, the same as before), so there is nothing to redeploy.

## Numbers, before → after

| Check | Before | After |
|---|---|---|
| `npm run check` | 0 errors, 0 warnings (658 files) | 0 errors, 0 warnings (658 files) |
| `npx vitest run` | 851 passed (45 files) | 854 passed (45 files): 3 new tests for the bugs fixed |
| `npm run build` | ok | ok |
| `npm run e2e` | 25 passed | 25 passed (run against the UI engineer's working tree as well) |
| `npx knip` | 1 unused file: `.r21-walk.mjs` | the same. It is the UI engineer's untracked walk script, not in git, so CI is clean |
| First load (index.html preloads + the `/` node and its static imports, gzip) | 30 files: JS 130.5 kB, CSS 30.0 kB, **160.5 kB** | **160.5 kB** (unchanged) |
| Bench, year 3, compacted (11,634 rows): reduce / + buildWeekView / historyWeeks / bellsLedger | 3.5 / 9.1 / 5.9 / 4.7 ms | 4.3 / 10.1 / 6.4 / 4.9 ms (run-to-run noise: no hot path changed) |
| Bench, year 3 raw (113,623 rows): reduce + buildWeekView | 34.7 ms | not affected |
| `compactRows`, year 3 | 27.6 ms | 28.3 ms (noise) |

All deploys after the pushes succeeded (`gh run list`). One run was superseded by the next push, as the `pages`
concurrency group does.

## Findings in the core (fixed or left)

### Medium: fixed

1. **A snapshot reply could become the wrong cache** (`lib/sync/cache.ts` `fetchAndMerge`). There were two paths.
   - A `since` page answered for the other person (the keys swapped in Script Properties, or a stale `island.me`) was
     merged into an empty cache. `applySnapshot` drops a cache that belongs to someone else, so a few hours of rows
     were kept as that person's whole history, and every later poll built on them.
   - A reply for the old key that landed after pairing again (`setKey` clears the cache) saved the old person's rows
     and wrote their `me` back over the new one.

   Fix: a `me` mismatch refetches everything, like a changed `rev`. A reply whose key changed while it was in flight
   is dropped (the refresh started by pairing owns the result). Two tests in `sync.test.ts` failed before the fix and
   pass now. `sheets-architecture.md` §2.1 says so.
2. **The queue let an edit pass the event it refers to** (`lib/sync/queue.ts` `subjectOf`). The doc and
   history-and-editing.md §4.3 say that a later event on the same workout or spend never passes a held one. The code
   gave a subject only to `workout_edit` and `spend_void`, not to `workout_add` and `spend`. So an edit of a held
   (undo-window) manual workout, or a void of a held buy, could go first. The server would then stamp it before its
   subject, and the model ignores it on read: shown at once, gone after the sync. Today the single banner makes this
   hard to reach (a new banner releases a paused one), but the queue must not depend on the toast. A test failed
   before the fix and passes now.

### Low: fixed

- `model/history.ts`: two imports from `scoring/bells.ts` became one. `dayBells(e, '')`, which used a date that never
  matches to get zeros for a future day, became a named `NO_BELLS()`.
- `model/week.ts` `ringView`: the `key === 'coconut'` check was redundant after `milestoneBells`. It is now one early
  return, and type narrowing keeps working.
- `types.ts` `RingProgress.goal` quoted v1's 180-minute Stand goal (v2 is 120). It now points at the week's rule
  version.
- `store/actions.ts` `setVillagerName` was the only action returning `null`. It now returns `{ok:false}` like the
  others, and its bare `12` is a named constant (the field's length; the model accepts up to `LIMITS.villagerNameMaxChars`).
- `store/live.ts`: a doc comment broken across a stray `*.` line.
- `store/demo/rows.ts`, `scripts/bench-rows.ts`: local `presence` arrays are now `arrivals`. `presence` stays only as
  the sheet tab's wire name (`contract/api.ts` says why).
- `service-worker/index.ts` had its own copies of the font and villager-art path tests. They now live once in
  `caches.ts`, next to `precachable`, which uses them.
- Stray double blank lines (`rules.ts`, `week.ts`, `history.ts`). The repo root `.gitignore` now ignores
  `node_modules/` and `.svelte-kit/` (a root install had left them untracked).

### Left (and why)

- **`parseInstant('YYYY-MM-DD')` is UTC midnight (09:00 Tokyo)**, unlike a date-time without an offset, which is read
  as Tokyo time. It is reached only by a hand-pasted bare-date `at` cell or `?date=2026-11-03` without a time (the
  documented form has one). The function is bundled into Code.js, so changing it means a redeploy. Do it with the next
  backend change.
- **`gas/main.ts` `text()` uses `9 * 3600_000`** instead of `ZONE_OFFSET_MS` from `time/dates.ts` (already imported
  there). This is cosmetic. Batch it with the item above.
- **Escalating buys and undo.** An undo takes a held buy out of the queue (`unqueue`). It is not a void, so a later
  held buy of the same escalating item keeps the price it was given (n + 1) and would be ignored on read. Today only
  the newest buy's banner can be undone (one banner at a time; a new banner sends a paused one), so this can't happen.
  If banners ever stack, re-price the later queued buys of that id, or turn the undo into a `spend_void`.
- **The wallet replay is O(spends × days)** (`walletAt` `earnedBy`). It takes 4.9 ms at year 3, so it isn't worth a
  prefix sum yet.
- **Two callers of one flush both report its result** (`LiveBackend.#flush` shares the queue's in-flight promise). The
  second toast replaces the first with the same text, which is harmless.
- **`queue.ts` `newId` falls back to `Math.random`.** `crypto.randomUUID` exists in every browser the app supports, so
  the fallback is only for tests and old engines. `random.ts` is deliberately a seeded PRNG only. Unseeded
  `Math.random` (jitter, backoff, ambience offsets) is correct where variety is the point.
- **Idle timers.** The minute tick (one timeout a minute, only while something reads it) and the sound's hourly clock
  keep running while hidden. iOS suspends them, and an overdue tick fires as the app comes back. Nothing animates
  while hidden in the core. See UI follow-up 17 for the one idle poll in the UI.
- **Security re-checked, nothing to fix:**
  - Keys are only in request bodies (`doPost` never reads `e.parameter`) and never in logs or the `uploads` audit
    (`bodyShape` skips `key`). No 64-hex secrets in tracked files.
  - The CSP `<meta>` is generated with hashes, and only the two Apps Script origins are reachable.
  - Gas bounds: body ≤ 1 MB, event data ≤ 20 k chars, ids ≤ 128, spends ≤ `LIMITS`, metric bounds, gym label ≤ 40,
    120 requests a minute per key.
- **Module boundaries** (`deps.test.ts`) and `contract/api.ts` as the one source of wire shapes both hold. There is
  no `any` outside the UI either.

## UI follow-ups

These are for the lead to apply after the polish pass, ranked. Each finding was checked against the code; the top
three were re-verified by hand. 24 items.

1. **Medium: the buy sheet can confirm a stale price.** `routes/jar/+page.svelte:28,60,65`,
   `components/wallet/BuyConfirm.svelte:23-29`. `askItem` is a snapshot of the item. If a sync lands while the sheet is
   open (for example, the partner just bought the same おやつ, so its ×1.5 price steps up), the sheet keeps the old price
   and the old "after" balance, but `buy()` charges the live `item.price`.

   Fix: keep the id and derive the item.
   ```ts
   let askId = $state<string | null>(null);
   const askItem = $derived(askId ? (menu.find((i) => i.id === askId) ?? null) : null);
   ```
   Then use `onbuy={(item) => (askId = item.id)}`, set `askId = null` in `buy()`, and give BuyConfirm an `onclose`
   that clears `askId` instead of `bind:item`.
2. **Medium: the app can be left inert with no harvest.** `routes/+layout.svelte:99,127-131`. `inert={showHarvest}`
   applies before the lazy overlay has loaded, and `{#await loadHarvest()}` has no `{:catch}`. If the import fails
   and `safeReload()` declines (it already reloaded within 30 s, or there is no storage), the whole page stays inert.

   Fix: load the overlay in script.
   ```ts
   let Harvest = $state<typeof import('#lib/components/sheets/HarvestOverlay.svelte').default | null>(null);
   ```
   Add an `$effect` that runs `loadHarvest().then((m) => (Harvest = m.default), () => (laterFor = harvest?.weekKey ?? null))`.
   Then use `inert={showHarvest && !!Harvest}` and render only when `Harvest` is set.
3. **Low/medium: the jar plate can overshoot the wallet.** `components/island/JarSpot.svelte:97-101`. `rest` is
   computed when the effect runs, and the 450 ms timer does `jarBells += rest`. Two wallet changes within 450 ms both
   add their `rest`. Fix: `jarBells = Math.min(target, jarBells + rest)` (with `target` the latest `to`).
4. **Low/medium: a 0-minute manual workout fails silently.** `kiroku/Kiroku.svelte:262`, `kiroku/NumberPad.svelte:21`.
   けってい looks enabled but does nothing. Fix: give NumberPad a `min` prop (`valid` requires `value >= min`), pass
   `min={MANUAL_WORKOUT_MIN.min}`, and drop the guard in Kiroku.
5. **Low/medium: the 22:00–05:00 nap rule exists three times.** `characters/Host.svelte:53-56`,
   `island/islandLife.svelte.ts:30`. In `motion/director.svelte.ts:284`, `wake()` puts the villager back to sleep after
   10 s even after 05:00. Fix: export `asleepHour(d = now())` from `time/clock.ts` and use it in all three; in `wake`,
   use `setAsleep(id, asleepHour())`.
6. **Low/medium: the badge-jingle delay copies BadgeRow's timings.** `sheets/HarvestOverlay.svelte:77` copies the
   0.15 s stagger from `ui/BadgeRow.svelte:29`, and it plays 2 s late under reduced motion. Fix: export
   `BADGE_STAGGER_S` from BadgeRow's `<script module>` and use 0 under `prefersReducedMotion`.
7. **Low/medium: Tokyo dates computed in a component.** `kiroku/BellsLog.svelte:28,44` builds its own
   `Intl.DateTimeFormat(…'Asia/Tokyo')`. Fix: `weekKeyOf(localDateAt(s.at))` from `#lib/time/dates.ts`, and delete
   `tokyoDate`.
8. **Low/medium (e2e): the sound walk depends on a fixed 260 ms sleep.** `e2e/sound.spec.ts:146`. Fix:
   `expect.poll(() => page.evaluate(() => window.__cues.slice(0, want.length))).toEqual(want)`.
9. **Low (e2e): other fixed sleeps.** `demo.spec.ts:153,189,231,250`, `sound.spec.ts:159`. Wait on a condition, on
   `getAnimations().finished`, or use `page.clock.runFor(3200)` for the no-auto-close check.
10. **Low: comments that narrate history.** There are about 150 "round N", "(was X)" and "used to" notes in components,
    styles and e2e, for example `ui/BadgeRow.svelte:47,49`, `ui/Sheet.svelte:36,99,110,116,133`,
    `ui/keyboardInset.ts:3-4`, `kiroku/WeekDetail.svelte:97`, `routes/+page.svelte:102`. Keep the why, drop the
    before-value.
11. **Low: stale vocabulary in comments.**
    - `characters/Host.svelte:10` "check-in saved" (ADR 0021): change it to "a sync, a sync error, the harvest".
    - `kiroku/Kiroku.svelte:75` and `island/Hud.svelte:41` say "お金" for the ベル tab.
    - `routes/+page.svelte:47` says "壺に入れる" (the button is 受け取る！).
12. **Low (e2e): pot / 壺 names from before ADR 0022.** `e2e/sound.spec.ts:234-256`, `demo.spec.ts:16,71`,
    `scenery.spec.ts:38,77`. Rename them to treats / ごほうび, but keep the deliberate `[data-pot]` absence check at
    `demo.spec.ts:66`.
13. **Low: an economy number outside rules.** `island/islandLife.svelte.ts:16` has `LOW_WEEK_BELLS = 1000`, which
    won't follow a rule version. Derive it from `progress.ts` `dayMax(weekKey)` (or put it in `rules.ts`).
14. **Low: the count-up tween is written four times.** `ui/Bells.svelte:23-32`, `island/Hud.svelte:23-31`,
    `island/JarSpot.svelte:129-132`, `sheets/HarvestOverlay.svelte:51-58`. Extract it to `ui/countUp.svelte.ts`.
15. **Low: duplicate formatters.** `kiroku/fmt.ts:12` `num()` duplicates `formatNum`. The month/day slicing is repeated
    in `fmt.ts:10,82` and `i18n/format.ts:12,18`. Export one `monthDay(d)`.
16. **Low: needless `as` casts.** `kiroku/Kiroku.svelte:59-60` (use a typed `$derived<…>`),
    `phone/VillagerApp.svelte:56,63`, `routes/pair/+page.svelte:33-34` (type the handler's `currentTarget`),
    `island/SceneTaps.svelte:247`.
17. **Low: idle life polls every 2 s forever under reduced motion.** `motion/idleLife.svelte.ts:86`. Stop scheduling
    while `reducedMotion()`; `wakeUp` already restarts it.
18. **Low: confetti says "deterministic-ish" but uses `Math.random` in a `$derived`.** `characters/Fx.svelte:37-47`.
    Seed it with `mulberry32` from `#lib/random.ts`, or fix the comment.
19. **Low: the badge's aria-label can say "6/5".** `ui/BadgeRow.svelte:22` vs `:35`. Use the same `Math.min(days, goal)`.
20. **Low: きろく has no failure branch.** `phone/ShimaPhone.svelte:119`. Add
    `{:catch}<p class="note">{t('state.error')}</p>`.
21. **Low (consistency): actions where the code uses attachments.** `sheets/HarvestOverlay.svelte:81-90` (`use:modal`)
    and `ui/Toast.svelte:33-47` (`use:topLayer`). Make them `{@attach}`, like `keyboardInset` and `roving`.
22. **Low (check first): the villager name is saved only on blur.** `phone/VillagerApp.svelte:40-42,54`. Closing the
    phone with Esc while the field has focus may not fire `blur`. Also save on teardown:
    `$effect(() => () => untrack(saveName))`.
23. **Low: `kiroku/WeightChart.svelte:7` imports `daysBetween` from `model/weight.ts`,** which re-exports it only for
    this. Import it from `#lib/time/dates.ts`, then delete `export { daysBetween }` in `model/weight.ts` (core, after
    the UI change).
24. **Low: `i18n/format.ts:28-34` keeps its own Tokyo `ymd` formatter.** `stampOf` / `formatSyncTime` can use
    `localDateAt(ms)` from `time/dates.ts`, leaving only the HH:MM formatter.

Checked and clean in the UI:
- **Syntax and safety:** no Svelte 4 syntax, no `any`, no `{@html}`, no logging.
- **i18n:** `ja.json` and `en.json` have the same 268 keys, all used.
- **Cleanups and dead code:** every listener, timer and observer has a cleanup, and there are no dead components.
- **Vocabulary:** "jar" is deliberate (the drawing and the `/jar` route).
