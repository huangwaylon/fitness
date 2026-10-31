// Weather days (docs/design.md "Weather"), after NH: most days are fine; about one in six it rains (lightly all day,
// a downpour, a wet morning, or hours of heavy rain that clear late in the afternoon and leave a rainbow 16:00–17:00,
// one in eight a double one); in NH's winter (December to February) the wet days snow instead. Rare extras on fine
// days: heavy fog at 07:00 on autumn-to-spring mornings (October to March) and the aurora on winter nights, never on
// a meteor shower's night. A weather day runs 05:00 → 05:00 (NH's day), seeded by its date (beach.ts dayRand), so
// both phones agree. Pure; the island's state is weatherNow.svelte.ts. Nothing here pays: no ベル.
import { ISLAND_SEED, dayRand, weighted } from './beach.ts';
import { showerNight } from './meteor.ts';
import { addDays } from '#lib/time/dates.ts';

/** The sky at an hour: fine, rain, a downpour, snow. */
export type Sky = 'clear' | 'rain' | 'heavy' | 'snow';
/** A day's weather: fine all day; rain all day (light or heavy); rain until noon; heavy rain until 16:00, then clear
 *  (the rainbow's day); snow all day (light or heavy). */
export type Pattern = 'clear' | 'rain' | 'heavy' | 'am-rain' | 'clears' | 'snow' | 'heavy-snow';

export interface DayWeather {
  pattern: Pattern;
  /** Heavy fog at 07:00 (fine mornings, October–March). */
  fog: boolean;
  /** The aurora tonight (fine winter nights, not a meteor shower's). */
  aurora: boolean;
  /** The rainbow is double (a `clears` day). */
  double: boolean;
}

export interface WeatherNow {
  sky: Sky;
  /** Heavy fog this hour. */
  fog: boolean;
  /** A rainbow this hour: 0 none, 1, or 2 (double). */
  rainbow: 0 | 1 | 2;
  /** The aurora this hour. */
  aurora: boolean;
}

/** About one day in six is wet; in winter about one in four (NH's snowy season). */
const WET_ODDS = 1 / 6;
const WINTER_WET_ODDS = 1 / 4;
const RAIN_PATTERNS = [['rain', 4], ['heavy', 2], ['am-rain', 2], ['clears', 2]] as const;
const SNOW_PATTERNS = [['snow', 7], ['heavy-snow', 3]] as const;
const FOG_ODDS = 1 / 8;
const AURORA_ODDS = 1 / 10;
const DOUBLE_ODDS = 1 / 8;
/** The weather day starts at NH's 05:00. */
export const DAY_START = 5;
/** The rainbow's hour and the fog's (NH). */
const RAINBOW_HOUR = 16;
const FOG_HOUR = 7;
const winterMonth = (m: number) => m === 12 || m <= 2;

/** Days that are always fine: NH's fireworks (August Sundays, New Year's Eve and Day) and meteor showers. */
function alwaysFine(date: string, seed: string): boolean {
  const [y, m, d] = date.split('-').map(Number);
  const weekday = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  return (m === 8 && weekday === 0) || (m === 12 && d === 31) || (m === 1 && d === 1) || showerNight(date, seed);
}

/** The weather of the day that starts at 05:00 on `date` (YYYY-MM-DD, Tokyo). */
export function dayWeather(date: string, seed = ISLAND_SEED): DayWeather {
  const r = dayRand(date, 'weather', seed);
  const month = Number(date.slice(5, 7));
  const winter = winterMonth(month);
  const wet = r() < (winter ? WINTER_WET_ODDS : WET_ODDS);
  const kind = weighted<Pattern>(winter ? SNOW_PATTERNS : RAIN_PATTERNS, r);
  const fogRoll = r(), auroraRoll = r(), doubleRoll = r();
  const pattern: Pattern = wet && !alwaysFine(date, seed) ? kind : 'clear';
  return {
    pattern,
    fog: pattern === 'clear' && (month >= 10 || month <= 3) && fogRoll < FOG_ODDS,
    aurora: pattern === 'clear' && winter && !showerNight(date, seed) && auroraRoll < AURORA_ODDS,
    double: pattern === 'clears' && doubleRoll < DOUBLE_ODDS
  };
}

/** The sky of a pattern at an hour of its day (0–23; before 05:00 belongs to the day before). */
export function skyOf(p: Pattern, hour: number): Sky {
  if (p === 'rain' || p === 'snow') return p;
  if (p === 'heavy') return 'heavy';
  if (p === 'heavy-snow') return 'snow';
  if (p === 'am-rain') return hour >= DAY_START && hour < 12 ? 'rain' : 'clear';
  if (p === 'clears') return hour >= DAY_START && hour < RAINBOW_HOUR ? 'heavy' : 'clear';
  return 'clear';
}

/** Forced weathers (`?weather=`, dev or `?demo`). */
export const FORCED = ['clear', 'rain', 'heavy', 'snow', 'fog', 'aurora', 'rainbow'] as const;
export type Forced = (typeof FORCED)[number];

/** The weather at a Tokyo date and hour. `force`: the dev hook, any hour. */
export function weatherAt(date: string, hour: number, seed = ISLAND_SEED, force: Forced | null = null): WeatherNow {
  if (force) {
    const sky: Sky = force === 'rain' || force === 'heavy' || force === 'snow' ? force : 'clear';
    return { sky, fog: force === 'fog', rainbow: force === 'rainbow' ? 1 : 0, aurora: force === 'aurora' };
  }
  const day = hour < DAY_START ? addDays(date, -1) : date;
  const w = dayWeather(day, seed);
  const sky = skyOf(w.pattern, hour);
  const night = hour >= 19 || hour < 4;
  return {
    sky,
    fog: w.fog && hour === FOG_HOUR,
    rainbow: w.pattern === 'clears' && hour === RAINBOW_HOUR ? (w.double ? 2 : 1) : 0,
    aurora: w.aurora && night && sky === 'clear'
  };
}

/** The music's arrangement and the ambience's rain for a sky (sound/hourly.ts Weather). */
export const musicWeather = (sky: Sky): 'sunny' | 'rain' | 'snow' => (sky === 'clear' ? 'sunny' : sky === 'snow' ? 'snow' : 'rain');
