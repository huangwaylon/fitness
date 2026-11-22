# トレイル (hiking trails)

The hiking-trails app (`~/Documents/other/hiking-trails`, "Ume-chan's Trails") ported into the island: fourteen trails
(eight in Washington State, six in Japan: two from the old app, 美ヶ原 and 赤城山 from our own YAMAP activities, 秋川渓谷
and 大野山 from YAMAP plans) on topo maps, with a scrubbable elevation chart and the plans' cards (Kinpu's, Akigawa's,
Ōno's). Drawn on the unified kit like 旅行 and 結婚式 (design.md "Unified kit"); one list, no tab bar.

## Decisions

- The old app's content comes as it is: write-ups, AllTrails' stats, the simplified tracks, the photos.
- The old map styles: USGS Topo for Washington, GSI 地理院タイル std for Japan, as MapLibre raster sources. The old
  IndexedDB tile store, save buttons and tile manifest are not ported ("Offline").
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
- **YAMAP's activities** (`utsukushigahara`, `akagi-kurobi`): `npm run hiking:tracks -- --yamap` reads each public
  activity's track and checkpoints from YAMAP's API without a login (`api.yamap.com/v3/activities/<id>/tracks`: ~20 m
  apart, DEM-corrected altitude; the GPX export needs a login), its summits the waypoints (`WPT_JA`), into the same
  converter. No raw copy kept: the API gives it again. The figures are the activity page's (距離, のぼり, タイム with
  rests); `walked` keeps the date, くだり, 標準タイム and コース定数, the credit 「軌跡・記録：YAMAP」. No link and no names
  (the page names the walkers).
- **YAMAP's plans** (`akigawa-shiroyama`, 2026-11-21; `ono-yama`, 2026-11-23): the plan page saved by hand (its link is private), then
  `npm run hiking:tracks -- --yamap-plan <page.html> <slug>`: its `__NEXT_DATA__` checkpoints' legs (coords, altitudes) and
  summits into the same converter. The figures are the plan's (距離, のぼり, its タイム less the hour's rest); `plan`
  keeps the named stops (not the unnamed junctions, 標高…m points or a stop passed twice), the end (a junction at
  広徳寺's gate) named for the temple; the credit 「コース・計画：YAMAP」 (a trail with a photo and no record). The
  plan edited on YAMAP: save the page again and rerun (the 11-20 update: on past the station to 広徳寺, 11.2 km, `p2p`).
  The plan page has no 日出 / 日入 (drawn on the phone): the sun's times for the date at the track, rounded down.
- **Photos:** `static/hiking/photos/<slug>.webp` (1080 × 720 q75: a card's width at 3×; AllTrails users' photos). The
  YAMAP four are from Wikimedia Commons (CC BY / BY-SA): a 3:2 crop (ffmpeg lanczos, `cwebp -q 75 -metadata none`) with
  the subject in the middle half, which the 120px band (~3:1) shows. `photo` holds the credit (title, author, file
  page, licence), shown in the trail's credits with 「トリミング・縮小」 as the licences ask.
- **Private values:** each plan's link, party and planner are `{p:<pre>PlanUrl}`, `{p:<pre>Party}`, `{p:<pre>Planner}`
  (`kinpu`, `akigawa`, `ono`) from the record's `trip_note` of the trip `hiking` (set with `record.ts load`: docs/travel.md
  "Private values"). Until then they show 🔒 and the YAMAP link is hidden.

- **Registered hikes** (anyone's, the guest's too): the record's `hike` and `hike_trk` events (docs/backend.md,
  `contract/hike.ts`), read and sent by `components/hiking/hikes.svelte.ts` like やること's (queued offline). `user.ts`
  `hikeTrail` makes each a Trail (slug `u-<id>`, `user` its own fields): the hike's figures, else the track's (length,
  rises summed); the level the hike's, else from km + 1 per 100 m up (< 10 初級, < 20 中級, < 30 上級); the map GSI's
  inside Japan's box, else USGS; the route from the track's ends (apart 縦走; together 往復 when it walks back on
  itself, else 周回); no track: Tokyo, no map. Its section by its status: 歩いた, 行きたい, 予定 (undated or to come;
  its day gone, 歩いた). The track only ever from the record's rows, never fetched. A removal is final on the record, so
  削除 is held for the banner's 取り消す (`holdMs`), then sent. YAMAP's link is read by the relay (`POST /hiking`: no
  CORS for us, so it needs the network; a long share text is sent as the link alone); a GPX on the phone (`parseGpx`:
  track points, else a route's; single or double quotes; each segment's length on its own → `fitTrack` at 5–80 m to
  fit the cap; waypoint names one clean line), checked as the record checks a `hike_trk` before anything is sent. 保存
  says why it didn't (a figure not a number, not paired yet, a track the record won't take). A link already saved
  (`ref`) opens that hike; a registered hike's page draws its track whenever its row comes.

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
`planTrail`): z12–13 within 3 km of the track, z14–16 within 1 km. Sizes: USGS 1.6–3.1 MB, Enchantments 8.8 MB;
GSI 1.6 (Akagi) to 6.4 (Ōno) (the YAMAP four with their own `DENSITY`). GSI's tiles are kept on the phone only (never
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
  `--from <dir>` builds from them offline). overpass-api.de, then overpass.kumi.systems, 3 tries each. Rerun a trail
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
- Sizes (OSM of 2026-11-22): Fuji 7.5 KB gz (49 forks), Akigawa 11.9 (9), Ōno 7.7 (6), Utsukushigahara 4.7 (16),
  Akagi 2.4 (5), Kinpu 1.9 (0: no side path within 25 m of its ridge).
- The e2e fixture: `e2e/fixtures/hiking/tiny-net.json` on `tiny.gpx` (2 forks, the first passed twice; 5 lines).

## In-hike map

`components/hiking/map/`: `live.svelte.ts` holds the trail view's live state (the location watch, the compass, the
camera's mode, hike mode); `follow.ts`, `compass.ts`, `hike.ts`, `junction.ts`, `route.ts` and `wake.ts` are its pure
parts; `TopSlot`, `MapDiscs` and `HikeStrip` its pieces of the view. It's navigation only: nothing is recorded, and
the position and heading never leave the phone (the usage counters `act:hike.*` say what was used, never where:
docs/ops/observability.md). There's no background alert: a locked screen means no position, since a web app gets none
in the background.

- **Gestures:** two-finger rotation uses MapLibre's own threshold (25 px along the fingers' circle before a pinch
  turns the map; tune it on a phone). Drag-rotate and pitch stay off. `fit()` always lands north up. A one-finger pan
  lets the camera go (the disc goes hollow). A pinch keeps following, zoomed about the dot; a two-finger turn keeps
  following and keeps the turn. The sheet's height changing refits the track only when the camera neither
  follows nor was moved by hand since the last fit.
- **Discs** (bottom-right, 56 px drawn in a 64 px hit area, high contrast): the location disc loops off (crosshair) →
  追従 (filled arrow: the dot kept in the band between the controls and the sheet) → off; after a pan it is free
  (hollow arrow) and a tap follows again; into 追従 the map turns back to north. A 1 s label shows 追従中 / 現在地オフ. In hike mode the loop never goes off,
  since the position is needed: a tap while following re-centres (追従中). The compass never turns the map (user,
  2026-11-22): it only points the dot's cone. The N disc (turned by −bearing) shows only while the map is turned
  (|bearing| > 0.5°, after a two-finger turn); a tap brings north up. ＋ − stay top-right; the attribution and the
  legend sit bottom-left. The N disc and the legend are themed by the hour as ＋ − are
  (navy by night); the location disc stays high contrast.
- **Compass** (the cone only): iOS's `DeviceOrientationEvent.requestPermission()` is called first thing in the tap
  from off or free into 追従 and in 歩きはじめる's tap (no await before it), once a session; a relaunch's resumed hike
  never asks (no tap), the next locate tap does. It runs while the location does: stopped with it (off), paused while
  hidden, started again on the next tap without asking. Refused or unsupported, following goes on with no cone; a
  refusal sticks for the session, never asked again, and the copy 「向きを表示するには、コンパスへのアクセスを許可してください」
  shows once, pointing to Settings → Apps → Safari → Motion & Orientation Access (on its own line). `webkitCompassHeading` is magnetic: the screen's rotation
  is added, then an approximate declination table (Japan ~5° W in Okinawa to ~9.5° W in Hokkaido, linear in latitude,
  within ~0.5°; Washington 15° E). Readings are smoothed on the circle, at most one change per frame (~15 Hz), none
  under 2°, none while hidden. `webkitCompassAccuracy` widens the cone (15–60°); unreliable or worse than 30° shows
  the figure-8 hint whenever the cone shows. Permissions-Policy: `accelerometer`, `gyroscope`, `magnetometer` = (self) (decisions.md
  "Compass").
- **The dot:** sky, 3 px rim; the heading cone is a map-aligned symbol; a true-scale accuracy circle comes from the
  fix's accuracy. A fix from before the page hid (a screen lock) is stale: the dot hollow grey, the circle grey, no
  cone, till a fresh fix comes. A heading moves only the dot's feature, never the circle.
- **Hike mode** (歩きはじめる; 終了): 歩きはじめる is a quiet cream row (the paper button, as 編集) under the chart, below
  the peek's fold (tracking is occasional: seen when the sheet is opened), with its note 「のこり距離・到着時刻・ルート外れを表示」;
  its tap folds the sheet to the peek. 終了 shows the undo banner 「ナビを終了しました · 取り消す」 for 5 s: 取り消す puts
  hike mode back with its match, kept place and wake switch (once the view has left, nothing). Geolocation `maximumAge` 2 s. The peek becomes the strip (Fredoka 22,
  solid cream, ink at every hour): 歩いた · のこり · のぼり (climb left, the track's elevations as they are) ·
  {山頂/ゴール}到着 {H:MM}ごろ. The ETA is the trail's standard time
  (a record's 標準タイム, else its time, a range's longer end), spread over the route by effort (4 km/h, 300 m/h up,
  500 m/h down) and scaled by what's left. No pace adjustment yet. The chart sits behind a tap, with 「現在地」 in sky
  and the walked part faded. The route's walked part draws at 40 %: one line, its colour stepped at the split
  (`route.ts`: a line-gradient on `line-progress`), so a fix changes one paint value. Matching uses a moving window
  (150 m back, 600 m ahead, a step back costing a little and a step ahead a tenth of that). After a silence over 60 s
  or a jump over 300 m, the whole route is searched first: of its passes near the fix (within 20 m of the nearest),
  the one nearest where 3 km/h in the direction of travel puts them, each metre beyond what a walker could have
  reached since (6 km/h + 200 m) counted twice (out-and-back safe, a turn back too); never placed, the first pass
  (the hike's start). Two or more such passes after a silence or a jump (a figure 8's crossing, an out-and-back's
  legs) make the match unsure: the junction card gives no way till the window has followed it 50 m, and meanwhile
  a pass 20 m nearer than the window's sends it back to the whole route. Only fixes with an accuracy of 100 m or
  better, within max(50 m, 2 × accuracy) of the route, move it (the first placement: within 1 km). The direction of travel is the sign of the last 30 m along the route, turned only by two
  fixes in a row 30 m the other way; a step faster than 12 km/h since the last that counted (a GPS spike, a snap to
  the next switchback) counts for nothing, and a whole-route search reads it afresh from its place. The hike is kept
  on the phone for a relaunch (`components/hiking/resume.ts`, localStorage `island.hikeNow`: the trail, the metres
  along its route, the direction, the time; no coordinates, never sent): the trail opened again within 12 h of the
  last fix is back in hike mode, its next fix searched from that place only if the time since is within the
  remaining route's standard time (3 h without one; else from the first pass along: a hike left unended, back at
  the trailhead). 終了 removes it; each launch drops one over 12 h old.
- **Off the route** (R4): beyond max(50 m, 2 × accuracy) for ≥ 3 fixes and ≥ 20 s shows the coral banner
  「ルートから{n}外れています」 (metres to 10, from 1,000 m km to a tenth) and a dashed line to the route's nearest
  point. Under 30 m it clears, with 「ルートに戻りました」 for 4 s. A fix worse than 100 m counts neither way. Visual
  only: no sound, no vibration. A hike begun over 1 km from the route (the drive, the station) shows the neutral
  「ルートまで{n}」 instead, till a fix is on the route.
- **画面をつけたままにする** (hike mode only): a screen wake lock, taken back when the page shows again. If the system lets
  go of it while the page is shown (Low Power Mode), the switch reads off.
- **Reference trails** (a Japan guide trail's net file, `loadNet`): OSM's paths draw dashed slate blue (roads paler
  and thinner) under the coral route, with forks as yuzu rings (⑂). The chip 「━ このルート ┄ 参考ルート」 is the legend;
  its 参考ルート half is the layer's toggle (on by default). MapLibre's attribution names © OpenStreetMap contributors while the layer draws, and so do
  the trail's credits. A file whose `trk` isn't this track's draws its lines but no forks.
- **The junction card** (R1, R12; hike mode): the next fork on the way walked within 150 m (kept 15 m past it), only
  where a footpath leaves it: 「分岐まで{n}m · ルートは{右/左/直進}」 and the names (「右：東峰 / 沢コース」, the route's
  first in coral, 「このルート」 before its name for a screen reader). The direction comes from the bearing into the
  fork against each branch's bearing 25 m out, never the compass. A word shows only when the route's branch is more
  than 45° from every other way out and no other way gets the same word (−40° and −90°: both 左); else
  「ルートは地図の太線」 and the names. A fork OSM lacks has no card: a tip says it (Ōno's 地蔵岩コース). Walking the route backward (turned
  back), the fork is the one behind on the route, entered by the route's way out, and the way to go is the way the
  route came in (no such way within 60° to tell: no card). While the match is unsure, the card says only
  「ルートは地図の太線」 (no names) and draws no branch. Meanwhile the way to go draws thick (the route's next 80 m
  along the way walked) and the other ways' first 80 m grey, drawn once a fork. The card shares the one top slot
  with the off-route banner, which wins.
- **The top slot** (`TopSlot.svelte`): two live regions always there, empty when nothing shows: role="alert" for off
  the route, role="status" for the rest. The fork's distance on screen moves by 10 m; a screen reader hears it at a
  new fork and in 50 m steps.
- e2e: `hiking.spec.ts` fakes the geolocation (grantPermissions + setGeolocation), the compass (requestPermission
  granted, `webkitCompassHeading` events), the wake lock, the page's clock (skewed, never waited for) and a screen
  lock (visibilityState). The drawn tests (@render) cover the bearing (never turned by the compass), the N disc, the
  cone and the OSM credit.
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
- **A trail:** the map full screen under the game's buttons: NavBar's ‹ ✕, 44px cream discs with the brown edge and lip
  at every hour, ＋ − and locate alike (locate sky while on). The location dot only after locate, via the trip map's
  `LocWatch` (the position never leaves the phone). The drag-up sheet: grip, the peek (name, a StatStrip with 難易度)
  tall enough for the whole elevation chart; dragged or tapped up to 6px under ‹ ✕ (their row and the safe area stay
  the map's: the buttons never cover the sheet); Esc folds it. The body: the chart (press shows the readout and the
  map's dot, drag moves them, they stay on release, tap again clears; coral line over a leaf area, waypoints dashed
  yuzu), the plan card (Kinpu, Akigawa, Ōno; 山行日 once its day is gone, 実際 only with its hike's record), 概要, コース紹介, the tips, 詳細情報 (`.row.kv`), credits.
- **Adding a hike:** ＋ in the list's bar → an ActionSheet (YAMAPのリンクから · GPXファイルから · 手で入力) →
  `HikeForm.svelte`, one form sheet: YAMAP's link field (share text is fine) and 読み込む, or the file picker; then the
  name (check it holds no one's name), 状況 (行きたい · 予定 · 歩いた), エリア, 日付, the figures (a link's or a file's
  read-only, by hand typed), 時間, メモ, the track's chart as its preview (no map). Errors are one line under the field
  (a link not YAMAP's, a private activity's with 「GPXファイルから追加」, offline, the day's cap, YAMAP slow or odd). In the
  list a registered hike has the paper placeholder (a mountain) for its photo; its view adds 記録 (状況, 日付, メモ;
  編集 · 削除, asked) in the write-ups' place, credits 「軌跡・記録：YAMAP」 for a link's; with no track it is a plain
  page (the bar, the figures, the cards).
- Units follow the km / mi switch (`travel/units.ts`, 旅行's 設定 tab); the language the reader's locale.

## Later / left out

- Recording a hike (a track kept, a free hike with no trail): hike mode navigates only.
- The GPX picker's `accept=` (.gpx and the XML types) may grey a .gpx out in iOS's Files picker: check on a phone.
- No landscape side-docked sheet; no waypoint popups (dots on the map, dashed lines on the chart).
- `e2e/hiking.spec.ts` (logic tier) uses an invented fixture track (`e2e/fixtures/hiking/tiny.gpx`);
  `e2e/hiking-user.spec.ts` registers hikes on the relay's real record (e2e/liveRoom.ts), YAMAP's import route-mocked
  with an invented activity.
