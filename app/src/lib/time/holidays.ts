// The dated days of the island's year on the Tokyo calendar (docs/design.md "Event music", "Halloween", "Holiday hosts",
// "Fireworks", "Wedding countdown"): NH's events and our own. Pure date rules, one table shared by the island
// (components/island/events.ts, fireworks.ts, wedding.ts) and its music and jingles (sound/events.ts, sound/radio.ts),
// so a date is never worked out twice. Every NH rule verified on Nookipedia:
//   Halloween Oct 31 (Jack 17:00–24:00) · Turkey Day the fourth Thursday of November (Franklin 09:00–24:00) ·
//   Toy Day Dec 24 (all day) · Bunny Day Easter Sunday (all day) · Festivale the Monday before Ash Wednesday, 48 days
//   before Easter (all day: 2026-02-16, 2027-02-08) · the countdown Dec 31 from 23:00 · the Fireworks Show every
//   Sunday in August 19:00–24:00.
import { addDays, daysBetween, easter, nthWeekday } from './dates.ts';

export type Holiday = 'halloween' | 'turkey-day' | 'toy-day' | 'bunny-day' | 'festivale' | 'countdown';

interface Day {
  /** Whether a Tokyo date (YYYY-MM-DD) is its day. */
  on: (date: string) => boolean;
  /** The hour (Tokyo) its main part starts: the evening, a host's arrival, NH's day (05:00) for an all-day one. It
   *  runs to midnight. */
  from: number;
}

const yearOf = (date: string): number => Number(date.slice(0, 4));
/** A fixed day every year, 'MM-DD'. */
const fixedDay = (md: string) => (date: string): boolean => date.slice(5) === md;

/** Days from that year's Easter Sunday (negative: before). */
export const fromEaster = (date: string): number => daysBetween(easter(yearOf(date)), date);
/** Turkey Day: the fourth Thursday of November. */
export const turkeyDay = (year: number): string => nthWeekday(year, 11, 4, 4);
/** Festivale: the Monday before Ash Wednesday (Easter − 46), so Easter − 48. */
export const festivale = (year: number): string => addDays(easter(year), -48);

/** NH's all-day events start with its day, at 05:00. */
const NH_DAY = 5;

export const HOLIDAYS: Record<Holiday, Day> = {
  halloween: { on: fixedDay('10-31'), from: 17 },
  'turkey-day': { on: (d) => d === turkeyDay(yearOf(d)), from: 9 },
  'toy-day': { on: fixedDay('12-24'), from: NH_DAY },
  'bunny-day': { on: (d) => fromEaster(d) === 0, from: NH_DAY },
  festivale: { on: (d) => d === festivale(yearOf(d)), from: NH_DAY },
  countdown: { on: fixedDay('12-31'), from: 23 }
};

/** The holiday on a Tokyo date, or null (no two fall on one date). */
export const holidayOn = (date: string): Holiday | null => (Object.keys(HOLIDAYS) as Holiday[]).find((k) => HOLIDAYS[k].on(date)) ?? null;

/** Our wedding day (Tokyo). */
export const WEDDING = '2027-10-08';

export type Show = 'show' | 'countdown';
/** NH's Fireworks Show: Sundays in August, 19:00–24:00. */
export const FIREWORKS_SHOW = { month: 8, weekday: 0, from: 19 } as const;

/** The fireworks on at this Tokyo moment: NH's August Sundays 19:00–24:00, and New Year's (Dec 31 from 23:00 the
 *  countdown, sparser; Jan 1 00:00–01:00 the show). */
export function showAt(month: number, day: number, weekday: number, hour: number): Show | null {
  if (month === FIREWORKS_SHOW.month && weekday === FIREWORKS_SHOW.weekday && hour >= FIREWORKS_SHOW.from) return 'show';
  if (month === 12 && day === 31 && hour === 23) return 'countdown';
  if (month === 1 && day === 1 && hour === 0) return 'show';
  return null;
}
