# トレイル (hiking trails)

The hiking-trails app (`~/Documents/other/hiking-trails`, "Ume-chan's Trails") ported into the island: ten trails (eight
in Washington State, two in Japan) on topo maps, with a scrubbable elevation chart and Kinpu's YAMAP plan. It keeps that
app's own look (the Alpine Field Guide), not the island's NH skin.

## Decisions (the user, 2026-11-06)

- Everything comes as it is: the write-ups (the user's), AllTrails' stats, the simplified tracks and the ten photos.
- The old map styles: USGS Topo for Washington, GSI 地理院タイル std for Japan, as MapLibre raster sources. Online only;
  no tile saving, ever (the old app's IndexedDB tile store, its save buttons and tile manifest are not ported).
- Live tracking and the free hike: later.
- The entry: the leaf menu's トレイル pill (between けっこんしき and せってい).

## Entry

`components/hiking/open.svelte.ts`: `hiking` (a `lazySheet`, mounted by `island/Hud.svelte`; the island paused under it),
`openTrails()` (the list) and `openTrail(slug)` (that trail; ‹ goes to the list). The Seattle guide's hike cards call
`openTrail(hikeSlugOf(day.hike.gpx))` (`lib/hiking/trails.ts`: the old `…/#/trail/<slug>` link to one of our slugs, else
null). With the demo's hooks, `window.__hiking` has both.

## Data

`lib/hiking/`: `types.ts`, `trails.ts` (the ten, JA + EN; km and m are AllTrails' miles and feet converted once; the gain
is AllTrails' DEM figure on purpose, since a GPX's own elevations over-count it by 50–60 %), `strings.ts` (the chrome's
pairs and formats), `track.ts` (pure), `load.ts`.

- **Tracks:** `static/hiking/tracks/<slug>.json`, `{ v, len, pts: [lon, lat, ele][], wpts }`. They come from
  `npm run hiking:tracks -- <old repo>/gpx` (`scripts/hiking-tracks.ts`): elevation smoothed over the raw points (the
  old app's 15-point centred mean), then Douglas–Peucker at 5 m (771–7,153 points → 102–727; 3–20 KB a trail). `len`
  is the raw length: the view stretches the simplified line's distances to it, so the readout's km match the old app.
- **Photos:** `static/hiking/photos/<slug>.webp` (1200 × 800, AllTrails users' photos).
- Neither is precached (`service-worker/caches.ts` `isHiking`): each is fetched as a trail is read.
- **Private values:** Kinpu's plan link, party and planner are `{p:kinpuPlanUrl}`, `{p:kinpuParty}`, `{p:kinpuPlanner}`,
  read from the trip note of a trip named `hiking` (docs/travel.md "Private values": add a `hiking` entry to
  `trip-notes.json` and load it). Until then they show 🔒 and the YAMAP link is hidden.

## Map

`components/hiking/TrailMap.svelte` (light) and `map/engine.ts` (MapLibre, which shares the trip map's chunk: never
precached; its worker is our own file). `map/style.ts` `TOPO` holds the region's raster under the overlays, drawn in the
old app's colours: the track red on a white halo, the trailhead green, the end red, the waypoints amber, the scrub's dot
violet, the location dot blue. The CSP's `connect-src` names `basemap.nationalmap.gov` and `cyberjapandata.gsi.go.jp`:
MapLibre fetches the tiles and decodes them from `blob:`, which `img-src` already allows. Zoom runs from 9 to each
source's own ceiling (USGS 16, GSI 18). Tiles that don't come show the track alone with a note; offline before the
chunk is cached, a retry. Under drawOff() (the e2e's logic tier) a stub draws the track and the dot as SVG.

## Screens

- **The list:** the header with the contour drawing; the chips (すべて 中級 上級 超上級 | 距離 標高, a sort toggles off
  on a second tap); a photo card per trail. ✕ at the top right on both levels.
- **A trail:** the map full screen, with ‹, zoom and locate. The location dot appears only after the locate button,
  through the trip map's `LocWatch` (the position never leaves the phone). The bottom sheet's peek is tall enough for
  the whole elevation chart; drag or tap it up to 90 %, and Esc folds it back. The body: the chart (press shows the
  readout and the map's dot, drag moves them, let go and they stay, tap again to clear), Kinpu's plan card, 概要,
  コース紹介, tips, 詳細情報, credits.
- Units follow the phone's km / mi switch (`travel/units.ts`); the language follows the reader's locale.

## Later / left out

- Live tracking and the free hike: the seam is TrailView's `LocWatch` fix, passed to TrailMap's `fix`.
- No offline maps (the user's rule). No landscape side-docked sheet yet. No waypoint popups (the waypoints are dots on
  the map and dashed lines on the chart).
- `e2e/hiking.spec.ts` (logic tier) uses an invented fixture track (`e2e/fixtures/hiking/tiny.gpx`).
