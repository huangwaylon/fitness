// 保存した場所's map style (docs/places.md "Map"), pure: the trip map's basemap (OpenFreeMap's tiles on our NookPhone
// palette: travel/map/basemap.ts, style.ts BASEMAP) under the places, one clustered GeoJSON source (radius 40, to z14):
// the clusters cream discs with a brown edge and the count in Fredoka (24 / 30 / 36 px at the 10 / 100 steps); a place
// out of a cluster an 8 px dot in its family's colour with a cream rim under z14, a 22 px badge (its family's shape and
// glyph: engine.ts draws them) from z14; the chosen one 28 px with a yuzu ring and its name; the long-pressed point's
// pin; the location dot.
import type { ExpressionSpecification, FontFacesSpecification, LayerSpecification, StyleSpecification } from 'maplibre-gl';
import type { Locale } from '#lib/i18n/index.ts';
import { PLACE_CAT_KEYS } from '#lib/contract/places.ts';
import { CAT_STYLE } from '#lib/places/cats.ts';
import { basemapLayers } from '../../travel/map/basemap.ts';
import { BASEMAP } from '../../travel/map/style.ts';
import { FONT } from '../../travel/map/fonts.ts';
import { NOOK } from '../../travel/map/theme.ts';
import { C } from './colors.ts';

export const SRC = { base: 'basemap', places: 'places', sel: 'sel', pin: 'pin', loc: 'loc' } as const;
const NUM_FONT = 'Fredoka Bold';
/** The badges from this zoom (dots under it); the clusters up to CLUSTER_MAX. */
const BADGE_Z = 14;
const CLUSTER_MAX = 14;
const CLUSTER_R = 40;


/** A top's fill by its `cat` property. */
const fillOf: ExpressionSpecification = ['match', ['get', 'cat'], ...PLACE_CAT_KEYS.flatMap((k) => [k, CAT_STYLE[k].fill]), CAT_STYLE.その他.fill] as unknown as ExpressionSpecification;

function placeLayers(): LayerSpecification[] {
  const clustered: ExpressionSpecification = ['has', 'point_count'];
  return [
    { id: 'clusters', type: 'circle', source: SRC.places, filter: clustered, paint: { 'circle-color': C.cream, 'circle-radius': ['step', ['get', 'point_count'], 12, 10, 15, 100, 18], 'circle-stroke-color': C.edge, 'circle-stroke-width': 2 } },
    {
      id: 'cluster-n', type: 'symbol', source: SRC.places, filter: clustered,
      layout: { 'text-field': ['get', 'point_count_abbreviated'], 'text-font': [NUM_FONT], 'text-size': ['step', ['get', 'point_count'], 12, 10, 13, 100, 14], 'text-allow-overlap': true, 'text-ignore-placement': true },
      paint: { 'text-color': C.ink }
    },
    { id: 'dots', type: 'circle', source: SRC.places, maxzoom: BADGE_Z, filter: ['!', clustered], paint: { 'circle-color': fillOf, 'circle-radius': 2.5, 'circle-stroke-color': C.cream, 'circle-stroke-width': 1.5 } },
    {
      id: 'badges', type: 'symbol', source: SRC.places, minzoom: BADGE_Z, filter: ['!', clustered],
      layout: { 'icon-image': ['concat', 'pl-', ['get', 'cat']], 'icon-allow-overlap': true, 'icon-ignore-placement': true }
    },
    {
      id: 'sel', type: 'symbol', source: SRC.sel,
      layout: {
        'icon-image': ['concat', 'pl-', ['get', 'cat'], '-sel'], 'icon-allow-overlap': true, 'icon-ignore-placement': true,
        'text-field': ['get', 'name'], 'text-font': [FONT], 'text-size': 13, 'text-anchor': 'top', 'text-offset': [0, 1.3], 'text-max-width': 12, 'text-optional': true
      },
      paint: { 'text-color': C.ink, 'text-halo-color': C.cream, 'text-halo-width': 2 }
    },
    { id: 'pin', type: 'symbol', source: SRC.pin, layout: { 'icon-image': 'drop-pin', 'icon-anchor': 'bottom', 'icon-allow-overlap': true, 'icon-ignore-placement': true } },
    { id: 'loc-edge', type: 'circle', source: SRC.loc, paint: { 'circle-radius': 10, 'circle-color': C.edge } },
    { id: 'loc-dot', type: 'circle', source: SRC.loc, paint: { 'circle-radius': 7, 'circle-color': C.sky, 'circle-stroke-color': '#FFFFFF', 'circle-stroke-width': 2.5 } }
  ];
}

const empty = { type: 'geojson', data: { type: 'FeatureCollection', features: [] } } as const;

/** The basemap's ground and roads, its labels, then the places (over the labels: they are what the map is for). */
export function buildStyle(locale: Locale, fonts: FontFacesSpecification, numFont: string): StyleSpecification {
  const base = basemapLayers(SRC.base, NOOK, locale, [FONT]);
  return {
    version: 8,
    name: 'places',
    'font-faces': { ...fonts, [NUM_FONT]: [{ url: numFont, 'unicode-range': ['U+0000-00FF'] }] },
    sources: {
      [SRC.base]: { ...BASEMAP },
      [SRC.places]: { ...empty, cluster: true, clusterRadius: CLUSTER_R, clusterMaxZoom: CLUSTER_MAX },
      [SRC.sel]: { ...empty }, [SRC.pin]: { ...empty }, [SRC.loc]: { ...empty }
    },
    layers: [...base, ...placeLayers()]
  };
}
