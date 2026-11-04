import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { crittersAt, slotStart, SLOTS_PER_DAY } from './ambient.ts';
import { BUGS, FRESH, bugPlace, patches, perches, type BugId } from './critters.ts';
import { FLY_UPS, flowerHeads, bubblesAt, bugAt, bugPath, critterId, fishPath, freshWater, groundOk, inWater, legAt } from './critterPath.ts';
import { worldOf } from './layoutWorld.ts';
import { setWorld } from './world.ts';
import { defaultLayout } from '#lib/layout/model.ts';

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
      const a = fishPath(c.seed, water, 50_000)!, b = fishPath(c.seed, water, 50_000);
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
    const a = fishPath(c.seed, water, 45_000)!, b = fishPath(c.seed, water, 45_000)!;
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
          expect(flowerHeads().some((h) => h.x === a.spot.x && h.z === a.spot.z), id).toBe(true);
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
    expect(bfly.legs.some((l) => l.sat && flowerHeads().some((h) => h.x === l.x && h.z === l.z))).toBe(true);
    const hopper = bugPath('rice-grasshopper', 7, 18_000) ?? bugPath('grasshopper' as BugId, 7, 18_000);
    if (hopper) expect(hopper.legs.every((l) => l.hop)).toBe(true);
    const from = { x: 150, z: 700, lift: 24 }, area = { x0: 120, x1: 180, z0: 686, z1: 714, l0: 20, l1: 50 };
    const out = bugPath('common-butterfly', 42, 18_000, { from, area })!;
    expect(out.start).toEqual(from);
    for (const l of out.legs) if (!l.sat) expect(l.x >= 120 && l.x <= 180).toBe(true);
  });
});

describe('how the bugs move (NH: a butterfly is easy to walk up to)', () => {
  beforeAll(() => setWorld(worldOf(defaultLayout())));
  afterAll(() => setWorld(null));
  /** A stay sampled at 60 Hz: the top and mean ground speed (u/s) and how fast its heading turns while it flies (rad/s). */
  function sample(id: BugId, seed: number, ms = 60_000) {
    const p = bugPath(id, seed, ms)!, o = bugAt(p.flight, p.legs, p.start, 0);
    let px = o.x, pz = o.z, top = 0, flown = 0, turned = 0, flyMs = 0, h: number | null = null;
    for (let t = 16; t < ms; t += 16) {
      bugAt(p.flight, p.legs, p.start, t, o);
      const v = Math.hypot(o.x - px, o.z - pz) / 0.016;
      top = Math.max(top, v);
      if (v > 2) {
        const a = Math.atan2(o.z - pz, o.x - px);
        if (h !== null) turned += Math.abs(Math.atan2(Math.sin(a - h), Math.cos(a - h)));
        h = a;
        flown += v * 0.016;
        flyMs += 16;
      } else h = null;
      px = o.x;
      pz = o.z;
    }
    return { top, mean: flown / (flyMs / 1000), turn: turned / (flyMs / 1000) };
  }
  const butterflies = (Object.keys(BUGS) as BugId[]).filter((id) => /butterfly/.test(id));

  it('the flowers’ patches are their own clumps, never one across the island (the layout’s clump tags repeat)', () => {
    for (const a of patches('flowers')) expect(a.z1 - a.z0, JSON.stringify(a)).toBeLessThan(160);
  });
  it('a butterfly flutters slowly, slower than a villager strolls (90 u/s), and never darts', () => {
    for (const id of butterflies)
      for (const seed of [1, 7, 99, 2024, 123456]) {
        const s = sample(id, seed);
        expect(s.top, `${id} ${seed}`).toBeLessThan(FLY_UPS.flutter[1] * 1.8);
        expect(s.mean, `${id} ${seed}`).toBeGreaterThan(FLY_UPS.flutter[0] * 0.5);
        expect(s.mean, `${id} ${seed}`).toBeLessThan(FLY_UPS.flutter[1]);
      }
  });
  it('a butterfly meanders in gentle curves, not straight lines nor jitter', () => {
    for (const id of butterflies)
      for (const seed of [1, 7, 99, 2024, 123456]) {
        const s = sample(id, seed);
        expect(s.turn, `${id} ${seed}`).toBeGreaterThan(0.3);
        expect(s.turn, `${id} ${seed}`).toBeLessThan(4);
      }
  });
  it('a butterfly bobs as it flies and is still on its flower', () => {
    const p = bugPath('common-butterfly', 7, 60_000)!;
    const l = p.legs.find((l) => l.sat)!, rest = l.t + l.ms + 200;
    const lifts = [0, 140, 280, 420].map((d) => bugAt(p.flight, p.legs, p.start, rest + d).lift);
    expect(Math.max(...lifts) - Math.min(...lifts)).toBeLessThan(1e-9);
    const f = p.legs.find((l, i) => i > 1 && !l.sat && !p.legs[i - 1].sat)!;
    const bob = [0.3, 0.5, 0.7].map((k) => bugAt(p.flight, p.legs, p.start, f.t + f.ms * k).lift);
    expect(bob.some((b, i) => i && Math.abs(b - bob[0]) > 0.5)).toBe(true);
  });
  it('every bug keeps a pace one can follow: none faster than a running villager (200 u/s)', () => {
    for (const id of Object.keys(BUGS) as BugId[]) {
      if (BUGS[id].flight === 'dangle') continue;
      for (const seed of [3, 41]) if (bugPath(id, seed, 20_000)) expect(sample(id, seed, 20_000).top, id).toBeLessThan(200);
    }
  });
  it('its curve runs through each leg’s end, from where it is when it comes', () => {
    const p = bugPath('common-butterfly', 99, 30_000)!;
    expect(bugAt(p.flight, p.legs, p.start, 0)).toMatchObject({ x: p.start.x, z: p.start.z });
    for (const l of p.legs.slice(0, 20)) {
      const at = bugAt(p.flight, p.legs, p.start, l.t + l.ms);
      expect(Math.hypot(at.x - l.x, at.z - l.z)).toBeLessThan(1e-6);
    }
  });
});
