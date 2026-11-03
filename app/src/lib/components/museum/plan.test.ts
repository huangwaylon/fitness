// The museum's plan (museum/plan.ts): its rooms, its walls and its walk.
import { describe, expect, test } from 'vitest';
import { BUG_WING, ENTRANCE, FISH_WING, HALL, OPENING, WALLS, nearestOpen, navOf, roomAt, walkPath, walkable, wingAt, type Pt } from './plan.ts';

const g = navOf();
const len = (from: Pt, pts: Pt[]) => pts.reduce((a, p, i) => a + Math.hypot(p[0] - (i ? pts[i - 1][0] : from[0]), p[1] - (i ? pts[i - 1][1] : from[1])), 0);

describe('the museum’s rooms', () => {
  test('the hall in the middle, the bug wing to its left, the aquarium to its right; the openings between', () => {
    expect(roomAt(0, 0)).toBe('hall');
    expect(roomAt(-150, 0)).toBe('bug');
    expect(roomAt(150, 0)).toBe('fish');
    expect(roomAt(0, 90)).toBeNull();
    expect(wingAt(HALL.x0)).toBe('hall');
    expect(BUG_WING.x1).toBe(HALL.x0);
    expect(FISH_WING.x0).toBe(HALL.x1);
  });
  test('every wall stands on a room’s edge, and the hall’s side walls leave the openings', () => {
    for (const w of WALLS) expect(w.h).toBeGreaterThan(40);
    const side = WALLS.filter((w) => w.a[0] === HALL.x1 && w.b[0] === HALL.x1);
    const covered = (z: number) => side.some((w) => z > Math.min(w.a[1], w.b[1]) && z < Math.max(w.a[1], w.b[1]));
    expect(covered((OPENING.z0 + OPENING.z1) / 2)).toBe(false);
    expect(covered(-30)).toBe(true);
  });
});

describe('the walk', () => {
  test('in at the door, through the openings into either wing', () => {
    expect(walkable(g, ...ENTRANCE)).toBe(true);
    for (const to of [[-200, 40], [200, -40]] as Pt[]) {
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
      expect(len(ENTRANCE, p)).toBeLessThan(Math.hypot(to[0] - ENTRANCE[0], to[1] - ENTRANCE[1]) * 1.6);
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
