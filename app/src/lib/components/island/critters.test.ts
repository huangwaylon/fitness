import { describe, expect, it } from 'vitest';
import {
  BITE_WINDOW_MS, BUGS, CAST_U, FISH, HESITATE_MS, JUNK, NOTICE_U, bitePlan, bushBug, castPhase, caption, hesitatePlan,
  hookItem, inHours, netSwing, nextSpawnMs, pickBug, pickFish, reel, spawnKind, type BugId, type FishId
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
  it('bugs by month and hour: butterflies by day, fireflies on summer nights, crickets on autumn evenings, only moths on a winter night', () => {
    const about = (month: number, hour: number) => {
      const r = mulberry32(month * 100 + hour);
      return new Set(Array.from({ length: 4000 }, () => pickBug(month, hour, r)));
    };
    expect(about(5, 12).has('common-butterfly')).toBe(true);
    expect(about(7, 12).has('common-butterfly')).toBe(false); // NH: Sep–Jun
    expect(about(7, 21)).toEqual(new Set(['firefly', 'moth', 'emperor-butterfly']));
    expect(about(10, 20)).toEqual(new Set(['bell-cricket', 'cricket', 'moth']));
    expect(about(10, 12).has('red-dragonfly')).toBe(true);
    expect(about(1, 23)).toEqual(new Set(['moth']));
    expect(about(1, 18)).toEqual(new Set(['common-butterfly'])); // NH: 4 am – 7 pm, even in winter
  });
  it("NH's seasons for the new bugs (northern hemisphere, Nookipedia)", () => {
    const about = (month: number, hour: number) => {
      const r = mulberry32(month * 7 + hour);
      return new Set(Array.from({ length: 6000 }, () => pickBug(month, hour, r)));
    };
    const spring = about(4, 10);
    for (const id of ['common-butterfly', 'yellow-butterfly', 'tiger-butterfly', 'honeybee', 'ladybug', 'peacock-butterfly'] as BugId[])
      expect(spring.has(id), id).toBe(true);
    const summer = about(7, 10);
    for (const id of ['darner-dragonfly', 'banded-dragonfly', 'robust-cicada', 'grasshopper'] as BugId[]) expect(summer.has(id), id).toBe(true);
    expect(summer.has('red-dragonfly')).toBe(false); // late summer – autumn (Sep–Oct)
    expect(about(7, 17).has('evening-cicada')).toBe(true); // dawn and dusk only
    expect(about(7, 12).has('evening-cicada')).toBe(false);
    expect(about(7, 6).has('evening-cicada')).toBe(true);
    expect(about(8, 20).has('emperor-butterfly')).toBe(true); // a summer evening
    const autumn = about(10, 10);
    for (const id of ['red-dragonfly', 'rice-grasshopper', 'migratory-locust', 'mantis', 'orchid-mantis'] as BugId[]) expect(autumn.has(id), id).toBe(true);
    // winter: the common butterfly by day, moths at night; nothing tropical
    for (const m of [12, 1, 2]) {
      expect(about(m, 12)).toEqual(new Set(['common-butterfly']));
      expect(about(m, 21)).toEqual(new Set(['moth']));
    }
    // the cicada perches on a trunk; every flight is one of the five
    expect(BUGS['robust-cicada'].flight).toBe('perch');
    for (const b of Object.values(BUGS)) expect(['flutter', 'dart', 'drift', 'hop', 'perch']).toContain(b.flight);
  });
  it('a shaken bush: mostly nothing; a moth after dark; a butterfly (now and then a ladybug) by day', () => {
    expect(bushBug(5, 12, rolls(0.5))).toBeNull();
    expect(bushBug(5, 22, rolls(0.05))).toBe('moth');
    expect(bushBug(5, 12, rolls(0.05, 0.1))).toBe('ladybug');
    expect(BUGS[bushBug(5, 12, rolls(0.05, 0.9, 0))!].flight).toBe('flutter');
    expect(bushBug(7, 12, rolls(0.05, 0.9, 0))).toBe('tiger-butterfly'); // July: the common one is out of season
    expect(bushBug(5, 12, rolls(0.05, 0.9, 0.99))).toMatch(/-butterfly$/); // never a bee out of a bush
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
  it('a 1.6 s bite window; the cast reaches 1.5× as far as before, and the shadow notices a bobber that far', () => {
    expect(BITE_WINDOW_MS).toBe(1600);
    expect(CAST_U).toBe(195);
    expect(NOTICE_U).toBeGreaterThanOrEqual(CAST_U);
  });
  it('reeling on the bite catches it; a first early tap makes it hesitate, a second scares it off; late it flees', () => {
    const p = { arrive: 1000, nibbles: [1500, 2300], bite: 3000, window: BITE_WINDOW_MS };
    expect(reel(castPhase(p, 500))).toBe('hesitate'); // still swimming up
    expect(reel(castPhase(p, 1600))).toBe('hesitate'); // a nibble
    expect(reel(castPhase(p, 500), true)).toBe('flee'); // the second early tap
    expect(reel(castPhase(p, 1600), true)).toBe('flee');
    expect(reel(castPhase(p, 3000))).toBe('catch');
    expect(reel(castPhase(p, 4599))).toBe('catch');
    expect(reel(castPhase(p, 4599), true)).toBe('catch'); // a hesitant fish still bites in the end
    expect(reel(castPhase(p, 4600))).toBe('flee'); // too late
    expect(reel(castPhase(null, 5000))).toBe('reel');
  });
  it('a hesitating fish backs off, comes back, nibbles at least once, and bites later', () => {
    for (let s = 0; s < 200; s++) {
      const tap = 400 + (s % 7) * 500;
      const h = hesitatePlan(tap, mulberry32(s));
      expect(h.arrive).toBeGreaterThan(tap + HESITATE_MS);
      expect(h.nibbles.length).toBeGreaterThanOrEqual(1);
      expect(h.nibbles.length).toBeLessThanOrEqual(3);
      expect(h.nibbles.every((t) => t > h.arrive && t < h.bite)).toBe(true);
      expect(h.bite - tap).toBeLessThan(7000);
      expect(castPhase(h, tap + 1)).toBe('approach'); // a tap just after: the second early one (flees)
      expect(h.window).toBe(BITE_WINDOW_MS);
    }
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
