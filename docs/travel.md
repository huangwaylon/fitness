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
| seattle | 2026-07-02 → 07-19 | America/Los_Angeles | 18 (9 hikes) | packing 4 / 19; no map in the old app |
| nz | 2027-02-11 → 02-16 (flight out 02-17 00:10) | Pacific/Auckland | 6 | logistics (flights, car, know-before-you-go, not scheduled), map (38 stops), packing 6 / 29 |

`TRIPS.md`'s facts and settled decisions (the dive stays on day 2, Taranaki stays mid-trip, spellings kept) are
copied to the end of this file and bind edits here too.

### Data shape (`app/src/lib/travel/`)

Pure TypeScript, one module per trip (`trips/okinawa.ts` …), loaded only with the sheet. Text is a pair in the data,
not catalog keys (≈700 strings would swamp `usage.test`); chrome strings live in `i18n/travel.{ja,en}.json`.

```ts
type L = { ja?: string; en?: string };              // at least one; shown in the reader's locale, else the other
// Inline tokens inside L strings: {km:9.8} (rendered km or mi by the device switch), {p:key} (a private value from
// the trip note; shows 🔒 ・・・ until the note is loaded), {link:label|https://…}.
interface Trip {
  id: 'okinawa' | 'seattle' | 'nz'; title: L; sub: L; start: string; end: string; tz: string;
  cover: string; hero: string; dayColors: string[];      // static/travel/<id>/… (WebP ≤ 720 px)
  days: Day[]; logistics: Card[]; camps?: Camp[]; places: Place[]; legs: Leg[]; packing: PackSeed; foot?: L;
}
interface Day { n: number; date: string; kind: 'day' | 'hike' | 'travel'; icon: string; title: L; sub?: L;
  rows: { t: string; text: L; note?: L; place?: string }[]; links?: Link[]; note?: L; photo?: string;
  hike?: { level: 'mod' | 'hard' | 'epic'; km: number; gainM: number; route: L; drive: L; time: L; pass: L; gpx?: string } }
interface Place { id: string; kind: 'stop' | 'camp' | 'nature' | 'food'; name: L; lat: number; lon: number;
  day?: number; i?: number; min?: number; link?: string }            // min = minutes after local midnight
interface Leg { day: number; from: string; to: string; mode: 'drive' | 'bus' | 'walk' | 'boat'; min: number; km: number;
  line: [number, number][] }                                        // [lon, lat], from the OSRM cache, simplified
interface Card { id: string; icon: string; title: L; sub?: L; photo?: string; stats?: { k: L; v: L }[];
  sections?: { head?: L; rows?: { t?: string; text: L; note?: L }[] }[]; links?: Link[] }
interface Camp { id: string; place: string; name: L; sub: L; type: 'wild' | 'paid'; beach: boolean; toilet: boolean;
  shower: boolean; photo: string; desc: L; chips: L[]; pick?: L; fromMin: number; fromKm: number; fee: L; maps: string }
interface PackSeed { cats: { id: string; name: L; icon: string; items: { id: string; text: L; note?: L }[] }[] }
type Link = { label: L; href: string };
```

A parity test pins the port against the source: 27 days, 26 campsites, 61 stops (+ 46 candidates), 83 packing items,
every day's row count, every link. Each trip's dates and tz drive "today" (the NZ flights cross midnight).

### Private values

The extraction writes the private values (booking refs, ticket numbers, full names, the Evertrail onboarding URL) to
`~/Documents/island-backups/trip-notes.json` (mode 600, never the repo), and puts `{p:key}` tokens in the data. An
admin `load` (relay/scripts/record.ts) writes one `trip_note` per trip. Business addresses and phone numbers are public
and stay in the content.

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
  `_app/immutable`, no `blob:` worker), loaded in the trip map's lazy chunk only.
- **Data:** OpenFreeMap's public vector tiles (OpenMapTiles schema, OpenStreetMap data; TileJSON
  `https://tiles.openfreemap.org/planet`, z0–14, overzoomed past 14), its glyphs and sprite: one host,
  `tiles.openfreemap.org`, the one third party the phones contact (it sees the IP and the area viewed; no trip data
  goes there). **Online only** (the user, 2026-11-06): nothing downloaded ahead of time, only the browser's own cache.
  Attribution shown: OpenFreeMap, © OpenMapTiles, © OpenStreetMap. The source sits in one module so self-hosting
  (Protomaps on R2, researched 2026-11-06) stays a swap.
- **Style:** our own NookPhone theme on the OpenMapTiles layers: soft sea blue, land cream / soft green, roads pale,
  labels in Zen Maru Gothic via `localIdeographFontFamily` for CJK (Latin from OpenFreeMap's glyphs), names in the
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

`static/travel/<trip>/`, WebP ≤ 720 px wide, kept out of the precache (`precachable()`), cached on first view in a
capped runtime cache. The upcoming trip (starting within 14 days) prefetches its own photos when opened; past trips
never prefetch.

## Open questions

- (none yet)
