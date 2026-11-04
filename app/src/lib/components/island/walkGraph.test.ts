import type { Box } from './geom.ts';
import { describe, expect, it } from 'vitest';
import { actionSpots, nearestWalkable, route, routeLength, segmentClear, walkGeo, walkable, type Pt, type WalkGeo } from './walkGraph.ts';
import { plan } from './avatar.ts';
import { BRIDGE_RAIL, CAMPSITE, FLOWERS, CLIFF, GOAL_TREES, HOMES, POND, RIVER, ROCK, inRiver, onBridge } from './world.ts';

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
  it('the homes, the campsite’s door, the stairs’ ends, the shore and the casting spots are walkable and reachable from home', () => {
    for (const name of ['homeA', 'homeB', 'treeA', 'treeB', 'rock', 'shoreC', 'stairS', 'stairN', 'centreStage', 'pondside', 'door-campsite', 'clifftop', 'riverEast', 'riverBend', 'mouth']) {
      const p = g.nodes[name];
      expect(p, name).toBeDefined();
      expect(walkable(g, p[0], p[1]), name).toBe(true);
      const r = route(g, g.nodes.homeA, p);
      expect(r, name).not.toBeNull();
      sound(g, g.nodes.homeA, r!);
    }
  });
  it('trunks, the rock, water, the cliff face and the tent are not walkable; the stairs and the flowers are', () => {
    expect(g.nodes.homeA).toEqual([...HOMES.A]);
    expect(walkable(g, GOAL_TREES.A[0], GOAL_TREES.A[1])).toBe(false);
    expect(walkable(g, FLOWERS[0].x, FLOWERS[0].z)).toBe(true); // NH: you walk through flowers
    expect(walkable(g, ROCK[0], ROCK[1])).toBe(false);
    expect(walkable(g, POND.x, POND.z)).toBe(false);
    expect(walkable(g, RIVER[6][0], RIVER[6][1])).toBe(false); // the stream
    expect(walkable(g, 195, -40)).toBe(false); // the sea
    expect(walkable(g, 200, (CLIFF.z0 + CLIFF.z1) / 2)).toBe(false); // the cliff face
    expect(walkable(g, CAMPSITE.x, CAMPSITE.z + 20)).toBe(false);
    expect(walkable(g, 60, (CLIFF.z0 + CLIFF.z1) / 2)).toBe(true); // the stairs
  });
  it('up the cliff only by the stairs; the stream crossed only on the bridge', () => {
    const r = route(g, g.nodes.homeA, g.nodes.centreStage)!;
    sound(g, g.nodes.homeA, r);
    for (const [a, b] of [[g.nodes.homeA, r[0]], ...r.slice(1).map((p, i) => [r[i], p])] as [Pt, Pt][])
      for (let k = 0; k <= 40; k++) {
        const x = a[0] + ((b[0] - a[0]) * k) / 40, z = a[1] + ((b[1] - a[1]) * k) / 40;
        expect(inRiver(x, z) && !onBridge(x, z, BRIDGE_RAIL)).toBe(false);
      }
    const up = route(g, g.nodes['door-campsite'], g.nodes.stairN)!;
    sound(g, g.nodes['door-campsite'], up);
    const way = [g.nodes['door-campsite'], ...up];
    for (let i = 1; i < way.length; i++)
      for (let k = 0; k <= 40; k++) {
        const x = way[i - 1][0] + ((way[i][0] - way[i - 1][0]) * k) / 40, z = way[i - 1][1] + ((way[i][1] - way[i - 1][1]) * k) / 40;
        if (z > CLIFF.z0 && z < CLIFF.z1) expect(x >= CLIFF.stair[0] && x <= CLIFF.stair[1]).toBe(true);
      }
  });
  it('a blocked straight line goes around through the nodes, never through a bush or a trunk', () => {
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
    const [x, z] = [POND.x + POND.rx - 6, POND.z];
    const p = nearestWalkable(g, x, z)!;
    expect(walkable(g, p[0], p[1])).toBe(true);
    expect(Math.hypot(p[0] - x, p[1] - z)).toBeLessThanOrEqual(40);
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

describe('action spots and the plan', () => {
  const g = walkGeo();
  it('spots around a target are walkable, beside it on the side the walker comes from first', () => {
    const spots = actionSpots(g, 196, 330, g.nodes.homeA);
    expect(spots.length).toBeGreaterThan(3);
    for (const [x, z] of spots) expect(walkable(g, x, z)).toBe(true);
    expect(spots[0][0]).toBeLessThan(196); // homeA (132) is to the left
  });
  it('the plan takes the nearest clear spot and its route, at 360 u/s', () => {
    const p = plan(g, g.nodes.homeA, 160, 300, () => true)!;
    sound(g, g.nodes.homeA, p.pts as Pt[]);
    const wide: WalkGeo = { zones: [{ x0: 0, x1: 1000, y0: 0, y1: 100 }], obstacles: [], nodes: {}, pad: 8 };
    expect(plan(wide, [0, 50], 200, 50, () => true)!.ms).toBeCloseTo(((200 - 26) / 360) * 1000, 0);
  });
  it('nowhere clear to stand: no walk', () => {
    expect(plan(g, g.nodes.homeA, 160, 300, () => false)).toBeNull();
  });
});

