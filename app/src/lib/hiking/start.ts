// A hike's start time moved (docs/hiking.md "Start time"; the record's `hike_start`, contract/hikeStart.ts): the plan's
// stops, the summit's stay and the finish shifted by the same minutes (a shift, never the course times again), a stop
// past midnight the next day's; the finish against the plan's sunset; hike mode's start and finish as instants. Pure.
import type { Plan, Trail } from './types.ts';

/** 'H:MM' (or 'HH:MM') → minutes after midnight. */
export const toMin = (s: string): number => {
  const [h, m] = s.split(':').map(Number);
  return h * 60 + m;
};
const pad = (n: number) => String(n).padStart(2, '0');
/** Minutes (any day's) → the clock's 'H:MM'. */
export const fmtHm = (min: number): string => {
  const x = ((min % 1440) + 1440) % 1440;
  return `${Math.floor(x / 60)}:${pad(x % 60)}`;
};
/** 'H:MM' → <input type="time">'s 'HH:MM'. */
export const inputHm = (s: string): string => {
  const x = toMin(s);
  return `${pad(Math.floor(x / 60))}:${pad(x % 60)}`;
};

type Stop = Plan['itinerary'][number];
/** A stop as shifted: its times (a stay's end too) on the clock, `day` 1 once past midnight. */
type ShiftedStop = Stop & { day: number };

export interface Shifted {
  stops: ShiftedStop[];
  /** The plan's own start, and the one in force (its own when not moved). */
  from: string;
  start: string;
  moved: boolean;
  /** The start and the finish, minutes after the plan day's midnight (the finish past 1440: the next day). */
  startMin: number;
  endMin: number;
  /** The finish after the plan's sunset. */
  late: boolean;
}

/** The plan with its start at `hm` (null: its own). The plan's times as minutes from its day's midnight, each at or after
 *  the one before (a stop past midnight the next day's), all moved by the start's difference. */
export function shiftPlan(plan: Plan, hm: string | null): Shifted {
  let prev = 0;
  const abs = (s: string): number => {
    let m = toMin(s);
    while (m < prev) m += 1440;
    return (prev = m);
  };
  const raw = plan.itinerary.map((s) => ({ s, t: abs(s.time), d: s.depart ? abs(s.depart) : null }));
  const from = plan.itinerary[0].time;
  const delta = hm === null ? 0 : toMin(hm) - raw[0].t;
  const stops = raw.map(({ s, t, d }) => ({ ...s, time: fmtHm(t + delta), ...(d !== null ? { depart: fmtHm(d + delta) } : {}), day: Math.floor((t + delta) / 1440) }));
  const startMin = raw[0].t + delta, endMin = raw.at(-1)!.t + delta;
  return { stops, from, start: fmtHm(startMin), moved: delta !== 0, startMin, endMin, late: endMin > toMin(plan.sunset) };
}

/** An instant: `min` minutes after `date`'s midnight in Tokyo (the plans' and the phones' zone). */
const at = (date: string, min: number): number => Date.parse(`${date}T00:00:00+09:00`) + min * 60_000;

/** A registered hike's 'h:mm' time as minutes, or null. */
const durOf = (time: string | undefined): number | null => {
  const m = time ? /^(\d+) h(?: (\d+) min)?$|^(\d+) min$/.exec(time) : null;
  return m ? (+(m[1] ?? 0)) * 60 + +(m[2] ?? m[3] ?? 0) : null;
};

/** A trail's day as hike mode reads it: the start and the finish (epoch ms), the sunset (a plan's); null without a day
 *  and a start (a registered hike's own start, its finish from its time: Trail.time, user.ts guideTime). */
export interface Schedule { start: number; end: number | null; sunset: number | null }
export function scheduleOf(t: Pick<Trail, 'plan' | 'user' | 'time'>, hm: string | null): Schedule | null {
  if (t.plan) {
    const s = shiftPlan(t.plan, hm), d = t.plan.dateISO;
    return { start: at(d, s.startMin), end: at(d, s.endMin), sunset: at(d, toMin(t.plan.sunset)) };
  }
  if (!t.user?.date || hm === null) return null;
  const dur = durOf(t.time);
  return { start: at(t.user.date, toMin(hm)), end: dur === null ? null : at(t.user.date, toMin(hm) + dur), sunset: null };
}

/** A registered hike's finish 'H:MM' from its start and its time (Trail.time), or null. */
export const userEnd = (hm: string, time: string): string | null => {
  const dur = durOf(time);
  return dur === null ? null : fmtHm(toMin(hm) + dur);
};
