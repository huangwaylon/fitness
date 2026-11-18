// What a みんなで！ landing offers (offer.ts): only the games with a screen; the e2e's forced one first, on the game's
// first landing only.
import { afterEach, describe, expect, it } from 'vitest';
import { seeded } from '#lib/random.ts';
import { MINI_IDS, type MiniId } from './registry.ts';
import { OFFERED, forceMini, forcedHere, offer } from './offer.ts';

afterEach(() => forceMini(null));

describe('the offer', () => {
  it('two different games, only ones with a screen, every one of them offered over a game', () => {
    expect(OFFERED.every((id) => MINI_IDS.includes(id))).toBe(true);
    const seen = new Set<MiniId>(), played: MiniId[] = [];
    for (let k = 0; k < 40; k++) {
      const [a, b] = offer(played, seeded(`o${k}`));
      expect(a).not.toBe(b);
      expect(OFFERED.includes(a) && OFFERED.includes(b)).toBe(true);
      seen.add(a).add(b);
      played.push(a);
    }
    expect([...seen].sort()).toEqual([...OFFERED].sort());
    // (the same random, the same two: every phone's fold)
    expect(offer(['market'], seeded('x'))).toEqual(offer(['market'], seeded('x')));
  });
  it('the test hook: its game first, on the first landing only; one not offered is none', () => {
    expect(forcedHere(undefined)).toBe(false);
    forceMini('sort');
    expect(forcedHere(undefined) && forcedHere([])).toBe(true);
    expect(forcedHere([{ id: 'sort' }])).toBe(false);
    for (let k = 0; k < 10; k++) {
      const [a, b] = offer([], seeded(`f${k}`));
      expect(a).toBe('sort');
      expect(b).not.toBe('sort');
    }
    forceMini('dance' as MiniId);
    expect(forcedHere([])).toBe(false);
  });
});
