// トレイル's map style (docs/hiking.md "Map"), pure: the basemap under the trail's overlays (the track in the hiking
// app's red on a white halo, the trailhead green, the end red, the waypoints amber, the scrub's violet dot, the location
// dot blue). The basemap is a switch (`TOPO`): OpenFreeMap's vector tiles (the trip map's: travel/map/style.ts BASEMAP,
// its OpenMapTiles layers in our Alpine palette, the CSP already allows it) by default; or the hiking app's raster topo
// for the trail's region (USGS Topo in the US, GSI 地理院タイル std in Japan: both keyless, contours and hillshade baked
// in), which needs their hosts in the CSP's connect-src first (vite.config.ts: not added, the user's call pending).
import type { FontFacesSpecification, LayerSpecification, SourceSpecification, StyleSpecification } from 'maplibre-gl';
import type { Locale } from '#lib/i18n/index.ts';
import { basemapLayers } from '../../travel/map/basemap.ts';
import { FONT } from '../../travel/map/fonts.ts';
import { BASEMAP } from '../../travel/map/style.ts';
import type { Theme } from '../../travel/map/theme.ts';
import type { Region } from '#lib/hiking/types.ts';

/** The raster topo basemap (false: OpenFreeMap's vectors). Off until the user says yes and the CSP names the hosts. */
const TOPO = false;

/** Whether this page draws the topo: the switch, or `?topo=1` in dev (where the CSP isn't enforced). */
export const topoOn = (): boolean => TOPO || (import.meta.env.DEV && typeof location !== 'undefined' && new URLSearchParams(location.search).get('topo') === '1');

/** The hiking app's tile sources (its TILE_SOURCES): USGS is {z}/{y}/{x}, GSI {z}/{x}/{y}. */
export const TOPO_SOURCES: Record<Region, { tiles: string[]; maxzoom: number; attribution: string }> = {
  us: { tiles: ['https://basemap.nationalmap.gov/arcgis/rest/services/USGSTopo/MapServer/tile/{z}/{y}/{x}'], maxzoom: 16, attribution: '© USGS National Map' },
  jp: { tiles: ['https://cyberjapandata.gsi.go.jp/xyz/std/{z}/{x}/{y}.png'], maxzoom: 18, attribution: '<a href="https://maps.gsi.go.jp/development/ichiran.html" target="_blank" rel="noopener">地理院タイル</a>' }
};

/** The Alpine Field Guide's map palette: the app's paper-cool neutrals, soft pine woods, a quiet lake blue, white roads,
 *  labels in its spruce ink on a paper halo. Hex only (the GL style can't read CSS custom properties). */
const ALPINE: Theme = {
  sea: '#A8D2E8',
  land: '#EEF1E8',
  park: '#DCE8D0',
  scrub: '#E2EAD6',
  farm: '#E9EDDE',
  wood: '#CFE0C2',
  sand: '#EFEAD9',
  urban: '#E6E9E1',
  buildings: '#DADDD4',
  road: '#FFFFFF',
  roadCasing: '#D3D8CE',
  major: '#FFF9EA',
  majorCasing: '#DCCFAE',
  highway: '#FBEABD',
  highwayCasing: '#D6B97C',
  rail: '#B5BBB0',
  boundary: '#A7AFA2',
  label: '#16231D',
  labelSoft: '#41504A',
  roadLabel: '#515C55',
  parkLabel: '#1F6F5C',
  waterLabel: '#2D6F96',
  halo: '#F3F5F1',
  waterHalo: '#D8EDF7'
};

/** The overlays' colours: the hiking app's C{} palette (app.css's --track, --progress, --gps, --wpt, --scrub). */
export const C = { track: '#D4442E', start: '#1F9D63', gps: '#2F6FE0', wpt: '#D6861C', scrub: '#7B5BFF' } as const;

export const SRC = { base: 'basemap', track: 'track', marks: 'marks', scrub: 'scrub', loc: 'loc' } as const;

function overlays(): LayerSpecification[] {
  const dot = (id: string, source: string, r: number, color: unknown, filter?: unknown): LayerSpecification =>
    ({ id, type: 'circle', source, ...(filter ? { filter } : {}), paint: { 'circle-radius': r, 'circle-color': color, 'circle-stroke-color': '#FFFFFF', 'circle-stroke-width': 2.5 } }) as LayerSpecification;
  return [
    { id: 'track-halo', type: 'line', source: SRC.track, layout: { 'line-join': 'round', 'line-cap': 'round' }, paint: { 'line-color': '#FFFFFF', 'line-width': 7.5, 'line-opacity': 0.85 } },
    { id: 'track', type: 'line', source: SRC.track, layout: { 'line-join': 'round', 'line-cap': 'round' }, paint: { 'line-color': C.track, 'line-width': 4, 'line-opacity': 0.98 } },
    dot('wpts', SRC.marks, 5.5, C.wpt, ['==', ['get', 'kind'], 'wpt']),
    dot('ends', SRC.marks, 7.5, ['match', ['get', 'kind'], 'start', C.start, C.track], ['!=', ['get', 'kind'], 'wpt']),
    { id: 'loc-halo', type: 'circle', source: SRC.loc, paint: { 'circle-radius': 16, 'circle-color': C.gps, 'circle-opacity': 0.16 } },
    dot('loc', SRC.loc, 8, C.gps),
    dot('scrub', SRC.scrub, 8, C.scrub)
  ];
}

const empty = { type: 'geojson', data: { type: 'FeatureCollection', features: [] } } as const;

/** The style: `topo` the region's raster under the overlays, else OpenFreeMap's vectors in ALPINE (its ground and
 *  roads, the track, then its labels over the track, then the dots). */
export function buildStyle(locale: Locale, region: Region, topo: boolean, fontFaces: FontFacesSpecification): StyleSpecification {
  const over = overlays();
  const base: SourceSpecification = topo ? { type: 'raster', tileSize: 256, ...TOPO_SOURCES[region] } : { ...BASEMAP };
  const layers: LayerSpecification[] = topo
    ? [{ id: 'topo', type: 'raster', source: SRC.base }, ...over]
    : (() => {
        const b = basemapLayers(SRC.base, ALPINE, locale, [FONT]);
        const isLine = (l: LayerSpecification) => l.id.startsWith('track');
        return [...b.filter((l) => l.type !== 'symbol'), ...over.filter(isLine), ...b.filter((l) => l.type === 'symbol'), ...over.filter((l) => !isLine(l))];
      })();
  return {
    version: 8,
    name: 'alpine',
    'font-faces': fontFaces,
    sources: { [SRC.base]: base, [SRC.track]: { ...empty }, [SRC.marks]: { ...empty }, [SRC.scrub]: { ...empty }, [SRC.loc]: { ...empty } },
    layers
  };
}
