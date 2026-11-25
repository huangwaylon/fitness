// The whole-trip map's pure side (地図 tab): which days have a map, the box a focus fits, what each focus draws (the
// days' legs and stop dots, the other days faded), the stop a tap names and its card. No MapLibre: the tab and the
// tests use it without the map's chunk.
import type { Locale } from '#lib/i18n/index.ts';
import type { Place } from '#lib/travel/types.ts';
import { distM } from '#lib/places/geo.ts';
import { bboxOf, fc, ln, pt, type Collection, type LineFeature, type LL, type PointFeature } from '../../map/geojson.ts';
import type { Fix } from '../../map/types.ts';
import type { Layer, Layers, MapDay, MapStop } from './types.ts';

export type Box = [[number, number], [number, number]];

/** The other days' opacity while one is focused. */
export const FADED = 0.25;

type Located = MapStop & { lat: number; lng: number };
const located = (s: MapStop): s is Located => Number.isFinite(s.lat) && Number.isFinite(s.lng);
const lines = (d: MapDay) => (d.legs ?? []).filter((l) => (l.line?.length ?? 0) > 1);

/** The days the map draws: a stop with a position or a leg with a line. */
export const mapDays = (days: readonly MapDay[]): MapDay[] => days.filter((d) => d.stops.some(located) || lines(d).length > 0);

/** The day the map opens on: `want` if the map draws it, else 全体 (null). */
export const openOn = (days: readonly MapDay[], want: number | null | undefined): number | null =>
  want != null && mapDays(days).some((d) => d.i === want) ? want : null;

/** [[west, south], [east, north]] round the focused day (null: every day), or null if it has nothing. */
export function boundsOf(days: readonly MapDay[], focus: number | null): Box | null {
  const shown = days.filter((d) => focus == null || d.i === focus);
  return bboxOf(shown.flatMap((d) => [...d.stops.filter(located).map((s) => [s.lng, s.lat]), ...lines(d).flatMap((l) => l.line!.map((p) => [p[0], p[1]]))]));
}

const opacity = (d: MapDay, focus: number | null) => (focus == null || d.i === focus ? 1 : FADED);
/** The focused day drawn last (over the faded ones). */
const order = (days: readonly MapDay[], focus: number | null) => [...days.filter((d) => d.i !== focus), ...days.filter((d) => d.i === focus)];

export type LegProps = { c: string; o: number; dash: boolean };
export const legsData = (days: readonly MapDay[], focus: number | null): Collection<LineFeature<LegProps>> =>
  fc(order(days, focus).flatMap((d) => lines(d).map((l) => ln<LegProps>(l.line!.map((p) => [p[0], p[1]] as LL), { c: d.colour, o: opacity(d, focus), dash: l.mode === 'walk' || l.mode === 'boat' }))));

export type StopProps = { id: string; day: number; c: string; o: number; sel: boolean };
/** The stop dots; the selected one last (ringed, over the rest). */
export function stopsData(days: readonly MapDay[], focus: number | null, selected: string | null): Collection<PointFeature<StopProps>> {
  const fs = order(days, focus).flatMap((d) => d.stops.filter(located).map((s) => pt<StopProps>(s.lng, s.lat, { id: s.id, day: d.i, c: d.colour, o: opacity(d, focus), sel: s.id === selected })));
  return fc([...fs.filter((f) => !f.properties.sel), ...fs.filter((f) => f.properties.sel)]);
}

/** A stop by id, and its day. */
export function findStop(days: readonly MapDay[], id: string | null | undefined): { day: MapDay; stop: Located } | null {
  if (!id) return null;
  for (const day of days) {
    const stop = day.stops.find((s) => s.id === id);
    if (stop && located(stop)) return { day, stop };
  }
  return null;
}

/** A name for the reader (a plain string, or a pair in the reader's language, else the other). */
export const nameOf = (n: MapStop['name'] | undefined, locale: Locale): string =>
  !n ? '' : typeof n === 'string' ? n : (n[locale] ?? n[locale === 'ja' ? 'en' : 'ja'] ?? '');

/** The foot row's cell: the day of the month ('2026-11-13' → '13'). */
export const dom = (date: string): string => String(Number(date.slice(8, 10)));

/** Whether the point sits inside the map's visible part (`w`×`h` px, `cover` px at the bottom under the card and the
 *  foot row, `edge` px kept clear at each side). */
export const inView = (p: { x: number; y: number }, w: number, h: number, cover: number, edge = 16): boolean =>
  p.x >= edge && p.x <= w - edge && p.y >= edge && p.y <= h - cover - edge;

/** The path the saved places are near (map/places/near.ts): the focused day's (every day's under 全体) stops and
 *  lines, [lng, lat] in order; null for none. */
export function pathOf(days: readonly MapDay[], focus: number | null): [number, number][] | null {
  const pts = days.filter((d) => focus == null || d.i === focus).flatMap((d) => [...lines(d).flatMap((l) => l.line!.map((p): [number, number] => [p[0], p[1]])), ...d.stops.filter(located).map((s): [number, number] => [s.lng, s.lat])]);
  return pts.length ? pts : null;
}

/** A fix this far from every stop (home, before the trip) is somewhere else: the dot shown, the map kept on the trip. */
const FAR_M = 50_000;
export const farFrom = (days: readonly MapDay[], fix: Fix): boolean =>
  days.every((d) => d.stops.filter(located).every((s) => distM([s.lng, s.lat], [fix.lon, fix.lat]) > FAR_M));

/** The candidates whose layer is on (Okinawa's campsites, nature, food). */
export const candidatesOf = (places: readonly Place[], layers: Layers): Place[] => places.filter((p) => p.kind !== 'stop' && !!layers[p.kind]);

export type CandProps = { id: string; kind: Layer; sel: boolean };
export const candidatesData = (cands: readonly Place[], sel: string | null): Collection<PointFeature<CandProps>> =>
  fc(cands.map((p) => pt<CandProps>(p.lon, p.lat, { id: p.id, kind: p.kind as Layer, sel: p.id === sel })));
