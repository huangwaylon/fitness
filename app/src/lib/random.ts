// Seeded randomness shared by the island, the demo and the placeholder sounds: the same seed gives the same sequence.

/** A small seeded PRNG (mulberry32): uniform in [0, 1). */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** A string's 32-bit FNV-1a hash: a seed for mulberry32. */
function hashSeed(s: string): number {
  let h = 2166136261;
  for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 16777619) >>> 0;
  return h;
}

/** A PRNG seeded by a string. */
export const seeded = (s: string): (() => number) => mulberry32(hashSeed(s));

/** A weighted pick from [item, weight] pairs (weights > 0 in total). */
export function weighted<T>(list: readonly (readonly [T, number])[], r: () => number): T {
  let x = r() * list.reduce((s, [, w]) => s + w, 0);
  for (const [item, w] of list) if ((x -= w) < 0) return item;
  return list[list.length - 1][0];
}

/** One of `xs`, uniformly. */
export const pickOne = <T>(xs: readonly T[], r: () => number): T => xs[Math.floor(r() * xs.length)];

/** Shuffle `xs` in place (Fisher–Yates, from the end) and return it. */
export function shuffle<T>(xs: T[], r: () => number): T[] {
  for (let i = xs.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [xs[i], xs[j]] = [xs[j], xs[i]];
  }
  return xs;
}
