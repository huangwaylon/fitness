import { describe, expect, it } from 'vitest';
import {
  BITE_WINDOW_MS, BUGS, FISH, JUNK, NOTICE_U, bitePlan, bushBug, castPhase, caption, hookItem, inHours, netSwing,
  nextSpawnMs, pickBug, pickFish, reel, spawnKind, type BugId, type FishId
} from './critters.ts';
import { mulberry32 } from '#lib/random.ts';
import ja from '#lib/i18n/ja.json';
import en from '#lib/i18n/en.json';

/** A sequence of fixed rolls (then 0.5s). */
const rolls = (...xs: number[]) => () => (xs.length ? xs.shift()! : 0.5);

describe('seasons and hours (NH, northern hemisphere)', () => {
  it('wraps the hours past midnight', () => {
    expect(inHours([19, 4], 23)).toBe(true);
    expect(inHours([19, 4], 3)).toBe(true);
    expect(inHours([19, 4], 4)).toBe(false);
    expect(inHours([4, 19], 18)).toBe(true);
    expect(inHours([4, 19], 19)).toBe(false);
    expect(inHours([0, 24], 0)).toBe(true);
  });
  it('keeps each fish to its months', () => {
    const seen = (month: number, hour = 12) => {
      const r = mulberry32(month * 31 + hour);
      return new Set(Array.from({ length: 4000 }, () => pickFish(month, hour, r)));
    };
    expect(seen(1).has('sea-butterfly')).toBe(true);
    expect(seen(7).has('sea-butterfly')).toBe(false);
    expect(seen(7).has('barred-knifejaw')).toBe(true);
    expect(seen(1).has('barred-knifejaw')).toBe(false);
    expect(seen(9).has('squid')).toBe(false);
    expect(seen(12, 22).has('anchovy')).toBe(false); // 4 am – 9 pm
  });
  it('the sea bass is the most common catch, every month', () => {
    for (let m = 1; m <= 12; m++) {
      const r = mulberry32(m);
      const n: Partial<Record<FishId, number>> = {};
      for (let i = 0; i < 3000; i++) {
        const f = pickFish(m, 12, r);
        n[f] = (n[f] ?? 0) + 1;
      }
      const top = Object.entries(n).sort((a, b) => b[1] - a[1])[0][0];
      expect(top, `month ${m}`).toBe('sea-bass');
    }
  });
  it('bugs by month and hour: butterflies by day, fireflies on summer nights, crickets on autumn evenings, nobody on a winter night', () => {
    const about = (month: number, hour: number) => {
      const r = mulberry32(month * 100 + hour);
      return new Set(Array.from({ length: 2000 }, () => pickBug(month, hour, r)));
    };
    expect(about(5, 12).has('common-butterfly')).toBe(true);
    expect(about(7, 12).has('common-butterfly')).toBe(false); // NH: Sep–Jun
    expect(about(7, 21)).toEqual(new Set(['firefly']));
    expect(about(10, 20)).toEqual(new Set(['bell-cricket', 'cricket']));
    expect(about(10, 12).has('red-dragonfly')).toBe(true);
    expect(about(1, 23)).toEqual(new Set([null]));
    // the moth and the ladybug only come out of a bush
    for (let m = 1; m <= 12; m++) for (let h = 0; h < 24; h++) {
      const s = about(m, h);
      expect(s.has('moth') || s.has('ladybug')).toBe(false);
    }
  });
  it('a shaken bush: mostly nothing; a moth after dark; a butterfly (now and then a ladybug) by day', () => {
    expect(bushBug(5, 12, rolls(0.5))).toBeNull();
    expect(bushBug(5, 22, rolls(0.05))).toBe('moth');
    expect(bushBug(5, 12, rolls(0.05, 0.1))).toBe('ladybug');
    expect(BUGS[bushBug(5, 12, rolls(0.05, 0.9, 0))!].flight).toBe('flutter');
    expect(bushBug(7, 12, rolls(0.05, 0.9, 0))).toBe('tiger-butterfly'); // July: the common one is out of season
  });
  it('1 in 14 a piece of junk instead of the fish', () => {
    const r = mulberry32(7);
    let junk = 0;
    for (let i = 0; i < 14_000; i++) if ((JUNK as readonly string[]).includes(hookItem('sea-bass', r))) junk++;
    expect(junk).toBeGreaterThan(800);
    expect(junk).toBeLessThan(1200);
  });
});

describe('visits', () => {
  it('come every 1–3 minutes of on-screen time (the first sooner)', () => {
    expect(nextSpawnMs(() => 0)).toBe(15_000);
    expect(nextSpawnMs(() => 0.999)).toBeLessThan(40_000);
    expect(nextSpawnMs(() => 0, true)).toBe(5_000);
    expect(nextSpawnMs(() => 0.999, true)).toBeLessThan(12_000);
  });
  it('at most one fish and one bug at a time', () => {
    expect(spawnKind({ fish: true, bug: true }, true, () => 0)).toBeNull();
    expect(spawnKind({ fish: true, bug: false }, true, () => 0)).toBe('bug');
    expect(spawnKind({ fish: false, bug: true }, true, () => 0.9)).toBe('fish');
    expect(spawnKind({ fish: false, bug: false }, false, () => 0.9)).toBe('fish'); // nobody about: the sea still has fish
    expect(spawnKind({ fish: true, bug: false }, false, () => 0)).toBeNull();
    expect(spawnKind({ fish: true, bug: false }, true, () => 0.5)).toBeNull(); // bugs: only 1 visit in 4
  });
});

describe('fishing', () => {
  it('a plan: the swim up, 0–3 nibbles, then the bite with its window', () => {
    for (let s = 0; s < 200; s++) {
      const p = bitePlan(NOTICE_U * (s % 3) / 2, mulberry32(s));
      expect(p.nibbles.length).toBeLessThanOrEqual(3);
      expect(p.nibbles.every((t) => t > p.arrive && t < p.bite)).toBe(true);
      expect(p.bite).toBeGreaterThan(p.arrive);
      expect(p.bite).toBeLessThan(8000);
      expect(p.window).toBe(BITE_WINDOW_MS);
    }
  });
  it('reeling on the bite catches it; early or late it flees; with nobody interested the line comes back', () => {
    const p = { arrive: 1000, nibbles: [1500, 2300], bite: 3000, window: 1000 };
    expect(reel(castPhase(p, 500))).toBe('flee'); // still swimming up
    expect(reel(castPhase(p, 1600))).toBe('flee'); // a nibble
    expect(reel(castPhase(p, 3000))).toBe('catch');
    expect(reel(castPhase(p, 3999))).toBe('catch');
    expect(reel(castPhase(p, 4000))).toBe('flee'); // too late
    expect(reel(castPhase(null, 5000))).toBe('reel');
  });
});

describe('the net', () => {
  it('on the bug catches it (a 44px target at least), close by startles it, further away nothing', () => {
    expect(netSwing(20, 10)).toBe('catch');
    expect(netSwing(30, 50)).toBe('catch');
    expect(netSwing(40, 10)).toBe('startle');
    expect(netSwing(120, 10)).toBe('none');
  });
});

describe('captions', () => {
  it("NH's lines, in both languages, for every catch", () => {
    const ids = [...Object.keys(FISH), ...JUNK, ...Object.keys(BUGS)] as (FishId | BugId)[];
    for (const id of ids) {
      const c = caption(id);
      for (const cat of [ja, en] as Record<string, string>[]) {
        expect(cat[c.key], `${id} ${c.key}`).toBeDefined();
        if (c.name) expect(cat[c.name], `${id} ${c.name}`).toBeDefined();
      }
    }
    expect(caption('sea-bass').key).toBe('critter.seaBass');
    expect(caption('boot').key).toBe('critter.junk.boot');
    expect(caption('squid')).toEqual({ key: 'critter.caughtFish', name: 'critter.name.squid' });
    expect(caption('firefly')).toEqual({ key: 'critter.caughtBug', name: 'critter.name.firefly' });
  });
});
