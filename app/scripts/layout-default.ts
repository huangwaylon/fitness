// The island's default layout (docs/island-layout.md "The layout is data"): today's island (world.ts and its
// scatter.json) on the 30u tile grid, written to src/lib/layout/default.json, which the layout a phone shows starts
// from (the record's ops go over it). Each tile takes the ground most of it is (sampled 6 × 6): the sea off the land,
// the beach's sand, the grass, the dirt path, the stream (kept one connected chain of tiles from the spring to the
// sea, as its centreline runs), the pond; the cliff's upper tier above its middle. Each object keeps world.ts's id and
// its exact spot (`n`: its offset from its footprint's middle, until someone moves it), so nothing on the island moves.
// The island is twice today's length (the user, 2026-11-02: room for the homes and buildings to come): today's まえ
// (the sea, the beach, the health lawn, the goal trees, the stream's crossing) stays at the front, today's おく (the
// campsite, the pond, the bamboo, the falls, the upper tier) moves GROW back, and between them a new middle: open
// grass to build on, the stream running on down its east side, the path through it, うめ's and the guest's homes with
// paths to their doors, a few trees and flowers.
//
// Usage (from app/): npm run layout:default [-- --dry] (prints the map either way)
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  BRIDGE, CAMPSITE, CENTRE_STAGE, CLIFF, DECOR_SLOTS, FLOWERS, GOAL_TREES, HEDGE_XS, HEDGE_Z, HOMES, PATHS, POND, RIVER, ROCK, SCENERY, SPRING, TAPE_DECK,
  inOval, onGrass, onLand, type Pt
} from '../src/lib/components/island/world.ts';
import { CHUNK, GRID, KINDS, TILE, codeOf, idx, kindOf, tierOf, tileAt, tileX, tileZ, type Kind } from '../src/lib/layout/grid.ts';
import { footprintOf, kindDef } from '../src/lib/layout/catalog.ts';
import { DEFAULT_HOMES, homeFoot } from '../src/lib/layout/homes.ts';
import { LONG_GROW, LONG_SPLIT } from '../src/lib/layout/migrate.ts';

const OUT = join(import.meta.dirname, '..', 'src', 'lib', 'layout', 'default.json');
const dry = process.argv.includes('--dry');

// ---- the terrain ----------------------------------------------------------------------------------------------------

/** world.ts's z where おく begins (just above the stream's crossing), and how far back the middle pushes it (one source:
 *  layout/migrate.ts, which moves the old decorations the same way). */
const SPLIT = LONG_SPLIT;
const GROW = LONG_GROW;
/** A world.ts z on the long island. */
const zOf = (z: number) => (z < SPLIT ? z : z + GROW);
/** The tier boundary: the cliff's top edge (its face from z0 to z1 stands on the lower tier's last row). */
const CLIFF_Z = Math.round(zOf(CLIFF.z1) / TILE) * TILE;
const PATH_HW = 15;
function polyDist(line: readonly Pt[], x: number, z: number): number {
  let d = Infinity;
  for (let i = 0; i < line.length - 1; i++) {
    const [ax, az] = line[i], [bx, bz] = line[i + 1];
    const dx = bx - ax, dz = bz - az, L = dx * dx + dz * dz || 1;
    const t = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / L));
    d = Math.min(d, Math.hypot(x - (ax + dx * t), z - (az + dz * t)));
  }
  return d;
}
/** The stream on the long island: おく's reach moved back, a gentle meander down the middle's east side, then
 *  today's bend west across the island to its mouth. */
const MID_RIVER: Pt[] = [[372, 1120], [367, 1000], [375, 880], [366, 760]];
const RIVER_LONG: (readonly [number, number, number])[] = [
  ...RIVER.filter(([, z]) => z >= SPLIT).map(([x, z, w]) => [x, zOf(z), w] as const),
  ...MID_RIVER.map(([x, z]) => [x, z, 30] as const),
  ...RIVER.filter(([, z]) => z < SPLIT)
];
const inRiverLong = (x: number, z: number) => {
  for (let i = 0; i < RIVER_LONG.length - 1; i++) {
    const [ax, az, aw] = RIVER_LONG[i], [bx, bz, bw] = RIVER_LONG[i + 1];
    const dx = bx - ax, dz = bz - az, L = dx * dx + dz * dz || 1;
    const t = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / L));
    if (Math.hypot(x - (ax + dx * t), z - (az + dz * t)) <= (aw + (bw - aw) * t) / 2) return true;
  }
  return false;
};
/** The paths: the main one on through the middle to the campsite, the clearing's to the stairs. */
const PATHS_LONG: Pt[][] = [
  [...PATHS.dirt[0].filter(([, z]) => z < SPLIT), [196, 800], [192, 960], ...PATHS.dirt[0].filter(([, z]) => z >= SPLIT).map(([x, z]) => [x, zOf(z)] as Pt)],
  PATHS.dirt[1].map(([x, z]) => [x, zOf(z)] as Pt)
];
type Ground = 'sea' | 'sand' | 'grass' | 'dirt' | 'river' | 'pond';
/** The ground at a point of the long island: today's island's (moved back for おく), the middle's straight sides. */
function groundAt(x: number, z: number): Ground {
  const zs = z < SPLIT ? z : z < SPLIT + GROW ? SPLIT + 60 : z - GROW;
  if (!onLand(x, zs)) return 'sea';
  if (z >= SPLIT + GROW && (inOval(POND, x, zs) || inOval(SPRING, x, zs))) return 'pond';
  if (inRiverLong(x, z)) return 'river';
  if (!onGrass(x, zs)) return 'sand';
  if (PATHS_LONG.some((p) => polyDist(p, x, z) <= PATH_HW)) return 'dirt';
  return 'grass';
}
const N = 6;
const kinds: Kind[] = new Array(GRID.cols * GRID.rows).fill('sea');
const share = new Map<string, Record<Ground, number>>();
for (let r = 0; r < GRID.rows; r++)
  for (let c = 0; c < GRID.cols; c++) {
    const n: Record<Ground, number> = { sea: 0, sand: 0, grass: 0, dirt: 0, river: 0, pond: 0 };
    for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) n[groundAt(tileX(c) + ((i + 0.5) / N) * TILE, tileZ(r) + ((j + 0.5) / N) * TILE)]++;
    share.set(`${c},${r}`, n);
    const total = N * N;
    // water first when it is much of the tile (a narrow stream still makes a channel), then the most of the rest
    let k: Ground;
    if (n.pond / total >= 0.4) k = 'pond';
    else if (n.river / total >= 0.45) k = 'river';
    else if (n.sea / total >= 0.5) k = 'sea';
    else {
      const land: Ground[] = ['dirt', 'grass', 'sand'];
      k = land.reduce((a, b) => (n[b] > n[a] ? b : a), 'grass');
      if (n.dirt / total >= 0.3) k = 'dirt';
      if (n.sea + n.river + n.pond > n.grass + n.sand + n.dirt && n.sea >= n.river) k = 'sea';
    }
    kinds[idx(c, r)] = k;
  }
// the stream: every tile its centreline passes through, so it runs one 4-connected chain (a diagonal step takes the
// side tile with more of the stream)
{
  let last: [number, number] | null = null;
  for (let i = 0; i < RIVER_LONG.length - 1; i++) {
    const [ax, az] = RIVER_LONG[i], [bx, bz] = RIVER_LONG[i + 1];
    const L = Math.hypot(bx - ax, bz - az), steps = Math.ceil(L / 3);
    for (let s = 0; s <= steps; s++) {
      const x = ax + ((bx - ax) * s) / steps, z = az + ((bz - az) * s) / steps;
      const [c, r] = tileAt(x, z);
      if (c < 0 || r < 0 || c >= GRID.cols || r >= GRID.rows) continue;
      if (last && last[0] !== c && last[1] !== r) {
        const a: [number, number] = [c, last[1]], b: [number, number] = [last[0], r];
        const ra = share.get(`${a[0]},${a[1]}`)!.river, rb = share.get(`${b[0]},${b[1]}`)!.river;
        const side = ra >= rb ? a : b;
        if (kinds[idx(side[0], side[1])] !== 'sea' && kinds[idx(side[0], side[1])] !== 'pond') kinds[idx(side[0], side[1])] = 'river';
      }
      const here = kinds[idx(c, r)];
      if (here !== 'sea' && here !== 'pond') kinds[idx(c, r)] = 'river';
      last = [c, r];
    }
  }
}
// the paths: every tile their centreline passes through (4-connected the same way)
for (const line of PATHS_LONG) {
  let last: [number, number] | null = null;
  for (let i = 0; i < line.length - 1; i++) {
    const [ax, az] = line[i], [bx, bz] = line[i + 1];
    const steps = Math.ceil(Math.hypot(bx - ax, bz - az) / 3);
    for (let s = 0; s <= steps; s++) {
      const [c, r] = tileAt(ax + ((bx - ax) * s) / steps, az + ((bz - az) * s) / steps);
      const put = (cc: number, rr: number) => {
        if (kinds[idx(cc, rr)] === 'grass') kinds[idx(cc, rr)] = 'dirt';
      };
      if (last && last[0] !== c && last[1] !== r) put(c, last[1]);
      put(c, r);
      last = [c, r];
    }
  }
}
// the homes' paths: from the main path to うめ's door (west) and the guest's (east)
const HOME_B: [number, number] = [3, 29], HOME_G: [number, number] = [11, 34];
for (const [row, c0, c1] of [[HOME_B[1] - 1, 4, 9], [HOME_G[1] - 1, 9, 13]] as const)
  for (let c = c0; c <= c1; c++) if (kinds[idx(c, row)] === 'grass') kinds[idx(c, row)] = 'dirt';
const codes = new Uint8Array(GRID.cols * GRID.rows);
for (let r = 0; r < GRID.rows; r++)
  for (let c = 0; c < GRID.cols; c++) {
    const k = kinds[idx(c, r)];
    const tier = k !== 'sea' && tileZ(r) >= CLIFF_Z ? 1 : 0;
    codes[idx(c, r)] = codeOf(k, tier);
  }

// ---- the objects ----------------------------------------------------------------------------------------------------

interface Out { id: string; k: string; x: number; z: number; f: number; s?: string; n?: [number, number] }
const objects: Out[] = [];
const r1 = (v: number) => Math.round(v * 10) / 10;
/** An object whose middle stands at world.ts's (x, z) (`raw`: the long island's z already): its footprint's tile and
 *  its offset from there. */
function put(id: string, k: string, x: number, zw: number, o: { f?: number; s?: string; foot?: readonly [number, number]; exact?: boolean; raw?: boolean } = {}): void {
  // every default piece on the grid (the user: "everything snapped neatly"): its footprint on whole tiles
  o = { ...o, exact: true };
  const def = kindDef(k);
  if (!def) throw new Error(`no kind ${k}`);
  const z = o.raw ? zw : zOf(zw);
  const f = o.f ?? 0;
  const [w, d] = o.foot ?? footprintOf(def, f);
  const tx = Math.round((x - GRID.x0) / TILE - w / 2), tz = Math.round((z - GRID.z0) / TILE - d / 2);
  const nx = r1(x - (tileX(tx) + (w * TILE) / 2)), nz = r1(z - (tileZ(tz) + (d * TILE) / 2));
  objects.push({ id, k, x: tx, z: tz, f, ...(o.s ? { s: o.s } : {}), ...(!o.exact && (nx || nz) ? { n: [nx, nz] as [number, number] } : {}) });
}
const PROP: Record<string, [string, string?]> = {
  'deco/streetlamp': ['streetlamp'], 'deco/garden-lantern': ['garden-lantern', 'plain'], 'deco/garden-lantern-white': ['garden-lantern', 'white'],
  'deco/campfire': ['campfire'], 'deco/log-stool': ['log-stool'], 'deco/campsite-sign': ['campsite-sign'], 'deco/flat-rock': ['flat-rock'],
  'deco/garden-rock': ['garden-rock'], 'deco/park-bench': ['park-bench'], 'deco/log-bench': ['log-bench'], 'deco/rod-stand': ['rod-stand'],
  'deco/hammock': ['hammock'], 'deco/firewood': ['firewood'], 'deco/pullup': ['pullup'], 'deco/pump': ['pump'], 'deco/shishiodoshi': ['shishiodoshi']
};
for (const s of SCENERY) {
  const [x, z] = [s.x, s.z];
  const flip = s.flip ? 1 : 0;
  if (s.kind === 'oak' || s.kind === 'cedar' || s.kind === 'palm' || s.kind === 'bamboo') put(s.id, s.kind, x, z, { f: flip });
  else if (s.kind === 'bush') put(s.id, 'bush', x, z, { f: flip, s: s.key.startsWith('month-bush-') ? `month-${s.key.slice(-1)}` : s.key.replace(/^bushes\//, '') });
  else {
    const p = PROP[s.key];
    if (!p) throw new Error(`no kind for ${s.key}`);
    put(s.id, p[0], x, z, { f: kindDef(p[0])!.turns ? 0 : flip, ...(p[1] ? { s: p[1] } : {}) });
  }
}
HEDGE_XS.forEach((x, i) => put(`hedge-${i}`, 'hedge', x, HEDGE_Z, { s: i % 2 ? 'month-b' : 'month-a' }));
put('goal-A', 'goal-tree', GOAL_TREES.A[0], GOAL_TREES.A[1], { s: 'a' });
put('goal-B', 'goal-tree', GOAL_TREES.B[0], GOAL_TREES.B[1], { s: 'b' });
const SLOT: Record<string, string> = { 'bench-mae': 'park-bench', 'bench-pond': 'log-bench', hammock: 'hammock', 'rod-stand': 'rod-stand', pump: 'pump', shishi: 'shishiodoshi', pullup: 'pullup', firewood: 'firewood', 'beach-chair': 'beach-chair', sandcastle: 'sandcastle', snowboy: 'snowboy' };
for (const d of DECOR_SLOTS) put(d.id, SLOT[d.id], d.x, d.z);
// (the path's tile is the walk's: beside it and a row back, where the villagers at home stand clear of it on screen)
put('tape-deck', 'tape-deck', TAPE_DECK[0] - 30, TAPE_DECK[1] + 30);
// NH's bulletin board (docs/board.md): by the lawn's front edge near the path, facing the sea-side camera
put('board', 'board', 150, 105, { exact: true });
put('rock', 'rock', ROCK[0], ROCK[1]);
put('bridge', 'bridge', BRIDGE.x, (BRIDGE.z0 + BRIDGE.z1) / 2, { s: 'stone' });
// the stairs: up the cliff where its stone steps are (their back edge on the cliff's line)
{
  const [s0, s1] = CLIFF.stair;
  put('stairs', 'stairs', (s0 + s1) / 2, CLIFF_Z - (kindDef('stairs')!.d * TILE) / 2, { s: 'stone', exact: true, raw: true });
}
// the homes: ウェイ's the campsite's tent (its front on the door line); うめ's and the guest's in the middle
{
  const [w, d] = homeFoot(DEFAULT_HOMES.A);
  put('home-A', 'home', CAMPSITE.x, zOf(CAMPSITE.z) + (d * TILE) / 2, { foot: [w, d], raw: true });
  const [bw, bd] = homeFoot(DEFAULT_HOMES.B), [gw, gd] = homeFoot(DEFAULT_HOMES.G);
  put('home-B', 'home', tileX(HOME_B[0]) + (bw * TILE) / 2, tileZ(HOME_B[1]) + (bd * TILE) / 2, { foot: [bw, bd], exact: true, raw: true });
  put('home-G', 'home', tileX(HOME_G[0]) + (gw * TILE) / 2, tileZ(HOME_G[1]) + (gd * TILE) / 2, { foot: [gw, gd], exact: true, raw: true });
}
// the middle: a few trees at its edges, bushes by the homes, three clumps of flowers, a lamp at each home's path;
// the rest open, to build on
const mid = (id: string, k: string, c: number, r: number, s?: string) => put(id, k, tileX(c) + TILE / 2, tileZ(r) + TILE / 2, { exact: true, raw: true, ...(s ? { s } : {}) });
mid('mid-cedar-1', 'cedar', 3, 26);
mid('mid-oak-1', 'oak', 13, 27);
mid('mid-cedar-2', 'cedar', 3, 36);
mid('mid-oak-2', 'oak', 6, 38);
mid('mid-cedar-3', 'cedar', 14, 38);
mid('mid-bush-1', 'bush', 8, 31, 'holly');
mid('mid-bush-2', 'bush', 10, 35, 'white-azalea');
mid('mid-bush-3', 'bush', 10, 27, 'pink-azalea');
mid('mid-lamp-1', 'streetlamp', 8, 27);
mid('mid-lamp-2', 'streetlamp', 10, 32);
for (const [i, [c, r, n]] of ([[5, 33, 0], [6, 33, 0], [5, 34, 0], [12, 30, 3], [13, 31, 3], [12, 31, 3]] as const).entries())
  mid(`mid-fl-${i + 1}`, 'flower', c, r, `c${n}`);
// a home's (x, z) is its door's tile (model.ts originOf): the front row's middle, the left of two
for (const o of objects) if (o.k === 'home') o.x += Math.floor((homeFoot(DEFAULT_HOMES[o.id.slice(-1) as 'A']).at(0)! - 1) / 2);
put('spot-villager-A', 'spot', HOMES.A[0], HOMES.A[1], { s: 'villager-a' });
put('spot-villager-B', 'spot', HOMES.B[0], HOMES.B[1], { s: 'villager-b' });
put('spot-stage', 'spot', CENTRE_STAGE[0], CENTRE_STAGE[1], { s: 'stage' });
for (const f of FLOWERS) put(f.id, 'flower', f.x, f.z, { s: `c${f.clump}` });

// ---- on the grid, nothing over anything: each piece where it snapped, else the nearest free tile round it ----
{
  /** The order pieces claim their tiles: what can't move first (the homes and what joins terrain), the flowers last. */
  const RANK: Record<string, number> = { home: 0, stairs: 0, bridge: 0, 'goal-tree': 1, board: 1, spot: 1, rock: 2, flower: 9 };
  const rank = (o: Out) => RANK[o.k] ?? (kindDef(o.k)!.group === 'tree' ? 3 : kindDef(o.k)!.group === 'bush' ? 5 : 4);
  const footOfOut = (o: Out): [number, number, number, number] => {
    const [w, d] = o.k === 'home' ? homeFoot(DEFAULT_HOMES[o.id.slice(-1) as 'A']) : footprintOf(kindDef(o.k)!, o.f);
    const x0 = o.k === 'home' ? o.x - Math.floor((w - 1) / 2) : o.x;
    return [x0, o.z, w, d];
  };
  const taken = new Map<string, string>();
  const tileKind = (c: number, r: number) => (c < 0 || r < 0 || c >= GRID.cols || r >= GRID.rows ? 'sea' : kindOf(codes[idx(c, r)]));
  const tileTier = (c: number, r: number) => tierOf(codes[idx(Math.max(0, Math.min(GRID.cols - 1, c)), Math.max(0, Math.min(GRID.rows - 1, r)))]);
  const fits = (o: Out, x: number, z: number): boolean => {
    const [x0, z0, w, d] = footOfOut({ ...o, x, z });
    const t = tileTier(x0, z0);
    for (let j = 0; j < d; j++)
      for (let i = 0; i < w; i++) {
        const c = x0 + i, r = z0 + j, k = tileKind(c, r);
        if (taken.has(`${c},${r}`) || tileTier(c, r) !== t) return false;
        if (o.k === 'bridge' || o.k === 'stairs') continue;
        if (k === 'sea' || k === 'river' || k === 'pond' || k === 'dirt') return false;
        if (kindDef(o.k)!.on === 'grass' && k !== 'grass' && o.k !== 'flower') return false;
        if (o.k === 'flower' && k !== 'grass') return false;
      }
    return true;
  };
  const claim = (o: Out) => {
    const [x0, z0, w, d] = footOfOut(o);
    for (let j = 0; j < d; j++) for (let i = 0; i < w; i++) taken.set(`${x0 + i},${z0 + j}`, o.id);
    // a home's door and a board's front stay clear
    if (o.k === 'home' || o.k === 'board') for (let i = 0; i < w; i++) taken.set(`${x0 + i},${z0 - 1}`, `${o.id}:door`);
  };
  for (const o of [...objects].sort((a, b) => rank(a) - rank(b))) {
    if (rank(o) === 0 || fits(o, o.x, o.z)) {
      claim(o);
      continue;
    }
    let done = false;
    for (let ring = 1; ring <= 5 && !done; ring++)
      for (let dz = -ring; dz <= ring && !done; dz++)
        for (let dx = -ring; dx <= ring && !done; dx++) {
          if (Math.max(Math.abs(dx), Math.abs(dz)) !== ring || !fits(o, o.x + dx, o.z + dz)) continue;
          o.x += dx;
          o.z += dz;
          done = true;
        }
    if (!done) console.warn(`no free tile near ${o.id}: it stays where it snapped`);
    claim(o);
  }
}

// ---- out ------------------------------------------------------------------------------------------------------------

const tiles: string[] = [];
for (let r = 0; r < GRID.rows; r++) {
  let s = '';
  for (let c = 0; c < GRID.cols; c++) s += codes[idx(c, r)].toString(36);
  tiles.push(s);
}
const json = `{\n  "_": "scripts/layout-default.ts: today's island on the tile grid (tiles: each row's codes, kind × 4 + tier in base 36: ${KINDS.join(' ')}; objects: world.ts's ids, n their exact offset)",\n  "tiles": [\n${tiles.map((t) => `    "${t}"`).join(',\n')}\n  ],\n  "objects": [\n${objects.map((o) => `    ${JSON.stringify(o)}`).join(',\n')}\n  ]\n}\n`;

// the map, back to front (the camera at the bottom), objects over the ground
const GLYPH: Record<Kind, string> = { sea: '~', grass: '.', sand: ':', dirt: '=', stone: '#', brick: '#', plank: '#', river: 'w', pond: 'o' };
const UP: Record<string, string> = { '.': ',', ':': ';', '=': '%', w: 'W', o: 'O' };
const at = new Map<string, string>();
for (const o of objects) {
  const def = kindDef(o.k)!;
  const g = o.k === 'home' ? 'H' : o.k === 'bridge' ? 'B' : o.k === 'stairs' ? 'S' : def.group === 'tree' ? 'T' : def.group === 'flower' ? '*' : def.group === 'spot' ? '@' : 'x';
  const [w, d] = o.k === 'home' ? homeFoot(DEFAULT_HOMES[o.id.slice(-1) as 'A']) : footprintOf(def, o.f);
  const x0 = o.k === 'home' ? o.x - Math.floor((w - 1) / 2) : o.x;
  for (let j = 0; j < d; j++) for (let i = 0; i < w; i++) at.set(`${x0 + i},${o.z + j}`, g);
}
for (let r = GRID.rows - 1; r >= 0; r--) {
  let line = '';
  for (let c = 0; c < GRID.cols; c++) {
    const code = codes[idx(c, r)];
    line += at.get(`${c},${r}`) ?? (tierOf(code) ? (UP[GLYPH[kindOf(code)]] ?? GLYPH[kindOf(code)]) : GLYPH[kindOf(code)]);
  }
  console.log(`${String(r).padStart(2)} ${line}${r % CHUNK === 0 ? '  ─ chunk' : ''}`);
}
console.log(`${objects.length} objects`);
if (!dry) {
  const prev = (() => {
    try {
      return readFileSync(OUT, 'utf8');
    } catch {
      return '';
    }
  })();
  writeFileSync(OUT, json);
  console.log(prev === json ? 'default.json unchanged' : 'wrote default.json');
}
