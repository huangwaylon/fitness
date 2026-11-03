import { describe, expect, it } from 'vitest';
import {
  BITE_WINDOW_MS, BUGS, CAST_U, FISH, HESITATE_MS, JUNK, NOTICE_U, bitePlan, bushBug, castPhase, caption, hesitatePlan,
  fleaJumps, hookItem, IN_SEASON, inHours, netSwing, oddsAt, pickBug, pickFish, reel, stalkTap, castInto, waterAt, shadowLen, POND_SHADOW,
  FRESH, SEA_SWIM, bugPlace, freshAreas, patches, perches, swimAt, type BugId, type FishId
} from './critters.ts';
import { mulberry32 } from '#lib/random.ts';
import { CLIFF, POND, RIVER, SCENERY, SEA_BOX, SPRING, freshWhere, inOval, inRiver, riverNear, surfaceAt } from './world.ts';
import jaMain from '#lib/i18n/ja.json';
import enMain from '#lib/i18n/en.json';
import jaNames from '#lib/i18n/catch.ja.json';
import enNames from '#lib/i18n/catch.en.json';

const ja = { ...jaMain, ...jaNames };
const en = { ...enMain, ...enNames };

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
  it("every NH sea and pier fish (34), with NH's shadows: the eels narrow, the sharks, the sunfish and the suckerfish with a fin", () => {
    expect(Object.keys(FISH)).toHaveLength(34);
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
  it("NH's two puffers: the blowfish (フグ) on winter nights, the puffer fish (ハリセンボン) all day in summer", () => {
    expect(FISH.blowfish).toMatchObject({ months: [11, 12, 1, 2], hours: [21, 4], size: 3 });
    expect(FISH['puffer-fish']).toMatchObject({ months: [7, 8, 9], hours: [0, 24], size: 3 });
    expect(oddsAt(FISH.blowfish, 12, 12)).toBe(0);
    expect(oddsAt(FISH.blowfish, 12, 23)).toBe(FISH.blowfish.weight * IN_SEASON);
    expect(oddsAt(FISH['puffer-fish'], 8, 12)).toBe(FISH['puffer-fish'].weight * IN_SEASON);
  });
  it('a shark keeps to its NH hours (4 pm – 9 am) and is likelier in summer, never a gate', () => {
    expect(oddsAt(FISH['great-white-shark'], 7, 12)).toBe(0);
    expect(oddsAt(FISH['great-white-shark'], 7, 20)).toBe(FISH['great-white-shark'].weight * IN_SEASON);
    expect(oddsAt(FISH['great-white-shark'], 1, 20)).toBe(FISH['great-white-shark'].weight);
    const r = mulberry32(11);
    const seen = new Set(Array.from({ length: 60_000 }, () => pickFish(1, 22, r)));
    expect(seen.has('whale-shark')).toBe(true);
    expect(seen.has('coelacanth')).toBe(false); // rain or snow only (critterWeather.test.ts)
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
    // NH's flower bugs sit on a flower's head: the ladybug and the mantises
    for (const id of ['ladybug', 'mantis', 'orchid-mantis'] as BugId[]) expect(BUGS[id].flight, id).toBe('flower');
    for (const b of Object.values(BUGS)) expect(['flutter', 'dart', 'drift', 'flower', 'hop', 'perch', 'crawl', 'stalk', 'burrow', 'dangle']).toContain(b.flight);
  });
  it('74 NH bugs: the beetles and cicadas on the trunks, crawlers on the beach, the grass, the beds and the water (and the wasp of a shaken nest)', () => {
    expect(Object.keys(BUGS)).toHaveLength(74);
    // the pond's three keep to its water, in NH's months and hours (the giant water bug at night)
    for (const id of ['pondskater', 'diving-beetle', 'giant-water-bug'] as BugId[]) expect(BUGS[id].ground, id).toBe('pond');
    expect(oddsAt(BUGS.pondskater, 7, 12)).toBe(BUGS.pondskater.weight * IN_SEASON);
    expect(oddsAt(BUGS['giant-water-bug'], 7, 12)).toBe(0);
    expect(oddsAt(BUGS['giant-water-bug'], 7, 22)).toBe(BUGS['giant-water-bug'].weight * IN_SEASON);
    for (const id of ['walker-cicada', 'brown-cicada', 'giant-cicada', 'saw-stag', 'rainbow-stag', 'horned-dynastid', 'goliath-beetle', 'drone-beetle'] as BugId[])
      expect(BUGS[id].flight, id).toBe('perch');
    expect(BUGS['hermit-crab']).toMatchObject({ flight: 'crawl', ground: 'beach' });
    expect(BUGS['wharf-roach']).toMatchObject({ flight: 'crawl', ground: 'beach' });
    expect(BUGS['pill-bug'].ground).toBe('rock'); // NH: out from under a hit rock
    expect(BUGS.snail.ground).toBe('bush'); // NH: on rocks and bushes, in the rain
    for (const b of Object.values(BUGS)) expect(b.flight === 'crawl', JSON.stringify(b)).toBe(!!b.ground);
    // day and night still hold: the Goliath beetle and the Atlas moth are night bugs, the paper kite a day one
    expect(oddsAt(BUGS['goliath-beetle'], 7, 12)).toBe(0);
    expect(oddsAt(BUGS['goliath-beetle'], 7, 22)).toBeGreaterThan(0);
    expect(oddsAt(BUGS['atlas-moth'], 1, 22)).toBe(BUGS['atlas-moth'].weight); // weighted, not gated by the month
    expect(oddsAt(BUGS['paper-kite-butterfly'], 7, 22)).toBe(0);
    expect(BUGS['queen-alexandras-birdwing'].weight).toBeLessThan(BUGS['paper-kite-butterfly'].weight);
  });
  it('the rest of NH’s bugs: on the trunks, the flowers and the ground, the mole cricket under the lawn, the night’s tarantula and scorpion', () => {
    for (const id of ['violin-beetle', 'citrus-long-horned-beetle', 'rosalia-batesi-beetle', 'scarab-beetle'] as BugId[]) expect(BUGS[id].flight, id).toBe('perch');
    for (const id of ['stinkbug', 'man-faced-stink-bug'] as BugId[]) expect(BUGS[id], id).toMatchObject({ flight: 'crawl', ground: 'beds' });
    for (const id of ['tiger-beetle', 'earth-boring-dung-beetle'] as BugId[]) expect(BUGS[id], id).toMatchObject({ flight: 'crawl', ground: 'grass' });
    expect(BUGS['walking-leaf']).toMatchObject({ flight: 'crawl', ground: 'tree' }); // NH: disguised under trees
    expect(BUGS['mole-cricket'].flight).toBe('burrow');
    for (const id of ['tarantula', 'scorpion'] as BugId[]) {
      expect(BUGS[id].flight).toBe('stalk');
      expect(oddsAt(BUGS[id], 1, 12), id).toBe(0); // nights only (7 pm – 4 am)
      expect(oddsAt(BUGS[id], 1, 23), id).toBeGreaterThan(0);
      expect(BUGS[id].weight, id).toBeLessThan(BUGS.cricket.weight); // rare
    }
    // the tarantula is winter's (NH: Nov–Apr), the scorpion summer's (May–Oct): a flavour, never a gate
    expect(oddsAt(BUGS.tarantula, 1, 22)).toBe(BUGS.tarantula.weight * IN_SEASON);
    expect(oddsAt(BUGS.tarantula, 7, 22)).toBe(BUGS.tarantula.weight);
    expect(oddsAt(BUGS.scorpion, 7, 22)).toBe(BUGS.scorpion.weight * IN_SEASON);
    expect(oddsAt(BUGS['man-faced-stink-bug'], 5, 12)).toBe(0); // night only
    expect(oddsAt(BUGS['scarab-beetle'], 7, 2)).toBeGreaterThan(0); // 11 pm – 8 am
    expect(oddsAt(BUGS['madagascan-sunset-moth'], 6, 17)).toBe(0); // 8 am – 4 pm
    // seen in a night of visits in winter: the tarantula, now and then
    const r = mulberry32(21);
    const seen = new Set(Array.from({ length: 30_000 }, () => pickBug(1, 22, r)));
    expect(seen.has('tarantula')).toBe(true);
    expect(seen.has('scorpion')).toBe(true); // out of season, still possible
  });
  it("NH's palm beetles on the palms (5: the Goliath, the cyclommatus and golden stags, the horned atlas and elephant), summer nights", () => {
    const palm = (Object.keys(BUGS) as BugId[]).filter((id) => BUGS[id].tree === 'palm').sort();
    expect(palm).toEqual(['cyclommatus-stag', 'golden-stag', 'goliath-beetle', 'horned-atlas', 'horned-elephant']);
    for (const id of palm) {
      expect(BUGS[id].flight, id).toBe('perch');
      expect(bugPlace(id), id).toBe('palm');
      expect(BUGS[id].hours, id).toEqual([17, 8]); // NH: 5 pm – 8 am
      expect(oddsAt(BUGS[id], 7, 22), id).toBe(BUGS[id].weight * IN_SEASON);
      expect(oddsAt(BUGS[id], 7, 12), id).toBe(0);
    }
    for (const id of ['cyclommatus-stag', 'golden-stag', 'horned-atlas', 'horned-elephant'] as BugId[]) expect(BUGS[id].months, id).toEqual([7, 8]);
    expect(BUGS['goliath-beetle'].months).toEqual([6, 7, 8, 9]);
    // NH's golden stag sells for 12,000 against the others' 8,000: the rarest
    expect(BUGS['golden-stag'].weight).toBeLessThan(BUGS['horned-atlas'].weight);
    expect(bugPlace('rainbow-stag')).toBe('trunk');
  });
  it("where NH keeps each bug: trunks, palms, flowers, lamps, near water, the grass, the beach, the water, the rock, under trees, bushes", () => {
    expect(bugPlace('robust-cicada')).toBe('trunk');
    expect(bugPlace('jewel-beetle')).toBe('trunk'); // NH's stumps: the island has none
    expect(bugPlace('ladybug')).toBe('flower');
    expect(bugPlace('common-butterfly')).toBe('flowers');
    expect(bugPlace('moth')).toBe('lights');
    for (const id of ['darner-dragonfly', 'red-dragonfly', 'damselfly', 'firefly'] as BugId[]) expect(bugPlace(id), id).toBe('water-air');
    for (const id of ['grasshopper', 'tarantula', 'mole-cricket', 'tiger-beetle'] as BugId[]) expect(bugPlace(id), id).toBe('grass');
    expect(bugPlace('hermit-crab')).toBe('beach');
    expect(bugPlace('stinkbug')).toBe('beds');
    expect(bugPlace('pondskater')).toBe('water');
    expect(bugPlace('pill-bug')).toBe('rock');
    expect(bugPlace('walking-leaf')).toBe('under-tree');
    expect(bugPlace('snail')).toBe('bush');
    // every place has somewhere in the world
    for (const id of Object.keys(BUGS) as BugId[]) {
      const pl = bugPlace(id);
      if (pl === 'trunk' || pl === 'palm') expect(perches(pl === 'palm').length, id).toBeGreaterThan(0);
      else if (pl !== 'flower') expect(patches(pl).length, id).toBeGreaterThan(0);
    }
  });
  it('the trunks: palms for the palm beetles, the hardwood and cedar trunks for the rest, up the bare trunk', () => {
    const palms = perches(true), trees = perches(false);
    expect(palms.map((p) => p.tree).sort()).toEqual(SCENERY.filter((s) => s.kind === 'palm').map((s) => s.id).sort());
    expect(trees.some((p) => p.tree === 'goal-A') && trees.some((p) => p.tree === 'goal-B')).toBe(true);
    expect(trees.every((p) => !/palm/.test(p.tree))).toBe(true);
    for (const p of [...palms, ...trees]) expect(p.lift / p.h, p.tree).toBeLessThan(0.45);
  });
  it('the ground bugs keep to their ground: the beach on the sand, the lawn on the grass, the water bugs on the water', () => {
    const r = mulberry32(3);
    const inside = (pl: Parameters<typeof patches>[0], test: (x: number, z: number) => boolean) => {
      let n = 0, hit = 0;
      for (const a of patches(pl)) for (let i = 0; i < 40; i++, n++) if (test(a.x0 + r() * (a.x1 - a.x0), a.z0 + r() * (a.z1 - a.z0))) hit++;
      return hit / n;
    };
    expect(inside('beach', (x, z) => surfaceAt(x, z) === 'sand')).toBeGreaterThan(0.9);
    expect(inside('grass', (x, z) => ['grass', 'dirt'].includes(surfaceAt(x, z)))).toBeGreaterThan(0.9);
    expect(inside('water', (x, z) => waterAt(x, z, false, 0) !== null)).toBe(1);
  });
  it('a tarantula or a scorpion: the first tap makes it rear up; a tap while reared and it charges; settled, a tap nets it', () => {
    expect(stalkTap('calm', 'catch')).toBe('rear'); // came at it too fast
    expect(stalkTap('calm', 'startle')).toBe('rear');
    expect(stalkTap('calm', 'none')).toBe('none');
    expect(stalkTap('rear', 'catch')).toBe('charge');
    expect(stalkTap('rear', 'startle')).toBe('charge');
    expect(stalkTap('rear', 'none')).toBe('none');
    expect(stalkTap('settled', 'catch')).toBe('catch');
    expect(stalkTap('settled', 'startle')).toBe('rear');
  });
  it('a flea hops off my villager 1 in 10 taps in its NH months (Apr–Nov), 1 in 30 out of them (seeded)', () => {
    const rate = (month: number) => {
      const r = mulberry32(month);
      return Array.from({ length: 30_000 }, () => fleaJumps(month, r)).filter(Boolean).length / 30_000;
    };
    expect(rate(7)).toBeCloseTo(1 / 10, 1);
    expect(rate(1)).toBeCloseTo(1 / 30, 2);
    expect(BUGS.flea.weight).toBe(0); // never about on its own
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

describe('fishing', () => {
  it('a plan: the swim up, 1–3 nibbles, then the bite with its window', () => {
    for (let s = 0; s < 200; s++) {
      const p = bitePlan(NOTICE_U * (s % 3) / 2, mulberry32(s));
      expect(p.nibbles.length).toBeLessThanOrEqual(3);
      expect(p.nibbles.length).toBeGreaterThanOrEqual(1);
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

describe('the waters (world units): the sea, the pond, the river, its mouth, the clifftop', () => {
  it('a tap in the pond is the pond, on the stream the river (its mouth on the west beach, the clifftop at the falls’ pool and above the cliff), off the island the sea, on the land neither', () => {
    expect(waterAt(POND.x, POND.z, false)).toBe('pond');
    expect(waterAt(POND.x + POND.rx + 8, POND.z, false)).toBe('pond'); // a finger's slack round the rim
    expect(waterAt(POND.x + POND.rx + 30, POND.z, false)).toBeNull();
    expect(waterAt(RIVER[6][0], RIVER[6][1], false)).toBe('river');
    expect(waterAt(RIVER[12][0], RIVER[12][1], false)).toBe('river'); // the reach across, beside the bridge
    expect(waterAt(195, 560, false)).toBeNull();
    expect(waterAt(RIVER[18][0], RIVER[18][1], false)).toBe('mouth');
    expect(waterAt(RIVER[1][0], RIVER[1][1], false)).toBe('clifftop');
    expect(waterAt(372, CLIFF.z0 - 20, false)).toBe('clifftop'); // the falls' pool
    expect(waterAt(SPRING.x, SPRING.z, false)).toBe('clifftop'); // the spring
    expect(waterAt(195, -60, true)).toBe('sea');
    expect(waterAt(195, 400, false)).toBeNull();
  });
  it("every fresh water's swim patches lie in that water (NH's locations by where you cast)", () => {
    for (const wh of FRESH) {
      const areas = freshAreas(wh);
      expect(areas.length, wh).toBeGreaterThan(0);
      for (const a of areas) {
        expect(freshWhere(a.cx, a.cz), `${wh} ${a.cx},${a.cz}`).toBe(wh);
        if (wh === 'river' || wh === 'mouth') for (const [s, t] of [[1, 1], [-1, -1], [1, -1], [-1, 1]]) {
          const p = swimAt(a, s, t);
          expect(inRiver(p.x, p.z), `${wh} ${p.x},${p.z}`).toBe(true);
        }
      }
    }
    // the river: the reach below the falls' pool, down to the bend
    const river = freshAreas('river');
    expect(river.some((a) => a.cz > 900 && a.cx > 350)).toBe(true);
    expect(river.some((a) => a.cz < 800)).toBe(true);
    // the clifftop's shadows swim in the falls' pool, in view (the upper tier is beyond the horizon)
    for (const a of freshAreas('clifftop')) expect(a.cz).toBeLessThan(CLIFF.z0);
    // the sea's water is in front of the front beach
    const p = swimAt(SEA_SWIM, 0, 1);
    expect(p.z).toBeLessThan(-10);
    expect(SEA_SWIM.cx - SEA_SWIM.L).toBe(SEA_BOX.x0);
  });
  it('a cast lands inside the water, clear of its edge', () => {
    for (const [x, z] of [[POND.x, POND.z], [POND.x + POND.rx + 6, POND.z], [POND.x - 30, POND.z - 20]]) {
      const c = castInto('pond', x, z);
      expect(inOval(POND, c.x, c.z, -POND.rz * 0.2), `${x},${z}`).toBe(true);
    }
    for (const [x, z] of [[RIVER[6][0] + 20, RIVER[6][1]], [RIVER[8][0] - 20, RIVER[8][1]], [RIVER[11][0], RIVER[11][1] - 30]]) {
      const c = castInto(freshWhere(x, z) === 'mouth' ? 'mouth' : 'river', x, z), r = riverNear(c.x, c.z);
      expect(r.d, `${x},${z}`).toBeLessThanOrEqual(r.hw * 0.56);
    }
    expect(castInto('sea', 195, -2).z).toBeLessThanOrEqual(-10);
  });
});

describe('fish shadows', () => {
  it("NH's sizes 1–6 as one teardrop each, the eels long and thin", () => {
    expect([1, 2, 3, 4, 5, 6].map((n) => shadowLen(n))).toEqual([20, 26, 32, 40, 48, 64]);
    expect(shadowLen(3, 'narrow')).toBe(44);
    expect(shadowLen(6, 'fin')).toBe(64);
    expect(shadowLen(9)).toBe(64);
    expect(shadowLen(6) * POND_SHADOW).toBeLessThan(POND.rx * 2 * 0.55 + 10); // a size 6 still fits the pond's open middle
  });
});
