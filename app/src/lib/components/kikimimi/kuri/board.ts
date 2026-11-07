// くりかえし チャレンジ's round on this phone (KuriPlay, KuriResults; over games/kuri/def.ts): what was heard against
// the sentence (lib/mic/match.ts: the content words got, each shown word lit or not), and the Japanese to show. What
// was heard stays in the round's memory (KuriPlay's state): never stored, sent or logged. Its pages' strings come in with it (i18n/kiki-kuri.ts: kikimimi/ may not import i18n).
import '#lib/i18n/kiki-kuri.ts';
import type { Item } from '#lib/kikimimi/bank.ts';
import { wordsOf } from '#lib/kikimimi/games/kuri/def.ts';
import { align, content, recall, words } from '#lib/mic/match.ts';

/** A shown word: got (heard in its place), and whether it holds a content word (a miss worth naming). */
export interface Mark {
  w: string;
  got: boolean;
  key: boolean;
}

/** The sentence's words as heard: each shown word lit when every word it stands for was heard in its place (a
 *  contraction is two: `don't` is `do not`). Content words got, of how many: `[hit, of]` (the answer's). */
export function heardAgainst(en: string, heard: string): { marks: Mark[]; hit: number; of: number } {
  const shown = wordsOf(en), per = shown.map((w) => words(w)), said = align(en, heard).said;
  const [hit, of] = recall(en, heard);
  // each shown word's share of the aligned words (the same normaliser, word by word: the counts match but for a rare
  // phrase read across words, then each word on its own)
  const heardSet = new Set(words(heard));
  let k = 0;
  const lined = per.reduce((s, p) => s + p.length, 0) === said.length;
  const marks = shown.map((w, i): Mark => {
    const xs = lined ? said.slice(k, (k += per[i].length)) : per[i].map((x) => ({ w: x, ok: heardSet.has(x) }));
    return { w, got: xs.every((x) => x.ok), key: xs.some((x) => content(x.w)) };
  });
  return { marks, hit, of };
}

/** A missed content word as a chip (its punctuation off). */
export const bare = (w: string): string => w.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, '');

/** The sentence's Japanese (a reply's, its question's: what follows 「→」 is the reply's, not this sentence's). */
export const jaOf = (it: Pick<Item, 'ja' | 'type'>): string => (it.type === 'reply' ? it.ja.split(/\s*→/)[0] : it.ja);
