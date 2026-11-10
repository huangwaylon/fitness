# りょこう (trips)

The three travel guides (Okinawa, Seattle, New Zealand), ported from `~/Documents/other/travel-plans` into one area,
「りょこう」. The UI is [design.md §Trips](design.md#trips); this file is the data, the relay's part and the map.

## Decisions

- The guides are dense reading cards (design.md §Trips bends the screen rules for them); the UI is polished, not a port.
- The packing list is shared on the relay; ticks are **per person**; the guest views, ticks and adds, and edits or
  removes only what it added; the members edit everything.
- Booking references, full names and personal URLs never enter the repo: they are a trip note on the relay, read by
  **all three keys** (the guest too).
- Maps: MapLibre GL JS on OpenFreeMap's public vector tiles in our own NookPhone style (no self-hosting for now;
  Protomaps on R2 rejected: decisions.md "The trip map"). No terrain shading. Offline: see "Offline" below.
- A "you are here" dot; **the position never leaves the phone** (never logged, sent or kept).
- Nothing downloads ahead of time unless asked (「オフライン用に保存」); what was seen is kept ("Offline").
- A km / mi switch per device. No ベル / economy tie-in.

## Past trips

Every trip is drawn by the unified kit (`TripView`; design.md §Trips): Okinawa's campsites and candidate layers and
Seattle's hikes are pages and cards of it. A trip that's over is **read-only**, one rule for all (`when.ts`
`readOnly`: its phase is past): its packing list is frozen as everyone left it (`packing.frozen`: the live list's
fold of the record's rows, who packed what shown, no Tick or 編集, nothing sent), nothing else on it changes. Okinawa and Seattle are over (no relay rows: their seed); NZ will be after its
flight home.

## Content

| Trip | Dates (local) | tz | Days | Has |
|---|---|---|---|---|
| okinawa (ja + en) | 2026-10-10 → 10-12 | Asia/Tokyo | 3 | logistics, map (23 stops; candidates 26 camp / 9 nature / 11 food), 35 campsites, packing 6 / 35 |
| seattle (en only) | 2026-07-02 → 07-19 | America/Los_Angeles | 18 (8 hikes) | packing 4 / 19; no map |
| nz (en + ja) | 2027-02-11 → 02-16 (flight out 02-17 00:10) | Pacific/Auckland | 6 | logistics, map (39 stops), packing 6 / 29 |

`trips.test.ts` pins these counts against the source. The trip facts at the end of this file bind every edit.

### Data shape

`app/src/lib/travel/`: one module per trip (`trips/<id>.ts`, `trips/index.ts` `loadTrip(id)`), loaded only with the
sheet; the modules are the source now (edit them by hand). The schema is [`types.ts`](../app/src/lib/travel/types.ts).
Guide text is a pair `{ja?, en?}` in the data (not catalog keys), shown in the reader's locale, else the other side;
the chrome's strings are `i18n/travel.{ja,en}.json`. Inline tokens (`tokens.ts`): `{km:}`, `{m:}`, `{c:}` follow the
device's units; `{p:key}` is a private value. A logistics card's icon is the old site's lucide name, drawn by ui/Icon
(trips.test checks they're all in it; a packing category's is its NH item where packView.ts has one). Each trip's dates and `tz` drive "today" (`DayRow.dd`: a row on the eve or the morning
after).

### Private values

Kept in `~/Documents/island-backups/trip-notes.json` (mode 600, never the repo) and loaded onto the relay as `trip_note`
rows with the admin `load` (`trip-notes.load.json` beside it; relay/scripts/record.ts). The guide holds `{p:key}`
tokens; until the note is in, each shows 🔒 ・・・. Public business addresses and phone numbers stay in the content.

| trip | keys |
|---|---|
| okinawa | `flightRef` (Solaseed booking), `ticket` (e-ticket number), `carRef` (Evertrail booking, shown as `#{p:carRef}`), `onboardingUrl` (a Link's `href`), `traveller1` |
| nz | `flightRef` (Air NZ confirmation), `expediaRef` (Expedia itinerary), `traveller1`, `traveller2` (passport names) |

## Packing list (relay)

Built like the board (docs/board.md): one op per thing. The contract is `app/src/lib/contract/pack.ts` (the record's
`relay/src/store.ts` and the phones share it), the phone's store `components/travel/packing.svelte.ts`. The four row
types and their wire limits: [backend.md#events](backend.md#events) (`pack`, `pack_chk`, `pack_reset`, `trip_note`).

| Rule | |
|---|---|
| The seed | The trip data's `packing` is the list until an op touches an id; a set replaces an id's whole state, `rm` hides it. Seed ids are nobody's. |
| Merge | The latest `at` wins, then G over B over A; a removal is final and takes the item's ticks; an item whose category is gone is hidden with it. |
| Ownership | An id an op made (`_` + base36) is its creator's (`by`, carried on every set). Members change anything; the guest only ids it made. |
| The guest's category | The guest edits or removes a category of its own only while every item in it is its own too (`packMayEdit`: the phone's ✎ and the record alike). |
| Order | `ord` is fractional: a move goes between its new neighbours (`ordBetween`), a new one last. When no float is left between them, the siblings are renumbered 0, 1, 2 … (only if all are mine to change, else the move is refused). |
| Seed edits | A seed's `ord` is its index, so a list in use only grows at the ends (a new item last in its category, a new category last); never reorder a seed. |
| Ticks | Per person: an item is packed for whoever's latest `pack_chk` is `v: 1` and later than their own `pack_reset`. |
| Clock | Every op is stamped on the relay's clock (`world.serverNow()`, never a `?date=` preview's), after the op it replaces. |
| Caps | 300 `pack` items standing a trip (removals uncounted, never dropped; else `pack full`), 300 ticks a trip and person. |
| The phone | `packFold` takes the record's rows as they are and judges this phone's queued ones by the record's rules, so the list shows what the record will. |

The demo has a made-up note for each trip and うめ's ticks on NZ's list (a past trip's list shows it frozen).

## Maps

`components/travel/map/`: `TripMap.svelte` (light; mounted by `MapPane.svelte`), `engine.ts` (MapLibre, its own lazy
chunk), `style.ts` (the source and the stack), `basemap.ts` + `theme.ts` (our layers on the OpenMapTiles schema, the
NookPhone palette), `overlay.ts` (pins, legs, candidates, the location dot), `fonts.ts`, `geo.ts`, `glmap.ts` (what
the map shows, and `removeMap`), `cached.ts`, `tiles.ts`.

- **Source:** `style.ts` `BASEMAP`, OpenFreeMap's planet TileJSON (`https://tiles.openfreemap.org/planet`). The one
  third party the phones contact, in the CSP's `connect-src` only (no `img-src` / `font-src` change): it sees the
  phone's IP and the area viewed, never the trip. Attribution always shown, small in the corner.
- **Worker:** MapLibre's worker bundled as our own file (`?worker&url`, `setWorkerUrl`): no `blob:` worker, no eval.
- **Fonts:** every label in the app's Zen Maru Gothic Bold from the style's `font-faces` (the @fontsource slices we
  ship, fetched only when a label needs one); the style has no glyphs URL. A character no slice covers is drawn in a
  local font.
- **Overlays:** the day's legs in its colour (drive and bus solid, walk dashed, boat dotted) over the roads and under
  the labels; the stops as numbered HTML pins, stops within 30 m **merged into one pin** (「2·6」: New Lynn), the
  selected one raised and tagged with its name; a `keepout` symbol per pin so basemap labels give way; Okinawa's
  candidates as circles behind MapPane's layer button (off at first).
- **States** (`data-mode`): `loading`, `ready`; `offline` (drawn, no basemap tile came: the route alone, with
  「地図はオフライン — ルートのみ」); `failed` (the chunk or WebGL didn't come: 「地図を読み込めません」 + もう一度; offline
  the chunk is asked for only if the service worker holds it, `map/cached.ts`, and it draws by itself when the phone
  is back online); `lost` (iOS took the WebGL
  context, till restored). `removeMap` on unmount (glmap.ts: the style's font faces go too).
- **Locate:** the button asks permission the first time it's tapped (`geolocation=(self)`); the first fix flies the
  map there (zoom ≥ 14), unless the phone is more than 50 km from every stop: then the dot shows where it is, the map
  stays on the route and 「旅先から離れています」 shows for 8 s. Tapped again while on: back to the dot (or the route if
  far). Refused: 「位置情報がオフです」 with the Settings path. The watch runs only while the map is on screen and
  the tab shown.

## Photos

`static/travel/<trip>/` (WebP ≤ 720 px wide: each trip's `hero` and `cover`, Okinawa's 26 campsites and the dive boat,
Seattle's 8 hikes). Loaded lazily as a trip is read (the hero eagerly). A photo that can't load (offline, never seen)
is the paper with a small picture icon (`ui/photoFallback.ts`, on every `<img>` of the guides), never WebKit's "?".

## Offline

(docs/backend.md "Service worker" › Offline.) After one visit online the trips read offline: the
text, 持ち物 (ticks queue till back), each trip's cover (precached, with the trails' tracks), its hero once seen, every
photo already seen (`island-photos-v1`). The map draws offline once it has drawn on the phone: MapLibre is kept in the
shell, and the tiles it drew (`island-tiles-v1`, 60 MB, least recently used out; OpenFreeMap's tiles fetched by the
page, `map/tiles.ts`, as WebKit's service worker doesn't see MapLibre's worker's fetches) with the TileJSON
(`island-map-meta-v1`). Where no tile was kept: the route with 「地図はオフライン — ルートのみ」. Nothing is prefetched.

Every trip with a map (Okinawa, NZ: past ones too, read-only otherwise) has
「オフライン用に保存」 over its map (design.md "Offline maps"); nothing downloads by itself. The plan's zooms are
`lib/offline/plan.ts`'s header (`planTrip`). Sizes: **NZ 438 tiles, 20.4 MB** (Auckland's z14 tiles are ~145 KB), **Okinawa 310 tiles,
7.6 MB**; both well inside OpenFreeMap's ≤ 3,000 tiles and ≤ 50 MB an area.
Offline with it saved, the map says 「保存した範囲のみ」.

## Open

- Not yet checked on a real iPhone (Safari's `text-wrap: pretty`, the hero crops, the map on Metal).
- The map has no night tint (the day palette at every hour).
- Offline (onLine still true) with no worker in control, then back: WebKit's failed modulepreloads still fail the
  import, もういちど reloads, and the new page's first tap can get the old page's failures again (`lazySheet.svelte.ts`).
  Not seen on the phone: there the worker serves the chunk.
- Offline maps on the phone: `e2e/offline.spec.ts` checks them in Chromium (a drawn map offline from the caches) and
  the tiles kept in Playwright's WebKit by hand; not yet on an iPhone.
- Packing: no icon picker (a new category is always the shopping bag), no note editing, no moving an item to another
  category.

## Trip facts (from TRIPS.md)

From the old repo's `TRIPS.md`: the facts the markup can't show, what was verified, and the
decisions that would otherwise get undone by accident. They bind edits to the trip modules too. Private values are
named by their `{p:}` keys.

### Place links

Every link points at a real place, never a coordinate: campsites use the Evertrail directory's own `Google maps` field,
named venues use `https://www.google.com/maps/place//data=!4m2!3m1!1s<FID>`, and a place Google can't resolve to one
match uses `?api=1&query=<name>` instead. **Never invent an FID**: a query link is the right answer when there is no
single match. `https://maps.google.com/?cid=…` no longer works (it looks right and fails silently). Gaps already
accepted: 比地大滝 130 m and 崎本部緑地 45 m (place pin vs OSM node), ター滝 ~625 m (falls vs trailhead), 古宇利島 (the
island's centroid).

### Okinawa 2026 (Oct 10–12, ja with en)

In `trips/okinawa.ts`'s header: the car's office, nature not sights, the two campsites, the dives' day,
the split cafe and Ufuya, Day 3's tide-pool run and Day 1's arrival, drive times, the jellyfish rule, what's verified
and unverified, two corrected claims, and the Evertrail campsites.

### Seattle 2026 (Jul 2–19, en only)

- Restored in the old repo from its last state before it was rebuilt around Okinawa: kept so the trip is not lost, not
  because it is being planned (it is in the past).
- Hike data from WTA and AllTrails; a hike card opens its trail in トレイル (`hikeSlugOf`, [hiking.md](hiking.md#entry)),
  else links out to the old [hiking-trails site](https://huangwaylon.github.io/hiking-trails/).
- Only the itinerary and the packing list: no map, no campsites. English-only by design; only the chrome follows the
  language.

### New Zealand 2027 (Feb 11–16, en with ja)

In `trips/nz.ts`'s header: the flights, the New Lynn base, why Taranaki is days 3–4 and Taupō a
not-scheduled card, the tarns' sunrise timing, drive times, spellings, what's verified, unverified and still to book, and
the border facts.
