// The whole-trip map's style (地図 tab): the shared basemap (map/style.ts BASEMAP on map/basemap.ts's NookPhone
// layers) with the trip over it: every day's legs in its colour under the basemap's labels; over them the candidate
// dots (Okinawa's layers), the stops as small dots in the day colour (a circle layer, not pins: a whole trip's ~100
// stops), the selected one ringed, and the location dot (map/style.ts locLayers). The saved places' squares
// (map/places/layer.ts) go in under the candidates (OVER_LABELS). Pure: the tests build it without a map.
import type { ExpressionSpecification, FontFacesSpecification, LayerSpecification, StyleSpecification } from 'maplibre-gl';
import type { Locale } from '#lib/i18n/index.ts';
import { basemapLayers } from '../../map/basemap.ts';
import { FONT } from '../../map/fonts.ts';
import { BASEMAP, EMPTY, locLayers } from '../../map/style.ts';
import { NOOK } from '../../map/theme.ts';
import { KIND_COLOR } from './types.ts';

export const WSRC = { base: 'basemap', legs: 'w-legs', stops: 'w-stops', cands: 'w-cands', loc: 'loc' } as const;
/** The stop dots' layer and the candidates' (the taps' router). */
export const STOP_LAYER = 'w-stops';
export const CAND_LAYER = 'w-cands';
/** The first layer over the basemap's labels: the saved places' squares go in under it. */
export const OVER_LABELS = 'w-cands-sel';

const CREAM = '#FFFCF2';

function overlay(): LayerSpecification[] {
  const join = { 'line-join': 'round', 'line-cap': 'round' } as const;
  const o: ExpressionSpecification = ['get', 'o'];
  return [
    { id: 'w-legs-casing', type: 'line', source: WSRC.legs, layout: join, paint: { 'line-color': CREAM, 'line-width': 7, 'line-opacity': ['*', 0.9, o] } },
    { id: 'w-legs', type: 'line', source: WSRC.legs, filter: ['!', ['get', 'dash']], layout: join, paint: { 'line-color': ['get', 'c'], 'line-width': 4, 'line-opacity': o } },
    { id: 'w-legs-dash', type: 'line', source: WSRC.legs, filter: ['get', 'dash'], layout: { 'line-join': 'round', 'line-cap': 'butt' }, paint: { 'line-color': ['get', 'c'], 'line-width': 4, 'line-opacity': o, 'line-dasharray': [1.2, 1.2] } },
    { id: OVER_LABELS, type: 'circle', source: WSRC.cands, filter: ['get', 'sel'], paint: { 'circle-radius': 13, 'circle-color': '#FFD84D', 'circle-stroke-color': '#937047', 'circle-stroke-width': 2 } },
    {
      id: CAND_LAYER, type: 'circle', source: WSRC.cands,
      paint: {
        'circle-radius': ['interpolate', ['linear'], ['zoom'], 8, 4.5, 13, 7, 16, 8.5],
        // (hollow rings in the kind's colour: an option, never read as a day's filled stop dot)
        'circle-color': '#FFFFFF',
        'circle-stroke-color': ['match', ['get', 'kind'], 'camp', KIND_COLOR.camp, 'nature', KIND_COLOR.nature, KIND_COLOR.food], 'circle-stroke-width': 3
      }
    },
    // the selected stop's ring: a soft disc of its colour round a bigger dot
    { id: 'w-stops-ring', type: 'circle', source: WSRC.stops, filter: ['get', 'sel'], paint: { 'circle-radius': 17, 'circle-color': ['get', 'c'], 'circle-opacity': 0.28 } },
    {
      id: STOP_LAYER, type: 'circle', source: WSRC.stops,
      paint: {
        'circle-radius': ['case', ['get', 'sel'], 10, 5.5], 'circle-color': ['get', 'c'],
        'circle-stroke-color': CREAM, 'circle-stroke-width': ['case', ['get', 'sel'], 3, 2], 'circle-opacity': o, 'circle-stroke-opacity': o
      }
    },
    ...locLayers(WSRC.loc)
  ];
}

/** The legs between the basemap's ground and its labels; the rest over the labels. No glyphs URL: the labels from
 *  the app's font faces (map/fonts.ts). */
export function wholeStyle(locale: Locale, fontFaces: FontFacesSpecification): StyleSpecification {
  const base = basemapLayers(WSRC.base, NOOK, locale, [FONT]);
  const over = overlay();
  const isLeg = (l: LayerSpecification) => l.id.startsWith('w-legs');
  return {
    version: 8,
    name: 'nookphone-trip',
    'font-faces': fontFaces,
    sources: { [WSRC.base]: { ...BASEMAP }, [WSRC.legs]: { ...EMPTY }, [WSRC.cands]: { ...EMPTY }, [WSRC.stops]: { ...EMPTY }, [WSRC.loc]: { ...EMPTY } },
    layers: [...base.filter((l) => l.type !== 'symbol'), ...over.filter(isLeg), ...base.filter((l) => l.type === 'symbol'), ...over.filter((l) => !isLeg(l))]
  };
}
