// ききみみ クイズ: less repetition (docs/kikimimi-engine.md "Variety"; the user, 2026-11-06: "there's too much repetition right
// now"). Each phone keeps the item ids of its last few games (DEVICE.kikimimiRecent, newest first). Pure.
//   A shared game: the host's phone picks the game's seed by trying SEED_TRIES seeds and keeping the deck that overlaps
// its recent games least (the more recent, the more it counts); the seed's low bits are the lobby's flags (seed.ts: bit 0 たいせん,
// bit 1 スピード はしご, bits 2-3 こたえる じかん) and stay as set. The other phones only use the seed, so nothing new goes
// on the wire. A solo game and にがて れんしゅう build their own deck on this phone (deck.ts with `seen`, srs.ts
// practiceDeck): items not heard lately first, then the least recently heard.
import { FLAG_BITS } from './seed.ts';

/** How many games' items a phone keeps. */
export const RECENT_GAMES = 6;
/** How many seeds the host tries. */
export const SEED_TRIES = 24;

/** The last games' item ids, newest first. */
export type Recent = readonly (readonly string[])[];

/** The history with a game's items put first (at most RECENT_GAMES games; an empty game changes nothing). */
export const remember = (recent: Recent, ids: readonly string[]): string[][] =>
  (ids.length ? [[...ids], ...recent] : [...recent]).slice(0, RECENT_GAMES).map((g) => [...g]);

/** Each item heard lately → how many games ago (0: the last game). */
export function agesOf(recent: Recent): Map<string, number> {
  const out = new Map<string, number>();
  recent.forEach((g, k) => g.forEach((id) => out.has(id) || out.set(id, k)));
  return out;
}

/** A deck's overlap with the history, weighted: an item from the last game counts RECENT_GAMES, from the oldest kept 1. */
export function overlap(ids: readonly string[], ages: ReadonlyMap<string, number>): number {
  let n = 0;
  for (const id of ids) {
    const k = ages.get(id);
    if (k !== undefined) n += RECENT_GAMES - k;
  }
  return n;
}

/** A seed whose low bits are `flags` and whose other bits come from `random`. */
export const seedWith = (random: () => number, flags: number): number => ((Math.floor(random() * 2 ** 32) & ~FLAG_BITS) | (flags & FLAG_BITS)) >>> 0;

/**
 * The host's seed: SEED_TRIES candidates (each `seedWith(random, flags)`), the one whose deck (`ids`) overlaps the
 * history least (the first such; none at all ends the search). Deterministic given `random` and the history.
 */
export function freshSeed(o: { random: () => number; flags: number; ids: (seed: number) => readonly string[]; recent: Recent; tries?: number }): number {
  const ages = agesOf(o.recent);
  let best = seedWith(o.random, o.flags), cost = overlap(o.ids(best), ages);
  for (let k = 1; k < (o.tries ?? SEED_TRIES) && cost > 0; k++) {
    const seed = seedWith(o.random, o.flags), c = overlap(o.ids(seed), ages);
    if (c < cost) (best = seed), (cost = c);
  }
  return best;
}

/** Freshness for sorting (lower first): an item not heard lately 0, else the more recent the higher (1…RECENT_GAMES). */
export const staleness = (id: string, ages: ReadonlyMap<string, number>): number => {
  const k = ages.get(id);
  return k === undefined ? 0 : RECENT_GAMES - k;
};
