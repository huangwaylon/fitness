// はつおん ききわけ's pages, the pure part (games/pair/def.ts): a word alone as an item (its clip, to hear again), whose turn
// it is to speak in あてっこ, and what the villager makes of a take.
import type { Who } from '#lib/types.ts';
import type { QuizView } from '#lib/kikimimi/games/quiz/view.ts';
import type { Item } from '#lib/kikimimi/bank.ts';
import { speakerRole } from '#lib/kikimimi/games/pair/def.ts';
import type { PairCard } from '#lib/kikimimi/games/pair/pairs.ts';
import { candidate } from '#lib/mic/match.ts';
import type { Outcome } from '#lib/mic/stt.ts';
import { isCoop } from '../listenView.ts';

/** One word of a card as an item of its own: its clip (`<card>-1` or `-2`), to be heard alone. */
export function wordItem(c: PairCard, k: number): Item {
  const { lines: _, pair: __, ...it } = c;
  return { ...it, id: `${c.id}-${k + 1}`, en: c.pair.words[k].en, ja: c.pair.words[k].ja };
}

/** あてっこ: I say round i's word (my role is its speaker's); solo: always. */
export const mySay = (v: Pick<QuizView, 'players' | 'vs' | 'roles'>, me: Who, i: number): boolean => !isCoop(v) || (v.roles[me] ?? 0) === speakerRole(i);

/** What the villager made of a take: the word heard (0, 1), unsure (-1: whisper's scores too close, or neither or both
 *  in the transcript), nothing heard, or the recogniser failed (`miss`: the mic refused, the relay's day spent…). */
export type Heard = { k: 0 | 1 } | { k: -1 } | { none: true } | { miss: string };

export function heardOf(o: Outcome, words: readonly string[]): Heard {
  if ('miss' in o) return o.miss === 'none' ? { none: true } : { miss: o.miss };
  const { i } = candidate(o, words);
  return i === 0 || i === 1 ? { k: i } : { k: -1 };
}
