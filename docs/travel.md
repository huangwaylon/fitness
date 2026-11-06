# りょこう (trips)

The travel guides from `~/Documents/other/travel-plans` (a single-file PWA: three trips, itinerary, logistics,
campsites, maps, packing) move into the app as one area, 「りょこう」, styled like the rest of the island and tuned for
iPhone 15 / 16 Safari. Branch `travel` (worktree `.claude/worktrees/travel`); the relay's part lands on main first
(the relay deploys from main, before the app). The old site stays up until the user takes it down.

## Decisions (the user, 2026-11-06)

- The design rules bend for the guides (docs/design.md §Trips): dense reading cards, normal Japanese line breaking
  inside guide text. The trip UI must be polished, not a port of the old look.
- The packing list is shared on the relay; ticks are **per person** (each person's own chip colour); the guest views,
  ticks and adds (edits and removes only what they added); members edit everything.
- Booking references, full names and personal URLs stay out of the public repo: they live on the relay as a trip note,
  readable by **all three keys** (the guest too).
- Entry: a 「りょこう」 pill in the leaf menu (Dodo Airlines flavour: Orville / Wilbur, the airport art).
- A km / mi switch, per device.
- Real maps replace the generated SVG: MapLibre GL JS drawing OpenStreetMap vector tiles (Protomaps), our own
  NookPhone-style theme, self-hosted. A "you are here" dot (geolocation for our origin only; the position never leaves
  the phone). No terrain shading.
- Past trips download nothing ahead of time (no offline maps, no photo prefetch).
- No ベル / economy tie-in.

## Content

Three trips, from the old `index.html` (static HTML, the source of truth there) and its map tables (`.map/build.py`,
`.map/nz.py`):

| Trip | Dates (local) | tz | Days | Extras |
|---|---|---|---|---|
| okinawa | 2026-10-10 → 10-12 | Asia/Tokyo | 3 | logistics (flights, the Jimny, the dive), map (23 stops + 26 camp / 9 nature / 11 food), 26 campsites, packing 6 cats / 35 items |
| seattle | 2026-07-02 → 07-19 | America/Los_Angeles | 18 (8 hikes) | packing 4 / 19; no map in the old app |
| nz | 2027-02-11 → 02-16 (flight out 02-17 00:10) | Pacific/Auckland | 6 | logistics (flights, car, know-before-you-go, not scheduled), map (39 stops: the old generator's notes say 38, its table and page have 39), packing 6 / 29 |

`TRIPS.md`'s facts and settled decisions (the dive stays on day 2, Taranaki stays mid-trip, spellings kept) are
copied to the end of this file and bind edits here too.

### Data shape (`app/src/lib/travel/`)

Pure TypeScript, one module per trip (`trips/okinawa.ts` …, `trips/index.ts` `loadTrip(id)` imports one), loaded only
with the sheet; `types.ts` is the schema, `tokens.ts` parses the inline tokens. Text is a pair in the data, not catalog
keys (≈700 strings would swamp `usage.test`); chrome strings live in `i18n/travel.{ja,en}.json`. The modules were
generated once by `app/scripts/travel-extract.ts` (one-off, 2026-11-06: the old `index.html`, the `.map` tables, the
OSRM legs) and are the source now: edit them, don't re-run the extractor over them.

```ts
type L = { ja?: string; en?: string };              // at least one; shown in the reader's locale, else the other
// Inline tokens inside L strings (tokens.ts parseTokens): {km:9.8}, {m:444}, {c:29} (distance, height, temperature:
// rendered metric or imperial by the device switch), {p:key} (a private value from the trip note; shows 🔒 ・・・ until
// the note is loaded). A text-only side (no translation in the source: 'SNA 021', '¥17,000') is under the guide's
// own language only.
interface Trip {
  id: 'okinawa' | 'seattle' | 'nz'; lang: 'ja' | 'en';  // the guide's own language (Okinawa ja, NZ en, Seattle en only)
  title: L; eyebrow: L; sub: L; start: string; end: string; tz: string;
  cover: Photo; hero: Photo; dayColors: string[];       // the old themes' --d1… (Seattle none: no map)
  bbox: [w, s, e, n];                                   // the old map's window; Seattle's the hikes' country
  days: Day[]; logistics: Card[]; camps?: Camp[]; campsIntro?: L; campsFoot?: L;
  places: Place[]; legs: Leg[]; packing: { cats: PackCat[] }; foot?: L;
}
interface Photo { src: string; w: number; h: number; alt?: L; caption?: L }  // src 'travel/<trip>/….webp' (static/)
interface Row { t?: string; text: L; note?: L }       // t as written: '06:10', '~12:00', '<21:00', '' (none); no t: a bullet
interface Section { head?: L; kind: 'tl' | 'bul'; rows: Row[] }
interface Day { n: number; date: string; kind: 'day' | 'hike' | 'travel'; icon: string; title: L; sub?: L;
  rows: DayRow[];                                     // the hour-by-hour timeline (none on Seattle's free days)
  sections?: Section[]; links?: Link[]; note?: L; photo?: Photo;
  hike?: { level: 'mod' | 'hard' | 'epic'; km: number; gainM: number; route: L; drive: L; time: L; pass: L; where: L; gpx?: string } }
interface DayRow { t: string; text: L; note?: L;
  place?: string;                                     // the map stop it arrives at (the row's time = the stop's)
  dd?: -1 | 1 }                                       // on another date: NZ's flight out on Feb 10, home at 00:10 Feb 17
interface Place { id: string; kind: 'stop' | 'camp' | 'nature' | 'food'; name: L; lat: number; lon: number;
  day?: number; i?: number; min?: number; link?: string }
  // stops s<day>-<i> (one per visit: New Lynn is a stop on every NZ day), min = minutes after local midnight;
  // camps by their slug (= Camp.id, the photo's name), nature n-<slug>, food f-<slug>
interface Leg { day: number; i: number; from: string; to: string; mode: 'drive' | 'bus' | 'walk' | 'boat';
  min?: number; km?: number; line: [number, number][] }
  // i = the stop it arrives at; min/km OSRM free-flow on routed legs (a walk or a boat is a straight, unmeasured line);
  // line [lon, lat] 5 decimals, Douglas-Peucker 5 m (Okinawa 2312 points ≈ 48 KB, NZ 615 ≈ 12 KB). Okinawa's day 2
  // into Ufuya is two legs: the boat back to the shop, then the drive.
interface Card { id: string; icon: string; title: L; sub?: L; desc?: L; photo?: Photo; stats?: { k: L; v: L }[];
  sections?: Section[]; links?: Link[] }
interface Camp { id: string; place: string; name: L; sub: L; type: 'wild' | 'paid'; beach: boolean; toilet: boolean;
  shower: boolean; photo: Photo; desc: L; chips: { text: L; pick?: true }[];  // in order; pick: 1泊目 / 2泊目 / 候補
  fromMin: number; fromKm: number; fee: L; maps: string }
interface PackCat { id: string; name: L; icon: string; items: { id: string; text: L; note?: L }[] }  // ids ok-0, ok-0-0 …
type Link = { label: L; href: string };               // https, or {p:key} for a private URL
```

A parity test (`travel/trips.test.ts`) pins the port against the source: 27 days and each day's timeline rows
(12 / 11 / 16; Seattle's 18; NZ 8 / 7 / 8 / 10 / 11 / 10), every link (29 / 8 / 6), 26 campsites, 62 stops (Okinawa
23, NZ 39) + 46 candidates (26 camp / 9 nature / 11 food), 83 packing items (35 / 19 / 29 in 6 / 4 / 6 categories),
https links, every place inside its trip's box, the legs chained stop to stop, the tokens, the note's keys and the
photos. Each trip's dates and tz drive "today" (the NZ flights cross midnight: DayRow `dd`). Icons are the old site's
lucide names (`plane-landing`, `waves`, `mountain-snow` …), for the UI to map onto its own art.

What the schema dropped from the source: Seattle's two inline sunset glyphs ("Watch sunset — 9:02 PM" reads the same),
the "Hike details" subheads (the hike block is the UI's), the hero / cover focal points (`--hero-pos`), the old map's
SVG geometry (real maps replace it). One source slip fixed: a mangled ハ in NZ day 6 (ハーバーブリッジ).

### Private values

The extractor wrote the private values to `~/Documents/island-backups/trip-notes.json` (mode 600, never the repo,
`{tripId: {key: value}}`) and the same as two `trip_note` rows for the admin `load` next to it
(`trip-notes.load.json`, mode 600: `{rows: {events: [[at, 'A', id, 'trip_note', '{"trip","at","v"}']]}}`,
relay/scripts/record.ts load), and put `{p:key}` tokens in the data:

| trip | keys |
|---|---|
| okinawa | `flightRef` (Solaseed booking), `ticket` (the e-ticket number), `carRef` (Evertrail booking, shown as `#{p:carRef}`), `onboardingUrl` (the Evertrail onboarding link: a Link's `href`), `traveller1` |
| nz | `flightRef` (Air NZ confirmation), `expediaRef` (Expedia itinerary), `traveller1`, `traveller2` (the passport names) |

Business addresses and phone numbers (the Evertrail office, Dive Nuts) are public and stay in the content.

## The sheet

- **Entry:** the leaf menu's 「りょこう」 pill (between えいご ききとり and せってい; `--n` 5), its art Orville's head. It opens
  a `pop` Sheet (the ききみみ pattern: a tiny always-loaded host + a lazy chunk, `paused` while open, mounted outside
  `[data-exact-taps]`).
- **Level 1, the trips:** a boarding pass per trip (Dodo Airlines): destination, dates, 「あと 97にち」 / 「いま 2日目」;
  upcoming first, past ones under 「おもいで」 with a stamp. Orville's one line in the Bubble on the first open of a day.
- **Level 2, a trip:** NavBar back to the list; a Segmented にってい / ちず / もちもの (+ キャンプ for Okinawa).
  - にってい: day cards (the day on a yuzu plate, the hour rows in a timeline, open/close), today's card open and the
    current row marked during the trip; じゅんび (the logistics cards) after the days; place links open Maps outside.
  - ちず: the map (below), the day chips (colour = day), the stop list for the chosen day; a stop tapped in the list
    flies the map to it and a pin tapped scrolls the list; Okinawa's layer chips (camp / nature / food) and a camp pin's
    card in a sheet.
  - キャンプ: the campsite cards with the filter chips (all / free / paid / beach / toilet / shower).
  - もちもの: below.
- **Units:** km / mi in せってい (device pref, `DEVICE.*`), every `{km:}` token follows it.
- **Copy:** the app's rules (kana-first chrome, ✕ only closes, 🗑 + とりけす); guide text keeps its source wording.

## Maps

- **Renderer:** `maplibre-gl` (devDependency, its CSP build: `setWorkerUrl` with the worker file served from
  `_app/immutable`, no `blob:` worker), `pmtiles` for the protocol, loaded in the trip map's lazy chunk only.
- **Data:** Protomaps basemap extracts (OpenStreetMap, ODbL; "© OpenStreetMap" shown) cut with `pmtiles extract` per
  region, z15. Measured 2026-11-06: Okinawa 19 MB; NZ an overview z12 23 MB + Auckland 8.5 / Waitomo 1.9 / New
  Plymouth 3.2 / Taranaki 5.9 MB; Seattle overview z12 9 MB + Cascades 15 MB. Hosted on R2, served by the relay (route
  and online/offline policy: open question below).
- **Style:** our own NookPhone theme on the Protomaps v4 layers: sea `--c-sea`, land cream / soft green, roads pale,
  labels in Zen Maru Gothic via `localIdeographFontFamily` (Latin glyph PBFs self-hosted, ≈ 270 KB), names in the
  reader's locale (`name:ja` / `name:en`, fallback `name`).
- **Overlays:** the trip's legs as GeoJSON lines in the day colours, stops as NH pins (numbered per day), the candidate
  layers, and the location dot (`geolocation=(self)` in the Permissions-Policy; asked only when the user taps the
  locate button; watched only while the map shows).
- **Lifecycle:** the island pauses under the sheet; `map.remove()` and a lost context on close (leaks.spec); the map
  container `touch-action: none`; a `drawOff()` path for the logic-tier e2e; fixture tiles via `page.route`.

## Packing list (relay)

Built like the board (docs/board.md): one op per thing, last writer wins by the relay clock, then who.

| type | data | slot | who may write |
|---|---|---|---|
| `pack` | `{trip, id, at, kind: 'cat' \| 'item', cat?, ord, name: L, note?: L, icon?}` or `{trip, id, at, rm: true}` | `pack\|<trip>\|<id>` | members: any; guest: only ids they created |
| `pack_chk` | `{trip, id, at, v: 0 \| 1}` | `pack_chk\|<trip>\|<id>\|<who>` | each person their own |
| `pack_reset` | `{trip, at}` (ticks older than it are off) | `pack_reset\|<trip>\|<who>` | each person their own |
| `trip_note` | `{trip, at, v: {[key]: string}}` | `trip_note\|<trip>` | members (and the admin load); all three read |

- The seed (the trip data's `packing`) is the list until someone touches it; ops override seed ids, `rm` hides one; a
  removal is final. Seed items count as nobody's, so the guest can't edit or remove them.
- Caps: name ≤ 80 chars, note ≤ 120, 300 ops per trip kept, removals pruned oldest first.
- The UI: a card per category, a row per item with a check bubble and three small chips (ウェイ yuzu, うめ mint,
  おきゃくさん lilac) showing who has packed it; 「N / M」 for me; ✎ for add / rename / reorder / delete; 「リセット」 clears
  only mine (with a confirm). All done (me): Orville's 「じゅんび OK！」 stamp.

## Photos

`static/travel/<trip>/`, WebP ≤ 720 px wide (cwebp q80; 41 files, 2.4 MB: Okinawa 1.5 MB with the 26 campsites
`camps/<slug>.webp` and the dive boat, Seattle 0.8 MB with its 8 hikes by their old names, each trip's `hero.webp` and
`cover.webp`), kept out of the precache (`precachable()`: caches.ts `isTravelPhoto`), cached on first view in a
capped runtime cache. The upcoming trip (starting within 14 days) prefetches its own photos when opened; past trips
never prefetch.

## Open questions

- Maps online vs offline (the user, 2026-11-06: "does it have to be downloaded or can it just be loaded when we're
  online?") — pending.

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
- Hike data from WTA and AllTrails; the trail maps link out to `huangwaylon.github.io/gpx`.
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
