import { describe, expect, it } from 'vitest';
import { innerFloorOf, rayFloor } from '../../../../scripts/inner-floor.ts';
import type { Sample } from '../../../../scripts/room-surfaces.ts';
import { anchorsOf, shapeOf } from './seats3d.ts';
import { seatsOf, usable } from '../tent/seats.ts';
import { ITEMS } from '../tent/items.ts';

/** A tub's rays: a `w` × `d` tiles box, its rim `rim` high round the edge (`wall` thick), its basin's floor `floor` up, the
 *  water's slab at `water` (a closed volume: a face up, a face down 0.3 under), half-unit steps. */
function tub(w: number, d: number, rim: number, floor: number, water: number | null, wall = 1.5): Sample {
  const W = w * 10, D = d * 10, step = 0.5;
  const grid = Array.from({ length: W / step }, (_, i) => Array.from({ length: D / step }, (_, j) => {
    const x = -W / 2 + (i + 0.5) * step, z = -D / 2 + (j + 0.5) * step;
    const edge = Math.abs(x) > W / 2 - wall || Math.abs(z) > D / 2 - wall;
    if (edge) return [[rim, 1], [0, -1]] as [number, number][];
    return [...(water !== null ? [[water, 1], [water - 0.3, -1]] : []), [floor, 1], [floor - 0.3, -1]] as [number, number][];
  }));
  return { grid, front: [] };
}

describe('a bath\'s inner floor (scripts/inner-floor.ts) and its soak', () => {
  it('a ray\'s floor: the deepest face up before the tub\'s bottom, through the water\'s slab by the rim', () => {
    expect(rayFloor([[2.07, 1], [1.34, -1]])).toBe(2.07);
    // the kettle bath: its floating board and water by the rim gone through, the bowl's floor under
    expect(rayFloor([[9.57, 1], [9.26, 1], [9.18, -1], [2.78, 1], [2.42, -1], [0.97, 0.88]], 10.09)).toBe(2.78);
    // the rim: no deeper floor
    expect(rayFloor([[8, 1], [0, -1]], 8)).toBe(8);
    expect(rayFloor([[3, -1]])).toBeNull();
  });

  it('a square tub: on its floor at its back, facing its front; a long one at its higher end, facing along it', () => {
    const sq = innerFloorOf(tub(2, 2, 8, 1.2, 7), 2, 2, 0.5)!;
    expect(sq.y).toBeCloseTo(1.2, 5);
    expect(sq.yaw).toBe(0);
    expect(sq.z).toBeLessThan(-3);
    expect(sq.rim).toBe(8);
    const long = tub(2, 1, 6, 0.5, null);
    // (its +x end's rim higher: the back)
    for (const col of long.grid.slice(-3)) for (const h of col) (h[0] as [number, number])[0] = 8;
    const l = innerFloorOf(long, 2, 1, 0.5)!;
    expect(l.x).toBeGreaterThan(3);
    expect(Math.sin(l.yaw)).toBeCloseTo(-1);
    expect(innerFloorOf(tub(1, 1, 0.3, 0.1, null, 4.9), 1, 1, 0.5)).toBeNull();
  });

  it('every bath\'s soak (seats3d.json): its hips on the floor well under the rim, inside the tub, got into from in front', () => {
    for (const code of ['f1757', 'f4080', 'f7153', 'f13203', 'f14483', 'f4008', 'f3819', 'f5961', 'f14554', 'f1840', 'f1111', 'f4393']) {
      const sh = shapeOf('tent', code)!, m = ITEMS[code];
      expect(sh, code).toMatchObject({ k: 'u', use: 'soak' });
      if (sh.k !== 'u') continue;
      expect(sh.y, code).toBeGreaterThan(0);
      expect(sh.y, code).toBeLessThan(sh.rim! - 1.5);
      expect(Math.abs(sh.x), code).toBeLessThan(m.w * 5);
      expect(Math.abs(sh.z), code).toBeLessThan(m.d * 5);
      expect(sh.fz, code).toBeGreaterThan(m.d * 5);
      expect(usable(code), code).toBe(true);
    }
    expect(shapeOf('island', 'oil-barrel-bathtub')).toMatchObject({ k: 'u', use: 'soak' });
  });
});

describe('the rooms\' pieces used in place (seats3d.json `u`; seats.ts)', () => {
  const USES: Record<string, string> = {
    f290: 'run', f287: 'pedal', f1598: 'bounce', f4013: 'punch', f7653: 'punch', f7845: 'pullup', f1452: 'press', f4078: 'curl', f7535: 'swing', f13293: 'ring',
    f4006: 'climb', f13683: 'yoga', f14577: 'yoga', f12386: 'yoga', f12387: 'yoga', f12388: 'yoga', f12389: 'yoga', f1235: 'stall', f1234: 'stall'
  };
  it('each has its use, one to a piece, at every facing: its spot on the piece, got on from a step off it', () => {
    for (const [code, use] of Object.entries(USES)) for (let f = 0; f < 4; f++) {
      const st = seatsOf({ id: 'p', item: code, x: 3, z: 3, f: f as 0 | 1 | 2 | 3 });
      expect(st, `${code} f${f}`).toHaveLength(1);
      expect(st[0].anchor.use, code).toBe(use);
      const cx = -40 + 3 * 10 + 5 * (f % 2 ? ITEMS[code].d : ITEMS[code].w), cz = -40 + 3 * 10 + 5 * (f % 2 ? ITEMS[code].w : ITEMS[code].d);
      expect(Math.hypot(st[0].anchor.x - cx, st[0].anchor.z - cz), code).toBeLessThan(15);
    }
  });
  it('stood on (the lifts, the mats, the wall) or sat on (a bath, the stall); the climbing wall\'s feet go up 11 in a room, 3.5 on the island', () => {
    const [climb] = anchorsOf(shapeOf('tent', 'f4006'), { x: 0, z: 0, y: 0, yaw: 0, s: 1 });
    expect(climb).toMatchObject({ stand: true, top: 11 });
    // facing the wall's holds (its front, +z): back to us
    expect(Math.cos(climb.yaw)).toBeCloseTo(-1);
    expect(anchorsOf(shapeOf('island', 'climbing-wall'), { x: 0, z: 0, y: 0, yaw: 0, s: 3 })[0].top).toBeCloseTo(10.5);
    expect(anchorsOf(shapeOf('tent', 'f1757'), { x: 0, z: 0, y: 0, yaw: 0, s: 1 })[0]).toMatchObject({ stand: false, rim: 7.97 });
    expect(anchorsOf(shapeOf('tent', 'f4078'), { x: 0, z: 0, y: 0, yaw: 0, s: 1 })[0].stand).toBe(true);
  });
});
