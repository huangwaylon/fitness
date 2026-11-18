// 英語すごろく's tiles (docs/sugoroku.md "Tiles"): the bag, a rack drawn round a real word of 5–8 letters (seeds.json) so a
// longer word is always there, and a word's points. Pure: every random is the caller's seeded one.

import seeds from './seeds.json';

/** The racks' seeds: common words of 5–8 letters a fresh bag can spell, the first `e` everyday ones. */
const SEEDS = seeds as { e: number; w: string[] };

/** A letter's points: rare letters, not length, win (zoo, box and jam beat orange). */
export const VALUE: Readonly<Record<string, number>> = {
  a: 1, e: 1, i: 1, o: 1, u: 1, n: 1, r: 1, t: 1, l: 1, s: 1,
  d: 2, g: 2, b: 2, c: 2, m: 2, p: 2,
  f: 3, h: 3, v: 3, w: 3, y: 3,
  k: 4,
  j: 5, x: 5, z: 5
};

/** How many of each letter a fresh bag holds (Scrabble's spread, the vowels a little richer, no Q: a beginner can't use it). */
export const COUNT: Readonly<Record<string, number>> = {
  a: 9, b: 2, c: 2, d: 4, e: 12, f: 2, g: 3, h: 3, i: 9, j: 1, k: 1, l: 4, m: 2,
  n: 6, o: 8, p: 2, r: 6, s: 5, t: 6, u: 4, v: 2, w: 2, x: 1, y: 2, z: 1
};

/** Tiles a rack holds: 8, so an 8-letter word can be made (the game's longest). */
export const RACK = 8;
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
function friendly(rack: readonly string[]): boolean {
  const v = rack.filter((l) => VOWELS.has(l)).length;
  if (v < 2 || v > 4) return false;
  if (!rack.some((l) => COMMON.has(l))) return false;
  if (rack.filter((l) => RARE.has(l)).length > 1) return false;
  const n: Record<string, number> = {};
  return rack.every((l) => (n[l] = (n[l] ?? 0) + 1) <= 2);
}

/** Pick from one of the seeds (seeds.json): an everyday word 6 times in 10, else any common one. */
const SEED_LENS: readonly (readonly [number, number])[] = [[5, 3], [6, 3], [7, 2], [8, 1]];

/** `keep` filled up to RACK from the bag (a new bag when it runs out), drawn round a seed: a common word of 5–8
 *  letters (its length weighted 5 and 6 most, 8 least; an everyday one 6 times in 10) whose letters the kept tiles and
 *  the bag can make, its missing letters taken from the bag, the rest drawn as they come; so every rack holds a real
 *  4–8 letter word and the shorter ones in it. No seed fits (a short bag): a friendly rack as before (a few draws for
 *  2–4 vowels, then the last). The rack shuffled. Returns the rack and what's left of the bag. */
export function refill(keep: readonly string[], bag: readonly string[], r: () => number): { rack: string[]; bag: string[] } {
  let b = bag.length >= RACK * 2 ? [...bag] : [...bag, ...newBag(r)];
  const room = RACK - keep.length;
  for (let tries = 0; tries < 40; tries++) {
    const len = pickLen(r), pool = r() < 0.6 ? SEEDS.w.slice(0, SEEDS.e) : SEEDS.w;
    const cands = pool.filter((w) => w.length === len);
    const w = cands[Math.floor(r() * cands.length)];
    if (!w) continue;
    const need = [...w];
    // its letters the kept tiles don't have
    const have = [...keep];
    const missing: string[] = [];
    for (const l of need) {
      const i = have.indexOf(l);
      if (i >= 0) have.splice(i, 1);
      else missing.push(l);
    }
    if (missing.length > room) continue;
    const left = [...b];
    let okBag = true;
    for (const l of missing) {
      const i = left.indexOf(l);
      if (i < 0) { okBag = false; break; }
      left.splice(i, 1);
    }
    if (!okBag) continue;
    const fill = left.slice(0, room - missing.length);
    const rack = [...keep, ...missing, ...fill];
    for (let i = rack.length - 1; i > 0; i--) {
      const j = Math.floor(r() * (i + 1));
      [rack[i], rack[j]] = [rack[j], rack[i]];
    }
    return { rack, bag: left.slice(room - missing.length) };
  }
  let rack: string[] = [];
  for (let tries = 0; tries < 12; tries++) {
    rack = [...keep, ...b.slice(0, room)];
    if (friendly(rack) || tries === 11) {
      b = b.slice(room);
      break;
    }
    // put them back somewhere further down and look again
    const taken = b.splice(0, room);
    const at = Math.floor(r() * (b.length - room)) + room;
    b.splice(at, 0, ...taken);
  }
  return { rack, bag: b };
}

function pickLen(r: () => number): number {
  let x = r() * SEED_LENS.reduce((n, [, w]) => n + w, 0);
  for (const [len, w] of SEED_LENS) if ((x -= w) < 0) return len;
  return 5;
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
  /** An everyday (A1–A2) word's bonus (by the seat's level: game.ts LEVEL). */
  everyday: number;
  /** A ヒント's word, halved. */
  half: boolean;
  total: number;
}

/** The fewest stars a word earns. */
const MIN_WORD = 3;

/** A word's points: (letters + lucky letters' +2) × the space's multiplier, + the everyday bonus, at least MIN_WORD;
 *  `half` (a ヒント's word, but at やさしい) half that, rounded up. */
export function scoreOf(word: string, opts: { lucky: readonly string[]; mult: number; everyday: number; half?: boolean }): Score {
  const letters = [...word].reduce((s, l) => s + (VALUE[l] ?? 0), 0);
  const lucky = [...word].filter((l) => opts.lucky.includes(l)).length * 2;
  const full = Math.max(MIN_WORD, (letters + lucky) * opts.mult + opts.everyday);
  return { letters, lucky, mult: opts.mult, everyday: opts.everyday, half: !!opts.half, total: opts.half ? Math.ceil(full / 2) : full };
}
