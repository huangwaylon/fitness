// Weather days (docs/design.md "Weather"), after NH: most days are fine; about one in six it rains (lightly all day,
// a downpour, a wet morning, or hours of heavy rain that clear late in the afternoon and leave a rainbow 16:00–17:00,
// one in eight a double one); in NH's winter (December to February) the wet days snow instead. Rare extras on fine
// days: heavy fog at 07:00 on autumn-to-spring mornings (October to March) and the aurora on winter nights, never on
// a meteor shower's night. A weather day runs 05:00 → 05:00 (NH's day), seeded by its date (beach.ts dayRand), so
// both phones agree. Tokyo's real sky (realWeatherAt: the relay's timeline, live-protocol.ts Wx) takes its place in
// the `real` mode while the phone has a timeline that covers the hour; the seeded one is the fallback and the `game`
// mode. Pure; the island's state is weatherNow.svelte.ts. Nothing here pays: no ベル.
import { weighted } from '#lib/random.ts';
import type { Wx, WxSky } from '#lib/contract/live-protocol.ts';
import { ISLAND_SEED, dayRand } from './daySeed.ts';
import { showAt } from './fireworks.ts';
import { showerAt } from './meteor.ts';
import { gameWet, showerNight } from '#lib/contract/wet.ts';
import { FIREWORKS_FROM, weddingDay } from './wedding.ts';
import { addDays } from '#lib/time/dates.ts';

/** The sky at an hour: fine, cloudy (NH's 曇り: fine for the game's rules, only its look differs; the real weather's),
 *  rain, a downpour, snow. */
export type Sky = 'clear' | 'cloudy' | 'rain' | 'heavy' | 'snow';
/** A grey sky's darkening: a colour multiplied in at an opacity (Weather's ground plane and IslandScene's sprite tint);
 *  cloudy at about half a wet day's. */
export const WET: Record<Exclude<Sky, 'clear'>, readonly [string, number]> = { cloudy: ['#C6CDD8', 0.3], rain: ['#AEB8C8', 0.55], heavy: ['#97A2B4', 0.65], snow: ['#DCE2EA', 0.5] };
/** Rain falling (the ground wet: the rain-only critters, the footsteps' splash, no fireflies). */
export const isRain = (sky: Sky): boolean => sky === 'rain' || sky === 'heavy';
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

/** A day's seeded treats, whatever its sky: the 07:00 fog (October–March), the aurora (a winter night, not a meteor
 *  shower's) and a double rainbow; the seeded day has them on a fine day (the double on its `clears` day), the real
 *  weather on a real clear hour (a rainbow: after real rain). */
function dayDraw(date: string, seed: string): { pattern: Pattern; fog: boolean; aurora: boolean; double: boolean } {
  const r = dayRand(date, 'weather', seed);
  const month = Number(date.slice(5, 7));
  const winter = winterMonth(month);
  r(); // (the wet draw: contract/wet.ts gameWet, the record's rain)
  const kind = weighted<Pattern>(winter ? SNOW_PATTERNS : RAIN_PATTERNS, r);
  const fogRoll = r(), auroraRoll = r(), doubleRoll = r();
  return {
    pattern: gameWet(date, seed) ? kind : 'clear',
    fog: (month >= 10 || month <= 3) && fogRoll < FOG_ODDS,
    aurora: winter && !showerNight(date, seed) && auroraRoll < AURORA_ODDS,
    double: doubleRoll < DOUBLE_ODDS
  };
}

/** The weather of the day that starts at 05:00 on `date` (YYYY-MM-DD, Tokyo). */
export function dayWeather(date: string, seed = ISLAND_SEED): DayWeather {
  const d = dayDraw(date, seed);
  return { pattern: d.pattern, fog: d.pattern === 'clear' && d.fog, aurora: d.pattern === 'clear' && d.aurora, double: d.pattern === 'clears' && d.double };
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
export const FORCED = ['clear', 'cloudy', 'rain', 'heavy', 'snow', 'fog', 'aurora', 'rainbow'] as const;
export type Forced = (typeof FORCED)[number];

/** The weather at a Tokyo date and hour. `force`: the dev hook, any hour. */
export function weatherAt(date: string, hour: number, seed = ISLAND_SEED, force: Forced | null = null): WeatherNow {
  if (force) {
    const sky: Sky = force === 'cloudy' || force === 'rain' || force === 'heavy' || force === 'snow' ? force : 'clear';
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

// ---------- Tokyo's real sky (the relay's timeline: docs/design.md "Weather") ----------

const HOUR_MS = 3600_000;
const TOKYO_MS = 9 * HOUR_MS;
/** A timeline serves while it was fetched at most this long ago (the relay's weather.ts STALE_MS) and covers the hour. */
export const WX_TTL_MS = 36 * HOUR_MS;
/** The timeline's letters as the game's skies. */
const LETTER: Record<WxSky, Sky> = { c: 'clear', o: 'cloudy', r: 'rain', h: 'heavy', s: 'snow' };
/** A rainbow comes in the first fine hour of these after rain (NH: by day), once a day. */
const RAINBOW_HOURS = [7, 17] as const;

/** Snow on the ground (ui-state/season.ts: December 11 – February 24): what falls from the sky then is snow (NH). */
export function snowSeason(date: string): boolean {
  const md = Number(date.slice(5, 7)) * 100 + Number(date.slice(8, 10));
  return md >= 1211 || md < 225;
}

/** The hours held fine whatever Tokyo is doing (NH's promise): the fireworks (August Sundays 19:00–24:00, New Year's
 *  23:00–01:00), a meteor shower's night (20:00–04:00) and our wedding night (from its fireworks, 19:00). The days
 *  around them are real. */
export function heldFine(date: string, hour: number, seed = ISLAND_SEED): boolean {
  const [y, m, d] = date.split('-').map(Number);
  const weekday = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  return showAt(m, d, weekday, hour) !== null || showerAt(date, addDays(date, -1), hour, seed) || (weddingDay(date) && hour >= FIREWORKS_FROM);
}

/** An absolute hour (hours since the epoch) as Tokyo's date and hour. */
function tokyoHour(h: number): { date: string; hour: number } {
  const d = new Date(h * HOUR_MS + TOKYO_MS);
  return { date: d.toISOString().slice(0, 10), hour: d.getUTCHours() };
}

/** The game's sky of absolute hour `h` by a timeline (snow in the snowy season, fine on the held nights), or null when
 *  it doesn't cover it. */
function realSkyAt(wx: Wx, h: number, seed: string): { sky: Sky; fog: boolean } | null {
  const i = h - wx.h0;
  if (i < 0 || i >= wx.s.length) return null;
  const { date, hour } = tokyoHour(h);
  if (heldFine(date, hour, seed)) return { sky: 'clear', fog: false };
  const sky = LETTER[wx.s[i] as WxSky];
  return { sky: (sky === 'rain' || sky === 'heavy') && snowSeason(date) ? 'snow' : sky, fog: wx.fx?.includes(i) ?? false };
}

/**
 * Tokyo's weather at `now` (ms) by a timeline, or null when it doesn't serve (fetched over 36 hours ago, or not
 * covering the hour): then the seeded day's. Each hour comes whole from one or the other. The seeded treats stay: the
 * 07:00 fog and the aurora on a real clear hour; real fog any hour.
 */
export function realWeatherAt(wx: Wx | null, now: number, seed = ISLAND_SEED): WeatherNow | null {
  if (!wx || now - wx.at > WX_TTL_MS || now < wx.at - WX_TTL_MS) return null;
  const h = Math.floor(now / HOUR_MS);
  const here = realSkyAt(wx, h, seed);
  if (!here) return null;
  const { date, hour } = tokyoHour(h);
  const t = dayDraw(hour < DAY_START ? addDays(date, -1) : date, seed);
  const fine = here.sky === 'clear';
  return {
    sky: here.sky,
    fog: here.fog || (fine && t.fog && hour === FOG_HOUR),
    rainbow: rainbowAt(wx, h, seed) ? (t.double ? 2 : 1) : 0,
    aurora: fine && t.aurora && (hour >= 19 || hour < 4)
  };
}

/** Whether absolute hour `h` brings the day's rainbow: the first fine hour 07:00–17:00 right after rain (a downpour or
 *  rain: the snowy season's falls as snow, and leaves none), by the timeline's hours (its past ones: the relay keeps
 *  12). */
function rainbowAt(wx: Wx, h: number, seed: string): boolean {
  const { hour } = tokyoHour(h);
  if (hour < RAINBOW_HOURS[0] || hour >= RAINBOW_HOURS[1]) return false;
  const bow = (k: number) => realSkyAt(wx, k, seed)?.sky === 'clear' && isRain(realSkyAt(wx, k - 1, seed)?.sky ?? 'clear');
  for (let k = h - (hour - RAINBOW_HOURS[0]); k < h; k++) if (bow(k)) return false;
  return bow(h);
}

/** The music's arrangement and the ambience's rain for a sky (sound/hourly.ts Weather). */
export const musicWeather = (sky: Sky): 'sunny' | 'rain' | 'snow' => (isRain(sky) ? 'rain' : sky === 'snow' ? 'snow' : 'sunny');

/** The sky the critters come by at `ms` (yieldSky's, for any instant): the dev hook's, else Tokyo's real one in `real`
 *  mode while the timeline serves, else the seeded day's. A shared critter's species is picked by the sky at its slot's
 *  start, so both phones pick the same one across a change of weather (each phone's live sky turned at its own minute). */
export function yieldSkyAt(ms: number, seed: string, real: boolean, wx: Wx | null, dev: Forced | null = null): Sky {
  const t = new Date(ms + TOKYO_MS), date = t.toISOString().slice(0, 10), hour = t.getUTCHours();
  if (dev) return weatherAt(date, hour, seed, dev).sky;
  return ((real ? realWeatherAt(wx, ms, seed) : null) ?? weatherAt(date, hour, seed)).sky;
}
