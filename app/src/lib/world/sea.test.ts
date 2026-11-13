// The sea creatures (world/sea.ts): NH's 40 with their months, hours, shadows and speeds; seasons weight the odds
// (never a gate); the pearl now and then; the dive: slow ones caught, quick ones dart (a second tap), the quickest
// sometimes get away.
import { describe, expect, it } from 'vitest';
import { mulberry32 } from '#lib/random.ts';
import { IN_SEASON, caption, oddsAt } from './critters.ts';
import { CHASE_MS, PEARL, PEARL_ODDS, SEA, dive, pickDive, speedOf, type SeaId } from './sea.ts';
import jaMain from '#lib/i18n/ja.json';
import enMain from '#lib/i18n/en.json';
import jaNames from '#lib/i18n/catch.ja.json';
import enNames from '#lib/i18n/catch.en.json';

const cats = [{ ...jaMain, ...jaNames }, { ...enMain, ...enNames }] as Record<string, string>[];

describe('the sea creatures', () => {
  it('are NH’s 40, each with a shadow (1–5), a speed, its NH months and a name in both languages', () => {
    expect(Object.keys(SEA)).toHaveLength(40);
    for (const [id, c] of Object.entries(SEA)) {
      expect(c.size, id).toBeGreaterThanOrEqual(1), expect(c.size, id).toBeLessThanOrEqual(5);
      expect(c.months.length, id).toBeGreaterThan(0);
      expect(c.weight, id).toBeGreaterThan(0);
      const cap = caption(id as SeaId);
      expect(cap).toEqual({ key: 'critter.caughtSea', name: `sea.name.${id}` });
      for (const cat of cats) expect(cat[cap.name!], id).toBeTruthy(), expect(cat[cap.key]).toBeTruthy();
    }
    expect(SEA['gigas-giant-clam']).toMatchObject({ size: 5, speed: 'very-fast' });
    expect(SEA.seaweed.speed).toBe('still');
    // rare = low weight: the gigas giant clam and the sea pig under the sea star
    expect(SEA['gigas-giant-clam'].weight).toBeLessThan(SEA['sea-star'].weight);
    expect(SEA['sea-pig'].weight).toBeLessThan(SEA['sea-star'].weight);
  });
  it('come in any month, 3× likelier in their NH months; their hours still hold (seeded)', () => {
    expect(oddsAt(SEA['spider-crab'], 3, 12)).toBe(SEA['spider-crab'].weight * IN_SEASON);
    expect(oddsAt(SEA['spider-crab'], 9, 12)).toBe(SEA['spider-crab'].weight);
    expect(oddsAt(SEA['firefly-squid'], 4, 12)).toBe(0); // 9 pm – 4 am
    expect(oddsAt(SEA['giant-isopod'], 8, 12)).toBeGreaterThan(0); // 9 am – 4 pm and 9 pm – 4 am
    expect(oddsAt(SEA['giant-isopod'], 8, 18)).toBe(0);
    const count = (id: SeaId, month: number) => {
      const r = mulberry32(month * 7 + 1);
      return Array.from({ length: 30_000 }, () => pickDive(month, 12, r)).filter((x) => x === id).length;
    };
    expect(count('sea-grapes', 1)).toBeGreaterThan(0); // NH: Jun–Sep, still possible in January
    expect(count('sea-grapes', 7) / count('sea-grapes', 1)).toBeGreaterThan(2);
  });
  it('now and then the bubbles are a pearl (1 in 25), a quick one (seeded)', () => {
    const r = mulberry32(3);
    const n = Array.from({ length: 25_000 }, () => pickDive(7, 12, r)).filter((x) => x === PEARL).length;
    expect(n / 25_000).toBeCloseTo(1 / PEARL_ODDS, 2);
    expect(speedOf(PEARL)).toBe('fast');
    for (const cat of cats) expect(cat['beach.name.pearl']).toBeTruthy();
  });
});

describe('the dive', () => {
  it('catches the still and slow ones at once, a medium one half the time, else it darts; a fast one always darts', () => {
    for (const s of ['still', 'very-slow', 'slow'] as const) for (const x of [0, 0.5, 0.99]) expect(dive(s, () => x)).toBe('catch');
    expect(dive('medium', () => 0.2)).toBe('catch');
    expect(dive('medium', () => 0.7)).toBe('chase');
    for (const x of [0, 0.5, 0.99]) expect(dive('fast', () => x)).toBe('chase');
  });
  it('a very fast one gets clean away 1 time in 3, else it darts with the shortest window', () => {
    expect(dive('very-fast', () => 0.1)).toBe('escape');
    expect(dive('very-fast', () => 0.5)).toBe('chase');
    expect(CHASE_MS['very-fast']).toBeLessThan(CHASE_MS.fast);
    expect(CHASE_MS.fast).toBeLessThan(CHASE_MS.medium);
    const r = mulberry32(8);
    const away = Array.from({ length: 9000 }, () => dive('very-fast', r)).filter((x) => x === 'escape').length;
    expect(away / 9000).toBeCloseTo(1 / 3, 1);
  });
});
