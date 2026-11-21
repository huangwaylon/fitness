// トレイル's map style (docs/hiking.md "Map"), pure: the hiking app's own basemaps, raster topo for the trail's region
// (USGS Topo in the US, GSI 地理院タイル std in Japan: keyless, contours and hillshade baked in; the tiles a map drew
// kept by the service worker: their hosts are in the CSP's connect-src, vite.config.ts), under the trail's overlays in the app's colours
// (the route coral on a cream halo, walked faded; OSM's other trails dashed slate under it, their forks yuzu rings; the
// trailhead leaf, the end coral, the waypoints yuzu, the scrub's dot violet, the location dot sky with its heading cone
// and accuracy circle; docs/hiking.md "In-hike map").
import type { LayerSpecification, StyleSpecification } from 'maplibre-gl';
import type { Region } from '#lib/hiking/types.ts';

/** The hiking app's TILE_SOURCES: USGS is {z}/{y}/{x}, GSI {z}/{x}/{y}; each to its own native zoom. */
export const TOPO: Record<Region, { tiles: string[]; maxzoom: number; attribution: string }> = {
  us: { tiles: ['https://basemap.nationalmap.gov/arcgis/rest/services/USGSTopo/MapServer/tile/{z}/{y}/{x}'], maxzoom: 16, attribution: '© USGS National Map' },
  jp: { tiles: ['https://cyberjapandata.gsi.go.jp/xyz/std/{z}/{x}/{y}.png'], maxzoom: 18, attribution: '出典：国土地理院（地理院タイル）' }
};

/** The overlays' colours, literal copies of app tokens (MapLibre paints no CSS variables; styles/tokens.css): the track
 *  --c-coral-text, the trailhead --c-leaf-edge, the location --c-sky, a waypoint --c-yuzu-lip, the scrub --c-lilac's
 *  darker shade (the lilac itself is too light on a topo map); `rim` --c-card (the halo, the dots' rims), `paper`
 *  --c-paper (under the tiles); `net` the reference trails' slate blue (`road` a road's), `grey` a fork's other ways. */
export const C = { track: '#AD3F2B', start: '#2F8A3F', gps: '#4F9BE0', wpt: '#E6B22E', scrub: '#8A6FD6', rim: '#FFFCF2', paper: '#F5E4BC', net: '#3E5C9A', road: '#8496B8', grey: '#8E8A80' } as const;

/** The route's colours either side of the walked split (engine.ts drawWalked: a line-gradient, so the alpha is in the
 *  colour): the coral at 98 % ahead, 40 % walked; its cream halo 85 % and 40 %. */
const rgba = (hex: string, a: number) => `rgba(${[1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)).join(',')},${a})`;
export const ROUTE = { ahead: rgba(C.track, 0.98), walked: rgba(C.track, 0.4), halo: rgba(C.rim, 0.85), haloWalked: rgba(C.rim, 0.4) } as const;

/** OSM's footpaths (highway=*): drawn as trails; any other way (a road near the trail) paler and thinner. */
const FOOT = ['path', 'footway', 'steps', 'track', 'bridleway'];

export const SRC = { base: 'topo', track: 'track', marks: 'marks', scrub: 'scrub', loc: 'loc', acc: 'acc', off: 'off', net: 'net', forks: 'forks', hl: 'hl' } as const;

/** The reference layer's layers (shown or hidden together: the 参考ルート toggle). */
export const NET_LAYERS = ['net-halo', 'net', 'hl-other', 'forks'] as const;
/** OSM's credit, on the reference trails' source: MapLibre's attribution shows it whenever their layer draws. */
const OSM_CREDIT = '© OpenStreetMap contributors';

/** A dot `size` px across in all (a `rim` px cream rim inside it). */
const dot = (id: string, source: string, size: number, color: unknown, filter?: unknown, rim = 2.5): LayerSpecification =>
  ({ id, type: 'circle', source, ...(filter ? { filter } : {}), paint: { 'circle-radius': size / 2 - rim, 'circle-color': color, 'circle-stroke-color': C.rim, 'circle-stroke-width': rim } }) as LayerSpecification;

/** `then` for a stale fix's feature, else `other`. */
const stale = (then: string, other: string) => ['case', ['to-boolean', ['get', 'stale']], then, other];

const empty = { type: 'geojson', data: { type: 'FeatureCollection', features: [] } } as const;

/** The heading cone's images by half-angle (engine.ts draws them): the nearest to a reading's accuracy is shown. */
export const CONES = [15, 25, 40, 60] as const;
export const coneImage = (half: number): string => `cone-${CONES.reduce((a, b) => (Math.abs(b - half) < Math.abs(a - half) ? b : a))}`;

/** `maxzoom`: the topo's own unless capped (a saved area offline: engine.ts). */
export function buildStyle(region: Region, maxzoom = TOPO[region].maxzoom): StyleSpecification {
  const line = { 'line-join': 'round', 'line-cap': 'round' } as const;
  const src = (id: string) => [id, { ...empty }];
  return {
    version: 8,
    name: 'trails',
    sources: {
      [SRC.base]: { type: 'raster', tileSize: 256, ...TOPO[region], maxzoom },
      ...Object.fromEntries([SRC.marks, SRC.scrub, SRC.loc, SRC.acc, SRC.off, SRC.forks, SRC.hl].map(src)),
      // (line-progress for the walked split's gradient)
      [SRC.track]: { ...empty, lineMetrics: true },
      [SRC.net]: { ...empty, attribution: OSM_CREDIT }
    },
    layers: [
      { id: 'paper', type: 'background', paint: { 'background-color': C.paper } },
      { id: 'topo', type: 'raster', source: SRC.base },
      // OSM's other trails, under the route: thin, dashed, on a cream halo
      { id: 'net-halo', type: 'line', source: SRC.net, layout: line, paint: { 'line-color': C.rim, 'line-width': 5, 'line-opacity': 0.8 } },
      // (a road near the trail, OSM's h: thinner and paler than a footpath)
      { id: 'net', type: 'line', source: SRC.net, layout: { 'line-join': 'round' }, paint: { 'line-color': ['match', ['get', 'h'], FOOT, C.net, C.road], 'line-width': ['match', ['get', 'h'], FOOT, 3, 2], 'line-dasharray': [2, 2] } },
      // a fork's other ways, greyed while its card shows
      { id: 'hl-other', type: 'line', source: SRC.hl, filter: ['==', ['get', 'k'], 'other'], layout: line, paint: { 'line-color': C.grey, 'line-width': 4, 'line-opacity': 0.9 } },
      // the route, its walked part faded (the gradient's split moves with each fix)
      { id: 'track-halo', type: 'line', source: SRC.track, layout: line, paint: { 'line-width': 10, 'line-gradient': ['step', ['line-progress'], ROUTE.halo, 1, ROUTE.halo] } },
      { id: 'track', type: 'line', source: SRC.track, layout: line, paint: { 'line-width': 6, 'line-gradient': ['step', ['line-progress'], ROUTE.ahead, 1, ROUTE.ahead] } },
      // the route's way out of the fork ahead, thicker
      { id: 'hl-take-halo', type: 'line', source: SRC.hl, filter: ['==', ['get', 'k'], 'take'], layout: line, paint: { 'line-color': C.rim, 'line-width': 15 } },
      { id: 'hl-take', type: 'line', source: SRC.hl, filter: ['==', ['get', 'k'], 'take'], layout: line, paint: { 'line-color': C.track, 'line-width': 10 } },
      { id: 'forks', type: 'symbol', source: SRC.forks, layout: { 'icon-image': 'fork', 'icon-allow-overlap': true, 'icon-ignore-placement': true } },
      dot('wpts', SRC.marks, 11, C.wpt, ['==', ['get', 'kind'], 'wpt']),
      dot('ends', SRC.marks, 15, ['match', ['get', 'kind'], 'start', C.start, C.track], ['!=', ['get', 'kind'], 'wpt']),
      // off the route: a dashed coral line from the dot to the route's nearest point
      { id: 'off', type: 'line', source: SRC.off, layout: line, paint: { 'line-color': C.track, 'line-width': 3, 'line-dasharray': [1, 1.6] } },
      // (a stale fix, from before the screen locked: grey, the dot hollow, no cone)
      { id: 'acc', type: 'fill', source: SRC.acc, paint: { 'fill-color': stale(C.grey, C.gps), 'fill-opacity': 0.16, 'fill-outline-color': stale(C.grey, C.gps) } },
      { id: 'cone', type: 'symbol', source: SRC.loc, filter: ['has', 'heading'], layout: { 'icon-image': ['get', 'cone'], 'icon-rotate': ['get', 'heading'], 'icon-rotation-alignment': 'map', 'icon-allow-overlap': true, 'icon-ignore-placement': true } },
      { id: 'loc', type: 'circle', source: SRC.loc, paint: { 'circle-radius': 18 / 2 - 3, 'circle-color': stale(C.rim, C.gps), 'circle-stroke-color': stale(C.grey, C.rim), 'circle-stroke-width': 3 } },
      dot('scrub', SRC.scrub, 16, C.scrub)
    ]
  } as StyleSpecification;
}
