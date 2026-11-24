# 旅行 (trips)

The travel guides (Okinawa, Seattle, New Zealand, Zao) in 「旅行」. The UI is [design.md §Trips](design.md#trips); this
file is the data, the relay's part and the map.

## Rules

- Everyone edits the packing list, the guest too; ticks are **per person**. No ベル tie-in.
- Booking references, full names and personal URLs never enter the repo: a trip note on the relay, read and written by
  all three keys.
- Maps: MapLibre on OpenFreeMap vector tiles (not Protomaps on R2: decisions.md "The trip map"). The position never
  leaves the phone. Nothing downloads ahead unless asked (設定 › オフライン地図).
- A trip that's over is read-only (`components/travel/when.ts` `readOnly`): its packing list frozen as left.

## Content

`app/src/lib/travel/trips/<id>.ts` (okinawa, seattle, nz, zao), loaded by `trips/index.ts` `loadTrip(id)`; edited by
hand. `trips.test.ts` pins each trip's counts (stops, campsites, packing) and fails an ID-like run outside `{p:}`.

### Data shape

Schema: [`types.ts`](../app/src/lib/travel/types.ts). Guide text is `{ja?, en?}`, shown in the reader's locale, else
the other; chrome strings in `i18n/travel.{ja,en}.json`. Tokens (`travel/tokens.ts`): `{km:}`, `{m:}`, `{c:}` follow the
device's units; `{p:key}` is a private value. Each trip's dates and `tz` drive "today".

### Private values

Only in the record: one `trip_note` row a trip (its whole `v`; the latest `at` wins); the nightly dump is the backup
([runbook §6](ops/runbook.md#6-backups)). Unset keys show 🔒 ・・・.

- **See the keys** (names only), from `relay/`: `node scripts/record.ts dump | jq -c '.rows.events[] |
  select(.[3]=="trip_note") | [.[2], (.[4] | fromjson | .trip, (.v | keys))]'`.
- **Set a note:** a file (mode 600, under `/tmp`) `{"rows":{"events":[["<ISO now>","A","tn-<trip>-<base36
  ms>","trip_note","{\"trip\":\"<trip>\",\"at\":<ms>,\"v\":{…}}"]]}}` with *every* key of the trip (the row replaces
  the note), then `node scripts/record.ts load <file>` and `rm` it. A new id each time (a load skips ids it has).

| trip | keys |
|---|---|
| okinawa | `flightRef`, `ticket`, `carRef`, `onboardingUrl`, `traveller1` |
| nz | `flightRef`, `expediaRef`, `traveller1`, `traveller2` |
| hiking | `kinpu`/`akigawa`/`ono` + `PlanUrl`, `Party`, `Planner` ([hiking.md](hiking.md)) |

## Packing list (relay)

Contract `app/src/lib/contract/pack.ts` (shared by `relay/src/store.ts` and the phones); the phone's store
`components/travel/packing.svelte.ts`. Row types `pack`, `pack_chk`, `pack_reset`, `trip_note`:
[backend.md#events](backend.md#events).

- The trip data's `packing` is the seed until an op touches an id; a set replaces an id's whole state, `rm` hides it
  for good (with its ticks). Latest `at` wins, then G over B over A; ops are stamped on the relay's clock.
- `ord` is fractional (`ordBetween`). A seed's `ord` is its index: edit seeds only by appending, never reorder.
- A tick is packed for whoever's latest `pack_chk` is `v: 1` and later than their own `pack_reset`.
- Caps: 300 standing items a trip (`pack full`), 300 ticks a trip and person.

## Maps

`components/travel/map/`: `TripMap.svelte`, `engine.ts` (lazy chunk), `style.ts`, `overlay.ts` (pins, legs,
candidates). The shared core (basemap, fonts, location dot, `LocateDisc`, `askAgain.ts`, `cached.ts`) is
`components/map/` ([design.md](design.md#maps)).

- **Source:** `components/map/style.ts` `BASEMAP`, `https://tiles.openfreemap.org/planet`: the only third party the
  phones contact for maps (CSP `connect-src`); it sees the IP and area, never the trip.
- **Overlays:** the day's legs by mode, numbered stop pins (within 30 m merged), Okinawa's candidates; saved places
  within 2 km of the day's path via `PlacesLayer` (never on /s: `load-budget.ts` checks).
- **States** (`data-mode`): `loading`, `ready`, `offline` (route only), `failed` (もう一度), `lost` (WebGL context).
- **Locate:** permission on the first tap; over 50 km from every stop the map stays on the route
  (「旅先から離れています」). Refused: MS.refused; asked again per launch unless Safari allows: MS.again.

## Photos

`static/travel/<trip>/`: WebP ≤ 720 px wide, lazy (the hero eager). A failed photo is the paper placeholder
(`components/ui/photoFallback.ts`).

## Sharing

共有リンク: `https://island-fund.pages.dev/s#<token>` shows the **whole trips page** read-only to someone without a key
until it expires (1週間 · 1か月 · 3か月 · 1年, renewable, never unlimited) or is turned off. Contract
`contract/share.ts` (kind registry; `trip` links are still read, no longer made).

- **Shown:** every trip's guide, packing list (no ticks) and the note's non-private values. **Never:** `{p:}` values,
  who packed what, any other feature.
- The relay builds the snapshot (`sharedTrips`, ≤ 200 KB), dropping `SHARE_PRIVATE_NOTE_KEYS` and private-sounding keys
  and redacting every record text (`contract/private.ts` `redactPrivate`); fail closed.
- The token stays in the fragment; `/s` is noindex, its own shell (`build-pages/s.html`), no service worker, no key. With no worker to
  give up for it, a guide's chunk that takes over 10 s (`trips/index.ts TRIP_WAIT_MS`) falls to the page's offline/もう一度.

### The relay's part

`relay/src/share.ts`, own tables (not events, which reach the guest's phone): `share` (link, token, expiry, counters),
`share_visit` (≤ 500 a link), `share_seen` (the day's visitor hashes, emptied at Tokyo midnight with the salt).

- **API** (`/api`, any key, online only): `share_list`, `share_make` (20 live a ref, 100 in all), `share_set`,
  `share_visits` (last 50).
- **`POST /share`** (no key, `{"t": token}`): the Worker refuses other origins and bodies over 256 chars; `gone` for
  off, expired or unknown; `busy` (429) past 30 reads/min or 20 misses/hour a visitor, or 600 reads/min in all.
- **A visit:** an `ok` read, not a bot, not our phone, not the same visitor within 30 min. Kept: minute, device class,
  country, a daily-salted hash; no IP, UA or cookie.
- The 03:00 cron deletes links 90 days after they ended. Dumps carry `share` and `share_visit`; a restore to before a
  revocation revives the link. Log `share {op, kind, ok, why, ms, n}`, never the token.

## Offline

Caches: backend.md "Service worker"; plan: `lib/offline/plan.ts` (within OpenFreeMap's 3,000 tiles and 50 MB an area).
Saved from 設定 › オフライン地図 (`components/travel/OfflineMaps.svelte`), a row a trip; past 30 days 更新.

## Open

- Unchecked on a real iPhone: `text-wrap: pretty`, hero crops, offline maps on Metal.
- No map night tint; packing has no icon picker, note editing or cross-category moves.

## Trip facts

Bind edits to the trip modules; each module's header holds its verified facts and decisions. **Place links:** a real
place, never a coordinate: campsites the Evertrail directory's `Google maps` link, venues
`https://www.google.com/maps/place//data=!4m2!3m1!1s<FID>`, else `?api=1&query=<name>`. Never invent an FID;
`maps.google.com/?cid=` links fail silently. Seattle is English only, no map; its hike cards open トレイル
([hiking.md](hiking.md#entry)).
