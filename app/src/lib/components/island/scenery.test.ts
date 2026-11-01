// The still scenery stands where NH would let it: on the land, off the water, the paths, the buildings' footprints and
// the spots the island's features use (homes, beds, weeds, fossils); the walk still reaches every door; the scene's
// season tables resolve every key to shipped art.
import { describe, expect, it } from 'vitest';
import { artKeys } from '#lib/art.ts';
import { BED_XS, BED_ZS, BUILDINGS, CLIFF, DIG_SPOTS, GOAL_TREES, HOMES, LAWN_SPOTS, PATHS, POND, SCENERY, SPRING, riverNear, inOval, onGrass, onLand, type Pt } from './world.ts';
import { LIT_ART, MEADOW, sceneryKey } from './scene.ts';
import { route, walkGeo } from './walkGraph.ts';

const segDist = (line: readonly Pt[], x: number, z: number) => {
  let d = Infinity;
  for (let i = 0; i < line.length - 1; i++) {
    const [ax, az] = line[i], [bx, bz] = line[i + 1], dx = bx - ax, dz = bz - az, L = dx * dx + dz * dz || 1;
    const t = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / L));
    d = Math.min(d, Math.hypot(x - ax - dx * t, z - az - dz * t));
  }
  return d;
};
/** The phase-3 decor (and anything after it) is checked strictly; the earlier scenery keeps its own placements. */
const P3 = SCENERY.slice(SCENERY.findIndex((s) => s.id === 'lamp-b1'));

describe('scenery placement', () => {
  it.each(P3.map((s) => [s.id, s] as const))('%s stands clear', (_, s) => {
    expect(onLand(s.x, s.z) && (s.kind === 'palm' || onGrass(s.x, s.z))).toBe(true); // palms grow on the sand
    const r = riverNear(s.x, s.z);
    expect(r.d - r.hw).toBeGreaterThan(10);
    for (const o of [POND, SPRING]) expect(inOval(o, s.x, s.z, 14)).toBe(false);
    expect(s.z < CLIFF.z0 - 12 || s.z > CLIFF.z1 + 8).toBe(true);
    for (const line of [...PATHS.dirt, ...PATHS.brick]) expect(segDist(line, s.x, s.z)).toBeGreaterThan(20);
    for (const b of BUILDINGS) expect(Math.abs(s.x - b.x) < b.h * 0.75 && s.z > b.z - 10 && s.z < b.z + b.depth + 10).toBe(false);
    const spots: Pt[] = [...Object.values(HOMES), ...Object.values(GOAL_TREES), ...DIG_SPOTS, ...LAWN_SPOTS];
    for (const [x, z] of spots) expect(Math.hypot(s.x - x, s.z - z)).toBeGreaterThan(24);
    for (const xs of [BED_XS.A, BED_XS.B]) expect(s.x > xs[0] - 30 && s.x < xs[1] + 30 && s.z > BED_ZS[1] - 20 && s.z < BED_ZS[0] + 20).toBe(false);
  });
  it('keeps ids unique', () => {
    expect(new Set(SCENERY.map((s) => s.id)).size).toBe(SCENERY.length);
  });
  it('still walks from home to every door (the airport’s is reached off the graph, as walkGraph.test)', () => {
    const g = walkGeo();
    for (const n of Object.keys(g.nodes).filter((k) => (k.startsWith('door-') && k !== 'door-airport') || k === 'clifftop')) expect(route(g, HOMES.A, g.nodes[n]), n).not.toBeNull();
  });
});

describe('scenery keys by season', () => {
  const keys = new Set(artKeys());
  it.each(['spring', 'summer', 'autumn', 'winter'] as const)('resolve to shipped art in %s', (season) => {
    for (const m of [1, 4, 6, 8, 10, 12]) for (const s of [...SCENERY, ...BUILDINGS]) {
      if ('kind' in s && s.kind === 'oak') continue;
      expect(keys.has(sceneryKey(s.key, season, m)), `${s.key} in ${season}/${m}`).toBe(true);
    }
  });
  it('dress the cedar and the buildings in snow in winter only', () => {
    expect(sceneryKey('trees/cedar', 'winter', 1)).toBe('trees/cedar-winter');
    expect(sceneryKey('deco/airport', 'summer', 7)).toBe('deco/airport');
    for (const v of Object.values(LIT_ART)) expect(keys.has(v)).toBe(true);
  });
  it('give each meadow clump a mix of the season’s flowers', () => {
    for (const list of Object.values(MEADOW)) {
      const clump = [0, 1, 2].map((i) => sceneryKey(`meadow-${i}`, 'spring', 4));
      expect(new Set(clump).size).toBeGreaterThan(1);
      expect(list.length).toBeGreaterThan(3);
    }
  });
});
