// Meteor showers (docs/design.md "Celeste and meteor showers"), after NH: now and then a night brings a meteor shower,
// at most one a week, and Celeste comes to watch it (20:00–04:00). Shooting stars cross every 3–8 s instead of every
// 15–40 s; a wish that night brings more star fragments the next morning (4–5, the season's zodiac one likelier). Pure
// and seeded by the week (beach.ts dayRand), so both phones agree. No ベル.
import { ISLAND_SEED, dayRand } from './beach.ts';
import { addDays, weekKeyOf } from '#lib/time/dates.ts';

/** About one night in ten (NH: Celeste at most once a week): a week has a shower with this chance, on one of its seven
 *  nights (7 × 1/10). */
const SHOWER_WEEK_ODDS = 0.7;
/** Celeste's hours (NH: 19:00–04:00 in the game's evening; here from 20:00, when the night sky is full). */
const CELESTE = { from: 20, to: 4 } as const;
/** The gap between shooting stars (ms): a shower night, and a clear night otherwise. */
export const SHOWER_GAP: readonly [number, number] = [3_000, 8_000];
export const CLEAR_GAP: readonly [number, number] = [15_000, 40_000];

/** The night (by its evening's date) of the week's shower, or null when the week has none. */
function showerOfWeek(monday: string, seed: string): string | null {
  const r = dayRand(monday, 'meteor-week', seed);
  if (r() >= SHOWER_WEEK_ODDS) return null;
  return addDays(monday, Math.floor(r() * 7));
}

/** Whether the night that starts on the evening of `date` brings a meteor shower. */
export const showerNight = (date: string, seed = ISLAND_SEED): boolean => showerOfWeek(weekKeyOf(date), seed) === date;

/** Whether a meteor shower is on at this Tokyo hour (the evening's date, or the day before after midnight). `force`:
 *  the dev hook. */
export function showerAt(date: string, prevDate: string, hour: number, seed = ISLAND_SEED, force = false): boolean {
  if (hour >= CELESTE.from) return force || showerNight(date, seed);
  if (hour < CELESTE.to) return force || showerNight(prevDate, seed);
  return false;
}

/** The ms until the next shooting star (a shower night, or a clear one). */
export const nextStarMs = (shower: boolean, r: () => number = Math.random): number => {
  const [a, b] = shower ? SHOWER_GAP : CLEAR_GAP;
  return a + r() * (b - a);
};
