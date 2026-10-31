// Dialogue blips (docs/design.md#ui-sounds-and-blips), pure: which typed glyphs get a blip and at what pitch. NH's Animalese
// "reads" each syllable of the line in a sped-up voice; here every other spoken glyph gets one short blip (the box
// types at 33 ms a glyph, too fast for one each), punctuation and spaces are silent, the pitch follows the glyph (so
// the same line always sounds the same) and a question rises at the end.
import { semitones } from './mix.ts';

export interface Glyph {
  ch: string;
  /** Reveal time, ms from the start of the line. */
  at: number;
}

/** A blip on every Nth spoken glyph, and at most this many per line (a long line goes quiet; it never drones). */
export const BLIP_EVERY = 2;
export const MAX_BLIPS = 40;
const QUIET = /[\s、。，．,.!?！？…・「」『』（）()〜~ー—:：;；"'“”‘’]/u;

/** −3 … +3 semitones from the glyph's code point. */
const pitchOf = (ch: string) => semitones(((ch.codePointAt(0) ?? 0) * 7) % 7 - 3);

export function blipPlan(glyphs: readonly Glyph[]): { times: number[]; rates: number[] } {
  const times: number[] = [];
  const rates: number[] = [];
  let k = 0;
  for (const g of glyphs) {
    if (QUIET.test(g.ch)) continue;
    if (k++ % BLIP_EVERY) continue;
    if (times.length >= MAX_BLIPS) break;
    times.push(g.at / 1000);
    rates.push(pitchOf(g.ch));
  }
  // a question goes up at the end, as Animalese does
  const last = glyphs.findLast((g) => !/\s/u.test(g.ch))?.ch ?? '';
  if (/[?？]/u.test(last)) for (let i = Math.max(0, rates.length - 2); i < rates.length; i++) rates[i] *= semitones(4);
  return { times, rates };
}
