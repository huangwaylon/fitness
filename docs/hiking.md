# トレイル (hiking trails)

The hiking-trails app (`~/Documents/other/hiking-trails`, "Ume-chan's Trails") ported into the island: thirteen trails
(eight in Washington State, five in Japan: two from the old app, 美ヶ原 and 赤城山 from our own YAMAP activities, 秋川渓谷
from a YAMAP plan) on topo maps, with a scrubbable elevation chart and the plans' cards (Kinpu's, Akigawa's). Drawn on
the unified kit like 旅行 and 結婚式 (design.md "Unified kit"); one list, no tab bar.

## Decisions

- The old app's content comes as it is: write-ups, AllTrails' stats, the simplified tracks, the photos.
- The old map styles: USGS Topo for Washington, GSI 地理院タイル std for Japan, as MapLibre raster sources. The old
  IndexedDB tile store, save buttons and tile manifest are not ported ("Offline").
- Live tracking and the free hike: later.
- The entry: the HUD menu's 登山 pill ([design](design.md#island)).

## Entry

`components/hiking/open.svelte.ts`: `hiking` (a `lazySheet` mounted by `island/Hud.svelte`; the island paused under
it), `openTrails()` (the list), `openTrail(slug)` (‹ goes to the list). The Seattle guide's hike cards call
`openTrail(hikeSlugOf(day.hike.gpx))` (`lib/hiking/slugs.ts`, the slugs without the write-ups, which stay off /s: the
old `…/#/trail/<slug>` link to our slug, else null). With the demo's hooks, `window.__hiking` has both.

## Data

`lib/hiking/`: `types.ts`, `slugs.ts`, `trails.ts` (the thirteen, JA + EN; km and m converted once from AllTrails' miles and feet;
the gain is AllTrails' DEM figure on purpose: a GPX's own elevations over-count it by 50–60 %), `strings.ts` (chrome
pairs and formats), `track.ts` (pure), `load.ts`.

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
- **YAMAP's plan** (`akigawa-shiroyama`, 2026-11-21): the plan page saved by hand (its link is private), then
  `npm run hiking:tracks -- --yamap-plan <page.html> <slug>`: its `__NEXT_DATA__` checkpoints' legs (coords, altitudes) and
  summits into the same converter. The figures are the plan's (距離, のぼり, its タイム less the hour's rest); `plan`
  keeps the named stops (not the unnamed junctions, 標高…m points or a stop passed twice), the end (a junction at
  広徳寺's gate) named for the temple; the credit 「コース・計画：YAMAP」 (a trail with a photo and no record). The
  plan edited on YAMAP: save the page again and rerun (the 11-20 update: on past the station to 広徳寺, 11.2 km, `p2p`).
- **Photos:** `static/hiking/photos/<slug>.webp` (1080 × 720 q75: a card's width at 3×; AllTrails users' photos). The
  YAMAP three are from Wikimedia Commons (CC BY / BY-SA): a 3:2 crop (ffmpeg lanczos, `cwebp -q 75 -metadata none`) with
  the subject in the middle half, which the 120px band (~3:1) shows. `photo` holds the credit (title, author, file
  page, licence), shown in the trail's credits with 「トリミング・縮小」 as the licences ask.
- **Private values:** each plan's link, party and planner are `{p:<pre>PlanUrl}`, `{p:<pre>Party}`, `{p:<pre>Planner}`
  (`kinpu`, `akigawa`) from the record's `trip_note` of the trip `hiking` (set with `record.ts load`: docs/travel.md
  "Private values"). Until then they show 🔒 and the YAMAP link is hidden.

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

(backend.md "Service worker" › Offline.) The thirteen tracks are precached (~83 KB): every chart and route reads offline.
A photo seen is kept (`island-photos-v1`), one never seen is the paper placeholder. The map draws offline once it has
drawn on the phone: MapLibre in the shell, the USGS / GSI tiles it drew in `island-tiles-v1` (both send
`Access-Control-Allow-Origin: *`, so counted at their size); where none was kept, the track alone with the note.

Every trail has 「オフライン用に保存」 on the map, under ‹ (design.md "Offline maps"). The plan (`lib/offline/plan.ts`
`planTrail`): z12–13 within 3 km of the track, z14–16 within 1 km. Sizes: USGS 1.6–3.1 MB (Talapus 1.6, Pilchuck 1.9,
Valhalla 2.0, Lake 22 2.2, Snow Lake 2.4, Bridal Veil 2.6, Skyline 3.1), Enchantments 8.8 MB (519 tiles); GSI Akagi
1.6, Utsukushigahara 2.8, Kinpu 3.3, Fuji 4.4, Akigawa 5.3 (the YAMAP three with their own `DENSITY`: a lake's and a
plateau's tiles weigh ~60 % of the means, Akigawa's town streets 1.5×). GSI's tiles are kept on the phone only (never
re-served), saved to z16 (offline the source is capped there and scaled up past it); its credit
「出典：国土地理院（地理院タイル）」 shows on the map above the peek and in the credits.

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
  yuzu), the plan card (Kinpu, Akigawa), 概要, コース紹介, the tips, 詳細情報 (`.row.kv`), credits.
- Units follow the km / mi switch (`travel/units.ts`, 旅行's 設定 tab); the language the reader's locale.

## Later / left out

- Live tracking and the free hike: the seam is TrailView's `LocWatch` fix, passed to TrailMap's `fix`.
- No landscape side-docked sheet; no waypoint popups (dots on the map, dashed lines on the chart).
- `e2e/hiking.spec.ts` (logic tier) uses an invented fixture track (`e2e/fixtures/hiking/tiny.gpx`).
