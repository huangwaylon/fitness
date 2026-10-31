# Round 22: code review (correctness, performance, tests, cleanup)

Reviewer: senior engineer, 2026-10-31. Scope: everything outside the UI folders (`lib/{config,scoring,model,contract,sync,
store,ui-state,time,villagers,sound}`, the service worker, `gas/`, `scripts/`, CI, the docs). The UI engineer worked
in parallel on `components/`, `routes/`, `styles/`, `i18n/` and `e2e/`; items for them are in
[handoff.md](handoff.md) (code → UI, items 3–13).

**Code.js changed: build `4fc968b63016` → `84ceb991775f`.** Redeploy once (runbook §2), then check `health` answers
`84ceb991775f`. What changed on the server: a bare `YYYY-MM-DD` parses as Tokyo midnight (was UTC), `harvest.week`
must be a real calendar date, `shortcutDate` returns the day only, and the faster ISO parser. Nothing in the API or
the sheet changes.

## Numbers, before → after

Before = `4c4215e` (the round's start, clean tree). After = `16448d9`, built and tested from a clean worktree (the
UI engineer's uncommitted work kept out). Bench times are a laptop, median-ish of several runs (±15% noise).

| Check | Before | After |
|---|---|---|
| `npm run check` | 0 errors, 0 warnings (658 files) | 0 errors, 0 warnings (659 files) |
| `npx vitest run` | 850 passed (45 files) | **943 passed (48 files)** |
| `npm run e2e` | 27 passed | 27 passed |
| `npx knip` | clean | clean |
| First load (index.html preloads + the `/` node and its static imports, gzip) | 31 files, JS 132.1 + CSS 30.8 = **162.9 kB** | 31 files, JS 132.7 + CSS 30.7 = **163.4 kB** (+0.5 kB: the hour clock, the deck fixes, the fast parser; the build also has the UI engineer's commits) |
| Largest chunks (gzip) | 50.4 main, 27.9 `/` node, 19.0, 16.8, 15.9 きろく (lazy) | 51.1, 27.9, 19.0, 16.8, 15.9 (lazy) |
| Code.js | 24.3 KB | 25.6 KB |
| `gas/perf` (year 3): ingest / since-poll / full snapshot | 19,200 / 2,560 / 563,015 cells | the same; new: an event write reads 867 cells (one id column) |

Bench, year 3 (compacted cache, 10,230 rows):

| Path | Before | After |
|---|---|---|
| `reduce` | 2.9 ms | **1.2–1.6 ms** |
| `reduce` + `buildWeekView` (no rev) | 10.5 ms | **3.6–4.0 ms** |
| … with a rev (the live app) | 3.3 ms | **1.4–1.6 ms** |
| `buildWeekView` (fresh state) | 4.4 ms | **2.1–2.7 ms** |
| `historyWeeks` | 4.3 ms | **2.2–2.9 ms** |
| `bellsLedger` | 4.7 ms | **2.1–2.6 ms** |
| `compactRows` (raw year 3, 112k rows) | 28.0 ms | 19–22 ms, and it now runs only on a full fetch or past a new weekly lock |
| raw year 3 `reduce` | 25.9 ms | not a hot path (the client always holds the compacted cache) |

The app's own paths (new bench section; "before" = the code before the performance iteration):

| Path | Before | After |
|---|---|---|
| empty `since` poll → cache | 3.5 ms | **0.0 ms** |
| poll with one new row → WeekView | 8.8 ms | **3.4–4.0 ms** |
| first fetch (raw year 3) → cache | 47.7 ms | 38 ms |
| minute tick → WeekView | 0.1 ms | 0.1 ms (and none while hidden) |
| IndexedDB write (fake-indexeddb) | 1.9 ms | 1.8 ms (already coalesced) |
| cold start: cache → first WeekView | 7.6 ms | 7.1 ms |

Cleanup counts (repo):

| | Before | After |
|---|---|---|
| Docs (every `.md`) | 40 files, 40,960 words | 9 files, 13,900 words (10,550 without this round's two review files) |
| Core src (non-UI, non-test) | 7,030 lines, 387 exports | 7,135 lines, 388 exports (the fixes and the perf work add ~250, removals ~145) |
| Tests | 6,706 lines, 49 files | 7,450 lines, 52 files |
| `static/` | 471 files, 20.67 MB | 465 files, 20.66 MB (six unused reaction icons) |
| Model fixtures | 412 kB | 384 kB (the goldens lost the removed view fields) |

## Iteration 1: review pass

Three read-only reviewers (sound lifecycle; sync, store and the service worker; dead code and data) plus my own pass
over the model, scoring, time and the backend. Each fix has a test that fails before it.

### Fixed
- **Sound.**
  - A fade-out's delayed `pause()` could stop a deck that had been given the same key again within ~3 s (a quick
    ミュージック off/on). Decks now carry a generation.
  - An outside ⏸ (Media Session) kept the AudioContext running. It now sleeps after the idle delay.
  - Every metadata/seek wait left a listener behind on the deck. `firstEvent` removes them.
  - `pause()` stopped ambience with a 2.5 s fade on a clock that was about to freeze. It now stops at once.
  - Failed decodes were cached for the session. They are retried.
  - The hour clock kept prefetching music blobs while hidden or muted, which piled up in a background tab.
    `HourClock` stops on hide.
  - The first-prefetch timer was not cleared on teardown.
  - `engine.test.ts` is a new fake `AudioContext`/`<audio>` harness for all of the above.
- **Dialogue blips all had one pitch:** `pitchOf` computed `(cp × 7) % 7 − 3`, always −3. It is now `cp % 7 − 3`.
- **Sync.**
  - After a long time offline, a reconnect or a sync tap waited out the remaining backoff (up to 5 min) with the pill
    gone. `retryNow` fixes that.
  - An ack landing after pairing as someone else was kept as the new person's.
  - The re-read after an ack could reuse a snapshot request that started before the ack (`fresh`).
  - An empty poll produced a new rows object, so the whole history was reduced again.
- **Service worker.**
  - The old worker stored the new build's HTML as its offline shell. If the new install then failed, the app opened
    offline to a blank page. A navigation now only fills a missing shell.
  - The shell and the non-hashed files were precached through the 10-minute HTTP cache. They now use `cache: 'reload'`.
- **Backend.**
  - A bare date parsed as UTC (09:00 Tokyo).
  - `text()` used its own `9 × 3600_000` instead of `ZONE_OFFSET_MS`.
- **Tests added.**
  - Property tests over 60 seeded random histories (buys at right and wrong prices, voids by either person, twice,
    edits): the wallet replay matches a plain re-implementation of the rule, the balance never goes negative, and the
    menu's next price follows this week's live buys. The checks exercised 554 accepted, 1,600 rejected and 162
    voided buys.
  - `treatPrice` and the milestone curve are monotonic (v1 and v2, every fruit).
  - A pin: a later down-edit of an open week can uncover an earlier buy (see "Left").

### Cleanup (the lead's priority from mid-iteration)
- **Docs:**
  - 23 ADRs became one current [decisions.md](../../decisions.md).
  - Six design docs became [design.md](../../design.md) and [backend.md](../../backend.md).
  - The ops docs and the README are rewritten as current and step-by-step.
  - Rounds 19 and 21 are deleted. Git keeps the history.
  - About 160 code comments in my files now point at the new anchors or lost their ADR and round attributions.
- **Dead model output:**
  - Removed fields nothing reads: `RingProgress.weekBells/nextBells`; `WalletView.earned/spent/week`;
    `BellsLedger.wallet`; `HistoryWeek.settled/open/bells`; the per-person week ベル; `WeekDetail`'s per-person
    bonus; `DayRow.edited/moveGoal/bells/rings`; `DayDetail.weekKey/locked`; `WeightTrend.person/start`;
    `WeekBells.t`; the unread `by` on weight and Move-goal edits.
  - The goldens were regenerated. They are identical once those fields are stripped (checked by script).
- **Dead parameters and branches:**
  - The `Activity` wrapper and the `act` parameter threaded through the model (left over from arrivals).
  - `buildWeekView`'s Snapshot/Date/string inputs; `reduce`'s Snapshot input and the `Snapshot` type.
  - `shortcutDate`'s unused time; `undoBanner`'s `after`; `ewmaTrend`'s `alpha`; `watchIsEdit`'s metric.
  - `setTrack`'s `prefetched`; `crossfadePlan`'s plan; `hasMusic`'s manifest; `lruEvict`'s `keep`; `cue`'s `delay`.
  - `hostArt`'s default pose; `DUCK` and `LIVE` exports; GAS `clearContent`; a dead `if (!pay)` branch.
  - The service worker's font lookup in the precache.
  - Six unused reaction icons (ids, fetch list, files and manifest; handoff UI→code 1).
- **Narrative:** the rules, the tests and the code comments now describe the current state (no gym, pots, rounds or
  "used to"). The tests that pin ignored old rows (`gym_set`, the presence and workouts tabs, strength marks) say so
  plainly.

## Iteration 2: re-review of my own changes and the skipped areas

- **Fixed: the hold regression I opened.** Once a held track let the context sleep, any later cue (a world sound
  after a background sync) woke it, and `onrunning` faded the held music back in, as did coming back to the app. The
  design says "⏸ holds until the next tap". There is now an explicit hold, cleared by a tap or the Media Session's ▶.
- **Fixed: work while hidden.** The minute tick recomputed the WeekView (and every other minute reader) in a
  background tab. `minuteTimer` skips while hidden and catches up once on return.
- **Fixed: a flaky-test risk.** `live.test`'s LiveBackend scheduled real retry and re-read timers that could fire
  into later tests (my new test added one). They are now faked and cleared.
- **Tests added:** the "acked after its lock" notice (`#noteRefused`) was untested (mutation-checked); the event
  write's cells in `gas/perf`.
- **Small fixes:** `harvest.week` must be a real calendar date (server); the `editableAt` and weather comments; the
  `openKiroku` comment; a dead link in `types.ts`; "(round 9)" in the Playwright config.
- **Process fix:** `npm run e2e` serves the existing `build-pages` (and reuses a running preview), so in this shared
  checkout it can test a stale build or the UI engineer's tree. Every push after that point was verified from a clean
  worktree of HEAD (check, unit, knip, build, e2e on its own port).

## Iteration 3: the fruit order (user request) and remaining areas

- `RING_FRUITS` is now Apple's ring order, 🍐 Move, 🍑 Exercise, 🍒 Stand, then 🍎 steps, and every list follows it.
  The model's per-fruit objects use the same key order, and the docs' tables are reordered. Two e2e tests asserted
  the popup's row order; I committed their fix against HEAD and applied the same lines to the UI engineer's working
  copy. The built demo was checked by screenshot: the popup rows and the ground fruit arc look right. The goldens are
  unchanged (no array depends on the order).
- Checked and clean: config keys (every `LIMITS`/`WEIGHT`/`ESCALATION` key is read), CI, `knip.json`, the remaining
  ui-state and villagers code.

## Iteration 4: measured performance

CPU profiles (`node --cpu-prof`) of the bench and of drivers for the app's paths. Results are identical in every
case (goldens, the poll-through-locks compaction test and the property tests all pass unchanged).

1. **`parseInstant`** (29% of the bench, 17% of the app's paths): the server's own ISO format is now read by hand,
   at 20 vs 87 ns per call. Anything else still goes to `Date.parse`, and a test compares the two on 20,000 instants.
   Each row's `at` is parsed once and kept by the merge and the compaction. `reduce` reads that memo but doesn't add
   to it: storing for a cold start's fresh rows cost about 3 ms more than parsing them.
2. **`compactRows` on every poll** (17%): it ran over the whole cache even for an empty poll. Compaction is a fixed
   point, so a poll now compacts only past a newer weekly lock or when the reply brings rows of a locked week
   (`compactedAt` in the cache). `since` is computed from what the reply adds.
3. **The views:**
   - `metricAsOf` built its key twice.
   - `milestoneBells` recomputed and allocated a fruit's steps for every day; they are now cached per rule version.
   - `earnWeek` built a Set per week; it now checks a date range.
   - `weekDays` allocated fresh arrays and Dates; it is now shared and frozen.
4. **`reduce`:**
   - `push` (29% of reduce) built a `date|metric` key string per row. Activity rows are now indexed date → metric.
   - `sortedByAt` lost a filter pass and the sort of already-ordered rows.

Not changed, with numbers:
- **IndexedDB writes** (1.8 ms) are already coalesced: a superseded save is skipped. Skipping writes on empty polls
  would leave a stale "last synced" on the next cold open.
- **The cold start** (7.1 ms) is now mostly the IndexedDB read.
- **The backend's cells per request** were already tail reads.

## Left (and why)

- **A down-edit can uncover an earlier buy (product decision, open).** A later edit that lowers an open week's ベル
  (or excludes a workout) makes the replay ignore a buy the wallet covered when it was made. With escalating treats,
  the later buys of the same item then no longer carry their price and drop out too. This is pinned by a test and
  documented in decisions.md "Edits only in open weeks". The alternative is to judge coverage with rows stamped up to
  the buy, which keeps buys stable but lets the balance go negative. That is the user's call; it is the same trade-off that
  keeps edits out of locked weeks.
- **An event write reads every id** for the duplicate check (867 cells at year 3, about 1 cell per event). There is
  no index to avoid it, and it is far from Apps Script's limits.
- **The wallet replay is O(spends × days)**: 2.1–2.6 ms in `bellsLedger` at year 3, so it isn't worth a prefix sum.
- **Exports used only by tests** (about 40, e.g. `backoffMs`, `treatPrice`, `parseManifest`) are deliberate test
  seams (`knip --production` lists them); un-exporting them would mean testing through wider APIs.
- **`week.test` shares one never-resolving flush** across its tests by design (nothing is ever sent). It only checks
  the store's queueing, not flush behaviour.
- **Move and Stand edits** are supported by the model and the server but not offered in きろく. That is the UI's call
  (handoff 10).
