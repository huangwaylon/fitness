// トレイル's map style (docs/hiking.md "Map"), pure: the hiking app's own basemaps, raster topo for the trail's region
// (USGS Topo in the US, GSI 地理院タイル std in Japan: keyless, contours and hillshade baked in; the tiles a map drew
// kept by the service worker: their hosts are in the CSP's connect-src, vite.config.ts), under the trail's overlays in the app's colours
// (the track coral on a cream halo, the trailhead leaf, the end coral, the waypoints yuzu, the scrub's dot violet, the
// location dot sky).
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
 *  --c-paper (under the tiles). */
export const C = { track: '#AD3F2B', start: '#2F8A3F', gps: '#4F9BE0', wpt: '#E6B22E', scrub: '#8A6FD6', rim: '#FFFCF2', paper: '#F5E4BC' } as const;

export const SRC = { base: 'topo', track: 'track', marks: 'marks', scrub: 'scrub', loc: 'loc' } as const;

/** A dot `size` px across in all (a 2.5 px cream rim inside it). */
const dot = (id: string, source: string, size: number, color: unknown, filter?: unknown): LayerSpecification =>
  ({ id, type: 'circle', source, ...(filter ? { filter } : {}), paint: { 'circle-radius': size / 2 - 2.5, 'circle-color': color, 'circle-stroke-color': C.rim, 'circle-stroke-width': 2.5 } }) as LayerSpecification;

const empty = { type: 'geojson', data: { type: 'FeatureCollection', features: [] } } as const;

/** `maxzoom`: the topo's own unless capped (a saved area offline: engine.ts). */
export function buildStyle(region: Region, maxzoom = TOPO[region].maxzoom): StyleSpecification {
  const line = { 'line-join': 'round', 'line-cap': 'round' } as const;
  return {
    version: 8,
    name: 'trails',
    sources: { [SRC.base]: { type: 'raster', tileSize: 256, ...TOPO[region], maxzoom }, [SRC.track]: { ...empty }, [SRC.marks]: { ...empty }, [SRC.scrub]: { ...empty }, [SRC.loc]: { ...empty } },
    layers: [
      { id: 'paper', type: 'background', paint: { 'background-color': C.paper } },
      { id: 'topo', type: 'raster', source: SRC.base },
      { id: 'track-halo', type: 'line', source: SRC.track, layout: line, paint: { 'line-color': C.rim, 'line-width': 7.5, 'line-opacity': 0.85 } },
      { id: 'track', type: 'line', source: SRC.track, layout: line, paint: { 'line-color': C.track, 'line-width': 4, 'line-opacity': 0.98 } },
      dot('wpts', SRC.marks, 11, C.wpt, ['==', ['get', 'kind'], 'wpt']),
      dot('ends', SRC.marks, 15, ['match', ['get', 'kind'], 'start', C.start, C.track], ['!=', ['get', 'kind'], 'wpt']),
      { id: 'loc-halo', type: 'circle', source: SRC.loc, paint: { 'circle-radius': 16, 'circle-color': C.gps, 'circle-opacity': 0.16 } },
      dot('loc', SRC.loc, 16, C.gps),
      dot('scrub', SRC.scrub, 16, C.scrub)
    ]
  };
}
