// 英語すごろく's ぶん spaces (docs/sugoroku.md "Rules"): a line from English Study's フレーズ deck (3–6 words with its
// Japanese: scripts/sugoroku-words.ts writes sentences.json), its words shuffled into tiles to put back in order.
import { seeded, shuffle } from '#lib/random.ts';

export interface Sentence {
  /** The line's words as shown (case, punctuation and contractions kept: one tile each). */
  words: string[];
  en: string;
  ja: string;
}

export const sentenceOf = ([en, ja]: readonly [string, string]): Sentence => ({ words: en.split(' '), en, ja });

/** The game's nth line: one not used in this game yet, picked by the seed. */
export function pickSentence(lines: readonly (readonly [string, string])[], seed: string, n: number, used: ReadonlySet<string>): Sentence | null {
  const ok = lines.filter(([en]) => !used.has(en));
  if (!ok.length) return null;
  return sentenceOf(ok[Math.floor(seeded(`${seed}:p:${n}`)() * ok.length)]);
}

/** Its words as tiles, shuffled (never already in order when it can be helped). */
export function tilesOf(s: Sentence, seed: string): { id: number; w: string }[] {
  const tiles = s.words.map((w, id) => ({ id, w }));
  const r = seeded(`${seed}:t:${s.en}`);
  for (let i = 0; i < 6; i++) {
    shuffle(tiles, r);
    if (tiles.map((t) => t.w).join(' ') !== s.en) break;
  }
  return tiles;
}

/** Whether the words picked read the line (judged by the string: equal words in either order count). */
export const inOrder = (s: Sentence, picked: readonly string[]): boolean => picked.join(' ') === s.en;

let loading: Promise<readonly (readonly [string, string])[]> | null = null;
/** The lines, fetched once (their own chunk). */
export function loadSentences(): Promise<readonly (readonly [string, string])[]> {
  return (loading ??= import('./sentences.json').then((m) => m.default as [string, string][])).catch((err: unknown) => {
    loading = null;
    throw err;
  });
}
