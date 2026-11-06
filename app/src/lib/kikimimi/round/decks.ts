// A phone's decks (docs/kikimimi-framework.md §2): the items of each game heard of, by its game, seed, options and unit
// (`gameKey`), built once and kept for the last few; the deck of the game I'm in held (never dealt again mid-game,
// whatever other phones' lobbies build meanwhile), and a deck settled on this phone alone (にがて れんしゅう's, the
// misses again, a solo game's freshest) standing in for its lobby's own. Generic over what a deck holds; pure but for its
// own state (no Svelte).
import type { GameId } from './types.ts';

/** A deck's key: its game, seed, options (as on the wire) and unit. */
export const gameKey = (gm: GameId, seed: number, o: readonly number[], u?: string): string => `${gm}:${seed}:${o.join(',')}${u ? `:${u}` : ''}`;

export class Decks<T> {
  /** The last decks built, the latest read last. */
  readonly #decks = new Map<string, T>();
  readonly #keep: number;
  /** A deck settled on this phone, under its lobby's key (till the next one). */
  #practice: { key: string; items: T } | null = null;
  /** The game I'm in: its deck held, whatever others build. */
  #pinned: { key: string; items: T } | null = null;

  constructor(keep = 2) {
    this.#keep = keep;
  }

  /** A game's deck, by its key (`build` it when it isn't kept). */
  of(key: string, build: () => T): T {
    if (this.#practice?.key === key) return this.#practice.items;
    if (this.#pinned?.key === key) return this.#pinned.items;
    const d = this.#decks.get(key) ?? build();
    this.#decks.delete(key);
    this.#decks.set(key, d);
    while (this.#decks.size > this.#keep) this.#decks.delete(this.#decks.keys().next().value!);
    return d;
  }

  /** A deck settled on this phone for a lobby of mine kept alone: its key stands for it, as a shared deck's would
   *  (nothing goes on the wire). */
  practice(key: string, items: T): void {
    this.#practice = { key, items };
  }

  /** The game I'm in (null: none): its deck held till another is. */
  pin(key: string | null, build: () => T): void {
    if (this.#pinned?.key === key) return;
    this.#pinned = key === null ? null : { key, items: this.of(key, build) };
  }
}
