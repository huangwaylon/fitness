# 旅行 (trips)

The travel guides (Okinawa, Seattle, New Zealand, Zao). The UI is [design.md §Trips](design.md#trips); this file is the
data, the relay's part and the map.

## Rules
- Everyone edits the packing list, the guest too; ticks are **per person**; no ベル tie-in.
- Booking references, full names and personal URLs never enter the repo: they are trip notes on the relay.
- Maps: MapLibre on OpenFreeMap ([decisions](decisions.md#the-trip-map)); the position never leaves the phone; nothing
  downloads ahead unless asked.
- A trip that's over is read-only (`components/travel/when.ts readOnly`).

## Content
`app/src/lib/travel/trips/<id>.ts` (okinawa, seattle, nz, zao), loaded by `loadTrip(id)`, edited by hand;
`trips.test.ts` pins each trip's counts and fails an ID-like run outside `{p:}`.

### Data shape
[`types.ts`](../app/src/lib/travel/types.ts). Guide text `{ja?, en?}` (the reader's locale, else the other); chrome in
`i18n/travel.{ja,en}.json`. Tokens (`travel/tokens.ts`): `{km:}`, `{m:}`, `{c:}` follow the device's units; `{p:key}` is
a private value. Each trip's dates and `tz` drive "today"; `dayColors` one a day.

### Rows
Each day row has a `kind` (`RowKind`): `stop`, `stay` (`booked`: else 「未予約」), `leg` (`go` gives the way and minutes
where no routed `Leg` does), `event`, `flight`, `sun`. A note never repeats a leg's minutes or km (`LEG_ECHO`); a
gloss follows 「 — 」 (`itinerary.ts DASH`).

## Itinerary
`lib/travel/itinerary.ts itinerary(trip, locale)`: days, their stops, legs and stay. `TripView` holds the day and stop
that 日程 and 地図 hand each other (地図で見る / 日程で見る); 日程's lines are `components/travel/ledger.ts`.

### Private values
One `trip_note` row a trip on the record (whole `v`, latest `at` wins; backed up nightly). Unset keys show 🔒 ・・・.
List the keys with `node scripts/record.ts dump` (filter `trip_note`); set a note by `record.ts load` of a 600-mode
`/tmp` file holding one `trip_note` event with **every** key (the row replaces the note) and a fresh id, then `rm` it.

| trip | keys |
|---|---|
| okinawa | `flightRef`, `ticket`, `carRef`, `onboardingUrl`, `traveller1` |
| nz | `flightRef`, `expediaRef`, `traveller1`, `traveller2` |
| hiking | `kinpu`/`akigawa`/`ono` + `PlanUrl`, `Party`, `Planner` ([hiking.md](hiking.md)) |

## Packing list (relay)
Contract `contract/pack.ts` (relay and phones); store `components/travel/packing.svelte.ts`; rows `pack`, `pack_chk`,
`pack_reset` ([backend](backend.md#events)). The trip's `packing` seeds until an op touches an id; a set replaces an
id's state, `rm` hides it for good; latest `at`, then G > B > A. `ord` fractional (`ordBetween`); seeds only append. A
tick holds when a person's latest `pack_chk` is `v: 1` after their `pack_reset`. Caps: 300 items, 300 ticks a person.

## Maps
`components/travel/whole/`: `AllDaysMap.svelte` (one map a trip page, kept while hidden; also /s), lazy `engine.ts`,
`style.ts`, `logic.ts`; shared core in `components/map/` ([design](design.md#maps)). Tiles: `BASEMAP`
(OpenFreeMap), the only map third party (CSP). Overlays: legs in the day's colour, stops (others faded), Okinawa's
candidates, saved places within 2 km of the day's path (never on /s). States (`data-mode`): loading, ready, offline,
failed, lost. Locate: permission on the first tap; over 50 km from every stop the map stays on the route.

## Photos
`static/travel/<trip>/`: WebP ≤ 720 px, lazy; a failed one is the paper placeholder (`ui/photoFallback.ts`).

## Sharing
共有リンク `/s#<token>` shows the **whole trips page** read-only without a key until it expires (1週間–1年, renewable) or
is turned off ([decisions](decisions.md#trips-and-offline)); kinds in `contract/share.ts`. Shown: guides, packing (no
ticks), non-private note values; never `{p:}` values or who packed what. The relay builds it (`sharedTrips`, ≤ 200 KB,
`redactPrivate`, fail closed). `/s` is its own noindex shell without a service worker or key.

### The relay's part
`relay/src/share.ts`, own tables `share`, `share_visit` (≤ 500 a link), `share_seen` (daily-salted hashes). `/api`:
`share_list`, `share_make` (20 a ref, 100 in all), `share_set`, `share_visits`. `POST /share {t}` (no key): our origin
only, `gone` or `busy` (429) on rate caps. A visit: not a bot, not our phone, not the same visitor in 30 min; kept
minute, device class, country, hash; no IP, UA or cookie. The 03:00 cron deletes links 90 days after they end.

## Offline
Caches: [backend](backend.md#service-worker); plan `lib/offline/plan.ts` (≤ 3,000 tiles and 50 MB an area), saved from
設定 › オフライン地図; past 30 days 更新.

## Open
- Unchecked on a real iPhone: `text-wrap: pretty`, offline maps on Metal, 日程's lazy days on a fast flick.
- No map night tint; packing has no icon picker, note editing or cross-category moves.

## Trip facts
Each trip module's header holds its verified facts. **Place links:** a real place, never a coordinate (Evertrail's
Google link, `maps/place//data=!4m2!3m1!1s<FID>`, else `?api=1&query=`); never invent an FID; `?cid=` fails silently.
Seattle is English only, no map; its hikes open トレイル ([hiking](hiking.md#entry)).
