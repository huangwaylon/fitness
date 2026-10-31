import { describe, expect, it } from 'vitest';
import { ACTION_MS, actionMs, actionSpots, depthZ, facingFor, route, routeLength, segmentClear, walkGeo, walkable, wanderMs, type Box, type Pt, type WalkGeo } from './walkGraph.ts';
import { plan } from './avatar.ts';
import { BED_ROWS, TREE, VILLAGER } from './scene.ts';

const crosses = (a: Pt, b: Pt, o: Box) => {
  for (let i = 0; i <= 100; i++) {
    const x = a[0] + ((b[0] - a[0]) * i) / 100, y = a[1] + ((b[1] - a[1]) * i) / 100;
    if (x > o.x0 && x < o.x1 && y > o.y0 && y < o.y1) return true;
  }
  return false;
};
/** Every segment of a route from `from` stays walkable and clear of every obstacle box. */
function sound(g: WalkGeo, from: Pt, pts: Pt[]) {
  let at = from;
  for (const p of pts) {
    expect(segmentClear(g, at, p)).toBe(true);
    for (const o of g.obstacles) expect(crosses(at, p, o)).toBe(false);
    at = p;
  }
}

describe('the walk geometry (from the scene constants)', () => {
  const g = walkGeo();
  it('every node is walkable and reachable from both homes', () => {
    for (const [name, [x, y]] of Object.entries(g.nodes)) {
      expect(walkable(g, x, y), name).toBe(true);
      for (const home of [g.nodes.homeA, g.nodes.homeB]) {
        const r = route(g, home, [x, y]);
        expect(r, `${name} from ${home}`).not.toBeNull();
        sound(g, home, r!);
      }
    }
  });
  it('homes are the villagers’ spots; the trunks, beds and rock are not walkable; the plaza is open', () => {
    expect(g.nodes.homeA).toEqual([VILLAGER.x.A, VILLAGER.foot]);
    expect(walkable(g, TREE.x.A, TREE.base - 4)).toBe(false);
    expect(walkable(g, 195, TREE.base)).toBe(true); // the plaza
    expect(walkable(g, 85, BED_ROWS[0] + 10)).toBe(false); // the left bed
    expect(walkable(g, 195, 20)).toBe(false); // the hedge and the sea behind it
    expect(walkable(g, 195, 400)).toBe(false); // the sea in front
  });
  it('a blocked straight line goes around through the nodes, never through a bed or a trunk', () => {
    const from = g.nodes.outA, to = g.nodes.homeA;
    expect(segmentClear(g, from, to)).toBe(false);
    const r = route(g, from, to)!;
    expect(r.length).toBeGreaterThan(1);
    expect(r.at(-1)).toEqual(to);
    sound(g, from, r);
  });
  it('something standing in the plaza is walked around', () => {
    const from = g.nodes.backA, to = g.nodes.treeB;
    expect(route(g, from, to)).toEqual([to]);
    const r = route(walkGeo({ obstacles: [{ x0: 169, x1: 221, y0: 150, y1: 178 }] }), from, to)!;
    expect(r.length).toBeGreaterThan(1);
    sound(g, from, r);
  });
  it('down to the beach and back (the ramp between the homes)', () => {
    for (const s of ['shoreL', 'shoreC', 'shoreR']) sound(g, g.nodes.homeB, route(g, g.nodes.homeB, g.nodes[s])!);
  });
  it('no way to somewhere off the mask', () => {
    expect(route(g, g.nodes.homeA, [195, 20])).toBeNull();
    expect(route(g, g.nodes.homeA, [TREE.x.B, TREE.base - 2])).toBeNull();
  });
  it('a walker caught a little off the mask still finds its way back', () => {
    const r = route(g, [VILLAGER.x.A, VILLAGER.foot + 16], g.nodes.homeB);
    expect(r).not.toBeNull();
  });
  it('more spots join the graph when they exist (a back strip with a pond)', () => {
    const back = walkGeo({ zones: [{ x0: 60, x1: 330, y0: 60, y1: 100 }], nodes: { pondside: [300, 70] }, obstacles: [{ x0: 250, x1: 290, y0: 60, y1: 80 }] });
    const r = route(back, back.nodes.homeA, back.nodes.pondside);
    expect(r).not.toBeNull();
    sound(back, back.nodes.homeA, r!);
  });
});

describe('a parameterised geometry', () => {
  const g: WalkGeo = { zones: [{ x0: 0, x1: 200, y0: 0, y1: 200 }], obstacles: [{ x0: 90, x1: 110, y0: 0, y1: 120 }], nodes: { gap: [100, 175] }, pad: 8 };
  it('routes around a wall through its gap node', () => {
    const r = route(g, [40, 40], [160, 40])!;
    expect(r).toEqual([[100, 175], [160, 40]]);
    sound(g, [40, 40], r);
    expect(routeLength([40, 40], r)).toBeCloseTo(Math.hypot(60, 135) * 2, 5);
  });
  it('no node, no way', () => {
    expect(route({ ...g, nodes: {} }, [40, 40], [160, 40])).toBeNull();
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
    const spots = actionSpots(g, 142, 143, g.nodes.homeA);
    expect(spots.length).toBeGreaterThan(3);
    for (const [x, y] of spots) expect(walkable(g, x, y)).toBe(true);
    expect(spots[0][0]).toBeGreaterThan(142); // homeA (151) is to the right
  });
  it('the plan takes the nearest clear spot and its route, timed', () => {
    const p = plan(g, g.nodes.homeA, 195, 310, () => true)!;
    expect(p.ms).toBeGreaterThanOrEqual(ACTION_MS.min);
    expect(p.ms).toBeLessThanOrEqual(ACTION_MS.max);
    sound(g, g.nodes.homeA, p.pts as Pt[]);
  });
  it('nowhere clear to stand, or too far: no walk', () => {
    expect(plan(g, g.nodes.homeA, 195, 310, () => false)).toBeNull();
    const wide: WalkGeo = { zones: [{ x0: 0, x1: 1000, y0: 0, y1: 100 }], obstacles: [], nodes: {}, pad: 8 };
    expect(plan(wide, [0, 50], 600, 50, () => true)).toBeNull();
    expect(plan(wide, [0, 50], 200, 50, () => true)!.ms).toBeCloseTo(((200 - 26) / 240) * 1000, 0);
  });
  it('a given spot (the angler’s) is used as is', () => {
    const p = plan(g, g.nodes.homeB, 200, 360, () => true, [200, 340])!;
    expect(p.pts.at(-1)).toEqual([200, 340]);
  });
});

describe('depth and facing', () => {
  it('behind the trees < among the beds < the front row < the beach, and under the trees’ layers behind them', () => {
    const zs = [TREE.base - 30, TREE.base + 20, BED_ROWS[0] + 10, VILLAGER.foot, 340].map(depthZ);
    expect([...zs].sort((a, b) => a - b)).toEqual(zs);
    expect(zs[0]).toBeLessThan(30); // --z-tree
    expect(depthZ(VILLAGER.foot)).toBe(51); // --z-villager, as before
  });
  it('faces the way it walks', () => {
    expect(facingFor([0, 0], [10, 0])).toBe('r');
    expect(facingFor([0, 0], [-10, 5])).toBe('l');
    expect(facingFor([0, 0], [1, 30])).toBeNull();
  });
});
