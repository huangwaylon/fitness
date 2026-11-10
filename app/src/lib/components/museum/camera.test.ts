// The museum's room camera (museum/camera.ts) on the portrait phone (393 × 852): each room framed so its back wall's top
// sits under the top bar and its front edge over the HUD wherever my villager is, the side walls a soft follow away;
// my villager always on screen; the floor's apron down to the screen's foot.
import { describe, expect, test } from 'vitest';
import { DEAD, PITCH, PORTRAIT, VIEW_W, enter, follow, framingOf, project, type Cam } from './camera.ts';
import { HALL_H, ROOM_IDS, WING_H, boundsOf, inRect, rectsOf, type Pt } from './plan.ts';

const camAt = (room: (typeof ROOM_IDS)[number], t: Pt): Cam => ({ x: t[0], z: t[1], pitch: PITCH, d: framingOf(room).d, s: PORTRAIT });

describe('the framing', () => {
  test('the hall 124 across (its side arches and their plaques in view), the wings 112; a 12 × 18 room fixed in depth, a 12 × 20 one nearly (a few units), F2 followed', () => {
    expect(VIEW_W.hall).toBe(124);
    for (const id of ROOM_IDS) if (id !== 'hall') expect(VIEW_W[id]).toBe(112);
    const span = (id: (typeof ROOM_IDS)[number]) => framingOf(id).z[1] - framingOf(id).z[0];
    expect(span('hall')).toBe(0);
    expect(span('F1')).toBe(0);
    for (const id of ['bug', 'fish', 'G1', 'G2'] as const) expect(span(id), id).toBeLessThan(20);
    expect(span('F2')).toBeGreaterThan(40);
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
  test('the follow keeps still inside its dead zone, then comes just near enough', () => {
    const f = framingOf('fish'), t: Pt = [(f.x[0] + f.x[1]) / 2, f.z[0]];
    expect(follow(f, t, [t[0] + DEAD[0] - 1, t[1]])).toEqual(t);
    const moved = follow(f, t, [t[0] + DEAD[0] + 10, t[1]]);
    expect(moved[0]).toBeCloseTo(t[0] + 10);
    // (never past the range: the side walls stay at the screen's edges)
    expect(follow(f, t, [1000, t[1]])[0]).toBe(f.x[1]);
  });
  test('a villager about 36 px tall in a wing at 112, 33 in the hall at 124 (55-60 px would want ~70: a third of a room)', () => {
    for (const [id, px] of [['hall', 33], ['G1', 36]] as const) {
      const f = framingOf(id), t = enter(f, [(f.x[0] + f.x[1]) / 2, (f.z[0] + f.z[1]) / 2]);
      const h = project(camAt(id, t), t[0], 0, t[1])![1] - project(camAt(id, t), t[0], 16, t[1])![1];
      expect(Math.abs(h - px), id).toBeLessThan(2);
    }
  });
});
