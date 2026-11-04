// The museum's benches (museum/seats.ts): two seats each, on the bench, facing the great sea tank, got on from a step
// in front that the walk reaches.
import { describe, expect, test } from 'vitest';
import { BENCHES, BENCH_MODEL, BENCH_S, benchSeats, seatOf } from './seats.ts';
import { TANKS } from './tanks.ts';
import { ENTRANCE, navOf, walkPath, type Rect } from './plan.ts';
import { modelBounds } from '../world3d/models3d.ts';

const b = modelBounds(BENCH_MODEL)!;
const hw = ((b.max[0] - b.min[0]) * BENCH_S) / 2, hd = ((b.max[2] - b.min[2]) * BENCH_S) / 2;
const rectOf = (x: number, z: number): Rect => ({ x0: x - hw, x1: x + hw, z0: z - hd, z1: z + hd });
const sea = TANKS.find((t) => t.id === 'sea')!.box;

describe('the aquarium benches', () => {
  test('two benches, two seats each, apart, on the bench at its seat height', () => {
    expect(BENCHES).toHaveLength(2);
    for (const bench of BENCHES) {
      const seats = benchSeats(bench.id), r = rectOf(bench.x, bench.z);
      expect(seats.map((s) => [s.id, s.n, s.lie])).toEqual([[bench.id, 0, false], [bench.id, 1, false]]);
      expect(Math.hypot(seats[0].at[0] - seats[1].at[0], seats[0].at[1] - seats[1].at[1])).toBeGreaterThan(7);
      for (const s of seats) {
        expect(s.at[0] > r.x0 && s.at[0] < r.x1 && s.at[1] > r.z0 && s.at[1] < r.z1).toBe(true);
        // (the seat's top: about a third of a 16-unit villager up, under the bench's top)
        expect(s.anchor.y).toBeGreaterThan(3);
        expect(s.anchor.y).toBeLessThan(b.max[1] * BENCH_S);
        expect(s.anchor.floor).toBe(0);
      }
    }
    expect(seatOf('dmbench2', 1)).toEqual(benchSeats('dmbench2')[1]);
    expect(seatOf('dmbench2', 2)).toBeNull();
    expect(benchSeats('nope')).toEqual([]);
  });
  test('each seat faces the great sea tank, across the aisle', () => {
    for (const bench of BENCHES)
      for (const s of benchSeats(bench.id)) {
        const fx = Math.sin(s.anchor.yaw), fz = Math.cos(s.anchor.yaw);
        expect(fz).toBeLessThan(-0.99);
        expect(Math.abs(fx)).toBeLessThan(0.01);
        // (straight ahead it meets the tank's glass)
        expect(s.at[0] > sea.x0 && s.at[0] < sea.x1 && s.at[1] > sea.z1).toBe(true);
      }
  });
  test('got on from a step in front of it (toward the tank), off the bench, which the walk reaches from the door', () => {
    const blocks = [...TANKS.map((t) => ({ x0: t.box.x0, x1: t.box.x1, z0: t.box.z0, z1: t.box.z1 })), ...BENCHES.map((q) => rectOf(q.x, q.z))];
    const nav = navOf(blocks);
    for (const bench of BENCHES)
      for (const s of benchSeats(bench.id)) {
        const r = rectOf(bench.x, bench.z);
        expect(s.from[1]).toBeLessThan(r.z0);
        expect(s.from[1]).toBeGreaterThan(sea.z1);
        expect(Math.abs(s.from[0] - s.at[0])).toBeLessThan(0.01);
        const path = walkPath(nav, ENTRANCE, s.from), end = path[path.length - 1];
        expect(path.length).toBeGreaterThan(0);
        expect(Math.hypot(end[0] - s.from[0], end[1] - s.from[1])).toBeLessThan(4);
      }
  });
});
