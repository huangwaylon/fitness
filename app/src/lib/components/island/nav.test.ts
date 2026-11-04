import { describe, expect, it } from 'vitest';
import { PAD, buildingAt, reachable, clear, doorOf, findPath, footprint, nav, nearestWalkable, pathLength, snapTap, walkable, waterAt, type Nav } from './nav.ts';
import { BRIDGE, BUILDINGS, CENTRE_STAGE, CLIFF, HOMES, LAND, POND, RIVER, ROCK, SHORE_Z, inOval, inRiver, onBridge, onLand, riverNear, type Pt } from './world.ts';

const g = nav();

/** The raw ground at a point, from world.ts alone (not nav's polygons): what a walk must never touch. */
function forbidden(x: number, z: number): string | null {
  if (onBridge(x, z)) return null;
  if (!onLand(x, z)) return 'sea';
  if (inRiver(x, z)) return 'river';
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
  it('water, the cliff face, the tent, trunks and the rock are not walkable; the stairs and the lawn are', () => {
    expect(walkable(g, HOMES.A[0], HOMES.A[1])).toBe(true);
    expect(walkable(g, POND.x, POND.z)).toBe(false);
    expect(walkable(g, BRIDGE.x, (BRIDGE.z0 + BRIDGE.z1) / 2)).toBe(true); // the bridge over the stream
    expect(walkable(g, BRIDGE.x - BRIDGE.w / 2 + 1, (BRIDGE.z0 + BRIDGE.z1) / 2)).toBe(false); // its rail
    for (const i of [5, 7, 9]) expect(walkable(g, RIVER[i][0], RIVER[i][1]), `stream ${i}`).toBe(false);
    expect(walkable(g, 250, (CLIFF.z0 + CLIFF.z1) / 2)).toBe(false); // the cliff face
    expect(walkable(g, (CLIFF.stair[0] + CLIFF.stair[1]) / 2, (CLIFF.z0 + CLIFF.z1) / 2)).toBe(true); // the stairs
    expect(walkable(g, ROCK[0], ROCK[1])).toBe(false);
    for (const b of BUILDINGS) expect(walkable(g, b.x, b.z + 20), b.id).toBe(false);
    expect(walkable(g, 195, -40)).toBe(false); // the sea
  });

  it('keeps a pad from the water: feet never stand within PAD of it', () => {
    const r = rng(7);
    // (failures collected, one expect)
    const fails: string[] = [];
    for (let i = 0; i < 4000; i++) {
      const [x, z] = randomWalkable(r, g);
      if (onBridge(x, z)) continue;
      const near = riverNear(x, z);
      if (!(near.d - near.hw > PAD - 0.5)) fails.push(`${x}, ${z}: ${near.d - near.hw} from the stream`);
      if (inOval(POND, x, z, PAD - 0.5)) fails.push(`${x}, ${z}: by the pond`);
    }
    expect(fails.slice(0, 10)).toEqual([]);
  });

  it('names the campsite’s door, both ends of the stairs, the homes, the shore and the casting spots, all walkable', () => {
    const names = ['homeA', 'homeB', 'stairS', 'stairN', 'shoreL', 'shoreC', 'shoreR', 'pondside', 'riverEast', 'riverBend', 'mouth', 'clifftop', 'centreStage'];
    for (const b of BUILDINGS) names.push(`door-${b.id}`);
    for (const n of names) {
      const p = g.named[n];
      expect(p, n).toBeDefined();
      expect(walkable(g, p[0], p[1]), n).toBe(true);
    }
    expect(g.named.homeA).toEqual([...HOMES.A]);
    expect(g.named['door-campsite']).toEqual(doorOf('campsite'));
  });
});

describe('paths', () => {
  it('a clear way is one straight segment', () => {
    expect(findPath(g, [...HOMES.A], [160, 300])).toEqual([[160, 300]]);
    expect(clear(g, [...HOMES.A], [...HOMES.B])).toBe(true);
  });

  it('walks from anywhere on the lawn to anywhere by the campsite, both ways, never through water', () => {
    const r = rng(11);
    for (let i = 0; i < 60; i++) {
      const a: Pt = [20 + r() * 350, 130 + r() * 440], b: Pt = [20 + r() * 320, 640 + r() * 360];
      if (!reachable(g, a[0], a[1]) || !reachable(g, b[0], b[1])) continue;
      for (const [s, t] of [[a, b], [b, a]] as const) {
        const p = findPath(g, s, t);
        expect(p, `${s} → ${t}`).not.toBeNull();
        sound(s, p!);
      }
    }
  });

  it('the main walk from home to centre stage is short (the path up the middle)', () => {
    const p = findPath(g, [...HOMES.A], g.named.centreStage)!;
    sound([...HOMES.A], p);
    expect(pathLength([...HOMES.A], p)).toBeLessThan(Math.hypot(CENTRE_STAGE[0] - HOMES.A[0], CENTRE_STAGE[1] - HOMES.A[1]) * 1.15);
  });

  it('climbs to the upper tier by the stairs', () => {
    const from = g.named['door-campsite'], p = findPath(g, from, [60, CLIFF.z1 + 30])!;
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
    const [cx, cz] = CENTRE_STAGE, v = [{ x0: cx - 18, x1: cx + 18, y0: cz - 8, y1: cz + 10 }];
    const from: Pt = [cx, cz - 60], to = g.named['door-campsite'];
    expect(clear(g, from, to)).toBe(true);
    expect(clear(g, from, to, v)).toBe(false);
    const p = findPath(g, from, to, v)!;
    expect(p.length).toBeGreaterThan(1);
    let at = from;
    for (const q of p) {
      expect(clear(g, at, q, v)).toBe(true);
      at = q;
    }
    expect(walkable(g, cx, cz, v)).toBe(false);
    expect(snapTap(g, cx, cz, v)?.kind).toBe('near');
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
    const [mx, mz] = RIVER[6], s = snapTap(g, mx, mz)!; // mid-stream
    expect(s.kind).toBe('bank');
    expect(s.water).toBe('river');
    expect(walkable(g, s.to[0], s.to[1])).toBe(true);
    expect(Math.hypot(s.to[0] - mx, s.to[1] - mz)).toBeLessThan(RIVER[6][2] / 2 + PAD + 4);
    // the nearer bank, facing the water: the west one, or the east strip's (reached round the bend)
    const w = snapTap(g, 365, 900)!;
    expect(w).toMatchObject({ kind: 'bank', face: 'r' });
    expect(w.to[0]).toBeLessThan(372 - 15);
    const e = snapTap(g, 382, 900)!;
    expect(e).toMatchObject({ kind: 'bank', face: 'l' });
    expect(e.to[0]).toBeGreaterThan(372 + 15);
    expect(reachable(g, e.to[0], e.to[1])).toBe(true);
  });

  it('the pond and the sea go to their banks; a tap far out at sea finds the beach', () => {
    const p = snapTap(g, POND.x + 30, POND.z)!;
    expect(p).toMatchObject({ kind: 'bank', water: 'pond' });
    expect(walkable(g, p.to[0], p.to[1])).toBe(true);
    expect(p.face).toBe('l');
    const s = snapTap(g, 195, SHORE_Z - 20)!;
    expect(s).toMatchObject({ kind: 'bank', water: 'sea' });
    expect(s.to[1]).toBeGreaterThan(SHORE_Z);
    expect(s.to[1]).toBeLessThan(SHORE_Z + 20);
    const far = snapTap(g, 160, -300)!;
    expect(far.kind).toBe('bank');
    expect(walkable(g, far.to[0], far.to[1])).toBe(true);
    expect(waterAt(160, -300)).toBe('sea');
    expect(waterAt(195, 640)).toBeNull();
  });

  it('the strip east of the stream is reached round the bend, and おく from the lawn only over the bridge', () => {
    expect(reachable(g, 404, 900)).toBe(true);
    const p = findPath(g, [...HOMES.B], [404, 900])!;
    sound(HOMES.B, p);
    const up = findPath(g, [...HOMES.A], [...CENTRE_STAGE])!;
    sound(HOMES.A, up);
    // the way up crosses the stream on the deck
    expect(up.some((q, i) => i > 0 && Math.min(up[i - 1][1], q[1]) < BRIDGE.z0 && Math.max(up[i - 1][1], q[1]) > BRIDGE.z1 && Math.abs(q[0] - BRIDGE.x) < BRIDGE.w / 2)).toBe(true);
  });

  it('anything else goes to the nearest walkable point within 40u, or nowhere', () => {
    const s = snapTap(g, ROCK[0], ROCK[1])!;
    expect(s.kind).toBe('near');
    expect(walkable(g, s.to[0], s.to[1])).toBe(true);
    expect(Math.hypot(s.to[0] - ROCK[0], s.to[1] - ROCK[1])).toBeLessThanOrEqual(40);
    const c = snapTap(g, 250, (CLIFF.z0 + CLIFF.z1) / 2)!; // the cliff face: below or above it
    expect(c.kind).toBe('near');
    expect(nearestWalkable(g, 250, (CLIFF.z0 + CLIFF.z1) / 2, 4)).toBeNull();
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
      const a = randomWalkable(r, n), b: Pt = [LAND.x0 + r() * (LAND.x1 - LAND.x0), -60 + r() * (LAND.z1 + 60)];
      const t0 = performance.now();
      const s = snapTap(n, b[0], b[1]);
      if (s) findPath(n, a, s.to);
      times.push(performance.now() - t0);
    }
    times.sort((x, y) => x - y);
    const p50 = times[times.length >> 1], p95 = times[Math.floor(times.length * 0.95)];
    console.info(`nav: ${n.nodes.length} nodes, ${n.adj.reduce((s, a) => s + a.length, 0) / 2} edges, ${n.polys.length} polygons; build median ${builds[3].toFixed(2)} ms; tap→path p50 ${p50.toFixed(3)} ms, p95 ${p95.toFixed(3)} ms`);
    // the budget itself (5 ms, 1 ms) only with PERF=1 on a quiet machine; otherwise a bound far above it that a shared CI
    // runner never nears but a blow-up (an O(n³) build, a query scanning every edge) still fails
    const strict = process.env.PERF === '1';
    expect(builds[3]).toBeLessThan(strict ? 5 : 150);
    expect(p95).toBeLessThan(strict ? 1 : 20);
  });
});
