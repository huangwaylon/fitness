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
- Real maps replace the generated SVG: MapLibre GL JS drawing OpenStreetMap vector tiles, our own NookPhone-style
  theme. The tiles from OpenFreeMap's public servers, online only (the user, 2026-11-06: no download, no self-hosting
  for now). A "you are here" dot (geolocation for our origin only; the position never leaves
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

Built in `app/src/lib/components/travel/map/` (the trip sheet mounts `TripMap.svelte`; try it at `/dev/map` in
`vite dev`, or `/dev/map?demo` on a build). Online only: nothing is downloaded ahead of time.

- **Interface:** `TripMap` takes `{ places, legs, dayColors, day, selected?, layers?, locale, tiles?, onselect? }`
  (`types.ts`: a place `{id, kind: 'stop'|'camp'|'nature'|'food', name: {ja?, en?}, lat, lon, day?, i?}`, a leg
  `{day, mode: 'drive'|'bus'|'walk'|'boat', line: [lon, lat][]}`; `day` a number or `'all'`; `layers` the candidate
  kinds shown). It shows the day's stops and legs and fits to them on a day change; `selected` raises that pin and
  eases the map to it; a pin or candidate tapped calls `onselect(id)`.
- **Renderer:** `maplibre-gl` 6 (devDependency), in its own chunk (`engine.ts`: ~1.18 MB, 324 KB gzipped, its CSS 71 /
  10 KB) fetched only when a map is drawn; `TripMap.svelte` itself is ~11 KB. Its worker is bundled as our own file
  (`?worker&url`: `_app/immutable/workers/maplibre-gl-worker-*.js`, 519 / 148 KB; a raw `.mjs` is served as
  `application/octet-stream`, which a module worker under `nosniff` refuses), set with `setWorkerUrl`: no `blob:`
  worker, no eval.
- **Tiles:** `source.ts`: OpenFreeMap's planet TileJSON (`https://tiles.openfreemap.org/planet`; its versioned tile
  URLs come from it, maxzoom 14, overzoomed past it), the OpenMapTiles schema. The one third party the phones contact
  (CSP `connect-src`): it sees the phone's IP and the area viewed, never the trip. Attribution, always shown, small in
  the corner: "OpenFreeMap © OpenMapTiles Data from © OpenStreetMap". Self-hosting later (the same schema) changes
  `source.ts` only; another schema is a sibling of `basemap.ts`.
- **Style:** `basemap.ts` (our layers on the OpenMapTiles schema; `liberty` was the reference for filters only),
  `theme.ts` (the palette: sea `#86CDEB`, land a soft yellow-green, parks and woods greener, sand and beaches cream,
  roads `--c-card` cream edged in `--c-lip`, main roads yuzu-pale, labels `--c-ink` on a `--c-cream` halo), `style.ts`
  (the stack). No sprite: no shields, POI icons or one-way arrows; a few POIs as plain text from z14 (beaches, parks,
  sights). Labels in the reader's locale: `name:ja` → `name`, or `name:en` → `name:latin` → `name`; no italics, no
  capitals.
- **Font:** every label in the app's Zen Maru Gothic Bold (`fonts.ts`): the style's `font-faces` names the @fontsource
  woff2 slices with their unicode-ranges, and MapLibre fetches a slice only when a label needs one of its characters
  (`_app/immutable/assets`, ~4 MB across 123 slices, never precached). A character no slice covers falls to the
  Latin glyph PBFs (Noto Sans Medium, 0-255 / 256-511 / 8192-8447, 270 KB, `static/travel/glyphs/`, out of the
  precache with the rest of `travel/`), then Hiragino Maru Gothic (`localIdeographFontFamily`).
- **Overlays:** the legs in the day colours (drive and bus solid, walk dashed, boat dotted, a white casing) over the
  roads and under the labels; the stops as HTML pins (NH round heads, the day's colour, the number in Fredoka, a white
  rim and tail, a 44 px hit; the selected one yuzu-rimmed and raised); an invisible `keepout` symbol per pin so the
  basemap's labels give way instead of hiding under it; the candidates as circles (camp orange, nature leaf, food
  pink; a 44 px hit round each, the selected one ringed).
- **Location dot:** the locate button (bottom right, 44 px, `data-sfx="tick"`) asks the first time it's tapped
  (`geolocation=(self)` in the Permissions-Policy); the watch (`geo.ts`) runs only while the map is on screen and the
  tab shown, and stops on close. A yuzu dot with a white rim and brown edge, its accuracy halo `--c-mint` in metres.
  The position goes to the map only: never logged, sent or kept. A refusal shows 「いちじょうほうが オフです」 until the
  next tap.
- **Lifecycle:** `map.remove()` on destroy (it loses the WebGL context); `webglcontextlost` / `restored` shown as
  `data-mode`; the container `touch-action: none`, Safari's `gesturestart` prevented, no rotation or pitch. One leak
  found and fixed: the last map's `remove()` aborts MapLibre's page-wide worker dispatcher with an Error whose
  unformatted stack held that map and its context until the next map; `engine.ts` reads the stack after `remove()`.
- **Tests:** `style.test.ts` (a valid style by the spec's validator, the locale expressions, the font faces, the
  palette, the attribution, the stack order, the halo's metres), `map.test.ts` (the overlays, the location watch).
  The e2e: under `drawOff()` no map is made; a stub with `data-mode`, `data-day`, `data-selected`, `data-loc`,
  `data-stops`, `data-candidates` and button pins (`travel-map.spec.ts`); `window.__travelMap` (hooks on:
  `state()`, `map()`). The drawn smoke (`@render`), `csp.spec` and `leaks.spec` draw it on fixture tiles
  (`e2e/fixtures/travel/`: a trimmed TileJSON and 16 tiles round Motobu, z6-12, 644 KB, answered at their real URLs by
  `e2e/travelMap.ts`; no spec reaches the network). To refresh them: fetch the TileJSON and the same z/x/y with curl
  from the versioned URL it names.

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

- ~~Maps online vs offline~~: online, OpenFreeMap's tiles (the user, 2026-11-06).
- The map is drawn in the day palette at every time of day (no night tint yet).
