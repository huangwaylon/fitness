# Sheets architecture: the contract (ADR 0015)

Builders code against this. Change it only through the lead.

## 1. Spreadsheet tabs (row 1 = header; the script creates missing tabs on first run)
All timestamps are ISO 8601 UTC strings written by the script (`at`). Dates are `YYYY-MM-DD` (Tokyo). Every tab is **append-only**; nothing is updated or deleted by the app.

| Tab | Columns | Written by |
|---|---|---|
| `metrics` | `at`, `person`, `date`, `metric` (`steps`\|`exercise_min`), `value` | `ingest`, **only when the value is higher** than the latest for (person, date, metric) |
| `workouts` | `at`, `person`, `id`, `date`, `type`, `start`, `end`, `duration_min`, `avg_hr` | `ingest`, only for unseen `id` (`workoutKey(type, start)`) |
| `presence` | `at`, `person`, `place`, `event` (`arrive`\|`leave`), `event_at` | `presence` |
| `events` | `at`, `person`, `id`, `type`, `data` (JSON) | `event` (client-generated `id`; a duplicate `id` is ignored, so retries are safe) |
| `uploads` | `at`, `person`, `status`, `bytes`, `error` | `ingest` (audit only: no payload stored) |

Event `type`s and `data`:
- `checkin {date, habit, done}`: the latest per (person, date, habit) wins.
- `confirm {kind:'visit'|'workout', id, yes}`
- `spend {spendId, label, amountYen}` and `approve {spendId}`
- `transfer {month}` · `harvest {week}` · `highfive {}`
- `pref {key, value}` (keys: `locale`, `villagerName`, `villager`)
- `share {metric, on}`: refused by the script (`bad_request`); old rows are ignored (ADR 0016).

Edits from きろく (`docs/design/history-and-editing.md` §4; added 2026-10-29, **redeploy `Code.js`**). The subject is always the sender (`person`): there is no person field, so nobody can edit the partner's record. Activity edits count only while the day's week is open (this week, and last week until Wednesday 04:00 JST); the model ignores the rest, so the sheet stays a dumb log:
- `metric_set {date, metric:'steps'|'exercise_min', value}`: overrides the day's value, also lower. The script refuses a non-integer or out-of-range `value` (steps 0–100,000; minutes 0–1,440) or a bad date/metric with `bad_request`. Read rule: S = latest `metric_set` with `at ≤ T`; none → max of ingest rows; else max(S.value, ingest rows with S.at < at ≤ T).
- `workout_edit {id, strength?: true|false|null, excluded?: boolean}`: strength override for any type (`null` = automatic), or out of scoring.
- `workout_add {id:'m:<id>', date, type, durationMin 1–600, strength?}`: a manual workout (a known canonical type).
- `checkin {…, edit:true}`: a fix for any day ≤ today of an open week (instead of the 48 h window).
- `spend_void {spendId}`: the spender only; refunds a paid spend or cancels a waiting one (a refused spend stays refused).
- `transfer_undo {month}`: either person; the latest of `transfer`/`transfer_undo` for the month wins.

Weekly yen already paid never change: a raise before the lock becomes the Wednesday top-up, a lowering keeps Sunday's payout.

The rules (targets, money, seasons) stay in `app/src/lib/config/rules.ts`. No config tab.

## 2. Web app API: `POST <exec url>`, body = JSON text, `Content-Type: text/plain`
Every request has `{key, action, ...}`. Every reply is JSON: `{ok:true, ...}` or `{ok:false, error}`, where `error ∈ unauthorized | bad_request | too_large | busy | unavailable`. `doPost` never throws: an uncaught error would return Google's HTML page. There is **no `doGet`**. Body cap: 1 MB.

| `action` | Request | Reply |
|---|---|---|
| `ingest` | `dates, steps, exercise_minutes` (newline lists or arrays; the user's Shortcut format), optional `exercise_dates` (exercise samples' own dates), `steps_sources`/`exercise_sources` (per-sample source: totals per source, the larger wins), `workouts` (types/starts/ends/avgHrs lists) | `{ok, metrics, workouts, skipped?, unknownTypes?, warnings?}`: rows actually appended, plus unparsed entries, unmapped workout names and dropped lists (a list whose length differs from its dates is dropped, the rest saved) |
| `presence` | `place, event, at?` | `{ok}` |
| `event` | `id, type, data` | `{ok, duplicate?}` |
| `snapshot` | `since?` (ISO, the max `at` the client has seen) | `{ok, me, now, rev, rows:{metrics, workouts, presence, events}}` (rows with `at > since`; both people; `rev`: §2.1) |
| `whoami` | — | `{ok, me, build}` (used when pairing; `build` = the deployed code's hash) |
| `health` | **no `key`** | `{ok:true, build}`: up, authorized, and running `build` (no Properties read, no lock, no sheet). The monitor's probe (runbook §5) |

- Person = whichever of `KEY_A`/`KEY_B` matches, compared in constant time. A key that isn't 32–128 hex characters is `unauthorized` before anything is read. The keys are cached in `CacheService` for 5 minutes, so a rotated key keeps working for up to 5 minutes. The rate limit is a per-key-per-minute counter in `CacheService`.
- `ingest`'s higher-only check reads only the last 5,000 `metrics` rows when every date in the body is at most 14 days old (the hourly Shortcut); a body with older dates (the baseline) reads the whole tab.
- Writes (and `snapshot`) take `LockService.getScriptLock()` (wait ≤ 10 s, else `busy`). Each locked request reads Script Properties once (`getProperties`) and writes them at most once (`LAST_AT`, `ROWS`, `REV`).
- `snapshot` without `since` returns everything, as compact arrays (`rows.metrics = [[at, person, date, metric, value], …]`). With hourly syncs that is ~18k rows a year (3.7 MB of JSON by year 3, `npm run bench`).

### 2.1 Resync: `rev` (added round 9; **redeploy `Code.js`**)
`since` only finds rows appended after it, so a cached client never sees a row that was **deleted or corrected by hand**, or pasted with an old `at`. The server therefore keeps a data revision, the Script Property `REV`, and returns it in every `snapshot` reply. It changes when, and only when, a synced tab (`metrics`, `workouts`, `presence`, `events`; not `uploads`) changed outside the app:
- **Rows added or deleted by hand** (or a tab deleted and recreated): the script records each synced tab's last row (`ROWS`) after its own appends and compares it on every read or append under the lock. A difference bumps `REV`.
- **Cells edited or pasted by hand:** the simple trigger `onEdit` bumps `REV` (script writes don't fire it).
- **Manually:** run `resync` from the script editor's function menu (or set `REV` to any new value in Script Properties). Do this after any hand fix if in doubt.

`rev` is an opaque short string; compare it only for equality. The app's own writes never change it.

**Client side (WS2):** store `rev` with the snapshot cache. When a reply's `rev` differs from the stored one, discard the reply's rows and the whole cache (keep the unsent write queue), fetch a full `snapshot` without `since`, and store the new `rev`. A cache with no stored `rev` (from before this change) resyncs once the same way. A manual *resync* button in the app does the same full fetch. Derived caches (finalized weeks, round 8 P5) are keyed by `rev`.

**Model helpers for the client (WS1, `app/src/lib/model/`):**
- `compactRows(rows, now)` (`compact.ts`): drops the metrics rows of locked weeks that the model can no longer read (keeps, per person/date/metric, the best row at the Sunday 19:30 payout, the Wednesday lock, each `metric_set` and overall). Every view is unchanged (`compact.test.ts`); it cuts metrics ~90%. Run it on the cache after each merge. It relies on ingest rows only going up, which a hand edit can break; that bumps `rev`, and the full refetch replaces the cache.
- `reduce(rows, calendar, rev)`: pass the cached `rev` (live data only) and the payouts of past cutoffs are reused across States (round 8 P5), so a poll or minute tick no longer recomputes every past week. `npm run bench`, year 3 with hourly syncs, compacted: reduce + `buildWeekView` ≈ 8 ms with `rev`, ≈ 21 ms without (Mac).

`whoami.build` / `health.build`: the first 12 hex characters of SHA-256 over the bundle (`buildHash()` in `app/gas/build.ts`; `dev` when `main.ts` runs unbundled). `bundle.test.ts` checks that `Code.js` carries it.

## 3. Code layout
- `app/gas/parse.ts`: **pure, dependency-free** parser of the Shortcut body → `{metrics:[{date,metric,value}], workouts:[…], skipped}`. A port of `server/ingest/shortcut.ts` + `workout-names.ts`, without zod, so it runs in Apps Script (the browser never parses Shortcut bodies).
- `app/gas/`: Apps Script source in TS (`main.ts`: `doPost`, sheet helpers), bundled with the parser by **esbuild** into `apps-script/Code.js` (one global script, no imports) via `npm run gas:build`. `apps-script/appsscript.json` sets scope `spreadsheets.currentonly`, the web app, and timezone `Asia/Tokyo`. `clasp` is optional (`.clasp.json` not committed).
- `app/src/lib/model/`: **pure compute-on-read**. `snapshot → WeekView` (and jar, harvest, pending confirmations, host line), reusing `scoring/` and `config/rules.ts`. It replaces `server/week.ts` and `server/ledger.ts` semantics, including the max(Sunday 19:30, Wednesday 04:00) payout rule and purse/transfer math.
- `app/src/lib/sync/` (round 9):
  - `storage.ts`: every Web Storage key in one registry. Live keys are `island.*`; the demo's are `island-demo.*`, so it can never touch the live key, queue or cache. Failed writes (quota, private mode) are reported, and the store shows a banner once per kind.
  - `transport.ts`: the POST helper (timeout, error taxonomy) and `whoami`. `pairing.ts`: the key, `#key=` links, and switching person (drops the cache and queue).
  - `queue.ts`: writes persisted in `localStorage` and replayed in order until acked, with undo windows and week locks (round 7 M1/M2). If storage refuses the queue, it is kept in memory: taps are still sent while the app is open.
  - `cache.ts`: the snapshot cache, in **IndexedDB** (in memory if that is unavailable). The pre-round-9 `localStorage` cache is migrated once and then removed. Each merge runs `compactRows`. A reply whose `rev` differs from the cached one (or a cache without a `rev`) triggers a full fetch (§2.1). `refreshSnapshot({full})` backs the しまフォン → 通信 → ぜんぶ読みなおす button.
- `app/src/lib/store/`: `week.svelte.ts` (the store: composes the view and recomputes it on changes and on the minute tick), `actions.ts` (one synchronous function per user action, returning `{ok, undo?, hold?}`), `view.ts` (cache + queue → reduced state; the state is reused while its inputs are unchanged, and `rev` is passed to `reduce`), and the `Backend` interface with `live.ts` and `demo/` (generated rows, loaded only in the demo).
- Pairing: paste your key in the installed app. A `#key=` link only works when opened inside the installed PWA (iOS storage is per app). `whoami` confirms the person, and the key is stored in `localStorage`.
- Removed (done 2026-10-29): `app/src/lib/server/**`, `app/src/routes/api/**`, `app/src/routes/ingest/**`, `hooks.server.ts`, drizzle, `scripts/{pair,token,devices,recompute,vapid,backup*,restore*}`, Docker, adapter-node, better-sqlite3, web push.

## 4. Testing
- The parser: unit tests (ported from the shortcut-ingest tests).
- The GAS backend: vitest with an in-memory fake of `SpreadsheetApp`/`PropertiesService`/`LockService`/`CacheService`/`ContentService`. It covers auth, never-throws, append-only + higher-only metrics, dedupe, snapshot `since`, rate limit and body cap.
- The model's edits: `model/history.test.ts` (lowering, later higher syncs, lock, top-up, own data only, workouts, check-in fixes, voids, transfer undo, the change log, the history views).
- The model: was differential-tested against the old server (`getWeekView`, settlement, payout) on a 10-week timeline and on the real DB; those server outputs are now frozen golden fixtures (`app/src/lib/model/fixtures/`, `golden.test.ts`).
- The client: queue/retry/merge unit tests.

## 5. Shortcut (the user's)
URL → the `/exec` URL. Body: add `"key": "<KEY_A>"` and `"action": "ingest"` to the existing dictionary (`dates`, `steps`, `exercise_minutes`). Drop the `Authorization` header. Request body type stays JSON (sent as text/plain: Shortcuts' "Text" body with the JSON string, or "JSON" works too because Apps Script reads `postData.contents`).
