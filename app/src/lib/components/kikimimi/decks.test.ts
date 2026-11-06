// The decks cache (decks.ts): the game I'm in keeps its deck, にがて れんしゅう's above all, whatever other phones' lobbies
// are heard meanwhile (each `open` builds its deck here).
import { describe, expect, it } from 'vitest';
import { BANK } from '#lib/kikimimi/source.ts';
import { deck } from '#lib/kikimimi/deck.ts';
import { itemsOf, pinDeck, usePractice } from './decks.ts';
import { loadAll } from '#lib/kikimimi/pool.ts';

// (the compiled levels' chunks: decks and clips read the loaded ones, pool.ts)
await loadAll();

describe('the decks cache', () => {
  it('にがて れんしゅう’s deck stays while others’ lobbies come and go', () => {
    const mine = BANK.filter((it) => it.lv === 2).slice(-8);
    itemsOf(11, 2);
    usePractice(11, 2, mine);
    pinDeck(11, 2);
    for (let s = 100; s < 105; s++) itemsOf(s, 1); // others' opens, a level changed back and forth
    expect(itemsOf(11, 2)).toBe(mine);
    pinDeck(null);
    // not pinned any more, still its lobby's deck until another practice replaces it
    for (let s = 100; s < 105; s++) itemsOf(s, 1);
    expect(itemsOf(11, 2)).toBe(mine);
  });

  it('the game I’m in keeps its deck (the same items, never dealt again)', () => {
    const d = itemsOf(21, 3);
    expect(d).toEqual(deck(21, 3));
    pinDeck(21, 3);
    for (let s = 200; s < 205; s++) itemsOf(s, 1);
    expect(itemsOf(21, 3)).toBe(d);
    pinDeck(null);
  });
});
