// くまのもり's ground (docs/design.md "Kuma no mori"): an 80 × 80 m forest island, the same for every player from the
// round's seed. Metres, x east, z south (three's), the island's middle at 0. A grid of 1 m cells says what each cell is
// (water, a cliff's top, a trunk, a bush, the bridge, a safe zone; the fallen logs are the world's: sim.ts); the bears path on it (sim.ts nav) and
// see across it (sight lines blocked by trunks and bushes). Pure, no three.js: the engine draws what it says.

export const HALF = 40;
export const N = HALF * 2;

export const WATER = 1, CLIFF = 2, TRUNK = 4, BUSH = 8, BRIDGE = 32, SAFE = 64;

/** A cliff's top is this high (m). */
export const CLIFF_H = 3;

export interface Rect {
  x0: number;
  z0: number;
  x1: number;
  z1: number;
}
export interface Plateau extends Rect {
  /** The ladder: its foot (on the ground) and its head (on the top). */
  foot: [number, number];
  head: [number, number];
}
interface Tree {
  x: number;
  z: number;
  kind: 'cedar' | 'oak';
  s: number;
  /** A wasp nest hangs in it (the index into map.nests). */
  nest?: number;
}
interface Bush {
  id: number;
  x: number;
  z: number;
  kind: number;
}
type ItemKind = 'round' | 'flat' | 'skinny' | 'elegant' | 'rare' | 'piece' | 'seed' | 'pile';
export interface Item {
  id: number;
  x: number;
  z: number;
  kind: ItemKind;
  /** On a cliff's top. */
  top: boolean;
  /** A pile's finds (what a caught player dropped). */
  n?: number;
}
/** A dead tree leaning at a choke point: pushed, it falls across the way (from (x, z) along angle `a`, LOG_L long). */
export interface Leaner {
  id: number;
  x: number;
  z: number;
  a: number;
}
export const LOG_L = 6;

export interface ForestMap {
  seed: number;
  cells: Uint8Array;
  trees: Tree[];
  bushes: Bush[];
  items: Item[];
  leaners: Leaner[];
  plateaus: Plateau[];
  nests: { tree: number }[];
  /** The river's middle line at x (z), and its half width. */
  riverZ: (x: number) => number;
  riverHalf: number;
  bridge: Rect;
  dock: { x: number; z: number; r: number };
  camp: { x: number; z: number; r: number };
  spawn: [number, number][];
  /** Where the bears sleep at the start. */
  dens: [number, number][];
}

export function rng(seed: number): () => number {
  let a = seed >>> 0 || 1;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const cellOf = (v: number) => Math.floor(v + HALF);
export const inGrid = (cx: number, cz: number) => cx >= 0 && cz >= 0 && cx < N && cz < N;
export const at = (m: ForestMap, x: number, z: number): number => {
  const cx = cellOf(x), cz = cellOf(z);
  return inGrid(cx, cz) ? m.cells[cz * N + cx] : CLIFF;
};
const inRect = (r: Rect, x: number, z: number, pad = 0) => x >= r.x0 - pad && x <= r.x1 + pad && z >= r.z0 - pad && z <= r.z1 + pad;

/** A bear may stand in cell (cx, cz). */
export const bearWalk = (m: ForestMap, cx: number, cz: number, logs?: Uint8Array): boolean => {
  if (!inGrid(cx, cz) || cx === 0 || cz === 0 || cx === N - 1 || cz === N - 1) return false;
  const c = m.cells[cz * N + cx];
  if (logs && logs[cz * N + cx]) return false;
  if (c & BRIDGE) return true;
  return !(c & (WATER | CLIFF | TRUNK | BUSH | SAFE));
};

export function buildMap(seed: number): ForestMap {
  const r = rng(seed);
  const cells = new Uint8Array(N * N);
  const riverHalf = 2.2;
  const riverZ = (x: number) => -6 + 2.5 * Math.sin(x * 0.12 + 0.6);
  const bridge: Rect = { x0: 10, x1: 13, z0: -12, z1: 0 };
  const plateaus: Plateau[] = [
    { x0: 18, x1: 30, z0: -31, z1: -20, foot: [24, -18.6], head: [24, -20.6] },
    { x0: -32, x1: -22, z0: 9, z1: 19, foot: [-20.6, 14], head: [-22.6, 14] },
    { x0: -15, x1: -6, z0: -33, z1: -25, foot: [-10.5, -23.6], head: [-10.5, -25.6] }
  ];
  const dock = { x: 0, z: 35, r: 7 };
  const camp = { x: 16, z: 20, r: 4 };
  const leaners: Leaner[] = [
    { id: 0, x: 4, z: -15, a: 0 },
    { id: 1, x: -22, z: -13, a: Math.PI / 2 },
    { id: 2, x: 24, z: 6, a: Math.PI / 2 },
    { id: 3, x: -8, z: 22, a: 0.3 }
  ];

  for (let cz = 0; cz < N; cz++)
    for (let cx = 0; cx < N; cx++) {
      const x = cx - HALF + 0.5, z = cz - HALF + 0.5;
      let c = 0;
      if (Math.abs(z - riverZ(x)) < riverHalf) c |= inRect(bridge, x, z) ? BRIDGE : WATER;
      if (plateaus.some((p) => inRect(p, x, z))) c |= CLIFF;
      if (Math.hypot(x - dock.x, z - dock.z) < dock.r || Math.hypot(x - camp.x, z - camp.z) < camp.r) c |= SAFE;
      cells[cz * N + cx] = c;
    }

  // keep clear: the river and its banks, the cliffs and their ladders, the dock, the camp, the bridge's ways in, the
  // leaners' fall
  const clear = (x: number, z: number, pad: number) => {
    if (Math.abs(x) > HALF - 1.5 || Math.abs(z) > HALF - 1.5) return false;
    if (Math.abs(z - riverZ(x)) < riverHalf + pad + 0.8) return false;
    if (plateaus.some((p) => inRect(p, x, z, pad + 0.8) || Math.hypot(x - p.foot[0], z - p.foot[1]) < 3)) return false;
    if (Math.hypot(x - dock.x, z - dock.z) < dock.r + 3 || Math.hypot(x - camp.x, z - camp.z) < camp.r + 2) return false;
    if (x > bridge.x0 - 2 && x < bridge.x1 + 2 && z > bridge.z0 - 6 && z < bridge.z1 + 6) return false;
    for (const l of leaners) if (segDist(x, z, l.x, l.z, l.x + Math.cos(l.a) * LOG_L, l.z + Math.sin(l.a) * LOG_L) < 2.2) return false;
    return true;
  };
  const trees: Tree[] = [];
  for (let k = 0; k < 4000 && trees.length < 165; k++) {
    const x = (r() * 2 - 1) * HALF, z = (r() * 2 - 1) * HALF;
    if (!clear(x, z, 0.6) || trees.some((t) => Math.hypot(t.x - x, t.z - z) < 3.1)) continue;
    trees.push({ x, z, kind: r() < 0.62 ? 'cedar' : 'oak', s: 0.85 + r() * 0.35 });
  }
  const nests: { tree: number }[] = [];
  for (let k = 0; nests.length < 3 && k < trees.length; k++) {
    const i = Math.floor(r() * trees.length);
    if (trees[i].nest === undefined && trees[i].z < 25) {
      trees[i].nest = nests.length;
      nests.push({ tree: i });
    }
  }
  for (const t of trees) cells[cellOf(t.z) * N + cellOf(t.x)] |= TRUNK;
  const bushes: Bush[] = [];
  for (let k = 0; k < 3000 && bushes.length < 30; k++) {
    const x = (r() * 2 - 1) * HALF, z = (r() * 2 - 1) * HALF;
    if (!clear(x, z, 0.4) || trees.some((t) => Math.hypot(t.x - x, t.z - z) < 2.2) || bushes.some((b) => Math.hypot(b.x - x, b.z - z) < 4)) continue;
    bushes.push({ id: bushes.length, x, z, kind: Math.floor(r() * 5) });
    cells[cellOf(z) * N + cellOf(x)] |= BUSH;
  }

  const items: Item[] = [];
  const free = (x: number, z: number) =>
    clear(x, z, 0) && !trees.some((t) => Math.hypot(t.x - x, t.z - z) < 1.4) && !bushes.some((b) => Math.hypot(b.x - x, b.z - z) < 1.6) && !items.some((i) => Math.hypot(i.x - x, i.z - z) < 2.5);
  const put = (kind: ItemKind, x: number, z: number, top = false) => items.push({ id: items.length, x, z, kind, top });
  const MUSH: ItemKind[] = ['round', 'round', 'flat', 'flat', 'skinny', 'skinny', 'elegant', 'rare'];
  for (let k = 0; k < 4000 && items.length < 26; k++) {
    const x = (r() * 2 - 1) * (HALF - 3), z = (r() * 2 - 1) * (HALF - 3);
    if (free(x, z)) put(MUSH[Math.floor(r() * MUSH.length)], x, z);
  }
  // the lost pieces: one on each cliff's top and two deep in the north (past the river: the bears' side)
  plateaus.forEach((p, i) => {
    put('piece', (p.x0 + p.x1) / 2 + (i - 1) * 1.5, (p.z0 + p.z1) / 2, true);
    put(i === 1 ? 'elegant' : 'rare', p.x0 + 2, p.z0 + 2, true);
  });
  for (let k = 0, n = 0; k < 4000 && n < 2; k++) {
    const x = (r() * 2 - 1) * (HALF - 4), z = -HALF + 4 + r() * 18;
    if (free(x, z)) {
      put('piece', x, z);
      n++;
    }
  }
  for (let k = 0, n = 0; k < 4000 && n < 6; k++) {
    const x = (r() * 2 - 1) * (HALF - 4), z = (r() * 2 - 1) * (HALF - 4);
    if (free(x, z)) {
      put('seed', x, z);
      n++;
    }
  }

  return {
    seed, cells, trees, bushes, items, leaners, plateaus, nests, riverZ, riverHalf, bridge, dock, camp,
    spawn: [[-2, 33], [2, 33], [0, 31]],
    dens: [[0, -34], [-28, -34], [32, -10], [-30, 30]]
  };
}

/** Distance from (px, pz) to the segment a → b. */
export function segDist(px: number, pz: number, ax: number, az: number, bx: number, bz: number): number {
  const dx = bx - ax, dz = bz - az, l2 = dx * dx + dz * dz;
  const t = l2 ? Math.max(0, Math.min(1, ((px - ax) * dx + (pz - az) * dz) / l2)) : 0;
  return Math.hypot(px - ax - t * dx, pz - az - t * dz);
}

/** The cells a fallen leaner covers (a bear can't cross them; a player steps over). */
export function logCells(l: Leaner): number[] {
  const out: number[] = [];
  for (let s = 0; s <= LOG_L; s += 0.5) {
    const cx = cellOf(l.x + Math.cos(l.a) * s), cz = cellOf(l.z + Math.sin(l.a) * s);
    if (inGrid(cx, cz)) out.push(cz * N + cx);
  }
  return out;
}

/** A trunk blocks a sight line passing this close (m); a bush, BUSH_R. */
const TRUNK_R = 0.55, BUSH_R = 0.9;

/** Nothing blocks the sight line from a to b: no trunk or bush on it (their round shapes, not their cells: a forest
 *  you can see a little way into). */
export function sight(m: ForestMap, ax: number, az: number, bx: number, bz: number): boolean {
  const x0 = Math.min(ax, bx) - 1, x1 = Math.max(ax, bx) + 1, z0 = Math.min(az, bz) - 1, z1 = Math.max(az, bz) + 1;
  for (const t of m.trees) if (t.x > x0 && t.x < x1 && t.z > z0 && t.z < z1 && segDist(t.x, t.z, ax, az, bx, bz) < TRUNK_R) return false;
  for (const b of m.bushes) if (b.x > x0 && b.x < x1 && b.z > z0 && b.z < z1 && segDist(b.x, b.z, ax, az, bx, bz) < BUSH_R) return false;
  return true;
}

/** A plateau's top holds (x, z). */
export const onTop = (m: ForestMap, x: number, z: number): Plateau | null => m.plateaus.find((p) => inRect(p, x, z)) ?? null;
