import { describe, expect, it } from 'vitest';
import { PAD, buildingAt, reachable, clear, doorOf, findPath, footprint, nav, nearestWalkable, pathLength, snapTap, walkable, waterAt, type Nav } from './nav.ts';
import { BRIDGES, BUILDINGS, CLIFF, HOMES, LAND, POND, ROCK, inOval, inRiver, onLand, riverNear, type Pt } from './world.ts';

const g = nav();

/** The raw ground at a point, from world.ts alone (not nav's polygons): what a walk must never touch. */
function forbidden(x: number, z: number): string | null {
  const deck = BRIDGES.some((b) => Math.abs(x - b.x) <= b.w / 2 && z >= b.z0 && z <= b.z1);
  if (!onLand(x, z)) return 'sea';
  if (!deck && inRiver(x, z)) return 'river';
  if (inOval(POND, x, z)) return 'pond';
  if (z >= CLIFF.z0 && z <= CLIFF.z1 && !(x >= CLIFF.stair[0] && x <= CLIFF.stair[1]) && !(x >= CLIFF.fall[0] && x <= CLIFF.fall[1])) return 'cliff';
  for (const b of BUILDINGS) {
    const f = footprint(b.id);
    if (x > f.x0 && x < f.x1 && z > f.y0 && z < f.y1) return `building ${b.id}`;
  }
  return null;
}

/** Every segment of a route from `from`, sampled every unit, stays off water, the cliff face and the buildings. */
function sound(from: Pt, pts: readonly Pt[]) {
  let at = from;
  for (const p of pts) {
    const n = Math.max(1, Math.ceil(Math.hypot(p[0] - at[0], p[1] - at[1])));
    for (let i = 0; i <= n; i++) {
      const x = at[0] + ((p[0] - at[0]) * i) / n, z = at[1] + ((p[1] - at[1]) * i) / n;
      const bad = forbidden(x, z);
      if (bad) throw new Error(`${bad} at ${x.toFixed(1)}, ${z.toFixed(1)} on ${JSON.stringify(at)} → ${JSON.stringify(p)}`);
    }
    at = p;
  }
}

/** Where a route crosses the river's west–east reach (its centreline near z 640, x 120…330): the crossing x's. */
function riverCrossings(from: Pt, pts: readonly Pt[]): number[] {
  const out: number[] = [];
  let at = from;
  for (const p of pts) {
    for (const zc of [640]) {
      if ((at[1] - zc) * (p[1] - zc) < 0) out.push(at[0] + ((p[0] - at[0]) * (zc - at[1])) / (p[1] - at[1]));
    }
    at = p;
  }
  return out;
}

/** A deterministic random (mulberry32). */
function rng(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
/** A random point of the island's main ground (reachable from home). */
function randomWalkable(r: () => number, n: Nav): Pt {
  for (;;) {
    const p: Pt = [LAND.x0 + r() * (LAND.x1 - LAND.x0), LAND.z0 + r() * (LAND.z1 - LAND.z0)];
    if (reachable(n, p[0], p[1])) return p;
  }
}

describe('the obstacles', () => {
  it('water, the cliff face, building footprints, trunks and the rock are not walkable; the bridges, the stairs and the lawn are', () => {
    expect(walkable(g, HOMES.A[0], HOMES.A[1])).toBe(true);
    expect(walkable(g, POND.x, POND.z)).toBe(false);
    expect(walkable(g, 195, 640 + 30)).toBe(true); // the plaza side of the stone bridge
    for (const b of BRIDGES) for (const z of [b.z0 + 2, 640, b.z1 - 2]) expect(walkable(g, b.x, z), `${b.id} ${z}`).toBe(true);
    expect(walkable(g, 150, 642)).toBe(false); // the river between the bridges
    expect(walkable(g, 250, 1828)).toBe(false); // the cliff face
    expect(walkable(g, (CLIFF.stair[0] + CLIFF.stair[1]) / 2, 1828)).toBe(true); // the stairs
    expect(walkable(g, ROCK[0], ROCK[1])).toBe(false);
    for (const b of BUILDINGS) expect(walkable(g, b.x, b.z + 20), b.id).toBe(false);
    expect(walkable(g, 195, -40)).toBe(false); // the sea
  });

  it('keeps a pad from the water: feet never stand within PAD of it', () => {
    const r = rng(7);
    for (let i = 0; i < 4000; i++) {
      const [x, z] = randomWalkable(r, g);
      const near = riverNear(x, z);
      const deck = BRIDGES.some((b) => Math.abs(x - b.x) <= b.w / 2 && z >= b.z0 - PAD && z <= b.z1 + PAD);
      if (!deck) expect(near.d - near.hw, `${x}, ${z}`).toBeGreaterThan(PAD - 0.5);
      expect(inOval(POND, x, z, PAD - 0.5)).toBe(false);
    }
  });

  it('names every door, both ends of each bridge and of the stairs, the homes, the shore and the casting spots, all walkable', () => {
    const names = ['homeA', 'homeB', 'stoneS', 'stoneN', 'logS', 'logN', 'stairS', 'stairN', 'shoreL', 'shoreC', 'shoreR', 'pondside', 'riverEast', 'riverBend', 'mouth', 'clifftop', 'centreStage'];
    for (const b of BUILDINGS) names.push(`door-${b.id}`);
    for (const n of names) {
      const p = g.named[n];
      expect(p, n).toBeDefined();
      expect(walkable(g, p[0], p[1]), n).toBe(true);
    }
    expect(g.named.homeA).toEqual([...HOMES.A]);
    expect(g.named['door-rs']).toEqual(doorOf('rs'));
  });
});

describe('paths', () => {
  it('a clear way is one straight segment', () => {
    expect(findPath(g, [...HOMES.A], [160, 300])).toEqual([[160, 300]]);
    expect(clear(g, [...HOMES.A], [...HOMES.B])).toBe(true);
  });

  it('crosses the river only on a bridge, both ways, from anywhere on the lawn to anywhere in the plaza', () => {
    const r = rng(11);
    for (let i = 0; i < 60; i++) {
      const a: Pt = [20 + r() * 350, 130 + r() * 440], b: Pt = [80 + r() * 230, 700 + r() * 360];
      if (!walkable(g, a[0], a[1]) || !walkable(g, b[0], b[1])) continue;
      for (const [s, t] of [[a, b], [b, a]] as const) {
        const p = findPath(g, s, t);
        expect(p, `${s} → ${t}`).not.toBeNull();
        sound(s, p!);
        for (const x of riverCrossings(s, p!)) expect(BRIDGES.some((br) => Math.abs(x - br.x) <= br.w / 2), `crossed at x ${x}`).toBe(true);
      }
    }
  });

  it('the main walk from home to centre stage goes over the stone bridge', () => {
    const p = findPath(g, [...HOMES.A], g.named.centreStage)!;
    sound([...HOMES.A], p);
    const xs = riverCrossings([...HOMES.A], p);
    expect(xs).toHaveLength(1);
    expect(Math.abs(xs[0] - BRIDGES[0].x)).toBeLessThanOrEqual(BRIDGES[0].w / 2);
  });

  it('the partner’s side takes the log bridge to the east bank of the plaza', () => {
    const p = findPath(g, [...HOMES.B], [320, 760])!;
    sound([...HOMES.B], p);
    const xs = riverCrossings([...HOMES.B], p);
    expect(xs).toHaveLength(1);
    expect(Math.abs(xs[0] - BRIDGES[1].x)).toBeLessThanOrEqual(BRIDGES[1].w / 2);
  });

  it('climbs to the campsite by the stairs', () => {
    const from = g.named['door-museum'], p = findPath(g, from, g.named['door-campsite'])!;
    expect(p).not.toBeNull();
    sound(from, p);
    let at = from, crossed = 0;
    for (const q of p) {
      const zc = (CLIFF.z0 + CLIFF.z1) / 2;
      if ((at[1] - zc) * (q[1] - zc) < 0) {
        const x = at[0] + ((q[0] - at[0]) * (zc - at[1])) / (q[1] - at[1]);
        expect(x).toBeGreaterThanOrEqual(CLIFF.stair[0]);
        expect(x).toBeLessThanOrEqual(CLIFF.stair[1]);
        crossed++;
      }
      at = q;
    }
    expect(crossed).toBe(1);
  });

  it('every door is reachable from home, by a sound way no longer than 1.6× the straight line plus the detours a bridge forces', () => {
    for (const b of BUILDINGS) {
      const to = g.named[`door-${b.id}`], p = findPath(g, [...HOMES.A], to);
      expect(p, b.id).not.toBeNull();
      sound([...HOMES.A], p!);
      expect(p!.at(-1)).toEqual(to);
      expect(pathLength([...HOMES.A], p!)).toBeLessThan(Math.hypot(to[0] - HOMES.A[0], to[1] - HOMES.A[1]) * 1.6 + 200);
    }
  });

  it('any walkable point reaches any other (one connected island), by sound ways (fuzz)', () => {
    const r = rng(3);
    for (let i = 0; i < 250; i++) {
      const a = randomWalkable(r, g), b = randomWalkable(r, g);
      const p = findPath(g, a, b);
      expect(p, `${a} → ${b}`).not.toBeNull();
      sound(a, p!);
      expect(p!.at(-1)).toEqual(b);
    }
  });

  it('never routes to an unwalkable goal; a start caught inside a pad walks out', () => {
    expect(findPath(g, [...HOMES.A], [POND.x, POND.z])).toBeNull();
    const caught: Pt = [ROCK[0] + 12 + PAD - 2, ROCK[1]]; // inside the rock's pad, not the rock
    expect(walkable(g, caught[0], caught[1])).toBe(false);
    const p = findPath(g, caught, [...HOMES.A]);
    expect(p).not.toBeNull();
  });

  it('walks around a visitor standing on centre stage (an extra box)', () => {
    const v = [{ x0: 177, x1: 213, y0: 892, y1: 910 }];
    const from = g.named.stoneN, to: Pt = [195, 960];
    expect(clear(g, from, to)).toBe(true);
    expect(clear(g, from, to, v)).toBe(false);
    const p = findPath(g, from, to, v)!;
    expect(p.length).toBeGreaterThan(1);
    let at = from;
    for (const q of p) {
      expect(clear(g, at, q, v)).toBe(true);
      at = q;
    }
    expect(walkable(g, 195, 900, v)).toBe(false);
    expect(snapTap(g, 195, 900, v)?.kind).toBe('near');
  });
});

describe('snapping a tap', () => {
  it('walkable ground is walked to as tapped', () => {
    expect(snapTap(g, 150, 300)).toEqual({ to: [150, 300], kind: 'here' });
  });

  it('a building’s footprint sends you to its door', () => {
    for (const b of BUILDINGS) {
      const f = footprint(b.id), s = snapTap(g, (f.x0 + f.x1) / 2 + 10, (f.y0 + f.y1) / 2);
      expect(s, b.id).toMatchObject({ kind: 'door', building: b.id, to: g.named[`door-${b.id}`] });
      expect(buildingAt(b.x, b.z + 10)).toBe(b.id);
    }
  });

  it('river water goes to the nearest bank, facing the water', () => {
    const s = snapTap(g, 150, 646)!; // mid-river, between the bridges
    expect(s.kind).toBe('bank');
    expect(s.water).toBe('river');
    expect(walkable(g, s.to[0], s.to[1])).toBe(true);
    expect(Math.hypot(s.to[0] - 150, s.to[1] - 646)).toBeLessThan(15 + PAD + 4);
    // the east reach: the plaza's bank, facing the water (the sand beyond it is a pocket nobody can reach)
    for (const x of [365, 380]) {
      const e = snapTap(g, x, 1000)!;
      expect(e.kind).toBe('bank');
      expect(e.to[0]).toBeLessThan(372 - 15);
      expect(e.face).toBe('r');
    }
  });

  it('the pond and the sea go to their banks; a tap far out at sea finds the beach', () => {
    const p = snapTap(g, POND.x + 30, POND.z)!;
    expect(p).toMatchObject({ kind: 'bank', water: 'pond' });
    expect(walkable(g, p.to[0], p.to[1])).toBe(true);
    expect(p.face).toBe('l');
    const s = snapTap(g, 195, -20)!;
    expect(s).toMatchObject({ kind: 'bank', water: 'sea' });
    expect(s.to[1]).toBeGreaterThan(0);
    expect(s.to[1]).toBeLessThan(20);
    const far = snapTap(g, 160, -300)!;
    expect(far.kind).toBe('bank');
    expect(walkable(g, far.to[0], far.to[1])).toBe(true);
    expect(waterAt(160, -300)).toBe('sea');
    expect(waterAt(BRIDGES[0].x, 640)).toBeNull();
  });

  it('a pocket nobody can walk to (the sand east of the river, walled in by cedars) sends you to the nearest main ground, facing it', () => {
    expect(walkable(g, 404, 1100)).toBe(true);
    expect(reachable(g, 404, 1100)).toBe(false);
    expect(findPath(g, [...HOMES.A], [404, 1100])).toBeNull();
    const s = snapTap(g, 404, 1100)!;
    expect(s.kind).toBe('near');
    expect(reachable(g, s.to[0], s.to[1])).toBe(true);
    expect(s.to[0]).toBeLessThan(372);
    expect(s.face).toBe('r');
    expect(findPath(g, [...HOMES.A], s.to)).not.toBeNull();
  });

  it('anything else goes to the nearest walkable point within 40u, or nowhere', () => {
    const s = snapTap(g, ROCK[0], ROCK[1])!;
    expect(s.kind).toBe('near');
    expect(walkable(g, s.to[0], s.to[1])).toBe(true);
    expect(Math.hypot(s.to[0] - ROCK[0], s.to[1] - ROCK[1])).toBeLessThanOrEqual(40);
    const c = snapTap(g, 250, 1828)!; // the cliff face: below or above it
    expect(c.kind).toBe('near');
    expect(nearestWalkable(g, 250, 1828, 4)).toBeNull();
  });
});

describe('performance budget (spec §4: the graph ≤ 5 ms at load, a query ≤ 1 ms)', () => {
  it('builds the visibility graph and answers taps within budget', () => {
    const builds: number[] = [];
    for (let i = 0; i < 7; i++) builds.push(nav(true).buildMs);
    const n = nav();
    builds.sort((a, b) => a - b);
    const r = rng(5), times: number[] = [];
    for (let i = 0; i < 400; i++) {
      const a = randomWalkable(r, n), b: Pt = [LAND.x0 + r() * (LAND.x1 - LAND.x0), -60 + r() * 2200];
      const t0 = performance.now();
      const s = snapTap(n, b[0], b[1]);
      if (s) findPath(n, a, s.to);
      times.push(performance.now() - t0);
    }
    times.sort((x, y) => x - y);
    const p50 = times[times.length >> 1], p95 = times[Math.floor(times.length * 0.95)];
    console.info(`nav: ${n.nodes.length} nodes, ${n.adj.reduce((s, a) => s + a.length, 0) / 2} edges, ${n.polys.length} polygons; build median ${builds[3].toFixed(2)} ms; tap→path p50 ${p50.toFixed(3)} ms, p95 ${p95.toFixed(3)} ms`);
    // headroom for a loaded test machine: the budget is measured on the phone (docs), the test catches regressions
    expect(builds[3]).toBeLessThan(15);
    expect(p95).toBeLessThan(2);
  });
});
