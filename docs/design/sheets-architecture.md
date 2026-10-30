# Sheets architecture: the contract (ADR 0015)

Builders code against this. Change it only through the lead.

## 1. Spreadsheet tabs (row 1 = header; the script creates missing tabs on first run)
All timestamps are ISO 8601 UTC strings written by the script (`at`). Dates are `YYYY-MM-DD` (Tokyo). Every tab is **append-only**; nothing is updated or deleted by the app.

| Tab | Columns | Written by |
|---|---|---|
| `metrics` | `at`, `person`, `date`, `metric` (`steps`\|`exercise_min`\|`move_kcal`\|`stand_min`\|`weight`), `value` | `ingest`. Steps, exercise minutes, Move kcal and Stand minutes (ADR 0021; daily totals): **only when the value is higher** than the highest so far for (person, date, metric). `weight` (kg, one decimal; ADR 0020): **whenever it differs** from the last row for (person, date) |
| `workouts` | `at`, `person`, `id`, `date`, `type`, `start`, `end`, `duration_min`, `avg_hr` | `ingest`, only for unseen `id` (`workoutKey(type, start)`) |
| `presence` | `at`, `person`, `place`, `event` (`arrive`\|`leave`), `event_at` | `presence`. The model reads only `arrive` at a known place of that person: a strength day on its Tokyo date (2026-10-30). `leave` rows (old Shortcuts) are ignored |
| `events` | `at`, `person`, `id`, `type`, `data` (JSON) | `event` (client-generated `id`; a duplicate `id` is ignored, so retries are safe) |
| `uploads` | `at`, `person`, `status`, `bytes`, `error` | `ingest` (audit only: no payload stored) |

Event `type`s and `data`:
- `checkin {date, habit, done}` and `confirm {kind, id, yes}`: still accepted (an old client's queued event never
  jams) but **ignored by the model** since ADR 0021: no eating check-ins, and no daily questions (a non-strength
  workout type counts as strength only when marked in きろく with `workout_edit {strength:true}`).
- `spend {spendId, pot:'treat'|'trip', item, label, bells}` (ADR 0019): a buy from a shared pot. The model ignores
  it unless `pot` is valid, `bells` an integer 1–10,000,000, `label` 1–60 characters and `item` a string ≤ 40, and
  (on read) unless the pot covered it at its `at`. Old yen `spend {spendId, label, amountYen}` rows (no `pot`) are
  ignored.
- `approve {spendId}`, `transfer {month}`, `transfer_undo {month}`: the old yen economy's. Removed in round 16: the
  script refuses them like any unknown type, and the model ignores the old rows that remain (ADR 0019 §6).
- `harvest {week}` (「受け取る」: a ceremony only, the bonus counts either way) · `highfive {}`
- `pref {key, value}` (keys: `locale`, `villagerName`, `villager`, `goalWeight` (the sender's goal in kg, 20–300 with
  one decimal, or `null` to clear; ADR 0020), `moveGoal` (the sender's daily Move goal, an integer 100–2,000 kcal; ADR
  0021: it applies from the Tokyo date of its `at` on, never to earlier days; anything else is ignored), and the shared menus `treatMenu` / `tripMenu`:
  `value` is a JSON array of `{id, label, bells}` (≤ 30 items, unique ids `[\w-]{1,40}`, label 1–60, bells 1–10,000,000);
  the latest valid one by either person wins; an invalid one is ignored as a whole)
- `share {metric, on}`: refused by the script (`bad_request`); old rows are ignored (ADR 0016).

Edits from きろく (`docs/design/history-and-editing.md` §4; added 2026-10-29, **redeploy `Code.js`**). The subject is always the sender (`person`): there is no person field, so nobody can edit the partner's record. Activity edits count only while the day's week is open (this week, and last week until Wednesday 04:00 JST); the model ignores the rest, so the sheet stays a dumb log:
- `metric_set {date, metric:'steps'|'exercise_min'|'move_kcal'|'stand_min', value}`: overrides the day's value, also lower. The script refuses a non-integer or out-of-range `value` (steps 0–100,000; minutes 0–1,440; kcal 0–10,000; stand minutes 0–1,440) or a bad date/metric with `bad_request`. Read rule: S = latest `metric_set` with `at ≤ T`; none → max of ingest rows; else max(S.value, ingest rows with S.at < at ≤ T).
- `metric_set {date, metric:'weight', value}` (ADR 0020; **redeploy `Code.js`**): a weight in kg, 20–300 with at most one decimal (decimals for weight only; the script refuses anything else). No week lock (weight earns nothing): any date up to the event's own day. Read rule: the day's weight is the **latest** of its `weight` ingest rows and weight `metric_set`s with `at ≤ T` (not the max).
- `workout_edit {id, strength?: true|false|null, excluded?: boolean}`: strength override for any type (`null` = automatic), or out of scoring.
- `workout_add {id:'m:<id>', date, type, durationMin 1–600, strength?}`: a manual workout (a known canonical type).
- `spend_void {spendId}`: the buyer only, once, after the spend; it gives the ベル back to the pot. Spends are never
  locked.

**ベル on read (ADR 0019, `model/bells.ts`).** A day's earnings are recomputed from the rows, so they change with late
syncs and edits until the week locks (Wednesday 04:00 JST after its Sunday); after that they are fixed at the lock
(rows stamped later never count). Up and down: there is no top-up or "keep the max" any more. A day's ベル land in the
pots that day, the weekly bonus at Sunday 19:30. Pots: おやつ = floor(total × `POTS.treatPercent`%) (20%), 旅 = the rest, on all-time
totals; each balance = its share − its accepted, not voided spends. Spends and voids replay in server order; a spend
whose pot didn't cover it at its `at` (earned by then − spent so far) is ignored, so no balance goes negative.

The rules (goals, ベル rates, badges, the pot split, default menus) stay in `app/src/lib/config/rules.ts`. No config
tab; the menus' prices are edited in the app (`pref`). **No backend change** for ADR 0019: `Code.js` stays a dumb log
(`spend` and `pref` only get the generic ≤ 20,000-character data check).

## 2. Web app API: `POST <exec url>`, body = JSON text, `Content-Type: text/plain`
Every request has `{key, action, ...}`. Every reply is JSON: `{ok:true, ...}` or `{ok:false, error}`, where `error ∈ unauthorized | bad_request | too_large | busy | unavailable`. `doPost` never throws: an uncaught error would return Google's HTML page. There is **no `doGet`**. Body cap: 1 MB.

| `action` | Request | Reply |
|---|---|---|
| `ingest` | The Shortcut's one format (shortcut-health-sync.md §1): Text lists, one line per day: `dates`, `steps`, `exercise_minutes`, `calories` (active kcal → `move_kcal`), `stand_minutes` (→ `stand_min`), `weight` (kg, 0 = none), each optional; optional `workouts` (types/starts/ends/avgHrs, one line per workout); other fields ignored; a value above the `metric_set` bounds is skipped with a warning | `{ok, metrics, workouts, skipped?, unknownTypes?, warnings?}`: rows actually appended, plus unreadable lines, unmapped workout names and dropped lists (a list whose line count differs from `dates` is dropped, the rest saved). The `uploads` tab logs each body's shape |
| `uploads` | (key only) | `{ok, rows: [{at, status, bytes, notes}]}`: the caller's last 20 ingest audit rows, newest first |
| `presence` | `place, event, at?` | `{ok}` |
| `event` | `id, type, data` | `{ok, duplicate?}` |
| `snapshot` | `since?` (ISO, the max `at` the client has seen) | `{ok, me, now, rev, rows:{metrics, workouts, presence, events}}` (rows with `at > since`; both people; `rev`: §2.1) |
| `whoami` | — | `{ok, me, build}` (used when pairing; `build` = the deployed code's hash) |
| `health` | **no `key`** | `{ok:true, build}`: up, authorized, and running `build` (no Properties read, no lock, no sheet). The monitor's probe (runbook §5) |

- Person = whichever of `KEY_A`/`KEY_B` matches, compared in constant time. A key that isn't 32–128 hex characters is `unauthorized` before anything is read. The keys are cached in `CacheService` for 5 minutes, so a rotated key keeps working for up to 5 minutes. The rate limit is a per-key-per-minute counter in `CacheService`.
- **Tail reads (round 13).** The app only appends, with strictly increasing `at`, so "every row after X" is a tail of the tab. The script reads it backwards in doubling chunks (256, 512, … rows) and stops at the first chunk that starts at or before X:
  - `snapshot` with `since` reads only the rows after `since` (a poll: one 256-row chunk per tab). An unreadable `since` is `bad_request`.
  - `ingest`'s higher-only check (for weight: the changed-only check against the last row) and the workout dedupe read only the rows written since the day before the body's earliest date: a row about a day is only ever written from that day on. Each Shortcut run's 31-day body reads about a month of rows; the 84-day baseline about three months.
  - `uploads` reads back until it has the caller's last 20 rows.
  - Rows pasted by hand out of `at` order bump `rev` (§2.1), so clients refetch everything; until ~256 newer rows follow them, `ingest` may append a redundant row. `snapshot` without `since` and the `event` id dedupe (one column) still read the whole tab.
- Writes (and `snapshot`) take `LockService.getScriptLock()` (wait ≤ 10 s, else `busy`). Each locked request reads Script Properties once (`getProperties`) and writes them at most once (`LAST_AT`, `ROWS`, `REV`), also when it fails after appending (so its rows are never taken for a hand edit).
- `snapshot` without `since` returns everything, as compact arrays (`rows.metrics = [[at, person, date, metric, value], …]`). With ≈ hourly Shortcut runs that is ~14–18k rows a year (3.7 MB of JSON by year 3, `npm run bench`). The sheet itself is never compacted (only the client's cache is). `gas/perf.test.ts` measures the hot paths at year-3 volume.

### 2.1 Resync: `rev` (added round 9; **redeploy `Code.js`**)
`since` only finds rows appended after it, so a cached client never sees a row that was **deleted or corrected by hand**, or pasted with an old `at`. The server therefore keeps a data revision, the Script Property `REV`, and returns it in every `snapshot` reply. It changes when, and only when, a synced tab (`metrics`, `workouts`, `presence`, `events`; not `uploads`) changed outside the app:
- **Rows added or deleted by hand** (or a tab deleted and recreated): the script records each synced tab's last row (`ROWS`) after its own appends and compares it on every read or append under the lock. A difference bumps `REV`.
- **Cells edited or pasted by hand:** the simple trigger `onEdit` bumps `REV` (script writes don't fire it).
- **Manually:** run `resync` from the script editor's function menu (or set `REV` to any new value in Script Properties). Do this after any hand fix if in doubt.

`rev` is an opaque short string; compare it only for equality. The app's own writes never change it.

**Client side (WS2):** store `rev` with the snapshot cache. When a reply's `rev` differs from the stored one, discard the reply's rows and the whole cache (keep the unsent write queue), fetch a full `snapshot` without `since`, and store the new `rev`. A cache with no stored `rev` (from before this change) resyncs once the same way. A manual *resync* button in the app does the same full fetch. Derived caches (finalized weeks, round 8 P5) are keyed by `rev`.

**Model helpers for the client (WS1, `app/src/lib/model/`):**
- `compactRows(rows, now)` (`compact.ts`): drops the metrics rows of locked weeks that the model can no longer read (keeps, per person/date/metric, the best row at the Wednesday lock, each `metric_set` (and just before it) and overall; the Sunday 19:30 row went with the yen payout). Every view is unchanged (`compact.test.ts`); it cuts metrics ~90%. Run it on the cache after each merge. `weight` rows are the exception: per (person, date) only the newest one is kept, since a weight's latest row is its value. It relies on ingest rows only going up, which a hand edit can break; that bumps `rev`, and the full refetch replaces the cache.
- `reduce(rows, calendar, rev)`: pass the cached `rev` (live data only) and the earnings of locked weeks are reused across States (round 8 P5), so a poll or minute tick no longer recomputes every past week. `npm run bench`, year 3 with ≈ hourly Shortcut runs, compacted: reduce + `buildWeekView` ≈ 8 ms with `rev`, ≈ 16 ms without (≈ 30 ms before the yen engine was removed; measured on a laptop, 2026-10-30).

`whoami.build` / `health.build`: the first 12 hex characters of SHA-256 over the bundle (`buildHash()` in `app/gas/build.ts`; `dev` when `main.ts` runs unbundled). `bundle.test.ts` checks that `Code.js` carries it.

## 3. Code layout
- `app/gas/parse.ts`: **pure, dependency-free** parser of the Shortcut body → `{metrics:[{date,metric,value}], workouts:[…], skipped}`. Ported from the retired server's Shortcut ingest (without zod), so it runs in Apps Script (the browser never parses Shortcut bodies).
- `app/gas/`: Apps Script source in TS (`main.ts`: `doPost`, sheet helpers), bundled with the parser by **esbuild** into `apps-script/Code.js` (one global script, no imports) via `npm run gas:build`. `apps-script/appsscript.json` sets scope `spreadsheets.currentonly`, the web app, and timezone `Asia/Tokyo`. `clasp` is optional (`.clasp.json` not committed).
- `app/src/lib/model/`: **pure compute-on-read**. `snapshot → WeekView` (people with today's ベル and the five fruits' progress, the Move goal in force, the pots, the menus, harvest with the weekly bonus, host line), reusing `scoring/` and `config/rules.ts`. `state.ts` validates and indexes rows; `inputs.ts` reads one person's rows as of a time; `bells.ts` is the economy (per-week earnings cached per State and, for locked weeks, per `rev`; pots; spends; the きろく ledger `bellsLedger`); `history.ts` the きろく views; `weight.ts` the weight trend (ADR 0020: a day's weight, the gap-aware 10% EWMA, week change, since start, pace, goal projection; nothing in the economy imports it). `scoring/bells.ts` is the pure earning rule (`earnWeek`, `duoBonus`, `splitPots`); `scoring/targets.ts` picks a week's rule version (`rulesFor`); `state.ts` `moveGoalOn` the Move goal in force on a day. `week.ts` builds the WeekView (incl. the harvest's badges and each pot's today / week flow).
- `app/src/lib/sync/` (round 9):
  - `storage.ts`: every Web Storage key in one registry. Live keys are `island.*`; the demo's are `island-demo.*`, so it can never touch the live key, queue or cache. Failed writes (quota, private mode) are reported, and the store shows a banner once per kind.
  - `transport.ts`: the POST helper (timeout, error taxonomy) and `whoami`. `pairing.ts`: the key, `#key=` links, and switching person (drops the cache and queue).
  - `queue.ts`: writes persisted in `localStorage` and replayed in order until acked, with undo windows and week locks (round 7 M1/M2). If storage refuses the queue, it is kept in memory: taps are still sent while the app is open.
  - `cache.ts`: the snapshot cache, in **IndexedDB** (in memory if that is unavailable). The pre-round-9 `localStorage` cache is migrated once and then removed. Each merge runs `compactRows`. A reply whose `rev` differs from the cached one (or a cache without a `rev`) triggers a full fetch (§2.1). There is no manual "reload everything": the `rev` check covers hand edits.
- `app/src/lib/store/`: `week.svelte.ts` (the store: composes the view and recomputes it on changes and on the minute tick), `actions.ts` (one synchronous function per user action, returning `{ok, undo?, hold?}`), `view.ts` (cache + queue → reduced state; the state is reused while its inputs are unchanged, and `rev` is passed to `reduce`), and the `Backend` interface with `live.ts` and `demo/` (generated rows, loaded only in the demo).
- Pairing: paste your key in the installed app. A `#key=` link only works when opened inside the installed PWA (iOS storage is per app). `whoami` confirms the person, and the key is stored in `localStorage`.
- Removed (done 2026-10-29): `app/src/lib/server/**`, `app/src/routes/api/**`, `app/src/routes/ingest/**`, `hooks.server.ts`, drizzle, `scripts/{pair,token,devices,recompute,vapid,backup*,restore*}`, Docker, adapter-node, better-sqlite3, web push.

## 4. Testing
- The parser: unit tests (ported from the shortcut-ingest tests).
- The GAS backend: vitest with an in-memory fake of `SpreadsheetApp`/`PropertiesService`/`LockService`/`CacheService`/`ContentService`. It covers auth, never-throws, append-only + higher-only metrics, dedupe, snapshot `since`, rate limit and body cap.
- The model's edits: `model/history.test.ts` (lowering, later higher syncs, the lock, own data only, workouts, check-in fixes, the change log, the history views).
- The ベル economy: `scoring/bells.test.ts` (the daily table, the max of the minute sources, caps, tsuyu, 正月, badges, the ふたりボーナス, the 20/80 split) and `model/bells.test.ts` (earnings landing as they happen, the bonus at Sunday 19:30, locks, spends that the pot can't cover, voids, menus last-writer-wins, the ledger).
- The weight trend: `gas/parse.test.ts` (the daily body, 0 = no weigh-in, mismatches), `gas/main.test.ts` (changed-only weight rows, `metric_set` weight bounds) and `model/weight.test.ts` (latest-row reads, edits, the EWMA, pace and projection, `compactRows`, and that weight never changes any earnings).
- The model: golden fixtures (`app/src/lib/model/fixtures/`, `golden.test.ts`): the full WeekView at 50 key instants and digests at 660 checkpoints of a 10-week timeline, plus invariants (the pots, the ledger and the harvest agree). First frozen from the old server; regenerated on purpose with `GOLDEN_UPDATE=1` when a rule changes (2026-10-30: the ベル economy, its tuning and the removal of the yen engine).
- The client: queue/retry/merge unit tests.

## 5. Shortcut (the user's)
URL → the `/exec` URL. Body: add `"key": "<KEY_A>"` and `"action": "ingest"` to the existing dictionary (`dates`, `steps`, `exercise_minutes`), plus `weight` (shortcut-health-sync.md §1). Drop the `Authorization` header. Request body type stays JSON (sent as text/plain: Shortcuts' "Text" body with the JSON string, or "JSON" works too because Apps Script reads `postData.contents`).
