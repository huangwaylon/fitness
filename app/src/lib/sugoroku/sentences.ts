// 英語すごろく's ぶん spaces (docs/sugoroku.md "Rules"): a line from English Study's フレーズ deck (3–6 words with its
// Japanese and a level: scripts/sugoroku-words.ts writes sentences.json), its words shuffled into tiles to put back in order.
import { once } from '#lib/once.ts';
import { seeded, shuffle } from '#lib/random.ts';

export interface Sentence {
  /** The line's words as shown (case, punctuation and contractions kept: one tile each). */
  words: string[];
  en: string;
  ja: string;
}

/** A line: its English, Japanese and level (1–3: scripts/sugoroku-words.ts). */
export type Line = readonly [en: string, ja: string, level: number];

export const sentenceOf = ([en, ja]: Line): Sentence => ({ words: en.split(' '), en, ja });

/** A seat's line: its level's (then the nearest level's) not used in this game yet, the phase's pick `r` in [0, 1). */
export function pickSentence(lines: readonly Line[], level: number, r: number, used: ReadonlySet<string>): Sentence | null {
  for (const lv of [level, level === 1 ? 2 : level - 1, 1, 2, 3]) {
    const ok = lines.filter(([en, , l]) => l === lv && !used.has(en));
    if (ok.length) return sentenceOf(ok[Math.floor(r * ok.length)]);
  }
  return null;
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

/** The lines, fetched once (their own chunk; a failure tried again next time). */
export const loadSentences: () => Promise<readonly Line[]> = once(() => import('./sentences.json').then((m) => m.default as unknown as Line[]));
