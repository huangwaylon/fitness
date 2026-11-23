// The maps' shared style parts (docs/design.md "Maps"), pure: OpenFreeMap's basemap source (the trip and places maps:
// basemap.ts's layers on theme.ts's palette), the one zoom range, an empty GeoJSON source, and the one location dot
// (a sky dot with a white rim and a brown edge, its accuracy halo in metres, grey once stale).
import type { ExpressionSpecification, LayerSpecification } from 'maplibre-gl';
import type { Fix } from './types.ts';
import { fc, pt } from './geojson.ts';

/** The tiles' origin: the CSP's connect-src names it (vite.config.ts). The one third party the phones contact: it sees
 *  the phone's IP and which tiles it views, never the trip. Self-hosting later (the same schema) changes this. */
export const TILE_ORIGIN = 'https://tiles.openfreemap.org';
/** OpenFreeMap's public planet (OpenStreetMap data, ODbL): its TileJSON (versioned tile URLs, maxzoom 14,
 *  overzoomed past it), with the attribution the licences ask for (OpenFreeMap's terms, OpenMapTiles' CC-BY,
 *  OpenStreetMap's ODbL). */
export const BASEMAP = {
  type: 'vector',
  url: `${TILE_ORIGIN}/planet`,
  attribution: [
    '<a href="https://openfreemap.org" target="_blank" rel="noopener">OpenFreeMap</a>',
    '<a href="https://www.openmaptiles.org/" target="_blank" rel="noopener">© OpenMapTiles</a>',
    'Data from <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">© OpenStreetMap</a>'
  ].join(' ')
} as const;

/** The basemap maps' zoom range (the trail's raster topo has its own: 9 to its source's ceiling). */
export const ZOOM = { min: 4, max: 18 } as const;

/** An empty GeoJSON source (spread it: `{ ...EMPTY, promoteId: 'id' }`). */
export const EMPTY = { type: 'geojson', data: { type: 'FeatureCollection', features: [] } } as const;

/** Metres a pixel at zoom 0 on the equator (512 px tiles). */
const M_PER_PX_Z0 = 40_075_016.686 / 512;

/** The accuracy halo's radius (px) for a feature's `acc` metres at `lat`: a zoom interpolation (exponential, base 2). */
export function haloRadius(lat: number): ExpressionSpecification {
  const z0: ExpressionSpecification = ['/', ['get', 'acc'], M_PER_PX_Z0 * Math.cos((lat * Math.PI) / 180)];
  return ['interpolate', ['exponential', 2], ['zoom'], 0, z0, 22, ['*', z0, 2 ** 22]];
}

/** The location dot's colours: --c-sky, a white rim, the NH marker's brown edge, grey once stale. */
const LOC = { dot: '#4F9BE0', rim: '#FFFFFF', edge: '#937047', halo: '#4F9BE0', stale: '#8E8A80' } as const;
/** The dot's layer ids (the halo's radius re-set per fix: `map.setPaintProperty(LOC_LAYERS.halo, 'circle-radius', haloRadius(fix.lat))`). */
export const LOC_LAYERS = { halo: 'loc-halo', edge: 'loc-edge', dot: 'loc-dot' } as const;

/** `then` for a stale fix's feature, else `other`. */
const ifStale = (then: string, other: string): ExpressionSpecification => ['case', ['to-boolean', ['get', 'stale']], then, other];

/** The one location dot on `source` (locData's features): the halo (the fix's accuracy, true to scale), the edge, the
 *  dot; a stale fix (from before the page last hid) grey and hollow. */
export function locLayers(source: string, lat = 0): LayerSpecification[] {
  return [
    {
      id: LOC_LAYERS.halo, type: 'circle', source,
      paint: { 'circle-radius': haloRadius(lat), 'circle-color': ifStale(LOC.stale, LOC.halo), 'circle-opacity': 0.16, 'circle-stroke-color': ifStale(LOC.stale, LOC.halo), 'circle-stroke-width': 1, 'circle-stroke-opacity': 0.5, 'circle-pitch-alignment': 'map' }
    },
    { id: LOC_LAYERS.edge, type: 'circle', source, paint: { 'circle-radius': 10, 'circle-color': ifStale(LOC.stale, LOC.edge) } },
    { id: LOC_LAYERS.dot, type: 'circle', source, paint: { 'circle-radius': 7, 'circle-color': ifStale(LOC.rim, LOC.dot), 'circle-stroke-color': ifStale(LOC.stale, LOC.rim), 'circle-stroke-width': 2.5 } }
  ];
}

/** locLayers' data: the fix (null: none), its accuracy, stale or not. */
export const locData = (fix: Fix | null, stale = false) => fc(fix ? [pt(fix.lon, fix.lat, { acc: fix.acc, ...(stale ? { stale: true } : {}) })] : []);
