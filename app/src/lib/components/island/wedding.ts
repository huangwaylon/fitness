// The wedding countdown (docs/design.md "Wedding countdown"): our wedding is on 2027-10-08 (Tokyo). On the milestone days
// before it (365, 200, 100, 50, 30, 7 and 1 days to go, and the day itself) Reese and Cyrus, NH's wedding couple, visit
// the centre stage with a heart float and count down: 「けっこんしき まで あと 100日！」. On the day: confetti, fireworks at
// night and both villagers in a wedding pose. Every June Sunday (NH's Wedding Season) a wedding arch stands behind the
// centre stage. Pure (dates only). No ベル.
import { daysBetween } from '#lib/time/dates.ts';
import { addDays } from '#lib/time/dates.ts';
import { WEDDING } from '#lib/time/holidays.ts';

/** Our wedding day (Tokyo): time/holidays.ts's (shared with the music). */
export { WEDDING };
/** The days to go on which Reese and Cyrus come (0: the day itself). */
export const MILESTONES: readonly number[] = [365, 200, 100, 50, 30, 7, 1, 0];
/** Their hours on a milestone day (they come for the day). */
const COUPLE_HOURS = { from: 6, to: 24 } as const;
/** The wedding night's fireworks, from this hour. */
export const FIREWORKS_FROM = 19;

/** Whole days from `date` to the wedding (negative after it). */
export const daysUntil = (date: string, wedding = WEDDING): number => daysBetween(date, wedding);

/** The milestone on `date` (days to go), or null. */
export function milestoneOn(date: string, wedding = WEDDING): number | null {
  const n = daysUntil(date, wedding);
  return MILESTONES.includes(n) ? n : null;
}

/** Whether Reese and Cyrus are on the island at this Tokyo hour (a milestone day, 06:00–24:00). */
export const coupleAt = (date: string, hour: number, wedding = WEDDING): boolean =>
  milestoneOn(date, wedding) !== null && hour >= COUPLE_HOURS.from && hour < COUPLE_HOURS.to;

/** The wedding day itself. */
export const weddingDay = (date: string, wedding = WEDDING): boolean => date === wedding;

/** NH's Wedding Season: the arch stands on every June Sunday (`weekday` 0 = Sunday). */
export const archOn = (date: string, weekday: number): boolean => date.slice(5, 7) === '06' && weekday === 0;

/** The milestone dates still to come from `date` (for the docs and tests). */
export const milestoneDates = (wedding = WEDDING): string[] => MILESTONES.map((n) => addDays(wedding, -n));
