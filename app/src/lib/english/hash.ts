// A content version (a flag's `v`, contract/eflag.ts): a short hash of a question, or of a whole clip, as the learner
// saw it, so the review (relay/ `npm run flags`, app/scripts/english-hashes.ts) can tell an item changed since. Pure.
import { fnv1a } from '#lib/random.ts';
import type { Beat, Clip, Question, Scene, TranscriptLine } from './types.ts';

/** FNV-1a (32 bits) of a string, base 36. */
export const fnv = (s: string): string => fnv1a(s).toString(36);

/** A question's version. */
export const questionHash = (q: Question): string => fnv(JSON.stringify(q));

/** A clip's version (its video, segments and every question). */
export const clipHash = (c: Clip): string => fnv(JSON.stringify(c));

/** A clip's scenes' version, with its beats when it has them (its bank file's name carries it too, so new scenes are
 *  fetched anew). */
export const scenesHash = (s: readonly Scene[], b?: readonly Beat[]): string => fnv(JSON.stringify(b ? [s, b] : s));

/** A clip's transcript's version (its bank file's name carries it too, so new lines and translations are fetched
 *  anew). */
export const transcriptHash = (l: readonly TranscriptLine[]): string => fnv(JSON.stringify(l));
