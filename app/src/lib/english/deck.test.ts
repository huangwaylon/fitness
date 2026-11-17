// フレーズ's deck (deck.ts): a seeded order per player, SET cards a set with no two from one clip, today's clip and the
// next two in the plan held back, every card once a round; the place a cursor kept on this phone.
import { describe, expect, it } from 'vitest';
import { SHARDS, type PhraseEntry } from './catalog.ts';
import { heldOf, keyOf, newSet, nextShard, onCard, ordered, passed, revealed, SET, shardAt, START, type Cursor } from './deck.ts';
import type { Who } from '#lib/types.ts';

/** A shard of `n` cards over `clips` clips (cards cycle through the clips). */
const shardOfN = (s: number, n: number, clips: number): PhraseEntry[] =>
  Array.from({ length: n }, (_, i) => [`c${(s * 7 + i) % clips}`, `s${s}q${i}`, i, i + 3, `Phrase ${s}.${i}（フレーズ）`, `a *line*`, `意味`] as const);
const SHARD_CARDS = Array.from({ length: SHARDS }, (_, s) => shardOfN(s, 30, 12));

/** Walk the deck as the page does: `sets` sets, each SET cards (or fewer at a round's end). */
function walk(who: Who, sets: number, held = new Set<string>(), c0: Cursor = START) {
  let c = c0;
  const shown: PhraseEntry[][] = [];
  for (let s = 0; s < sets; s++) {
    const set: PhraseEntry[] = [];
    while (set.length < SET) {
      const cards = ordered(who, c.r, SHARD_CARDS[shardAt(who, c)]);
      const at = onCard(c, cards, held);
      if (!at) {
        c = nextShard(c);
        continue;
      }
      set.push(cards[at.i]);
      c = passed(at, cards[at.i]);
    }
    shown.push(set);
    c = newSet(c);
  }
  return { shown, c };
}

describe('the order', () => {
  it('seeded per player: the same each time, another for the other player, and another next round', () => {
    const cards = SHARD_CARDS[0];
    expect(ordered('A', 0, cards)).toEqual(ordered('A', 0, cards));
    expect(ordered('A', 0, cards).map(keyOf)).not.toEqual(ordered('B', 0, cards).map(keyOf));
    expect(ordered('A', 1, cards).map(keyOf)).not.toEqual(ordered('A', 0, cards).map(keyOf));
    expect(ordered('A', 0, cards).map(keyOf).toSorted()).toEqual(cards.map(keyOf).toSorted());
  });
  it('a round goes through every shard once, in a seeded order', () => {
    const order = (who: Who, r: number) => Array.from({ length: SHARDS }, (_, k) => shardAt(who, { ...START, r, k }));
    expect(order('A', 0).toSorted()).toEqual([...Array(SHARDS).keys()]);
    expect(order('A', 0)).not.toEqual(order('B', 0));
    expect(order('A', 0)).not.toEqual(order('A', 1));
  });
});

describe('a set', () => {
  it('SET cards, never two from one clip; across sets every card once in a round', () => {
    const { shown } = walk('A', 40);
    for (const set of shown) {
      expect(set).toHaveLength(SET);
      expect(new Set(set.map((e) => e[0])).size).toBe(SET);
    }
    const keys = shown.flat().map(keyOf);
    expect(new Set(keys).size).toBe(keys.length);
  });
  it('passes over today’s clip and the next two (back in a later round)', () => {
    const held = new Set(['c1', 'c2', 'c3']);
    const { shown } = walk('A', 20, held);
    expect(shown.flat().filter((e) => held.has(e[0]))).toEqual([]);
  });
  it('a cursor at a card stays on it (the page comes back to the same card)', () => {
    const cards = ordered('A', 0, SHARD_CARDS[shardAt('A', START)]);
    const at = onCard(START, cards, new Set())!;
    expect(onCard(at, cards, new Set())).toBe(at);
    expect(onCard({ ...START, i: cards.length }, cards, new Set())).toBeNull();
  });
  it('after the last shard, the next round', () => {
    expect(nextShard({ ...START, k: SHARDS - 1, i: 9 })).toEqual({ ...START, r: 1, k: 0, i: 0 });
    expect(nextShard({ ...START, k: 2, i: 9 })).toEqual({ ...START, k: 3, i: 0 });
  });
});

describe('heldOf', () => {
  const plan = ['a', 'b', 'c', 'd', 'e'];
  it('today’s clip and the next two not finished nor skipped, round the end of the plan', () => {
    expect([...heldOf(plan, 'b', () => true)]).toEqual(['b', 'c', 'd']);
    expect([...heldOf(plan, 'b', (id) => id !== 'c')]).toEqual(['b', 'd', 'e']);
    expect([...heldOf(plan, 'e', () => true)]).toEqual(['e', 'a', 'b']);
  });
});

describe('これまで N', () => {
  it('a card revealed counts once', () => {
    const card = SHARD_CARDS[0][0];
    const c = revealed(revealed(START, card), card);
    expect(c.n).toBe(1);
    expect(revealed(c, SHARD_CARDS[0][1]).n).toBe(2);
  });
});
