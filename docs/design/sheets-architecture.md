# Sheets architecture: the contract (ADR 0015)

The Google Sheet and the Apps Script web app the client talks to. Source of truth in code:
`app/src/lib/contract/api.ts` (tabs, row tuples, reply shapes, bounds), shared by the script (`app/gas/`) and the
client. Change the contract there, rebuild `Code.js` and redeploy once ([google-setup.md](../ops/google-setup.md) §11).

## 1. Spreadsheet tabs

Row 1 is the header; the script creates a missing tab on first use (text columns formatted as plain text). `at` is the
server time of the request, ISO 8601 UTC with milliseconds, strictly increasing. Dates are `YYYY-MM-DD` (Tokyo). Every
tab is **append-only**; the app never updates or deletes a row.

| Tab | Columns | Written by |
|---|---|---|
| `metrics` | `at`, `person`, `date`, `metric` (`steps`\|`exercise_min`\|`move_kcal`\|`stand_min`\|`weight`), `value` | `ingest`. The activity metrics (daily totals) **only when higher** than the highest row so far for (person, date, metric). `weight` (kg, one decimal; ADR 0020) **whenever it differs** from the last row for (person, date) |
| `workouts` | `at`, `person`, `id`, `date`, `type`, `start`, `end`, `duration_min`, `avg_hr` | `ingest`, only for an unseen `id` (`workoutKey(type, start)`, stable across re-sends and phone languages) |
| `presence` | `at`, `person`, `label`, `arrived_at` | `gym`: one row per gym arrival (ADR 0021). `label` is free text (≤ 40, `''` shows as ジム); `arrived_at` = the request's `at`, else the row's `at`. The tab keeps its historical name |
| `events` | `at`, `person`, `id`, `type`, `data` (JSON) | `event` (client-generated `id`; a repeated `id` is acked as a duplicate, so retries are safe) |
| `uploads` | `at`, `person`, `status`, `bytes`, `error` | `ingest` audit: status, size, warnings and the body's *shape* (field types, line counts, first item), never the body or the key |

### Events

Exactly the types in `EVENT_TYPES`; the script refuses any other type or shape with `bad_request` (only shapes: who may
edit what, open weeks and wallet cover are read-time rules in the model). `data` ≤ 20,000 characters.

- `spend {spendId, item, label, bells}` (ADR 0022): a buy from the shared wallet; `spendId` a string (1–128), `bells` an integer 1–10,000,000,
  `label` 1–60 characters, `item` ≤ 40. The model counts it only if the wallet covered it at its `at`.
- `spend_void {spendId}`: the buyer only, once, after the spend; the ベル go back. Buys never lock.
- `harvest {week}` (受け取る: a ceremony; the bonus counts either way) · `highfive {}`.
- `pref {key, value}`, `key` in `PREF_KEYS`: `locale` (`ja`|`en`), `villagerName` (1–20), `villager` (a roster id),
  `goalWeight` (kg, 20–300, one decimal, or `null` to clear; ADR 0020), `moveGoal` (integer 100–2,000 kcal, from the
  Tokyo date of its `at` on; ADR 0021), and the shared `menu`: a JSON array of `{id, label, bells}` (≤ 30 items,
  unique ids `[\w-]{1,40}`, label 1–60, bells 1–10,000,000). The latest valid value wins; an invalid one is ignored as
  a whole.
- きろく edits ([history-and-editing.md](history-and-editing.md) §4). The subject is always the sender: there is no
  person field, so nobody can edit the partner's record.
  - `metric_set {date, metric, value}`: an activity metric (integer; steps 0–100,000, minutes 0–1,440, kcal 0–10,000)
    overrides the day's value, also lower; or `metric:'weight'` (kg, 20–300, one decimal; no week lock).
  - `workout_edit {id, strength?: true|false|null, excluded?: boolean}`: count as strength or not (`null` =
    automatic), or leave out of scoring.
  - `workout_add {id:'m:<id>', date, type, durationMin 1–600, strength?}`: a workout added by hand (a known type).

**ベル on read** (`model/bells.ts`): earnings are recomputed from the rows, so they move with late syncs and edits
until the week's Wednesday 04:00 lock, then are fixed at the lock. The rules live in `config/rules.ts`; there is no
config tab and no server-side economy.

## 2. Web app API: `POST <exec url>`, body = JSON text, `Content-Type: text/plain`

Every request is `{key, action, ...}` (a simple request: no CORS preflight). Every reply is JSON, `{ok:true, ...}` or
`{ok:false, error, detail?}` with `error ∈ unauthorized | bad_request | too_large | busy | unavailable`. `doPost`
never throws (an uncaught error would return Google's HTML page). There is no `doGet`, and `e.parameter` is never read
(a key in a query string would land in Google's logs). Body cap 1 MB.

| `action` | Request | Reply |
|---|---|---|
| `ingest` | The Shortcut's daily Text lists, one line per day ([shortcut-health-sync.md](../ops/shortcut-health-sync.md) §1): `dates`, `steps`, `exercise_minutes`, `calories` (active kcal → `move_kcal`), `stand_minutes` (→ `stand_min`), `weight` (kg, 0 = none), each optional; optional `workouts {types, starts, ends, avgHrs}` (one line per workout); other fields ignored | `{ok, metrics, workouts, skipped?, unknownTypes?, warnings?}`: rows appended; a list whose length differs from `dates` is dropped with a warning (the rest is saved); a value above the `metric_set` bounds is skipped |
| `gym` | `place?` (text ≤ 40, a label only), `at?` (ISO 8601 instant with offset: the true arrival time) | `{ok}`. The key is the person |
| `event` | `id, type, data` | `{ok, duplicate?}` |
| `snapshot` | `since?` (ISO, the max `at` the client has) | `{ok, me, now, rev, rows:{metrics, workouts, presence, events}}`: compact arrays in column order, rows with `at > since`, both people |
| `uploads` | — | `{ok, rows:[{at, status, bytes, notes}]}`: the caller's last 20 ingest audit rows, newest first |
| `whoami` | — | `{ok, me, build}` (pairing; creates any missing tab) |
| `health` | **no `key`** | `{ok:true, build}`: up, authorized and running `build`; no Properties read, no lock, no sheet (the monitor, [runbook](../ops/runbook.md) §5) |

- **Auth:** the person is whichever of the Script Properties `KEY_A` / `KEY_B` matches, compared in constant time; a
  key that isn't 32–128 hex characters is refused before anything is read. Keys are cached in `CacheService` for 5
  minutes (a rotated key works for up to 5 minutes more). Rate limit: 120 requests per key per minute.
- **Lock:** writes and `snapshot` take the script lock (wait ≤ 10 s, else `busy`), so a snapshot never sees half of a
  request's rows. Each locked request reads Script Properties once and writes them at most once (`LAST_AT`, `ROWS`,
  `REV`), also when it fails after appending.
- **Tail reads.** The app only appends with increasing `at`, so "every row after X" is a tail: the script reads a tab
  backwards in doubling chunks (256, 512, …) and stops at the first chunk that starts at or before X. `snapshot` with
  `since` reads only the new rows; `ingest`'s higher-only check and workout dedupe read from the day before the body's
  earliest date; `uploads` reads back to the caller's last 20. `snapshot` without `since` and the `event` id dedupe
  read the whole tab.
- **Gym rows** are judged on read: an arrival more than 48 h from its server `at` is ignored, and a person's repeat
  within 2 minutes is dropped; any arrival makes its Tokyo date a 🥥 day.
- `build`: the first 12 hex characters of SHA-256 over the bundle (`app/gas/build.ts`; `dev` unbundled), on line 3 of
  `Code.js` (`// build: …`). `bundle.test.ts` checks it.

### 2.1 Resync: `rev`

`since` only finds rows appended after it, so a cached client would never see a row **deleted or corrected by hand**,
or pasted with an old `at`. The server keeps a data revision, the Script Property `REV`, returned with every
`snapshot`. It changes when, and only when, a synced tab (`metrics`, `workouts`, `presence`, `events`) changed outside
the app:

- **Rows added or deleted by hand** (or a tab recreated): the script records each synced tab's last row (`ROWS`) after
  its own appends and compares it on every read or append; a difference bumps `REV`.
- **Cells edited or pasted by hand:** the simple trigger `onEdit` bumps `REV` (script writes don't fire it).
- **Manually:** run `resync` from the script editor (after any hand fix, if in doubt).

`rev` is opaque; compare it only for equality. The client stores it with its cache; a reply with a different `rev`
discards the cache (never the unsent queue) and fetches a full `snapshot`. Locked weeks' earnings are memoised per
`rev` (`reduce(rows, calendar, rev)`), so a poll doesn't recompute every past week.

## 3. Code layout

- `app/gas/parse.ts`: pure parser of the Shortcut body (English and Japanese Shortcuts date text, Japanese workout
  names mapped back to canonical types). `app/gas/main.ts`: `doPost`, auth, the lock, sheet helpers, the actions.
  `npm run gas:build` bundles both (with `contract/`) via esbuild into `app/apps-script/Code.js`, one global script.
  `apps-script/appsscript.json`: scope `spreadsheets.currentonly`, the web app, timezone `Asia/Tokyo`.
- `app/src/lib/model/`: pure compute-on-read. `state.ts` validates and indexes rows (an event the script would refuse
  is ignored); `inputs.ts` reads a person's rows as of a time; `bells.ts` the economy (earnings, the wallet, the menu,
  the ledger); `week.ts` the WeekView; `history.ts` the きろく views and change log; `weight.ts` the weight trend;
  `snapshot.ts` merges `since` replies; `compact.ts` drops cached `metrics` rows of locked weeks the model can no longer
  read (~90% fewer, views unchanged; weight keeps the newest row per day).
- `app/src/lib/sync/`: `storage.ts` (every Web Storage key in one registry; live `island.*`, demo `island-demo.*`),
  `transport.ts` (the POST helper, timeout, error taxonomy), `pairing.ts`, `queue.ts` (events persisted in
  `localStorage`, replayed in order with backoff until acked; undo windows and week locks), `cache.ts` (the snapshot
  cache in IndexedDB, in memory if unavailable; compacted on each merge; the `rev` check).
- `app/src/lib/store/`: `week.svelte.ts` (the store; recomputes on changes and each minute), `actions.ts` (one function
  per user action), `view.ts` (cache + queue → state, queued events stamped as the server will), and the `Backend`
  interface with `live.ts` and `demo/` (generated rows, loaded only with `?demo`).

## 4. Testing

- `gas/parse.test.ts`, `gas/main.test.ts` (an in-memory fake of the Apps Script services, `gas/fakes.ts`: auth,
  never-throws, higher-only and changed-only metrics, dedupe, `since`, `rev`, the gym action, rate limit, body cap),
  `gas/perf.test.ts` (hot paths at year-3 volume), `gas/bundle.test.ts`.
- The economy: `scoring/bells.test.ts`, `model/bells.test.ts`; きろく and edits: `model/history.test.ts`; weight:
  `model/weight.test.ts`; `model/compact.test.ts`.
- Golden fixtures (`model/fixtures/`, `golden.test.ts`): the full WeekView at key instants and digests along a 10-week
  timeline, plus invariants. Regenerate on purpose with `GOLDEN_UPDATE=1` when a rule changes.
- Client: queue, cache, sync and store tests; `npm run bench` for the model at year-3 volume.

## 5. Shortcut

The URL is the `/exec` URL; the body adds `"key"` and `"action": "ingest"` to the Shortcut's dictionary. Setup:
[shortcut-health-sync.md](../ops/shortcut-health-sync.md).
