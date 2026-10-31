// The hourly music (docs/design.md#hourly-music): NH plays one track per real-world hour, in a sunny, rainy or snowy
// arrangement, and changes track at the top of the hour. Pure: which track, when the next hour starts, how the fade
// runs. The hour is Tokyo's (time/clock.ts jst()), like every other clock in the app.
import { jst } from '#lib/time/clock.ts';

export type Weather = 'sunny' | 'rain' | 'snow';
export const WEATHERS: readonly Weather[] = ['sunny', 'rain', 'snow'];

/** `7` → `'07'`: the file key of an hour (static/audio/manifest.json `music.<weather>.<HH>`). */
export const hourKey = (hour: number): string => String(hour).padStart(2, '0');

/** One hour's track: a seamless loop, played from `start` s (where the loop begins musically). With `end`, the file
 *  is one loop period (0 → `end` s) plus a copy of its first seconds, and the engine hands over between its two decks
 *  inside that copy (session.ts WRAP); without it, `<audio loop>` wraps. `gain`: dB that brings it to the common
 *  loudness (scripts/music.ts measures it). */
export interface MusicTrack {
  file: string;
  start: number;
  end?: number;
  gain?: number;
}

/** A track's `gain` (dB) as a linear deck level, clamped to −24…+12 dB (a typo in the manifest can't blast). */
export const trackLevel = (db: number | undefined): number => (typeof db === 'number' && Number.isFinite(db) ? 10 ** (Math.min(12, Math.max(-24, db)) / 20) : 1);
export type MusicFiles = Partial<Record<Weather, Partial<Record<string, MusicTrack>>>>;

/** The file for this hour and weather: the weather's arrangement, else the sunny one of the same hour (NH has all
 *  72; a partial set still plays the right hour), else none (silence; never another hour's track). */
export function trackFor(hour: number, weather: Weather, files: MusicFiles): ({ key: string } & MusicTrack) | null {
  const h = hourKey(hour);
  for (const w of weather === 'sunny' ? (['sunny'] as const) : [weather, 'sunny' as const]) {
    const t = files[w]?.[h];
    if (t) return { key: `${w}/${h}`, ...t };
  }
  return null;
}

/** The track for an instant (Tokyo hour). */
export const trackAt = (d: Date, weather: Weather, files: MusicFiles) => trackFor(jst(d).hour, weather, files);

const HOUR_MS = 3_600_000;
/** Milliseconds until the next top of the hour. Tokyo is a whole number of hours from UTC, so its hours start
 *  with UTC's. */
export const msToNextHour = (d: Date): number => HOUR_MS - (((d.getTime() % HOUR_MS) + HOUR_MS) % HOUR_MS);

/** The hour change, in seconds from the top of the hour: a 3 s crossfade in which the old track leaves first and the
 *  new one enters from its start a second later (NH lets the old hour fade before the new one is heard). */
export const CROSSFADE = { out: 3, inAt: 1, inFor: 2 } as const;
/** Coming back to the app (or a first start): the track fades in from where it was. */
export const FADE_IN = 0.8;
/** The next hour's file is fetched this long before the change, so the crossfade never waits on the network. */
export const PREFETCH_MS = 60_000;

interface FadePlan {
  /** The playing track: full at `outFrom`, silent at `outTo`. */
  outFrom: number;
  outTo: number;
  /** The next track starts at `inFrom` (silent) and is full at `inTo`. */
  inFrom: number;
  inTo: number;
}

/** The fade for a change that starts at `at` (s on the audio clock). With nothing playing there is nothing to fade
 *  out: the track just fades in. */
export function crossfadePlan(at: number, playing: boolean): FadePlan {
  if (!playing) return { outFrom: at, outTo: at, inFrom: at, inTo: at + FADE_IN };
  const c = CROSSFADE;
  return { outFrom: at, outTo: at + c.out, inFrom: at + c.inAt, inTo: at + c.inAt + c.inFor };
}
