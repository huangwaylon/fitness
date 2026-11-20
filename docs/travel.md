# 旅行 (trips)

The travel guides (Okinawa, Seattle, New Zealand; Zao written here), ported from `~/Documents/other/travel-plans` into 「旅行」. The
UI is [design.md §Trips](design.md#trips); this file is the data, the relay's part and the map.

## Decisions

- The guides are dense reading cards (design.md §Trips bends the screen rules for them); polished, not a port.
- The packing list is shared on the relay, ticks **per person**; the guest views, ticks and adds, and edits or removes
  only what it added; members edit everything.
- Booking references, full names and personal URLs never enter the repo: they're a trip note on the relay, read by
  **all three keys** (the guest too).
- Maps: MapLibre GL JS on OpenFreeMap's public vector tiles in our NookPhone style (Protomaps on R2 rejected:
  decisions.md "The trip map"). No terrain shading.
- A "you are here" dot; **the position never leaves the phone** (never logged, sent or kept).
- Nothing downloads ahead unless asked (「オフライン用に保存」); what was seen is kept ("Offline").
- A km / mi switch per device, in the list's 設定 tab. No ベル / economy tie-in.

## Past trips

Every trip is drawn by one kit (`TripView`; design.md §Trips). A trip that's over is **read-only** (`when.ts`
`readOnly`: its phase is past): its packing list frozen as everyone left it (`packing.frozen`: the fold of the
record's rows, who packed what shown, no Tick or 編集, nothing sent). Okinawa and Seattle are over (no relay rows: their
seed); NZ freezes after its flight home. The days to go (phase `soon`) count at home, Tokyo's day, as 結婚式's; on and
past go by the trip's own calendar and rows.

## Content

| Trip | Dates (local) | tz | Days | Has |
|---|---|---|---|---|
| okinawa (ja + en) | 2026-10-10 → 10-12 | Asia/Tokyo | 3 | logistics, map (23 stops; candidates 26 camp / 9 nature / 11 food), 35 campsites, packing 6 / 35 |
| seattle (en only) | 2026-07-02 → 07-19 | America/Los_Angeles | 18 (8 hikes) | packing 4 / 19; no map |
| nz (en + ja) | 2027-02-11 → 02-16 (flight out 02-17 00:10) | Pacific/Auckland | 6 | logistics, map (39 stops), packing 6 / 29 |
| zao (ja + en) | 2027-01-29 → 01-31 (up the eve, 01-28 22:00) | Asia/Tokyo | 3 | logistics, map (6 stops), packing 3 / 15 |

`trips.test.ts` pins these counts. "Trip facts" below binds every edit.

### Data shape

`app/src/lib/travel/`: one module per trip (`trips/<id>.ts`, `trips/index.ts` `loadTrip(id)`), loaded with the sheet;
the modules are the source (edit by hand); the schema is [`types.ts`](../app/src/lib/travel/types.ts). Guide text is a
pair `{ja?, en?}` (not catalog keys), shown in the reader's locale, else the other; the chrome's strings are
`i18n/travel.{ja,en}.json`. Inline tokens (`tokens.ts`): `{km:}`, `{m:}`, `{c:}` follow the device's units; `{p:key}`
is a private value. A logistics card's icon is the old site's lucide name, drawn by ui/Icon (trips.test checks them; a
packing category's is its NH item where packView.ts has one). Each trip's dates and `tz` drive "today" (`DayRow.dd`: a
row on the eve or the morning after).

### Private values

In `~/Documents/island-backups/trip-notes.json` (mode 600, never the repo), loaded onto the relay as `trip_note` rows
by the admin `load` (`trip-notes.load.json` beside it; relay/scripts/record.ts). Until the note is in, each `{p:key}`
shows 🔒 ・・・. Public business addresses and phone numbers stay in the content.

| trip | keys |
|---|---|
| okinawa | `flightRef` (Solaseed booking), `ticket` (e-ticket number), `carRef` (Evertrail booking, shown as `#{p:carRef}`), `onboardingUrl` (a Link's `href`), `traveller1` |
| nz | `flightRef` (Air NZ confirmation), `expediaRef` (Expedia itinerary), `traveller1`, `traveller2` (passport names) |

## Packing list (relay)

Built like the board (docs/board.md): one op per thing. Contract: `app/src/lib/contract/pack.ts` (shared by the
record's `relay/src/store.ts` and the phones); the phone's store: `components/travel/packing.svelte.ts`. The four row
types and their wire limits: [backend.md#events](backend.md#events) (`pack`, `pack_chk`, `pack_reset`, `trip_note`).

| Rule | |
|---|---|
| The seed | The trip data's `packing` is the list until an op touches an id; a set replaces an id's whole state, `rm` hides it. Seed ids are nobody's. |
| Merge | Latest `at` wins, then G over B over A; a removal is final and takes the item's ticks; an item whose category is gone is hidden with it. |
| Ownership | An id an op made (`_` + base36) is its creator's (`by`, on every set). Members change anything; the guest only ids it made. |
| The guest's category | The guest edits or removes its own category only while every item in it is its own too (`packMayEdit`: the phone's ✎ and the record alike). |
| Order | `ord` is fractional: a move goes between its new neighbours (`ordBetween`), a new one last. With no float left between them, the siblings renumber 0, 1, 2 … (only if all are mine to change, else the move is refused). |
| Seed edits | A seed's `ord` is its index, so a list in use only grows at the ends (a new item last in its category, a new category last); never reorder a seed. |
| Ticks | Per person: packed for whoever's latest `pack_chk` is `v: 1` and later than their own `pack_reset`. |
| Clock | Every op is stamped on the relay's clock (`world.serverNow()`, never a `?date=` preview's), after the op it replaces. |
| Caps | 300 `pack` items standing a trip (removals uncounted, never dropped; else `pack full`), 300 ticks a trip and person. |
| The phone | `packFold` takes the record's rows as they are and judges this phone's queued ones by the record's rules, so the list shows what the record will. |

The demo has a made-up note per trip and うめ's ticks on NZ's list.

## Maps

`components/travel/map/`: `TripMap.svelte` (light; mounted by `MapPane.svelte`), `engine.ts` (MapLibre, its own lazy
chunk), `style.ts` (source and stack), `basemap.ts` + `theme.ts` (our layers on the OpenMapTiles schema, the NookPhone
palette), `overlay.ts` (pins, legs, candidates, the location dot), `fonts.ts`, `geo.ts`, `glmap.ts` (what the map
shows, `removeMap`), `cached.ts`, `tiles.ts`.

- **Source:** `style.ts` `BASEMAP`, OpenFreeMap's planet TileJSON (`https://tiles.openfreemap.org/planet`): the one
  third party the phones contact, in the CSP's `connect-src` only. It sees the phone's IP and the area viewed, never
  the trip. Attribution always shown, small in the corner.
- **Worker:** MapLibre's worker bundled as our own file (`?worker&url`, `setWorkerUrl`): no `blob:` worker, no eval.
- **Fonts:** every label in Zen Maru Gothic Bold from the style's `font-faces` (our @fontsource slices, fetched when a
  label needs one); no glyphs URL. A character no slice covers is drawn in a local font.
- **Overlays:** the day's legs in its colour (drive and bus solid, walk dashed, boat dotted) over the roads, under the
  labels; stops as numbered HTML pins, stops within 30 m **merged into one pin** (「2·6」), the selected one raised and
  named; a `keepout` symbol per pin so basemap labels give way; Okinawa's candidates as circles behind MapPane's layer
  button (off at first).
- **States** (`data-mode`): `loading`, `ready`; `offline` (no basemap tile came: the route alone, 「地図はオフラインです
  （ルートのみ表示）」); `failed` (no chunk or WebGL: 「地図を読み込めませんでした」 + もう一度, map/MapStatus as the trail map's; offline the chunk is asked for only if
  the service worker holds it, `map/cached.ts`, and it draws by itself once online); `lost` (iOS took the WebGL
  context, till restored). `removeMap` on unmount (the style's font faces go too).
- **Locate:** permission is asked on the first tap (`geolocation=(self)`); the first fix flies there (zoom ≥ 14), unless
  the phone is over 50 km from every stop: then the dot shows, the map stays on the route and 「旅先から離れています」
  shows for 8 s. Tapped again while on: back to the dot (or the route if far). Refused: 「位置情報がオフです」 with the
  Settings path. The watch runs only while the map is on screen and the tab shown.

## Photos

`static/travel/<trip>/`: WebP ≤ 720 px wide (each trip's `hero` and `cover`, Okinawa's 26 campsites and the dive boat,
Seattle's 8 hikes), lazy (the hero eager). A photo that can't load is the paper with a small picture icon
(`ui/photoFallback.ts`), never WebKit's "?".

## Sharing

共有リンク: a member makes a link (`https://island-fund.pages.dev/s#<token>`) that shows the **whole trips page** to
someone without a key, read-only, until it expires (1週間 · 1か月 · 3か月 · **1年**, the default; renewable, never 無期限)
or is turned off (無効にする, 取り消す undoes it); its visits counted. Made from the trips list (its share disc), one
kind: the user's change of 2026-11-20 (v1's one-trip `trip` links still read till they end; none was made). The
contract: `contract/share.ts` (a kind registry: its refs, what of the record it reads, its fields, its size cap).

- **Shown:** every trip, past and future, as the list groups them (これからの旅, これまで); each trip's 日程, 準備, 地図,
  キャンプ場, **持ち物** (the list, no ticks) and its note's free values (準備's メモ card). **Never:** the note's private
  values (every `{p:}` stays 🔒), the guest's items, who packed what, health, other features, the link's label or
  counts, オフライン用に保存.
- **The relay builds the snapshot** (`sharedTrips`), field by field: each trip's packing ops (the members' only, no
  `by`, time or tick) over the bundle's seed, and its note's values except the `{p:}` keys (`SHARE_PRIVATE_NOTE_KEYS`,
  pinned to the guides by trips.test) and private-sounding keys. Every record text is redacted first
  (`contract/private.ts` `redactPrivate`: NFKC and format characters out, then links, e-mails, labelled refs
  予約番号/確認番号/搭乗券/PNR…, 7+ digit runs, mixed codes, spaced codes, 6-capital codes, passport names, honorifics):
  each run 🔒, the page's lock chip. Fail closed: a text still ID-like after it, or a snapshot that can't be built,
  is withheld. Live: built again when the packing rows change; ≤ 200 KB.
- The guides are the app's bundle (public already); `trips.test` fails an ID-like run outside `{p:}`.
- The token is in the fragment (never sent to Pages, never in a Referer; the boot watchdog's reload keeps it on `/s`);
  `/s` is noindex (`X-Robots-Tag` on `/*`, `robots.txt` `Disallow: /`), its own shell (`build-pages/s.html`), no
  service worker, no sync, no key sent (only `self` when this phone is paired). The read waits until the page is
  visible; its 日本語 / English is this session's (`island.share.lang`). Record text is plain text: no link, no `{@html}`.
- Visits: time (to the minute), device class, country, a daily-salted hash for 約N人 (no IP, no UA string, no cookie);
  bots, our own phones and a reload within 30 minutes aren't visits.

### The relay's part
`relay/src/share.ts`, in the record. Own tables, not events (events reach every phone, the guest's too: a token
there would leak to it):

| Table | Columns |
|---|---|
| `share` | `id` (8 random bytes hex), `token` (16 random bytes base64url, unique), `kind`, `ref`, `label`, `by`, `at`, `exp`, `off_at`, `views`, `uniq`, `first_at`, `last_at` |
| `share_visit` | `id`, `at`, `dev`, `cc`, `fresh`: ≤ 500 a link (the oldest dropped, the counters untouched) |
| `share_seen` | `id`, `h`, `at`: the day's visitor hashes only, emptied at Tokyo midnight with the salt |

- **API** (`/api`, a member's key, online only, never queued; the guest `forbidden`): `share_list {kind, ref}` → the
  links (live and ended) with their counts and tokens; `share_make {kind: 'trips', ref: 'all', days, label?}` → the row
  (caps: 20 live a ref, 100 in all; a `trip` link is no longer made); `share_set {id, days?, label?, off?}` (`days` sets
  `exp = now + days`; `off: true` turns it off, `false` back on) → the row; `share_visits {id}` → the last 50 visits.
  Members manage every link, each other's too.
- **`POST /share`** (no key, text/plain `{"t": token, "self"?: true}`): the Worker refuses another origin, a body over
  256 characters or a malformed token (`gone`, no request to the record); the record answers `{ok, kind, ref, exp,
  data}` (the kind's snapshot: `trips` `{trips: {<trip>: {pack, notes}}}`, a `trip`'s `{}`) or `{ok:false, error:'gone',
  why:'off'|'expired', exp?}`, a turned-off link and an unknown token alike; `busy` (429) past 30 reads a minute a
  visitor, 20 misses an hour a visitor or 600 reads a minute in all (the limits' visitor: the address, an IPv6 one by
  its /64, whatever the UA; a read a visitor's limit refuses doesn't count toward the 600). The body is read no further
  than its cap. `Cache-Control: no-store`.
- **A visit** is a read answered `ok`, not by a bot's UA, not `self`, not the same visitor within 30 minutes. Kept: `at`
  (to the minute), `dev` (iphone · ipad · android · mac · windows · other), `cc` (`request.cf.country`), `fresh` (the
  visitor's first today). The visitor's hash is SHA-256(the day's salt, IP, UA, link id), 8 bytes; the salt (32 random
  bytes, in `meta`) and `share_seen` are replaced at Tokyo midnight: never linkable across days or back to an IP. No IP,
  UA string or cookie is kept. `uniq` = the fresh visits (約N人).
- **The 03:00 cron** deletes ended links (off or expired) with their visits 90 days after they ended.
- **Backups:** the dump carries `share` and `share_visit` (not `share_seen`, not the salt); a load is idempotent by
  id. A restore to before a revocation revives the link ([runbook §6](ops/runbook.md#6-backups)).
- **Log:** `share {op, kind, ok, why, ms, n}`, never the token, the id, an IP or a hash.

## Offline

What reads offline and the caches: [backend](backend.md) "Service worker" › Offline; the save button and its plan:
design.md "Offline maps", `lib/offline/plan.ts`. Saved: **NZ 438 tiles, 20.4 MB** (Auckland's z14 ~145 KB a tile),
**Okinawa 310 tiles, 7.6 MB**; inside OpenFreeMap's ≤ 3,000 tiles and ≤ 50 MB an area.
The save pill (design.md "Offline maps"; data: [backend](backend.md) "Service worker"): a partial or evicted save
offers a retry, one past 30 days an update, one that can't start says why (offline, the 150 MB total, storage, another
save); a trash pill deletes it. Offline, the map shows the saved range only.

## Open

- Not yet checked on a real iPhone: Safari's `text-wrap: pretty`, the hero crops, the map on Metal, offline maps
  (`e2e/offline.spec.ts` covers Chromium; Playwright's WebKit checked by hand).
- The map has no night tint.
- Offline (onLine still true) with no worker in control, then back: WebKit's failed modulepreloads still fail the
  import; もういちど reloads, and the new page's first tap can get the old page's failures again
  (`ui-state/lazySheet.svelte.ts`). On the phone the worker serves the chunk.
- Packing: no icon picker (a new category is the shopping bag), no note editing, no moving an item across categories.

## Trip facts (from TRIPS.md)

From the old repo's `TRIPS.md`: what the markup can't show, what was verified, and decisions that would otherwise get
undone. They bind edits to the trip modules. Private values are named by their `{p:}` keys.

### Place links

Every link points at a real place, never a coordinate: campsites use the Evertrail directory's `Google maps` field,
named venues `https://www.google.com/maps/place//data=!4m2!3m1!1s<FID>`, and a place Google can't resolve to one match
`?api=1&query=<name>`. **Never invent an FID**: a query link is right when there's no single match.
`https://maps.google.com/?cid=…` no longer works (fails silently). Accepted gaps: 比地大滝 130 m and 崎本部緑地 45 m
(place pin vs OSM node), ター滝 ~625 m (falls vs trailhead), 古宇利島 (the island's centroid).

### Okinawa 2026 (Oct 10–12, ja with en)

In `trips/okinawa.ts`'s header: the car's office, nature not sights, the two campsites, the dives' day, the split cafe
and Ufuya, Day 3's tide-pool run and Day 1's arrival, drive times, the jellyfish rule, verified and unverified, two
corrected claims, the Evertrail campsites.

### Seattle 2026 (Jul 2–19, en only)

- Restored from the old repo's state before its Okinawa rebuild, kept so the past trip isn't lost.
- Hike data from WTA and AllTrails; a hike card opens its trail in トレイル (`hikeSlugOf`, [hiking.md](hiking.md#entry)),
  else links out to the old [hiking-trails site](https://huangwaylon.github.io/hiking-trails/).
- Itinerary and packing list only: no map, no campsites. English by design; only the chrome follows the language.

### New Zealand 2027 (Feb 11–16, en with ja)

In `trips/nz.ts`'s header: the flights, the New Lynn base, why Taranaki is days 3–4 and Taupō an unscheduled card, the
tarns' sunrise timing, drive times, spellings, verified, unverified and still to book, the border facts.

### Zao 2027 (Jan 29–31, ja with en)

In `trips/zao.ts`'s header: the dates, the eve and the stays, regular vs peak days, who rents what, prices and
cancellation, hours, the places and drives, what stays out of the repo, still open.
