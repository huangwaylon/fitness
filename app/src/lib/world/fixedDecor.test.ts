// The fixed decor (docs/design.md "Decor"): one scale for the furniture, the plan's placement rules for every spot in
// every season, the seasons' pieces in their windows taking their own spots (never a new one) and the snowboy melting
// over three days.
import { describe, expect, it } from 'vitest';
import { CASTLE_HOURS, decorHeight, piecesOn, snowboyStage, swapsOn, WINDOWS } from './fixedDecor.ts';
import {
  ARCH, CAKE, CENTRE_STAGE, DECOR_SLOTS, DECOR_U, DIG_SPOTS, FLOWERS, GOAL_TREES, LAWN_SPOTS, PATHS, POND, PULLUP_AT, SCENERY, SEATS, SPRING, inOval, riverNear, seatAt, type Pt
} from './world.ts';
import { route, walkGeo, walkable } from './walkGraph.ts';
import { dayWeather } from './weather.ts';
import { addDays } from '#lib/time/dates.ts';
import PLACES from './models.json';

const segDist = (line: readonly Pt[], x: number, z: number) => {
  let d = Infinity;
  for (let i = 0; i < line.length - 1; i++) {
    const [ax, az] = line[i], [bx, bz] = line[i + 1], dx = bx - ax, dz = bz - az, L = dx * dx + dz * dz || 1;
    const t = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / L));
    d = Math.min(d, Math.hypot(x - ax - dx * t, z - az - dz * t));
  }
  return d;
};
/** Days through a year (every 3rd, and the windows' edges). */
const DAYS = (() => {
  const out: string[] = [];
  for (let d = '2026-01-01'; d < '2027-01-01'; d = addDays(d, 3)) out.push(d);
  return [...out, '2026-04-01', '2026-04-10', '2026-12-15', '2026-12-26', '2027-01-06', '2026-02-25', '2026-11-01', '2026-09-15', '2026-06-01'];
})();
const GULLIVER: Pt = [96, 30], DAISY: Pt = [206, 396];
const MU = PLACES as unknown as Record<string, { mu: [number, number] }>;

describe('the fixed decor', () => {
  it('is one family at one scale: model units × DECOR_U', () => {
    for (const d of DAYS) for (const p of piecesOn(d, 12)) expect(p.h).toBeCloseTo(MU[p.key].mu[1] * DECOR_U, 0);
    for (const k of ['deco/campfire', 'deco/log-stool']) {
      const s = SCENERY.find((x) => x.key === k)!;
      expect(s.h).toBeCloseTo(MU[k].mu[1] * DECOR_U, 0);
    }
  });
  it.each(DECOR_SLOTS.map((s) => [s.id, s] as const))('%s stands clear: off the paths, the spots, the trunks, the stage and the water', (_, s) => {
    for (const line of PATHS.dirt) expect(segDist(line, s.x, s.z)).toBeGreaterThan(20);
    for (const [x, z] of [...DIG_SPOTS, ...LAWN_SPOTS, ...FLOWERS.map((f) => [f.x, f.z] as Pt)]) expect(Math.hypot(s.x - x, s.z - z)).toBeGreaterThan(24);
    for (const t of SCENERY.filter((t) => t.kind === 'oak' || t.kind === 'cedar' || t.kind === 'palm')) expect(Math.hypot(s.x - t.x, s.z - t.z), t.id).toBeGreaterThan(30);
    for (const [x, z] of Object.values(GOAL_TREES)) expect(Math.hypot(s.x - x, s.z - z)).toBeGreaterThan(30);
    for (const [x, z] of [CENTRE_STAGE, CAKE, ARCH]) expect(Math.hypot(s.x - x, s.z - z)).toBeGreaterThan(60);
    const r = riverNear(s.x, s.z);
    expect(r.d - r.hw).toBeGreaterThan(12);
    for (const o of [POND, SPRING]) expect(inOval(o, s.x, s.z, 12)).toBe(false);
  });
  it('keeps まえ open: one piece for good and two seasonal ones at most, the finds and the sea view clear, away from Gulliver and Daisy Mae', () => {
    const mae = DECOR_SLOTS.filter((s) => s.z < 600);
    expect(mae.filter((s) => s.key)).toHaveLength(1);
    for (const d of DAYS) expect(piecesOn(d, 12).filter((p) => p.z < 600 && !mae.find((s) => s.id === p.id)?.key).length, d).toBeLessThanOrEqual(2);
    for (const s of mae) {
      expect(s.z < 110 && s.x + s.foot[0] / 2 > 120 && s.x - s.foot[0] / 2 < 300, s.id).toBe(false);
      for (const [x, z] of [GULLIVER, DAISY]) expect(Math.hypot(s.x - x, s.z - z), s.id).toBeGreaterThan(40);
    }
    for (const d of DAYS) for (const p of piecesOn(d, 12)) if (p.z < 300) expect(p.h, p.key).toBeLessThanOrEqual(40);
  });
  it('brings the seasons’ pieces in their windows, each in its own spot or in place of what stands there', () => {
    const keys = (d: string, h = 12) => new Set([...piecesOn(d, h, undefined, ARCH).map((p) => p.key), ...Object.values(swapsOn(d)).map((s) => s.key)]);
    expect(keys('2026-04-05').has('deco/picnic-set') && keys('2026-04-05').has('deco/pond-stone-sakura') && !keys('2026-04-05').has('deco/log-bench')).toBe(true);
    expect(keys('2026-04-12').has('deco/log-bench')).toBe(true);
    expect(keys('2026-03-10').has('deco/bamboo-shoot-lamp')).toBe(true);
    expect(keys('2026-07-20').has('deco/beach-chair') && keys('2026-07-20').has('deco/sandcastle')).toBe(true);
    expect(keys('2026-07-20', CASTLE_HOURS[1]).has('deco/sandcastle')).toBe(false);
    expect(keys('2026-07-20', CASTLE_HOURS[0] - 1).has('deco/sandcastle')).toBe(false);
    expect(keys('2026-09-20').has('deco/beach-chair')).toBe(false);
    expect(keys('2026-10-01').has('deco/nut-lamp') && keys('2026-11-10').has('deco/mushroom-lamp') && keys('2026-11-10').has('deco/pond-stone-maple')).toBe(true);
    expect(keys('2026-12-20').has('deco/illumi-tree') && !keys('2026-12-20').has('deco/hammock')).toBe(true);
    expect(keys('2027-01-01').has('deco/kadomatsu')).toBe(true);
    expect(keys('2027-01-10').has('deco/kadomatsu')).toBe(false);
    // Bunny Day 2027 (Easter Mar 28): the egg arch on the arch's spot
    expect(keys('2027-03-28').has('deco/egg-arch')).toBe(true);
    expect(WINDOWS.blossom).toEqual([401, 410]);
    // a swap only ever replaces a scenery piece that's there; a piece only ever stands in a spot
    for (const d of DAYS) {
      for (const id of Object.keys(swapsOn(d))) expect(SCENERY.some((s) => s.id === id)).toBe(true);
      for (const p of piecesOn(d, 12, undefined, ARCH)) expect(p.id === 'arch' || DECOR_SLOTS.some((s) => s.id === p.id && s.x === p.x && s.z === p.z)).toBe(true);
    }
  });
  it('builds the snowboy on a snow day and melts it over the next three', () => {
    let snow = '';
    for (let d = '2026-12-11'; d < '2027-02-24' && !snow; d = addDays(d, 1)) if (/snow/.test(dayWeather(d).pattern) && !/snow/.test(dayWeather(addDays(d, 1)).pattern) && !/snow/.test(dayWeather(addDays(d, 2)).pattern) && !/snow/.test(dayWeather(addDays(d, 3)).pattern)) snow = d;
    expect(snow).not.toBe('');
    expect([0, 1, 2, 3].map((n) => snowboyStage(addDays(snow, n)))).toEqual([0, 1, 2, 3]);
    expect(snowboyStage('2026-07-20')).toBeNull();
    expect(piecesOn(addDays(snow, 1), 12).find((p) => p.id === 'snowboy')?.key).toBe('deco/snowboy-1');
  });
  it('stands the park bench at its height', () => {
    expect(decorHeight('deco/park-bench')).toBeCloseTo(40, 0);
  });
  it('has flowers round the pump to water, and every seat and the bar on walkable ground', () => {
    const pump = DECOR_SLOTS.find((s) => s.id === 'pump')!;
    expect(FLOWERS.filter((f) => Math.hypot(f.x - pump.x, f.z - pump.z) <= 70).length).toBeGreaterThanOrEqual(2);
    const g = walkGeo();
    for (const [name, [x, z]] of [...Object.entries(SEATS), ['pullup', PULLUP_AT] as const]) {
      expect(walkable(g, x, z), name).toBe(true);
      expect(route(g, [132, 214], [x, z]), name).not.toBeNull();
    }
    expect(seatAt(...SEATS.seatPondR)).toBe('seatPondR');
    expect(seatAt(SEATS.seatPondR[0] + 6, SEATS.seatPondR[1])).toBeNull();
  });
});
