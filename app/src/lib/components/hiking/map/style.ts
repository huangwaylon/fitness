// トレイル's map style (docs/hiking.md "Map"), pure: the hiking app's own basemaps, raster topo for the trail's region
// (USGS Topo in the US, GSI 地理院タイル std in Japan: keyless, contours and hillshade baked in; online only, nothing
// saved: their hosts are in the CSP's connect-src, vite.config.ts), under the trail's overlays in the hiking app's
// colours (the track red on a white halo, the trailhead green, the end red, the waypoints amber, the scrub's dot
// violet, the location dot blue).
import type { LayerSpecification, StyleSpecification } from 'maplibre-gl';
import type { Region } from '#lib/hiking/types.ts';

/** The hiking app's TILE_SOURCES: USGS is {z}/{y}/{x}, GSI {z}/{x}/{y}; each to its own native zoom. */
export const TOPO: Record<Region, { tiles: string[]; maxzoom: number; attribution: string }> = {
  us: { tiles: ['https://basemap.nationalmap.gov/arcgis/rest/services/USGSTopo/MapServer/tile/{z}/{y}/{x}'], maxzoom: 16, attribution: '© USGS National Map' },
  jp: { tiles: ['https://cyberjapandata.gsi.go.jp/xyz/std/{z}/{x}/{y}.png'], maxzoom: 18, attribution: '地理院タイル © 国土地理院' }
};

/** The overlays' colours: the hiking app's C{} (app.css's --track, --progress, --gps, --wpt, --scrub). */
export const C = { track: '#D4442E', start: '#1F9D63', gps: '#2F6FE0', wpt: '#D6861C', scrub: '#7B5BFF' } as const;

export const SRC = { base: 'topo', track: 'track', marks: 'marks', scrub: 'scrub', loc: 'loc' } as const;

const dot = (id: string, source: string, r: number, color: unknown, filter?: unknown): LayerSpecification =>
  ({ id, type: 'circle', source, ...(filter ? { filter } : {}), paint: { 'circle-radius': r, 'circle-color': color, 'circle-stroke-color': '#FFFFFF', 'circle-stroke-width': 2.5 } }) as LayerSpecification;

const empty = { type: 'geojson', data: { type: 'FeatureCollection', features: [] } } as const;

export function buildStyle(region: Region): StyleSpecification {
  const line = { 'line-join': 'round', 'line-cap': 'round' } as const;
  return {
    version: 8,
    name: 'trails',
    sources: { [SRC.base]: { type: 'raster', tileSize: 256, ...TOPO[region] }, [SRC.track]: { ...empty }, [SRC.marks]: { ...empty }, [SRC.scrub]: { ...empty }, [SRC.loc]: { ...empty } },
    layers: [
      { id: 'paper', type: 'background', paint: { 'background-color': '#ECEFE8' } },
      { id: 'topo', type: 'raster', source: SRC.base },
      { id: 'track-halo', type: 'line', source: SRC.track, layout: line, paint: { 'line-color': '#FFFFFF', 'line-width': 7.5, 'line-opacity': 0.85 } },
      { id: 'track', type: 'line', source: SRC.track, layout: line, paint: { 'line-color': C.track, 'line-width': 4, 'line-opacity': 0.98 } },
      dot('wpts', SRC.marks, 5.5, C.wpt, ['==', ['get', 'kind'], 'wpt']),
      dot('ends', SRC.marks, 7.5, ['match', ['get', 'kind'], 'start', C.start, C.track], ['!=', ['get', 'kind'], 'wpt']),
      { id: 'loc-halo', type: 'circle', source: SRC.loc, paint: { 'circle-radius': 16, 'circle-color': C.gps, 'circle-opacity': 0.16 } },
      dot('loc', SRC.loc, 8, C.gps),
      dot('scrub', SRC.scrub, 8, C.scrub)
    ]
  };
}
