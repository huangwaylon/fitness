// ききみみ クイズ's decks on this phone (game.svelte.ts): the items of each game heard of, by seed and level (the
// session's deck and the UI's are the same items), and にがて れんしゅう's, which stands in for its lobby's own deck.
import { deck } from '#lib/kikimimi/deck.ts';
import type { Item, Level } from '#lib/kikimimi/bank.ts';

/** The last decks built, the latest read last. Other phones' lobbies build theirs here as their `open`s come (each a
 *  new seed or level), so the game I'm in and にがて れんしゅう's deck are held outside it: never evicted mid-game. */
const decks = new Map<string, Item[]>();
const KEEP = 2;
/** にがて れんしゅう's deck, under its lobby's seed and level (till the next practice). */
let practice: { key: string; items: Item[] } | null = null;
/** The game I'm in: its deck held, whatever others build. */
let pinned: { key: string; items: Item[] } | null = null;

const keyOf = (seed: number, lv: Level) => `${seed}:${lv}`;

/** A game's items, by its seed and level. */
export function itemsOf(seed: number, lv: Level): Item[] {
  const key = keyOf(seed, lv);
  if (practice?.key === key) return practice.items;
  if (pinned?.key === key) return pinned.items;
  const d = decks.get(key) ?? deck(seed, lv);
  decks.delete(key);
  decks.set(key, d);
  while (decks.size > KEEP) decks.delete(decks.keys().next().value!);
  return d;
}

/** にがて れんしゅう's deck (srs.ts practiceDeck) for a lobby of mine kept alone: its seed and level stand for it, as a
 *  shared deck's would (nothing goes on the wire). */
export function usePractice(seed: number, lv: Level, items: Item[]): void {
  practice = { key: keyOf(seed, lv), items };
}

/** The game I'm in (null: none): its deck held till another is. */
export function pinDeck(seed: number | null, lv?: Level): void {
  const key = seed === null || lv === undefined ? null : keyOf(seed, lv);
  if (pinned?.key === key) return;
  pinned = key === null ? null : { key, items: itemsOf(seed!, lv!) };
}
