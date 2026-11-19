// What a みんなで！ landing offers (offer.ts): only the games with a screen, by the game's rules (before '4' the ★ four);
// the e2e's forced one first, on the game's first landing only.
import { afterEach, describe, expect, it } from 'vitest';
import { seeded } from '#lib/random.ts';
import { MINI_IDS, type MiniId } from './registry.ts';
import { OFFERED, forceMini, forcedHere, offer } from './offer.ts';

afterEach(() => forceMini(null));

describe('the offer', () => {
  it('two different games, only ones with a screen, every one of them offered over a game (RULES 4: all eight)', () => {
    expect([...OFFERED].sort()).toEqual([...MINI_IDS].sort());
    const seen = new Set<MiniId>(), played: MiniId[] = [];
    for (let k = 0; k < 40; k++) {
      const [a, b] = offer(played, seeded(`o${k}`), '4');
      expect(a).not.toBe(b);
      expect(OFFERED.includes(a) && OFFERED.includes(b)).toBe(true);
      seen.add(a).add(b);
      played.push(a);
    }
    expect([...seen].sort()).toEqual([...OFFERED].sort());
    // (the same random, the same two: every phone's fold)
    expect(offer(['market'], seeded('x'), '4')).toEqual(offer(['market'], seeded('x'), '4'));
  });
  it('a game on older rules (3, 2, none) offers the ★ four only, as it did', () => {
    for (const rules of ['3', '2', undefined]) {
      const seen = new Set<MiniId>(), played: MiniId[] = [];
      for (let k = 0; k < 20; k++) {
        const [a, b] = offer(played, seeded(`o${k}`), rules);
        seen.add(a).add(b);
        played.push(a);
      }
      expect([...seen].sort()).toEqual(['market', 'sort', 'spell', 'together']);
    }
    // (the first pick the same on either: a ★ one)
    expect(offer([], seeded('y'), '3')).toEqual(offer([], seeded('y'), '4'));
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
    // (a later wave's: only on rules that offer it)
    forceMini('reply');
    expect([offer([], seeded('f'), '4')[0], offer([], seeded('f'), '3')[0]]).toEqual(['reply', offer([], seeded('f'), '3')[0]]);
    expect(offer([], seeded('f'), '3')).not.toContain('reply');
    forceMini('dance' as MiniId);
    expect(forcedHere([])).toBe(false);
  });
});
