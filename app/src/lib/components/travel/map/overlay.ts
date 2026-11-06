// The trip map's overlays (docs/travel.md "Maps"): a day's pins (its stops, the ones at one spot merged), the legs in
// the day colours, the candidate dots, the location dot as GeoJSON, the box to fit and how far a fix is from the trip.
// Pure.
import type { Leg, Place } from '#lib/travel/types.ts';
import type { Locale } from '#lib/i18n/index.ts';
import { pick } from '../text.ts';
import { dayColor, LAYERS, type Layer, type Layers } from './types.ts';

// GeoJSON's few shapes used here (no @types/geojson dependency)
type Point = { type: 'Point'; coordinates: [number, number] };
type LineString = { type: 'LineString'; coordinates: [number, number][] };
type Feature<G, P> = { type: 'Feature'; id?: string; properties: P; geometry: G };
type FeatureCollection<G, P> = { type: 'FeatureCollection'; features: Feature<G, P>[] };

/** Metres between two points (haversine). */
function metres(a: { lat: number; lon: number }, b: { lat: number; lon: number }): number {
  const r = Math.PI / 180, dLat = (b.lat - a.lat) * r, dLon = (b.lon - a.lon) * r;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * r) * Math.cos(b.lat * r) * Math.sin(dLon / 2) ** 2;
  return 2 * 6_371_000 * Math.asin(Math.sqrt(h));
}

/** Stops closer than this are one spot: one pin (New Lynn, where NZ's days start and end). */
const SAME_SPOT_M = 30;

/** A day's pin: one spot's stops (by number), its first stop's id (what a tap selects), `n` the rows' numbers
 *  ('2·6'). */
export interface Pin { id: string; ids: string[]; n: string; name: Place['name']; day: number; lat: number; lon: number }

/** A day's stops, by number. */
export const stopsOf = (places: readonly Place[], day: number): Place[] =>
  places.filter((p) => p.kind === 'stop' && p.day === day).sort((a, b) => (a.i ?? 0) - (b.i ?? 0));

/** A day's pins: its stops numbered as the list's rows (the guide's `i` counts from 0), the ones at one spot merged
 *  into the first's pin. */
export function pinsOf(places: readonly Place[], day: number): Pin[] {
  const out: (Pin & { at: Place })[] = [];
  for (const s of stopsOf(places, day)) {
    const n = String((s.i ?? 0) + 1);
    const same = out.find((p) => metres(p.at, s) < SAME_SPOT_M);
    if (same) (same.ids.push(s.id), (same.n += `·${n}`));
    else out.push({ id: s.id, ids: [s.id], n, name: s.name, day, lat: s.lat, lon: s.lon, at: s });
  }
  return out.map(({ at: _, ...p }) => p);
}

/** The pin's name for the reader: its numbers and its place. */
export const pinLabel = (p: Pin, locale: Locale): string => `${p.n} ${pick(p.name, locale)}`;

/** The candidates whose layer is on. */
export const candidatesOf = (places: readonly Place[], layers: Layers | undefined): Place[] =>
  places.filter((p) => p.kind !== 'stop' && !!layers?.[p.kind]);

export const layersOn = (layers: Layers | undefined): Layer[] => LAYERS.filter((l) => !!layers?.[l]);

export type LegProps = { mode: Leg['mode']; color: string };
export function legsData(legs: readonly Leg[], colors: readonly string[], day: number): FeatureCollection<LineString, LegProps> {
  return {
    type: 'FeatureCollection',
    features: legs.filter((l) => l.day === day && l.line.length > 1).map((l): Feature<LineString, LegProps> => ({
      type: 'Feature', properties: { mode: l.mode, color: dayColor(colors, l.day) }, geometry: { type: 'LineString', coordinates: l.line }
    }))
  };
}

export type CandidateProps = { id: string; kind: Layer; sel: boolean };
export function candidatesData(places: readonly Place[], layers: Layers | undefined, selected: string | undefined): FeatureCollection<Point, CandidateProps> {
  return {
    type: 'FeatureCollection',
    features: candidatesOf(places, layers).map((p): Feature<Point, CandidateProps> => ({
      type: 'Feature', id: p.id, properties: { id: p.id, kind: p.kind as Layer, sel: p.id === selected }, geometry: { type: 'Point', coordinates: [p.lon, p.lat] }
    }))
  };
}

/** Where the pins stand, for the basemap's labels to keep clear of (style.ts `keepout`): the day's pins (HTML) and the
 *  candidates shown. */
export function keepoutData(pins: readonly Pin[], cands: readonly Place[]): FeatureCollection<Point, { pin: 'stop' | 'cand' }> {
  const pt = (p: { lat: number; lon: number }, pin: 'stop' | 'cand'): Feature<Point, { pin: 'stop' | 'cand' }> => ({ type: 'Feature', properties: { pin }, geometry: { type: 'Point', coordinates: [p.lon, p.lat] } });
  return { type: 'FeatureCollection', features: [...pins.map((p) => pt(p, 'stop')), ...cands.map((p) => pt(p, 'cand'))] };
}

export interface Fix { lon: number; lat: number; acc: number }
export function locData(fix: Fix | null): FeatureCollection<Point, { acc: number }> {
  return { type: 'FeatureCollection', features: fix ? [{ type: 'Feature', properties: { acc: fix.acc }, geometry: { type: 'Point', coordinates: [fix.lon, fix.lat] } }] : [] };
}

/** A fix this far from every stop of the trip is somewhere else (home, before the trip): the map stays on the route. */
const FAR_M = 50_000;
export const farFrom = (places: readonly Place[], fix: Fix): boolean => places.every((p) => p.kind !== 'stop' || metres(p, fix) > FAR_M);

/** [[west, south], [east, north]] round what a day shows (its stops and legs), or null if nothing. */
export function boundsOf(places: readonly Place[], legs: readonly Leg[], day: number): [[number, number], [number, number]] | null {
  const pts: [number, number][] = [...stopsOf(places, day).map((p): [number, number] => [p.lon, p.lat]), ...legs.filter((l) => l.day === day).flatMap((l) => l.line)];
  if (!pts.length) return null;
  let w = Infinity, s = Infinity, e = -Infinity, n = -Infinity;
  for (const [x, y] of pts) (w = Math.min(w, x), e = Math.max(e, x), s = Math.min(s, y), n = Math.max(n, y));
  return [[w, s], [e, n]];
}
