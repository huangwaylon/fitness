// A manifest entry's parsing (manifest.ts, kk.ts): a track's `{ file, start, end?, gain?, v?, d? }`, apart from the
// manifest's JSON so K.K.'s list (kk.ts, the shared stages') doesn't bundle it.
import { isNum, isText } from '#lib/contract/guards.ts';
import type { MusicTrack } from './hourly.ts';

export const obj = (v: unknown): Record<string, unknown> => (v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : {});

/** An entry's path with its content hash (`v`, scripts/music.ts --hashes) as `?v=`: a re-cut file under the same name
 *  is a new URL, so neither the service worker's cache nor the browser's (/audio/* is immutable) serves the old one.
 *  The path is the file's key everywhere after (the engine's blobs, its pins). */
export const versioned = (file: string, v: unknown): string => (typeof v === 'string' && /^[0-9a-f]{4,16}$/.test(v) ? `${file}?v=${v}` : file);

/** `{ file, start, end?, gain?, v?, d? }` plays from `start` s (see MusicTrack). A bad `end` (not after `start`) falls
 *  back to `<audio loop>`; a bad `gain` to 0 dB. */
export function track(v: unknown): MusicTrack | null {
  const t = obj(v);
  if (!isText(t.file)) return null;
  const start = isNum(t.start) && t.start >= 0 ? t.start : 0;
  const out: MusicTrack = { file: versioned(t.file, t.v), start };
  if (isNum(t.end) && t.end > start) out.end = t.end;
  if (isNum(t.gain)) out.gain = t.gain;
  if (isNum(t.d) && t.d > 0) out.dur = t.d;
  return out;
}
