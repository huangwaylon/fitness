# Island Fund: backend

The Google Sheet, the Apps Script web app in front of it, and the client's sync. The contract (tabs, row tuples, reply
shapes, bounds) is `app/src/lib/contract/api.ts`, shared by the script (`app/gas/`) and the client. After changing it,
rebuild `Code.js` and redeploy (`docs/ops/google-setup.md`).

## Overview

The sheet is an append-only log. `app/gas/main.ts` and `parse.ts`, bundled by `npm run gas:build` into
`app/apps-script/Code.js`, are its only reader and writer: they authenticate, validate shapes and append. There is no
server-side economy and no config tab: the client caches the rows and derives every number on read. User actions are
`event` rows sent through a persisted queue and shown at once. `appsscript.json`: V8, `Asia/Tokyo`, scope
`spreadsheets.currentonly`; the web app accepts anonymous calls (the key is the auth).

## Tabs

Row 1 is the header. A missing tab is created on first use with its text columns formatted as plain text (so Sheets
never turns dates into Dates). `at` is the request's server time, ISO 8601 UTC with milliseconds, strictly increasing
and shared by all rows of one request. Dates are `YYYY-MM-DD` (Tokyo). The app never updates or deletes a row.

| Tab | Columns | Written by |
|---|---|---|
| `metrics` | `at`, `person`, `date`, `metric`, `value` | `ingest`; `metric` ∈ `steps` · `exercise_min` · `move_kcal` · `stand_min` · `weight` |
| `events` | `at`, `person`, `id`, `type`, `data` (JSON text) | `event`; `id` client-generated |
| `uploads` | `at`, `person`, `status`, `bytes`, `error` | `ingest`'s audit: `ok` / `partial` / `error`, size, warnings and the body's shape (never the body or key) |

`metrics` and `events` are synced to the client; `uploads` is read only by the `uploads` action.

## Events

Exactly the types in `EVENT_TYPES`; another type or a bad shape is refused with `bad_request`. `data` is an object,
≤ 20,000 characters as JSON. The server checks shapes (and a spend's item and price, `SHOP` in `config/rules.ts`);
wallet cover is a read-time rule in the model, which ignores an invalid row.

| type | data | Rules |
|---|---|---|
| `spend` | `{spendId, item, bells}` | `spendId` 1–128 chars; `item` `snack` with `bells` 8, or `dinner` with `bells` 15 |
| `spend_void` | `{spendId}` | the model accepts it from the buyer, once, after the spend |
| `harvest` | `{week}` | a week key; counts only for the harvest open at the time |
| `highfive` | `{}` | |
| `pref` | `{key, value, person?}` | `locale` (`ja`/`en`), `villagerName` (1–20), `villager` (roster id), `goalWeight` (20–300 kg, one decimal, or null), `moveGoal` (integer 100–2,000) |
| `find` | `{kind, id}` | the island's scenery for the shared ずかん: `kind` ∈ `fish` · `bug` · `fossil` · `shell` · `fragment` (`FIND_KINDS`), `id` a catalog id (`[a-z][a-z0-9-]{0,47}`; the lists live in the client, so they can grow without a redeploy). Never ベル |

**Finds:** the client sends a `find` only the first time either person finds that `kind:id` (the model holds queued
events too, so a second catch before the ack sends nothing; a race between the two phones only adds a duplicate the
model folds away). The model's `findsView` (`model/finds.ts`) keeps the first find per `kind:id` across both people
(its Tokyo date and finder); the economy never imports it (`deps.test.ts`).

`person` (`A`/`B`, whose goal; absent = the sender) is allowed only on the `goalWeight` / `moveGoal` prefs
(`eventSubject`, shared by both sides). The row's `person` column is always the sender. There are no health-data events:
Apple Health is the source of truth ([design.md](design.md#health-data)); the old `metric_set`, `workout_add` and
`workout_edit` are refused, and rows of them in the sheet are ignored.

## API

`POST <exec url>`, body = JSON text, `Content-Type: text/plain` (no CORS preflight), `{key, action, ...}`. Every reply
is JSON: `{ok:true, ...}` or `{ok:false, error, detail?}`, `error` ∈ `unauthorized` · `bad_request` · `too_large` ·
`busy` · `unavailable`. `doPost` never throws (an uncaught error would return Google's HTML page). No `doGet`;
`e.parameter` is never read (a key in a query string would reach Google's logs). Body cap 1,000,000 characters.

| `action` | Request | Reply |
|---|---|---|
| `ingest` | the Shortcut's fields ([Ingest](#ingest)) | `{ok, metrics, skipped?, warnings?}` |
| `event` | `id, type, data` | `{ok, duplicate?}`: a repeated `id` is acked as a duplicate, so retries are safe |
| `snapshot` | `since?` (ISO: the max `at` cached) | `{ok, me, now, rev, rows:{metrics, events}}`: compact arrays in column order, rows with `at > since`, both people |
| `uploads` | | `{ok, rows:[{at, status, bytes, notes}]}`: the caller's last 20 audit rows, newest first |
| `whoami` | | `{ok, me, build}` (pairing; creates missing tabs) |
| `health` | no `key` | `{ok, build}`: no Properties, no lock, no sheet (the monitor) |

An unreadable `since` is `bad_request`; an unknown action too. `build` = the first 12 hex chars of SHA-256 over the
bundle (`gas/build.ts`; `dev` unbundled), also on line 3 of `Code.js`.

## Auth and limits

- **Keys:** the caller is whichever Script Property `KEY_A` / `KEY_B` matches, in constant time; a key that isn't
  32–128 hex characters is refused before any read. Keys are cached in `CacheService` for 5 minutes, so a rotated key
  works up to 5 minutes more.
- **Rate limit:** 120 requests per key per minute (a CacheService counter; a cache outage lets requests through).
  Over it: `busy`.

## Locks and server state

Every keyed action runs under the script lock (wait ≤ 10 s, else `busy`), so a snapshot never sees half a request's
rows. Each locked request reads Script Properties once and writes them at most once, also after a failure:
`LAST_AT` (the last `at`; the next is max(now, `LAST_AT` + 1 ms)), `ROWS` (each synced tab's last row as the script left
it) and `REV` ([Revision](#revision)).

**Tail reads:** rows are appended in `at` order, so "rows after X" is a tail, read backwards in doubling chunks (256,
512, …) until a chunk starts at or before X. `snapshot` with `since`, `ingest`'s comparison (from the day before the
body's earliest date) and `uploads` read tails; a full `snapshot` and the `event` id dedupe read the whole tab.

## Revision

`since` only finds appended rows, so a cache would miss a row deleted or corrected by hand. `REV` changes when, and
only when, a synced tab changed outside the app:

- rows added or deleted by hand (or a tab recreated): every read or append compares the tab's last row with `ROWS`;
- cells edited by hand: the simple trigger `onEdit`;
- manually: run `resync` from the script editor.

`rev` is opaque (equality only). A `snapshot` whose `rev` or `me` differs from the cache's makes the client drop the
cache (never the unsent queue) and fetch everything. Locked weeks' earnings are memoised per `rev`.

## Ingest

`gas/parse.ts`: newline-joined Text lists, one line per day, each optional: `dates` (Shortcuts' date text, English or
Japanese; only the day is used), `steps` (the iPhone's), `steps_watch` (the Apple Watch's), `exercise_minutes` (→ `exercise_min`), `calories` (→ `move_kcal`),
`stand_minutes` (→ `stand_min`), `weight` (kg; 0 = none). Other fields are ignored. A list whose length differs from
`dates` is dropped with a warning; an unreadable line, an activity value above `METRIC_BOUNDS` or a weight
outside 20–300 kg is skipped. A body with none of the fields is `bad_request` (audited as `error`).

**Steps:** Shortcuts' Find Health Samples sums every source, so the iPhone's and the Watch's steps would count twice
(Health de-duplicates them; Shortcuts doesn't). The Shortcut sends each device's list, filtered by Source, and a day's
steps are max(`steps`, `steps_watch`) (Health's merge counts one device at a time, so the max is close to its total;
a day unreadable in one list takes the other). Without `steps_watch`, `steps` is stored as sent. `steps_watch` is
validated like the other lists (Text, length = `dates`, ≤ 100,000).

**Latest wins:** Apple Health is the source of truth, so a row is appended whenever a value differs from the last row
for (person, date, metric), lower or higher (weight with one decimal); the same value is never appended twice. The
model reads a day's latest row ([design.md](design.md#health-data)); a locked week reads it as of its lock (Wednesday
04:00), so a later sync never moves locked earnings. The Shortcut posts to the `/exec` URL with `"key"`
and `"action": "ingest"` (`docs/ops/shortcut-health-sync.md`).

## Client sync

`lib/sync/` (storage, transport, pairing, queue, cache) and `lib/store/` (the week store, actions, `live.ts`,
`view.ts`, and the demo backend, loaded only with `?demo`).

### Storage keys

`sync/storage.ts` registers every key: live `island.key`, `island.me`, `island.queue`, `island.acked`; the demo
`island-demo.*` (it can never touch a live key); per device `island.sound`. If storage fails (full, private mode) the
data lives in memory for the session and a banner says so once. Pairing as a different person clears the cache, queue
and acked list. `sync/transport.ts` `post()` never throws (20 s timeout; network failure = `offline`; timeout,
non-2xx or non-JSON = `unavailable`).

### Snapshot cache

`sync/cache.ts`: `{me, rows, since, rev, rowsAt, skewMs, fetchedAt}` in IndexedDB (database `island`; in memory if
unavailable). A refresh posts `snapshot` with `since`, merges (`model/snapshot.ts`: deduped by natural key, ordered by
`at`; an empty poll keeps the same rows object, so nothing re-reduces), records the server clock skew and saves in
order. Overlapping refreshes share one request; a `fresh` caller waits for one more after any in flight. A reply that
lands after pairing again is dropped.

### Compaction

On each merge `model/compact.ts` drops `metrics` rows of locked weeks the model can no longer read: per (person, date,
metric) it keeps the latest row at the lock and the latest overall; per person the newest row. Weight keeps the newest
row per day. Views are unchanged; ~90% of rows go.

### Write queue

`sync/queue.ts`: events in `island.queue`, sent in order until acked.

- **Holds:** a held event (`holdMs`, the undo window) is skipped, not waited for; `unqueue` takes it back, `holdEvent`
  moves its time.
- **Subjects:** a later event on the same spend (its `spend_void`) never overtakes a held one, so the server keeps the
  on-screen order.
- **Replies:** acked (`ok` or `duplicate`) → into `island.acked`, then out of the queue; acked events stay in the view
  until a snapshot holds their id (given up 5 minutes after the ack). `bad_request` / `too_large` → dropped with a
  message. `unauthorized` → pairing. Other errors keep the event and all after it, with backoff 1 s, 2 s, 4 s … ≤ 5
  min, ±20%.
- **Retry now:** the `online` event, a sync tap and the re-read after an ack send backed-off events at once (a
  background refresh on becoming visible keeps the backoff).

### Optimistic view

`store/view.ts composeModel`: the cached rows plus acked and queued events, each stamped just after the newest server
row on the server's clock, so read-time rules judge it as the server will. The store recomputes on every change and
each minute (not while hidden: a missed minute recomputes once on return).

### When it syncs

On launch (after painting from the cache), when the app becomes visible (≤ every 30 s), on a sync tap, on `online`, and
1.5 s after an ack (a `fresh` re-read so server timestamps replace optimistic ones). Each refresh flushes the queue,
then fetches.

## Service worker

`app/src/service-worker/` (pure rules in `caches.ts`).

- **Install:** precaches built JS/CSS and static files except fonts, audio, the art manifest and villager art beyond
  the two defaults. Non-hashed files and the shell are fetched with `cache: 'reload'` (past Pages' 10-minute HTTP
  cache).
- **Activate:** keeps the current shell (`island-shell-<version>`), the previous one (an old page loads its lazy chunks
  from it) and the runtime caches; deletes the rest.
- **Navigations:** network first; the cached shell offline or after 3 s. A response becomes this version's shell only
  if it has none, so an old worker never stores a newer build's HTML.
- **Runtime:** fonts and villager art cache-first on first use; audio (`island-audio-v1`) cache-first with the 3 most
  recent music files kept; Range requests pass through. Other GETs: this version's cache, the previous one, then the
  network. The Apps Script backend is cross-origin and always live.

## Tests

`gas/main.test.ts` (a fake of the Apps Script services in `gas/fakes.ts`), `gas/parse.test.ts`, `gas/perf.test.ts`,
`gas/bundle.test.ts`; queue, cache, sync and store tests; the golden fixtures (`GOLDEN_UPDATE=1` to regenerate) and
`npm run bench` for the model at year-3 volume.
