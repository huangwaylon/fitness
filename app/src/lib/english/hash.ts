// A content version (a flag's `v`, contract/eflag.ts): a short hash of a question, or of a whole clip, as the learner
// saw it, so the review (relay/ `npm run flags`, app/scripts/english-hashes.ts) can tell an item changed since. Pure.
import type { Clip, Question, Scene } from './types.ts';

/** FNV-1a (32 bits) of a string, base 36. */
function fnv(s: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(36);
}

/** A question's version. */
export const questionHash = (q: Question): string => fnv(JSON.stringify(q));

/** A clip's version (its video, segments and every question). */
export const clipHash = (c: Clip): string => fnv(JSON.stringify(c));

/** A clip's scenes' version (its bank file's name carries it too, so new scenes are fetched anew). */
export const scenesHash = (s: readonly Scene[]): string => fnv(JSON.stringify(s));
