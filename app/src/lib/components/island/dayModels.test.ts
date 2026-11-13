// The day's find and weed keys (dayModels.ts): the models Island3D asks for with its first wave are the ones Finds and
// Care will draw today.
import { describe, expect, test } from 'vitest';
import { dayFindKeys, weedArt } from './dayModels.ts';
import { digSpots, findArt, shellsAt } from './beach.ts';
import { mushroomsOn } from './mushrooms.ts';
import { weedsAt } from './care.ts';

const NOON = 12 * 3600_000;

describe('dayFindKeys', () => {
  test("a November noon: the season's weed, the dig spot, the day's mushrooms and shells", () => {
    const keys = dayFindKeys('2026-11-13', NOON, 'autumn');
    expect(weedsAt('2026-11-13', NOON).length).toBeGreaterThan(0);
    expect(keys).toContain('finds/weed-fall');
    expect(digSpots('2026-11-13', new Set()).length).toBeGreaterThan(0);
    expect(keys).toContain('finds/dig-spot');
    for (const m of mushroomsOn('2026-11-13')) expect(keys).toContain(findArt(m.id));
    for (const s of shellsAt('2026-11-13', NOON)) expect(keys).toContain(findArt(s.id));
    expect(keys).toContain(findArt('rock'));
    expect(keys).toContain('fruit/apple');
  });
  test("the weed's model by season (Care's)", () => {
    expect(weedArt('autumn')).toBe('finds/weed-fall');
    expect(weedArt('winter')).toBe('finds/weed-winter');
  });
});
