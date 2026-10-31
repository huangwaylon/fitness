import { describe, expect, it } from 'vitest';
import {
  BITE_WINDOW_MS, BUGS, CAST_U, FISH, HESITATE_MS, JUNK, NOTICE_U, bitePlan, bushBug, castPhase, caption, hesitatePlan,
  hookItem, IN_SEASON, inHours, netSwing, oddsAt, nextSpawnMs, pickBug, pickFish, reel, spawnKind, type BugId, type FishId
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
  it('every fish can come in any month; its NH months make it 3× likelier', () => {
    const count = (id: FishId, month: number) => {
      const r = mulberry32(month * 31 + 7);
      return Array.from({ length: 20_000 }, () => pickFish(month, 12, r)).filter((f) => f === id).length;
    };
    expect(count('sea-butterfly', 7)).toBeGreaterThan(0); // NH: Dec–Mar, still possible in July
    const ratio = count('sea-butterfly', 1) / count('sea-butterfly', 7);
    expect(ratio).toBeGreaterThan(2);
    expect(oddsAt(FISH['sea-butterfly'], 1, 12)).toBe(FISH['sea-butterfly'].weight * IN_SEASON);
    expect(oddsAt(FISH.anchovy, 12, 22)).toBe(0); // its hours still hold: 4 am – 9 pm
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
  it("every NH sea and pier fish (33), with NH's shadows: the eels narrow, the sharks, the sunfish and the suckerfish with a fin", () => {
    expect(Object.keys(FISH)).toHaveLength(33);
    for (const id of ['ribbon-eel', 'moray-eel'] as FishId[]) expect(FISH[id].shape).toBe('narrow');
    for (const id of ['saw-shark', 'hammerhead-shark', 'great-white-shark', 'whale-shark', 'ocean-sunfish', 'suckerfish'] as FishId[])
      expect(FISH[id].shape, id).toBe('fin');
    for (const f of Object.values(FISH)) expect(f.size).toBeGreaterThanOrEqual(1), expect(f.size).toBeLessThanOrEqual(6);
    expect(FISH['sea-horse'].size).toBe(1);
    expect(FISH['whale-shark'].size).toBe(6);
    // rare = a low weight: the coelacanth is the rarest, every shark under the reef fish
    const w = Object.values(FISH).map((f) => f.weight);
    expect(FISH.coelacanth.weight).toBe(Math.min(...w));
    expect(FISH['great-white-shark'].weight).toBeLessThan(FISH.clownfish.weight);
  });
  it('a shark keeps to its NH hours (4 pm – 9 am) and is likelier in summer, never a gate', () => {
    expect(oddsAt(FISH['great-white-shark'], 7, 12)).toBe(0);
    expect(oddsAt(FISH['great-white-shark'], 7, 20)).toBe(FISH['great-white-shark'].weight * IN_SEASON);
    expect(oddsAt(FISH['great-white-shark'], 1, 20)).toBe(FISH['great-white-shark'].weight);
    const r = mulberry32(11);
    const seen = new Set(Array.from({ length: 60_000 }, () => pickFish(1, 22, r)));
    expect(seen.has('whale-shark')).toBe(true);
    expect(seen.has('coelacanth')).toBe(true);
  });
  it('bugs: any month, only in their hours (day bugs by day, fireflies and moths at night); in season 3× likelier', () => {
    const seen = (month: number, hour: number) => {
      const r = mulberry32(month * 100 + hour);
      return new Set(Array.from({ length: 6000 }, () => pickBug(month, hour, r)));
    };
    expect(seen(1, 12).has('honeybee')).toBe(true); // NH: Mar–Jul, now a flavour, not a gate
    expect(seen(1, 22).has('firefly')).toBe(true);
    expect(seen(7, 12).has('firefly')).toBe(false); // night only
    expect(seen(7, 22).has('honeybee')).toBe(false); // day only
    expect(seen(7, 17).has('evening-cicada')).toBe(true); // dawn and dusk
    expect(seen(7, 12).has('evening-cicada')).toBe(false);
    expect(oddsAt(BUGS['red-dragonfly'], 10, 12)).toBe(BUGS['red-dragonfly'].weight * IN_SEASON);
    expect(oddsAt(BUGS['red-dragonfly'], 4, 12)).toBe(BUGS['red-dragonfly'].weight);
    expect(BUGS['robust-cicada'].flight).toBe('perch');
    for (const b of Object.values(BUGS)) expect(['flutter', 'dart', 'drift', 'hop', 'perch', 'crawl']).toContain(b.flight);
  });
  it('48 NH bugs: the beetles and cicadas on the trunks, crawlers on the beach, the grass and the beds (and the wasp of a shaken nest)', () => {
    expect(Object.keys(BUGS)).toHaveLength(48);
    for (const id of ['walker-cicada', 'brown-cicada', 'giant-cicada', 'saw-stag', 'rainbow-stag', 'horned-dynastid', 'goliath-beetle', 'drone-beetle'] as BugId[])
      expect(BUGS[id].flight, id).toBe('perch');
    expect(BUGS['hermit-crab']).toMatchObject({ flight: 'crawl', ground: 'beach' });
    expect(BUGS['wharf-roach']).toMatchObject({ flight: 'crawl', ground: 'beach' });
    expect(BUGS['pill-bug'].ground).toBe('grass');
    expect(BUGS.snail.ground).toBe('beds');
    for (const b of Object.values(BUGS)) expect(b.flight === 'crawl', JSON.stringify(b)).toBe(!!b.ground);
    // day and night still hold: the Goliath beetle and the Atlas moth are night bugs, the paper kite a day one
    expect(oddsAt(BUGS['goliath-beetle'], 7, 12)).toBe(0);
    expect(oddsAt(BUGS['goliath-beetle'], 7, 22)).toBeGreaterThan(0);
    expect(oddsAt(BUGS['atlas-moth'], 1, 22)).toBe(BUGS['atlas-moth'].weight); // weighted, not gated by the month
    expect(oddsAt(BUGS['paper-kite-butterfly'], 7, 22)).toBe(0);
    expect(BUGS['queen-alexandras-birdwing'].weight).toBeLessThan(BUGS['paper-kite-butterfly'].weight);
  });
  it('a shaken bush: a bug 1 in 3 (a moth after dark; a butterfly, now and then a ladybug, by day)', () => {
    expect(bushBug(5, 12, rolls(0.5))).toBeNull();
    expect(bushBug(5, 22, rolls(0.05))).toBe('moth');
    expect(bushBug(5, 12, rolls(0.05, 0.1))).toBe('ladybug');
    expect(BUGS[bushBug(5, 12, rolls(0.05, 0.9, 0))!].flight).toBe('flutter');
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
  it('come often: every 8–15 s of on-screen time (the first after 3–6 s)', () => {
    expect(nextSpawnMs(() => 0)).toBe(8_000);
    expect(nextSpawnMs(() => 0.999)).toBeLessThan(15_000);
    expect(nextSpawnMs(() => 0, true)).toBe(3_000);
    expect(nextSpawnMs(() => 0.999, true)).toBeLessThan(6_000);
  });
  it('at most one fish and one bug at a time', () => {
    expect(spawnKind({ fish: true, bug: true }, true, () => 0)).toBeNull();
    expect(spawnKind({ fish: true, bug: false }, true, () => 0)).toBe('bug');
    expect(spawnKind({ fish: false, bug: true }, true, () => 0.9)).toBe('fish');
    expect(spawnKind({ fish: false, bug: false }, false, () => 0.9)).toBe('fish'); // nobody about: the sea still has fish
    expect(spawnKind({ fish: true, bug: false }, false, () => 0)).toBeNull();
    expect(spawnKind({ fish: true, bug: false }, true, () => 0.5)).toBe('bug'); // most visits bring a bug
    expect(spawnKind({ fish: true, bug: false }, true, () => 0.9)).toBeNull(); // a little air between them
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
