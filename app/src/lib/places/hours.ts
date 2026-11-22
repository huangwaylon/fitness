// A place's opening hours as the card says them (docs/places.md "Hours"): from the contract's weekly periods (Period:
// minutes from the day's local midnight, past 1440 past midnight) and its time zone, open now and until when, closing
// within the hour, closed and from when (today, 明日, or a weekday), 本日定休, unknown; the week view's rows; whether it
// opens on a day. The minute of the week by Intl in the place's zone (one formatter per zone, kept: a filter over 3,000
// places reads it once per zone). Pure.
import { WEEK_MIN, type Period } from '../contract/places.ts';

const DAY = 1440;
const WD = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const fmts = new Map<string, Intl.DateTimeFormat>();
function fmt(tz: string): Intl.DateTimeFormat {
  let f = fmts.get(tz);
  if (!f) {
    const o = { weekday: 'short', hour: 'numeric', minute: 'numeric', hourCycle: 'h23' } as const;
    try {
      f = new Intl.DateTimeFormat('en-US', { ...o, timeZone: tz });
    } catch {
      f = new Intl.DateTimeFormat('en-US', { ...o, timeZone: 'Asia/Tokyo' }); // (a zone this engine lacks)
    }
    fmts.set(tz, f);
  }
  return f;
}

/** The minute of the week (0 = Sunday 00:00) at `at` (epoch ms) in `tz`. */
export function weekMin(at: number, tz: string): number {
  let d = 0, h = 0, m = 0;
  for (const p of fmt(tz).formatToParts(at)) {
    if (p.type === 'weekday') d = WD.indexOf(p.value);
    else if (p.type === 'hour') h = Number(p.value) % 24;
    else if (p.type === 'minute') m = Number(p.value);
  }
  return d * DAY + h * 60 + m;
}

/** The periods as week-minute spans over three weeks (last, this, next), merged where they touch: a run past
 *  Saturday midnight meets Sunday's, a 24/7 place is one span. */
function spans(hours: readonly Period[]): [number, number][] {
  const s: [number, number][] = [];
  for (const k of [-WEEK_MIN, 0, WEEK_MIN]) for (const p of hours) s.push([p.d * DAY + p.o + k, p.d * DAY + p.c + k]);
  s.sort((a, b) => a[0] - b[0]);
  const out: [number, number][] = [];
  for (const x of s) {
    const last = out.at(-1);
    if (last && x[0] <= last[1]) last[1] = Math.max(last[1], x[1]);
    else out.push([x[0], x[1]]);
  }
  return out;
}

export type HoursNow =
  | { k: 'unknown' }
  | { k: 'always' }
  /** Open till `until` (minute of its day); `soon`: within the hour. */
  | { k: 'open'; until: number; soon: boolean }
  /** Closed: opens at `from` (minute of its day) in `inDays` days (0 today) on weekday `day`; `off`: no period
   *  starts today (本日定休). */
  | { k: 'closed'; from: number; inDays: number; day: number; off: boolean };

const SOON_MIN = 60;

export function hoursNow(hours: readonly Period[] | null, tz: string, at: number): HoursNow {
  if (!hours?.length) return { k: 'unknown' };
  const m = weekMin(at, tz);
  return hoursAt(hours, m);
}

/** Whether it's open at minute of the week `m` (its zone's), without merging: the filters' fast check. */
export function openIn(hours: readonly Period[] | null, m: number): boolean {
  if (!hours) return false;
  for (const p of hours) {
    const o = p.d * DAY + p.o, c = p.d * DAY + p.c;
    if ((m >= o && m < c) || m + WEEK_MIN < c) return true;
  }
  return false;
}

function hoursAt(hours: readonly Period[], m: number): HoursNow {
  const sp = spans(hours);
  const open = sp.find(([a, b]) => a <= m && m < b);
  if (open) {
    if (open[1] - open[0] >= WEEK_MIN) return { k: 'always' };
    return { k: 'open', until: ((open[1] % DAY) + DAY) % DAY, soon: open[1] - m <= SOON_MIN };
  }
  const next = sp.find(([a]) => a > m);
  if (!next) return { k: 'unknown' };
  const today = Math.floor(m / DAY) * DAY;
  const off = !sp.some(([a]) => a >= today && a < today + DAY);
  const nd = Math.floor(next[0] / DAY);
  return { k: 'closed', from: ((next[0] % DAY) + DAY) % DAY, inDays: nd - today / DAY, day: ((nd % 7) + 7) % 7, off };
}

/** Whether it opens at some time on weekday `d` (0 Sunday) in its own zone: a period starting that day, or a run of
 *  24 hours or more over it. Unknown hours: false. */
export function opensOn(hours: readonly Period[] | null, d: number): boolean {
  if (!hours) return false;
  return hours.some((p) => p.d === d || (p.c - p.o >= DAY && (d - p.d + 7) % 7 <= Math.floor((p.c - 1) / DAY)));
}

/** The weekday (0 Sunday) at `at` in `tz`. */
export const dayIn = (at: number, tz: string): number => Math.floor(weekMin(at, tz) / DAY);

/** 'H:MM' (a minute of the day; 24:00 as 0:00 the next day, said by the caller). */
export const hm = (min: number): string => `${Math.floor(min / 60) % 24}:${String(min % 60).padStart(2, '0')}`;

/** The week view's day rows, 月 to 日: each day's periods as 'H:MM–H:MM' (past midnight 翌H:MM; a whole day 24時間),
 *  [] for a day it doesn't open. */
export function weekRows(hours: readonly Period[]): { d: number; spans: string[] }[] {
  const by = new Map<number, string[]>();
  const add = (d: number, s: string) => by.set(d, [...(by.get(d) ?? []), s]);
  for (const p of [...hours].sort((a, b) => a.d - b.d || a.o - b.o)) {
    if (p.o === 0 && p.c - p.o >= DAY) {
      for (let k = 0; k < Math.floor((p.c - p.o) / DAY); k++) add((p.d + k) % 7, '24時間');
      continue;
    }
    add(p.d, `${hm(p.o)}–${p.c > DAY ? `翌${hm(p.c - DAY)}` : hm(p.c)}`);
  }
  return [1, 2, 3, 4, 5, 6, 0].map((d) => ({ d, spans: [...new Set(by.get(d) ?? [])] }));
}
