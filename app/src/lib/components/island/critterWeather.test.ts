// The critters and the weather (docs/design.md "Weather"), as NH: the coelacanth only in rain or snow, the snail only in
// the rain, NH's "any except rain" bugs (butterflies, moths, dragonflies, grasshoppers, crickets…) never in it.
import { describe, expect, it } from 'vitest';
import { BUGS, FISH, bushBug, oddsAt, pickBug, pickFish, type BugId } from '#lib/world/critters.ts';
import { mulberry32 } from '#lib/random.ts';

const pickMany = <T>(f: (r: () => number) => T, n = 4000) => {
  const r = mulberry32(7);
  return new Set(Array.from({ length: n }, () => f(r)));
};

describe('critters by the weather', () => {
  it('the coelacanth comes only in rain or snow', () => {
    expect(oddsAt(FISH.coelacanth, 6, 12)).toBe(0);
    for (const sky of ['rain', 'heavy', 'snow'] as const) expect(oddsAt(FISH.coelacanth, 6, 12, sky)).toBeGreaterThan(0);
    expect(pickMany((r) => pickFish(6, 12, r, 'clear'))).not.toContain('coelacanth');
    expect(pickMany((r) => pickFish(6, 12, r, 'rain'))).toContain('coelacanth');
  });

  it('the snail only in the rain (not in snow)', () => {
    expect(oddsAt(BUGS.snail, 6, 12)).toBe(0);
    expect(oddsAt(BUGS.snail, 6, 12, 'snow')).toBe(0);
    expect(oddsAt(BUGS.snail, 6, 12, 'heavy')).toBeGreaterThan(0);
    expect(pickMany((r) => pickBug(6, 12, r, 'rain'))).toContain('snail');
  });

  it('NH\'s 34 "any except rain" bugs stay away in the rain, and come back in snow', () => {
    const dry = (Object.keys(BUGS) as BugId[]).filter((k) => BUGS[k].weather === 'dry');
    expect(dry).toHaveLength(34);
    expect(dry).toEqual(expect.arrayContaining(['common-butterfly', 'moth', 'red-dragonfly', 'firefly', 'ladybug', 'mosquito', 'bell-cricket']));
    for (const k of dry) for (let h = 0; h < 24; h++) expect(oddsAt(BUGS[k], BUGS[k].months[0], h, 'rain')).toBe(0);
    const inRain = pickMany((r) => pickBug(6, 12, r, 'rain'));
    for (const k of dry) expect(inRain.has(k)).toBe(false);
    expect(oddsAt(BUGS.damselfly, 1, 12, 'snow')).toBeGreaterThan(0);
  });

  it('a shaken bush lets nothing out in the rain', () => {
    expect(pickMany((r) => bushBug(5, 12, r, 'rain'))).toEqual(new Set([null]));
    expect(pickMany((r) => bushBug(5, 12, r, 'clear')).size).toBeGreaterThan(1);
  });
});
