// The still scenery stands where NH would let it: on the land, off the water, the paths, the buildings' footprints and
// the spots the island's features use (homes, trees, weeds, fossils); the wild flowers grow in small clumps on open
// grass; the walk still reaches every door; the scene's
// season tables resolve every key to shipped art.
import { describe, expect, it } from 'vitest';
import { artKeys } from '#lib/art.ts';
import {
  BUILDINGS, CENTRE_STAGE, CLIFF, DIG_SPOTS, FLOWERS, GOAL_TREES, HEDGE_XS, HEDGE_Z, HOMES, LAWN_SPOTS, PATHS, POND, ROCK, SCENERY, SPRING, TAPE_DECK,
  flowerById, riverNear, inOval, onGrass, onLand, type Pt
} from './world.ts';
import { LIT_ART, WILD, sceneryKey, wildFlower } from './scene.ts';
import { hybridsOf } from './care.ts';
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
/** おく's scenery (from the hedge gap's lamps on) is checked strictly; まえ's earlier scenery keeps its own placements. */
const P3 = SCENERY.slice(SCENERY.findIndex((s) => s.id === 'lamp-b1'));

describe('scenery placement', () => {
  it.each(P3.map((s) => [s.id, s] as const))('%s stands clear', (_, s) => {
    expect(onLand(s.x, s.z) && (s.kind === 'palm' || onGrass(s.x, s.z))).toBe(true); // palms grow on the sand
    const r = riverNear(s.x, s.z);
    expect(r.d - r.hw).toBeGreaterThan(10);
    for (const o of [POND, SPRING]) expect(inOval(o, s.x, s.z, 14)).toBe(false);
    expect(s.z < CLIFF.z0 - 12 || s.z > CLIFF.z1 + 8).toBe(true);
    for (const line of PATHS.dirt) expect(segDist(line, s.x, s.z)).toBeGreaterThan(20);
    for (const b of BUILDINGS) expect(Math.abs(s.x - b.x) < b.h * 0.75 && s.z > b.z - 10 && s.z < b.z + b.depth + 10).toBe(false);
    const spots: Pt[] = [...Object.values(HOMES), ...Object.values(GOAL_TREES), ...DIG_SPOTS, ...LAWN_SPOTS];
    for (const [x, z] of spots) expect(Math.hypot(s.x - x, s.z - z)).toBeGreaterThan(24);
  });
  it('keeps ids unique', () => {
    expect(new Set(SCENERY.map((s) => s.id)).size).toBe(SCENERY.length);
  });
  it('still walks from home to the campsite’s door and the falls’ pool', () => {
    const g = walkGeo();
    for (const n of Object.keys(g.nodes).filter((k) => k.startsWith('door-') || k === 'clifftop')) expect(route(g, HOMES.A, g.nodes[n]), n).not.toBeNull();
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
  it('dress the cedar and the campsite in snow in winter only', () => {
    expect(sceneryKey('trees/cedar', 'winter', 1)).toBe('trees/cedar-winter');
    expect(sceneryKey('deco/campsite', 'winter', 1)).toBe('deco/campsite-winter');
    expect(sceneryKey('deco/campsite', 'summer', 7)).toBe('deco/campsite');
    for (const v of Object.values(LIT_ART)) expect(keys.has(v)).toBe(true);
  });
  it('give the wild flowers shipped art in every season, a mix of kinds, and their hybrids too', () => {
    for (const [season, list] of Object.entries(WILD)) {
      expect(list.length, season).toBeGreaterThan(3);
      for (const k of list) {
        expect(keys.has(`flowers/${k}`), k).toBe(true);
        expect(hybridsOf(k).length, k).toBeGreaterThan(0);
        for (const h of hybridsOf(k)) expect(keys.has(`flowers/${h}`), h).toBe(true);
      }
    }
  });

});

describe('the wild flowers', () => {
  const clumps = Map.groupBy(FLOWERS, (f) => f.clump);
  it('grow in clumps of 2–5 of one kind, each flower with an id from where it stands', () => {
    for (const fs of clumps.values()) expect(fs.length >= 2 && fs.length <= 5).toBe(true);
    for (const f of FLOWERS) expect(f.id).toBe(`fl:${f.x}:${f.z}`);
    expect(new Set(FLOWERS.map((f) => f.id)).size).toBe(FLOWERS.length);
    expect(flowerById(FLOWERS[3].id)).toBe(FLOWERS[3]);
    for (const fs of clumps.values()) expect(new Set(fs.map((f) => wildFlower(f, 'spring'))).size).toBe(1);
    // neighbouring clumps differ
    for (let c = 1; c < clumps.size; c++) expect(wildFlower({ clump: c }, 'autumn')).not.toBe(wildFlower({ clump: c - 1 }, 'autumn'));
  });
  it('are not too many nor too few, and sparse on the front lawn', () => {
    expect(FLOWERS.length).toBeGreaterThanOrEqual(16);
    expect(FLOWERS.length).toBeLessThanOrEqual(36);
    const front = FLOWERS.filter((f) => f.z < HEDGE_Z).length;
    expect(front).toBeLessThanOrEqual(12);
    expect(front).toBeLessThan(FLOWERS.length - front);
  });
  it.each(FLOWERS.map((f) => [f.id, f] as const))('%s grows on open grass', (_, f) => {
    expect(onGrass(f.x, f.z)).toBe(true);
    const r = riverNear(f.x, f.z);
    expect(r.d - r.hw).toBeGreaterThan(10);
    for (const o of [POND, SPRING]) expect(inOval(o, f.x, f.z, 12)).toBe(false);
    expect(f.z < CLIFF.z0 - 12).toBe(true);
    for (const line of PATHS.dirt) expect(segDist(line, f.x, f.z)).toBeGreaterThan(16);
    for (const b of BUILDINGS) expect(Math.abs(f.x - b.x) < b.h * 0.75 && f.z > b.z - 20 && f.z < b.z + b.depth + 10).toBe(false);
    for (const [x, z] of [...Object.values(HOMES), ...Object.values(GOAL_TREES), CENTRE_STAGE, TAPE_DECK, ROCK]) expect(Math.hypot(f.x - x, f.z - z)).toBeGreaterThan(30);
    for (const [x, z] of [...DIG_SPOTS, ...LAWN_SPOTS]) expect(Math.hypot(f.x - x, f.z - z)).toBeGreaterThan(16);
    for (const x of HEDGE_XS) expect(Math.hypot(f.x - x, f.z - HEDGE_Z)).toBeGreaterThan(28);
    for (const s of SCENERY) expect(Math.hypot(f.x - s.x, f.z - s.z), s.id).toBeGreaterThan(s.kind === 'oak' || s.kind === 'cedar' ? 26 : 20);
    // not hidden behind a goal tree's canopy
    for (const [x, z] of Object.values(GOAL_TREES)) expect(Math.abs(f.x - x) < 52 && f.z > z && f.z < z + 170).toBe(false);
  });
});
