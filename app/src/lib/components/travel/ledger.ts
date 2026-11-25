// 日程's lines (docs/design.md §Trips, docs/travel.md "Itinerary"): a day's rows folded by their kind (types.ts
// RowKind) into the lines the list shows, each fact once. A stop is a line (time, place, how we got there: the leg's
// way and minutes, 「09:30発」 on the day's first leg only); a leg has no line of its own (its note, and the time and
// words of a later leg, go into the stop's tap-open details); an event is a timed line under its stop (a line of its
// own before any stop, or after another such); sunrise and sunset only in the details; the night's stop says 「泊」.
// The line we are heading to during the trip (nowMark) is the one row lit. Pure: the words are the component's.
import type { Day, DayRow, L, Leg, Place, Trip } from '#lib/travel/types.ts';
import { DASH, stopId } from '#lib/travel/itinerary.ts';
import { instantIn } from '#lib/time/zone.ts';
import { rowMin, rowNow } from './when.ts';

/** How we got to a stop: the day's first departure time, the way, the minutes. */
export interface How { dep?: string; mode?: Leg['mode']; min?: number }

/** A detail line (tap-open): a later leg's time and words, a note, a sunrise. */
interface More { t?: string; text?: L; note?: L }

interface Sub { t: string; text: L; note?: L; row: number }

export interface Line {
  /** ItinStop.id: the place's id, else r<day>-<row>. */
  id: string;
  kind: 'stop' | 'stay' | 'flight' | 'event';
  t: string;
  dd?: -1 | 1;
  name: L;
  gloss?: L;
  how?: How;
  km?: number;
  /** A stay's bed booked (false: 未予約). */
  booked?: boolean;
  place?: Place;
  subs: Sub[];
  more: More[];
  /** The line's own row, and every row it stands for (folded legs, its subs, its sun rows). */
  row: number;
  rows: number[];
}

/** A text's name and its gloss (after 「 — 」), side by side. */
export function splitText(l: L): { name: L; gloss?: L } {
  const name: L = {}, gloss: L = {};
  for (const k of ['ja', 'en'] as const) {
    const s = l[k];
    if (s === undefined) continue;
    const [a, ...b] = s.split(DASH);
    name[k] = a.trim();
    // a side without one says so (''), so the reader's never shows the other's
    gloss[k] = b.join(' — ').trim();
  }
  return gloss.ja || gloss.en ? { name, gloss } : { name };
}

/** A day's lines. */
export function lines(trip: Pick<Trip, 'places' | 'legs'>, day: Day): Line[] {
  const places = new Map(trip.places.map((p) => [p.id, p]));
  const out: Line[] = [];
  /** Legs set off since the last stop, waiting for the stop they arrive at. */
  let fold: { row: DayRow; i: number }[] = [];
  /** Sun rows before any line: the next line's. */
  let sunQ: { row: DayRow; i: number }[] = [];
  let firstLeg = true;
  const sunMore = (r: DayRow): More => ({ t: r.t, text: r.text, ...(r.note ? { note: r.note } : {}) });

  day.rows.forEach((r, i) => {
    if (r.kind === 'leg') return void fold.push({ row: r, i });
    const last = out.at(-1);
    if (r.kind === 'sun') {
      if (last) (last.more.push(sunMore(r)), last.rows.push(i));
      else sunQ.push({ row: r, i });
      return;
    }
    if (r.kind === 'event' && last && last.kind !== 'event') {
      last.subs.push({ t: r.t, text: r.text, ...(r.note ? { note: r.note } : {}), row: i });
      last.rows.push(i);
      return;
    }
    const place = r.place ? places.get(r.place) : undefined;
    const line: Line = { id: stopId(day.n, r, i), kind: r.kind as Line['kind'], t: r.t, ...(r.dd ? { dd: r.dd } : {}), ...splitText(r.text), place, subs: [], more: [], row: i, rows: [] };
    for (const s of sunQ) (line.more.push(sunMore(s.row)), line.rows.push(s.i));
    sunQ = [];
    if (r.kind === 'stop' || r.kind === 'stay') {
      const leg = place ? trip.legs.find((l) => l.day === day.n && l.to === place.id && l.i === place.i) : undefined;
      const go = fold.findLast((f) => f.row.go)?.row.go;
      const how: How = {};
      if (fold.length && firstLeg && fold[0].row.t) how.dep = fold[0].row.t;
      const mode = leg?.mode ?? go?.mode;
      if (mode) how.mode = mode;
      const min = go?.min ?? leg?.min;
      if (min) how.min = min;
      if (Object.keys(how).length) line.how = how;
      if (leg?.km) line.km = leg.km;
      if (r.kind === 'stay') line.booked = r.booked !== false;
      fold.forEach((f, k) => {
        // the first leg's time and words are its 「発」; a later one's are details
        const shown = k === 0 && !!how.dep;
        if (!shown) line.more.push({ ...(f.row.t ? { t: f.row.t } : {}), text: f.row.text });
        if (f.row.note) line.more.push({ note: f.row.note });
        line.rows.push(f.i);
      });
      if (fold.length) firstLeg = false;
      fold = [];
    }
    if (r.note) line.more.push({ note: r.note });
    line.rows.push(i);
    out.push(line);
  });
  return out;
}

/** Every line of the trip by day (n → lines). */
export const ledger = (trip: Pick<Trip, 'places' | 'legs' | 'days'>): Map<number, Line[]> => new Map(trip.days.map((d) => [d.n, lines(trip, d)]));

export interface Mark {
  day: number;
  /** The line lit. */
  id: string;
  /** On the way to it (a leg folded into it is now); `next`: before the day's first row. */
  state: 'moving' | 'next' | 'here';
  /** Minutes till its arrival (moving / next), when its time is known and still ahead. */
  left?: number;
  /** The leg's km (moving). */
  km?: number;
  /** Whether a line comes before the lit one (the rows gone by: quiet). */
  past: (day: number, id: string) => boolean;
}

/** The one line to light during the trip (the trip's clock: when.ts rowNow), or null outside it. */
export function nowMark(trip: Trip, all: Map<number, Line[]>, now: number): Mark | null {
  const m = rowNow(trip, now);
  if (!m) return null;
  const ls = all.get(m.day) ?? [];
  const k = Math.max(0, ls.findIndex((l) => l.rows.includes(m.i)));
  const l = ls[k];
  if (!l) return null;
  const day = trip.days.find((d) => d.n === m.day)!;
  const state = m.next ? 'next' : m.i !== l.row && day.rows[m.i]?.kind === 'leg' && m.i < l.row ? 'moving' : 'here';
  const arr = rowMin(l.t);
  const at = arr === null ? null : instantIn(day.rows[l.row].tz ?? trip.tz, day.date, arr + (l.dd ?? 0) * 1440);
  const left = at === null ? 0 : Math.round((at - now) / 60_000);
  return {
    day: m.day,
    id: l.id,
    state,
    ...(state !== 'here' && left > 0 ? { left } : {}),
    ...(state === 'moving' && l.km ? { km: l.km } : {}),
    past: (d, id) => d < m.day || (d === m.day && ls.findIndex((x) => x.id === id) < k)
  };
}
