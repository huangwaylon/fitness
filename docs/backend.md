# Island Fund: backend

The record (a Durable Object's SQLite on the relay), the live room, and the client's sync. The contract (tables, row
tuples, reply shapes, bounds) is `app/src/lib/contract/api.ts`, shared by the record (`relay/src/store.ts`) and the
client. The relay imports from the app only `app/src/lib/contract/`, which reaches only itself, `types.ts` and
`random.ts` (`deps.test.ts` "the relay boundary"). Operating it: [runbook](ops/runbook.md); its log and costs:
[observability](ops/observability.md).

## Overview

The record is an append-only log with slots (a later row of the same slot replaces the earlier): the relay's
`IslandStore` ([The record](#the-record)) is its only reader and writer. It authenticates, validates shapes, stamps
`at` and appends; no server-side economy or config: the client caches the rows and derives every number on read. User
actions are `event` rows sent through a persisted queue and shown at once; health data comes from each phone's
Shortcut (`ingest`).

One Worker, three SQLite-backed Durable Objects (`relay/wrangler.toml`): `ROOM` (`IslandRoom`: [Live
relay](#live-relay)), `STORE` (`IslandStore`) and `LOG` (`IslandLog`: [observability](ops/observability.md)); it also
serves `/stt`, ききみみ's recogniser ([kikimimi-mic.md](kikimimi-mic.md)), and `/food/kalori` from Workers KV
([Kalori](#kalori)).

<a id="tabs"></a>
## Tables

`at` is the record's time, ISO 8601 UTC with milliseconds, strictly increasing (all rows of one ingest share it).
Dates are `YYYY-MM-DD` (Tokyo).

| Table | Columns | Written by |
|---|---|---|
| `metrics` | `at`, `person`, `date`, `metric`, `value` | `ingest`; `metric` ∈ `steps` · `exercise_min` · `move_kcal` · `stand_min` · `weight` · `body_fat_pct` · `bmi` · `lean_kg` |
| `events` | `at`, `person`, `id`, `type`, `data` (JSON text) | `event` / `events`; `id` client-generated |
| `uploads` | `at`, `person`, `status`, `bytes`, `error` | `ingest`'s audit (`ok` / `partial` / `error`, warnings, the body's shape, never the body or key); 60 days |

`metrics` and `events` are synced to the client; `uploads` only by the `uploads` action. The record's other tables:
[The record](#the-record) "Where".

## Events
Exactly the types in `EVENT_TYPES`; another type or a bad shape is `bad_request`. `data` is an object, ≤ 20,000
characters as JSON (a `wnote`'s 140,000; past either `too_large`). Each type's fields, bounds, caps and merge are its
`contract/` module's (header and constants); the record checks shapes (`contract/record.ts`), and wallet cover is a
read-time rule in the model. **Ops with a sender's clock** (`decor`, `board`, `food*`, `pack*`, `w*`: `at` in ms on the
relay's clock) are refused more than a day past the record's (`AHEAD_MS`), which no later edit could beat. **Latest op
only:** the per-id ops keep one row a slot; a stale op or anything after a removal is acked as `duplicate`, and a
removal's row is kept for good. **Never ベル:** everything but `spend`, `spend_void` and `harvest`.

| type | module | what |
|---|---|---|
| `spend` / `spend_void` | `rules.ts`, `record.ts spendOf` | a buy from the sender's wallet at `shopPrice`, `day` up to 14 days back; either person's undo (the first counts) |
| `harvest` | `record.ts` | a week's harvest, counted only while it's open |
| `pref` | `record.ts`, `goals.ts`, `profile.ts`, `look.ts` | one setting (below) |
| `find` | `api.ts FIND_KINDS` | the shared ずかん's first find of `kind:id` (ids the client's catalog: no relay deploy), sent only the first time anyone finds it (`model/finds.ts`) |
| `tally` | `tally.ts` | <a id="tally"></a>one person's day of catches and pick-ups, sent whole, held a minute; one row per person and day, each count the larger (`mergeTally`; `TALLY_PAST_DAYS`) |
| `tally_back` | `tally.ts backCovered` | what one person gives back of a day's tally: a claim race lost after the tally went ([Shared world](#shared-world)); a catch already sold **costs its かいがら** (`shop.ts owedOf`) till a later catch covers it |
| `island` | `island.ts` | one person's part of one day of the [Shared world](#shared-world) (`mergeIslandDay`), sent only once this session's fetch folded the record in (`week.current`), so a row rebuilt before them can't erase claims |
| `decor` | `decor.ts` | a piece's whole state or its removal, anyone's: the decorations ([Decorating](design.md#decorating), `DECOR_MAX`) |
| `decor` (`sc` `t` / `u` / `v`) | `tent.ts` | a room's piece, wallpaper, floor, size ([The tent](design.md#the-tent), `TENT_MAX`); a light's switch a slot of its own |
| `decor` (layout) | `layout.ts` | the island's layout ([island-layout.md](island-layout.md#ops-the-record-and-the-relay)): a home's look its owner's (`scopeMayWrite`); any lower-case kind passes |
| `room_save` | `roomSave.ts` | a room's saved arrangement in slot 1–3 ([design](design.md#the-tent) "Saved arrangements"), or emptied |
| `board` | `board.ts` | a note or its removal ([board.md](board.md)) |
| `food`, `food_repeat`, `food_recipe`, `food_custom` | `food.ts` | the meal log ([food-data.md](food-data.md)): own entries, owner-only edits (`foodAccept`); いつもの's skipped day stays skipped (`repeatAccept`); a recipe or custom food logs as an ordinary `food` with a snapshot |
| `sell`, `buy`, `buy_starts` | `shop.ts`, `stock.ts` | [The shop](design.md#the-shop), no slot, the guest's too: the pocket and かいがら are derived (`shopLedger`); past them `pocket short` / `wallet short` |
| `farm`, `wet` | `farm.ts` | [farming.md](farming.md#rules-the-records): ops judged against the field and the pocket (`farmStep`); `wet` the record's own, from the weather cron (`wetTick`) |
| `listen` | `listen.ts` | one ききみみ game's answers ([kikimimi.md](kikimimi.md)); **private** (`rowsFor`): whole to its owner, a summary to the others (`stampsUnit`) |
| `pack`, `pack_chk`, `pack_reset`, `trip_note` | `pack.ts` | the packing list ([travel.md](travel.md#packing-list-relay)): items anyone's (the guest's own only), ticks each person's; `trip_note` a trip's [private values](travel.md#private-values), never in the repo |
| `wtask`, `wdone`, `wconf`, `wnote` | `wedding.ts` | [the wedding board](wedding.md#the-record-relay) |

The wedding types and `trip_note` are the members' only (the guest's are `forbidden`).

<a id="pref"></a>**`pref`** `{key, value, person?}`:
- Cosmetic: `locale`, `villagerName`, `villager`, the look ([The look](#the-look)).
- Goals, one key per charted metric (`goals.ts` GOALS). **Per day:** `stepsGoal`, `moveGoal`, `exerciseGoal`,
  `standGoal`, each with an optional `day` (`goalDay`). **Latest only** (or null): the からだ goals and the meal log's.
- The profile (`profile.ts`, [design](design.md#profile)): `sex`, `birth`, `bmiStd`. **Private** (`rowsFor`): a
  member's reaches the two members only, the guest's the guest only.
- Island-wide: `weatherMode` and `seasonLook` ([The real weather](#the-real-weather)).

**Subjects and new keys:** `person` (whose goal; absent = the sender) only on the goal and profile prefs
(`eventSubject`); the row's `person` column is always the sender. **A new event type, pref key or field deploys the
relay first**: the record refuses what it doesn't know, and an older app ignores such a row. There are no health-data
events ([design.md](design.md#health-data)).

### The look
Each person's avatar ([players.md](players.md), `contract/look.ts`): an NH human player from parts, or their roster
villager. Two prefs, the sender's own, neither private: `look` (null or unset is **いつもの**, `DEFAULT_LOOKS`, never
stored) and `savedLooks` (the コーデ, ≤ 20). **Reading** (`resolveLook`, `readSavedLooks`) goes part by part, so an
unknown or broken field falls back alone.

## API
`POST https://island-fund-relay.island-fund-relay.workers.dev/api`, body = JSON text (`text/plain` from a page: no CORS
preflight; a Shortcut's `application/json` is fine), `{key, action, ...}`. Every reply is JSON with status 200:
`{ok:true, ...}` or `{ok:false, error, detail?}`, `error` ∈ `unauthorized` · `forbidden` · `bad_request` · `too_large` ·
`busy` · `unavailable`. Body cap `MAX_BODY_CHARS`.

| `action` | Request | Reply |
|---|---|---|
| `ingest` | the Shortcut's fields ([Ingest](#ingest)) | `{ok, metrics, skipped?, warnings?}` |
| `event` | `id, type, data` | `{ok, duplicate?}`: a repeated `id` is acked as a duplicate before any check, so retries are safe |
| `events` | `events: [{id, type, data, group?}, …]` (≤ `EVENTS_MAX`; a group ≤ `GROUP_MAX`) | `{ok, results: [{id, ok, duplicate?, at?} \| {id, ok: false, error, detail?}]}`: each as `event` would, in order, `at` its stored row's |
| `snapshot` | `since?` (the max `at` cached); `page?` (≤ `SNAPSHOT_PAGE_MAX` rows), `after?` (the last page's `next`) | `{ok, me, now, rev, rows:{metrics, events}, next?}`: compact arrays in column order, rows with `at > since`, paged in (at, table, seq) order while `next` comes |
| `uploads` | | `{ok, rows:[{at, status, bytes, notes}]}`: the caller's last 20 audit rows |
| `whoami` | | `{ok, me, build}` (pairing) |
| `health` | no `key` | `{ok, build}` (`STORE_BUILD`) |

<a id="groups"></a>**Groups:** the events of one `group` (the shop's 全部, a room's whole change) are all or none in one
transaction: a piece already owned is refused `owned` alone, any other refusal rolls the lot back (`detail: 'group'`);
a retry of a kept group is all duplicates.

## Auth and limits
- **Keys:** the caller is whichever Worker secret `KEY_A` / `KEY_B` matches (or `KEY_C`, the guest's: `G`,
  [The guest](#the-guest)), in constant time. `KEY_A` and `KEY_B` also derive the secret that signs `/notify` and
  `/admin` (never `KEY_C`): a rotation updates the admin tools' keys file too ([runbook §3](ops/runbook.md#3-rotate-a-key)).
- **Rate limit:** `RATE_PER_MINUTE` (120) requests per key a minute, in the record's memory; over it, `busy`. A
  snapshot's later pages have their own `PAGES_PER_MINUTE`.

## Record state
The `meta` table keeps `last_at` (the next `at` is max(now, `last_at` + 1 ms)) and `rev`. A Durable Object runs one
request at a time and each write is one SQLite transaction, so a snapshot never sees half of one; an ack is sent only
after its commit.

## Revision
`rev` is the record's epoch (`e1`, `e2`, …), changed only when the record is rebuilt (a restore, or `node
scripts/record.ts rev`). A new epoch, and a `load` that added rows, send `changed`. A `snapshot` whose `rev` or `me`
differs from the cache's makes the client drop the cache (never the unsent queue) and fetch everything. Nothing edits
the record by hand.

## Ingest
`relay/src/parse.ts` (its header: the fields, the bounds, the steps' max of two devices, body fat as a fraction):
newline-joined Text lists, one line per day ([shortcut §1](ops/shortcut-health-sync.md#1-what-the-shortcut-sends)).
A bad line is skipped with a warning, a list of the wrong length dropped; a body with none of the fields is
`bad_request`. **A date repeated** in `dates` (a time-zone change) keeps an activity metric's largest, a weigh-in's
last. A run whose write throws still leaves an `error` audit row and answers `unavailable`. Body metrics never earn.

**Latest wins:** a row is appended whenever a value differs from the last for (person, date, metric). One exception: a
`0` for a **past** Tokyo day whose latest row is above 0 is **held, not appended** (a run that read nothing, Health
locked, would rewrite the history): kept in `metrics_held`, never served; the admin promotes a real correction
(`record.ts held`, `promote`: [runbook §9](ops/runbook.md#9-the-record)). The model reads a day's latest row; a locked
week as of its lock (Wednesday 04:00).

**A day without the Watch:** its `0` is stored as sent; the model reads it as no data for Move, Exercise and Stand
(`model/health.ts activityOn`, [decisions](decisions.md#no-watch-days)). An empty line writes no row (`skipped`).

## Client sync
`lib/sync/` (storage, transport, pairing, queue, cache, the live socket) and `lib/store/` (the week store, actions,
`live.ts`, `view.ts`, `synced.svelte.ts`, the demo backend, loaded only with `?demo`).

### Storage keys
`sync/storage.ts` registers every key (the live `island.*`, the demo's `island-demo.*`). If storage fails the data
lives in memory for the session, with a banner once. Pairing as another person clears the cache, queue and acked list.
`sync/transport.ts` `post()` never throws (network failure `offline`; timeout, non-2xx or non-JSON `unavailable`).

### Snapshot cache
`sync/cache.ts`: the rows in IndexedDB (else in memory), in **segments** so a save rewrites only what changed;
anything unexpected reads as no cache (a full fetch). A refresh fetches `SNAPSHOT_PAGE` pages after `since` and applies
them together (`fetchPages`: a failed page leaves the cache as it was, a new epoch between pages starts over). The merge
(`model/snapshot.ts`) dedupes by natural key and orders by `at`; rows that only append fold over the last State
(`model/state.ts foldRows`). Overlapping refreshes share one request; a reply after a re-pair is dropped.

### Compaction
On each merge `model/compact.ts` drops the `metrics` rows of locked weeks the model can no longer read
(`contract/compact.ts compactKeep`), a replaced `tally`, and the `food*` ops the fold no longer reads (`model/food.ts
foldedAway`). The record keeps every Health row ([The record](#the-record) "Compaction").

### Write queue
`sync/queue.ts` (its header and constants): events in `island.queue`, sent in order until acked, in `events` requests
answered by id; a request refused whole is halved, one event alone so refused is set aside.

- **Paced** (`SEND_PACE_MS`): a send right after a flush waits for one trailing flush. **Day rows** (`tally`,
  `island`): a newer row of the same day replaces the queued ones.
- **Set aside** (`parked`, `PARK_AFTER`): an event the record keeps failing stops blocking, is logged `queue.poison`
  and is never dropped; a sync tap tries it again. Unsent 2 minutes past its hold, it shows on the sync chip and in 設定.
- **Holds:** a held event (`holdMs`, the undo window) is skipped, not waited for; `unqueue` takes it back;
  `replaceHeld` swaps its data (its id kept, never once tried: a farm tap joining its batch, a catch's held tally or
  island day, one recompute of the view); a later event on the same spend never overtakes it. A group goes once none of it is held, in one request.
- **Replies:** acked → `island.acked` (in the view until a snapshot holds it); `bad_request` / `too_large` → dropped
  with a message; `unauthorized` → pairing; other errors keep it and all after it (`backoffMs`). Retried on `online`, a
  sync tap, becoming visible and the socket's welcome, at most once per 30 s.
- **Hidden:** on hide the held day rows go at once in `keepalive` requests, so a phone locked right after a catch
  doesn't leave the partner behind.

### Optimistic view
`store/view.ts composeModel`: the cached rows plus acked and queued events, each stamped just after the newest server
row on the server's clock, so read-time rules judge it as the server will. Recomputed on every change and each minute
(not while hidden). The `food*` rows stay raw (`model/state.ts` RAW_EVENTS) till the food sheet parses them.

<a id="live-sync"></a>
### When it syncs
On launch (after painting from the cache), on becoming visible (≤ every 30 s), a sync tap, `online`, and on the
relay's `changed` ([Push](#push)); each refresh flushes the queue, then fetches (waits: `store/live.ts`'s constants).
A launch or becoming visible waits briefly for the `welcome`: when the cache already has its `rec {at, rev}` and is
recent, it only flushes. Every welcome whose `rec` is past the cache fetches (`e2e/live-sync.spec.ts`). An ack carries
its stored row's `at` and the row goes into the cache at once; only a duplicate's ack is followed by a re-read.

**One device, one socket:** each hello names the device and tab (`dev`) and replaces only that tab's earlier socket
(4002); the person's other devices hear their decor ops live, and only the writing page skips its own `changed`
(`sid`). **Two tabs** of one browser are two devices; the synced stores (`store/synced.svelte.ts`) merge storage
before they write and fold the other tab's writes from their `storage` events.

**Conflicts:** every op merges commutatively per id (`at`, then who); two layout pieces moved onto one tile at once
are settled by the later op's phone ([island-layout.md](island-layout.md#ops-the-record-and-the-relay) "Two edits on
one tile").

<a id="the-record"></a>
## The record
- **Where:** `relay/src/store.ts` (`StoreCore`, free of the Workers runtime; its header: the clock, ids, slots, the
  shop's cover, `since`) in `IslandStore` (`idFromName('record')`, `storeObject.ts`). Tables (`SCHEMA`): `metrics`,
  `events`, `ids` (every event id ever accepted), `uploads`, `meta` (`last_at`, `rev`, `schema_v`, the running
  ledgers), `metrics_latest`, `metrics_held` ([Ingest](#ingest) "Latest wins").
- **Schema:** `SCHEMA` (`IF NOT EXISTS`), then `MIGRATIONS`, each step and its mark one transaction; a change is a new
  step at the end, never an edit of one that shipped.
- **The Worker's gate** (`storeRoute.ts keyGate`): the origin, method, size and a person's key in the body (a bounded
  scan, not a parse), else `unauthorized` there, so a stranger never costs a Durable Object request.
- **Rules** (`app/src/lib/contract/record.ts`): the shape checks (`validEventData`; the shop's prices in
  `contract/shopCheck.ts validEvent`, the relay's only, so they stay off the phones' first load); an event id once,
  forever; **slots**, a later event of a slot replacing it (`eventSlot`, and the per-id ops' `decorAccept`,
  `foodAccept`, …); a pref the model ignores takes no slot.
- **Running checks:** the shop's against each person's ledger (meta `shop|<who>`, kept by `contract/shop.ts shopStep`;
  `shopcheck {fix?}` compares it and the field, meta `farm`, with the full fold), a decor op's against its own slots
  and the caps' counts (meta `decor_live`; `decorcheck {fix?}`); a reset drops the voided rows (`dropVoided`).
- **`since`:** from the `at` index; a row that arrived out of `at` order (an import's) is `late`, and a poll returns
  late rows too (`LATE_MARGIN_MS`).
- **Admin:** `POST /admin`, signed like `/notify` ([Push](#push) "Auth"; a `restore`, `rev` or `logpurge` taken once
  per signature, `admin_seen`). Its ops: [runbook §9](ops/runbook.md#9-the-record) (`load` by the same rules,
  idempotent: `test/restore.test.ts`).
- **Push-driven:** after a write the object tells the room ([Push](#push)), which keeps the last `rec {at, rev}` for
  each `welcome`.
- **Compaction** (`store.ts compact`): the phones' rule on the record's `metrics`. **It is off: every Health row is
  kept.** The cron runs it only with `COMPACT_CRON=1`, unset (`relay/test/compact.test.ts` fails while it is set); the
  admin's `compact` needs `confirm: 'delete-health-history'`.
- **Snapshot size:** a year of three people is ~50–100k rows, ~3–6 MB of JSON, hence the paging.
- **A restore** (`restore {bookmark}`): every `/api` request is `unavailable` until the restart, so no write is acked
  and then dropped; a new epoch. Backups: [runbook §6](ops/runbook.md#6-backups).

## Live relay
Presence between the phones while the app is open (decisions: *Live relay on Cloudflare*). The room carries intents,
never data of record: the record still catches an offline phone up.

- **Where:** `relay/` (its own package): a Worker (`src/index.ts`) and `IslandRoom` (`idFromName('island')`,
  `src/room.ts`) at `wss://island-fund-relay.island-fund-relay.workers.dev/room`; a test copy,
  `island-fund-relay-test`, with its own secrets, for the smoke test. `GET /health` → `{ok, v, versions, sha, t, wx}`
  (`sha`: the deployed commit); `POST /api`, `/admin`, `/notify` ([Push](#push)), `/log`
  ([observability](ops/observability.md)), `/stt`, `GET /food/kalori` ([Kalori](#kalori)).
- **Admission:** `/room` upgrades only from `ALLOWED_ORIGINS` and localhost, with the subprotocols `island-v1` and a
  short-lived HMAC ticket under the person's key (`contract/ticket.ts`, `auth.ts admission`), else 403; a ticketed
  hello must be that person's. A phone clock over 5 minutes off has no live socket.
- **Auth:** the first message is `hello {key, since?, build?, beat?, dev?}`; the room compares the key in constant time
  and answers `welcome {me, peer, t, rec?, here, gone?, hb?, mine?}` (`rec`: the record's last change; `gone`: when
  each person's last socket closed; `mine`: another device of mine is here).
- **Close codes:** 4001 bad key, 4002 replaced by the same device's newer socket, 4003 no hello within `HELLO_MS`,
  4004 an unknown `v` (the client waits for a reload; a bump ships as [Relay versions side by
  side](decisions.md#relay-versions-side-by-side) says).
- **Protocol** (`app/src/lib/contract/live-protocol.ts`: both sides' parsers, each field's bounds): JSON, `LIVE_VS`, ≤
  `MAX_BYTES` (a `replay` ≤ `REPLAY_BYTES`). Client intents:
  - The shared world's, kept for the day ([Shared world](#shared-world)): `walk`, `act`, `catch`, `world`, `pick`,
    `put`, `shake`, `decor`.
  - Presence only: `drag`, `tent`, `fish`, `say`, ききみみ's `quiz` and `play`
    ([kikimimi-engine.md](kikimimi-engine.md#the-play-wire)); `highfive`, held a day for an away recipient
    ([decisions](decisions.md#a-high-five-goes-over-the-relay-only)); `music` ([sound-sync.md](sound-sync.md)); `saved`,
    `ping` → `pong`, `got`.

  Relay-only: `changed`, `wx`, `presence {who, on}`, `replay {es}`, `ack`, `busy`. The room stamps its own `who` and
  `t` (strictly increasing) and relays to the others; a `decor` op also to the sender's other devices.
- **Acks:** an intent may carry `c`; the room answers `ack {c, t, ok}` (`ok` false: the world refused it, a claim
  already made) after its write (an ack is durable). A resend of a kept or recently acked intent is acked again, never
  relayed twice.
- **Heartbeat:** `{"v":3,"kind":"hb"}`, answered by the runtime (`setWebSocketAutoResponse`), so it never wakes the
  room. A hello with `beat: true` beats after 20 s of silence; the room closes a socket silent for `SILENT_MS`
  (`sweepSilent`), stamped gone at its last beat.
- **Limits:** a token bucket per socket (`relay/src/bucket.ts`); beyond it messages are dropped, a numbered intent
  hears `busy`. **Replay:** a hello with `since` gets the day's newer changes after the welcome.
- **Cost:** hibernation: an idle socket keeps no object in memory ([budget](ops/observability.md#request-budget)).
- **Client** (`app/src/lib/sync/live.ts`, `liveRelay()`, one socket; its constants: backoff, pings, liveness, the
  outbox): connected while visible and online; after 4001/4002/4004 it waits until the page is shown again. The clock
  offset comes from the shortest recent ping (`serverNow()`); the shared world's Tokyo day is `world.now()`'s, never
  the device's. **The outbox:** what the room keeps (`isStored`) waits for its `ack`, kept in localStorage and resent
  after a reconnect (dropped after 4 tries: a catch is still in the record's day row). `send(intent)` never throws or
  blocks. `LIVE_URL`, overridable by `VITE_LIVE_URL` (empty = off).
- **Measured:** the relay's latencies, in [perf.md](ops/perf.md) "Measuring".
- **Tests:** `relay/test/` (`cd relay && npm test`, also `.github/workflows/relay.yml`); `live-protocol.test.ts`,
  `live.test.ts`, `live-room.test.ts` (the client against the real room) and `store/push.test.ts` in the app's vitest.

## The real weather
Tokyo's sky by the hour for the island ([design](design.md#weather); decisions: *Weather from Tokyo, by the hour*).
`relay/src/weather.ts` (its header and constants: the fetch's timing, the hours kept, the locks, the dead bands, the
backoff), `weatherTick` (`relay/src/index.ts`, the cron at :15 and :45, and a hello when due; the test copy has no
cron), the phones' `sync/wx.ts` and `island/weather.ts` `realWeatherAt`.

- **Source:** Open-Meteo's forecast, JMA's models (`models=jma_seamless`), for one point (`wrangler.toml` `WX_LAT` /
  `WX_LON`). No key, CC BY 4.0, credited in 設定; no phone calls a weather API. JMA gives no snow, fog or thunder codes
  for Tokyo: snow comes by temperature.
- **The timeline** (`live-protocol.ts Wx`): a sky an hour, 12 back (the rainbow looks back) and 36 ahead, the foggy
  hours and the day's high (しずえ's news); the response checked strictly, so bad data never replaces good. An hour
  that has begun keeps its sky, so a phone that cached it shows the same as one online. A failure keeps the timeline
  and logs `wx-fail <why>`.
- **To the phones:** `wx` after the welcome (while the timeline serves) and on each `rev`; cached as `island.wx`. In
  ほんもの mode (`pref weatherMode`) the hour's sky is the timeline's while it serves, else the seeded day's; winter's
  snow, the fine event nights, fog, aurora and rainbow are the phone's rules. `pref seasonLook` (設定 → 季節):
  `{event, season, weather, tod}` or `null` (自動). Weather is never written to the record; only the mode is.
- **Ops:** `GET /health` → `wx {at, src, age, hours, fails}`; the signed `/admin` op `wx` refreshes, puts a fixture in
  (the smoke test) or reports.
- **Tests:** `relay/test/weather.test.ts` (recorded responses against golden timelines), `room.test.ts`; the app's
  `island/realWeather.test.ts`; `e2e/realweather.spec.ts`; `npm run smoke`.

## The guest
A third person, a visitor rather than a member ([design](design.md#the-guest), [decisions](decisions.md#the-guest)):
one key, `KEY_C` (unset = no guest), who `G`. The economy, the members' goals and real-world records, the Health
ingest, the trees, きろく, けんこう and ふたりでぜんぶ stay A + B.

- **Reads** (`contract/guest.ts guestRows` via `rowsFor`): the members' activity, every event but the からだ goals and a
  member's profile; its own `listen` rows whole, the members' as summaries. A member's snapshot never carries the
  guest's profile.
- **Writes** (`guestMayWrite`): what a member writes on the island, by the same rules, and its own meals, prefs,
  profile and pack items. Not `spend`, `spend_void`, `harvest`, a member's or an activity / からだ goal, a `trip_note`,
  the wedding board, `ingest` or `uploads`: `forbidden` (the queue drops it). Rows are `person = G` (merge order A < B <
  G).
- **The room:** the same as a member's; a `decor` op of another's home's look is refused for anyone (`scopeMaySend`).
  `peer` is the partner for a member and either member for the guest; a high-five names whom it is for (`to`).
- **Push:** of the members' notices it hears an event's, an ingest's only when it brought activity rows (`notify(n,
  guest)`), and a new epoch's; its welcome's `rec` is the room's `recG` (`index.ts Marks`).
- **The phones:** a member's draws the guest's villager as a third actor (`ui-state/cast.ts`: `mine`, `partner`,
  `third`; on the guest's phone `third` is B); the guest's phone guards what it sends by the same rules.
- **Tests:** `relay/test/guest.test.ts`, `contract/guest.test.ts`, `e2e/guest.spec.ts`; `npm run smoke` with `KEY_C`.

## Kalori
`GET /food/kalori` (`relay/src/foodRoute.ts`): Kalori's chain menus for the members' food search
([food-data](food-data.md#kalori)), from the Workers KV namespace `FOOD` (`wrangler.toml`: prod and `[env.test]`
each their own), written by `relay/scripts/kalori-put.sh`, never by a deploy.

- **Auth:** `Authorization: Bearer <KEY_A|KEY_B>`; no or a wrong key 401 `unauthorized`, the guest's 403 `forbidden`
  (one key fewer holding the data). CORS for `ALLOWED_ORIGINS` and localhost (another origin: 403), the preflight
  allowing `Authorization, If-None-Match`; no Origin (curl) is served.
- **Caching:** KV `kalori` (the file, metadata `{v}`) and `kalori:v` (its version: the sha256, 16 hex). `ETag: "<v>"`
  (Cloudflare's gzip makes it `W/"<v>"`; both match), `Cache-Control: private, no-cache`, `Access-Control-Expose-Headers:
  ETag`; a matching `If-None-Match` is a 304 from the version key alone. Nothing uploaded: 404 `no_data`. Errors are
  `no-store`.
- **Size:** 9.7 MB, 1.2 MB gzipped on the wire (38,383 items): a KV read a fetch, one a revalidation.
- **Tests:** `relay/test/food-route.test.ts` (a fake KV); `npm run smoke` (a member's 200 or 404, a 304, the guest,
  a stranger and another origin refused).

## Ambient life
What the island does on its own (a villager's outing or small move, the visitor's beat, a fish, bubbles or a bug) is
decided per 10-second slot of the Tokyo day from the date, the slot and the shared world, so every phone computes the
same island without a message (decisions: *Ambient life from the clock*). `app/src/lib/components/island/ambient.ts`
(pure; its header and constants: the odds, the reach, the stays); `motion/idleLife.svelte.ts` and the critters play it.

- **Clock:** `slotAt(ms, offset)` on the island's clock (`clock.ts now()`: a `?date=` preview moves the slots) plus the
  relay's offset (`ambientClock.ts relayOffset`). A slot plays `DECIDE_MS` after it starts, when an intent sent before
  the start has reached the partner.
- **Randomness:** `slotRand(date, slot, kind)` = `dayRand(date, "ambient:<kind>:<slot>")`; species by the sky at the
  slot's start (`weather.ts yieldSkyAt`).
- **Villagers** (`villagerBeats`): one beat a slot (an idle move, an outing, one out at a time, or a chat or dance for
  two free ones). A sleeper is never free; a villager whose person has the island open makes no outings (`held`); the
  guest's joins while awake, with no outing and no tree shaking. **Visitor:** `Visitor.svelte beat(r)`
  (`visitorLife.ts`), skipped while it speaks.
- **Critters** (`spawnsIn`, `crittersAt`): chained per 10-minute block, so a phone opening mid-stay finds the ones
  still there; id `<kind>:<slot>`.
- **Agreement:** the same inputs give the same slot (`ambient.test.ts`: shuffled inputs, skewed clocks); phones differ
  only where their inputs do (a clock past the margin, a local skip, the camera). What a person does by hand plays on
  their phone; its outcome is shared.

## Shared world
Every phone shows the same island (decisions: *A shared world: the seed for what comes, the relay for what we do*;
the look: [design](design.md#shared-world)): what comes by itself is [Ambient life](#ambient-life); what a person does
is a small intent over the relay, kept by the room for the day, folded by every phone into the same day.

- **The day** (`sync/world-day.ts`, pure): a `WorldDay` folded from the day's intents in the relay's order: claims,
  puts, shakes, watered cells, wishes, each person's last walk. First wins: the relay drops a later claim. Claim ids:
  `live-protocol.ts claimOf`.
- **A race lost:** what my claim put in my pocket comes out again (`world.lost` → `store/actions.ts lostRace`), with
  「〇〇が さきに とったよ」: from the held or queued tally, or by a `tally_back` once it went. Today's counted claims
  are kept (`island.counted`), so this works after a reload. **A refused claim** (`ack {ok: false}`) is a race lost
  the same way.
- **The store** (`store/world.svelte.ts`, `world`): today's day in localStorage (`island.world`); `share(intent)` folds
  my change (refused when someone already has it) and sends it at once; `on(fn)` the others'.
- **The room** (`relay/src/room.ts`): the last `RING_MAX` changes and each person's last `walk` in one storage value
  (`ring`); the day's claims and each tree's last nest apart (`day`), so neither a trimmed ring nor a hibernation lets
  a claim be made twice (`NEST_GAP_MS`).
- **The demo** (`sync/live-local.ts`): the players are tabs of one browser (`?demo`, `&as=B`, `as=G`), a
  BroadcastChannel the room, so the two-player e2e run without a network.
- **The record's day row** (`island` event, `store/actions.ts sendIslandDay`): my part of the day, sent whole when it
  grows, held 2 minutes; the store folds in today's, yesterday's watering and the wishes for the mornings to come
  (`applyRow`).
- **Villagers** (`island/villagerSync.ts`, `motion/director.svelte.ts` `onOwnMove` / `setRemote`): each phone moves its
  own villager; every walk and put goes as the walk itself on the relay's clock, and the partner's phone plays it from
  the same start: a small gap walked off, a bigger one glided (`JUMP_U`, `GLIDE_MS`), never a jump in view. A phone
  gone leaves its villager where it stood, across days ([decisions](decisions.md#a-villager-stays-where-it-was-left)).
- **Sleep** ([design](design.md#sleep)): a villager sleeps while its person is offline (`ui-state/presence.ts`
  `GRACE_MS`). A wake is `act {act: wake, id, at}`, kept in the day (`playWake`); Gulliver's is `world {op: woke, id:
  gulliver}`.
- **The decorations** (`store/decor.svelte.ts`): each change one `decor` op, to the relay at once and to the record's
  queue, merged by id; my op's `at` on the relay's clock.
- **Checked** (`e2e/sync-harness.spec.ts`; against the test relay with `RELAY_E2E=1`): after a scripted session every
  phone, a late one too, has the same canonical day (`world-day.ts canonical`), decorations and villager points;
  `world-day.test.ts` adds conflicts, a dropped socket and a late join on the real `RoomCore`.

## Push
While the app is on screen, a change to the record reaches the other phones in well under a second (decisions: *Push
through the relay*). Additive: the polling in [When it syncs](#when-it-syncs) still catches up a phone that missed it.

- **Record → room:** after a write that added rows (never a duplicate, a refusal or a read), the record calls the room
  (an RPC, after its commit) with `{what: 'ingest'|'event', who, at, rev, sid?}`. `POST /notify` (signed, below) takes
  the same notice from a server (`npm run smoke` uses it).
- **Auth:** the notify secret is derived from `KEY_A` and `KEY_B` by both servers (`relay/src/notify.ts`: the
  derivation, the headers, the 5-minute window); a phone holds only its own key, so it can't sign. Rotating a key
  rotates it ([runbook §3](ops/runbook.md#3-rotate-a-key)); the same secret signs `/admin`.
- **Relay → phones:** `changed {what, who, at, rev, sid?, calm?, t}` to every authenticated socket, the writer's too (a
  Shortcut upload reaches its own phone), the guest's only of what it may see; the last mark is the welcomes' `rec`.
- **The nudge:** after an ack the phone sends `saved {}`, relayed like any intent, until a `changed` has reached it
  this session.
- **Client** (`store/live.ts`): `onChange` → one `refresh({fresh: true})` after `PUSH_GATHER_MS`, skipped when the
  cache has it and for this page's own `event` (`sid`); my other devices' wait till they pause (`MINE_WAIT_MS`), so the
  editor's burst of writes from the Mac is a few fetches, and so does a partner's `calm` run (only events the island
  doesn't draw: live-protocol.ts CALM_EVENTS, the meal log, ききみみ, packing, the wedding board; `CALM_WAIT_MS` 10 s).

## Service worker
`app/src/service-worker/` (pure rules and every cache's bound in `caches.ts`). No `push` or `notificationclick` handler
([decisions](decisions.md#no-notifications), `e2e/no-notify.spec.ts`).

- **Registration:** by the app (`lib/ui-state/swLate.ts`) once the 3D island has its models in or can't draw (30 s at
  the latest), so a first visit's precache never competes with them; the page then posts its resource timings' URLs
  (`warm`) and the worker keeps their models and art from the HTTP cache (`caches.ts warmable`).
- **Install:** precaches the built JS/CSS and `caches.ts precachable` (the rest on first use): the hashed chunks all
  or nothing, the static files by content hash (`installStatics`). Chunks import each other by a stable key
  (index.html's import map, `vite.config.ts` chunkImportMap), so a deploy refetches only the chunks that changed.
- **Activate:** keeps the current shell (`island-shell-<version>`), the previous one (an old page loads its lazy chunks
  from it), the runtime caches and the saved areas; deletes the rest, and font slices no style sheet names
  (`staleFonts`).
- **Navigations:** this version's cached shell at once (`isShellOf`); none yet: network first, an older shell offline
  or after 3 s.
- **Updates:** Kit's `_app/version.json` check sets `updated`; the layout waits for the new build's worker
  (`ui-state/reload.ts newWorker`) and reloads once nothing is open. Never on a timer; a failed install reloads
  nothing. A launch the worker served checks at once (`ui-state/launchUpdate.ts`): the island waits ≤600 ms for the
  answer and, for a newer build, ≤3 s for its worker, then reloads into it before any of the island is built
  (`app.reload why=launch`); offline or slow, the old build boots as before. `e2e/sw-update.spec.ts` (`scripts/serve-build.ts /__e2e/deploy` stands in for a deploy).
- **Packs** (the players' and ききみみ's): fetched whole (Pages answers a Range with the whole file), one fetch at a
  time a URL (`fetchShared`).

| Cache | Holds | Rule |
|---|---|---|
| `island-room-v1` | models, the players' parts and packs | cache-first, outlives builds; a file's older `?v=` dropped at once, a `.pak` unused `PAK_UNUSED_MS` dropped, then LRU past `ROOM_CAP_BYTES` (`roomEvict`) |
| `island-villagers-v1` | villagers', critters', finds', ground's and decor's art | LRU past `ART_CAP_BYTES` |
| `island-listen-v1` | ききみみ's audio ([kikimimi-engine.md](kikimimi-engine.md#playback)) | cache-first, never revalidated, outlives builds; a Range request passes to the network (`listenEvict`) |
| `island-stt-v1` | the whisper model and runtime under `/stt/` ([kikimimi-mic.md](kikimimi-mic.md#hosting-and-the-service-worker)) | filled by the page after the mic opt-in (`lib/mic/models.ts ensureStt`); the worker only serves it |
| `island-audio-v1` | sounds and music | cache-first, never revalidated, an LRU per class |
| `island-food-v1`, `island-food-img-v1` | the food data, ごはん's pictures ([food-data.md](food-data.md#pictures)) | cache-first by version, `index.json` network first (`foodImgEvict`) |
| `island-photos-v1` | photos | stale-while-revalidate once a day old (`swrFetch`), `PHOTO_CAP_BYTES`; a failed one is the paper placeholder (`ui/photoFallback.ts`) |
| `island-tiles-v1` | OpenFreeMap, USGS, GSI tiles | stale-while-revalidate past `TILE_FRESH_MS`, bounded (`bytesEvict`); fetched by the page (`travel/map/tiles.ts`: WebKit's worker doesn't see MapLibre's worker's fetches) |
| `island-offline-<id>` | a saved map area and its manifest | kept until deleted on the phone |

Fonts and art are cache-first; other GETs: this version's cache, the previous one, the network. The relay is
cross-origin and always live.

- **Offline:** what a phone has shown once reads offline; nothing is prefetched unasked (`e2e/offline.spec.ts`
  checks each kind). Precached (`scripts/load-budget.ts` `PRECACHE`): the common font slices
  (`PRECACHED_FONT_SLICES`), each trip's cover and the trail tracks. MapLibre, ききみみ's parts and what a phone may
  never open (vite.config.ts `feature-names`) go into this version's shell when first loaded and are carried on by each
  install (`carryPlan`); offline they import only if a shell holds them (`travel/map/cached.ts`, `pool.ts`), else
  オフラインです. The installed app asks `navigator.storage.persist()` once, after its first good sync
  (`sync/persist.ts`).
- **Saved areas** ([design](design.md#offline-maps)): `lib/offline/plan.ts` (pure) sizes an area by measured means per
  source and zoom (offline-measure.ts `--full` at the `probes` tag; within ±20 %, plan.test); `lib/offline/save.ts`
  fetches it with a manifest, resumable (「一部のみ」); caps `OFM_MAX_TILES`, `OFM_MAX_BYTES`, `TOTAL_CAP_BYTES`;
  `island.offlineAreas` mirrors the manifests, so an area Safari evicted shows 「消えました」.

## Tests
`relay/test/store.test.ts`, `store-route.test.ts`, `ingest-golden.test.ts` (the record on node:sqlite),
`parse.test.ts`, `restore.test.ts`, `compact.test.ts`; the app's queue (`queue-batch.test.ts`), cache, sync and store
tests; the golden fixtures (`GOLDEN_UPDATE=1` to regenerate) and `npm run bench` for the model at year-3 volume
([perf.md](ops/perf.md) "Budgets").
