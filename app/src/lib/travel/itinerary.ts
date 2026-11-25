// A trip's days as 日程 and 地図 share them (docs/travel.md "Itinerary"): each day's stops in order (with where they
// are, when the map has them), the legs between them, where we sleep. Derived from the trip's rows (types.ts RowKind),
// never guessed from their text. Pure: the map's chunk and the tests import it without the list.
//
// The contract between the list (TripView's 日程, Itinerary.svelte) and the whole-trip map (地図, AllDaysMap.svelte):
// the sheet holds the day and the stop the two hand each other (MapTabProps): 地図で見る on a stop opens 地図 on that
// stop; the map's 日程で見る opens 日程 scrolled to it; 地図 opens on the day being read (or today). A day of it:
// `Itinerary['days'][number]`.
import type { DayRow, L, Leg, Trip } from './types.ts';

/** The reader's language (i18n's Locale: a text pair's sides). */
type Locale = keyof L;

type StopKind =
  /** a place we arrive at */
  | 'stop'
  /** the stop we sleep at that night (泊) */
  | 'stay'
  /** where the day sets off from (a `leg` row with a place: no line of its own on 日程) */
  | 'start'
  /** a flight (never on the map: no place) */
  | 'flight';

interface ItinStop {
  /** The place's id (Place.id, `s3-2`) when it is on the map, else `r<day>-<row>`. What focusStop names. */
  id: string;
  /** As written: '08:00', '~12:00', '<21:00', or '' (none). */
  time: string;
  /** In the reader's locale, the part before the text's 「 — 」 (its gloss dropped). */
  name: string;
  lat?: number;
  lng?: number;
  kind: StopKind;
  /** The row's index in the day's `rows`. */
  row: number;
}

interface ItinLeg {
  /** Place ids (ItinStop.id). */
  from: string;
  to: string;
  mode: Leg['mode'];
  /** Free-flow minutes (a drive), the guide's (a walk, a boat, a bus's timetable); none when unknown. */
  minutes?: number;
  km?: number;
  /** [lon, lat]: the route drawn (none for a leg without a map). */
  line?: [number, number][];
}

interface ItinDay {
  /** The day's n (1-based). */
  i: number;
  /** YYYY-MM-DD, the trip's local date. */
  date: string;
  title: string;
  /** The day's colour (its dot on 日程, its route on 地図). */
  colour: string;
  stops: ItinStop[];
  legs: ItinLeg[];
  /** Where we sleep that night (none: home, or on a plane). */
  stay?: { id: string; name: string; booked: boolean };
}

export interface Itinerary {
  days: ItinDay[];
}

/** What the sheet hands the whole-trip map (地図's content, AllDaysMap.svelte). `day` / `stop` are the sheet's:
 *  the map follows them when they change, and reports its own picks back. */
export interface MapTabProps {
  trip: Trip;
  itinerary: Itinerary;
  /** The day shown (ItinDay.i), or null for the whole trip (全体). selectedDay. */
  day: number | null;
  /** A stop to bring into view and ring (ItinStop.id with lat/lng), or null. focusStop. */
  stop: string | null;
  /** The reader picked another day on the map (or 全体: null). */
  onday?: (day: number | null) => void;
  /** 日程で見る on a stop: the sheet switches to 日程, scrolled to that stop (its line opened). */
  onlist: (stop: string) => void;
}

const DAY_FALLBACK = '#2F86BD';
/** Day d's colour (types.ts Trip.dayColors: one per day). */
export const colourOf = (trip: Pick<Trip, 'dayColors'>, d: number): string => trip.dayColors[d - 1] ?? DAY_FALLBACK;

const side = (l: { ja?: string; en?: string } | undefined, locale: Locale) => (l ? (l[locale] ?? l[locale === 'ja' ? 'en' : 'ja'] ?? '') : '');
/** The dash between a text's name and its gloss (no space needed after a bracket: 「市場（名護市）— 買い出し」). */
export const DASH = /\s*[—–]\s*/;
/** A text's name part: before 「 — 」 (the gloss after it, 「キングタコス金武町 — タコライス」). Tokens left as written. */
export const namePart = (s: string): string => s.split(DASH)[0].trim();

/** The language a guide reads in: the reader's, unless the guide has none of it (Seattle's is English only). */
export const guideLocale = (trip: Pick<Trip, 'days'>, locale: Locale): Locale => (trip.days.some((d) => d.title[locale]) ? locale : locale === 'ja' ? 'en' : 'ja');

/** A row's map id: its place, else r<day>-<row>. */
export const stopId = (day: number, row: DayRow, i: number): string => row.place ?? `r${day}-${i}`;

/** The trip's itinerary in the guide's language (guideLocale: the reader's, where it has it). */
export function itinerary(trip: Trip, reader: Locale): Itinerary {
  const locale = guideLocale(trip, reader);
  const places = new Map(trip.places.map((p) => [p.id, p]));
  return {
    days: trip.days.map((d) => {
      const stops: ItinStop[] = [];
      d.rows.forEach((r, i) => {
        const kind: StopKind | null = r.kind === 'stop' || r.kind === 'stay' || r.kind === 'flight' ? r.kind : r.place ? 'start' : null;
        if (!kind) return;
        const p = r.place ? places.get(r.place) : undefined;
        stops.push({ id: stopId(d.n, r, i), time: r.t, name: namePart(side(p && kind === 'start' ? p.name : r.text, locale)), ...(p ? { lat: p.lat, lng: p.lon } : {}), kind, row: i });
      });
      const legs: ItinLeg[] = trip.legs
        .filter((l) => l.day === d.n)
        .map((l) => ({ from: l.from, to: l.to, mode: l.mode, ...(l.min ? { minutes: l.min } : {}), ...(l.km ? { km: l.km } : {}), line: l.line }));
      const si = d.rows.findIndex((r) => r.kind === 'stay');
      const sr = d.rows[si];
      return {
        i: d.n,
        date: d.date,
        title: side(d.title, locale),
        colour: colourOf(trip, d.n),
        stops,
        legs,
        ...(sr ? { stay: { id: stopId(d.n, sr, si), name: namePart(side(sr.text, locale)), booked: sr.booked !== false } } : {})
      };
    })
  };
}
