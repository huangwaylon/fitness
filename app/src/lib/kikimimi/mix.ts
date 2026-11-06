// ききみみ クイズ: how many of each type a level's game draws (docs/kikimimi.md "Content"). Pure: the deck (deck.ts) and
// the compiler's gate (compile.ts) read it alike.
import type { Item, ItemType, Level } from './bank.ts';

type Mix = Readonly<Partial<Record<ItemType, number>>>;
export type Mixes = Readonly<Partial<Record<Level, Mix>>>;

/** How many of each type a level's game has (8 in all). Level 5 is the アナウンス pack (bank5.ts): numbers that matter,
 *  what's going on, what it means, what to say back. Levels 6 (やま) and 7 (ほし), the content sprint's (content/), lean
 *  on what's meant and what's going on (mean, gist, next, reply: 6 of 8), a word and a number kept for the sounds; their
 *  gist and next are dialogues and (ほし) single bulletins and talks alike. */
const BASE: Mixes = {
  1: { pic: 3, word: 3, num: 2 },
  2: { pic: 2, word: 2, num: 2, reply: 2 },
  3: { pic: 1, word: 2, num: 2, reply: 3 },
  4: { word: 2, num: 2, reply: 2, mean: 2 },
  5: { num: 3, gist: 2, mean: 2, reply: 1 },
  6: { reply: 2, mean: 2, gist: 1, next: 1, word: 1, num: 1 },
  7: { mean: 2, gist: 2, next: 1, reply: 1, word: 1, num: 1 }
};
/** Level 4 once its dialogues have their clips (every line: dialogues.ts, content/'s もり): one `gist` and one `next` a
 *  game. */
const WITH_DIALOGUES: Mix = { word: 2, num: 1, reply: 1, mean: 2, gist: 1, next: 1 };

/** The mixes, level 4's with its dialogues once every level-4 dialogue is voiced (they wait for the neural pipeline
 *  apart from level 4's single lines, so either can land first; levels 6 and 7 are gated whole: compile.ts). */
export const mixFor = (dialogues: boolean): Mixes => (dialogues ? { ...BASE, 4: WITH_DIALOGUES } : BASE);

/** Whether a mix draws this item (its level's mix has its type). */
export const drawn = (it: Pick<Item, 'lv' | 'type'>, mix: Mixes): boolean => (mix[it.lv]?.[it.type] ?? 0) > 0;
