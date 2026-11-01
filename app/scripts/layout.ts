// The island's scatter (docs/design.md "World: Layout"): where the wild flowers' clumps and the weeds' lawn spots go,
// around the composed pieces (world.ts SCENERY, the hedge, the goal trees, the homes, the dig spots, the decor's
// slots). Seeded best-candidate sampling (Mitchell's, a Poisson-disk sampler): a jittered grid of candidates on the
// open lawn, each pick the candidate farthest from everything already there, so the lawn fills evenly with no clumps
// and no dead zones; every kind keeps its own minimum gap to every other (GAP). Writes
// src/lib/components/island/scatter.json (world.ts reads it) and prints each section's emptiest spot before and after.
//
// Usage (from app/): node scripts/layout.ts [--dry]
import { writeFileSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { mulberry32 } from '../src/lib/random.ts';
import {
  BUILDINGS, CENTRE_STAGE, CLIFF, DIG_SPOTS, DECOR_SLOTS, FLOWERS, GOAL_TREES, HEDGE_XS, HEDGE_Z, HOMES, LAWN_SPOTS, PATHS, POND, ROCK, SCENERY, SPRING, TAPE_DECK,
  inOval, onGrass, riverNear, type Pt
} from '../src/lib/components/island/world.ts';
import { MUSHROOM_SPOTS } from '../src/lib/components/island/mushrooms.ts';

const OUT = join(import.meta.dirname, '..', 'src', 'lib', 'components', 'island', 'scatter.json');
const SEED = 0x15_1a_2d;
/** The sections' lawn (z ranges) and how many clumps / weed spots each takes (the front lawn sparse: the villagers'
 *  stage and the sea view stay open). */
const SECTIONS = [
  { name: 'まえ', z0: 112, z1: 590, clumps: [2, 2, 3, 3], weeds: 7 },
  { name: 'おく', z0: 662, z1: 1030, clumps: [4, 3, 5], weeds: 8 }
] as const;

/** Per-kind minimum gaps (u) from a clump's centre / a weed spot to each kind of thing. */
const GAP = {
  clump: { clump: 76, tree: 52, grove: 72, bush: 42, prop: 34, rock: 30, spot: 36, home: 50, path: 34, water: 26, hedge: 44, building: 30 },
  weed: { clump: 40, weed: 64, tree: 30, grove: 30, bush: 28, prop: 30, rock: 26, spot: 30, home: 30, path: 22, water: 18, hedge: 30, building: 24 }
} as const;

const segDist = (line: readonly Pt[], x: number, z: number) => {
  let d = Infinity;
  for (let i = 0; i < line.length - 1; i++) {
    const [ax, az] = line[i], [bx, bz] = line[i + 1], dx = bx - ax, dz = bz - az, L = dx * dx + dz * dz || 1;
    const t = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / L));
    d = Math.min(d, Math.hypot(x - ax - dx * t, z - az - dz * t));
  }
  return d;
};
const waterDist = (x: number, z: number) => {
  const r = riverNear(x, z);
  let d = r.d - r.hw;
  for (const o of [POND, SPRING]) for (let g = 0; g < 60; g += 2) if (inOval(o, x, z, g)) { d = Math.min(d, g); break; }
  return d;
};
type Kind = 'tree' | 'grove' | 'bush' | 'prop' | 'rock' | 'spot' | 'home';
/** Everything composed by hand, as points with a kind and a radius (its own size). */
const things: { x: number; z: number; kind: Kind; r: number }[] = [
  ...SCENERY.map((s) => ({ x: s.x, z: s.z, kind: (s.kind === 'oak' || s.kind === 'cedar' || s.kind === 'palm' ? 'tree' : s.kind === 'bamboo' ? 'grove' : s.kind === 'bush' ? 'bush' : s.kind === 'rock' ? 'rock' : 'prop') as Kind, r: s.foot ? s.foot[0] / 2 : 0 })),
  ...DECOR_SLOTS.map((s) => ({ x: s.x, z: s.z, kind: 'prop' as Kind, r: s.foot[0] / 2 })),
  ...Object.values(GOAL_TREES).map(([x, z]) => ({ x, z, kind: 'tree' as Kind, r: 0 })),
  ...Object.values(HOMES).map(([x, z]) => ({ x, z, kind: 'home' as Kind, r: 0 })),
  { x: TAPE_DECK[0], z: TAPE_DECK[1], kind: 'home', r: 0 }, { x: CENTRE_STAGE[0], z: CENTRE_STAGE[1], kind: 'home', r: 20 },
  { x: ROCK[0], z: ROCK[1], kind: 'rock', r: 0 },
  ...[...DIG_SPOTS, ...MUSHROOM_SPOTS].map(([x, z]) => ({ x, z, kind: 'spot' as Kind, r: 0 }))
];
const hedge = HEDGE_XS.map((x) => [x, HEDGE_Z] as Pt);
/** Whether a tree's canopy stands over (x, z) from the camera (the lawn just behind an oak or a cedar). */
const hidden = (x: number, z: number) =>
  SCENERY.some((s) => (s.kind === 'oak' && Math.abs(x - s.x) < 50 && z > s.z && z < s.z + 150) || (s.kind === 'cedar' && Math.abs(x - s.x) < 38 && z > s.z && z < s.z + 170));

/** Whether a point may hold a `what` (a clump's flowers spread ±20u round it), given what's chosen so far. */
function ok(what: 'clump' | 'weed', x: number, z: number, clumps: readonly Pt[], weeds: readonly Pt[]): boolean {
  const g = GAP[what], spread = what === 'clump' ? 20 : 4;
  if (![[x - spread, z], [x + spread, z], [x, z - spread / 2], [x, z + spread / 2]].every(([a, b]) => onGrass(a, b))) return false;
  if (z > CLIFF.z0 - 30) return false;
  // a clump whole on screen (the screen's edges are x 0…390 at the pivot)
  if (what === 'clump' && (x < 30 || x > 360)) return false;
  if (waterDist(x, z) < g.water) return false;
  for (const line of PATHS.dirt) if (segDist(line, x, z) < g.path) return false;
  for (const b of BUILDINGS) if (Math.abs(x - b.x) < b.h * 0.8 + g.building && z > b.z - g.building - 60 && z < b.z + b.depth + 10) return false;
  for (const t of things) if (Math.hypot(t.x - x, t.z - z) < g[t.kind] + t.r) return false;
  for (const [hx, hz] of hedge) if (Math.hypot(hx - x, hz - z) < g.hedge) return false;
  // the goal trees' canopies stand over the lawn behind them (a flower there would be hidden)
  for (const [tx, tz] of Object.values(GOAL_TREES)) if (Math.abs(x - tx) < 56 + spread && z > tz - spread && z < tz + 175) return false;
  if (hidden(x - spread, z) || hidden(x + spread, z)) return false;
  // nor just behind a villager's home spot (an 80u villager stands over it)
  for (const [hx, hz] of Object.values(HOMES)) if (Math.abs(x - hx) < 34 + spread && z > hz && z < hz + 120) return false;
  // nor in front of a goal tree, where its fruit falls
  for (const [tx, tz] of Object.values(GOAL_TREES)) if (Math.abs(x - tx) < 44 + spread && z > tz - 54 - spread && z < tz + 6) return false;
  // the villagers' stage in front of the homes and the sea view stay open
  if (z < 300 && x > 96 && x < 296) return false;
  if (clumps.some(([a, b]) => Math.hypot(a - x, b - z) < g.clump)) return false;
  if (what === 'weed' && weeds.some(([a, b]) => Math.hypot(a - x, b - z) < GAP.weed.weed)) return false;
  return true;
}

/** The distance from (x, z) to the nearest thing that fills the view (the composed pieces, the hedge, the water's edge,
 *  the paths, the chosen scatter). */
function nearest(x: number, z: number, extra: readonly Pt[]): number {
  let d = Math.max(0, waterDist(x, z));
  // the grass's edge (the sand beyond it fills the view as much)
  for (let g = 0; g < d; g += 4) if ([[g, 0], [-g, 0], [0, g], [0, -g]].some(([a, b]) => !onGrass(x + a, z + b))) { d = g; break; }
  for (const line of PATHS.dirt) d = Math.min(d, Math.max(0, segDist(line, x, z) - 12));
  for (const t of things) d = Math.min(d, Math.hypot(t.x - x, t.z - z));
  for (const [a, b] of [...hedge, ...extra]) d = Math.min(d, Math.hypot(a - x, b - z));
  return d;
}

/** The section's emptiest open-lawn point and how far it is from anything (a dead zone's size). */
function emptiest(z0: number, z1: number, extra: readonly Pt[]): { at: Pt; d: number } {
  let best = { at: [0, 0] as Pt, d: 0 };
  for (let z = z0; z <= z1; z += 6) for (let x = -10; x <= 400; x += 6) {
    if (!onGrass(x, z) || waterDist(x, z) < 0) continue;
    if (z < 300 && x > 96 && x < 296) continue;
    // under a goal tree's canopy, behind the tent, at the cliff's foot: covered anyway
    if (Object.values(GOAL_TREES).some(([tx, tz]) => Math.abs(x - tx) < 56 && z > tz && z < tz + 175)) continue;
    if (BUILDINGS.some((b) => Math.abs(x - b.x) < b.h * 0.8 && z > b.z - 10) || z > CLIFF.z0 - 20) continue;
    const d = nearest(x, z, extra);
    if (d > best.d) best = { at: [x, z], d };
  }
  return best;
}

const r = mulberry32(SEED);
/** Candidates: a jittered 12u grid over the section. */
const candidates = (z0: number, z1: number): Pt[] => {
  const out: Pt[] = [];
  for (let z = z0; z <= z1; z += 12) for (let x = -10; x <= 400; x += 12) out.push([Math.round(x + (r() - 0.5) * 10), Math.round(z + (r() - 0.5) * 10)]);
  return out;
};

/** The side of the path (true: the left) with fewer of the section's picks so far: the picks take turns. */
const lighter = (picked: readonly Pt[]) => picked.filter(([x]) => x < 195).length <= picked.filter(([x]) => x >= 195).length;

const before = SECTIONS.map((s) => emptiest(s.z0, s.z1, [...FLOWERS.map((f) => [f.x, f.z] as Pt)]));
const clumps: [number, number, number][] = [];
const weeds: Pt[] = [];
for (const s of SECTIONS) {
  const cand = candidates(s.z0, s.z1);
  const mine: Pt[] = [];
  for (const n of s.clumps) {
    let best: Pt | null = null, bd = -1;
    const side = lighter(mine);
    for (const [x, z] of [...cand.filter(([x]) => (x < 195) === side), ...cand.filter(([x]) => (x < 195) !== side)]) {
      if (best && (x < 195) !== side) break;
      if (!ok('clump', x, z, clumps.map(([a, b]) => [a, b]), weeds)) continue;
      const d = nearest(x, z, mine);
      if (d > bd) { bd = d; best = [x, z]; }
    }
    if (!best) { console.warn(`no room for a clump in ${s.name} after ${mine.length}`); break; }
    clumps.push([best[0], best[1], n]);
    mine.push(best);
  }
  const mineWeeds: Pt[] = [];
  for (let k = 0; k < s.weeds; k++) {
    let best: Pt | null = null, bd = -1;
    const side = lighter(mineWeeds);
    for (const [x, z] of [...cand.filter(([x]) => (x < 195) === side), ...cand.filter(([x]) => (x < 195) !== side)]) {
      if (best && (x < 195) !== side) break;
      if (!ok('weed', x, z, clumps.map(([a, b]) => [a, b]), weeds)) continue;
      const d = nearest(x, z, [...mine, ...weeds]);
      if (d > bd) { bd = d; best = [x, z]; }
    }
    if (!best) throw new Error(`no room for a weed spot in ${s.name}`);
    weeds.push(best);
    mineWeeds.push(best);
  }
}
// front to back (the clumps' kinds go by their order: scene.ts wildFlower)
clumps.sort((a, b) => a[1] - b[1]);
weeds.sort((a, b) => a[1] - b[1]);
const after = SECTIONS.map((s) => emptiest(s.z0, s.z1, clumps.map(([x, z]) => [x, z] as Pt)));
SECTIONS.forEach((s, i) => console.log(`${s.name}: emptiest ${before[i].d.toFixed(0)}u at ${before[i].at} → ${after[i].d.toFixed(0)}u at ${after[i].at}`));
console.log('clumps', JSON.stringify(clumps));
console.log('weeds', JSON.stringify(weeds), `(was ${LAWN_SPOTS.length})`);
if (!process.argv.includes('--dry')) {
  const prev = (() => { try { return readFileSync(OUT, 'utf8'); } catch { return ''; } })();
  const next = `{\n  "clumps": ${JSON.stringify(clumps)},\n  "lawn": ${JSON.stringify(weeds)}\n}\n`;
  if (prev !== next) writeFileSync(OUT, next);
  console.log(prev === next ? 'scatter.json unchanged' : 'wrote scatter.json');
}
