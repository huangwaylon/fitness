// The trip map's overlays (docs/travel.md "Maps"): a day's pins (its stops, the ones at one spot merged), the legs in
// the day colours, the candidate dots as GeoJSON, the box to fit and how far a fix is from the trip.
// Pure.
import type { Leg, Place } from '#lib/travel/types.ts';
import type { Locale } from '#lib/i18n/index.ts';
import { pick } from '../text.ts';
import { dayColor, LAYERS, type Layer, type Layers } from './types.ts';
import type { Fix } from '../../map/types.ts';
import { bboxOf, fc, ln, pt, type Collection, type LineFeature, type PointFeature } from '../../map/geojson.ts';
import { distM } from '#lib/places/geo.ts';

/** Metres between two points. */
const metres = (a: { lat: number; lon: number }, b: { lat: number; lon: number }): number => distM([a.lon, a.lat], [b.lon, b.lat]);

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

type LegProps = { mode: Leg['mode']; color: string };
export const legsData = (legs: readonly Leg[], colors: readonly string[], day: number): Collection<LineFeature<LegProps>> =>
  fc(legs.filter((l) => l.day === day && l.line.length > 1).map((l) => ln<LegProps>(l.line, { mode: l.mode, color: dayColor(colors, l.day) })));

type CandidateProps = { id: string; kind: Layer; sel: boolean };
/** (the source's promoteId: 'id' makes `id` the feature's id) */
export const candidatesData = (places: readonly Place[], layers: Layers | undefined, selected: string | undefined): Collection<PointFeature<CandidateProps>> =>
  fc(candidatesOf(places, layers).map((p) => pt<CandidateProps>(p.lon, p.lat, { id: p.id, kind: p.kind as Layer, sel: p.id === selected })));

/** Where the pins stand, for the basemap's labels to keep clear of (style.ts `keepout`): the day's pins (HTML) and the
 *  candidates shown. */
export const keepoutData = (pins: readonly Pin[], cands: readonly Place[]): Collection<PointFeature<{ pin: 'stop' | 'cand' }>> =>
  fc([...pins.map((p) => pt(p.lon, p.lat, { pin: 'stop' as const })), ...cands.map((p) => pt(p.lon, p.lat, { pin: 'cand' as const }))]);

/** A fix this far from every stop of the trip is somewhere else (home, before the trip): the map stays on the route. */
const FAR_M = 50_000;
export const farFrom = (places: readonly Place[], fix: Fix): boolean => places.every((p) => p.kind !== 'stop' || metres(p, fix) > FAR_M);

/** [[west, south], [east, north]] round what a day shows (its stops and legs), or null if nothing. */
export const boundsOf = (places: readonly Place[], legs: readonly Leg[], day: number): [[number, number], [number, number]] | null =>
  bboxOf([...stopsOf(places, day).map((p) => [p.lon, p.lat]), ...legs.filter((l) => l.day === day).flatMap((l) => l.line)]);

/** A day's path ([lon, lat] in order: each stop after the legs that reach it; no legs, its stops), the saved places'
 *  layer's (map/places/near.ts: those near the day's route, never the view). */
export function dayPath(places: readonly Place[], legs: readonly Leg[], day: number): [number, number][] {
  const mine = legs.filter((l) => l.day === day);
  return stopsOf(places, day).flatMap((s) => [...mine.filter((l) => l.i === s.i).flatMap((l) => l.line), [s.lon, s.lat] as [number, number]]);
}
