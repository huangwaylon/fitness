// 英語すごろく's 絵 stones (docs/sugoroku.md "Rules"): an everyday thing's picture (Google's Noto Emoji, Apache 2.0,
// hotlinked from its CDN: pictures.json, 415 words a single emoji shows, chosen for A1–A2 with our Japanese), its
// English name to spell (やさしい: one of three spellings; ふつう: its letters, the first given; むずかしい: its letters and
// two more), its tier by the seat's level (TIERS).
import data from './pictures.json';

export interface Picture {
  /** Its English name (what's spelt). */
  w: string;
  ja: string;
  /** food, animal, home, town, nature, school, clothes, sport, body. */
  set: string;
  /** Its Noto Emoji codepoint(s), lower-case hex joined with _. */
  cp: string;
  /** How hard its name is: 1 everyday (A1–A2), 2 B1, 3 B2 and rarer (longer names too, up to 12 letters). */
  tier?: 1 | 2 | 3;
}

export const PICTURES: readonly Picture[] = data as Picture[];

/** The tiers a seat's level draws from, each its weight: やさしい the everyday ones, ふつう mostly B1, むずかしい mostly the hardest. */
export const TIERS: Readonly<Record<1 | 2 | 3, readonly (readonly [1 | 2 | 3, number])[]>> = {
  1: [[1, 1]],
  2: [[1, 1], [2, 3]],
  3: [[2, 1], [3, 3]]
};
export const tierOf = (p: Picture): 1 | 2 | 3 => p.tier ?? 1;

/** A picture's image: Noto Emoji's SVG on Google's CDN (CSP: vite.config.ts img-src). */
export const pictureSrc = (p: Picture): string => `https://fonts.gstatic.com/s/e/notoemoji/latest/${p.cp}/emoji.svg`;

/** A picture spelt: first try, after a nudge, after 答えはこれ. */
export const PICTURE_STARS = [5, 3, 2];

/** The letters a seat spells a picture with (level 2: its own letters; 3: and two more), shuffled by `r`. */
export function lettersFor(p: Picture, level: number, r: () => number): string[] {
  const extra = level >= 3 ? ['e', 'a', 'r', 's', 't', 'o', 'n', 'l'].filter((l) => !p.w.includes(l)).slice(0, 8) : [];
  const pool = extra.length ? extra : ['k', 'm'];
  const more = level >= 3 ? [pool[Math.floor(r() * pool.length)], pool[Math.floor(r() * pool.length)]] : [];
  const tiles = [...p.w, ...more];
  for (let i = tiles.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [tiles[i], tiles[j]] = [tiles[j], tiles[i]];
  }
  return tiles;
}

/** やさしい's three spellings: the word and two near misses (a letter doubled or two swapped), shuffled by `r`. */
export function choicesFor(p: Picture, r: () => number): string[] {
  const w = p.w, n = w.length;
  const swap = (i: number) => w.slice(0, i) + w[i + 1] + w[i] + w.slice(i + 2);
  const near = new Set<string>();
  for (let k = 0; k < 20 && near.size < 2; k++) {
    const i = Math.floor(r() * (n - 1));
    const c = k % 2 ? swap(i) : w.slice(0, i + 1) + w[i] + w.slice(i + 1);
    if (c !== w) near.add(c);
  }
  const out = [w, ...near];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}
