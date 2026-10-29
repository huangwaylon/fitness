// Season / foliage / time-of-day derivation (pure; theme.svelte.ts applies it to <html>).
// NH northern-hemisphere calendar (the couple lives in Tokyo):
//   season (ground, palette, flowers): winter = snow on the ground Dec 11 – Feb 24, spring Feb 25 – May 31,
//     summer Jun 1 – Sep 15, autumn Sep 16 – Dec 10.
//   foliage (the oaks): cherry blossom only Apr 1–10, green leaves Feb 25 – Oct 15 otherwise,
//     red-orange fall leaves Oct 16 – Dec 10 (maple week Nov 16–25 is the peak), snow Dec 11 – Feb 24.
//   time of day: always the clock, never OS dark mode: dawn 05–07, day 07–16, dusk 16–19, night 19–05.
//     It drives both the scene sky and the chrome (v5 §5: the sky sets the theme; prefers-color-scheme is ignored).
export type Season = 'spring' | 'summer' | 'autumn' | 'winter';
export type TimeOfDay = 'dawn' | 'day' | 'dusk' | 'night';
export type Foliage = 'blossom' | 'green' | 'fall' | 'snow';

export const SEASONS: Season[] = ['spring', 'summer', 'autumn', 'winter'];

/** Month-day as a sortable number (Apr 3 → 403). */
const md = (d: Date) => (d.getMonth() + 1) * 100 + d.getDate();

export function seasonFor(d: Date): Season {
  const x = md(d);
  if (x >= 1211 || x < 225) return 'winter';
  if (x < 601) return 'spring';
  if (x < 916) return 'summer';
  return 'autumn';
}

export function foliageFor(d: Date): Foliage {
  const x = md(d);
  if (x >= 1211 || x < 225) return 'snow';
  if (x >= 401 && x <= 410) return 'blossom';
  if (x >= 1016) return 'fall';
  return 'green';
}

/** A forced `?season=` previews that season's signature look. */
export function defaultFoliage(s: Season): Foliage {
  return s === 'spring' ? 'blossom' : s === 'summer' ? 'green' : s === 'autumn' ? 'fall' : 'snow';
}

export function todFor(d: Date): TimeOfDay {
  const h = d.getHours();
  if (h >= 19 || h < 5) return 'night';
  if (h < 7) return 'dawn';
  if (h >= 16) return 'dusk';
  return 'day';
}

export interface ThemeInput {
  /** `?theme=` preview (this load only). */
  theme?: 'night' | 'day' | null;
  /** `?season=` preview (this load only). */
  season?: Season | null;
}
export interface ThemeState {
  /** Night chrome (= tod is night). */
  night: boolean;
  season: Season;
  foliage: Foliage;
  /** Scene sky. */
  tod: TimeOfDay;
}

export function deriveTheme(d: Date, o: ThemeInput = {}): ThemeState {
  const clockTod = todFor(d);
  const tod: TimeOfDay = o.theme === 'night' ? 'night' : o.theme === 'day' ? (clockTod === 'night' ? 'day' : clockTod) : clockTod;
  const night = tod === 'night';
  const season = o.season ?? seasonFor(d);
  const foliage = o.season ? defaultFoliage(o.season) : foliageFor(d);
  return { night, season, foliage, tod };
}

/** Read the preview params from a query string (never persisted). */
export function previewParams(search: string): Pick<ThemeInput, 'theme' | 'season'> {
  const q = new URLSearchParams(search);
  const t = q.get('theme');
  const s = q.get('season') as Season | null;
  return {
    theme: t === 'night' || t === 'day' ? t : null,
    season: s && SEASONS.includes(s) ? s : null
  };
}

/** Season sky tops (= the scene tokens in tokens.css), for <meta name="theme-color">. */
const SKY_TOP: Record<Season, string> = { spring: '#57B8F7', summer: '#3FA9F5', autumn: '#69B8F0', winter: '#8EC6F0' };
const TOD_TOP: Partial<Record<TimeOfDay, string>> = { dawn: '#FFC6A8', dusk: '#FF9E7A', night: '#3A4886' };

/** The browser chrome colour: the top of the sky (v5 §5). */
export function themeColor(s: Pick<ThemeState, 'tod' | 'season'>): string {
  return TOD_TOP[s.tod] ?? SKY_TOP[s.season];
}
