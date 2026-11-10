// The museum's room camera (museum/camera.ts) on the portrait phone (393 × 852): each room framed so its back wall's top
// sits under the top bar and its front edge over the HUD wherever my villager is, the side walls a soft follow away;
// my villager always on screen; the floor's apron down to the screen's foot.
import { describe, expect, test } from 'vitest';
import { DEAD, PITCH, PORTRAIT, VIEW_W, enter, follow, framingOf, plaqueOf, project, type Cam } from './camera.ts';
import { ENTRANCE, HALL_H, OPENINGS, PLAQUE_H, PLAQUE_W, ROOM_IDS, WING_H, boundsOf, inRect, rectsOf, roomIdAt, type Pt } from './plan.ts';
import { SPOTS } from './spots.ts';

const camAt = (room: (typeof ROOM_IDS)[number], t: Pt): Cam => ({ x: t[0], z: t[1], pitch: PITCH, d: framingOf(room).d, s: PORTRAIT });

describe('the framing', () => {
  test('every room whole across (its width and a tile), its target’s x at its middle; a room that fits fixed in depth, F2 and F3 followed', () => {
    for (const id of ROOM_IDS) {
      const b = boundsOf(id), f = framingOf(id);
      expect(VIEW_W[id], id).toBe(b.x1 - b.x0 + 10);
      expect(f.x, id).toEqual([(b.x0 + b.x1) / 2, (b.x0 + b.x1) / 2]);
    }
    const span = (id: (typeof ROOM_IDS)[number]) => framingOf(id).z[1] - framingOf(id).z[0];
    for (const id of ['hall', 'bug', 'fish', 'F1', 'G1', 'G2'] as const) expect(span(id), id).toBe(0);
    for (const id of ['F2', 'F3'] as const) expect(span(id), id).toBeGreaterThan(5);
  });
  test('at either end of a room’s range its back wall’s top under the top bar and its front edge over the HUD (at the back and the front respectively)', () => {
    for (const id of ROOM_IDS) {
      const f = framingOf(id), b = boundsOf(id), h = id === 'hall' ? HALL_H : WING_H, cx = (f.x[0] + f.x[1]) / 2;
      const back = project(camAt(id, [cx, f.z[0]]), cx, h, b.z0)!, front = project(camAt(id, [cx, f.z[1]]), cx, 0, b.z1)!;
      expect(back[1], id).toBeGreaterThanOrEqual(PORTRAIT.top - 0.5);
      expect(front[1], id).toBeLessThanOrEqual(PORTRAIT.H - PORTRAIT.bottom + 0.5);
      // (the floor's apron past the front wall: under 6 tiles, the engine draws 6)
      expect(f.apron, id).toBeLessThan(60);
    }
  });
  test('my villager anywhere in a room, followed in from its doorway: always on screen between the bars, never past its edges', () => {
    for (const id of ROOM_IDS) {
      const f = framingOf(id);
      for (const r of rectsOf(id)) {
        let t = enter(f, [(r.x0 + r.x1) / 2, r.z1 - 10]);
        // a walk across the room in a lawnmower sweep, the camera following
        for (let z = r.z1 - 8; z >= r.z0 + 8; z -= 6)
          for (let x = r.x0 + 8; x <= r.x1 - 8; x += 6) {
            const me: Pt = [x, z];
            t = follow(f, t, me);
            const head = project(camAt(id, t), x, 16, z)!, foot = project(camAt(id, t), x, 0, z)!;
            expect(head[1] >= PORTRAIT.top - 1 && foot[1] <= PORTRAIT.H - PORTRAIT.bottom + 1 && foot[0] > 10 && foot[0] < PORTRAIT.W - 10, `${id} ${me}`).toBe(true);
            expect(inRect({ x0: f.x[0] - 1e-6, x1: f.x[1] + 1e-6, z0: f.z[0] - 1e-6, z1: f.z[1] + 1e-6 }, t[0], t[1]), id).toBe(true);
          }
      }
    }
  });
  test('the follow keeps still inside its dead zone, then comes just near enough, in depth only', () => {
    const f = framingOf('F3'), t: Pt = [f.x[0], f.z[0]];
    expect(follow(f, t, [t[0] + 40, t[1] + DEAD[1] - 1])).toEqual(t);
    const moved = follow(f, t, [t[0], t[1] + DEAD[1] + 10]);
    expect(moved[1]).toBeCloseTo(t[1] + 10);
    // (never past the range: x stays at the room's middle)
    expect(follow(f, t, [1000, 1000])).toEqual([f.x[0], f.z[1]]);
  });
  test('a villager about 32 px tall at 130 across (the whole room: NH’s room view)', () => {
    for (const id of ['hall', 'G1'] as const) {
      const f = framingOf(id), t = enter(f, [(f.x[0] + f.x[1]) / 2, (f.z[0] + f.z[1]) / 2]);
      const h = project(camAt(id, t), t[0], 0, t[1])![1] - project(camAt(id, t), t[0], 16, t[1])![1];
      expect(Math.abs(h - 32), id).toBeLessThan(3);
    }
  });
  test('from every way into a room (the front door, each doorway either way), every doorway’s plaque there whole on the screen, clear of the bars', () => {
    const ways: [string, Pt][] = [['entrance', ENTRANCE], ...[...SPOTS].filter(([k]) => /^in:[^:]+:/.test(k))];
    for (const [k, at] of ways) {
      const room = roomIdAt(...at)!, f = framingOf(room), t = enter(f, at), c = camAt(room, t);
      for (const o of OPENINGS)
        for (const side of ['room', 'next'] as const) {
          // (a plaque names the room beyond, read from its own room; on the way back, between two wings', the room behind)
          if ((side === 'room' ? o.room : o.next) !== room || (side === 'next' && o.room === 'hall')) continue;
          const q = plaqueOf(o, side), dx = (PLAQUE_W / 2) * Math.cos(q.yaw), dz = (PLAQUE_W / 2) * Math.sin(q.yaw);
          for (const [x, z] of [[q.x - dx, q.z + dz], [q.x + dx, q.z - dz]])
            for (const y of [q.y - PLAQUE_H / 2, q.y + PLAQUE_H / 2]) {
              const p = project(c, x, y, z)!;
              expect(p[0] >= 8 && p[0] <= PORTRAIT.W - 8 && p[1] >= 60 && p[1] <= PORTRAIT.H - 120, `${k} → ${o.room}>${o.next} (${side}) at ${p.map((v) => v.toFixed(0))}`).toBe(true);
            }
        }
    }
  });
});
