import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { actionSpots, nearestWalkable, route, routeLength, segmentClear, walkGeo, walkable, type Pt, type WalkGeo } from './walkGraph.ts';
import { plan } from '../components/island/avatar.ts';
import { defaultLayout, objMid } from '#lib/layout/model.ts';
import { worldOf } from './layoutWorld.ts';
import { CAMPSITE, FLOWERS, GOAL_TREES, HOMES, POND, ROCK, inRiver, onBridge, setWorld } from './world.ts';

/** Every segment of a route from `from` stays walkable. */
function sound(g: WalkGeo, from: Pt, pts: Pt[]) {
  let at = from;
  for (const p of pts) {
    expect(segmentClear(g, at, p)).toBe(true);
    at = p;
  }
}

// the island on the default layout (the walk is always the layout's grid: layout/nav.ts)
const l = defaultLayout();
beforeAll(() => setWorld(worldOf(l)));
afterAll(() => setWorld(null));

describe('the walk geometry (the layout’s walk grid)', () => {
  it('the homes, the doors, the stairs’ ends, the shore and the casting spots are walkable and reachable from home', () => {
    const g = walkGeo();
    for (const name of ['homeA', 'homeB', 'treeA', 'treeB', 'shoreC', 'stairS', 'stairN', 'centreStage', 'door-campsite', 'riverEast', 'mouth']) {
      const p = g.nodes[name];
      expect(p, name).toBeDefined();
      expect(walkable(g, p[0], p[1]), name).toBe(true);
      const r = route(g, g.nodes.homeA, p);
      expect(r, name).not.toBeNull();
      sound(g, g.nodes.homeA, r!);
    }
  });
  it('trunks, the rock, water and the tent are not walkable; the stairs and the flowers are', () => {
    const g = walkGeo();
    expect(g.nodes.homeA).toEqual([...HOMES.A]);
    expect(walkable(g, GOAL_TREES.A[0], GOAL_TREES.A[1])).toBe(false);
    expect(walkable(g, FLOWERS[0].x, FLOWERS[0].z)).toBe(true); // NH: you walk through flowers
    expect(walkable(g, ROCK[0], ROCK[1])).toBe(false);
    expect(walkable(g, POND.x, POND.z)).toBe(false);
    expect(walkable(g, 195, -40)).toBe(false); // the sea
    expect(walkable(g, CAMPSITE.x, CAMPSITE.z + 20)).toBe(false);
    expect(walkable(g, ...objMid(l, l.objects.get('stairs')!))).toBe(true);
  });
  it('the river crossed only on a bridge', () => {
    const g = walkGeo(), to = g.nodes['door-campsite'];
    const r = route(g, g.nodes.homeB, to)!;
    const way = [g.nodes.homeB, ...r];
    for (let i = 1; i < way.length; i++)
      for (let k = 0; k <= 40; k++) {
        const x = way[i - 1][0] + ((way[i][0] - way[i - 1][0]) * k) / 40, z = way[i - 1][1] + ((way[i][1] - way[i - 1][1]) * k) / 40;
        expect(inRiver(x, z) && !onBridge(x, z)).toBe(false);
      }
  });
  it('something standing in the way is walked around', () => {
    const g = walkGeo(), from = g.nodes.homeA, to = g.nodes.homeB;
    const straight = route(g, from, to)!, mid = straight.length === 1 ? [(from[0] + to[0]) / 2, (from[1] + to[1]) / 2] : straight[0];
    const blocked = walkGeo({ obstacles: [{ x0: mid[0] - 20, x1: mid[0] + 20, y0: mid[1] - 20, y1: mid[1] + 20 }] });
    const r = route(blocked, from, to)!;
    expect(r.at(-1)).toEqual(to);
    sound(blocked, from, r);
  });
  it('no way to somewhere off the grid; a walker caught a little off it still finds its way back', () => {
    const g = walkGeo();
    expect(route(g, g.nodes.homeA, [195, -60])).toBeNull();
    expect(route(g, [HOMES.A[0], HOMES.A[1] + 2], g.nodes.homeB)).not.toBeNull();
  });
  it('a tap on the water goes to the nearest bank', () => {
    const g = walkGeo(), [x, z] = [POND.x + POND.rx - 6, POND.z];
    const p = nearestWalkable(g, x, z)!;
    expect(walkable(g, p[0], p[1])).toBe(true);
    expect(Math.hypot(p[0] - x, p[1] - z)).toBeLessThanOrEqual(40);
  });
});

describe('action spots and the plan', () => {
  it('spots around a target are walkable, beside it on the side the walker comes from first', () => {
    const g = walkGeo(), [tx, tz] = g.nodes.centreStage;
    const spots = actionSpots(g, tx, tz, [tx - 200, tz]);
    expect(spots.length).toBeGreaterThan(3);
    for (const [x, z] of spots) expect(walkable(g, x, z)).toBe(true);
    expect(spots[0][0]).toBeLessThan(tx); // the walker comes from the left
  });
  it('the plan takes the nearest clear spot and its route, at 360 u/s', () => {
    const g = walkGeo(), [tx, tz] = g.nodes.centreStage;
    const p = plan(g, g.nodes.homeA, tx, tz, () => true)!;
    sound(g, g.nodes.homeA, p.pts as Pt[]);
    expect(p.ms).toBeCloseTo((routeLength(g.nodes.homeA, p.pts as Pt[]) / 360) * 1000, 0);
  });
  it('nowhere clear to stand: no walk', () => {
    const g = walkGeo(), [tx, tz] = g.nodes.centreStage;
    expect(plan(g, g.nodes.homeA, tx, tz, () => false)).toBeNull();
  });
});
