// The museum's benches (museum/seats.ts): two seats each, on the bench, facing the way the bench does (the aquarium's
// the great sea tank), got on from a step in front that the walk reaches, each in its room and clear of everything.
import { describe, expect, test } from 'vitest';
import { BENCHES, BENCH_MODEL, BENCH_S, benchRect, benchSeats, seatOf } from './seats.ts';
import { TANKS } from './tanks.ts';
import { allBlocks } from './spots.ts';
import { CARPETS, ENTRANCE, OPENINGS, inRect, navOf, rectsOf, walkPath, type Rect } from './plan.ts';
import { modelBounds } from '../world3d/models3d.ts';

const b = modelBounds(BENCH_MODEL)!;
const half: [number, number] = [((b.max[0] - b.min[0]) * BENCH_S) / 2, ((b.max[2] - b.min[2]) * BENCH_S) / 2];
const sea = TANKS.find((t) => t.id === 'sea')!.box;
const overlap = (p: Rect, q: Rect) => p.x0 < q.x1 && q.x0 < p.x1 && p.z0 < q.z1 && q.z0 < p.z1;

describe('the benches', () => {
  test('two seats each, apart, on the bench at its seat height', () => {
    expect(new Set(BENCHES.map((q) => q.id)).size).toBe(BENCHES.length);
    for (const bench of BENCHES) {
      const seats = benchSeats(bench.id), r = benchRect(bench, half);
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
  test('in its room, its measured floor within the one the walk keeps off, clear of the exhibits, the carpets and the doorways', () => {
    const others = allBlocks().filter((r) => !BENCHES.some((q) => { const p = benchRect(q); return p.x0 === r.x0 && p.z0 === r.z0; }));
    for (const bench of BENCHES) {
      const r = benchRect(bench, half), kept = benchRect(bench);
      expect(rectsOf(bench.room).some((room) => inRect(room, r.x0, r.z0, 1) && inRect(room, r.x1, r.z1, 1)), bench.id).toBe(true);
      expect(r.x0 >= kept.x0 - 1 && r.x1 <= kept.x1 + 1 && r.z0 >= kept.z0 - 1 && r.z1 <= kept.z1 + 1, bench.id).toBe(true);
      expect(others.filter((o) => overlap(o, r)), bench.id).toEqual([]);
      for (const c of CARPETS) for (const q of c.rects) expect(overlap(q, r), `${bench.id} on a carpet`).toBe(false);
      for (const o of OPENINGS) {
        const m = (o.from + o.to) / 2, [ox, oz] = o.axis === 'x' ? [o.at, m] : [m, o.at];
        expect(Math.hypot(bench.x - ox, bench.z - oz), bench.id).toBeGreaterThan(25);
      }
    }
  });
  test('each seat faces as its bench does (the aquarium’s the great sea tank, across the aisle)', () => {
    for (const bench of BENCHES)
      for (const s of benchSeats(bench.id)) {
        expect(Math.abs(Math.sin(s.anchor.yaw - bench.yaw))).toBeLessThan(0.01);
        expect(Math.cos(s.anchor.yaw - bench.yaw)).toBeGreaterThan(0.99);
        if (bench.room === 'fish') expect(s.at[0] > sea.x0 && s.at[0] < sea.x1 && s.at[1] > sea.z1).toBe(true);
      }
  });
  test('got on from a step in front of it, off the bench, which the walk reaches from the door with everything on show', () => {
    const nav = navOf(allBlocks());
    for (const bench of BENCHES)
      for (const s of benchSeats(bench.id)) {
        const r = benchRect(bench, half), fx = Math.sin(bench.yaw), fz = Math.cos(bench.yaw);
        // (in front: along its facing from the seat)
        expect((s.from[0] - s.at[0]) * fx + (s.from[1] - s.at[1]) * fz).toBeGreaterThan(3);
        expect(inRect(r, s.from[0], s.from[1])).toBe(false);
        const path = walkPath(nav, ENTRANCE, s.from), end = path[path.length - 1];
        expect(path.length, bench.id).toBeGreaterThan(0);
        expect(Math.hypot(end[0] - s.from[0], end[1] - s.from[1]), bench.id).toBeLessThan(6);
      }
  });
});
