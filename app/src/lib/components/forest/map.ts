// くまのもり's ground (docs/design.md "Kuma no mori"): an 80 × 80 m forest island, a hand-made layout with the round's
// seed varying what's inside it (the trees in each zone, the hedgerows' lie, which spot holds each lost piece, the
// mushrooms). Metres, x east, z south (three's), the island's middle at 0.
//   South of the river: the dock (the seaplane: safe), a meadow by it, the grove (a rock with a piece on top), the east
//   woods. The river: a plank bridge in the west and stepping stones (a ford) in the east. North of it, the bears'
//   side: the dark woods (dense cedars), a clearing ringed with oaks (the danger zone), the ridge (two ladders) and the
//   camp (safe: where the lost pieces go). One lost piece in each of five places. Lanterns and landmarks to find the
//   way (no minimap).
//   A grid of 1 m cells says what each cell is (water, a cliff's top, a trunk, a bush, a crossing, a safe zone); the
//   bears path on it (sim.ts) and see across the map's round shapes (sight). Pure, no three.js: the engine draws it.

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
export interface Ladder {
  /** On the ground, and on the top. */
  foot: [number, number];
  head: [number, number];
}
export interface Plateau extends Rect {
  ladders: Ladder[];
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
  /** A pile's worth (what a caught player dropped). */
  n?: number;
  /** A lost piece's place (0–4: the grove rock, the ridge, the clearing, the dark woods, the east thicket). */
  slot?: number;
}
/** A find's worth: the plain mushrooms 1, the elegant 2, the rare 3 (the riskier the place, the better they grow). */
export const VALUE: Partial<Record<ItemKind, number>> = { round: 1, flat: 1, skinny: 1, elegant: 2, rare: 3 };
/** A dead tree leaning at a choke point: pushed, it falls across the way (from (x, z) along angle `a`, LOG_L long). */
export interface Leaner {
  id: number;
  x: number;
  z: number;
  a: number;
}
export const LOG_L = 6;
interface Crossing extends Rect {
  kind: 'bridge' | 'ford';
}
/** Something to find the way by: a world3d model (its path under room/world3d), lit ones glowing through the fog. */
interface Landmark {
  model: string;
  x: number;
  z: number;
  /** Turned (radians). */
  a?: number;
  glow?: number;
}

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
  crossings: Crossing[];
  /** Trails (kept clear of trees, lanterns along them). */
  paths: [number, number][][];
  landmarks: Landmark[];
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

// ---- the layout ------------------------------------------------------------------------------------------------------

const RIVER_HALF = 2.2;
const riverZ = (x: number) => -4 + 2.5 * Math.sin(x * 0.085 + 0.9);
const CROSSINGS: Crossing[] = [
  { kind: 'bridge', x0: -12, x1: -9, z0: -10, z1: 2 },
  { kind: 'ford', x0: 25, x1: 29, z0: -12, z1: 0 }
];
const PLATEAUS: Plateau[] = [
  // the grove's rock (a piece on top), its ladder on the east face
  { x0: -33, x1: -25, z0: 13, z1: 21, ladders: [{ foot: [-23.6, 17], head: [-25.6, 17] }] },
  // the dark woods' rock, its ladder on the far (north) face: from the river you go round it
  { x0: -32, x1: -24, z0: -34, z1: -26, ladders: [{ foot: [-28, -35.4], head: [-28, -33.4] }] },
  // the ridge: two ladders (south and west faces)
  { x0: 14, x1: 25, z0: -35, z1: -26, ladders: [{ foot: [19.5, -24.6], head: [19.5, -26.6] }, { foot: [12.6, -30.5], head: [14.6, -30.5] }] }
];
const DOCK = { x: 0, z: 35, r: 7 };
/** The camp, north of the river by the ridge: the lost pieces go here; the dock is the far end of the final run. */
const CAMP = { x: 32, z: -21, r: 4 };
const LEANERS: Leaner[] = [
  // in the shallows at the bridge's north end: pushed, it falls across the deck and seals it for the bears a while
  { id: 0, x: -13.5, z: -5.4, a: 0 },
  // across the north trail between the bridge and the clearing
  { id: 1, x: -12.5, z: -13.5, a: 0 },
  // behind the ridge: the corridor between its north face and the edge
  { id: 2, x: 19, z: -39, a: Math.PI / 2 },
  // the dark woods' trail (between the hedgerows)
  { id: 3, x: -20, z: -20, a: Math.PI / 2 + 0.15 },
  // the grove: the corridor between the rock's west face and the island's edge
  { id: 4, x: -38.6, z: 17, a: 0 },
  // the east woods: on the dock-to-ford trail
  { id: 5, x: 30, z: 7, a: Math.PI - 0.2 }
];
const PATHS: [number, number][][] = [
  [[0, 28], [-4, 18], [-8, 9], [-10.5, 2]],
  [[5, 30], [16, 24], [25, 16], [27, 8], [27, 0]],
  [[-10.5, -10], [-8, -17], [-3, -21], [10, -22], [19.5, -23], [26, -16], [27, -12]],
  [[26, -16], [30, -19]]
];
type Zone = { name: string; disk?: [number, number, number]; rect?: Rect; spacing: number; n: number; cedar: number };
const ZONES: Zone[] = [
  { name: 'clearing', disk: [3, -24, 9.5], spacing: 99, n: 0, cedar: 0 },
  { name: 'meadow', disk: [0, 33, 13], spacing: 7, n: 5, cedar: 0.1 },
  { name: 'dark', rect: { x0: -40, x1: -3, z0: -40, z1: -9 }, spacing: 2.7, n: 78, cedar: 0.9 },
  { name: 'ridge', rect: { x0: -3, x1: 40, z0: -40, z1: -9 }, spacing: 3.4, n: 30, cedar: 0.6 },
  { name: 'grove', rect: { x0: -40, x1: -8, z0: -2, z1: 40 }, spacing: 3.4, n: 28, cedar: 0.3 },
  { name: 'mid', rect: { x0: -8, x1: 10, z0: -2, z1: 40 }, spacing: 5, n: 8, cedar: 0.3 },
  { name: 'east', rect: { x0: 10, x1: 40, z0: -2, z1: 40 }, spacing: 3.8, n: 22, cedar: 0.5 },
  { name: 'banks', rect: { x0: -40, x1: 40, z0: -40, z1: 40 }, spacing: 4, n: 0, cedar: 0.5 }
];
/** Hedgerows: 3–4 bushes 2 m apart in a line (a wall to sight, a row of hiding spots); the seed shifts and turns them. */
const HEDGES = [
  { x: -20, z: 26, a: 0.3, n: 4 }, { x: -16, z: 8, a: 1.3, n: 3 }, { x: -34, z: 4, a: 0.1, n: 3 },
  { x: -30, z: -16, a: 0.2, n: 4 }, { x: -14, z: -30, a: 1.4, n: 4 }, { x: -20, z: -36, a: 0, n: 3 }, { x: -10, z: -22, a: 0.8, n: 3 },
  { x: 8, z: -33, a: 0.1, n: 3 }, { x: 33, z: -32, a: 1.2, n: 3 }, { x: 36, z: -12, a: 0.4, n: 3 },
  { x: 16, z: 8, a: 0.9, n: 3 }, { x: 35, z: 24, a: 1.5, n: 3 }
];
/** The lost pieces: one per place, the seed picking its spot (a cliff's top: its middle). */
const PIECES: { top?: number; spots?: [number, number][] }[] = [
  { top: 0 },
  { top: 2 },
  { spots: [[3, -24], [0, -21], [6, -27]] },
  { spots: [[-34, -12], [-17, -31], [-12, -17], [-36, -26]] },
  { spots: [[34, 12], [31, 24], [37, 30]] }
];
const MUSH: { zone: string; n: number; kinds: ItemKind[]; near?: boolean; rim?: boolean }[] = [
  { zone: 'meadow', n: 4, kinds: ['round', 'round', 'flat'], near: true },
  { zone: 'mid', n: 3, kinds: ['round', 'flat', 'skinny'] },
  { zone: 'grove', n: 6, kinds: ['skinny', 'flat', 'elegant', 'round'] },
  { zone: 'east', n: 4, kinds: ['round', 'flat', 'skinny'] },
  { zone: 'clearing', n: 3, kinds: ['elegant', 'skinny'], rim: true },
  { zone: 'ridge', n: 4, kinds: ['skinny', 'elegant', 'rare'] },
  { zone: 'dark', n: 6, kinds: ['elegant', 'elegant', 'rare'] }
];
const LANDMARKS: Landmark[] = [
  { model: 'streetlamp', x: -8.5, z: 3, glow: 1 },
  { model: 'decor/stone-lantern', x: -13.5, z: -11, glow: 1 },
  { model: 'deco/mushroom-lamp', x: -9, z: -18, glow: 1 },
  { model: 'events/spooky-lantern', x: 3, z: -14.5, glow: 1 },
  { model: 'shishiodoshi', x: 12, z: -20 },
  { model: 'decor/signpost', x: 12, z: -24, a: Math.PI / 2 },
  { model: 'decor/brick-well', x: -18, z: 18 },
  { model: 'streetlamp', x: 24, z: 2, glow: 1 }
];
const DENS: [number, number][] = [[8, -37], [-38, -38], [37, -38], [34, 34]];

export function buildMap(seed: number): ForestMap {
  const r = rng(seed);
  const cells = new Uint8Array(N * N);
  const ladders = PLATEAUS.flatMap((p) => p.ladders);
  for (let cz = 0; cz < N; cz++)
    for (let cx = 0; cx < N; cx++) {
      const x = cx - HALF + 0.5, z = cz - HALF + 0.5;
      let c = 0;
      if (Math.abs(z - riverZ(x)) < RIVER_HALF) c |= CROSSINGS.some((b) => inRect(b, x, z)) ? BRIDGE : WATER;
      if (PLATEAUS.some((p) => inRect(p, x, z))) c |= CLIFF;
      if (Math.hypot(x - DOCK.x, z - DOCK.z) < DOCK.r || Math.hypot(x - CAMP.x, z - CAMP.z) < CAMP.r) c |= SAFE;
      cells[cz * N + cx] = c;
    }

  const onPath = (x: number, z: number, w: number) => PATHS.some((pl) => pl.some((p, i) => i > 0 && segDist(x, z, pl[i - 1][0], pl[i - 1][1], p[0], p[1]) < w));
  // keep clear: the river and its banks, the cliffs and their ladders, the dock, the camp, the crossings' ways in, the
  // leaners' fall, the trails, the dens, the landmarks
  const clear = (x: number, z: number, pad: number) => {
    if (Math.abs(x) > HALF - 1.5 || Math.abs(z) > HALF - 1.5) return false;
    if (Math.abs(z - riverZ(x)) < RIVER_HALF + pad + 0.8) return false;
    if (PLATEAUS.some((p) => inRect(p, x, z, pad + 0.8))) return false;
    if (ladders.some((l) => Math.hypot(x - l.foot[0], z - l.foot[1]) < 3)) return false;
    if (Math.hypot(x - DOCK.x, z - DOCK.z) < DOCK.r + 3 || Math.hypot(x - CAMP.x, z - CAMP.z) < CAMP.r + 2) return false;
    if (CROSSINGS.some((b) => x > b.x0 - 2 && x < b.x1 + 2 && z > b.z0 - 5 && z < b.z1 + 5)) return false;
    for (const l of LEANERS) if (segDist(x, z, l.x, l.z, l.x + Math.cos(l.a) * LOG_L, l.z + Math.sin(l.a) * LOG_L) < 2.2) return false;
    if (onPath(x, z, 1.8)) return false;
    if (DENS.some(([dx, dz]) => Math.hypot(x - dx, z - dz) < 2.5)) return false;
    if (LANDMARKS.some((l) => Math.hypot(x - l.x, z - l.z) < 1.8)) return false;
    return true;
  };
  const zoneOf = (x: number, z: number) => ZONES.find((zn) => (zn.disk ? Math.hypot(x - zn.disk[0], z - zn.disk[1]) < zn.disk[2] : inRect(zn.rect!, x, z)))!;
  const sample = (zn: Zone): [number, number] => {
    if (zn.disk) {
      const a = r() * Math.PI * 2, d = Math.sqrt(r()) * zn.disk[2];
      return [zn.disk[0] + Math.cos(a) * d, zn.disk[1] + Math.sin(a) * d];
    }
    const R = zn.rect!;
    return [R.x0 + r() * (R.x1 - R.x0), R.z0 + r() * (R.z1 - R.z0)];
  };

  // the hedgerows first (they shape the woods)
  const bushes: Bush[] = [];
  for (const h of HEDGES) {
    const hx = h.x + (r() - 0.5) * 4, hz = h.z + (r() - 0.5) * 4, a = h.a + (r() - 0.5) * 0.8;
    for (let k = 0; k < h.n; k++) {
      const s = (k - (h.n - 1) / 2) * 2.0, x = hx + Math.cos(a) * s, z = hz + Math.sin(a) * s;
      if (clear(x, z, 0.4)) bushes.push({ id: bushes.length, x, z, kind: Math.floor(r() * 5) });
    }
  }
  const trees: Tree[] = [];
  for (const zn of ZONES)
    for (let k = 0, n = 0; k < 6000 && n < zn.n; k++) {
      const [x, z] = sample(zn);
      if (zoneOf(x, z) !== zn || !clear(x, z, 0.6)) continue;
      if (trees.some((t) => Math.hypot(t.x - x, t.z - z) < Math.min(zn.spacing, zoneOf(t.x, t.z).spacing))) continue;
      if (bushes.some((b) => Math.hypot(b.x - x, b.z - z) < 2.2)) continue;
      trees.push({ x, z, kind: r() < zn.cedar ? 'cedar' : 'oak', s: 0.85 + r() * 0.35 });
      n++;
    }
  // the clearing's rim: a ring of oaks (it reads as a room), gaps where the trail runs
  for (let k = 0; k < 10; k++) {
    const a = (k / 10) * Math.PI * 2 + r() * 0.15, x = 3 + Math.cos(a) * 10.5, z = -24 + Math.sin(a) * 10.5;
    if (clear(x, z, 0.6) && !trees.some((t) => Math.hypot(t.x - x, t.z - z) < 2.9)) trees.push({ x, z, kind: 'oak', s: 1.1 });
  }
  // a few loose bushes in the woods
  for (let k = 0; k < 3000 && bushes.length < 40; k++) {
    const x = (r() * 2 - 1) * HALF, z = (r() * 2 - 1) * HALF, zn = zoneOf(x, z).name;
    if (!['grove', 'dark', 'ridge', 'east'].includes(zn)) continue;
    if (!clear(x, z, 0.4) || trees.some((t) => Math.hypot(t.x - x, t.z - z) < 2.2) || bushes.some((b) => Math.hypot(b.x - x, b.z - z) < 4)) continue;
    bushes.push({ id: bushes.length, x, z, kind: Math.floor(r() * 5) });
  }
  // the nests: the clearing's rim, the dark woods, the east trail
  const nests: { tree: number }[] = [];
  for (const [nx, nz] of [[-4, -30], [-22, -14], [30, 12]]) {
    let best = -1, bd = 1e9;
    trees.forEach((t, i) => {
      const d = Math.hypot(t.x - nx, t.z - nz);
      if (t.nest === undefined && d < bd) [best, bd] = [i, d];
    });
    if (best >= 0) {
      trees[best].nest = nests.length;
      nests.push({ tree: best });
    }
  }
  for (const t of trees) cells[cellOf(t.z) * N + cellOf(t.x)] |= TRUNK;
  for (const b of bushes) cells[cellOf(b.z) * N + cellOf(b.x)] |= BUSH;

  const items: Item[] = [];
  const free = (x: number, z: number) =>
    clear(x, z, 0) && !trees.some((t) => Math.hypot(t.x - x, t.z - z) < 1.4) && !bushes.some((b) => Math.hypot(b.x - x, b.z - z) < 1.6) && !items.some((i) => Math.hypot(i.x - x, i.z - z) < 2.5);
  const put = (kind: ItemKind, x: number, z: number, top = false, slot?: number) => items.push({ id: items.length, x, z, kind, top, ...(slot !== undefined ? { slot } : {}) });
  for (const g of MUSH) {
    const zn = ZONES.find((q) => q.name === g.zone)!;
    for (let k = 0, n = 0; k < 4000 && n < g.n; k++) {
      let [x, z] = sample(zn);
      if (g.rim) {
        const a = r() * Math.PI * 2, d = 5.5 + r() * 3;
        [x, z] = [3 + Math.cos(a) * d, -24 + Math.sin(a) * d];
      }
      if (g.near) {
        const a = Math.PI + r() * Math.PI, d = 9 + r() * 8;
        [x, z] = [Math.cos(a) * d, 30 + Math.sin(a) * d];
      }
      if (!free(x, z) || zoneOf(x, z).name !== g.zone) continue;
      put(g.kinds[Math.floor(r() * g.kinds.length)], x, z);
      n++;
    }
  }
  PIECES.forEach((pc, slot) => {
    if (pc.top !== undefined) {
      const p = PLATEAUS[pc.top];
      put('piece', (p.x0 + p.x1) / 2, (p.z0 + p.z1) / 2, true, slot);
      return;
    }
    const s = pc.spots![Math.floor(r() * pc.spots!.length)];
    for (let k = 0; k < 400; k++) {
      const x = s[0] + (r() - 0.5) * (3 + k / 40), z = s[1] + (r() - 0.5) * (3 + k / 40);
      if (free(x, z) || k === 399) {
        put('piece', x, z, false, slot);
        break;
      }
    }
  });
  put('elegant', PLATEAUS[0].x0 + 2, PLATEAUS[0].z0 + 2, true);
  put('rare', PLATEAUS[1].x0 + 2, PLATEAUS[1].z0 + 2, true);
  put('rare', PLATEAUS[1].x1 - 2, PLATEAUS[1].z1 - 2, true);
  put('rare', PLATEAUS[2].x1 - 2, PLATEAUS[2].z0 + 2, true);
  // the seeds: at the ways into danger (each crossing's north end, the clearing's south gap), three loose in the south
  for (const [x, z] of [[-8, -12], [23, -12], [-1, -15], [-14, 22], [12, 18], [-3, 12]])
    for (let k = 0; k < 200; k++) {
      const xx = x + (r() - 0.5) * 3, zz = z + (r() - 0.5) * 3;
      if (free(xx, zz)) {
        put('seed', xx, zz);
        break;
      }
    }

  return {
    seed, cells, trees, bushes, items, leaners: LEANERS, plateaus: PLATEAUS, nests, riverZ, riverHalf: RIVER_HALF, crossings: CROSSINGS, paths: PATHS,
    landmarks: LANDMARKS, dock: DOCK, camp: CAMP, spawn: [[-2, 31], [2, 31], [0, 29]], dens: DENS
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

/** A cedar's branches reach the ground: it blocks a sight line passing this close (m, × its size); an oak's trunk only
 *  OAK_R; a bush, BUSH_R. */
const CEDAR_R = 1.0, OAK_R = 0.55, BUSH_R = 0.9;

/** Nothing blocks the sight line from a to b: no tree or bush on it (their round shapes, not their cells: a forest you
 *  can see a little way into, less far among the cedars), nor a cliff between two points on the ground (`ground`). */
export function sight(m: ForestMap, ax: number, az: number, bx: number, bz: number, ground = false): boolean {
  const x0 = Math.min(ax, bx) - 1.5, x1 = Math.max(ax, bx) + 1.5, z0 = Math.min(az, bz) - 1.5, z1 = Math.max(az, bz) + 1.5;
  for (const t of m.trees)
    if (t.x > x0 && t.x < x1 && t.z > z0 && t.z < z1 && segDist(t.x, t.z, ax, az, bx, bz) < (t.kind === 'cedar' ? CEDAR_R * t.s : OAK_R)) return false;
  for (const b of m.bushes) if (b.x > x0 && b.x < x1 && b.z > z0 && b.z < z1 && segDist(b.x, b.z, ax, az, bx, bz) < BUSH_R) return false;
  if (ground) {
    const d = Math.hypot(bx - ax, bz - az), n = Math.ceil(d / 0.5);
    for (let i = 1; i < n; i++) if (at(m, ax + ((bx - ax) * i) / n, az + ((bz - az) * i) / n) & CLIFF) return false;
  }
  return true;
}

/** A plateau's top holds (x, z). */
export const onTop = (m: ForestMap, x: number, z: number): Plateau | null => m.plateaus.find((p) => inRect(p, x, z)) ?? null;
