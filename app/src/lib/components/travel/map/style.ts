// The trip map's style (docs/travel.md "Maps"): the basemap (source.ts: OpenFreeMap's tiles; basemap.ts: their
// OpenMapTiles layers on our NookPhone palette, theme.ts) under the trip's overlays (overlay.ts: the legs in the day colours, the candidate pins, the
// location dot). The stops are HTML pins over it (engine.ts). Pure: the tests build it without a map.
import type { ExpressionSpecification, LayerSpecification, StyleSpecification } from 'maplibre-gl';
import { basemapLayers, labelField } from './basemap.ts';
import { basemapSource } from './source.ts';
import { FONT } from './fonts.ts';
import { NOOK, type Theme } from './theme.ts';
import type { Locale } from './types.ts';

/** The self-hosted glyph PBFs (static/travel/glyphs/: Noto Sans Medium's Latin ranges, under our font's name): the
 *  fallback for a character no font-faces slice covers. */
const GLYPHS = 'travel/glyphs/{fontstack}/{range}.pbf';

export const SRC = { base: 'basemap', legs: 'legs', cands: 'cands', loc: 'loc' } as const;

/** The candidate kinds' colours (pins and chips): the tent orange, the leaf, a soft coral-pink. */
const KIND_COLOR = { camp: '#F29A4A', nature: '#4FB35C', food: '#E8708E' } as const;

/** The location dot: --c-yuzu with a white rim and a brown edge (an NH marker), its accuracy halo --c-mint. */
const LOC = { dot: '#FFD84D', rim: '#FFFFFF', edge: '#937047', halo: '#7BD7C1' } as const;

/** Metres a pixel at zoom 0 on the equator (512 px tiles). */
const M_PER_PX_Z0 = 40_075_016.686 / 512;

/** The accuracy halo's radius (px) for `acc` metres at `lat`: a zoom interpolation (exponential, base 2). */
export function haloRadius(lat: number): ExpressionSpecification {
  const z0: ExpressionSpecification = ['/', ['get', 'acc'], M_PER_PX_Z0 * Math.cos((lat * Math.PI) / 180)];
  return ['interpolate', ['exponential', 2], ['zoom'], 0, z0, 22, ['*', z0, 2 ** 22]];
}

export function overlayLayers(lat = 26): LayerSpecification[] {
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
    { id: 'loc-halo', type: 'circle', source: SRC.loc, paint: { 'circle-radius': haloRadius(lat), 'circle-color': LOC.halo, 'circle-opacity': 0.22, 'circle-stroke-color': LOC.halo, 'circle-stroke-width': 1.5, 'circle-stroke-opacity': 0.7, 'circle-pitch-alignment': 'map' } },
    { id: 'loc-edge', type: 'circle', source: SRC.loc, paint: { 'circle-radius': 11, 'circle-color': LOC.edge } },
    { id: 'loc-dot', type: 'circle', source: SRC.loc, paint: { 'circle-radius': 7.5, 'circle-color': LOC.dot, 'circle-stroke-color': LOC.rim, 'circle-stroke-width': 2.5 } }
  ];
}

export interface StyleOpts {
  /** The basemap's TileJSON (default: OpenFreeMap's planet). */
  tiles?: string;
  locale: Locale;
  /** The site's base URL (location.href in the app): the glyphs and tiles resolve against it. */
  base?: string;
  fontFaces?: StyleSpecification['font-faces'];
  theme?: Theme;
}

const empty = { type: 'geojson', data: { type: 'FeatureCollection', features: [] } } as const;

export function buildStyle(o: StyleOpts): StyleSpecification {
  const base = o.base ?? (typeof location === 'undefined' ? 'http://localhost/' : location.href);
  const t = o.theme ?? NOOK;
  return {
    version: 8,
    name: 'nookphone',
    glyphs: decodeURI(new URL(GLYPHS, base).href),
    ...(o.fontFaces ? { 'font-faces': o.fontFaces } : {}),
    sources: { [SRC.base]: basemapSource(o.tiles), [SRC.legs]: { ...empty }, [SRC.cands]: { ...empty, promoteId: 'id' }, [SRC.loc]: { ...empty } },
    layers: [...basemapLayers(SRC.base, t, { field: labelField(o.locale), font: [FONT] }), ...overlayLayers()]
  };
}

/** The symbol layers whose text follows the locale (setLocale re-points them). */
export const labelLayers = (style: StyleSpecification): string[] => style.layers.filter((l) => l.type === 'symbol' && l.source === SRC.base).map((l) => l.id);
