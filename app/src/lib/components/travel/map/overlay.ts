// The trip map's overlays as GeoJSON (docs/travel.md "Maps"): the legs in the day colours, the candidate pins, the
// location dot, which stops a day shows and the box to fit. Pure.
import { dayColor, LAYERS, type Day, type Layer, type MapLeg, type MapPlace } from './types.ts';

// GeoJSON's few shapes used here (no @types/geojson dependency)
type Point = { type: 'Point'; coordinates: [number, number] };
type LineString = { type: 'LineString'; coordinates: [number, number][] };
type Feature<G, P> = { type: 'Feature'; id?: string; properties: P; geometry: G };
type FeatureCollection<G, P> = { type: 'FeatureCollection'; features: Feature<G, P>[] };

const onDay = (day: Day, d: number | undefined): boolean => day === 'all' || d === day;

/** The stops a day shows (all: every stop), by day then number. */
export const stopsOf = (places: readonly MapPlace[], day: Day): MapPlace[] =>
  places.filter((p) => p.kind === 'stop' && onDay(day, p.day)).sort((a, b) => (a.day ?? 0) - (b.day ?? 0) || (a.i ?? 0) - (b.i ?? 0));

/** The candidates whose layer is on. */
export const candidatesOf = (places: readonly MapPlace[], layers: Partial<Record<Layer, boolean>> | undefined): MapPlace[] =>
  places.filter((p) => p.kind !== 'stop' && !!layers?.[p.kind]);

export const layersOn = (layers: Partial<Record<Layer, boolean>> | undefined): Layer[] => LAYERS.filter((l) => !!layers?.[l]);

export type LegProps = { day: number; mode: MapLeg['mode']; color: string };
export function legsData(legs: readonly MapLeg[], colors: readonly string[], day: Day): FeatureCollection<LineString, LegProps> {
  return {
    type: 'FeatureCollection',
    features: legs.filter((l) => onDay(day, l.day) && l.line.length > 1).map((l): Feature<LineString, LegProps> => ({
      type: 'Feature', properties: { day: l.day, mode: l.mode, color: dayColor(colors, l.day) }, geometry: { type: 'LineString', coordinates: l.line }
    }))
  };
}

export type CandidateProps = { id: string; kind: Layer; sel: boolean };
export function candidatesData(places: readonly MapPlace[], layers: Partial<Record<Layer, boolean>> | undefined, selected: string | undefined): FeatureCollection<Point, CandidateProps> {
  return {
    type: 'FeatureCollection',
    features: candidatesOf(places, layers).map((p): Feature<Point, CandidateProps> => ({
      type: 'Feature', id: p.id, properties: { id: p.id, kind: p.kind as Layer, sel: p.id === selected }, geometry: { type: 'Point', coordinates: [p.lon, p.lat] }
    }))
  };
}

/** Where the pins stand, for the basemap's labels to keep clear of (style.ts `keepout`): the day's stops (the HTML
 *  pins) and the candidates shown. */
export function keepoutData(places: readonly MapPlace[], day: Day, layers: Partial<Record<Layer, boolean>> | undefined): FeatureCollection<Point, { pin: 'stop' | 'cand' }> {
  const pt = (p: MapPlace, pin: 'stop' | 'cand'): Feature<Point, { pin: 'stop' | 'cand' }> => ({ type: 'Feature', properties: { pin }, geometry: { type: 'Point', coordinates: [p.lon, p.lat] } });
  return { type: 'FeatureCollection', features: [...stopsOf(places, day).map((p) => pt(p, 'stop')), ...candidatesOf(places, layers).map((p) => pt(p, 'cand'))] };
}

export interface Fix { lon: number; lat: number; acc: number }
export function locData(fix: Fix | null): FeatureCollection<Point, { acc: number }> {
  return { type: 'FeatureCollection', features: fix ? [{ type: 'Feature', properties: { acc: fix.acc }, geometry: { type: 'Point', coordinates: [fix.lon, fix.lat] } }] : [] };
}

/** [[west, south], [east, north]] round what a day shows (its stops and legs), or null if nothing. */
export function boundsOf(places: readonly MapPlace[], legs: readonly MapLeg[], day: Day): [[number, number], [number, number]] | null {
  const pts: [number, number][] = [...stopsOf(places, day).map((p): [number, number] => [p.lon, p.lat]), ...legs.filter((l) => onDay(day, l.day)).flatMap((l) => l.line)];
  if (!pts.length) return null;
  let w = Infinity, s = Infinity, e = -Infinity, n = -Infinity;
  for (const [x, y] of pts) (w = Math.min(w, x), e = Math.max(e, x), s = Math.min(s, y), n = Math.max(n, y));
  return [[w, s], [e, n]];
}
