// The basemap's layers on the OpenMapTiles schema (docs/travel.md "Maps"): our own NookPhone style (theme.ts), no
// sprite (no icons: shields, POI icons, one-way arrows left out), flat (no 3D buildings, no hillshade), labels in the
// reader's locale in the app's font. Everything that knows the schema's layer and field names is here (the source is
// style.ts's BASEMAP): another schema is another module with the same exports. OpenFreeMap's `liberty` style was the
// reference for the filters only.
import type { ExpressionSpecification, FilterSpecification, LayerSpecification } from 'maplibre-gl';
import type { Theme } from './theme.ts';
import type { Locale } from '#lib/i18n/index.ts';

/** A label in the reader's locale: its own name, then (English) the Latin transliteration, then the local name. */
export function labelField(locale: Locale): ExpressionSpecification {
  return locale === 'en' ? ['coalesce', ['get', 'name:en'], ['get', 'name:latin'], ['get', 'name']] : ['coalesce', ['get', 'name:ja'], ['get', 'name']];
}

/** The labels' locale-dependent layout (engine.ts re-sets it when the locale changes): the field, and the width a line
 *  wraps at (ems): Japanese breaks between any two kana, so 12 keeps a name like エメラルドビーチ whole; Latin
 *  breaks only at spaces, ~2 letters an em. */
export const labelLayout = (locale: Locale) => ({ 'text-field': labelField(locale), 'text-max-width': locale === 'ja' ? 12 : 9 });

type Stops = [zoom: number, px: number][];
const interp = (stops: Stops, base = 1.4): ExpressionSpecification => ['interpolate', ['exponential', base], ['zoom'], ...stops.flat()];
/** A road's soft edge: thin far out, 1.6 px a side close in. */
const edge = (z: number) => Math.min(1.6, Math.max(0.5, (z - 9) * 0.25));
const casing = (stops: Stops): ExpressionSpecification => interp(stops.map(([z, w]) => [z, w + 2 * edge(z)]));
/** One zoom curve whose value at each stop is a `match` on the class (a zoom curve can't sit inside a match). */
const byClass = (zooms: number[], classes: string[], a: (z: number) => number, b: (z: number) => number, base = 1.4): ExpressionSpecification =>
  ['interpolate', ['exponential', base], ['zoom'], ...zooms.flatMap((z) => [z, ['match', ['get', 'class'], classes, a(z), b(z)]])] as ExpressionSpecification;
/** [zoom, value] stops read at any zoom (linear between them, held past the ends). */
const at = (stops: Stops) => (z: number): number => {
  if (z <= stops[0][0]) return stops[0][1];
  for (let k = 1; k < stops.length; k++) {
    const [z1, v1] = stops[k], [z0, v0] = stops[k - 1];
    if (z <= z1) return v0 + ((v1 - v0) * (z - z0)) / (z1 - z0);
  }
  return stops.at(-1)![1];
};
const isClass = (...c: string[]): ExpressionSpecification => ['match', ['get', 'class'], c, true, false];
const lines: ExpressionSpecification = ['match', ['geometry-type'], ['LineString', 'MultiLineString'], true, false];
const polys: ExpressionSpecification = ['match', ['geometry-type'], ['Polygon', 'MultiPolygon'], true, false];

/** The roads, least to most: each class's fill and its casing (casings all under all fills, so crossings merge). */
const ROADS: { id: string; filter: ExpressionSpecification; min: number; w: Stops; color: keyof Theme; edge: keyof Theme }[] = [
  { id: 'service', filter: isClass('service', 'track'), min: 13, w: [[13, 0.5], [15, 1.6], [18, 6]], color: 'road', edge: 'roadCasing' },
  { id: 'minor', filter: isClass('minor'), min: 12, w: [[12, 0.5], [14, 2.4], [16, 5], [18, 10]], color: 'road', edge: 'roadCasing' },
  { id: 'secondary', filter: isClass('secondary', 'tertiary'), min: 9, w: [[9, 0.5], [12, 1.4], [14, 3.6], [18, 12]], color: 'road', edge: 'roadCasing' },
  { id: 'primary', filter: isClass('primary', 'trunk'), min: 7, w: [[7, 0.5], [10, 1.4], [14, 5], [18, 15]], color: 'major', edge: 'majorCasing' },
  { id: 'motorway', filter: isClass('motorway'), min: 5, w: [[5, 0.5], [10, 1.8], [14, 6], [18, 17]], color: 'highway', edge: 'highwayCasing' }
];

export function basemapLayers(source: string, t: Theme, locale: Locale, font: string[]): LayerSpecification[] {
  const s = { source } as const;
  const fill = (id: string, layer: string, filter: FilterSpecification | undefined, color: string, extra: Record<string, unknown> = {}, minzoom?: number): LayerSpecification =>
    ({ id, type: 'fill', ...s, 'source-layer': layer, ...(filter ? { filter } : {}), ...(minzoom ? { minzoom } : {}), paint: { 'fill-color': color, 'fill-antialias': true, ...extra } }) as LayerSpecification;
  const halo = { 'text-halo-color': t.halo, 'text-halo-width': 1.6, 'text-halo-blur': 0.4 };
  const text = (size: ExpressionSpecification | number, more: Record<string, unknown> = {}) =>
    ({ ...labelLayout(locale), 'text-font': font, 'text-size': size, 'text-letter-spacing': 0.02, ...more });

  return [
    // the land is the background; the sea is the water layer's
    { id: 'land', type: 'background', paint: { 'background-color': t.land } },
    fill('landuse-urban', 'landuse', isClass('residential', 'suburb', 'neighbourhood', 'commercial', 'retail', 'industrial', 'railway'), t.urban, { 'fill-opacity': interp([[9, 0.4], [13, 1]], 1) }),
    fill('landcover-farm', 'landcover', isClass('farmland'), t.farm),
    fill('landcover-grass', 'landcover', isClass('grass'), t.scrub),
    fill('landcover-wetland', 'landcover', isClass('wetland'), t.scrub),
    fill('landcover-wood', 'landcover', isClass('wood'), t.wood, { 'fill-opacity': interp([[6, 0.6], [11, 1]], 1) }),
    fill('park', 'park', polys, t.park, { 'fill-opacity': interp([[6, 0.5], [11, 1]], 1) }),
    fill('landuse-grounds', 'landuse', isClass('pitch', 'playground', 'cemetery', 'school', 'hospital', 'university', 'college', 'stadium'), t.park, { 'fill-opacity': 0.6 }, 12),
    fill('landcover-sand', 'landcover', isClass('sand'), t.sand),
    fill('aeroway', 'aeroway', polys, t.urban, {}, 11),
    { id: 'waterway', type: 'line', ...s, 'source-layer': 'waterway', filter: ['!=', ['get', 'brunnel'], 'tunnel'], minzoom: 9, layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': t.sea, 'line-width': byClass([9, 12, 14, 18], ['river'], at([[9, 0.8], [14, 3], [18, 10]]), at([[9, 0], [12, 0.4], [14, 1.2], [18, 4]])) } },
    fill('water', 'water', ['!=', ['get', 'brunnel'], 'tunnel'], t.sea),
    { id: 'runway', type: 'line', ...s, 'source-layer': 'aeroway', minzoom: 11, filter: ['all', lines, isClass('runway', 'taxiway')], paint: { 'line-color': t.road, 'line-width': byClass([11, 12, 14, 17], ['runway'], at([[11, 2], [14, 12], [17, 40]]), at([[11, 0.3], [12, 0.5], [17, 8]])) } },
    {
      id: 'building', type: 'fill', ...s, 'source-layer': 'building', minzoom: 14,
      paint: { 'fill-color': t.buildings, 'fill-outline-color': t.roadCasing, 'fill-opacity': interp([[14, 0], [15, 1]], 1) }
    },
    { id: 'ferry', type: 'line', ...s, 'source-layer': 'transportation', minzoom: 10, filter: isClass('ferry'), paint: { 'line-color': t.waterLabel, 'line-opacity': 0.25, 'line-width': 1, 'line-dasharray': [3, 3] } },
    { id: 'path', type: 'line', ...s, 'source-layer': 'transportation', minzoom: 14, filter: ['all', lines, isClass('path', 'pedestrian')], layout: { 'line-cap': 'round' }, paint: { 'line-color': t.roadCasing, 'line-width': interp([[14, 1], [18, 3]]), 'line-dasharray': [0.1, 2] } },
    { id: 'rail', type: 'line', ...s, 'source-layer': 'transportation', minzoom: 10, filter: isClass('rail', 'transit'), paint: { 'line-color': t.rail, 'line-width': interp([[10, 0.6], [16, 2]]), 'line-dasharray': [4, 2] } },
    ...ROADS.map((r): LayerSpecification => ({
      id: `road-${r.id}-casing`, type: 'line', ...s, 'source-layer': 'transportation', minzoom: r.min, filter: ['all', lines, r.filter],
      layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': t[r.edge], 'line-width': casing(r.w) }
    })),
    ...ROADS.map((r): LayerSpecification => ({
      id: `road-${r.id}`, type: 'line', ...s, 'source-layer': 'transportation', minzoom: r.min, filter: ['all', lines, r.filter],
      layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': t[r.color], 'line-width': interp(r.w) }
    })),
    { id: 'boundary', type: 'line', ...s, 'source-layer': 'boundary', filter: ['all', ['<=', ['get', 'admin_level'], 4], ['!=', ['get', 'maritime'], 1]], paint: { 'line-color': t.boundary, 'line-width': interp([[4, 0.6], [12, 1.4]]), 'line-dasharray': [3, 2], 'line-opacity': 0.6 } },

    // labels (all in the app's font, none in italics or capitals)
    { id: 'label-waterway', type: 'symbol', ...s, 'source-layer': 'waterway', minzoom: 13, filter: lines, layout: text(11, { 'symbol-placement': 'line' }), paint: { 'text-color': t.waterLabel, ...halo, 'text-halo-color': t.waterHalo } },
    ...(['point', 'line'] as const).map((placement): LayerSpecification => ({
      id: `label-water-${placement}`, type: 'symbol', ...s, 'source-layer': 'water_name', filter: placement === 'line' ? lines : ['!', lines],
      layout: text(byClass([4, 8, 10, 14], ['ocean', 'sea'], at([[4, 12], [10, 16]]), at([[8, 11], [14, 14]]), 1), { 'text-letter-spacing': 0.12, 'symbol-placement': placement }),
      paint: { 'text-color': t.waterLabel, ...halo, 'text-halo-color': t.waterHalo }
    })),
    { id: 'label-road', type: 'symbol', ...s, 'source-layer': 'transportation_name', minzoom: 13, filter: ['any', isClass('motorway', 'trunk', 'primary', 'secondary', 'tertiary'), ['all', ['>=', ['zoom'], 15], isClass('minor', 'service')]], layout: text(interp([[13, 10.5], [17, 13]], 1), { 'symbol-placement': 'line', 'text-padding': 8 }), paint: { 'text-color': t.roadLabel, ...halo } },
    {
      id: 'label-poi', type: 'symbol', ...s, 'source-layer': 'poi', minzoom: 14,
      filter: ['all', ['match', ['geometry-type'], ['Point', 'MultiPoint'], true, false], isClass('park', 'beach', 'attraction', 'museum', 'zoo', 'aquarium', 'castle', 'campsite', 'viewpoint', 'monument', 'ferry_terminal')],
      layout: text(interp([[14, 10.5], [17, 12.5]], 1), { 'symbol-sort-key': ['get', 'rank'], 'text-padding': 6 }),
      paint: { 'text-color': ['match', ['get', 'class'], ['park', 'beach', 'campsite', 'viewpoint'], t.parkLabel, t.labelSoft], ...halo }
    },
    { id: 'label-peak', type: 'symbol', ...s, 'source-layer': 'mountain_peak', minzoom: 12, layout: text(11, { 'symbol-sort-key': ['get', 'rank'] }), paint: { 'text-color': t.parkLabel, ...halo } },
    { id: 'label-hood', type: 'symbol', ...s, 'source-layer': 'place', minzoom: 13, filter: isClass('suburb', 'quarter', 'neighbourhood', 'hamlet', 'isolated_dwelling'), layout: text(interp([[13, 10.5], [16, 13]], 1), { 'symbol-sort-key': ['get', 'rank'], 'text-padding': 4 }), paint: { 'text-color': t.labelSoft, ...halo } },
    { id: 'label-island', type: 'symbol', ...s, 'source-layer': 'place', minzoom: 8, filter: isClass('island', 'islet'), layout: text(interp([[8, 11], [14, 15]], 1), { 'symbol-sort-key': ['get', 'rank'] }), paint: { 'text-color': t.labelSoft, ...halo } },
    { id: 'label-village', type: 'symbol', ...s, 'source-layer': 'place', minzoom: 10, filter: isClass('village'), layout: text(interp([[10, 11], [15, 15]], 1), { 'symbol-sort-key': ['get', 'rank'], 'text-padding': 4 }), paint: { 'text-color': t.label, ...halo } },
    { id: 'label-town', type: 'symbol', ...s, 'source-layer': 'place', minzoom: 7, filter: isClass('town'), layout: text(interp([[7, 11], [14, 17]], 1), { 'symbol-sort-key': ['get', 'rank'], 'text-padding': 4 }), paint: { 'text-color': t.label, ...halo } },
    { id: 'label-city', type: 'symbol', ...s, 'source-layer': 'place', minzoom: 4, filter: isClass('city'), layout: text(interp([[4, 12], [12, 20]], 1), { 'symbol-sort-key': ['get', 'rank'] }), paint: { 'text-color': t.label, ...halo } },
    { id: 'label-state', type: 'symbol', ...s, 'source-layer': 'place', minzoom: 4, maxzoom: 8, filter: isClass('state', 'province'), layout: text(13, { 'text-letter-spacing': 0.1 }), paint: { 'text-color': t.labelSoft, ...halo } },
    { id: 'label-country', type: 'symbol', ...s, 'source-layer': 'place', maxzoom: 7, filter: isClass('country'), layout: text(interp([[2, 12], [6, 16]], 1)), paint: { 'text-color': t.label, ...halo } }
  ];
}
