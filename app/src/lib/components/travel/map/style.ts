// The trip map's style (docs/travel.md "Maps"): the basemap (BASEMAP: OpenFreeMap's tiles; basemap.ts: their
// OpenMapTiles layers on our NookPhone palette, theme.ts) under the trip's overlays (overlay.ts: the legs in the day
// colours, the candidate dots, the location dot). The stops are HTML pins over it (engine.ts). Pure: the tests build it
// without a map.
import type { ExpressionSpecification, FontFacesSpecification, LayerSpecification, StyleSpecification } from 'maplibre-gl';
import type { Locale } from '#lib/i18n/index.ts';
import { basemapLayers } from './basemap.ts';
import { FONT } from './fonts.ts';
import { NOOK } from './theme.ts';
import { KIND_COLOR } from './types.ts';

/** The tiles' origin: the CSP's connect-src names it (vite.config.ts). The one third party the phones contact: it sees
 *  the phone's IP and which tiles it views, never the trip. Self-hosting later (the same schema) changes this. */
const TILE_ORIGIN = 'https://tiles.openfreemap.org';
/** OpenFreeMap's public planet (OpenStreetMap data, ODbL), online only: its TileJSON (versioned tile URLs, maxzoom 14,
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

export const SRC = { base: 'basemap', legs: 'legs', cands: 'cands', loc: 'loc', keep: 'keep' } as const;

/** The keepout's blank images (engine.ts adds them): a stop pin's size (its anchor at the tip), a candidate's circle. */
export const KEEP_IMAGES = { 'keep-pin': [34, 46], 'keep-dot': [20, 20] } as const;

/** The location dot: --c-yuzu with a white rim and a brown edge (an NH marker), its accuracy halo --c-mint. */
const LOC = { dot: '#FFD84D', rim: '#FFFFFF', edge: '#937047', halo: '#7BD7C1' } as const;

/** Metres a pixel at zoom 0 on the equator (512 px tiles). */
const M_PER_PX_Z0 = 40_075_016.686 / 512;

/** The accuracy halo's radius (px) for `acc` metres at `lat`: a zoom interpolation (exponential, base 2). */
export function haloRadius(lat: number): ExpressionSpecification {
  const z0: ExpressionSpecification = ['/', ['get', 'acc'], M_PER_PX_Z0 * Math.cos((lat * Math.PI) / 180)];
  return ['interpolate', ['exponential', 2], ['zoom'], 0, z0, 22, ['*', z0, 2 ** 22]];
}

export function overlayLayers(): LayerSpecification[] {
  const legLine = { 'line-join': 'round', 'line-cap': 'round' } as const;
  const w = (add: number): ExpressionSpecification => ['interpolate', ['linear'], ['zoom'], 8, 2.5 + add, 13, 4.5 + add, 17, 7 + add];
  const width = w(0);
  return [
    { id: 'legs-casing', type: 'line', source: SRC.legs, layout: legLine, paint: { 'line-color': '#FFFFFF', 'line-width': w(3.5), 'line-opacity': 0.9 } },
    { id: 'legs-road', type: 'line', source: SRC.legs, filter: ['in', ['get', 'mode'], ['literal', ['drive', 'bus']]], layout: legLine, paint: { 'line-color': ['get', 'color'], 'line-width': width } },
    { id: 'legs-walk', type: 'line', source: SRC.legs, filter: ['==', ['get', 'mode'], 'walk'], layout: { 'line-join': 'round', 'line-cap': 'butt' }, paint: { 'line-color': ['get', 'color'], 'line-width': width, 'line-dasharray': [1.4, 1.1] } },
    { id: 'legs-boat', type: 'line', source: SRC.legs, filter: ['==', ['get', 'mode'], 'boat'], layout: legLine, paint: { 'line-color': ['get', 'color'], 'line-width': width, 'line-dasharray': [0, 1.8] } },
    { id: 'cands-sel', type: 'circle', source: SRC.cands, filter: ['get', 'sel'], paint: { 'circle-radius': 13, 'circle-color': '#FFD84D', 'circle-stroke-color': '#937047', 'circle-stroke-width': 2 } },
    {
      id: 'cands', type: 'circle', source: SRC.cands,
      paint: {
        'circle-radius': ['interpolate', ['linear'], ['zoom'], 8, 4.5, 13, 7, 16, 8.5],
        'circle-color': ['match', ['get', 'kind'], 'camp', KIND_COLOR.camp, 'nature', KIND_COLOR.nature, KIND_COLOR.food],
        'circle-stroke-color': '#FFFFFF', 'circle-stroke-width': 2.5
      }
    },
    // nothing drawn: each pin's room, so the basemap's labels (placed after the layers over them) keep clear of the
    // HTML pins instead of hiding under them
    {
      id: 'keepout', type: 'symbol', source: SRC.keep,
      layout: { 'icon-image': ['match', ['get', 'pin'], 'stop', 'keep-pin', 'keep-dot'], 'icon-anchor': ['match', ['get', 'pin'], 'stop', 'bottom', 'center'], 'icon-allow-overlap': true, 'icon-ignore-placement': false },
      paint: { 'icon-opacity': 0 }
    },
    // (the halo's metres at the fix's latitude: engine.ts re-sets it with each fix)
    { id: 'loc-halo', type: 'circle', source: SRC.loc, paint: { 'circle-radius': haloRadius(0), 'circle-color': LOC.halo, 'circle-opacity': 0.22, 'circle-stroke-color': LOC.halo, 'circle-stroke-width': 1.5, 'circle-stroke-opacity': 0.7, 'circle-pitch-alignment': 'map' } },
    { id: 'loc-edge', type: 'circle', source: SRC.loc, paint: { 'circle-radius': 11, 'circle-color': LOC.edge } },
    { id: 'loc-dot', type: 'circle', source: SRC.loc, paint: { 'circle-radius': 7.5, 'circle-color': LOC.dot, 'circle-stroke-color': LOC.rim, 'circle-stroke-width': 2.5 } }
  ];
}

/** The draw order: the basemap's ground and roads, the trip's legs, the basemap's labels (their halos over the legs,
 *  never struck through), then the candidates, the pins' keepout and the location dot. */
function stack(base: LayerSpecification[], over: LayerSpecification[]): LayerSpecification[] {
  const isLeg = (l: LayerSpecification) => l.id.startsWith('legs-');
  return [...base.filter((l) => l.type !== 'symbol'), ...over.filter(isLeg), ...base.filter((l) => l.type === 'symbol'), ...over.filter((l) => !isLeg(l))];
}

const empty = { type: 'geojson', data: { type: 'FeatureCollection', features: [] } } as const;

/** No glyphs URL: every label is drawn on the phone from the font faces (fonts.ts), a character no slice covers in a
 *  local font. */
export function buildStyle(locale: Locale, fontFaces: FontFacesSpecification): StyleSpecification {
  return {
    version: 8,
    name: 'nookphone',
    'font-faces': fontFaces,
    sources: { [SRC.base]: { ...BASEMAP }, [SRC.legs]: { ...empty }, [SRC.cands]: { ...empty, promoteId: 'id' }, [SRC.loc]: { ...empty }, [SRC.keep]: { ...empty } },
    layers: stack(basemapLayers(SRC.base, NOOK, locale, [FONT]), overlayLayers())
  };
}

/** The symbol layers whose text follows the locale (setLocale re-points them). */
export const labelLayers = (style: StyleSpecification): string[] => style.layers.filter((l) => l.type === 'symbol' && l.source === SRC.base).map((l) => l.id);
