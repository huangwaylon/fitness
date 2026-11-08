// しずえの ニュース's weather tail (docs/kikimimi-engine.md "しずえの ニュース"): today's real Tokyo weather read as whole sentences,
// each a clip voiced ahead (content/listen/news-a.yaml's `weather` item: 8 skies, the high for −2…38 °C in Celsius as
// Tokyo reports it, 6 alerts, the sign-off), joined only between sentences. From the relay's timeline (live-protocol.ts
// Wx, sync/wx.ts): the sky over the day's waking hours, any fog, the day's high. The host packs it into the lobby's
// options (lane.ts), so every phone plays and grades the same tail. Pure.
import { tokyoDay, type Wx } from '../../../contract/live-protocol.ts';

/** The day's sky, one sentence each. */
export const SKIES = ['sunny', 'partly', 'cloudy', 'later', 'clearing', 'rain', 'storm', 'snow'] as const;
export type Sky = (typeof SKIES)[number];
/** The alerts: a stormy, snowy or foggy day's, then a hot, very hot or cold one's. */
export const ALERTS = ['storm', 'snow', 'fog', 'heat', 'hot', 'cold'] as const;
export type Alert = (typeof ALERTS)[number];
/** The highs read out (°C); another is left out. */
export const HI_MIN = -2;
export const HI_MAX = 38;

/** Today's weather as the bulletin reads it: the sky, fog in its hours, the high (null: not known). */
export interface NewsWx {
  sky: Sky;
  fog: boolean;
  hi: number | null;
}

const H = 3600_000;
/** A timeline older than this no longer serves (the relay's STALE_MS). */
const STALE = 36 * H;
const wet = (l: string) => l === 'r' || l === 'h' || l === 's';

/** The sky over a run of hours' letters (live-protocol.ts WX_SKIES). */
export function skyOf(ls: readonly string[]): Sky {
  if (ls.includes('s')) return 'snow';
  if (ls.includes('h')) return 'storm';
  const n = ls.length, w = ls.filter(wet).length;
  if (!w) {
    const o = ls.filter((l) => l === 'o').length;
    return o * 3 >= n * 2 ? 'cloudy' : o * 3 <= n ? 'sunny' : 'partly';
  }
  const dryStart = !wet(ls[0]), dryEnd = !wet(ls[n - 1]);
  return w * 3 < n * 2 && dryStart !== dryEnd ? (dryStart ? 'later' : 'clearing') : 'rain';
}

/** Today's weather at `now` (ms): the hours from 06:00 (or now, if later) to 21:00 Tokyo time, or after 18:00 the next
 *  six; the high when the timeline's is today's and in range. Null without a timeline that serves, or 3 hours of it. */
export function newsWxOf(wx: Wx | null, now: number): NewsWx | null {
  if (!wx || now - wx.at > STALE) return null;
  const cur = Math.floor(now / H), midnight = (tokyoDay(now) * 24 - 9);
  let from = Math.max(cur, midnight + 6), to = midnight + 21;
  if (to - from < 3) [from, to] = [cur, cur + 6];
  const ls: string[] = [];
  let fog = false;
  for (let h = from; h < to; h++) {
    const i = h - wx.h0;
    if (i < 0 || i >= wx.s.length) continue;
    ls.push(wx.s[i]);
    fog ||= !!wx.fx?.includes(i);
  }
  if (ls.length < 3) return null;
  const hi = wx.hi && wx.hi[0] === tokyoDay(now) && wx.hi[1] >= HI_MIN && wx.hi[1] <= HI_MAX ? wx.hi[1] : null;
  return { sky: skyOf(ls), fog, hi };
}

/** A day's alerts, at most two: a storm, snow or fog first, then the heat (35 °C and up), a hot day (30) or a cold one
 *  (a high of 5 or less). */
export function alertsOf(w: NewsWx): Alert[] {
  const sky: Alert | null = w.sky === 'storm' ? 'storm' : w.sky === 'snow' ? 'snow' : w.fog ? 'fog' : null;
  const temp: Alert | null = w.hi === null ? null : w.hi >= 35 ? 'heat' : w.hi >= 30 ? 'hot' : w.hi <= 5 ? 'cold' : null;
  return [sky, temp].filter((a): a is Alert => a !== null);
}

/** 「傘は いる？」: rain or snow in the day's hours. */
export const umbrella = (w: NewsWx): boolean => w.sky !== 'sunny' && w.sky !== 'partly' && w.sky !== 'cloudy';

/** A high's key in its clip id (`hi-23`, `hi-m2`). */
export const hiKey = (c: number): string => (c < 0 ? `m${-c}` : `${c}`);

/** The weather sentences a day reads, by key (the weather item's clip ids are `<its id>-<key>`), the sign-off last; none
 *  known: the sign-off only. */
export const tailKeys = (w: NewsWx | null): string[] =>
  w ? [`sky-${w.sky}`, ...(w.hi === null ? [] : [`hi-${hiKey(w.hi)}`]), ...alertsOf(w).map((a) => `alert-${a}`), 'end'] : ['end'];

/** The weather as one option byte (0: none; the sky's place from 1, +16 with fog) and the high as another (0: none, else
 *  from HI_MIN at 1): lane.ts's options. */
export const wxBytes = (w: NewsWx | null): [sky: number, hi: number] =>
  w ? [1 + SKIES.indexOf(w.sky) + (w.fog ? 16 : 0), w.hi === null ? 0 : w.hi - HI_MIN + 1] : [0, 0];

/** The two bytes read back (undefined: not a weather's). */
export function wxOfBytes(sky: number, hi: number): NewsWx | null | undefined {
  if (!Number.isInteger(sky) || !Number.isInteger(hi) || hi < 0 || hi > HI_MAX - HI_MIN + 1) return undefined;
  if (sky === 0) return hi === 0 ? null : undefined;
  const k = (sky - 1) % 16, fog = sky > 16;
  if (k >= SKIES.length || sky > 16 + SKIES.length) return undefined;
  return { sky: SKIES[k], fog, hi: hi ? hi - 1 + HI_MIN : null };
}
