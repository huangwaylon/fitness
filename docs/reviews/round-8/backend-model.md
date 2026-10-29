# Round 8: backend, data and rules (senior engineer)

Scope: `app/gas`, `app/apps-script`, `src/lib/{ingest,model,scoring}`, `config/rules.ts`, `types.ts`, `app/scripts` at `d74268f`. Read-only.

**Checks:** `npm run check` gives 0 errors and 0 warnings (455 files). `npx vitest run` gives 219/219 in 2.4 s. `golden.test.ts` digests take 1.95 s of that. `npx knip` reports 39 unused exports and 35 unused types; the items below are each confirmed by grep. Knip's `@fontsource/zen-maru-gothic` hit is a false positive (it is loaded by a `fonts.css` url). `Code.js` is 29.8 KB / 768 lines: lean; the only bloat is a duplicate `isRec2` and the esbuild export shim.

**Measured** (Node, golden rows: 543 metrics, 48 workouts, 71 presence, 410 events): `reduce` 2.2 ms, `buildWeekView` 1.9 ms, `historyWeeks` 2.4 ms. At week 52 with **no extra rows**, these rise to 8.6 ms and 15.5 ms. Cost grows as weeks × rows. Expect 3–5× that on a phone, and it runs on every tap and every minute.

## Delete (≈ −60 LOC now, −95 later)
- [ ] `src/lib/model/index.ts` (8 LOC): an unused barrel, nothing imports `#lib/model'` or `model/index`.
- [ ] `snapshot.ts:7`: the row-type re-exports. Consumers import them from `sheet-api.ts`.
- [ ] `state.ts:89` `MetricKey`: unused, and a duplicate of `parse.ts:14`.
- [ ] `rules.ts:13` `monthlyAutoTransferHintYen` and `rules.ts:91-92` `JOBS.*.weekday`: never read.
- [ ] `rules.ts:1`: the comment points at `npm run recompute`, which no longer exists (Mac-era).
- [ ] `gas.d.ts:17` and `fakes.ts:28` `appendRow`: unused, since `main.ts` only uses `setValues`.
- [ ] `sheet-api.ts:47-50` `Fail/IngestReply/PresenceReply`: unused. Better, use them to type `main.ts` replies (see Simplify).
- [ ] `state.ts:263` and `client/gas.ts:201`: the `d.habitKey` fallback. Nothing writes it, not even `export-to-sheet.ts:51`.
- [ ] `export-to-sheet.ts:81`: it still emits `share` rows, which the model ignores. Drop it now.
- [ ] **Risky, after the migration** (runbook §5, due before 2026-11-08): delete `scripts/export-to-sheet.ts` (95 LOC), the `export:sheet` npm script, runbook §5, and the `facts`/"Mac server" comments in `parse.ts:5,151` (keep the SHA id rationale).
- [ ] Unexport internal-only symbols: `constantTimeEqual`, `toIsoDate`, `isUnknownLocalisedType`, `seasonFirstWeek`, `visitsAsOf`, `ticksAsOf`, `monthEarnings`, `ACTIVE_DAY_MIN`, `dayMinutes`, and `activeMilliOfDay` from `scoring/index.ts:4`. Inline `weekOpen` (`history.ts:57` is just `editableAt`).
- [ ] Add a `knip.json` that ignores `apps-script/Code.js` (generated), the zen-maru dependency, and `cwebp`/`dwebp` (system binaries used by `fetch-assets.ts`).

## Merge (≈ −80 LOC)
- [ ] **Workout names.** `labels.ts:4` `JA` and `parse.ts:110` `ALIASES` are the same 20 pairs, inverted. `ALIASES` should be `invert(JA)` plus `伝統的な筋力トレーニング` and `HIIT` (−22). *Risky:* `workoutKey` ids depend on this, so pin all 20 ids in `parse.test.ts` first.
- [ ] **Regexes defined 2–4×:**
  - The month regex `/^\d{4}-(0[1-9]|1[0-2])$/` at `main.ts:299`, `state.ts:304,360`.
  - The manual id regex `/^m:[\w-]{1,100}$/` at `main.ts:292`, `state.ts:335`.
  - `DATE_RE` at `main.ts:274`, `state.ts:130`, `dates.ts:6`, `parse.ts:92`.
  - Metric-key checks at `main.ts:285`, `state.ts:221,313`.

  Export them all from `sheet-api.ts` (dependency-free, already bundled), together with `METRIC_KEYS`.
- [ ] `Person` (`sheet-api.ts:30`) and `PersonId` (`types.ts:3`): keep one.
- [ ] **Month of a week** is computed twice: `week.ts:262` (`monthEarnings`, a date-window filter) and `history.ts:420` (`monthOfWeek`). They agree. Keep `monthOfWeek`.
- [ ] **Harvest taps** are counted twice, with **different rules**. `replayHarvests` (`week.ts:244`) accepts a tap only for the week that was open at the time. `historyWeeks` (`history.ts:135`) counts any tap for `h.week`. A late or stale tap can therefore show 収穫済 in きろく while the island still asks. Export `replayHarvests` and use it in both places.
- [ ] **"Latest metric_set ≤ t"** is written out twice: `week.ts:79` and `history.ts:97`. Add `latestTimed()` beside `latestAt` in `state.ts`.
- [ ] Smaller duplicates:
  - The fruit `pct` formula at `week.ts:274` and `history.ts:224`.
  - `[...s.workouts[p], ...s.manualWorkouts[p]]` at `week.ts:29` and `history.ts:309,374`.
  - The jar/purse sums at `week.ts:356-358` and `history.ts:435-438`.
  - `isRec` at `main.ts:23` and `parse.ts:225`.
  - The season sort at `targets.ts:16` and `state.ts:39`.

## Simplify
- [ ] **`reduce`** (`state.ts:184-389`, 205 LOC) is one switch. Split it into one handler per event type (a `Record<EventType, handler>` table). The rule constants inside it should move to `rules.ts`: `PRESENCE_*`, spend `60`/`1_000_000`, villager name `20`, `ACTIVE_DAY_MIN` (`history.ts:17`), and the per-day tick cap `3` (`score.ts:144`, `history.ts:236`).
- [ ] **`buildWeekView`** (65 LOC): extract `jarView()` and `harvestView()`.
- [ ] **`weekDetail`** (`history.ts:212`) runs `settledWeeks` for *every* week to find one. Extract `settleWeek(s, wk, now)` from `settledWeeks` and call that.
- [ ] **`main.ts` replies** are `Record<string, unknown>`. Type them with `SnapshotReply`/`EventReply`/… so the server is compile-checked against the client contract.
- [ ] Small cleanups:
  - `parse.ts:297`: the second `{ ...r }` clone is redundant.
  - `parse.ts:62,68`: two near-identical English date regexes plus a block; fold them into a helper.
  - `main.ts:297`: `typeof === 'string' && isId` repeats a check.
  - `types.ts:29`: `strengthOverride?: boolean | null`, but null is never set (`week.ts:39`). Make it `boolean`.
- [ ] **Correctness (Low):**
  - `parse.ts:329`: the days form uses `date.slice(0,10)`, so `"…T20:00:00Z"` lands on the UTC date. Use `toLocalDate(date)`.
  - `main.ts:310`: the `since` filter compares strings. A hand-pasted `at` without milliseconds (or not in UTC) sorts wrongly against `since`. Normalise with `text(…,'at')`, which already parses Date cells; also parse strings.
- [ ] Comments: `parse.ts:2` says the parser runs "in the browser" (it doesn't), and `types.ts:1` says "server".

## Rename
- [ ] `WeekView.juniper` → `host`, and the keys `juniper.*` → `host.*` (`week.ts:323-334`, `types.ts:179`, `i18n/index.ts:40`, `+page.svelte:68`). This also needs a golden regeneration (200 occurrences in `timeline-views.json`, plus the digests). Do it as one mechanical commit, showing that only that key changed.
- [ ] `JOBS` → `CUTOFFS` (it names the deleted scheduler).
- [ ] `scoring/visits.ts:5` `PresenceRow` → `PresenceEvent` (its name clashes with the sheet tuple `PresenceRow`).
- [ ] Align field names: `CheckinRec.habit` vs `CheckinTick.habitKey`, and `extId` vs `id` (`WorkoutRec`, `DayWorkout`).

## Perf
- [ ] **P1:** memoise `settledWeeks` per `State` (`WeakMap`). `buildWeekView`, `historyWeeks`, `moneyLog` and `weekDetail` each recompute it, at 2 `payoutAsOf` per week. Zero risk.
- [ ] **P2:** `activityAsOf` builds *all-time* workouts and visits for each week × person × cutoff (`week.ts:92` default argument, `history.ts:63`). Filter to the week's dates (±1 day for visits) before deriving. This turns weeks × rows into roughly rows.
- [ ] **P3:** memoise `targetsFor(person, wk)` and `seasonFirstWeek()`. Both re-sort `SEASONS` and allocate 7 dates per call. They are called per check-in in `reduce`, per day in stamps, and in every `isLockedAt`.
- [ ] **P4:** `mergeTab` (`snapshot.ts:42`) calls `Date.parse` inside the sort comparator and re-sorts everything on every poll. Parse once per row, and append without sorting when every added row is newer (the usual case).
- [ ] **P5, risky:** keep finalized `SettledWeek`s across `State`s. Server `at` is monotonic, so a week past `finalMs` cannot change. This breaks if someone pastes rows by hand, and the demo calendar must be part of the cache key.
- [ ] `buildEditLog`: the check-in "before" lookup is O(n²) (`history.ts:368`), and `workoutsAsOf` runs twice per edit (`:380`). It is memoised, so this is low priority.

## Tests
- [ ] **Gaps:**
  - Harvest acceptance (only the open week; two taps) has only golden coverage, and nothing tests the `historyWeeks.harvested` divergence above.
  - `reduce` presence rules have no unit test: the 2-min duplicate, the 48 h window, and the place/person mismatch.
  - The days form with an offset timestamp.
  - `since` with a non-millisecond `at`.
- [ ] **Speed:** in `golden.test.ts:77`, build each instant's `reduce` once for A and B (currently 1,320 reduces, about −1 s).
- [ ] **Redundant or removed behaviour:** none found. (`main.test.ts:257` rightly asserts `share` is refused).
