// What a みんなで！ landing offers (offer.ts): two of the eight; the e2e's forced one first, on the game's first landing
// only.
import { afterEach, describe, expect, it } from 'vitest';
import { seeded } from '#lib/random.ts';
import { MINI_IDS, type MiniId } from './registry.ts';
import { forceMini, forcedHere, offer } from './offer.ts';

afterEach(() => forceMini(null));

describe('the offer', () => {
  it('two different games, every one of them offered over a game', () => {
    const seen = new Set<MiniId>(), played: MiniId[] = [];
    for (let k = 0; k < 40; k++) {
      const [a, b] = offer(played, seeded(`o${k}`));
      expect(a).not.toBe(b);
      seen.add(a).add(b);
      played.push(a);
    }
    expect([...seen].sort()).toEqual([...MINI_IDS].sort());
    // (the same random, the same two: every phone's fold)
    expect(offer(['market'], seeded('x'))).toEqual(offer(['market'], seeded('x')));
  });
  it('the test hook: its game first, on the first landing only (a list: the first landings, in turn); one not a game is none', () => {
    expect(forcedHere(undefined)).toBe(false);
    forceMini('sort');
    expect(forcedHere(undefined) && forcedHere([])).toBe(true);
    expect(forcedHere([{ id: 'sort' }])).toBe(false);
    for (let k = 0; k < 10; k++) {
      const [a, b] = offer([], seeded(`f${k}`));
      expect(a).toBe('sort');
      expect(b).not.toBe('sort');
    }
    forceMini('reply');
    expect(offer([], seeded('f'))[0]).toBe('reply');
    forceMini('dance');
    expect(forcedHere([])).toBe(false);
    // a list: each landing its next, till they're played
    forceMini('sort,numbers');
    expect([forcedHere([]), forcedHere(['sort']), forcedHere(['sort', 'numbers'])]).toEqual([true, true, false]);
    expect([offer([], seeded('g'))[0], offer(['sort'], seeded('g'))[0]]).toEqual(['sort', 'numbers']);
    forceMini('sort,dance');
    expect(forcedHere([])).toBe(false);
  });
});
