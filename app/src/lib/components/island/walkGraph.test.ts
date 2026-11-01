import type { Box } from './geom.ts';
import { describe, expect, it } from 'vitest';
import { ACTION_MS, actionMs, actionSpots, facingFor, nearestWalkable, route, routeLength, segmentClear, walkGeo, walkable, wanderMs, type Pt, type WalkGeo } from './walkGraph.ts';
import { plan } from './avatar.ts';
import { BED_XS, BED_ZS, BRIDGES, BUILDINGS, CLIFF, GOAL_TREES, HOMES, POND, ROCK, inRiver } from './world.ts';

const crosses = (a: Pt, b: Pt, o: Box) => {
  for (let i = 0; i <= 100; i++) {
    const x = a[0] + ((b[0] - a[0]) * i) / 100, y = a[1] + ((b[1] - a[1]) * i) / 100;
    if (x > o.x0 && x < o.x1 && y > o.y0 && y < o.y1) return true;
  }
  return false;
};
/** Every segment of a route from `from` stays walkable, off the water and clear of every obstacle box. */
function sound(g: WalkGeo, from: Pt, pts: Pt[]) {
  let at = from;
  for (const p of pts) {
    expect(segmentClear(g, at, p)).toBe(true);
    for (const o of g.obstacles) expect(crosses(at, p, o)).toBe(false);
    at = p;
  }
}

describe('the walk geometry (from the world constants)', () => {
  const g = walkGeo();
  it('the homes, the doors, the bridges’ and the stairs’ ends and the shore are walkable and reachable from home', () => {
    for (const name of ['homeA', 'homeB', 'treeA', 'treeB', 'rock', 'shoreC', 'stoneN', 'logN', 'stairS', 'stairN', 'centreStage', 'pondside', 'door-rs', 'door-cranny', 'door-museum', 'door-able', 'clifftop']) {
      const p = g.nodes[name];
      expect(p, name).toBeDefined();
      expect(walkable(g, p[0], p[1]), name).toBe(true);
      const r = route(g, g.nodes.homeA, p);
      expect(r, name).not.toBeNull();
      sound(g, g.nodes.homeA, r!);
    }
  });
  it('trunks, beds, the rock, water, the cliff face and building footprints are not walkable; the bridges and stairs are', () => {
    expect(g.nodes.homeA).toEqual([...HOMES.A]);
    expect(walkable(g, GOAL_TREES.A[0], GOAL_TREES.A[1])).toBe(false);
    expect(walkable(g, (BED_XS.A[0] + BED_XS.A[1]) / 2, (BED_ZS[0] + BED_ZS[1]) / 2)).toBe(false);
    expect(walkable(g, ROCK[0], ROCK[1])).toBe(false);
    expect(walkable(g, POND.x, POND.z)).toBe(false);
    expect(walkable(g, 120, 645)).toBe(false); // the river
    expect(walkable(g, 195, -40)).toBe(false); // the sea
    expect(walkable(g, 200, 1828)).toBe(false); // the cliff face
    const rs = BUILDINGS.find((b) => b.id === 'rs')!;
    expect(walkable(g, rs.x, rs.z + 20)).toBe(false);
    for (const b of BRIDGES) expect(walkable(g, b.x, (b.z0 + b.z1) / 2), b.id).toBe(true);
    expect(walkable(g, 60, 1828)).toBe(true); // the stairs
  });
  it('across the river only by a bridge; up the cliff only by the stairs', () => {
    const r = route(g, g.nodes.homeA, g.nodes.centreStage)!;
    sound(g, g.nodes.homeA, r);
    const pts = [g.nodes.homeA, ...r];
    for (let i = 1; i < pts.length; i++) {
      const [a, b] = [pts[i - 1], pts[i]];
      for (let k = 0; k <= 40; k++) {
        const x = a[0] + ((b[0] - a[0]) * k) / 40, z = a[1] + ((b[1] - a[1]) * k) / 40;
        if (inRiver(x, z)) expect(BRIDGES.some((br) => Math.abs(x - br.x) <= br.w / 2 && z >= br.z0 && z <= br.z1)).toBe(true);
      }
    }
    const up = route(g, g.nodes['door-museum'], g.nodes.clifftop)!;
    sound(g, g.nodes['door-museum'], up);
    const way = [g.nodes['door-museum'], ...up];
    for (let i = 1; i < way.length; i++)
      for (let k = 0; k <= 40; k++) {
        const x = way[i - 1][0] + ((way[i][0] - way[i - 1][0]) * k) / 40, z = way[i - 1][1] + ((way[i][1] - way[i - 1][1]) * k) / 40;
        if (z > CLIFF.z0 && z < CLIFF.z1) expect(x >= CLIFF.stair[0] && x <= CLIFF.stair[1]).toBe(true);
      }
  });
  it('a blocked straight line goes around through the nodes, never through a bed or a trunk', () => {
    const from = g.nodes.outA, to = g.nodes.homeA;
    const r = route(g, from, to)!;
    expect(r.at(-1)).toEqual(to);
    sound(g, from, r);
  });
  it('something standing in the way is walked around', () => {
    const from: Pt = [150, 860], to: Pt = [240, 860];
    expect(route(g, from, to)).toEqual([to]);
    const blocked = walkGeo({ obstacles: [{ x0: 177, x1: 213, y0: 820, y1: 900 }] });
    const r = route(blocked, from, to)!;
    expect(r.length).toBeGreaterThan(1);
    sound(blocked, from, r);
  });
  it('no way to somewhere off the mask; a walker caught a little off it still finds its way back', () => {
    expect(route(g, g.nodes.homeA, [195, -60])).toBeNull();
    expect(route(g, [HOMES.A[0], HOMES.A[1] + 2], g.nodes.homeB)).not.toBeNull();
  });
  it('a tap on the water goes to the nearest bank', () => {
    const p = nearestWalkable(g, 195, 640)!;
    expect(walkable(g, p[0], p[1])).toBe(true);
    expect(Math.hypot(p[0] - 195, p[1] - 640)).toBeLessThanOrEqual(40);
  });
});

describe('a parameterised geometry', () => {
  const g: WalkGeo = { zones: [{ x0: 0, x1: 200, y0: 0, y1: 200 }], obstacles: [{ x0: 90, x1: 110, y0: 0, y1: 120 }], nodes: {}, pad: 8 };
  it('routes around a wall by its padded corners', () => {
    const r = route(g, [40, 40], [160, 40])!;
    expect(r.at(-1)).toEqual([160, 40]);
    sound(g, [40, 40], r);
    expect(routeLength([40, 40], r)).toBeGreaterThan(240);
  });
  it('no way through a closed wall', () => {
    const closed: WalkGeo = { zones: g.zones, obstacles: [{ x0: 90, x1: 110, y0: -20, y1: 220 }], nodes: {}, pad: 8 };
    expect(route(closed, [40, 40], [160, 40])).toBeNull();
  });
});

describe('timing', () => {
  it('an action walk runs at 240 u/s, clamped to 150–900 ms; over 1.2 s there is no walk', () => {
    expect(actionMs(2)).toBe(0);
    expect(actionMs(12)).toBe(ACTION_MS.min);
    expect(actionMs(120)).toBe(500);
    expect(actionMs(240)).toBe(ACTION_MS.max);
    expect(actionMs(288)).toBe(ACTION_MS.max);
    expect(actionMs(289)).toBeNull();
  });
  it('a wander runs at 90 u/s', () => expect(wanderMs(90)).toBe(1000));
});

describe('action spots and the plan', () => {
  const g = walkGeo();
  it('spots around a target are walkable, beside it on the side the walker comes from first', () => {
    const spots = actionSpots(g, 196, 330, g.nodes.homeA);
    expect(spots.length).toBeGreaterThan(3);
    for (const [x, z] of spots) expect(walkable(g, x, z)).toBe(true);
    expect(spots[0][0]).toBeLessThan(196); // homeA (132) is to the left
  });
  it('the plan takes the nearest clear spot and its route, timed', () => {
    const p = plan(g, g.nodes.homeA, 160, 300, () => true)!;
    expect(p.ms).toBeGreaterThanOrEqual(ACTION_MS.min);
    expect(p.ms).toBeLessThanOrEqual(ACTION_MS.max);
    sound(g, g.nodes.homeA, p.pts as Pt[]);
  });
  it('nowhere clear to stand, or too far: no walk', () => {
    expect(plan(g, g.nodes.homeA, 160, 300, () => false)).toBeNull();
    const wide: WalkGeo = { zones: [{ x0: 0, x1: 1000, y0: 0, y1: 100 }], obstacles: [], nodes: {}, pad: 8 };
    expect(plan(wide, [0, 50], 600, 50, () => true)).toBeNull();
    expect(plan(wide, [0, 50], 200, 50, () => true)!.ms).toBeCloseTo(((200 - 26) / 240) * 1000, 0);
  });
  it('a given spot (the angler’s) is used as is', () => {
    const p = plan(g, g.nodes.homeB, 200, -30, () => true, [200, 20])!;
    expect(p.pts.at(-1)).toEqual([200, 20]);
  });
});

describe('facing', () => {
  it('faces the way it walks', () => {
    expect(facingFor([0, 0], [10, 0])).toBe('r');
    expect(facingFor([0, 0], [-10, 5])).toBe('l');
    expect(facingFor([0, 0], [1, 30])).toBeNull();
  });
});
