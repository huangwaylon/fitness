// The classic guides' logic (docs/travel.md "Classic guides"): Okinawa and Seattle as the old travel-plans site showed
// them. Pure: which views a guide has, the language its own words are in, a day card's look and its date chip, the
// campsite filter (one criterion at a time, as the site's), the frozen packing list (the trip's seed as it is: no
// ticks, no edits, nothing from the relay) and the map's stop list (where "now" is, what's behind it).
import type { Camp, Day, Place, Trip } from '#lib/travel/types.ts';
import type { L, PackSeed } from '#lib/contract/pack.ts';
import type { Locale } from '#lib/i18n/index.ts';

export type View = 'itinerary' | 'map' | 'camps' | 'packing';

/** A guide's tabs in the site's order: 日程, 地図 (a route), キャンプ場 (campsites), 持ち物. */
export const viewsOf = (trip: Trip): View[] => ['itinerary', ...(trip.places.length ? ['map' as const] : []), ...(trip.camps?.length ? ['camps' as const] : []), 'packing'];

/** The language a guide's own chrome is in (its date chips, headings, a hike's labels): the reader's when the guide is
 *  written in it, else the guide's (Seattle's is English only, as the site's was). */
export const guideLang = (trip: Trip, locale: Locale): Locale => (trip.title[locale] ? locale : locale === 'ja' ? 'en' : 'ja');

/** A day card's class on the site: an itinerary day, a flight day, a hike, or a plain day (''). */
export const dayLook = (day: Day): 'day' | 'travel' | 'hike' | '' => day.look ?? (day.hike ? 'hike' : '');

/** Itinerary days start open (Okinawa's), the rest closed (Seattle's), as the site's markup had them. */
export const dayOpen = (day: Day): boolean => day.look === 'day';

const MON_EN = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
const WD_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const WD_JA = ['日', '月', '火', '水', '木', '金', '土'];

const parts = (date: string) => {
  const [y, m, d] = date.split('-').map(Number);
  return { m, d, wd: new Date(Date.UTC(y, m - 1, d)).getUTCDay() };
};

/** A day card's date chip ('10' / '10月' / '土', or '2' / 'JUL' / 'Thu'). */
export function leadChip(date: string, lang: Locale): { d: string; m: string; wd: string } {
  const { m, d, wd } = parts(date);
  return lang === 'ja' ? { d: String(d), m: `${m}月`, wd: WD_JA[wd] } : { d: String(d), m: MON_EN[m - 1], wd: WD_EN[wd] };
}

/** A short date ('Jul 3', '7月3日'): a hike's line. */
export function shortDate(date: string, lang: Locale): string {
  const { m, d } = parts(date);
  return lang === 'ja' ? `${m}月${d}日` : `${MON_EN[m - 1][0]}${MON_EN[m - 1].slice(1).toLowerCase()} ${d}`;
}

export type CampFilter = 'all' | 'wild' | 'paid' | 'beach' | 'toilet' | 'shower';
/** The campsites' filter chips, in the site's order. */
export const CAMP_FILTERS: readonly CampFilter[] = ['all', 'wild', 'paid', 'beach', 'toilet', 'shower'];

/** Whether a campsite shows under a filter: all, its kind, or one amenity it has. */
export const campShown = (c: Camp, f: CampFilter): boolean => f === 'all' || (f === 'wild' || f === 'paid' ? c.type === f : c[f]);

export interface FrozenCat { id: string; icon: string; name: L; items: { id: string; text: L; note?: L }[] }

/** The packing list frozen: the trip's seed, categories and items in its order, the empty categories left out (a
 *  category's count is its items'). Never the relay's list: the trips are over. */
export const frozenPack = (seed: PackSeed): FrozenCat[] =>
  seed.cats.filter((c) => c.items.length).map((c) => ({ id: c.id, icon: c.icon, name: c.name, items: c.items.map((i) => ({ id: i.id, text: i.text, ...(i.note ? { note: i.note } : {}) })) }));

/** A map stop list's row: the stop, its day and number, its arrival. */
export interface StopRow { id: string; day: number; i: number; min: number; name: L }

/** A day's stops in order (day 0: every day's, day by day). */
export const stopRows = (places: readonly Place[], day: number): StopRow[] =>
  places
    .filter((p) => p.kind === 'stop' && p.day !== undefined && (day === 0 || p.day === day))
    .map((p) => ({ id: p.id, day: p.day!, i: p.i ?? 0, min: p.min ?? 0, name: p.name }))
    .sort((a, b) => a.day - b.day || a.i - b.i);

/** The days with stops, in order. */
export const stopDays = (places: readonly Place[]): number[] => [...new Set(stopRows(places, 0).map((r) => r.day))];

/** A row against "now" (the stop the reader is at, `at` its minute on `day`; the site's map opens a day at its first
 *  stop): before it 'past', it 'now', else ''. Every-day lists have no now. */
export const rowState = (r: StopRow, day: number, at: number | null): 'past' | 'now' | '' =>
  at === null || day === 0 || r.day !== day ? '' : r.min < at ? 'past' : r.min === at ? 'now' : '';

/** '08:55' for 535 minutes after midnight. */
export const hhmm = (min: number): string => `${String(Math.floor(min / 60) % 24).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`;
