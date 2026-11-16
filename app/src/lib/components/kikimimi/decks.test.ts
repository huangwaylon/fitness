// The decks cache (decks.ts, over round/decks.ts): the game I'm in keeps its deck, にがて れんしゅう's above all,
// whatever other phones' lobbies are heard meanwhile (each `open` builds its deck here); each game's deck dealt from its
// own content.
import { describe, expect, it } from 'vitest';
import { BANK } from '#lib/kikimimi/source.ts';
import { deck } from '#lib/kikimimi/deck.ts';
import { ladderDeck } from '#lib/kikimimi/ladder.ts';
import { GAMES, chunksOf, itemsOf, pinDeck, usePractice } from './decks.ts';
import { ladders, loadAll } from '#lib/kikimimi/pool.ts';
import type { Level } from '#lib/kikimimi/bank.ts';

// (the compiled levels' chunks: decks and clips read the loaded ones, pool.ts)
await loadAll();

/** A quiz's deck by its seed and level (こたえる じかん 30 s). */
const quiz = (seed: number, lv: Level) => ({ gm: 'quiz', seed, o: [lv, 0] });

describe('the decks cache', () => {
  it('にがて れんしゅう’s deck stays while others’ lobbies come and go', () => {
    const mine = BANK.filter((it) => it.lv === 2).slice(-8);
    itemsOf(quiz(11, 2));
    usePractice(quiz(11, 2), mine);
    pinDeck(quiz(11, 2));
    for (let s = 100; s < 105; s++) itemsOf(quiz(s, 1)); // others' opens, a level changed back and forth
    expect(itemsOf(quiz(11, 2))).toBe(mine);
    pinDeck(null);
    // not pinned any more, still its lobby's deck until another practice replaces it
    for (let s = 100; s < 105; s++) itemsOf(quiz(s, 1));
    expect(itemsOf(quiz(11, 2))).toBe(mine);
  });

  it('the game I’m in keeps its deck (the same items, never dealt again)', () => {
    const d = itemsOf(quiz(21, 3));
    expect(d).toEqual(deck(21, 3));
    pinDeck(quiz(21, 3));
    for (let s = 200; s < 205; s++) itemsOf(quiz(s, 1));
    expect(itemsOf(quiz(21, 3))).toBe(d);
    pinDeck(null);
  });

  it('each game deals its own: a quiz its level’s, スピード はしご its ladders (the level unused), none outside a game; the chunks each needs', () => {
    expect(itemsOf({ gm: 'ladder', seed: 7, o: [3, 0] })).toEqual(ladderDeck(7, ladders()));
    expect(itemsOf({ gm: null, seed: 7, o: [] })).toEqual([]);
    expect([chunksOf('quiz', [6, 0]), chunksOf('ladder', [6, 0]), chunksOf('lesson', [1, 0, 1, 0], 'tr-hotel'), chunksOf('lesson', [1, 0, 1, 0])]).toEqual([[6], ['ladder'], ['tr-hotel'], []]);
    // the session's deck is the same items: their right choices and clip lengths
    const def = GAMES('quiz')!, w = { countdown: 0, lead: 1500, answers: [30_000, 20_000, 60_000, Infinity] as const, late: 0, openTtl: 0, hostGrace: 0, beacon: 0, auto: 0 };
    const rd = def.deck(31, def.opts.decode([4, 0])!, { w, enc: [4, 0] });
    expect(Array.from({ length: rd.count }, (_, i) => rd.round(i)!.id)).toEqual(deck(31, 4).map((it) => it.id));
  });
});
