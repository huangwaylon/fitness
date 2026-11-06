# りょこう (trips)

The three travel guides (Okinawa, Seattle, New Zealand), ported from `~/Documents/other/travel-plans` into one area,
「りょこう」. The UI is [design.md §Trips](design.md#trips); this file is the data, the relay's part and the map.

## Decisions (the user, 2026-11-06)

- The guides are dense reading cards (design.md §Trips bends the screen rules for them); the UI is polished, not a port.
- The packing list is shared on the relay; ticks are **per person**; the guest views, ticks and adds, and edits or
  removes only what it added; the members edit everything.
- Booking references, full names and personal URLs never enter the repo: they are a trip note on the relay, read by
  **all three keys** (the guest too).
- Maps: MapLibre GL JS on OpenFreeMap's public vector tiles in our own NookPhone style, **online only** (no download,
  no self-hosting for now; Protomaps on R2 rejected: decisions.md "The trip map"). Neither MapLibre (chunk, worker,
  CSS) nor anything under `travel/` is precached. No terrain shading.
- A "you are here" dot; **the position never leaves the phone** (never logged, sent or kept).
- Past trips download nothing ahead of time (no offline maps, no photo prefetch).
- A km / mi switch per device. No ベル / economy tie-in.

## Classic guides (the user, 2026-11-06)

Okinawa and Seattle are over: `classic: true` on their data opens them as the old travel-plans site showed them
(`components/travel/classic/ClassicGuide.svelte`), not in the app's style: the site's stylesheet ported under one root
class (`classic.css`, `.classic …` only; `.card`/`.chip` renamed against the app's globals), its icons (`icons.ts`),
the hero with 本棚 back to the list, the spine day cards (`Day.look`: an itinerary day open, a flight day ringed, a
hike filled), the logistics cards, the campsites (one criterion at a time, as the site's), the bottom tab bar. The
map tab is the site's map card with the app's live TripMap in it (online only: Okinawa's offline maps are gone; day 0
= 全3日間). The packing list is **frozen**: the seed as it is, no boxes, no edits, nothing read from or sent to the
relay. The guide's own words are in its language (Seattle's English), the tab bar and 本棚 in the reader's.
`e2e/travel-classic.spec.ts`.

## Content

| Trip | Dates (local) | tz | Days | Has |
|---|---|---|---|---|
| okinawa (ja + en) | 2026-10-10 → 10-12 | Asia/Tokyo | 3 | logistics, map (23 stops; candidates 26 camp / 9 nature / 11 food), 26 campsites, packing 6 / 35 |
| seattle (en only) | 2026-07-02 → 07-19 | America/Los_Angeles | 18 (8 hikes) | packing 4 / 19; no map |
| nz (en + ja) | 2027-02-11 → 02-16 (flight out 02-17 00:10) | Pacific/Auckland | 6 | logistics, map (39 stops), packing 6 / 29 |

`trips.test.ts` pins these counts against the source. The trip facts at the end of this file bind every edit.

### Data shape

`app/src/lib/travel/`: one module per trip (`trips/<id>.ts`, `trips/index.ts` `loadTrip(id)`), loaded only with the
sheet; the modules are the source now (edit them by hand). The schema is [`types.ts`](../app/src/lib/travel/types.ts).
Guide text is a pair `{ja?, en?}` in the data (not catalog keys), shown in the reader's locale, else the other side;
the chrome's strings are `i18n/travel.{ja,en}.json`. Inline tokens (`tokens.ts`): `{km:}`, `{m:}`, `{c:}` follow the
device's units; `{p:key}` is a private value. Icons are the old site's lucide names: ui/Icon draws a
kit guide's (trips.test checks they're all in it; a packing category's is its NH item where packView.ts has one), `classic/icons.ts` a classic guide's. Each trip's dates and `tz` drive "today" (`DayRow.dd`: a row on the eve or the morning
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
| Caps | 300 `pack` rows a trip (past them the oldest removal of an op-made id is dropped, else `pack full`), 300 ticks a trip and person. |
| The phone | `packFold` takes the record's rows as they are and judges this phone's queued ones by the record's rules, so the list shows what the record will. |

The demo has a made-up note for each trip and うめ's ticks on NZ's list (the classic guides' lists are frozen).

## Maps

`components/travel/map/`: `TripMap.svelte` (light; mounted by `MapPane.svelte` and the classic `CMap.svelte`), `engine.ts` (MapLibre, its own lazy
chunk), `style.ts` (the source and the stack), `basemap.ts` + `theme.ts` (our layers on the OpenMapTiles schema, the
NookPhone palette), `overlay.ts` (pins, legs, candidates, the location dot), `fonts.ts`, `geo.ts`.

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
  candidates as circles behind the classic map's layer chips (off at first).
- **States** (`data-mode`): `loading`, `ready`; `offline` (drawn, no basemap tile came: the route alone, with
  「地図はオフライン — ルートのみ」); `failed` (the chunk or WebGL didn't come: 「地図を読み込めません」 + もう一度; offline
  the chunk isn't even asked for, and it draws by itself when the phone is back online); `lost` (iOS took the WebGL
  context, till restored). `map.remove()` on unmount.
- **Locate:** the button asks permission the first time it's tapped (`geolocation=(self)`); the first fix flies the
  map there (zoom ≥ 14), unless the phone is more than 50 km from every stop: then the dot shows where it is, the map
  stays on the route and 「旅先から離れています」 shows for 8 s. Tapped again while on: back to the dot (or the route if
  far). Refused: 「位置情報がオフです」 with the Settings path. The watch runs only while the map is on screen and
  the tab shown.

## Photos

`static/travel/<trip>/` (WebP ≤ 720 px wide: each trip's `hero` and `cover`, Okinawa's 26 campsites and the dive boat,
Seattle's 8 hikes). Not precached (`caches.ts` `isTravel`); loaded lazily as a trip is read (the hero eagerly), from
the network and the browser's HTTP cache. There is no prefetch, for any trip.

## Open

- Not yet checked on a real iPhone (Safari's `text-wrap: pretty`, the hero crops, the map on Metal).
- The map has no night tint (the day palette at every hour).
- Offline, then back: in Playwright's WebKit the pill's import can still fail after もういちど's reload (no request
  made; `travel.spec` "offline before the first opening" fails about half its WebKit runs). Check on the phone.
- Packing: no icon picker (a new category is always the shopping bag), no note editing, no moving an item to another
  category.

## Trip facts (from TRIPS.md)

Copied from the old repo's `TRIPS.md` (2026-11-06): the facts the markup can't show, what was verified, and the
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

- **The car** is collected at the Evertrail office in **Okinawa City**, not the airport: bus 111 or 117 from Naha,
  ~1 h, ¥1,330 pp, off at Okinawa Kita IC, then a 10-min walk or a free pickup arranged by email. It goes **back to the
  same office**, so the bus is a round trip (¥5,320 for two, both ways; Evertrail's ¥10,000 shuttle only runs
  10:30–16:00 and can't cover the return).
- **Nature, not sights:** waterfalls, capes, beaches, reef; explicitly **not** shopping, souvenirs, crowds, caves or
  historical sites (American Village, the pottery village and the Blue Cave were removed: don't reintroduce them).
- **Night 1 is 津波の浜 (Tsuha Beach), Ogimi**: FID `0x34e451fcff4be511:0xb14dc065a51cd933`, (26.65669, 128.09269), what
  the itinerary and map use. Evertrail's "Tsuha Beach Camp Spot" (26.6615, 128.1015, by the michi-no-eki, in 宮城) is
  ~1 km north-east and carries the 「1泊目」 chip as the nearest listing; confirm the pitch with Evertrail. Wild camp:
  toilets, no showers.
- **Night 2 is あざまサンサンビーチ (Azama Sun Sun Beach), Nanjo**: FID `0x34e571f35ecd6173:0x79be19cfdb7ae1e4`,
  (26.17810, 127.82925), OSM within 7 m. Paid, toilets, showers, six BBQ pavilions, mown lawn, sunrise over Kudaka
  Island, 47 min from the office. Both campsites carry a 「1泊目」 / 「2泊目」 chip in the campsite list.
- **Day 2 is two scuba dives, then the drive south.** Dive Nuts' ボート体験ダイビング＆シュノーケルセット with the snorkel
  swapped for a second dive: 08:00 at the shop, done 13:00, 30–40 min under each, ¥17,000 each (¥34,000 for two). Leave
  Tsuha by 06:50 (44 min to the shop). Phone bookings are suspended: email or LINE only. The flight home is ~32 h after
  the second dive, past the usual 18 h after more than one dive. **The dive stays on Day 2**: it is the one fixed point.
- **Ufuya (百年古家 大家) and Okinawa Milk Farm Cafe are both required, so they are split across two days** (a soba lunch
  and a kakigori 80 minutes apart was too much). The cafe is on **Day 1**, 1 min from タウンプラザかねひで大宮市場
  (07:00–23:00), straight into the grocery stop; Ufuya stays on Day 2 as the meal after the boat.
- **Day 3 runs west along the south coast** (night 2 is in the south): Chinen Misaki Park (4 min from the campsite) →
  浜辺の茶屋 at Mibaru → Odohama Beach → Cape Kyan → the Gushikawa tide pool, 3 min from Cape Kyan. The old west-coast
  trio (Cape Zanpa, Senaha Beach, Banta Cafe) came off: from Azama a two-hour detour *away* from the tide pool, and the
  tide fixes the day (Banta Cafe stays a food candidate).
- **Day 3 ends at the Gushikawa tide pool, not the onsen.** The pool exists only around low tide; Oct 12 2026's
  afternoon low at Naha is **14:53** (JMA), what the 13:50 arrival is built on. Ryujin-no-yu came out: the car goes back
  to Okinawa City, 41 min *north*, before the office shuts at 18:00. Access to the pool was closed in 2020 with no
  published end date: check for a notice. Day 3 has no diving.
- **Day 1 reaches camp by 15:00**, so the BBQ starts at 17:00 and runs into the 18:05 sunset at Tsuha (computed for the
  beach; NAOJ's Naha table gives 18:07). フンガー滝 (Hunga Falls, Makiya) came off the day for that: don't put it back
  without moving the arrival.
- **Drive times** are OSRM free-flow, per leg (what the map draws), and every gap in the itinerary clears its drive by
  **26 min or more** (several Day 1 and 2 gaps at exactly 26). The long one is Ufuya → タウンプラザかねひで佐敷店 (the Day 2
  grocery stop), 73.6 km / 81 min down the island on the Sunday of a three-day weekend: the row says add 20–40 min.
  Campsite-list times are free-flow too; Koki's coordinate snaps to the expressway, so its figure is unreliable.
- **Jellyfish first aid is species-dependent.** Vinegar is right for habu-kurage and makes a Portuguese man o' war
  sting **worse**. Never simplify that bullet into generic "use vinegar" advice.
- **Verified:** the Solaseed flight times; the Azama campsite's place id and coordinate; Ufuya's hours (11:00–15:30,
  L.O. 15:00, ufuya.com; dinner 17:30–21:00 too); Oct 12 2026 = Sports Day; the ¥1,040 ETC vs ¥1,610 cash toll;
  Churaumi's ¥2,180; JMA normals; habu campaign dates; that a gas canister can't be flown; every Dive Nuts price; every
  drive time above; the OSM coordinates of the four Day 3 stops (Gushikawa's within 4 m, independently).
- **Still unverified:** 浜辺の茶屋's hours and closed days (the row says check before going), the Azama campsite's
  October fee and whether it takes bookings, King Tacos' hours, Kishimoto's 1905 founding and cash-only policy, every
  other campsite fee (the directory prices only two).
- **Two claims were wrong and are corrected:** King Tacos is not the 1984 original (taco rice began at Parlour Senri in
  Kin), and Daisekirinzan was renamed **ASMUI** in Dec 2024 and charges ¥2,500.
- **The campsites** are the 26 drivable main-island sites of the **Evertrail directory**
  (https://directory.evertrailokinawa.com/, a React SPA over Airtable; its `Hot spot` / `Dining` records sourced
  itinerary stops). Nine ferry-only outer-island sites are deliberately excluded.

### Seattle 2026 (Jul 2–19, en only)

- Restored in the old repo from its last state before it was rebuilt around Okinawa: kept so the trip is not lost, not
  because it is being planned (it is in the past).
- Hike data from WTA and AllTrails; the trail maps link out to `huangwaylon.github.io/hiking-trails/#/trail/<slug>` (the old `/gpx` site moved; a later hiking port makes them in-app).
- Only the itinerary and the packing list: no map, no campsites. English-only by design; only the chrome follows the
  language.

### New Zealand 2027 (Feb 11–16, en with ja)

- **Flights** booked and ticketed: NZ 98 Narita 18:30 Feb 10 → Auckland 09:00 Feb 11, NZ 95 Auckland 00:10 Feb 17 →
  Narita 07:05. Air NZ confirmation `{p:flightRef}`, Expedia itinerary `{p:expediaRef}`. Economy, one checked bag each,
  no seats chosen, cancellation not included.
- **The base is the host mother's home in New Lynn, west Auckland.** The street address is deliberately **not** in the
  data (someone else's home): the map pin and every "New Lynn" use the suburb centre (−36.90939, 174.68405).
- **Taranaki is days 3–4 (Feb 13–14), in the middle, on purpose.** As days 5–6 it put a 03:10 climb and a 362 km drive
  on the day of the flight, with no slack for weather or a slow road. Days 1–2 and 5–6 are Auckland. Day 3 still starts
  at Parnell Farmers' Market: **Saturday-only**, and Feb 13 is the trip's one Saturday; the Wintergardens moved to day 6
  with the North Shore. The split is why the map fits each day (at island scale an Auckland day is a blob).
- **Taranaki and Taupō don't both fit into Feb 13–14.** The itinerary takes Taranaki (Waitomo caves, then sunrise at the
  Pouākai Tarns, the hero photo); the Taupō loop (Tīrau, Orakei Korako, Huka Falls) is in the "Not Scheduled Yet" card
  with its real drive times, as the alternative. Don't merge them.
- **Sunrise at the tarns drives Day 4, and the climb is 2 h 45, not 2 h.** DOC gives the Mangorei Track 2 h 30 to
  Pouākai Hut and the tarns are past it, so the day is built backwards from a **06:49** New Plymouth sunrise (Feb 14
  2027, NOAA; sunset the evening before 20:28): leave 03:10, trailhead 03:30, climbing from 03:45, tarns 06:30. An 04:45
  start reached them *after* the sun. The descent is allowed 2 h. The other way round (sunset the evening before) means
  coming down by headlamp after a 5 h drive.
- **Drive times are OSRM free-flow**, per leg: AKL ↔ New Lynn 20 km / 22 min, Parnell → Waitomo 193 km / 2 h 31,
  Waitomo → New Plymouth 181 km / 2 h 30, New Plymouth → New Lynn 362 km / 4 h 49, New Lynn → Wintergardens 14 km /
  20 min. Auckland at peak adds 20–40 min; the Feb 14 return lands on a Sunday evening instead.
- **Orakei Korako keeps the operator's own unmacronised spelling**, unlike every other Māori name in the guide: it is
  the trading name. Don't "fix" it.
- **Pouākai Tarns has no Google place.** The coordinate (−39.24930, 174.05300) is the centroid of the OSM
  `natural=water` cluster on the Pouākai plateau; the day's link is the Mangorei Track trailhead instead.
- **The day cards' Open in Maps links are place *searches*, not pins** (the place ids resolved once from the short links
  the traveller sent aren't kept; a search beats an invented pin).
- **Verified:** the flight times and references (the booking email), the sunrise and sunset times for Auckland and New
  Plymouth, every place's coordinates, every drive time above.
- **Still unverified:** the Waitomo tour times and price, the Waiheke ferry timetable, getting around Waiheke without a
  car, the Mangorei Track's length and climb (DOC's figures; and whether it is open), Parnell Farmers' Market hours, the
  opening hours of every shop and cafe on the Auckland days (with Waiheke a Monday and the Wintergardens a Tuesday:
  whether Allpress, Batch and Amano open on a Monday). One Tree Hill (182 m) and Mount Victoria (87 m) are the commonly
  published heights, not checked against LINZ.
- **Still to book:** the rental car, the cave tour, a bed in New Plymouth for Feb 13, the ferry, seats on both flights.
- **Border facts:** both passports need an **NZeTA** plus the visitor levy before boarding. Biosecurity is strict: no
  food, seeds, honey or plants, and hiking boots declared and scrubbed clean. An American licence is valid to drive for
  12 months (no international permit). Plugs are Type I at 230 V, which Japanese plugs don't fit.
