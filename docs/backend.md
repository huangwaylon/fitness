# Island Fund: backend

The record (a Durable Object's SQLite on the relay), the Google Sheet it is exported to, the Apps Script web app in
front of the sheet, and the client's sync. The contract (tabs, row tuples, reply shapes, bounds) is
`app/src/lib/contract/api.ts`, shared by the record (`relay/src/store.ts`), the script (`app/gas/`) and the client.

## Overview

The record is an append-only log with slots (a later tally of the same day replaces the earlier one, and so on): the
relay's `IslandStore` ([The record](#the-record)) is its only reader and writer. It authenticates, validates shapes,
stamps `at` and appends; there is no server-side economy and no config: the client caches the rows and derives every
number on read. User actions are `event` rows sent through a persisted queue and shown at once; health data comes from
each phone's Shortcut (`ingest`). The Google Sheet is a one-way export of the record, rewritten by the relay's cron
(a backup to look at; an edit there goes nowhere). Its Apps Script web app (`app/gas/main.ts` → `Code.js`) only
takes the export (a keyed request there is refused with the record's URL). `appsscript.json`: V8, `Asia/Tokyo`, scope
`spreadsheets.currentonly` (no outgoing requests); the web app accepts anonymous calls (the relay's signature is the
auth).

## Tabs

The record's tables mirror the sheet's tabs ([The record](#the-record) "Where"). `at` is the record's time, ISO 8601
UTC with milliseconds, strictly increasing (all rows of one ingest share it). Dates are `YYYY-MM-DD` (Tokyo).

| Tab | Columns | Written by |
|---|---|---|
| `metrics` | `at`, `person`, `date`, `metric`, `value` | `ingest`; `metric` ∈ `steps` · `exercise_min` · `move_kcal` · `stand_min` · `weight` · `body_fat_pct` · `bmi` · `lean_kg` |
| `events` | `at`, `person`, `id`, `type`, `data` (JSON text) | `event` / `events`; `id` client-generated |
| `uploads` | `at`, `person`, `status`, `bytes`, `error` | `ingest`'s audit: `ok` / `partial` / `error`, size, warnings and the body's shape (never the body or key) |

`metrics` and `events` are synced to the client; `uploads` is read only by the `uploads` action. **The sheet:** the
same three tabs, rewritten whole by each export (row 1 the header, bold and frozen, with a note that the sheet is a
read-only export; columns text or number as `NUMERIC_COLUMNS` has them, so Sheets never turns a date into a Date), and a
`README` tab saying so in English and Japanese, with the export's time, the newest row's `at`, the revision and the
row counts.

## Events

Exactly the types in `EVENT_TYPES`; another type or a bad shape is refused with `bad_request`. `data` is an object,
≤ 20,000 characters as JSON. The server checks shapes (and a spend's item and price, `SHOP` in `config/rules.ts`);
wallet cover is a read-time rule in the model, which ignores an invalid row.

| type | data | Rules |
|---|---|---|
| `spend` | `{spendId, item, bells}` | `spendId` 1–128 chars; `item` `snack` with `bells` 40, or `dinner` with `bells` 70 |
| `spend_void` | `{spendId}` | from either person; the script refuses one naming no `spend` row and acknowledges a second void of the same buy as `duplicate` (nothing appended); the model takes the first after the spend |
| `harvest` | `{week}` | a week key; counts only for the harvest open at the time |
| `pref` | `{key, value, person?}` | `locale` (`ja`/`en`), `villagerName` (1–20), `villager` (roster id), `goalWeight` (20–300 kg, one decimal, or null), `goalBodyFat` (3–60 %, one decimal, or null), `moveGoal` (integer 100–2,000), `stepsGoal` (1,000–30,000, a multiple of 500) |
| `find` | `{kind, id}` | the island's scenery for the shared ずかん: `kind` ∈ `fish` · `bug` · `sea` · `fossil` · `shell` · `fragment` · `item` · `recipe` (`FIND_KINDS`; the last two: what a balloon's present held), `id` a catalog id (`[a-z][a-z0-9-]{0,47}`; the lists live in the client, so they can grow without a redeploy). Never ベル |
| `tally` | `{date, counts}` | one person's counts of one Tokyo day for the ずかん's 「×12」 (`contract/tally.ts`): `date` a real date not after tomorrow (server's Tokyo date), `counts` 1–300 keys `kind:id` (a find's kind and id) → whole 1–999. One row per person and day: see **Tally** below. Never ベル |
| `island` | `{date, taken, puts, shakes, watered, wishes, at?}` | one person's part of one Tokyo day's shared island ([Shared world](#shared-world), `contract/island.ts`): ids picked up, dug, pulled or opened (≤ 400), things put down `[id, what, x, z]` (≤ 60), shakes that left something `[tree, drop, at]` (≤ 120), flowers watered (`fl:<x>:<z>`, world.ts FLOWERS, ≤ 40), wishes by the morning they bring a fragment, where their villager stands (`[x, z]` within the plan); `date` not after tomorrow. One row per person and day, replaced like a tally. Never ベル |
| `decor` | `{id, at, item, x, z, f, p}` or `{id, at, rm: true}` | the island's decorations ([Decorating](design.md#decorating), `contract/decor.ts`): an item set at a spot (placed or moved: its whole state; `item` one of the ten, `x` −40…430 and `z` −30…1040 whole units, `f` the facing 0–3, `p` when it was first placed, `at` the sender's relay clock in ms) or taken away (final). Either person, any item. The script keeps each item's **latest op only**: it deletes the item's older rows before appending (as a tally's), acknowledges an op that a row of the item beats as `duplicate` (a removal, or a later op) and refuses a new item past 30 (`bad_request`, `decor full`). The model merges them by id (`decorLayout`: a removal beats everything, else the latest `at`, then B over A). **The tent's** ([The tent](design.md#the-tent), `contract/tent.ts`) are the same ops with `sc: 't'`: `item` a piece's code (`f…`), `x` and `z` its footprint's back-left tile 0–7; the wallpaper and the floor are the ids `dtentwall` / `dtentfloor` (`w…` / `g…`, x = z = f = 0, never removed). Kept apart from the island's: their own latest op per id, their own cap of 40 pieces (`tent full`); うめ's and the guest's homes' rooms are the same with `sc: 'u'` / `'v'`. **The island's layout** ([island-layout.md](island-layout.md#ops-the-record-and-the-relay), `contract/layout.ts`) is `sc` `o` (an object), `c` (a terrain chunk), `r` (a reset: the record drops the object and chunk ops it voids) and `h` (a home's look): the outdoors the members' alone (the guest's is `forbidden`), a home's look and room its owner's (`scopeMayWrite`), at most 1,500 objects ever set (`layout full`) |

**Finds:** the client sends a `find` only the first time either person finds that `kind:id` (the model holds queued
events too, so a second catch before the ack sends nothing; a race between the two phones only adds a duplicate the
model folds away). The model's `findsView` (`model/finds.ts`) keeps the first find per `kind:id` across both people
(its Tokyo date and finder); the economy never imports it (`deps.test.ts`).

<a id="tally"></a>**Tally:** every catch and pick-up adds one to the phone's tally of the day (`store/actions.ts` recordFind), sent as
the day's whole tally: held a minute (the next catches replace the held one), so a busy minute is one request. The
script keeps one row per person and day: before appending, it deletes the sender's older `tally` rows of that date
(only rows whose data mentions it are parsed). The rows below move up still in `at` order, so `since` reads stay a tail,
and the script records the new last row itself (no revision bump). A phone that cached a replaced row keeps it
harmlessly: the model reads each person's latest tally of a day (`model/tally.ts`, by `at`) and sums days and people
into totals per entry and per person; compaction drops replaced rows from the cache. The next tally starts from the
latest row of the day (another phone's or before a reload), so a send never lowers a count. Two people × a year ≈ 730
rows of a few hundred bytes.

`person` (`A`/`B`, whose goal; absent = the sender) is allowed only on the `goalWeight` / `goalBodyFat` / `moveGoal` / `stepsGoal` prefs
(`eventSubject`, shared by both sides). The row's `person` column is always the sender. A new pref key needs the
relay first (the record refuses a key it doesn't know: `bad_request`); an app from before it reads such a row and
ignores it (the model takes only the keys it knows), so `goalBodyFat` (2026-11-02) went relay first, then the app. There are no health-data events:
Apple Health is the source of truth ([design.md](design.md#health-data)).

## API

`POST https://island-fund-relay.island-fund-relay.workers.dev/api`, body = JSON text (`text/plain` from a page: no CORS
preflight; a Shortcut's `application/json` is fine), `{key, action, ...}`. Every reply is JSON with status 200:
`{ok:true, ...}` or `{ok:false, error, detail?}`, `error` ∈ `unauthorized` · `bad_request` · `too_large` · `busy` ·
`unavailable`. Body cap 1,000,000 characters.

| `action` | Request | Reply |
|---|---|---|
| `ingest` | the Shortcut's fields ([Ingest](#ingest)) | `{ok, metrics, skipped?, warnings?}` |
| `event` | `id, type, data` | `{ok, duplicate?}`: a repeated `id` is acked as a duplicate, so retries are safe |
| `events` | `events: [{id, type, data}, …]` (≤ 50) | `{ok, results: [{id, ok, duplicate?, at?} \| {id, ok: false, error, detail?}]}`: each kept in order as `event` would, `at` its stored row's |
| `snapshot` | `since?` (ISO: the max `at` cached) | `{ok, me, now, rev, rows:{metrics, events}}`: compact arrays in column order, rows with `at > since`, both people |
| `uploads` | | `{ok, rows:[{at, status, bytes, notes}]}`: the caller's last 20 audit rows, newest first |
| `whoami` | | `{ok, me, build}` (pairing) |
| `health` | no `key` | `{ok, build: 'relay-1'}` (the Apps Script's `/exec` answers its own: `{ok, build}`, the first 12 hex chars of SHA-256 over `Code.js`, also on its line 3) |

An unreadable `since` is `bad_request`; an unknown action too.

## Auth and limits

- **Keys:** the caller is whichever Worker secret `KEY_A` / `KEY_B` matches (or `KEY_C`, the guest's: `G`,
  [The guest](#the-guest)), in constant time; a key that isn't 32–128 hex characters is refused before any comparison.
  The two members' keys are Script Properties (the export's signature is derived from them, never from `KEY_C`):
  rotate both together ([runbook §4](ops/runbook.md#4-rotate-a-key)).
- **Rate limit:** 120 requests per key per minute (in the record's memory). Over it: `busy`.

## Record state

The record keeps its clock and revision in its `meta` table: `last_at` (the last `at`; the next is max(now,
`last_at` + 1 ms)) and `rev` ([Revision](#revision)). A Durable Object runs one request at a time and each write is
one SQLite transaction, so a snapshot never sees half of one; no lock. An ack is sent only after its transaction
committed (the output gate).

## Revision

`rev` is the record's epoch (`e1`, `e2`, …): it changes only when the record is rebuilt (a restore, or `node
scripts/record.ts rev`). A `snapshot` whose `rev` or `me` differs from the cache's makes the client drop the cache
(never the unsent queue) and fetch everything; the first read from the record after the sheet did the same once.
Locked weeks' earnings are memoised per `rev`. Nothing edits the record by hand (the sheet's tabs are a copy), so
there is no `onEdit` and no `resync` any more.

## Ingest

`gas/parse.ts`: newline-joined Text lists, one line per day, each optional: `dates` (Shortcuts' date text, English or
Japanese; only the day is used), `steps` (the iPhone's), `steps_watch` (the Apple Watch's), `exercise_minutes` (→ `exercise_min`), `calories` (→ `move_kcal`),
`stand_minutes` (→ `stand_min`), `weight` (kg; 0 = none), `body_fat_percentage` (→ `body_fat_pct`, %; 0 = none), `body_mass_index` (→ `bmi`;
0 = none), `lean_body_mass` (→ `lean_kg`, kg; 0 = none). Other fields are ignored. A list whose length differs from
`dates` is dropped with a warning; an unreadable line, an activity value above `METRIC_BOUNDS`, a weight
outside 20–300 kg or a body value outside `BODY_BOUNDS` (body fat 2–70 %, BMI 10–60, lean 10–150 kg) is skipped (out of
bounds: with a warning). A body with none of the fields is `bad_request` (audited as `error`); a Shortcut that doesn't
send the body lists yet is ingested as before.

**Body metrics** (`body_fat_percentage`, `body_mass_index`, `lean_body_mass`): aligned to `dates` like `weight`, stored with one decimal, latest
wins, never earn. Body fat may come as Shortcuts writes Health's percentage: a fraction (`0.223`) or a percent (`22.3`,
`22.3%`); a plausible body fat is ≥ 2 %, so a value ≤ 1 (without a `%`) is a fraction and is ×100. Lean body mass is in
kg like weight (no unit conversion: Health's mass unit must be kg).

**Steps:** Shortcuts' Find Health Samples sums every source, so the iPhone's and the Watch's steps would count twice
(Health de-duplicates them; Shortcuts doesn't). The Shortcut sends each device's list, filtered by Source, and a day's
steps are max(`steps`, `steps_watch`) (Health's merge counts one device at a time, so the max is close to its total;
a day unreadable in one list takes the other). Without `steps_watch`, `steps` is stored as sent. `steps_watch` is
validated like the other lists (Text, length = `dates`, ≤ 100,000).

**Latest wins:** Apple Health is the source of truth, so a row is appended whenever a value differs from the last row
for (person, date, metric), lower or higher (weight with one decimal); the same value is never appended twice. The
model reads a day's latest row ([design.md](design.md#health-data)); a locked week reads it as of its lock (Wednesday
04:00), so a later sync never moves locked earnings. The Shortcut posts to the record's `/api` with `"key"` and
`"action": "ingest"` (`docs/ops/shortcut-health-sync.md`).

## Client sync

`lib/sync/` (storage, transport, pairing, queue, cache) and `lib/store/` (the week store, actions, `live.ts`,
`view.ts`, and the demo backend, loaded only with `?demo`).

### Storage keys

`sync/storage.ts` registers every key: live `island.key`, `island.me`, `island.queue`, `island.acked`; the demo
`island-demo.*` (it can never touch a live key); per device `island.sound` and `island.locale` (the language last shown, so an English launch loads its strings before the first paint). If storage fails (full, private mode) the
data lives in memory for the session and a banner says so once. Pairing as a different person clears the cache, queue
and acked list. `sync/transport.ts` `post()` never throws (20 s timeout; network failure = `offline`; timeout,
non-2xx or non-JSON = `unavailable`).

### Snapshot cache

`sync/cache.ts`: `{me, rows, since, rev, rowsAt, skewMs, fetchedAt}` in IndexedDB (database `island`; in memory if
unavailable), as two records: `meta` (all but the rows, a few hundred bytes, written on every refresh) and `rows`
(written only when the row set changed, in the same transaction). An app before 2026-11-02 kept one `snapshot` record
(`v: 1`, rows inside, rewritten whole on every refresh: ~130 KB at two days of use); it is read once and moved to the
two on the next save, which deletes it, so the update never refetches. A refresh posts `snapshot` with `since`, merges (`model/snapshot.ts`: deduped by natural key, ordered by
`at`; an empty poll keeps the same rows object, so nothing re-reduces and no rows are written), records the server clock skew and saves in
order. Overlapping refreshes share one request; a `fresh` caller waits for one more after any in flight. A reply that
lands after pairing again is dropped.

### Compaction

On each merge `model/compact.ts` drops `metrics` rows of locked weeks the model can no longer read: per (person, date,
metric) it keeps the latest row at the lock and the latest overall; per person the newest row. Weight keeps the newest
row per day. Views are unchanged; ~90% of rows go. A `tally` replaced by a later one of the same person and day goes
too (the record no longer has it).

### Write queue

`sync/queue.ts`: events in `island.queue`, sent in order until acked. To the record, everything that may go now goes in
one `events` request (≤ 50, in queue order, the holds and subjects below kept), each answered by id; to Apps Script
(no record URL), one `event` at a time.

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

On launch (after painting from the cache), when the app becomes visible (≤ every 30 s), on a sync tap, on `online`,
and while the app is on screen whenever the relay says the record changed ([Push](#push)). Each refresh flushes the
queue, then fetches. **Not when current:** on launch and on becoming visible the phone waits up to 2 s for the relay's
`welcome`, whose `rec {at, rev}` is the record's last change the room heard of (kept across its restarts); when the
cache has it (same `rev`, `at` ≤ `since`) and was fetched within 15 minutes, it only flushes the queue. No welcome, no
socket or an older cache: it fetches. **After an ack:** the record answers each event with its stored row's `at`, and
that row goes into the cache at once (`since` unmoved, so the next poll still brings everything written after it); only
an ack without a row (a duplicate, or Apps Script's) is followed by a `fresh` re-read 1.5 s later.

<a id="the-record"></a>
## The record

The data of record moved from the sheet to the relay on 2026-11-02 (decisions: *The record on the relay*), in five
steps, each deployed and green before the next, the old path working through each (the phones update a day apart):
1. **mirror**: the script copied each write's rows here (a signed import), and the sheet's history was imported (`at`
   kept, high-fives and superseded cosmetic prefs left out); the model's numbers from both were the same
   ([runbook §13](ops/runbook.md#13-the-record) "History");
2. **reads**: the app's snapshot from `/api` (Apps Script was its fallback for a day);
3. **writes**: the queue's `events` to `/api`; Apps Script forwarded every keyed request it still got;
4. **Shortcuts**: their URL is `/api` ([shortcut §2](ops/shortcut-health-sync.md#a-shortcut-from-before-2026-11-02));
   the old one forwarded;
5. **export**: the sheet is rewritten from the record; the script's own record code went, and with no forwarded
   request since both phones moved (A 125 and B 95 straight to `/api`, 0 through Apps Script by 05:38Z), the forward
   and the script's external-request scope went too.

- **Where:** `relay/src/store.ts` (`StoreCore`, free of the Workers runtime), in its own SQLite-backed Durable Object,
  `IslandStore` (`idFromName('record')`, `storeObject.ts`), apart from the island room. Tables: `metrics` (`seq`, `at`,
  `person`, `date`, `metric`, `value` REAL, `late`; unique (person, date, metric, at), index on `at`), `events` (`seq`,
  `id` unique, `at`, `person`, `type`, `data`, `slot` unique, `late`; indexes on `at` and `type`), `ids` (every event id
  ever accepted), `uploads` (the ingest audit), `meta` (`last_at`, `rev`).
- **API:** `POST /api`, the web app's contract unchanged (`{key, action, ...}` as text/plain JSON; `ingest`, `event`,
  `snapshot`, `uploads`, `whoami`, keyless `health` → `{ok, build: 'relay-1'}`), every reply JSON with status 200 as
  Apps Script's; CORS for the allowed origins, none needed for a Shortcut. The Worker checks the origin, method and size
  only and hands the body to the object, which parses it, checks the key and answers (the Free plan gives a Worker ~10
  ms of CPU per request; the object far more). Rate limit 120 per key per minute.
- **Rules** (`app/src/lib/model/record.ts`): the shape checks the script had (`validEventData`); `at` =
  max(now, last + 1 ms), one per ingest, one per event; an event id once, forever (`ids`: a late retry of a replaced
  event is still a duplicate); **slots**, a later event of a slot replacing it (where the sheet deleted and appended): a
  tally and an island day per sender and day, a cosmetic pref (`locale`, `villagerName`, `villager`, `goalWeight`, `goalBodyFat`) per
  subject, a goal (`moveGoal`, `stepsGoal`) per subject and Tokyo day of its `at` (the goal in force on each past day
  stays: `moveGoalOn`), a decoration per scope and id (by `decorAccept` / `tentAccept`). A pref the model ignores takes
  no slot. A `highfive` (no longer an event type: high-fives go over the room) still queued on a phone from before is
  acknowledged and kept nowhere; an old row of one in a cache is ignored by the model.
- **Ingest:** `app/gas/parse.ts` (unchanged from the script's) and the audit row (`relay/src/audit.ts`); a day's latest
  row read from the (person, date, metric) key over the body's days. `relay/test/ingest-golden.test.ts` runs a week of
  both phones' Shortcut bodies (their real shapes: A's iPhone-only body with English dates, B's with the Watch's steps
  and Japanese dates; made-up values) and checks the record's replies, rows, `at`s and audit rows against what the
  script answered and wrote for them (`fixtures/ingest-golden.json`, recorded before the script's ingest was removed).
- **`since`:** answered from the `at` index; an empty poll reads one row (the revision). A row that arrived out of
  `at` order (an import's: while the script mirrored, two requests' copies could race) is marked `late` with its arrival time, and a
  poll also returns late rows that arrived after `since` − 10 s, so no phone misses one (the merge dedupes it).
- **Revision:** `rev` is an epoch (`e1`, `e2`, …), changed only when the record is rebuilt (`node scripts/record.ts
  rev`, after a restore). Nothing edits the record by hand.
- **Admin:** `POST /admin`, signed like `/notify` ([Push](#push) "Auth"), takes the record tool's ops (`{op}`: counts
  and who came which way, bookmarks, a restore, a new epoch, the export, a dump, and `load`: rows that already have
  their `at`, by the same rules, idempotent). During step 1 the same signed path took the script's copy of each write
  (sent as ASCII: a Shortcut's dates carry U+202F, and a copy with it failed the signature until it was escaped).
- **Export:** a cron (`*/15 * * * *` and `0 18 * * *`, `wrangler.toml`) asks the object to export: when `last_at` moved
  since the last export (or nightly, whatever changed) it POSTs every row to the `/exec` URL (`EXPORT_URL`; the test
  copy has none) as `{action: 'export', t, sig, data}`, `data` the rows as ASCII JSON text and `sig` its signature
  (Apps Script can't read request headers); the script checks it (10 minutes' window) and rewrites the tabs under its
  lock ([Tabs](#tabs)). 2026-11-02: 482 metrics, 267 events, 13 uploads in one call. Every event row goes as it is, so a new pref
  (`goalBodyFat`, 2026-11-02) is in the `events` tab with no change to the script. The relay keeps no Google
  credential.
- **Push-driven:** after a write the object tells the room (`changed`, [Push](#push)); the room keeps the last one
  (`rec {at, rev}`, in its storage) and hands it to each phone in its `welcome`, so a phone that has it needn't fetch
  on opening ([When it syncs](#when-it-syncs)).
- **Measured** (2026-11-02, curl from Tokyo): a full snapshot 0.09–0.18 s for 73 KB (the sheet's: 2.8–3 s for 131 KB;
  4–8 s at busy times), an empty poll 0.06 s (the sheet's: 2.1–2.2 s, once 14.5 s). An event write through Apps Script
  took two locked requests (the event and the 1.5 s re-read); to the record it is one `events` request, the row back
  in its reply.
- **Backups:** point-in-time recovery (30 days, on the Free plan) and `dump` / `load`: [runbook §13](ops/runbook.md#13-the-record).

## Live relay

Presence between the two phones while both have the app open (decisions: *Live relay on Cloudflare*). The room
carries intents, never data of record: the record ([The record](#the-record), its own object on the same Worker) still
catches an offline phone up.

- **Where:** `relay/` (its own package, outside the app's build): a Worker (`src/index.ts`) and one Durable Object,
  `IslandRoom` (`idFromName('island')`), SQLite-backed (`new_sqlite_classes`, the only kind the Free plan has).
  Production `wss://island-fund-relay.island-fund-relay.workers.dev/room`; a test copy, `island-fund-relay-test`, with
  its own secrets and room for the smoke test. `GET /health` → `{ok, v, versions, t}`; `POST /api` and `/admin`
  ([The record](#the-record)); `POST /notify` ([Push](#push)); `POST /push/*` ([Notifications](#notifications)).
- **Admission:** the Worker accepts `/room` upgrades only from `ALLOWED_ORIGINS` (`https://huangwaylon.github.io`) and
  `http://localhost|127.0.0.1`; everything else 403. The origin only keeps other sites out; the key is the auth.
- **Auth:** the first message is `hello {key, since?}`. The room compares it in constant time with the secrets
  `KEY_A`/`KEY_B`/`KEY_C` (unset = nobody gets in) and answers `welcome {me, peer, t, rec?, here?, gone?}` (`rec`: the record's
  last change; `here`, v3: everyone else who is here; `gone`, v3: when the room saw each person's last socket close,
  for those not here and my own last one, kept in its storage: the walk home, below), or
  closes 4001. No hello within 10 s (a DO alarm sweeps): 4003. A second socket of the same person replaces the first
  (4002, no presence flicker). At most 8 sockets.
- **Protocol** (`app/src/lib/sync/live-protocol.ts`, imported by both sides and checked by the same parsers): JSON,
  `v: 3` (v2, the rolling-log world, with the guest: `who` may be `G`, the welcome's `here`, a high-five's `to`; the
  relay still speaks `v: 2` and `v: 1` to an older phone, answering each socket in the version of its hello, and a phone
  before v3 never hears of the guest; a walk crosses between v2 and v3, never from v1), ≤ 256 bytes (an intent ~60–100; a `replay` ≤ 16,000). Intents: `walk {to: node id | [x, z], at?,
  from?, via?, s?, ms?, f?}` (v2: world units, where the villager is going, and with `from`, `via` (≤ 10 waypoints), `s`
  (when it set off, the relay's clock), `ms` (how long, ≤ 60 s; 0 = put there) and `f` (the facing at its end: `home`,
  `in`, `l`, `r`) the very walk, [Shared
  world](#shared-world) "Villagers"; integers within the plan `WORLD_X` −230…620 × `WORLD_Z` −400…2500, equal to
  `island/world.ts` PLAN; v1: stage units, |n| ≤ 100,000; a walk never crosses versions), `act {act, id?, at?, pt?}`,
  `catch {what, id?, at?, how?}`, `emote {emote}`, `world {op, id}` (`weed-pulled`, `fruit-collected`, `dug`,
  `present-opened`, `watered`, `shaken`, `wished`, `woke`), `saved {}` ([Push](#push)), `decor {id, at, item, x, z, f, p} | {id, at, rm}` (v2: a decoration set or removed, as the record's `decor` op, the tent's with `sc: 't'`; kept for the day and replayed, never claimed: the merge is commutative), `drag {id, x, z, f, it?, end?}` (v2: a tent piece under the finger, ~10 a second while it moves, ≤ 60 bytes; presence only: relayed while the partner is there, never kept, replayed or written), `tent {in, to?, from?, via?, s?, ms?}` (v2: my villager in the tent, its walk there in the room's model units; presence only) `highfive {at}` (v2: a high-five, `at` the tap on the relay's clock, numbered; relayed live, and with the partner away the room holds the last one for them in its storage (`held`, one per recipient, a newer one replacing it), sends it after the welcome of their next v2 hello, and lets it go at their `got {at}` or after a day; never the record; see [decisions](decisions.md#a-high-five-goes-over-the-relay-only-2026-11-02)) and `say {text}` (v2: a phrase over my villager, [Villager taps](design.md#villager-taps); presence only: relayed live to a v2 partner, never kept, replayed or sent to the record; `text` cleaned on both sides by `cleanSay`: NFC, no control, newline or bidi characters, blanks squeezed, trimmed, ≤ 20 code points, else dropped; the room passes one per person per second, the phone one per 1.5 s); the shared world's (v2 only, [Shared
  world](#shared-world)): `pick {id, what, at?}`, `put {id, what, at}`, `shake {tree, drop}`. Relay-only: `changed {what, who, at, rev}`. The room drops any client-sent `who`/`t`, stamps its own (`t` strictly increasing) and sends it
  to the other person only. Any intent may carry `c`, the phone's sequence number (increasing through the day: its
  `Date.now()` at sending, or one more): the room answers the sender `ack {c, t, ok}` (`t` its stamp; `ok` false when
  the world refused it: a claim already made, a nest too soon, a walk numbered before the one it keeps), and a resend
  of a kept intent with the same `c` (after a reconnect) is acked again, never relayed or kept twice. It relays to
  the partner before it writes the day to storage (a message sent after a write waits for it: the output gate), so a
  kept intent reaches the partner as fast as a passing one; its ack goes after the write (an ack is durable).
  `ping {c}` → `pong {c, t}`; `got {at}` (v2: my phone heard the partner's high-five `at`: the one held for me goes); `presence {who, on}` when the partner comes or goes (the island
  stands Wilbur on the dock while it's on). A `v` the relay doesn't know closes 4004, before or after the hello, with
  the reason `protocol version N unsupported (relay speaks 1, 2)`, and so does a message (or a second hello) in
  another version than the socket's hello; the client waits for the next show, i.e. a reload. `GET /health` lists
  `versions`. Deploy order for a version bump: the relay first (it speaks both), then the app. Dropping v1 once both
  phones run the world: take 1 out of `LIVE_VS` and redeploy (a phone still on v1 is closed 4004, reloads, updates).
- **Limits:** per socket a token bucket of 20, refilled 20/s; beyond it messages are dropped, not queued.
- **Replay:** the room keeps today's shared world in DO storage ([Shared world](#shared-world)); a hello with `since`
  (the last such `t` that phone heard, kept across reloads: `island.liveSince`) gets the newer ones after the welcome:
  with `batch: true` (today's app) all of them, mine too (a phone that lost its record gets it back), in `replay {es}`
  messages of ≤ 16,000 bytes (~150 changes each) in the room's order; without it (an older app) one message each, the
  partner's only.
- **Cost:** the Hibernation API (`ctx.acceptWebSocket`): an idle socket keeps no DO in memory. Free plan: 100k
  requests/day (incoming WebSocket messages count 20:1), 13,000 GB-s/day; two people tapping are far below.
- **Client** (`app/src/lib/sync/live.ts`, `createLive({key})`): connects while the page is visible and online, closes
  on hide or offline (no socket, no timers), reconnects after a drop with backoff (1 s doubling to 60 s, ±25 %); after
  4001/4002/4004 it waits until the page is shown again. Clock: pings at welcome, +2 s, then every 60 s; the offset is
  the shortest round trip's of the last 8 (`serverNow()`). `send(intent)` is a no-op returning false unless welcomed
  and, for what the room doesn't keep, the partner is present; it never throws or blocks. `on()` delivers the partner's intents,
  `onStatus()` `{connected, me, peer}`. URL: `LIVE_URL`, overridable by `VITE_LIVE_URL` (empty = off). What the room
  keeps (`isStored`: the shared world's intents and walks) goes even with the partner away, numbered (`c`), and waits
  in an outbox (≤ 120, a walk replacing the walk before it) until its `ack`: sent offline or lost with a dropped
  socket, it goes again after the next welcome (12 at once, then one every 60 ms; another day's dropped). The hello
  asks for the day as `replay` (`batch`), each change delivered in order, mine too. `metrics()`: messages and bytes
  each way, resends, the last acks' round trips, what's waiting.
- **Measured** (`npm run smoke` from a Mac in Tokyo, edge NRT): connect ~65 ms, ping RTT median 18–21 ms (p90 23–40),
  partner one-way median 19 ms (p90 44), clock offset ±9 ms. `npm run latency` (2026-11-01, the test copy, both
  clients on one Mac, n = 30 each): a passing `act` one way median 21–23 ms (p90 26–40); the kept ones (walk, catch,
  pick, put, watered) were median 31–35 ms (p90 36–45) while the room wrote before relaying, and are 21–22 ms (p90
  25–35) relaying first; their ack median 31–33 ms. A late join of the day (169–352 changes): one message each, the
  last 134 ms after the hello (169 messages, 17 KB) → 3 `replay` messages, the last 29 ms after it (36 KB).
- **Tests:** `relay/test/` (keys, origins, the bucket, the room: auth, relay to the other person only, stamping, rate
  limit, replay and ring trimming, replacement, presence, hello timeout, the socket cap, the nudge and `changed`; the
  notify secret, signatures and window) with `cd relay && npm test`
  (also `.github/workflows/relay.yml`); `live-protocol.test.ts`, `live.test.ts` and `store/push.test.ts` in the app's vitest; the push's
  script side in `gas/main.test.ts`.

## The guest

A third person, a visitor rather than a member (docs/design.md "The guest", decisions: *A guest, not a third member*):
one key, `KEY_C` (a Worker secret like the others; unset = no guest), role `guest`, who `G`. The economy, the trees,
the ベル, きろく, けんこう and ふたりでぜんぶ stay strictly A + B; what the guest touches is generalised: presence, the
claims, the ずかん, the tent's decor, pairing.

- **What it sees** (the record, `contract/guest.ts guestRows`, applied to every `snapshot` and delta of the guest's key):
  the members' activity (`steps`, `exercise_min`, `move_kcal`, `stand_min`), every event but the からだ goals (`pref
  goalWeight`, `goalBodyFat`): the goals and their history, the buys and voids (the jar, view-only), the harvests, the finds, tallies,
  decorations, island days and cosmetic prefs. Never a からだ row: `weight`, `body_fat_pct`, `bmi`, `lean_kg`.
- **What it writes** (`guestMayWrite`): `find` and `tally` (credited to `G`), the tent's `decor` (`sc: 't'`), its own home's room and look (`sc` `v`, `h` with `hG`; never the outdoors), its own
  `pref` `locale` / `villagerName` / `villager`. Anything else, and `ingest` / `uploads`, is `forbidden` (the queue drops
  it). Its rows are the record's like anyone's: one tally per day (`tally|G|<date>`), its prefs' own slots, the tent's
  merge order A < B < G; the sheet's export carries them with `person = G`.
- **The room** (v3 only: a guest's hello in v1/v2 is closed 4004): the guest may `walk`, `act`, `catch`, `pick`, `put`,
  `shake`, `say`, `highfive`, `tent`, `drag` and the tent's `decor` (`guestMaySend`); anything else is refused (acked
  `ok: false`, never relayed). Its intents reach both members' v3 phones; theirs reach it. Presence is per person: each
  join and leave is told to everyone else who can hear of it; `peer` stays the partner for a member (the guest never
  counts) and either member for the guest. A high-five names whom it is for (`to`; a member's to the partner may leave
  it out), and the room holds the last one per (sender, recipient) pair for a recipient who is away (`Held`, `<from>><to>`).
- **Push:** none: `/push/*` answers the guest's key 403, so it neither subscribes nor reports a goal, and the members'
  `changed` notices reach it like anyone's (its own writes only to v3 phones).
- **The phones** ([design](design.md#the-guest)): a member's draws the guest's villager while it's `here`, as a third
  villager actor (`ui-state/cast.ts`: `mine`, `partner`, `third`; on the guest's phone `third` is B); the guest's
  phone guards what it sends by the same rules (`week.send` by `guestMayWrite`, the socket by `guestMaySend`), so
  nothing it may not do is queued or shown.
- **Tests:** `relay/test/guest.test.ts` (the snapshot and deltas never carry a からだ row or a からだ goal and do carry
  the activity; every forbidden write is refused and leaves nothing; the export has `G`'s rows; the room's three
  villagers, the refusals, the high-fives' pairs); `model/guest.test.ts` (credit, first finds, counts, the view);
  `e2e/guest.spec.ts` (the guest's phone shows no からだ and none of a member's controls; its catch in a member's ずかん
  credited to it; its tent piece in both members' tents; its villager on both islands only while open, still when
  idle); `npm run smoke` (the test copy's guest key, when `.smoke-keys` has `KEY_C`).

## Ambient life

What the island does on its own (a villager's outing or small move, the visitor's beat, a fish, bubbles or a bug
coming by) is decided per 10-second slot of the Tokyo day from the date, the slot and the shared world, so both phones
show the same island without a message (decisions: *Ambient life from the clock*). `app/src/lib/components/island/ambient.ts`
(pure, tests `ambient.test.ts`); idle life and the critters play it.

- **Clock:** `slotAt(ms, offset)` → `{date, slot, into, hour, month}`, 8,640 slots a day on whole 10 s of the epoch.
  `ms` is the island's clock (`clock.ts now()`, so a `?date=` preview moves the slots); `offset` the relay's clock minus
  the device's from the shared socket's pings (`ambientClock.ts relayOffset`: `liveRelay().serverNow() − Date.now()`,
  0 before any welcome: alone, nobody has to agree). A slot is played `DECIDE_MS` (500 ms) after it starts, by when an
  intent sent before the start has reached the partner; walks start then, small moves at their `at` within the slot.
- **Randomness:** `slotRand(date, slot, kind)` = `dayRand(date, "ambient:<kind>:<slot>")` (the island seed's mulberry32),
  kinds `villager`, `visitor`, `host`, `critter:<channel>`; species from `spawnRand(spawn)` with the existing pickers
  (`pickFish`, `pickFresh`, `pickDive`, `pickBug`), so the lazy tables stay out. Engine-proof: integer world points,
  squared distances, plain string order.
- **Villagers** (`villagerBeats(world, date, slot)`): the world is each person's villager (`at`, `home`, `free`:
  awake, standing, not busy; `lastIntent`: when its person last steered it, `avatar.ts steered`: my taps here, the
  partner's walks over the relay), the points of interest (`wander.ts pois`), the phase and both day scores. Beats are
  keyed by person (idle life maps them to mine and partner): one a slot, an idle move from `IDLE_POOL` (its hours,
  day-only moves, `every` gaps against the recent slots' rolls), an outing of 1–3 stops within 600u with lingers (30 %
  of slots, one villager out at a time, from home; `avatar.ts outing`), a chat or a dance for two free villagers
  (dancing only with both scores ≥ 70), or the night's doze. A villager whose person has the island open (`present`:
  mine always, the partner's by the relay's presence) makes small moves but no outings, and one is left alone 12 slots
  (2 min) after its person's last walk (`held`).
- **Visitor:** `Visitor.svelte beat(r)` runs `visitorLife.ts pickAct`, `pickEmote` and `strollSpots` on the slot's
  `visitor` PRNG; a phone whose visitor is speaking skips it.
- **Critters** (`spawnsIn(date, slot)`, `crittersAt(date, slot)`): per channel (the sea: a shadow or bubbles,
  `BUBBLE_SHARE`; fresh water; bugs) a slot brings one with odds 0.6 / 0.6 / 0.5 when the last one's stay is over, at
  `at` ms into the slot, staying 4–5 slots (bubbles 3, a bug 2); the stays are chained per 10-minute block from the date
  and slot alone, ending within it, so a phone opening mid-stay finds the ones still there. Where each is comes from its
  seed too (`critterPath.ts`: the fresh water, its swim patch or the bug's spot, and its itinerary, each move at a time
  after it came, `legAt` for a phone joining mid-stay), never from a camera; `Critters.svelte` places it there and
  each phone shows it when its camera sees that spot. Its id is `<kind>:<slot>` ([Shared world](#shared-world)).
- **Agreement and its limits:** the same inputs give the same slot (tested with shuffled inputs and skewed clocks).
  The phones differ where their inputs do: a clock offset off by more than the 500 ms margin, a walk sent within
  ~20 ms of a boundary, a local skip (a sheet, a reaction playing, the 3-minute slow-down), and the camera (each phone
  shows what its view holds of the same world). What a person does by hand plays on their phone as it always did (a
  cast's bite plan and its hesitation, a dive's chase, a tarantula rearing, a line read, a balloon, a shooting star);
  its outcome is shared ([Shared world](#shared-world)).

## Shared world

Both phones show the same island (decisions: *A shared world: the seed for what comes, the relay for what we do*).
What comes by itself is a function of the date, the slot and world coordinates ([Ambient life](#ambient-life)); what
a person does is a small intent over the relay, kept by the room for the day, folded by both phones into the same day.

- **The day** (`sync/world-day.ts`, pure, tests `world-day.test.ts`): a `WorldDay` folded from the day's intents in
  the relay's order: claims (`catch:<id>`, `pick:<id>`: who got it, what, how, where), puts, the shakes in order,
  watered cells, wishes, each person's last walk. First wins, and the relay's order makes it so: a partner's claim of
  something I claimed too means the relay heard theirs first (it drops a later claim, never relaying or keeping it),
  so theirs replaces mine (`beat`) and my phone shows it caught by them. A repeat changes nothing; another day's is
  ignored.
- **The store** (`store/world.svelte.ts`, `world`): today's day on this phone, kept in localStorage (`island.world`,
  the day's events; the demo's per tab) so a reload needs only what's new; `share(intent)` folds my change (refused
  when the partner already has it), keeps it and sends it; `on(fn)` the partner's, `live` when it happened in the last
  12 s (the island plays it: their villager turns to it and it plays at the target), else (heard on opening) it
  only changes the island. My change goes to the relay first, at once (never behind the record's 2-minute hold), then
  is folded and kept; my own heard back in the relay's replay is folded quietly. The day's record is written once per
  burst (a microtask after the last change: a replay of 300 changes is one write, not 300). Attached to the phone's
  one socket when the backend starts (`store/live.ts`), so the
  partner's changes are heard on any tab of the app.
- **The room** (`relay/src/room.ts`): keeps today's world (Tokyo's day on the relay clock, a new day starts empty): the
  last 400 changes (`world`, `catch` with an id, `pick`, `put`, `shake`) and each person's last v2 `walk` (replacing
  the one before), in DO storage, its claims and nests rebuilt after a hibernation. It refuses a claim it already
  holds today and a second nest from a tree within the hour (`NEST_GAP_MS`). A hello's `since` replays the partner's
  after it; a page's first hello asks from Tokyo midnight (or the kept `since`), so a phone opening later hears the
  day.
- **The demo** (`sync/live-local.ts`): the demo's two players are two tabs of one browser (`?demo`, `?demo&as=B`);
  a BroadcastChannel carries the intents and the sending tab plays the room's rules on a log in localStorage
  (`island-demo.relay`), so the e2e's two-player tests (`e2e/shared-world.spec.ts`) run on it without a network.
- **The record's day row** (`island` event, [Events](#events); `store/actions.ts sendIslandDay`): my part of the day
  (`rowOf`: what I took, put down, shook, watered and wished, where my villager stands), sent whole when it grows,
  held 2 minutes (a busy stretch is one request), one row per person and day in the record (the older one replaced, as
  a tally's). The model keeps each person's latest (`state.islandDays`); the store folds today's (what the relay
  didn't bring: both apps closed past the relay's day, an outage), yesterday's watering (today's hybrids grow from both
  people's) and the wishes for the mornings to come (`applyRow`; a claim known from a row becomes news when the
  relay's own arrives, so the partner's animation still plays). A shake carries `at`, the shaker's own time, its
  identity on both phones and in the row.
- **Villagers** (`island/villagerSync.ts`, `motion/director.svelte.ts` `onOwnMove` / `setRemote`): each person's
  phone moves their own villager and is the one that does. Every walk and put of mine (a tap-walk, a walk home, a
  stop under a sheet or by a reaction, back home after 30 s away; a burst within one task is one message) goes as the
  very walk: `walk {to, from, via, s, ms, f}`, `s` on the relay's clock. The partner's phone plays it from the same
  start at the same time: on time it walks the way; late (a slow message, a phone opening mid-walk) it starts where
  the walk is by now (`along`) and arrives when it does there; a gap ≤ 160u from where their villager stands here is
  walked off within the walk's own time, a bigger one (or the scene hidden) is a jump; a walk already over is a
  brisk catch-up within 120u (≤ 600 ms), else a put at its end, facing `f`. While the partner has the island open
  (presence), their villager is the relay's to move here: this phone's own life (a follow, an outing, a walk home, a
  meeting with the visitor, a put under a sheet) leaves it alone, and a reaction here doesn't stop its walk. On a
  partner's arrival my villager's current walk goes again (they find it where mine is), and a walk under way is
  said again every 5 s while they're here (a phone that missed its start finds it on its way). Idle motions and the
  ambient beats stay clock-seeded (ambient.ts); an action plays in place on both phones (no walk-then-act). A member's
  phone gone 3 min (`HOME_AFTER_MS`, from the presence's `t` or the welcome's `gone`): their villager walks home from
  its last walk's end by the nav at 90 u/s, set off at leave + 3 min, on every phone the same (`homeWay`/`homeAt`;
  the relay's to move till it's home); their own phone, back, takes it from where that walk has it and tells nothing
  of its villager until its welcome is in ([decisions](decisions.md#a-villager-whose-phone-is-gone-walks-home-by-the-relays-clock-2026-11-02)).
- **Sleep:** the villagers doze 22:00–05:00 on the relay's clock (`islandLife`: put to sleep or woken at the hour it
  turns, the same moment on both phones; no longer re-checked each minute, which put a woken villager back to sleep
  early). A wake here (a tap on mine, a high-five wakes both) is `act {act: wake, id: <whose>, at}` (the relay's
  clock): the other phone wakes the same villager for what's left of its 10 s (`villagerSync.ts playWake`), so both
  doze off again at the same moment (and stay up past 05:00). Gulliver woken (the fifth nudge) is `world {op: woke,
  id: gulliver}`, kept in the day (`WorldDay.woke`): up on both phones, and for a phone opening later.
- **What's shared:** the critters: each where its seed puts it ([Ambient life](#ambient-life)), and its catch or
  escape by its id (`catch {what, id: <kind>:<slot>, at, how}`: `rod`, `net`, `dive`, `dig`, or `flee`, claimed at the
  tap so the relay's first wins; my cast as an `act` so my villager walks down with the rod on the other phone too), a
  bug out of a bush, from under the rock or off a villager as a `put` (`bug:<id>:<bush|rock|flea>`, its itinerary
  from its id); where each villager stands (the last walk: a phone opening later puts the partner's villager
  there; mine stays where I sent it for the day), the partner's tap ring, and every tree's shakes: the outcome
  (`shake {tree, drop}`), what it left lying (a branch `br:<tree>:<k>`, coconuts `co:<tree>:0|1`, named from the
  day's shakes so both phones agree), a dangling bug (`dg:<tree>:<k>`) and the nest's wasps (`ws:<tree>:<k>`) as
  critters to catch, the nest rule; the day's things on the ground (shells, fragments, the bottle, dig spots and the
  next one, mushrooms, weeds, fallen goal fruit `fr:<person>:<fruit>`, branches, coconuts: `pick {id, what, at}`), a
  balloon's present (`put` where it lands; its contents in the opener's `pick`), watered flowers (`world watered`, by
  the flower's id), wishes (`world wished`, by the morning), a bush shaken and the rock struck (`act` with `pt`, played by the
  partner's villager).
- **The decorations** (`store/decor.svelte.ts`, [Decorating](design.md#decorating)): not the day's, kept for good. Each
  change is one `decor` op, sent to the relay at once (kept in the day's ring, replayed to a phone opening later that
  day) and to the record's queue (the record across days: each item's latest op); the store merges whatever arrives,
  from wherever, by id (`contract/decor.ts`), and keeps the merged map in localStorage (`island.decor`) so a reload
  shows the layout before the record answers. My op's `at` is the relay's clock and always after the op it replaces
  (a phone whose clock is behind still moves what it saw).
- **Still each phone's own:** the camera (each shows what its view holds of the same world), a balloon's flight and
  where this phone's lands (its present is shared once down), shooting stars and the night's showers' timing, the
  visitor's lines and a tap on them, a cast's bite plan and hesitation, a dive's chase, a tarantula rearing, the plates
  and lines read, a startup beat, sounds. These are what one person does or watches by hand, or decoration timed per
  screen; their outcomes (a catch, a find) are shared.
- **Budget** (Free plan): an intent is ≤ 100 bytes sent (tested), ≤ 140 relayed. A busy day of two people (~300
  walks, ~200 catches and pick-ups, ~50 shakes) is ~550 incoming messages: ~28 DO requests (20:1), ~550 storage writes
  (of 100,000 rows/day), and a replay on each open (outgoing messages are free). Nothing per frame. With every villager
  move told (2026-11-01): a walk ~100–200 bytes, one per move (a tap-walk, a walk home, a stop; a burst within one
  task is one message), said again every 5 s while one is under way and the partner is here, one more on each join
  and reconnect; a wake ~70 bytes. A busy hour together (~120 moves, ~60 resays, ~40 world changes, pings) is ~250
  incoming messages, ~13 DO requests; a day of it ~2,000 messages, ~100 DO requests and ~1,500 storage writes: under
  1 % of the 100k requests, 1.5 % of the writes. The acks, presence and replays go out (free). Per frame: none (the
  director moves the feet by the clock; a message only at a walk's start).
- **Checked** (`e2e/sync-harness.spec.ts`): two players run a scripted session (four tap-walks, a pick-up, a catch,
  a present put down and picked up, a watered flower, a shake, a wish, two decorations placed, one moved by the other
  phone and one put away, both moving one at once, both grabbing one thing at once), then both phones (and a third
  opening later) must have the same canonical day (`world-day.ts canonical`, `hash`), the same decorations (each
  item's id, kind, spot and facing) and each villager at the same point, awake or asleep alike. On the demo's two tabs in CI; against the test relay with
  `RELAY_E2E=1 … --workers=1` (2026-11-02 00:10, from Tokyo, n = 3 runs): tap → the partner's villager sets off on the
  other phone median 34–40 ms (max 56), a pick-up / catch / put / watering / shake there 15–28 ms, a phone opening
  later has the same island 364–391 ms after its navigation starts (the page's load included); acks 29–38 ms; nothing
  resent. A decoration's change there median 21 ms (max 23; 2026-11-02, n = 4), the phone opening later with the same
  layout from the relay's replay alone (its own storage). The simulated room (`world-day.test.ts`, the real `RoomCore`) runs a 40-change session with conflicts, a
  dropped socket and its resends, and a late batched join: the same hash on every phone.

## Push

While the app is on screen, a change to the record reaches the other phone in well under a second instead of at its
next open (decisions: *Push through the relay*). Additive: the polling in [When it syncs](#when-it-syncs) still catches
up a phone that missed it.

- **Record → room:** after a write that added `metrics` or `events` rows (an `ingest` with a changed value, a new
  event; never a duplicate, a refusal or a read), the record calls the room (an RPC between the two objects, after its
  commit) with `{what: 'ingest'|'event', who, at, rev}` (`at` = the newest row's, `rev` the record's). `POST /notify`
  (signed, below) still takes the same notice from a server.
- **Auth:** the notify secret is HMAC-SHA256(key `"<KEY_A>:<KEY_B>"` trimmed and lower-cased,
  `island-relay-notify/1`), derived by both servers from the person keys they already hold; a phone holds only its own
  key, so it can't sign. Nothing to provision; rotating a key rotates it (the relay's and Script Properties' keys must
  match, runbook §4). The same secret signs `/admin` and the export. Each POST carries `X-Island-Time` (ms) and `X-Island-Sig` = HMAC-SHA256(key secret,
  `"<time>.<body>"`), hex; the relay refuses a signature more than 5 minutes off (401), a body over 256 bytes (413) or
  a bad notice (400), and answers 204 with `X-Island-Heard: <sockets>` (`relay/src/notify.ts`). The secret never
  travels and no key is in a URL or a log.
- **Relay → phones:** the room sends `changed {what, who, at, rev, t}` to every authenticated socket, the writer's
  too (a Shortcut upload reaches its own phone). Nothing is stored.
- **The nudge:** after the queue gets an ack, the phone sends `saved {}` over its socket; the room relays it to the
  partner like any intent (only when they are there). It stops (sent and heeded) once a `changed` has reached the
  phone this session (with the record, at once).
- **Client** (`store/live.ts`, the one socket `sync/live.ts liveRelay()`, opened when the backend starts and
  reconnected on pairing): `onChange` → one `refresh({fresh: true})` 300 ms later (changes arriving together make one),
  skipped when the cache already has it (same `rev`, `at` ≤ `since`) and for my own `event` (its row came back in
  the ack). The CSP's `connect-src` allows the relay's `wss://` origin.
- **Cost** (Free plan, measured by `npm run smoke`): one notify = 1 Worker request + 1 DO request; a nudge = 1/20 of a
  DO request. Budget for two phones: [Request budget](#request-budget).
- **Measured** (from a Mac in Tokyo, test relay): notify POST → `changed` on both phones median 53–70 ms (max 92);
  the nudge one way median 19 ms. Apps Script's own `health` (no sheet) takes ~1 s, the relay's ~20–50 ms.

### Request budget

Free plan limits (developers.cloudflare.com, 2026-11): Workers 100,000 requests/day; Durable Objects 100,000
requests/day (a WebSocket connect is one, incoming messages count 20:1, outgoing free), 13,000 GB-s/day of duration
(an idle hibernatable object is not billed), 5 M rows read and 100,000 rows written/day, 5 GB storage; KV 1,000
writes/day (unused). A generous day for two phones:

| Source | Count/day | Worker req | DO req | DO GB-s | Rows read | Rows written |
|---|---|---|---|---|---|---|
| Sockets (each show of the app) | 2 × 60 | 120 | 120 | ~150 (10 s awake each, 128 MB) | | |
| Pings (every 60 s while shown, 2 × 2 h) | 240 | 0 | 12 | ~300 | | |
| Intents kept for the day (the room's ring), nudges | ~2,000 | 0 | 100 | ~100 | | ~2,000 |
| Record reads: snapshots (opens not current, pushes, taps; ~5 rows each, a full one ~750) | ~300 | 300 | 300 | ~30 | ~3,000 | |
| Record writes: `events` batches (~100 events) and their notice to the room | ~100 | 100 | 200 | ~10 | ~1,000 (ids, slots, decor) | ~1,000 (a row, its id, its indexes, `last_at`) |
| Shortcut ingests (2 phones, ~24 runs each; ~300 rows read for 32 days) | ~50 | 50 | 100 | ~5 | ~15,000 | ~1,500 |
| The export (cron every 15 min; a dump when changed, ≤ 96, waiting ~3–8 s on Apps Script) | 97 | 97 | 97 | ~100 | ~75,000 | ~100 |
| Goal reports and subscriptions ([Notifications](#notifications)) | ~3 | 3 | 3 | ~1 | | |
| **Total** (Free plan limit) | | **~670 (0.7 % of 100,000)** | **~930 (0.9 % of 100,000)** | **~700 (5 % of 13,000)** | **~95,000 (1.9 % of 5 M)** | **~4,600 (4.6 % of 100,000)** |

Measured 2026-11-01 (a UTC day, test traffic included, before the record): Worker 1.8k requests, DO 9.9k (the
smoke and latency runs), 3.7k rows written, 346 rows read, ~25 GB-s. Duration stays the binding limit and under a
tenth of it even with the island's presence ten times busier; the export is the largest reader (a dump each time) and
could send only the changed rows if it ever mattered. Storage: ~150 bytes a row, ~1 MB a year against 5 GB. Apps
Script's side: ≤ 96 exports a day (web app requests, no trigger time, no UrlFetch).

## Notifications

One Web Push, opt-in per phone: when a person's day reaches all four goals, the partner's phones whose せってい →
**つうち** switch is on get 「うめが きょうの もくひょうを 4つ ぜんぶ たっせい！」 (「ふたりで ぜんぶ たっせい！ ウェイも 4つ
クリアしたよ」 when the partner had already met everything; English if that phone's app is in English). At most one a
day per person, never 22:00–08:00 Tokyo (decisions: *One notification: the partner met every goal*).

- **Trigger** (`app/src/lib/sync/push.ts pushTick`, from the week store's every recompute, never in the demo): when my
  own view shows all four of today's goals met and `island.goalSent` doesn't already hold `{me, date: today}`, the
  phone POSTs `/push/goal {key, date, both, name}` (`both`: the partner's four were met too; `name`: my villager name
  as the island shows it). Done for the day on any answer but `failed` (or a network error, retried ≥ 10 min later).
  It is reported whatever my own switch says: the receiver's switch decides. **Limitation:** goals are computed on the
  phone, so the achiever's app has to open after the Shortcut's sync (which runs when an *everyday* app opens, not
  ours). Until it does, nothing is sent; when the partner opens their app first, the island already shows the fruit
  and the flowers, so no push is needed there.
- **Relay** (`relay/src/pushRoute.ts`, `push.ts`; HTTP, not the socket: a subscription is longer than its 256 bytes
  and the trigger can come before the socket's welcome): POST `/push/subscribe {key, sub, lang}`,
  `/push/unsubscribe {key, endpoint}`, `/push/goal {key, date, both, name}`, each a `text/plain` JSON body ≤ 2 KB with
  the person key (a simple request: no preflight, no key in a URL or header) from an allowed origin (403 otherwise),
  checked by the shared parsers (`app/src/lib/sync/push-protocol.ts`, 400), the key in constant time (401). CORS:
  `Access-Control-Allow-Origin` = the page's origin. Endpoints must be https on a known push service (Apple, FCM,
  Mozilla, WNS), so the relay never POSTs elsewhere.
- **Goal:** the room answers `{ok, outcome, sent}`: `stale` (the date isn't today in Tokyo), `dup` (already done
  today), `quiet` (22:00–08:00: skipped, not queued, and the day is spent), `none` (the partner has no subscription),
  `sent` (`sent` pushes accepted), `failed` (no push service took it: the day isn't spent, a later report retries).
- **Storage** (the room's SQLite): `push_subs (endpoint PK, who, p256dh, auth, lang, at)`, at most 4 per person (the
  oldest goes), an endpoint re-subscribed moves to whoever sent it; `push_sent (who PK, date)`. A push service's 404
  or 410 deletes that subscription.
- **Sending** (`relay/src/webpush.ts`, WebCrypto only): the message `{v: 1, kind: 'goal'|'both', name, date, lang}` is
  encrypted per RFC 8291 (aes128gcm, one record, a fresh ECDH key and salt per message; test: the RFC's Appendix A
  vector byte for byte) and authorised per RFC 8292 (`Authorization: vapid t=<ES256 JWT: aud = the endpoint's origin,
  exp 12 h, sub = the app's URL>, k=<public key>`), `TTL: 7200`, `Urgency: normal`.
- **Keys:** the VAPID key pair; the public half is `VAPID_PUBLIC` in `relay/wrangler.toml` and `PUSH_PUBLIC_KEY` in
  `push.ts` (they must match), the private scalar the secret `VAPID_PRIVATE` (production and test). Rotation:
  [runbook §12](ops/runbook.md#12-notifications-vapid).
- **The switch** (`components/panel/NotifySection.svelte`, `island.push` = `{on, endpoint, lang, at}`): off by default.
  A tap asks `Notification.requestPermission()` first (iOS grants the prompt only to a gesture), then
  `pushManager.subscribe({userVisibleOnly, applicationServerKey})` (a subscription for an older VAPID key is dropped
  first) and `/push/subscribe`; it shows on only once the relay took it. Off: forgotten at once, then `/push/unsubscribe`
  and `unsubscribe()`. At launch a phone that is on hands its subscription over again if the endpoint or the language
  changed or it is a week old, and turns itself off if the permission was revoked. Where it can't work a line says
  why: an iPhone's Safari tab (Web Push needs the Home Screen app, iOS 16.4+), an unsupported browser, notifications
  off in the phone's settings, no pairing (the demo). The CSP's `connect-src` allows the relay's https origin.
- **Service worker:** `push` → `showNotification` (title しまの貯金箱 / Island Fund, the body, the app icon, tag
  `island-goal-<date>` so a repeat replaces it; an unreadable push still shows a generic line, since Safari drops
  subscriptions that push silently); `notificationclick` → focus an open window of the app, else open it.
- **Cost:** at most two goal reports and two pushes a day, a subscribe per phone per week: a handful of Worker and
  DO requests against 100,000 a day; push services are free.
- **Tests:** `relay/test/webpush.test.ts` (the RFC 8291 vector, a round trip, VAPID's JWT verified with the public key),
  `relay/test/push.test.ts` (once a day per person, quiet hours, stale dates, the partner only, each phone's
  language, 404/410 cleanup, failed retries, the subscription cap, the endpoints' origin, key, size and shape checks);
  `push.test.ts`, `push-protocol.test.ts`, `service-worker/notify.test.ts` in the app's vitest; `e2e/notify.spec.ts`
  (the switch with the permission, the subscription and the relay mocked); `npm run smoke` (the endpoints' refusals).
  Checked end to end once (2026-11-01) in Chrome against the test relay: the built service worker subscribed through
  FCM, `/push/goal` answered `sent`, the notification showed with its words and tag, and a second report was `dup`.

## Service worker

`app/src/service-worker/` (pure rules in `caches.ts`).

- **Install:** precaches built JS/CSS and static files except fonts, audio, the art manifest, the app icons, villager art
  beyond the two defaults and the critters', finds' and presents' art (all cached on first use). Non-hashed files and the shell are fetched with `cache: 'reload'` (past Pages' 10-minute HTTP
  cache).
- **Activate:** keeps the current shell (`island-shell-<version>`), the previous one (an old page loads its lazy chunks
  from it) and the runtime caches; deletes the rest.
- **Navigations:** network first; the cached shell offline or after 3 s. A response becomes this version's shell only
  if it has none, so an old worker never stores a newer build's HTML.
- **Notifications:** `push` and `notificationclick` ([Notifications](#notifications)).
- **Runtime:** fonts, villager, critter, find and present art cache-first on first use; audio (`island-audio-v1`) cache-first with the 3 most
  recent music files (the hours, event music, K.K.'s songs) kept; Range requests pass through. Other GETs: this version's cache, the previous one, then the
  network. The Apps Script backend is cross-origin and always live.

## Tests

`relay/test/store.test.ts`, `store-route.test.ts` and `ingest-golden.test.ts` (the record on node:sqlite);
`gas/main.test.ts` (the export, on a fake of the Apps Script services in `gas/fakes.ts`),
`gas/parse.test.ts`, `gas/bundle.test.ts`; queue (`queue-batch.test.ts`: the record's batches), cache, sync and store tests; the golden fixtures (`GOLDEN_UPDATE=1` to regenerate) and
`npm run bench` for the model at year-3 volume.
