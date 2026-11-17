// 英語すごろく's tiles (docs/sugoroku.md "Tiles"): the bag, a rack drawn so a beginner can always play (vowels, a common
// consonant, at most one rare letter), and a word's points. Pure: every random is the caller's seeded one.

/** A letter's points: rare letters, not length, win (zoo, box and jam beat orange). */
export const VALUE: Readonly<Record<string, number>> = {
  a: 1, e: 1, i: 1, o: 1, u: 1, n: 1, r: 1, t: 1, l: 1, s: 1,
  d: 2, g: 2, b: 2, c: 2, m: 2, p: 2,
  f: 3, h: 3, v: 3, w: 3, y: 3,
  k: 4,
  j: 5, x: 5, z: 5
};

/** How many of each letter a fresh bag holds (Scrabble's spread, the vowels a little richer, no Q: a beginner can't use it). */
const COUNT: Readonly<Record<string, number>> = {
  a: 9, b: 2, c: 2, d: 4, e: 12, f: 2, g: 3, h: 3, i: 9, j: 1, k: 1, l: 4, m: 2,
  n: 6, o: 8, p: 2, r: 6, s: 5, t: 6, u: 4, v: 2, w: 2, x: 1, y: 2, z: 1
};

export const RACK = 7;
const VOWELS = new Set('aeiou');
const RARE = new Set('jkxz');
const COMMON = new Set('strnd');

/** A fresh bag, shuffled. */
export function newBag(r: () => number): string[] {
  const bag = Object.entries(COUNT).flatMap(([l, n]) => Array<string>(n).fill(l));
  for (let i = bag.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [bag[i], bag[j]] = [bag[j], bag[i]];
  }
  return bag;
}

/** Whether a rack is friendly: 2–4 vowels, one of S T R N D, at most one rare letter, at most 2 of a letter. */
export function friendly(rack: readonly string[]): boolean {
  const v = rack.filter((l) => VOWELS.has(l)).length;
  if (v < 2 || v > 4) return false;
  if (!rack.some((l) => COMMON.has(l))) return false;
  if (rack.filter((l) => RARE.has(l)).length > 1) return false;
  const n: Record<string, number> = {};
  return rack.every((l) => (n[l] = (n[l] ?? 0) + 1) <= 2);
}

/** `keep` filled up to RACK from the bag (a new bag when it runs out): tries a few draws for a friendly rack, then
 *  takes the last. Returns the rack and what's left of the bag. */
export function refill(keep: readonly string[], bag: readonly string[], r: () => number): { rack: string[]; bag: string[] } {
  let b = bag.length >= RACK * 2 ? [...bag] : [...bag, ...newBag(r)];
  let rack: string[] = [];
  for (let tries = 0; tries < 12; tries++) {
    const need = RACK - keep.length;
    rack = [...keep, ...b.slice(0, need)];
    if (friendly(rack) || tries === 11) {
      b = b.slice(need);
      break;
    }
    // put them back somewhere further down and look again
    const taken = b.splice(0, need);
    const at = Math.floor(r() * (b.length - need)) + need;
    b.splice(at, 0, ...taken);
  }
  return { rack, bag: b };
}

/** Whether `word` can be spelt from `rack` (each tile once). */
export function spellable(word: string, rack: readonly string[]): boolean {
  const left = [...rack];
  for (const l of word) {
    const i = left.indexOf(l);
    if (i < 0) return false;
    left.splice(i, 1);
  }
  return true;
}

/** The rack with the word's tiles taken out. */
export function without(rack: readonly string[], word: string): string[] {
  const left = [...rack];
  for (const l of word) left.splice(left.indexOf(l), 1);
  return left;
}

export interface Score {
  /** The letters' points (1–5: rare letters count, length alone doesn't win). */
  letters: number;
  /** The lucky letters, +2 each. */
  lucky: number;
  /** The space's multiplier (1, 2). */
  mult: number;
  /** An everyday (A1–A2) word +2. */
  common: number;
  /** A ヒント's word: half. */
  hinted: boolean;
  total: number;
}

/** The fewest stars a word earns. */
const MIN_WORD = 3;

/** A word's points: (letters + lucky letters' +2) × the space's multiplier, + 2 for an everyday word, at least
 *  MIN_WORD; a ヒント's word half that (rounded up). */
export function scoreOf(word: string, opts: { lucky: readonly string[]; mult: number; common: boolean; hinted?: boolean }): Score {
  const letters = [...word].reduce((s, l) => s + (VALUE[l] ?? 0), 0);
  const lucky = [...word].filter((l) => opts.lucky.includes(l)).length * 2;
  const common = opts.common ? 2 : 0;
  const full = Math.max(MIN_WORD, (letters + lucky) * opts.mult + common);
  return { letters, lucky, mult: opts.mult, common, hinted: !!opts.hinted, total: opts.hinted ? Math.ceil(full / 2) : full };
}
