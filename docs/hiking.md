# トレイル (hiking trails)

Ume-chan's Trails in the island: fourteen trails (eight in Washington, six in Japan, four of them from our YAMAP
activities and plans) on topo maps with an elevation chart, plus anyone's registered hikes. Opened from the HUD menu's
登山 pill ([design](design.md#island)). Hike mode navigates only: nothing is recorded.

## Entry

`components/hiking/open.svelte.ts`: `hiking` (a `lazySheet` mounted by `island/Hud.svelte`, the island paused under it),
`openTrails()`, `openTrail(slug)`. The Seattle guide's hike cards call `openTrail(hikeSlugOf(gpx))`
(`lib/hiking/slugs.ts`: the old `…/#/trail/<slug>` link to our slug, else null; no write-ups, so it stays off /s).

## Data

`lib/hiking/`: `trails.ts` (the fourteen, JA + EN; km/m converted once from AllTrails; the gain is AllTrails' DEM
figure: a GPX's own elevations over-count by 50-60 %), `track.ts` (pure view model), `load.ts`, `user.ts`, `list.ts`,
`strings.ts`; GPX to track: `contract/hikeTrack.ts`.

- **Tracks:** `static/hiking/tracks/<slug>.json` `{v, len, pts: [lon, lat, ele][], wpts}` from
  `npm run hiking:tracks` (`scripts/hiking-tracks.ts`, its header lists the modes): elevation smoothed (15-point
  centred mean), Douglas-Peucker at 5 m; `len` is the raw length, so the km match AllTrails.
- **YAMAP activities** (`utsukushigahara`, `akagi-kurobi`): fetched from YAMAP's public API, vendored trimmed in
  `scripts/data/yamap/<slug>.json` (`lib/hiking/yamapData.ts` `VENDORED`): route, summits, figures, day; never the
  identity (no activity id or link, members, photos, text, clock). `--yamap --from scripts/data/yamap` rebuilds
  offline, `--yamap --save` refreshes live (ids in gitignored `app/.env.local`). `yamapData.test` pins envelope =
  shipped track and scans for banned keys. Credit 「軌跡・記録：YAMAP」, no link, no names.
- **YAMAP plans** (`akigawa-shiroyama`, `ono-yama`): `--yamap-plan <saved page.html> <slug> --save scripts/data/yamap`
  (the page saved by hand, never committed; id, party and planner never read). Their envelopes are not vendored yet
  (`VENDORED` lists the activities only), so only the built tracks ship. Credit 「コース・計画：YAMAP」.
- **Photos:** `app/scripts/data/hiking-photos/<slug>.webp` (1080 x 720 q75, not deployed); the YAMAP four from Wikimedia
  Commons (CC BY / BY-SA, credit in `photo`, 「トリミング・縮小」). The app ships their thumbs and bands
  (`static/hiking/thumbs/`, `bands/`): `npm run hiking:thumbs`.
- **Private values:** each plan's link, party and planner are `{p:<pre>PlanUrl}`, `{p:<pre>Party}`, `{p:<pre>Planner}`
  (`kinpu`, `akigawa`, `ono`) in the record's `trip_note` of trip `hiking` (set as docs/travel.md "Private values").
  Until set: 🔒 and no YAMAP link.
- **Registered hikes** (anyone's, the guest's too): the record's `hike` and `hike_trk` events (`contract/hike.ts`),
  via `components/hiking/hikes.svelte.ts` (queued offline). `user.ts` `hikeTrail` makes a Trail (slug `u-<id>`; GSI in
  Japan, else USGS). Input: a YAMAP link read by the relay (`POST /hiking`, `relay/src/hikeRoute.ts`), a GPX parsed on
  the phone, or by hand. Their data stays on the record, never in the repo; promotion to a curated trail is manual.

## Map

`components/hiking/TrailMap.svelte` + `map/engine.ts` (MapLibre on the maps' core, design.md "Maps"). `map/style.ts`:
USGS Topo (z9-16) or GSI std (z9-18) raster under the overlays; both hosts are in the CSP `connect-src`
(`vite.config.ts`). Notes under the save pill: 「地図を読み込み中…」 after 2 s without a tile; the track alone when
no tile comes or offline. Under drawOff() (e2e logic tier) a stub draws track and dot as SVG.

## Offline

The fourteen tracks are precached. Photos seen are kept (`island-photos-v1`), tiles drawn in `island-tiles-v1`
(backend.md "Service worker"). 「オフライン用に保存」 on each map (design.md "Offline maps"): `lib/offline/plan.ts`
`planTrail`, z12-13 within 3 km of the track, z14-16 within 1 km (1.6-8.8 MB). GSI tiles stay on the phone, capped at
z16. A saved area's net file on a weak network: the worker waits 3 s, then
serves the saved copy (`service-worker/netFallback.ts`).

## Reference trails

OpenStreetMap paths and forks around the six Japan trails (never YAMAP's 登山道 layer: its terms; none for US trails or
registered hikes: a box would place a private hike in the repo). `static/hiking/net/<slug>.json`, ODbL
(`static/hiking/net/LICENSE`), credit 「© OpenStreetMap contributors」 whenever drawn.

- Refresh by hand: `npm run hiking:net [slug …]` (`scripts/hiking-net.ts`; `--save <dir>` / `--from <dir>` keep and
  replay Overpass answers). Rerun when a track is rebuilt: `net.test` fails on a stale file.
- Build: `lib/hiking/netBuild.ts` (pure, unit-tested on invented networks): the track's box + 1 km, footpaths and nearby
  roads; forks = 3+ path ends within 25 m of the route, per pass; the route's own ways removed; labels from way names or
  the next named peak/saddle/hut within 3 km.
- Schema: `lib/hiking/net.ts` (v1; `trk` = hash of the track it was built from: another track hides the forks).
  `loadNet` parses as the map opens (null on anything unexpected); not precached, kept once seen.

## Saved places

The maps' shared layer (`components/map/places/`): saved places within 2 km of the track (40 nearest) as squares under
the route. The layers disc toggles it (保存した場所, then 参考ルート; `island.mapPlaces`, one switch for every map). A tap
opens `PlaceFloat` (name, category, hours, 経路); ✕, an empty tap, Esc or the layer off closes it. Works offline.

## In-hike map

`components/hiking/map/`: `live.svelte.ts` (location watch, compass, camera mode, hike mode) over pure `follow.ts`,
`compass.ts`, `hike.ts`, `junction.ts`, `route.ts`, `wake.ts`. Position and heading never leave the phone
(`act:hike.*` counters say what, never where). No background alert.

- **Camera:** two-finger rotation, no pitch. Location disc: off → 追従 → off; a pan frees it. The compass turns only
  the dot's cone; the N disc shows while rotated.
- **Compass:** permission asked in the tap into 追従 or 歩きはじめる, once a session; accuracy widens the cone 15-60°.
- **Hike mode** (歩きはじめる, under the chart; in the peek on the hike's day: 予定 and dated today on the phone's clock,
  `list.ts hikeToday`): the peek becomes the strip (歩いた · のこり · のぼり · 到着 ETA: 4 km/h, 300 m/h up,
  500 m/h down, scaled by what's left). Matching in `hike.ts` (`MATCH`): windowed, full search after 60 s silence or a
  300 m jump; fixes > 100 m accuracy ignored. Resume: `resume.ts`, localStorage `island.hikeNow` (no coordinates),
  within 12 h. Local notification `hiking/map/notify.ts` (tag `hike`, opens `?open=hike&trail=…`).
- **Off the route** (`hike.ts` `OFF`): beyond max(50 m, 2 x accuracy) for 3 fixes and 20 s: coral banner and a dashed
  line; clears under 30 m.
- **Junction card** (`junction.ts`): the next fork within 150 m: 「分岐まで{n}m · ルートは{右/左/直進}」 from the track's
  bearings, never the compass. Shares `TopSlot.svelte` (role="alert" / role="status") with the off-route banner, which
  wins.
- **画面をつけたままにする:** a wake lock in hike mode.
- e2e: `hiking.spec.ts` fakes geolocation, compass, wake lock, clock; `hiking-user.spec.ts` uses the real record.

## Screens

- **The list** (`TrailList.svelte`, `lib/hiking/list.ts`): sort, region and level chips; sections 予定, 行きたい, 歩いた.
- **A trail:** the map full screen under a drag-up sheet (chart, plan card, write-up, credits).
- <a id="start-time"></a>**Start time** (anyone's, seen by all): the plan card's 「出発 7:00 ✎」 chip (`StartChip.svelte`)
  shifts every stop by the same minutes (`lib/hiking/start.ts` `shiftPlan`); 元に戻す sends null; 日の入り後に下山 when the
  finish passes sunset. The record's `hike_start` `{slug, hm}` (`contract/hikeStart.ts`), one slot a slug.
- **Adding a hike:** ＋ → YAMAPのリンクから · GPXファイルから · 手で入力 → `HikeForm.svelte`.
- Units follow the km / mi switch (`travel/units.ts`).

## Open

- The GPX picker's `accept=` may grey out a .gpx in iOS Files: check on a phone.
- Not built: recording a hike, landscape docked sheet, waypoint popups.
