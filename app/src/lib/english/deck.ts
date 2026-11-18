// フレーズ's deck (docs/english.md "フレーズ"): the deck's cards (catalog.ts deckOf, in SHARDS files) in a per-player
// seeded order, SET at a time, the place kept on this phone. A round goes through the shards in a seeded order, each
// shard's cards in a seeded order; then the next round, in a new order. A card from a clip already in this set, or from
// today's clip or the next AHEAD in the plan (their lessons stay fresh), is passed over (back next round). Pure but for
// the store.
import { DEVICE } from '#lib/sync/storage.ts';
import { perPlayer } from './per-player.ts';
import { SHARDS, type PhraseEntry } from './catalog.ts';
import { fnv1a } from '#lib/random.ts';
import type { Key } from './phrase-review.ts';
import type { Who } from '#lib/types.ts';

/** Cards a set: then 「5枚見ました」 with もう5枚. */
export const SET = 5;
/** Clips after today's in the plan whose cards wait for their lessons. */
const AHEAD = 2;

/** Where a player is in the deck. */
export interface Cursor {
  /** The round (each its own order). */
  r: number;
  /** The shard's place in the round's order of them. */
  k: number;
  /** The card's place in its shard's order: the card shown (or the next it may show). */
  i: number;
  /** This set's cards' clips so far (its length: the cards done). */
  set: string[];
  /** The cards revealed so far (これまで N). */
  n: number;
  /** The card last counted in `n` (one revealed again counts once). */
  rev?: Key;
}
export const START: Cursor = { r: 0, k: 0, i: 0, set: [], n: 0 };

const rank = (who: Who, r: number, s: string) => fnv1a(`${who}:${r}:${s}`);
export const keyOf = (e: PhraseEntry): Key => `${e[0]}/${e[1]}`;

/** The shard at the cursor (the round's order of them, seeded by player). */
export const shardAt = (who: Who, c: Cursor): number =>
  [...Array(SHARDS).keys()].sort((a, b) => rank(who, c.r, `#${a}`) - rank(who, c.r, `#${b}`) || a - b)[c.k];

/** A shard's cards in the player's order for round `r`. */
export const ordered = (who: Who, r: number, cards: readonly PhraseEntry[]): PhraseEntry[] =>
  cards.toSorted((a, b) => rank(who, r, keyOf(a)) - rank(who, r, keyOf(b)) || (keyOf(a) < keyOf(b) ? -1 : 1));

/** The cursor on the first card from its place that it may show (`cards`: its shard's, ordered), or null: none left in
 *  this shard (then nextShard). */
export function onCard(c: Cursor, cards: readonly PhraseEntry[], held: ReadonlySet<string>): Cursor | null {
  for (let i = c.i; i < cards.length; i++) if (!held.has(cards[i][0]) && !c.set.includes(cards[i][0])) return i === c.i ? c : { ...c, i };
  return null;
}

/** The next shard's first card (after the round's last shard, the next round's first). */
export const nextShard = (c: Cursor): Cursor => (c.k + 1 < SHARDS ? { ...c, k: c.k + 1, i: 0 } : { ...c, r: c.r + 1, k: 0, i: 0 });

/** Past the card shown (次へ): its clip in the set. */
export const passed = (c: Cursor, card: PhraseEntry): Cursor => ({ ...c, i: c.i + 1, set: [...c.set, card[0]] });

/** A new set (もう5枚). */
export const newSet = (c: Cursor): Cursor => ({ ...c, set: [] });

/** The card shown revealed (意味を見る): counted once. */
export const revealed = (c: Cursor, card: PhraseEntry): Cursor => (c.rev === keyOf(card) ? c : { ...c, n: c.n + 1, rev: keyOf(card) });

/** The clips whose cards wait: today's and the next AHEAD in the plan that are `open` (not finished, not skipped). */
export function heldOf(plan: readonly string[], today: string, open: (id: string) => boolean): Set<string> {
  const i = plan.indexOf(today);
  return new Set([today, ...[...plan.slice(i + 1), ...plan.slice(0, Math.max(0, i))].filter(open).slice(0, AHEAD)]);
}

const store = perPlayer<Cursor>(DEVICE.englishDeck);
export function cursorOf(who: Who): Cursor {
  const c = store.get(who);
  return c && [c.r, c.k, c.i, c.n].every(Number.isInteger) && Array.isArray(c.set) ? c : START;
}
export const saveCursor = (who: Who, c: Cursor): void => store.set(who, c);
