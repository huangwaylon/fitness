// Wet days (docs/farming.md "Rules"): a Tokyo day with an hour of rain or snow waters every plant on the field. The
// record keeps one `wet` row a wet day, its own (relay/src/store.ts wetTick, from the room's weather cron): in the
// `real` mode a day the relay's timeline had a wet hour of (wxWetDays), in the `game` mode a seeded wet day (gameWet:
// the island's seeded weather, world/weather.ts dayWeather, draws its wet days by this). Here too the
// island's seed and the week's meteor shower (a shower's night is always fine), since the record needs them. Pure.
import { seeded } from '../random.ts';
import type { Wx } from './live-protocol.ts';
import { addDays, dayNum, localDateAt } from './tokyo.ts';
import type { LocalDate } from '../types.ts';

/** The island's own seed (`?seed=` in the demo varies it: world/devHooks.ts). */
export const ISLAND_SEED = 'island-fund';

/** A seeded PRNG for one stream of one day. */
export const dayRand = (date: string, stream: string, seed = ISLAND_SEED): (() => number) => seeded(`${seed}|${date}|${stream}`);

/** Monday of `date`'s week (1970-01-01 was a Thursday). */
const mondayOf = (date: string): LocalDate => addDays(date, -((dayNum(date) + 3) % 7));

/** About one night in ten (NH: Celeste at most once a week): a week has a shower with this chance, on one of its seven
 *  nights (7 × 1/10). */
const SHOWER_WEEK_ODDS = 0.7;

/** Whether the night that starts on the evening of `date` brings a meteor shower (world/meteor.ts). */
export function showerNight(date: string, seed = ISLAND_SEED): boolean {
  const monday = mondayOf(date);
  const r = dayRand(monday, 'meteor-week', seed);
  return r() < SHOWER_WEEK_ODDS && addDays(monday, Math.floor(r() * 7)) === date;
}

/** About one day in six is wet; in winter (December to February) about one in four (NH's snowy season). */
const WET_ODDS = 1 / 6;
const WINTER_WET_ODDS = 1 / 4;

/** Days that are always fine: NH's fireworks (August Sundays, New Year's Eve and Day) and meteor showers. */
function alwaysFine(date: string, seed: string): boolean {
  const m = Number(date.slice(5, 7)), d = Number(date.slice(8, 10));
  const sunday = (dayNum(date) + 4) % 7 === 0;
  return (m === 8 && sunday) || (m === 12 && d === 31) || (m === 1 && d === 1) || showerNight(date, seed);
}

/** Whether the seeded weather day of `date` is wet: the first draw of its `weather` stream (dayWeather draws the rest). */
export function gameWet(date: string, seed = ISLAND_SEED): boolean {
  const m = Number(date.slice(5, 7));
  return dayRand(date, 'weather', seed)() < (m === 12 || m <= 2 ? WINTER_WET_ODDS : WET_ODDS) && !alwaysFine(date, seed);
}

/** The Tokyo days a real timeline had a wet hour of (rain, a downpour, snow) that has started by `now`. */
export function wxWetDays(wx: Pick<Wx, 'h0' | 's'> | null, now: number): LocalDate[] {
  const out = new Set<LocalDate>();
  if (wx) for (let i = 0; i < wx.s.length; i++) {
    const t = (wx.h0 + i) * 3600_000;
    if (t <= now && 'rhs'.includes(wx.s[i])) out.add(localDateAt(t));
  }
  return [...out];
}
