// Meteor showers (docs/design.md "Celeste and meteor showers"), after NH: now and then a night brings a meteor shower,
// at most one a week, and Celeste comes to watch it (20:00–04:00). Shooting stars cross every 3–8 s instead of in a
// shower every few minutes (stars.ts); each wish is a fragment as any night, the season's zodiac one likelier. Pure
// and seeded by the week (beach.ts dayRand), so both phones agree. No ベル.
import { ISLAND_SEED, dayRand } from './daySeed.ts';
import { addDays, weekKeyOf } from '#lib/time/dates.ts';

/** About one night in ten (NH: Celeste at most once a week): a week has a shower with this chance, on one of its seven
 *  nights (7 × 1/10). */
const SHOWER_WEEK_ODDS = 0.7;
/** Celeste's hours (NH: 19:00–04:00 in the game's evening; here from 20:00, when the night sky is full). */
const CELESTE = { from: 20, to: 4 } as const;
/** The gap between shooting stars on a shower night (ms; a clear night has its showers instead: stars.ts). */
export const SHOWER_GAP: readonly [number, number] = [3_000, 8_000];

/** The night (by its evening's date) of the week's shower, or null when the week has none. */
function showerOfWeek(monday: string, seed: string): string | null {
  const r = dayRand(monday, 'meteor-week', seed);
  if (r() >= SHOWER_WEEK_ODDS) return null;
  return addDays(monday, Math.floor(r() * 7));
}

/** Whether the night that starts on the evening of `date` brings a meteor shower. */
export const showerNight = (date: string, seed = ISLAND_SEED): boolean => showerOfWeek(weekKeyOf(date), seed) === date;

/** Whether a meteor shower is on at this Tokyo hour (the evening's date, or the day before after midnight). `force`:
 *  the seasonal preview's, any hour. */
export function showerAt(date: string, prevDate: string, hour: number, seed = ISLAND_SEED, force = false): boolean {
  if (force) return true;
  if (hour >= CELESTE.from) return showerNight(date, seed);
  if (hour < CELESTE.to) return showerNight(prevDate, seed);
  return false;
}

/** The ms until the next shooting star on a shower night. */
export const nextStarMs = (r: () => number = Math.random): number => SHOWER_GAP[0] + r() * (SHOWER_GAP[1] - SHOWER_GAP[0]);
