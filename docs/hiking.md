# トレイル (hiking trails)

The hiking-trails app ("Ume-chan's Trails") ported into the island: fourteen trails (eight in Washington, six in Japan,
four from our YAMAP activities and plans) on topo maps, an elevation chart and the plans' cards; the unified kit, one list.

## Decisions

- The old app's content comes as it is: write-ups, AllTrails' stats, the simplified tracks, the photos.
- The old map styles (USGS Topo, GSI 地理院タイル std) as MapLibre raster sources; its tile store not ported ("Offline").
- Hike mode (歩きはじめる: the location, the strip, off-route and the junction card; "In-hike map") is navigation only:
  nothing recorded.
- The entry: the HUD menu's 登山 pill ([design](design.md#island)).

## Entry

`components/hiking/open.svelte.ts`: `hiking` (a `lazySheet` mounted by `island/Hud.svelte`; the island paused under
it), `openTrails()` (the list), `openTrail(slug)` (‹ goes to the list). The Seattle guide's hike cards call
`openTrail(hikeSlugOf(day.hike.gpx))` (`lib/hiking/slugs.ts`, the slugs without the write-ups, which stay off /s: the
old `…/#/trail/<slug>` link to our slug, else null). With the demo's hooks, `window.__hiking` has both.

## Data

`lib/hiking/`: `types.ts`, `slugs.ts`, `trails.ts` (the fourteen, JA + EN; km and m converted once from AllTrails' miles and feet;
the gain is AllTrails' DEM figure on purpose: a GPX's own elevations over-count it by 50–60 %), `strings.ts` (chrome
pairs and formats), `track.ts` (pure: what the view draws; a GPX into a track file is `contract/hikeTrack.ts`'s), `load.ts`,
`user.ts` (a registered hike as a trail).

- **Tracks:** `static/hiking/tracks/<slug>.json`, `{ v, len, pts: [lon, lat, ele][], wpts }`, from
  `npm run hiking:tracks -- <old repo>/gpx` (`scripts/hiking-tracks.ts`): elevation smoothed over the raw points (the
  old app's 15-point centred mean), then Douglas–Peucker at 5 m (102–727 points, 3–20 KB a trail). `len` is the raw
  length: the view stretches the simplified line's distances to it, so the km match the old app.
- **YAMAP's activities** (`utsukushigahara`, `akagi-kurobi`): the track and checkpoints from YAMAP's API without a
  login (`api.yamap.com/v3/activities/<id>/tracks`: ~20 m apart, DEM-corrected altitude), vendored trimmed
  (`scripts/data/yamap/<slug>.json`, `lib/hiking/yamapData.ts`): the route at full resolution, its summits (the
  waypoints, `WPT_JA`), the figures, the day; never the identity — no activity id or link, no members, photos or
  text, no trailheads, no clock. `--from scripts/data/yamap` rebuilds offline, `--save` refreshes live (the ids in
  gitignored `app/.env.local`); `yamapData.test` pins envelope = shipped track and scans for the
  banned keys. The figures are the activity page's (距離, のぼり, タイム with rests); `walked` keeps the date, くだり,
  標準タイム and コース定数, the credit 「軌跡・記録：YAMAP」. No link and no names (the page names the walkers).
- **YAMAP's plans** (`akigawa-shiroyama`, `ono-yama`): the plan page saved by hand (its link is private), then
  `npm run hiking:tracks -- --yamap-plan <page.html> <slug> --save scripts/data/yamap` (its `__NEXT_DATA__` legs and
  summits vendored the same way — the page never committed, its id, party and planner never read); later rebuilds
  `--yamap-plan --from scripts/data/yamap <slug>`. The figures are the plan's (its タイム less the rest); `plan` keeps
  the named stops; credit 「コース・計画：YAMAP」. Edited on YAMAP: save and rerun. 日出 / 日入 (not on the page): the
  sun's times for the date at the track, rounded down.
- **Photos:** `static/hiking/photos/<slug>.webp` (1080 × 720 q75; AllTrails users'). The YAMAP four from Wikimedia
  Commons (CC BY / BY-SA): a 3:2 crop (`cwebp -q 75 -metadata none`), the subject in the middle half; `photo` holds the
  credit, shown with 「トリミング・縮小」.
- **Private values:** each plan's link, party and planner are `{p:<pre>PlanUrl}`, `{p:<pre>Party}`, `{p:<pre>Planner}`
  (`kinpu`, `akigawa`, `ono`) from the record's `trip_note` of the trip `hiking` (set with `record.ts load`: docs/travel.md
  "Private values"). Until then they show 🔒 and the YAMAP link is hidden.

- **Registered hikes** (anyone's, the guest's too): the record's `hike` and `hike_trk` events (`contract/hike.ts`),
  read and sent by `components/hiking/hikes.svelte.ts` (queued offline). `user.ts` `hikeTrail` makes each a Trail
  (slug `u-<id>`): its figures, else the track's; the level from km + 1 per 100 m up; GSI inside Japan, else USGS; the
  route from the track's ends. The track only from the record's rows. 削除 is held for the banner's 取り消す. YAMAP's
  link is read by the relay (`POST /hiking`); a GPX on the phone (`parseGpx` → `fitTrack` at 5–80 m to the cap),
  checked as the record checks it before sending. A link already saved opens that hike. A registered hike's data
  stays on the record, never in the repo; promotion to the curated trails is manual (export → trim → review).

## Map

`components/hiking/TrailMap.svelte` (light) and `map/engine.ts` (MapLibre, sharing the trip map's chunk; not
precached, kept once a map draws; its worker our own file). `map/style.ts` `TOPO` puts the region's raster under the
overlays, coloured by literal copies of app tokens (`C`: the track `--c-coral-text` on a cream halo, trailhead
`--c-leaf-edge`, end coral, waypoints `--c-yuzu-lip`, the scrub dot #8A6FD6, the location dot `--c-sky`). The CSP's
`connect-src` names `basemap.nationalmap.gov` and `cyberjapandata.gsi.go.jp`; MapLibre decodes the tiles from `blob:`,
which `img-src` allows. Zoom 9 to each source's ceiling (USGS 16, GSI 18). Tiles that don't come show the track alone
with a note; offline before a map ever drew, a retry. Under drawOff() (the e2e logic tier) a stub draws the track and
dot as SVG.

## Offline

(backend.md "Service worker" › Offline.) The fourteen tracks are precached (~88 KB): every chart and route reads offline.
A photo seen is kept (`island-photos-v1`), one never seen is the paper placeholder. The map draws offline once it has
drawn on the phone: MapLibre in the shell, the USGS / GSI tiles it drew in `island-tiles-v1` (both send
`Access-Control-Allow-Origin: *`, so counted at their size); where none was kept, the track alone with the note.

Every trail has 「オフライン用に保存」 on the map, under ‹ (design.md "Offline maps"). The plan (`lib/offline/plan.ts`
`planTrail`): z12–13 within 3 km of the track, z14–16 within 1 km. Sizes: USGS 1.6–8.8 MB, GSI 1.6–6.4 MB (plan.test
MEASURED; the YAMAP four with their own `DENSITY`). GSI's tiles are kept on the phone only (never
re-served), saved to z16 (a saved area's source is capped there, online too: a dead valley can still say online); its
credit
「出典：国土地理院（地理院タイル）」 shows on the map above the peek and in the credits.

## Reference trails

The other paths around a Japan trail, and the forks on its route, from OpenStreetMap (never YAMAP's 登山道 layer nor
other users' activities: its terms). One file a trail, `static/hiking/net/<slug>.json` (the six GSI trails; none for
the US ones or a registered hike: its box would place a private hike in the public repo).

- Source and licence: OpenStreetMap through the Overpass API, © OpenStreetMap contributors, ODbL 1.0
  (`static/hiking/net/LICENSE`; the repo has no licence of its own that could claim them). The credit
  「© OpenStreetMap contributors」 goes on the map whenever the layer draws, and OSM is in the credits.
- Refresh, by hand: `npm run hiking:net [slug …]` (`scripts/hiking-net.ts`; `--save <dir>` keeps the Overpass answers,
  `--from <dir>` builds from them offline). overpass-api.de, then kumi, 3 tries each. Rerun a trail
  whenever its track is rebuilt: `net.test` fails on a stale file.
- The build (`lib/hiking/netBuild.ts`, unit-tested on invented networks, never the network): the track's box + 1 km,
  path / footway / track / steps / bridleway, and roads only within 150 m of the track. Forks are found on the full
  network: ≥ 3 path / footway / track / steps ends within 25 m of the route (a dead end under 80 m, a hut's door, is
  none), one pass for each time the route goes by (an out-and-back twice; the next switchback leg, a visit within 300 m
  along that is 8 m farther than another and itself over 12 m off, is not a pass; a short summit spur's way back down
  is). Then
  the route is taken out: each 5 m of it claims the nearest edge running along it within 22 m, and only the unclaimed
  rest is drawn (a path 10 m beside the route stays when another edge is the route). Douglas–Peucker 5 m, 5 decimals,
  1 km of the track. Branch bearings 25 m out; a branch's label is its way's name, else the next named peak, saddle,
  hut or guidepost (its destination; Tokyo's numbered posts are no names) within 3 km along it; the route's own
  ways prefer a peak, saddle, hut or shelter, and skip a guidepost naming where the way comes from (the end behind it,
  by the plan's stops or the name's （A〜B）; a peak passed); a label on two branches of one fork on neither.
- Schema (`lib/hiking/net.ts`, v1): `{v:1, src:'osm', at, trk, north:'true', lines:[{c, n?, h, sac?}],
  forks:[{p, pass:[{at, inDeg, take}], br:[{deg, n?, line}]}], pois?}`. `at` the OSM data's day; `trk` the hash of the
  track it was built from (another track: forks hidden, lines still drawn); a pass's `at` is the trail view's distance
  (m), `take` the branch it leaves by; a branch's `line` is its index in `lines`, -1 the route itself. `pois` (named
  peaks, saddles, huts, shelters, guideposts) are not drawn yet.
- Loading: `load.ts` `loadNet` as the map opens (`parseNet`: null on anything unexpected). Not precached; the worker keeps
  one seen (`island-photos-v1`), and 「オフライン用に保存」 stores it in the trail's area (`planTrail`'s `files`).
- The e2e fixture: `e2e/fixtures/hiking/tiny-net.json` on `tiny.gpx` (2 forks, the first passed twice; 5 lines).

## Saved places

The saved places ([places.md](places.md)) within 2 km of the track, at most 40, nearest first (`lib/places/geo.ts`
nearTrack), as 16 px ink-brown rounded squares with a cream rim and glyph (12 px in hike mode). The legend reads
「━ このルート ┄ 参考ルート ■ 保存した場所」, each half after the route's key its layer's toggle; 保存した場所 on by
default, kept on the phone (`island.trailPlaces`). A square's tap: a floating card (name, category, the hours line,
ルート, ✕). The places' copy is read on view, so the layer works offline.

## In-hike map

`components/hiking/map/`: `live.svelte.ts` holds the trail view's live state (the location watch, the compass, the
camera's mode, hike mode); `follow.ts`, `compass.ts`, `hike.ts`, `junction.ts`, `route.ts` and `wake.ts` are its pure
parts; `TopSlot`, `MapDiscs` and `HikeStrip` its pieces of the view. Navigation only: nothing recorded, the position and
heading never leave the phone (`act:hike.*` counters say what, never where). No background alert (a web app gets no
position while locked).

- **Gestures:** two-finger rotation (MapLibre's 25 px threshold); no drag-rotate or pitch; `fit()` lands north up. A
  one-finger pan lets the camera go; a pinch or a turn keeps following (about the dot). The sheet's height refits the
  track only when the camera neither follows nor was moved by hand.
- **Discs** (bottom-right, 56 px drawn in a 64 px hit area, high contrast): the location disc loops off (crosshair) →
  追従 (filled arrow: the dot kept in the band between the controls and the sheet) → off; after a pan it is free
  (hollow arrow) and a tap follows again; into 追従 the map turns back to north. A 1 s label: 追従中 / 現在地オフ. In hike mode it never goes off (a tap
  re-centres). The compass never turns the map, only the dot's cone. The N disc shows only while the map is turned
  (|bearing| > 0.5°); a tap brings north up. The N disc and the legend are themed by the hour as ＋ −; the location
  disc stays high contrast.
- **Compass** (the cone only): iOS's `DeviceOrientationEvent.requestPermission()` is called first thing in the tap
  from off or free into 追従 and in 歩きはじめる's tap (no await before it), once a session; a relaunch's resumed hike
  never asks (no tap), the next locate tap does. It runs with the location, paused while hidden. Refused or
  unsupported: no cone, never asked again that session, and 「向きを表示するには、コンパスへのアクセスを許可してください」
  once, with the Settings path. `webkitCompassHeading` (magnetic) plus the screen's
  rotation and a declination table (`compass.ts`), smoothed (≤ 15 Hz, ≥ 2°); `webkitCompassAccuracy` widens the cone
  (15–60°), worse than 30° shows the figure-8 hint. Permissions-Policy: accelerometer, gyroscope, magnetometer (self).
- **The dot:** sky, 3 px rim, a map-aligned cone, a true-scale accuracy circle. A fix from before the page hid is
  stale: hollow grey, no cone, till a fresh one.
- **Hike mode** (歩きはじめる; 終了): 歩きはじめる, a quiet cream row under the chart (below the peek's fold), with
  「のこり距離・到着時刻・ルート外れを表示」; its tap folds the sheet. 終了: 「ナビを終了しました · 取り消す」 for 5 s.
  `maximumAge` 2 s. The peek becomes the strip (Fredoka 22, cream): 歩いた · のこり · のぼり · {山頂/ゴール}到着 {H:MM}ごろ,
  the ETA the trail's standard time spread by effort (4 km/h, 300 m/h up, 500 m/h down) and scaled by what's left.
  The chart behind a tap (「現在地」 in sky); the walked route at 40 % (`route.ts`: one line-gradient value a fix). Matching (`hike.ts`): a moving window along the route; after a silence
  over 60 s or a jump over 300 m the whole route is searched (the pass nearest a walker's reach), several passes make
  it unsure (no junction way till 50 m on); only fixes ≤ 100 m accurate and near the route move it; the direction
  turns on two fixes 30 m the other way; a step over 12 km/h counts for nothing. Kept for a relaunch
  (`resume.ts`, localStorage `island.hikeNow`: trail, metres along, direction, time; no coordinates, never sent):
  reopened within 12 h it resumes; 終了 removes it.
- **Off the route** (R4): beyond max(50 m, 2 × accuracy) for ≥ 3 fixes and ≥ 20 s shows the coral banner
  「ルートから{n}外れています」 (metres to 10, from 1,000 m km to a tenth) and a dashed line to the route's nearest
  point. Under 30 m it clears (「ルートに戻りました」, 4 s). Fixes worse than 100 m don't count. Visual only.
  Begun over 1 km away: 「ルートまで{n}」 till on the route.
- **画面をつけたままにする** (hike mode only): a screen wake lock, taken back when the page shows again. If the system lets
  go of it while the page is shown (Low Power Mode), the switch reads off.
- **Reference trails** (a Japan guide trail's net file, `loadNet`): OSM's paths draw dashed slate blue (roads paler
  and thinner) under the coral route, with forks as yuzu rings (⑂). The legend's 参考ルート half is the layer's toggle
  (on by default; [Saved places](#saved-places) shares the chip). MapLibre's attribution names © OpenStreetMap contributors while the layer draws, and so do
  the trail's credits. A file whose `trk` isn't this track's draws its lines but no forks.
- **The junction card** (R1, R12; hike mode; `junction.ts`): the next fork with a footpath within 150 m (kept 15 m
  past): 「分岐まで{n}m · ルートは{右/左/直進}」 and the names (the route's first, in coral). The word only when the
  route's branch is over 45° from every other way and unique, else 「ルートは地図の太線」; from the track's bearings,
  never the compass; walked backward, the fork behind; unsure match: no names. The way to go draws thick (80 m), the
  others grey. It shares the top slot with the off-route banner, which wins.
- **The top slot** (`TopSlot.svelte`): two live regions always there, empty when nothing shows: role="alert" for off
  the route, role="status" for the rest. The fork's distance on screen moves by 10 m; a screen reader hears it at a
  new fork and in 50 m steps.
- e2e: `hiking.spec.ts` fakes the geolocation, the compass, the wake lock, the clock (skewed) and a screen lock; the
  drawn tests (@render) cover the bearing, the N disc, the cone and the OSM credit.
- **A saved area's net file on a weak network:** the worker waits 3 s for the network (none at all offline), then
  serves the saved copy (`service-worker/netFallback.ts`).

## Screens

- **The list:** NavBar (✕); one ChipRow: the sort chip (its ActionSheet: おすすめ順, 距離が短い順, 標高差が小さい順, 時間が短い順),
  すべて 日本 ワシントン州 (one region; すべて clears the levels too), 中級 上級 最上級 (any of them). Then the trails by
  section (`lib/hiking/list.ts`, from the trail's own data and Tokyo's day): **予定** (a plan today or later, soonest
  first) as photo cards, a 120px PhotoBand (the level's sticker; name, area, the date) over a StatStrip (距離 · 標高差 ·
  時間, `stats.ts`); **行きたい** (the guide's order) and **歩いた** (walked, or a plan's day gone; newest first, the date
  in place of the area) as 64px rows in a dense card: a 56px thumb, name, area, the figures in one line, the sticker.
  A sort other than おすすめ orders inside each section.
- **A trail:** the map full screen under ‹ ✕ and the cream discs (＋ −, locate: the trip map's `LocWatch`, the
  position never leaves the phone). The drag-up sheet: the peek (name, figures, 難易度) tall enough for the whole
  elevation chart, dragged or tapped up to under ‹ ✕; Esc folds it. The body: the chart (press: the readout and the
  map's dot, kept till tapped again), the plan card (Kinpu, Akigawa, Ōno), 概要, コース紹介, the tips, 詳細情報, credits.
- <a id="start-time"></a>**Start time** (2026-11-22, anyone's, seen by all): the plan card's 「出発 7:00 ✎」 chip is an
  unseen `<input type=time>` over it (iOS's wheel). A new start shifts every stop, the stay and the finish by the same
  minutes (`lib/hiking/start.ts` `shiftPlan`; the total unchanged, a stop past midnight 翌); moved, 「予定 7:00 → 8:30」
  and 元に戻す (null: the plan's own; picking the plan's start sends null too); 日の入り後に下山 when the finish passes the
  sunset. A registered hike not yet walked gets the chip with no start of its own, and 下山 …ごろ from its 時間. The record's
  `hike_start` `{slug, hm}` (`contract/hikeStart.ts`), one slot a slug, the latest to arrive wins. Hike mode
  (`scheduleOf`): before the first fix 到着 is the plan's finish (予定); after it, the arrival counts from the start while
  that is still ahead; 日の入り後に下山 under the strip too.
- **Adding a hike:** ＋ in the list's bar → YAMAPのリンクから · GPXファイルから · 手で入力 → `HikeForm.svelte`: the link
  (読み込む) or the file, then name (no one's name), 状況, エリア, 日付, the figures (a link's or a file's read-only), 時間,
  メモ, the chart as preview. Errors are one line under the field. A registered hike: the paper placeholder for its
  photo; its view adds 記録 (状況, 日付, メモ; 編集 · 削除) and 「軌跡・記録：YAMAP」 for a link's; no track: a plain page.
- Units follow the km / mi switch (`travel/units.ts`, 旅行's 設定 tab); the language the reader's locale.

## Later / left out

- Recording a hike (a track kept, a free hike with no trail): hike mode navigates only.
- The GPX picker's `accept=` (.gpx and the XML types) may grey a .gpx out in iOS's Files picker: check on a phone.
- No landscape side-docked sheet; no waypoint popups (dots on the map, dashed lines on the chart).
- `e2e/hiking.spec.ts` (logic tier) uses an invented fixture track (`e2e/fixtures/hiking/tiny.gpx`);
  `e2e/hiking-user.spec.ts` registers hikes on the relay's real record (e2e/liveRoom.ts), YAMAP's import route-mocked
  with an invented activity.
