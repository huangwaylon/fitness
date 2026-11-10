// The museum's plan (museum/plan.ts): its rooms, its walls and its walk.
import { describe, expect, test } from 'vitest';
import { ART_WING, BACK_OPENING, BUG_WING, ENTRANCE, FISH_WING, FOSSIL_WING, HALL, OPENING, SEA_OPENING, SEA_WING, WALLS, nearestOpen, navOf, roomAt, walkPath, walkable, nearWings, wallEnds, wingAt, wingHeld, type Pt } from './plan.ts';

const g = navOf();
const len = (from: Pt, pts: Pt[]) => pts.reduce((a, p, i) => a + Math.hypot(p[0] - (i ? pts[i - 1][0] : from[0]), p[1] - (i ? pts[i - 1][1] : from[1])), 0);

describe('the museum’s rooms', () => {
  test('the hall in the middle, the bug wing to its left, the aquarium to its right; the openings between', () => {
    expect(roomAt(0, 0)).toBe('hall');
    expect(roomAt(-150, 0)).toBe('bug');
    expect(roomAt(150, 0)).toBe('fish');
    expect(roomAt(350, 40)).toBe('sea');
    expect(roomAt(-150, -200)).toBe('fossil');
    expect(roomAt(-30, -80)).toBe('fossil');
    expect(roomAt(150, -200)).toBe('art');
    expect(roomAt(30, -80)).toBe('art');
    expect(roomAt(0, 90)).toBeNull();
    expect(wingAt(HALL.x0, 10)).toBe('hall');
    expect(wingAt(-42, HALL.z0)).toBe('hall');
    expect(wingAt(FISH_WING.x1, 70)).toBe('fish');
    expect(BUG_WING.x1).toBe(HALL.x0);
    expect(FISH_WING.x0).toBe(HALL.x1);
  });
  test('the wing held at a doorway (its music): the room one came from until well through the opening', () => {
    expect(wingHeld('hall', HALL.x0 - 5, 10)).toBe('hall'); // in the doorway: still the hall
    expect(wingHeld('bug', HALL.x0 - 5, 10)).toBe('bug'); // the same spot coming back: still the wing
    expect(wingHeld('hall', HALL.x0 - 12, 10)).toBe('bug');
    expect(wingHeld('bug', HALL.x0 - 1, 10)).toBe('bug');
    expect(wingHeld('bug', 0, 10)).toBe('hall');
    expect(wingHeld('hall', HALL.x1 + 12, 10)).toBe('fish');
    expect(wingHeld('fish', HALL.x1 + 5, 10)).toBe('fish');
    // the back openings: the hall's till well through, then the fossils' or the art's
    expect(wingHeld('hall', -42, HALL.z0 - 5)).toBe('hall');
    expect(wingHeld('hall', -42, HALL.z0 - 12)).toBe('fossil');
    expect(wingHeld('art', 42, HALL.z0 + 1)).toBe('art');
    expect(wingHeld('art', 42, HALL.z0 + 12)).toBe('hall');
    expect(wingHeld('fish', FISH_WING.x1 + 12, 76)).toBe('sea');
  });
  test('every wall stands on a room’s edge, and the hall’s side walls leave the openings', () => {
    for (const w of WALLS) expect(w.h).toBeGreaterThan(40);
    const side = WALLS.filter((w) => w.a[0] === HALL.x1 && w.b[0] === HALL.x1);
    const covered = (z: number) => side.some((w) => z > Math.min(w.a[1], w.b[1]) && z < Math.max(w.a[1], w.b[1]));
    expect(covered((OPENING.z0 + OPENING.z1) / 2)).toBe(false);
    expect(covered(-30)).toBe(true);
    // the back wall leaves its two openings, and the aquarium's far wall the sea creatures'
    const back = WALLS.filter((w) => w.a[1] === HALL.z0 && w.b[1] === HALL.z0);
    const backAt = (x: number) => back.some((w) => x > Math.min(w.a[0], w.b[0]) && x < Math.max(w.a[0], w.b[0]));
    expect([backAt(-(BACK_OPENING.x0 + BACK_OPENING.x1) / 2), backAt(10), backAt((BACK_OPENING.x0 + BACK_OPENING.x1) / 2), backAt(57)]).toEqual([false, true, false, true]);
    const far = WALLS.filter((w) => w.a[0] === FISH_WING.x1 && w.b[0] === FISH_WING.x1);
    const farAt = (z: number) => far.some((w) => z > Math.min(w.a[1], w.b[1]) && z < Math.max(w.a[1], w.b[1]));
    expect([farAt((SEA_OPENING.z0 + SEA_OPENING.z1) / 2), farAt(0), farAt(-60), farAt(96)]).toEqual([false, true, true, true]);
    expect(roomAt(350, -80)).toBe('sea');
    // every room closed but for its doorways: a wall on each edge of each rect, except where a passage meets its room
    expect(SEA_WING.x0).toBe(FISH_WING.x1);
    expect(FOSSIL_WING.x1).toBe(ART_WING.x0);
  });
  test('no two wall slabs overlap (their faces would share a plane and fight): each joint’s square is one slab’s', () => {
    const T = 3;
    const slab = (i: number) => {
      const w = WALLS[i], [e0, e1] = wallEnds(WALLS, i), ux = Math.sign(w.b[0] - w.a[0]), uz = Math.sign(w.b[1] - w.a[1]);
      const a = [w.a[0] - ux * e0 * (T / 2), w.a[1] - uz * e0 * (T / 2)], b = [w.b[0] + ux * e1 * (T / 2), w.b[1] + uz * e1 * (T / 2)];
      return { x0: Math.min(a[0], b[0]) - (uz ? T / 2 : 0), x1: Math.max(a[0], b[0]) + (uz ? T / 2 : 0), z0: Math.min(a[1], b[1]) - (ux ? T / 2 : 0), z1: Math.max(a[1], b[1]) + (ux ? T / 2 : 0) };
    };
    const slabs = WALLS.map((_, i) => slab(i));
    for (let i = 0; i < slabs.length; i++)
      for (let k = i + 1; k < slabs.length; k++) {
        const p = slabs[i], q = slabs[k];
        expect(Math.min(p.x1, q.x1) - Math.max(p.x0, q.x0) <= 0 || Math.min(p.z1, q.z1) - Math.max(p.z0, q.z0) <= 0, `walls ${i} and ${k}`).toBe(true);
      }
    // the joints closed: the hall's back corner is the hall's side wall's (the taller, running on), the door's ends free,
    // the fossils' and the art's wall stops at the hall's back
    const at = (a: Pt, b: Pt) => WALLS.findIndex((w) => w.a[0] === a[0] && w.a[1] === a[1] && w.b[0] === b[0] && w.b[1] === b[1]);
    const side = at([HALL.x0, HALL.z0], [HALL.x0, OPENING.z0]), backL = at([-BACK_OPENING.x1, HALL.z0], [HALL.x0, HALL.z0]);
    expect(wallEnds(WALLS, side)[0]).toBe(1);
    expect(wallEnds(WALLS, backL)[1]).toBe(-1);
    expect(wallEnds(WALLS, at([BUG_WING.x1, HALL.z0], [BUG_WING.x1, BUG_WING.z0]))[0]).toBe(-1);
    expect(wallEnds(WALLS, at([HALL.x0, HALL.z1], [-12, HALL.z1]))[1]).toBe(0);
    expect(wallEnds(WALLS, backL)[0]).toBe(0);
    expect(wallEnds(WALLS, at([0, HALL.z0], [0, FOSSIL_WING.z0]))[0]).toBe(-1);
  });
});

describe('the wings woken as one comes near (their models fetched then: exhibits.ts LAZY)', () => {
  test('at the door none of the far ones; by the back openings the fossils’ or the art’s; near the far wall the sea creatures’', () => {
    expect(nearWings(...ENTRANCE).sort()).toEqual(['hall']);
    expect(nearWings(-42, -30)).toContain('fossil');
    expect(nearWings(-42, -30)).not.toContain('art');
    expect(nearWings(42, -30)).toContain('art');
    expect(nearWings(250, 76)).toContain('sea');
    expect(nearWings(150, 0)).not.toContain('sea');
    expect(nearWings(-150, -200)).toEqual(['fossil']);
  });
});

describe('the walk', () => {
  test('in at the door, through the openings into either wing', () => {
    expect(walkable(g, ...ENTRANCE)).toBe(true);
    for (const to of [[-200, 40], [200, -40], [350, 40], [-150, -200], [150, -200]] as Pt[]) {
      const p = walkPath(g, ENTRANCE, to);
      expect(p.length).toBeGreaterThan(0);
      const end = p[p.length - 1];
      expect(Math.hypot(end[0] - to[0], end[1] - to[1])).toBeLessThan(1);
      // through the opening, never through a wall: every leg on open floor
      for (let i = 0; i < p.length; i++) {
        const a = i ? p[i - 1] : ENTRANCE, b = p[i];
        for (let t = 0; t <= 1; t += 0.05) expect(walkable(g, a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t)).toBe(true);
      }
      // (round the hall's side wall, not much longer than straight)
      expect(len(ENTRANCE, p)).toBeLessThan(Math.hypot(to[0] - ENTRANCE[0], to[1] - ENTRANCE[1]) * 1.75);
    }
  });
  test('walls and what stands on the floor keep a walker off; a tap there goes to the nearest open point', () => {
    expect(walkable(g, HALL.x1, -30)).toBe(false);
    expect(walkable(g, 0, 69)).toBe(false);
    const blocked = navOf([{ x0: 100, x1: 200, z0: -20, z1: 20 }]);
    expect(walkable(blocked, 150, 0)).toBe(false);
    const near = nearestOpen(blocked, 150, 0)!;
    expect(walkable(blocked, ...near)).toBe(true);
    expect(Math.abs(near[1])).toBeGreaterThan(20);
    // a walk across goes round it
    const p = walkPath(blocked, [80, 0], [220, 0]);
    expect(p.length).toBeGreaterThan(1);
  });
  test('nowhere to go: no walk', () => {
    expect(walkPath(g, ENTRANCE, ENTRANCE)).toEqual([]);
  });
});
