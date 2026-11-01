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

Row 1 is the header. The script keeps each tab's layout right (`heal`): a missing tab is created on first use, and on
`whoami` and whenever a hand change is noticed it rewrites the header as `TABS` has it (any column right of it
unlabelled) and formats each column as text or number (`NUMERIC_COLUMNS`; text so Sheets never turns dates into Dates). `at` is the request's server time, ISO 8601 UTC with milliseconds, strictly increasing
and shared by all rows of one request. Dates are `YYYY-MM-DD` (Tokyo). The app never updates or deletes a row.

| Tab | Columns | Written by |
|---|---|---|
| `metrics` | `at`, `person`, `date`, `metric`, `value` | `ingest`; `metric` ∈ `steps` · `exercise_min` · `move_kcal` · `stand_min` · `weight` · `body_fat_pct` · `bmi` · `lean_kg` |
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
| `spend_void` | `{spendId}` | from either person; the script refuses one naming no `spend` row and acknowledges a second void of the same buy as `duplicate` (nothing appended); the model takes the first after the spend |
| `harvest` | `{week}` | a week key; counts only for the harvest open at the time |
| `highfive` | `{}` | |
| `pref` | `{key, value, person?}` | `locale` (`ja`/`en`), `villagerName` (1–20), `villager` (roster id), `goalWeight` (20–300 kg, one decimal, or null), `moveGoal` (integer 100–2,000), `stepsGoal` (1,000–30,000, a multiple of 500) |
| `find` | `{kind, id}` | the island's scenery for the shared ずかん: `kind` ∈ `fish` · `bug` · `sea` · `fossil` · `shell` · `fragment` · `item` · `recipe` (`FIND_KINDS`; the last two: what a balloon's present held), `id` a catalog id (`[a-z][a-z0-9-]{0,47}`; the lists live in the client, so they can grow without a redeploy). Never ベル |
| `tally` | `{date, counts}` | one person's counts of one Tokyo day for the ずかん's 「×12」 (`contract/tally.ts`): `date` a real date not after tomorrow (server's Tokyo date), `counts` 1–300 keys `kind:id` (a find's kind and id) → whole 1–999. One row per person and day: see **Tally** below. Never ベル |
| `island` | `{date, taken, puts, shakes, watered, wishes, at?}` | one person's part of one Tokyo day's shared island ([Shared world](#shared-world), `contract/island.ts`): ids picked up, dug, pulled or opened (≤ 400), things put down `[id, what, x, z]` (≤ 60), shakes that left something `[tree, drop, at]` (≤ 120), flowers watered (`fl:<x>:<z>`, world.ts FLOWERS, ≤ 40), wishes by the morning they bring a fragment, where their villager stands (`[x, z]` within the plan); `date` not after tomorrow. One row per person and day, replaced like a tally. Never ベル |

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

`person` (`A`/`B`, whose goal; absent = the sender) is allowed only on the `goalWeight` / `moveGoal` / `stepsGoal` prefs
(`eventSubject`, shared by both sides). The row's `person` column is always the sender. There are no health-data events:
Apple Health is the source of truth ([design.md](design.md#health-data)).

## API

`POST <exec url>`, body = JSON text, `Content-Type: text/plain` (no CORS preflight), `{key, action, ...}`. Every reply
is JSON: `{ok:true, ...}` or `{ok:false, error, detail?}`, `error` ∈ `unauthorized` · `bad_request` · `too_large` ·
`busy` · `unavailable`. `doPost` never throws (an uncaught error would return Google's HTML page). No `doGet`;
`e.parameter` is never read (a key in a query string would reach Google's logs). Body cap 1,000,000 characters.

| `action` | Request | Reply |
|---|---|---|
| `ingest` | the Shortcut's fields ([Ingest](#ingest)) | `{ok, metrics, skipped?, warnings?}` |
| `event` | `id, type, data` | `{ok, duplicate?}`: a repeated `id` is acked as a duplicate, so retries are safe |
| `snapshot` | `since?` (ISO: the max `at` cached) | `{ok, me, now, rev, rows:{metrics, events}}`: compact arrays in column order, rows with `at > since`, both people; only rows the client reads (a known metric or event type, person `A`/`B`) |
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
it), `TAILS` (the `at` of each synced tab's last row) and `REV` ([Revision](#revision)).

**Tail reads:** rows are appended in `at` order, so "rows after X" is a tail, read backwards in doubling chunks (256,
512, …) until a chunk starts at or before X. `snapshot` with `since`, `ingest`'s comparison (from the day before the
body's earliest date) and `uploads` read tails; a full `snapshot` and the `event` id dedupe read the whole tab. A `snapshot` with `since` reads no rows of a tab that is
as the script left it (`ROWS`) and whose last row is not after `since` (`TAILS`): most polls read nothing.

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
04:00), so a later sync never moves locked earnings. The Shortcut posts to the `/exec` URL with `"key"`
and `"action": "ingest"` (`docs/ops/shortcut-health-sync.md`).

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
unavailable). A refresh posts `snapshot` with `since`, merges (`model/snapshot.ts`: deduped by natural key, ordered by
`at`; an empty poll keeps the same rows object, so nothing re-reduces), records the server clock skew and saves in
order. Overlapping refreshes share one request; a `fresh` caller waits for one more after any in flight. A reply that
lands after pairing again is dropped.

### Compaction

On each merge `model/compact.ts` drops `metrics` rows of locked weeks the model can no longer read: per (person, date,
metric) it keeps the latest row at the lock and the latest overall; per person the newest row. Weight keeps the newest
row per day. Views are unchanged; ~90% of rows go. A `tally` replaced by a later one of the same person and day goes
too (the sheet no longer has it).

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

On launch (after painting from the cache), when the app becomes visible (≤ every 30 s), on a sync tap, on `online`,
1.5 s after an ack (a `fresh` re-read so server timestamps replace optimistic ones), and while the app is on screen
whenever the relay says the sheet changed ([Push](#push)). Each refresh flushes the queue, then fetches.

## Live relay

Presence between the two phones while both have the app open (decisions: *Live relay on Cloudflare*). It carries
intents, never data of record: the sheet path above is unchanged and still catches an offline phone up.

- **Where:** `relay/` (its own package, outside the app's build): a Worker (`src/index.ts`) and one Durable Object,
  `IslandRoom` (`idFromName('island')`), SQLite-backed (`new_sqlite_classes`, the only kind the Free plan has).
  Production `wss://island-fund-relay.island-fund-relay.workers.dev/room`; a test copy, `island-fund-relay-test`, with
  its own secrets and room for the smoke test. `GET /health` → `{ok, v, versions, t}`; `POST /notify` ([Push](#push));
  `POST /push/*` ([Notifications](#notifications)).
- **Admission:** the Worker accepts `/room` upgrades only from `ALLOWED_ORIGINS` (`https://huangwaylon.github.io`) and
  `http://localhost|127.0.0.1`; everything else 403. The origin only keeps other sites out; the key is the auth.
- **Auth:** the first message is `hello {key, since?}`. The room compares it in constant time with the secrets
  `KEY_A`/`KEY_B` (the same keys as Script Properties; unset = nobody gets in) and answers `welcome {me, peer, t}`, or
  closes 4001. No hello within 10 s (a DO alarm sweeps): 4003. A second socket of the same person replaces the first
  (4002, no presence flicker). At most 8 sockets.
- **Protocol** (`app/src/lib/sync/live-protocol.ts`, imported by both sides and checked by the same parsers): JSON,
  `v: 2` (the rolling-log world; the relay still speaks `v: 1` to an older phone, answering each socket in the version
  of its hello), ≤ 256 bytes (an intent ~60–100; a `replay` ≤ 16,000). Intents: `walk {to: node id | [x, z], at?,
  from?, via?, s?, ms?}` (v2: world units, where the villager is going, and with `from`, `via` (≤ 12 waypoints), `s`
  (when it set off, the relay's clock) and `ms` (how long, ≤ 60 s; 0 = put there) the very walk, [Shared
  world](#shared-world) "Villagers"; integers within the plan `WORLD_X` −230…620 × `WORLD_Z` −400…2500, equal to
  `island/world.ts` PLAN; v1: stage units, |n| ≤ 100,000; a walk never crosses versions), `act {act, id?, at?, pt?}`,
  `catch {what, id?, at?, how?}`, `emote {emote}`, `world {op, id}` (`weed-pulled`, `fruit-collected`, `dug`,
  `present-opened`, `watered`, `shaken`, `wished`, `woke`), `saved {}` ([Push](#push)); the shared world's (v2 only, [Shared
  world](#shared-world)): `pick {id, what, at?}`, `put {id, what, at}`, `shake {tree, drop}`. Relay-only: `changed {what, who, at, rev}`. The room drops any client-sent `who`/`t`, stamps its own (`t` strictly increasing) and sends it
  to the other person only. Any intent may carry `c`, the phone's sequence number (increasing through the day: its
  `Date.now()` at sending, or one more): the room answers the sender `ack {c, t, ok}` (`t` its stamp; `ok` false when
  the world refused it: a claim already made, a nest too soon, a walk numbered before the one it keeps), and a resend
  of a kept intent with the same `c` (after a reconnect) is acked again, never relayed or kept twice. It relays to
  the partner before it writes the day to storage (a message sent after a write waits for it: the output gate), so a
  kept intent reaches the partner as fast as a passing one; its ack goes after the write (an ack is durable).
  `ping {c}` → `pong {c, t}`; `presence {who, on}` when the partner comes or goes (the island
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
  keeps (`isStored`: the shared world's intents and walks) goes even with the partner away.
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
  12 s (the island plays it: their villager runs over, at most 3 s on the way, and does it), else (heard on opening) it
  only changes the island. Attached to the phone's one socket when the backend starts (`store/live.ts`), so the
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
- **The sheet's day row** (`island` event, [Events](#events); `store/actions.ts sendIslandDay`): my part of the day
  (`rowOf`: what I took, put down, shook, watered and wished, where my villager stands), sent whole when it grows,
  held 2 minutes (a busy stretch is one request), one row per person and day on the sheet (the older one deleted, as
  a tally's). The model keeps each person's latest (`state.islandDays`); the store folds today's (what the relay
  didn't bring: both apps closed past the relay's day, an outage), yesterday's watering (today's hybrids grow from both
  people's) and the wishes for the mornings to come (`applyRow`; a claim known from a row becomes news when the
  relay's own arrives, so the partner's animation still plays). A shake carries `at`, the shaker's own time, its
  identity on both phones and in the row.
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
- **Still each phone's own:** the camera (each shows what its view holds of the same world), a balloon's flight and
  where this phone's lands (its present is shared once down), shooting stars and the night's showers' timing, the
  visitor's lines and a tap on them, a cast's bite plan and hesitation, a dive's chase, a tarantula rearing, the plates
  and lines read, a startup beat, sounds. These are what one person does or watches by hand, or decoration timed per
  screen; their outcomes (a catch, a find) are shared.
- **Budget** (Free plan): an intent is ≤ 100 bytes sent (tested), ≤ 140 relayed. A busy day of two people (~300
  walks, ~200 catches and pick-ups, ~50 shakes) is ~550 incoming messages: ~28 DO requests (20:1), ~550 storage writes
  (of 100,000 rows/day), and a replay on each open (outgoing messages are free). Nothing per frame.

## Push

While the app is on screen, a change to the sheet reaches the other phone in well under a second instead of at its next
open (decisions: *Push through the relay*). Additive: the polling in [When it syncs](#when-it-syncs) is unchanged, so
without the relay (or before the push is turned on) the app behaves as before.

- **Apps Script → relay:** after a request that appended `metrics` or `events` rows (an `ingest` with a changed value,
  a new `event`; never a duplicate, a refusal or a read), `doPost` POSTs `{what: 'ingest'|'event', who, at, rev}` (`at`
  = the newest row's, `rev` = the revision) to `https://island-fund-relay.island-fund-relay.workers.dev/notify`, after
  the lock is released (`gas/main.ts notifyRelay`). It needs the `script.external_request` scope
  ([runbook §11](ops/runbook.md#11-turn-on-the-push)); until the script has it, `UrlFetchApp` throws, and that or any
  reply but 204 pauses notifying for 10 minutes (CacheService `relay:pause`), so a write pays one cache read.
- **Auth:** the notify secret is HMAC-SHA256(key `"<KEY_A>:<KEY_B>"` trimmed and lower-cased,
  `island-relay-notify/1`), derived by both servers from the person keys they already hold; a phone holds only its own
  key, so it can't sign. Nothing to provision; rotating a key rotates it (the relay's and Script Properties' keys must
  match, runbook §4). Each POST carries `X-Island-Time` (ms) and `X-Island-Sig` = HMAC-SHA256(key secret,
  `"<time>.<body>"`), hex; the relay refuses a signature more than 5 minutes off (401), a body over 256 bytes (413) or
  a bad notice (400), and answers 204 with `X-Island-Heard: <sockets>` (`relay/src/notify.ts`). The secret never
  travels and no key is in a URL or a log.
- **Relay → phones:** the room sends `changed {what, who, at, rev, t}` to every authenticated socket, the writer's
  too (a Shortcut upload reaches its own phone). Nothing is stored.
- **The nudge:** after the queue gets an ack, the phone sends `saved {}` over its socket; the room relays it to the
  partner like any intent (only when they are there). It covers events before the Apps Script push is on, and stops
  (sent and heeded) once a `changed` has reached the phone this session.
- **Client** (`store/live.ts`, the one socket `sync/live.ts liveRelay()`, opened when the backend starts and
  reconnected on pairing): `onChange` → one `refresh({fresh: true})` 300 ms later (changes arriving together make one),
  skipped when the cache already has it (same `rev`, `at` ≤ `since`) and for my own `event` (the re-read after the ack
  fetches it). The CSP's `connect-src` allows the relay's `wss://` origin.
- **Cost** (Free plan, measured by `npm run smoke`): one notify = 1 Worker request + 1 DO request; a nudge = 1/20 of a
  DO request. Budget for two phones: [Request budget](#request-budget).
- **Measured** (from a Mac in Tokyo, test relay): notify POST → `changed` on both phones median 53–70 ms (max 92);
  the nudge one way median 19 ms. Apps Script's own `health` (no sheet) takes ~1 s, the relay's ~20–50 ms.

### Request budget

Free plan limits (developers.cloudflare.com, 2026-11): Workers 100,000 requests/day; Durable Objects 100,000
requests/day (a WebSocket connect is one, incoming messages count 20:1, outgoing free), 13,000 GB-s/day of duration
(an idle hibernatable object is not billed), 5 M rows read and 100,000 rows written/day, 5 GB storage; KV 1,000
writes/day (unused). A generous day for two phones:

| Source | Count/day | Worker req | DO req | DO GB-s |
|---|---|---|---|---|
| Sockets (each show of the app) | 2 × 60 | 120 | 120 | ~150 (10 s awake each, 128 MB) |
| Pings (every 60 s while shown, 2 × 2 h) | 240 | 0 | 12 | ~300 |
| Notifies (2 Shortcuts hourly + 100 events) | ~150 | 150 | 150 | ~190 |
| Nudges and intents (later: presence taps) | ~2,000 | 0 | 100 | ~100 |
| Goal reports and subscriptions ([Notifications](#notifications)) | ~3 | 3 | 3 | ~1 |
| **Total** | | **~270 (0.3 %)** | **~380 (0.4 %)** | **~740 (6 %)** |

Duration is the binding limit and stays under a tenth of it even if the island's presence multiplies the traffic
tenfold. Apps Script's side: one `UrlFetchApp` call per write, ~150 a day against the consumer quota of 20,000.

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

`gas/main.test.ts` (a fake of the Apps Script services in `gas/fakes.ts`), `gas/parse.test.ts`, `gas/perf.test.ts`,
`gas/bundle.test.ts`; queue, cache, sync and store tests; the golden fixtures (`GOLDEN_UPDATE=1` to regenerate) and
`npm run bench` for the model at year-3 volume.
