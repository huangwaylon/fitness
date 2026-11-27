# トレイル (hiking trails)

Ume-chan's Trails in the island: fourteen trails (eight in Washington, six in Japan, four from our YAMAP activities
and plans) on topo maps with an elevation chart, plus anyone's registered hikes. From the menu's 登山
([design](design.md#island)). Hike mode navigates only: nothing is recorded ([decisions](decisions.md#trips-and-offline)).

## Entry
`components/hiking/open.svelte.ts`: `hiking` (a `lazySheet` over the paused island), `openTrails()`, `openTrail(slug)`.
The Seattle guide's hike cards call `openTrail(hikeSlugOf(gpx))` (`lib/hiking/slugs.ts`).

## Data
`lib/hiking/`: `trails.ts` (the fourteen, JA + EN; distance and gain from AllTrails: a GPX's own elevations over-count),
`track.ts`, `load.ts`, `user.ts`, `list.ts`; GPX to track `contract/hikeTrack.ts`.
- **Tracks:** `static/hiking/tracks/<slug>.json` from `npm run hiking:tracks` (`scripts/hiking-tracks.ts`, its header
  lists the modes): smoothed elevation, Douglas–Peucker at 5 m, `len` the raw length.
- **YAMAP activities** (2): vendored trimmed in `scripts/data/yamap/` (`yamapData.ts VENDORED`), never the identity
  (no id, link, members, photos, text); `yamapData.test` scans for banned keys; ids in gitignored `app/.env.local`.
  **Plans** (2): built from a hand-saved page (`--yamap-plan`), envelopes not vendored. Credit 「軌跡・記録：YAMAP」 /
  「コース・計画：YAMAP」, no link, no names.
- **Photos:** `app/scripts/data/hiking-photos/` (not deployed; the YAMAP four from Wikimedia Commons, credited); the
  app ships thumbs and bands (`npm run hiking:thumbs`).
- **Private values:** each plan's link, party and planner as `{p:…}` keys in trip `hiking`'s `trip_note`
  ([travel](travel.md#private-values)); until set 🔒 and no YAMAP link.
- **Registered hikes** (anyone's): `hike` and `hike_trk` events (`contract/hike.ts`, `components/hiking/hikes.svelte.ts`,
  queued offline); `user.ts hikeTrail` makes a Trail (`u-<id>`; GSI in Japan, else USGS). Input: a YAMAP link read by
  the relay (`POST /hiking`, `relay/src/hikeRoute.ts`), a GPX parsed on the phone, or by hand. Never in the repo.

## Map
`components/hiking/TrailMap.svelte` + `map/engine.ts` on the maps' core. `map/style.ts`: USGS Topo (z9–16) or GSI
(z9–18) raster (both in CSP `connect-src`); 「地図を読み込み中…」 after 2 s without a tile; the track alone offline.

## Offline
The tracks are precached; photos and tiles kept once seen ([backend](backend.md#service-worker)). 「オフライン用に保存」
(`lib/offline/plan.ts planTrail`): z12–13 within 3 km, z14–16 within 1 km (1.6–8.8 MB). On a weak network the worker
serves a saved file after 3 s (`service-worker/netFallback.ts`).

## Reference trails
OSM paths and forks around the six Japan trails only (never YAMAP's layer; none for US or registered hikes), in
`static/hiking/net/<slug>.json`, ODbL, credit 「© OpenStreetMap contributors」. Refresh `npm run hiking:net [slug]`
(`scripts/hiking-net.ts`); rerun after a track rebuild (`net.test` fails on a stale file). Built by
`lib/hiking/netBuild.ts` (forks = 3+ path ends within 25 m); schema `lib/hiking/net.ts` (`trk` = the track's hash).

## Saved places
The maps' shared layer (`components/map/places/`): saved places within 2 km of the track (40 nearest); the layers disc
toggles it and 参考ルート (`island.mapPlaces`); a tap opens `PlaceFloat`. Works offline.

## In-hike map
`components/hiking/map/`: `live.svelte.ts` over pure `follow.ts`, `compass.ts`, `hike.ts`, `junction.ts`, `route.ts`,
`wake.ts`. Position and heading never leave the phone (`act:hike.*` counters only); no background alert.
- **Camera:** two-finger rotation, no pitch; location disc off → 追従; the compass turns only the dot's cone.
- **Compass:** asked on the tap into 追従 or 歩きはじめる, once a session.
- **Hike mode** (歩きはじめる; offered on a planned hike's day, `list.ts hikeToday`): the strip 歩いた · のこり · のぼり ·
  到着 (4 km/h, 300 m/h up, 500 m/h down); matching `hike.ts MATCH` (fixes > 100 m ignored); resume within 12 h
  (`resume.ts`, no coordinates); local notification `hiking/map/notify.ts`; wake lock (画面をつけたままにする).
- **Off the route** (`OFF`): beyond max(50 m, 2 × accuracy) for 3 fixes and 20 s; clears under 30 m.
- **Junction card** (`junction.ts`): the next fork within 150 m, direction from the track's bearings, never the compass.
- e2e: `hiking.spec.ts` fakes geolocation, compass, wake lock, clock.

## Screens
- **The list** (`TrailList.svelte`): sort, region and level chips; 予定, 行きたい, 歩いた.
- **A trail:** the map full screen under a drag-up sheet (chart, plan card, write-up, credits).
- <a id="start-time"></a>**Start time** (anyone's): 「出発 7:00 ✎」 (`StartChip.svelte`) shifts every stop
  (`start.ts shiftPlan`); 日の入り後に下山 past sunset; the record's `hike_start` `{slug, hm}`, one a slug.
- **Adding a hike:** ＋ → YAMAPのリンク · GPX · 手で入力 (`HikeForm.svelte`). Units follow km / mi.

## Open
- On a real iPhone: the GPX picker's `accept=` in iOS Files; hike mode outdoors.
- Not built: recording, landscape docked sheet, waypoint popups.
