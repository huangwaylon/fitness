import { describe, expect, it } from 'vitest';
import { crittersAt, slotStart, SLOTS_PER_DAY } from './ambient.ts';
import { BUGS, FRESH, bugPlace, patches, perches, type BugId } from './critters.ts';
import { FLOWER_HEADS, bubblesAt, bugPath, critterId, fishPath, freshWater, groundOk, inWater, legAt } from './critterPath.ts';

const DATE = '2026-11-04';

describe('the critters where both phones see them (from the spawn alone)', () => {
  it('each spawn of the day has its own id', () => {
    const ids = new Set<string>();
    let n = 0;
    for (let slot = 0; slot < SLOTS_PER_DAY; slot += 7)
      for (const c of crittersAt(DATE, slot)) if (c.slot === slot) (ids.add(critterId(c)), n++);
    expect(ids.size).toBe(n);
    expect(n).toBeGreaterThan(100);
  });

  it('a shadow: the same water, patch, start and waypoints from the same seed, every one in its water', () => {
    const spawns = Array.from({ length: 60 }, (_, i) => crittersAt(DATE, i * 37)).flat().filter((c) => c.kind !== 'bug');
    expect(spawns.length).toBeGreaterThan(20);
    for (const c of spawns) {
      const water = c.kind === 'fresh' ? freshWater(c) : 'sea';
      const a = fishPath(c.seed, water, 50_000), b = fishPath(c.seed, water, 50_000);
      expect(b).toEqual(a);
      expect(inWater(water, a.start.x, a.start.z) || (a.start.x === a.area.cx && a.start.z === a.area.cz)).toBe(true);
      for (const l of a.legs) {
        expect(inWater(water, l.x, l.z) || (l.x === a.area.cx && l.z === a.area.cz), `${water} ${l.x},${l.z}`).toBe(true);
        expect(l.ms).toBeGreaterThanOrEqual(2500);
        expect(l.ms).toBeLessThanOrEqual(6000);
      }
      // in order, one after another, within the stay
      for (let i = 1; i < a.legs.length; i++) expect(a.legs[i].t).toBeGreaterThanOrEqual(a.legs[i - 1].t + a.legs[i - 1].ms + 600);
      expect(a.legs.at(-1)!.t).toBeLessThan(50_000);
    }
  });

  it('fresh water spawns come to every fresh water, about a share each', () => {
    const got = Object.fromEntries(FRESH.map((f) => [f, 0]));
    for (let slot = 0; slot < SLOTS_PER_DAY; slot++) for (const c of crittersAt(DATE, slot)) if (c.slot === slot && c.kind === 'fresh') got[freshWater(c)]++;
    const all = Object.values(got).reduce((s, n) => s + n, 0);
    for (const f of FRESH) expect(got[f] / all, f).toBeGreaterThan(0.15);
  });

  it('a phone opening mid-stay finds the shadow where the other phone shows it (to the unit, by the clock)', () => {
    const c = crittersAt(DATE, 1234).find((x) => x.kind === 'fish' || x.kind === 'fresh') ?? crittersAt(DATE, 4321).find((x) => x.kind === 'fish')!;
    const water = c.kind === 'fresh' ? freshWater(c) : 'sea';
    const t0 = slotStart(DATE, c.slot) + c.at;
    // phone A has watched since it came; phone B opens 17.3 s later and computes it afresh
    const a = fishPath(c.seed, water, 45_000), b = fishPath(c.seed, water, 45_000);
    for (const ms of [0, 999, 17_300, 30_000]) {
      const pa = legAt(a.legs, { ...a.start, lift: 0 }, ms), pb = legAt(b.legs, { ...b.start, lift: 0 }, ms);
      expect(pb).toEqual(pa);
    }
    expect(t0).toBeGreaterThan(0);
    // mid-glide: between where it set off from and where it's heading
    const l = a.legs[1];
    const mid = legAt(a.legs, { ...a.start, lift: 0 }, l.t + l.ms / 2).at;
    expect(mid.x).toBeCloseTo((a.legs[0].x + l.x) / 2, 5);
  });

  it('bubbles rise in the sea in front of the beach, the same spot on both phones', () => {
    for (let s = 1; s < 200; s += 7) {
      const p = bubblesAt(s * 7919);
      expect(bubblesAt(s * 7919)).toEqual(p);
      expect(inWater('sea', p.x, p.z)).toBe(true);
    }
  });

  it('a bug: where NH keeps it (a trunk, a flower, its ground), every move the same from the same seed, kept to its patch', () => {
    const ids = Object.keys(BUGS).filter((id) => BUGS[id as BugId].flight !== 'dangle') as BugId[];
    for (const id of ids)
      for (const seed of [1, 99, 123456]) {
        const a = bugPath(id, seed, 18_000), b = bugPath(id, seed, 18_000);
        expect(b, id).toEqual(a);
        if (!a) continue;
        const flight = BUGS[id].flight;
        if (flight === 'perch') {
          const trunks = perches(BUGS[id].tree === 'palm');
          expect(trunks.some((p) => Math.abs(p.x + p.dx - a.spot.x) < 1e-9 && Math.abs(p.z - 1 - a.spot.z) < 1e-9), id).toBe(true);
          expect(a.legs.at(-1)?.sat, id).toBe(true);
        } else if (flight === 'flower') {
          expect(FLOWER_HEADS.some((h) => h.x === a.spot.x && h.z === a.spot.z), id).toBe(true);
        } else if (flight !== 'burrow') {
          const place = bugPlace(id);
          expect(patches(place).some((p) => a.spot.x >= p.x0 && a.spot.x <= p.x1 && a.spot.z >= p.z0 && a.spot.z <= p.z1), id).toBe(true);
          for (const l of a.legs) {
            expect(l.x >= a.patch.x0 - 1e-9 && l.x <= a.patch.x1 + 1e-9 && l.z >= a.patch.z0 - 1e-9 && l.z <= a.patch.z1 + 1e-9, `${id} ${l.x},${l.z}`)
              .toBe(true);
            if (!l.sat && flight !== 'flutter') expect(groundOk(place, l.x, l.z), `${id} ${l.x},${l.z}`).toBe(true);
          }
        } else expect(a.legs).toEqual([]);
        for (let i = 1; i < a.legs.length; i++) expect(a.legs[i].t).toBeGreaterThanOrEqual(a.legs[i - 1].t + a.legs[i - 1].ms - 1); // (whole ms)
      }
  });

  it('a butterfly lands on a flower now and then; a hopper hops; a firefly drifts; a bug out of a bush keeps by it', () => {
    const bfly = bugPath('common-butterfly', 7, 60_000)!;
    expect(bfly.legs.some((l) => l.sat && FLOWER_HEADS.some((h) => h.x === l.x && h.z === l.z))).toBe(true);
    const hopper = bugPath('rice-grasshopper', 7, 18_000) ?? bugPath('grasshopper' as BugId, 7, 18_000);
    if (hopper) expect(hopper.legs.every((l) => l.hop)).toBe(true);
    const from = { x: 150, z: 700, lift: 24 }, area = { x0: 120, x1: 180, z0: 686, z1: 714, l0: 20, l1: 50 };
    const out = bugPath('common-butterfly', 42, 18_000, { from, area })!;
    expect(out.start).toEqual(from);
    for (const l of out.legs) if (!l.sat) expect(l.x >= 120 && l.x <= 180).toBe(true);
  });
});
