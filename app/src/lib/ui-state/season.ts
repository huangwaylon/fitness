// Season / foliage / time-of-day derivation (pure; theme.svelte.ts applies it to <html>).
// NH northern-hemisphere calendar (the couple lives in Tokyo):
//   season (ground, palette, flowers): winter = snow on the ground Dec 11 – Feb 24, spring Feb 25 – May 31,
//     summer Jun 1 – Sep 15, autumn Sep 16 – Dec 10.
//   foliage (the oaks): cherry blossom only Apr 1–10, green leaves Feb 25 – Oct 15 otherwise,
//     red-orange fall leaves Oct 16 – Dec 10 (maple week Nov 16–25 is the peak), snow Dec 11 – Feb 24.
//   time of day: always the clock, never OS dark mode: dawn 05–07, day 07–16, dusk 16–19, night 19–05.
//     It drives both the scene sky and the chrome (prefers-color-scheme is ignored).
import { jst } from '#lib/time/clock.ts';

export type Season = 'spring' | 'summer' | 'autumn' | 'winter';
export type TimeOfDay = 'dawn' | 'day' | 'dusk' | 'night';
export type Foliage = 'blossom' | 'green' | 'fall' | 'snow';

export const SEASONS: readonly Season[] = ['spring', 'summer', 'autumn', 'winter'];

/** Month-day as a sortable number (Apr 3 → 403). */
const md = (d: Date) => {
  const { month, day } = jst(d);
  return month * 100 + day;
};

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

export function todFor(d: Date): TimeOfDay {
  const h = jst(d).hour;
  if (h >= 19 || h < 5) return 'night';
  if (h < 7) return 'dawn';
  if (h >= 16) return 'dusk';
  return 'day';
}

/** The preview (ui-state/preview.ts): what to show instead of the clock's (null: the clock's). */
export interface ThemeInput {
  tod?: TimeOfDay | null;
  season?: Season | null;
  foliage?: Foliage | null;
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
  const tod = o.tod ?? todFor(d);
  return { night: tod === 'night', season: o.season ?? seasonFor(d), foliage: o.foliage ?? foliageFor(d), tod };
}

/**
 * The sky table's top stop (= `--sky-top` of `.if-scene` in tokens.css, season then time of day; season.test.ts
 * checks they agree), for <meta name="theme-color">.
 */
export const SKY_TOP: Record<Season, string> = { spring: '#4AA3F6', summer: '#2F92F0', autumn: '#4AA3F6', winter: '#8EC2EE' };
export const TOD_TOP: Partial<Record<TimeOfDay, string>> = { dawn: '#7FA8E8', dusk: '#5B6FC4', night: '#1F2C66' };

/** The browser chrome colour: the top of the sky. */
export function themeColor(s: Pick<ThemeState, 'tod' | 'season'>): string {
  return TOD_TOP[s.tod] ?? SKY_TOP[s.season];
}
