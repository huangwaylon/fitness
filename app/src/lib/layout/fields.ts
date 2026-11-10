// The layout's distance fields (docs/island-layout.md "Derived, never hand-made"), pure: for each region the ground
// is shaded and shaped by (the land against the sea, the beach's sand, the fresh water, the paths, each cliff tier),
// the signed distance (u) to its rounded edge on a 2.5u raster, negative inside. The heights read them (a beach that
// slopes into the sea, banks that slope into the river, a path a little sunk in the grass), and the 3D ground's bake
// (world3d/terrain.ts) shades with them: soft, NH-round edges that follow the tiles, without a hand-drawn shape.
import { CHUNK, GRID, TILE, idx, kindOf, onGrid, tierOf, type Kind } from './grid.ts';
import type { Layout } from './model.ts';
import { riverStems, stemField } from './river.ts';

/** The raster's step (u) and its width (the grid's); its depth is the layout's (rasterRows). */
export const STEP = 2.5;
const W = (GRID.cols * TILE) / STEP;
const PER = TILE / STEP;
/** The sea past the land's back the raster still covers (tiles): past FAR and the blur every channel is at its clamp. */
const BACK_PAD = 4;
/** The raster's depth (tile rows from the grid's front): the land's back row and BACK_PAD more, up to a whole chunk,
 *  never past the grid. The sea behind it is a channel's clamp, as off the grid (at()), so it isn't rastered: a long
 *  island's fields cost its own length, not the grid's (156 rows since 2026-11-10; the default's 64, the max's 156). */
export function rasterRows(codes: ArrayLike<number>): number {
  let last = -1;
  for (let i = codes.length - 1; i >= 0; i--)
    if (kindOf(codes[i]) !== 'sea') {
      last = Math.floor(i / GRID.cols);
      break;
    }
  return Math.min(GRID.rows, Math.max(CHUNK, Math.ceil((last + 1 + BACK_PAD) / CHUNK) * CHUNK));
}
/** Distances are clamped to this (u): nothing shades or shapes farther from an edge. */
export const FAR = 48;
/** The rounding's radius (a tile's share): NH's cliff corners, a third of a tile (mesh.ts builds their walls on it). */
const ROUND = 1 / 3;
/** The soft edges' (the coast, the beach's sand, the fresh water, the paths): half a tile, a staircase of tiles cut
 *  to a straight diagonal; then the field is smoothed over SOFT cells (a box blur, twice), so the shape is curved
 *  without a kink or the raster's 2.5u steps. The data stays on tiles: only the drawn edge is round. */
const SOFT_ROUND = 1 / 2;
const SOFT = 2;

export const Ch = { land: 0, sandy: 1, fresh: 2, path: 3, tier1: 4, tier2: 5, tier3: 6 } as const;
/** The channels drawn soft (the tiers' walls keep their exact ROUND corners). */
const SOFT_CH = 4;
export type Ch = (typeof Ch)[keyof typeof Ch];
const CHANNELS = 7;

/** Whether a point at (u, v) in tile (c, r) (u, v in 0…1) is inside the rounded region `m` (a test on tiles): a
 *  convex corner cut round, a concave one filled round (NH's island has no square corner). */
export function roundedIn(m: (c: number, r: number) => boolean, c: number, r: number, u: number, v: number, R = ROUND): boolean {
  const own = m(c, r);
  const sx = u < 0.5 ? -1 : 1, sz = v < 0.5 ? -1 : 1;
  const du = sx < 0 ? u : 1 - u, dv = sz < 0 ? v : 1 - v;
  if (du >= R || dv >= R) return own;
  const h = m(c + sx, r), vv = m(c, r + sz);
  const inCircle = (R - du) ** 2 + (R - dv) ** 2 <= R * R;
  if (own && !h && !vv) return inCircle;
  if (!own && h && vv) return !inCircle;
  return own;
}

/** The region tests on tiles, by channel. */
export function masks(layout: Layout): ((c: number, r: number) => boolean)[] {
  const kindAt = (c: number, r: number): Kind => (onGrid(c, r) ? kindOf(layout.codes[idx(c, r)]) : 'sea');
  const tierAt = (c: number, r: number): number => (onGrid(c, r) ? tierOf(layout.codes[idx(c, r)]) : 0);
  const land = (c: number, r: number) => kindAt(c, r) !== 'sea';
  return [
    land,
    (c, r) => kindAt(c, r) === 'sand' || kindAt(c, r) === 'sea',
    (c, r) => kindAt(c, r) === 'river' || kindAt(c, r) === 'pond',
    (c, r) => {
      const k = kindAt(c, r);
      return k === 'dirt' || k === 'stone' || k === 'brick' || k === 'plank';
    },
    ...[1, 2, 3].map((t) => (c: number, r: number) => land(c, r) && tierAt(c, r) >= t)
  ];
}

export interface Fields {
  /** The raster's cells across and deep (deep: rasterRows × TILE / STEP). */
  readonly w: number;
  readonly h: number;
  /** Each channel's signed distance (u), row by row (z), clamped to ±FAR. */
  readonly ch: Float32Array[];
  /** A channel's distance at world (x, z), bilinear (off the raster: its edge's). */
  at(ch: Ch, x: number, z: number): number;
  /** The water's downstream direction at (x, z) along a river's curved stem (river.ts), null off one. */
  flow(x: number, z: number): [number, number] | null;
  /** Where (x, z) is on a river's stem: the length along it from the mouth (u) and how far across (its half-breadths,
   *  signed), bilinear on the raster; null off one. The water's streaks run on these (no seam or shear at a bend). */
  along(x: number, z: number): [number, number] | null;
}

/** What a layout's fields are made of: each channel's raster and the river stems' (computeFields; a worker's
 *  result, structured-cloned: fieldsPrime.ts). */
export interface RawFields { ch: Float32Array[]; sf: ReturnType<typeof stemField> | null }

const cache = new WeakMap<Layout, Fields>();
/** What the fields read of a layout, as a key: its codes and its bridges (two layouts alike there share them: the
 *  island's layout object is replaced as its store attaches, with the same tiles). */
const keyOf = (l: Pick<Layout, 'codes' | 'objects'>): string => {
  let k = '';
  for (let i = 0; i < l.codes.length; i++) k += String.fromCharCode(l.codes[i]);
  for (const o of l.objects.values()) if (o.k === 'bridge') k += `|${o.x},${o.z},${o.f}`;
  return k;
};
/** The latest fields by key (a worker's, or a layout's built here; one: a set is ~8 MB, the layouts' own hold theirs). */
const byKey = new Map<string, Fields>();
const keep = (k: string, f: Fields) => {
  byKey.delete(k);
  byKey.set(k, f);
  if (byKey.size > 1) byKey.delete(byKey.keys().next().value!);
};
export function fieldsOf(layout: Layout): Fields {
  let f = cache.get(layout);
  if (!f) {
    const k = keyOf(layout);
    f = byKey.get(k) ?? wrap(computeFields(layout));
    keep(k, f);
    cache.set(layout, f);
  }
  return f;
}
/** Whether the layout's fields are built (or adopted). */
export const hasFields = (layout: Layout): boolean => cache.has(layout) || byKey.has(keyOf(layout));
/** A layout's fields computed elsewhere (computeFields in a worker: the same code, the same numbers), kept only while
 *  no set is held here yet (the launch's); any layout with the same tiles and bridges takes them. A late answer is
 *  dropped (~8 MB let go): its own set built here meanwhile, or the island's tiles changed since it was asked, and
 *  keeping it would push out the current layout's set (byKey holds one). */
export function adoptFields(layout: Layout, raw: RawFields): void {
  if (!cache.has(layout) && !byKey.size) keep(keyOf(layout), wrap(raw));
}

/** A chamfer distance transform (3 × 3, steps 1 and √2) of a boolean raster: each cell's distance to the nearest set
 *  cell (0 on it), in cells. */
function chamfer(set: Uint8Array, out: Float32Array, H: number): void {
  const big = 1e6, D = Math.SQRT2;
  for (let i = 0; i < set.length; i++) out[i] = set[i] ? 0 : big;
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const i = y * W + x;
      let d = out[i];
      if (!d) continue;
      if (x > 0) d = Math.min(d, out[i - 1] + 1);
      if (y > 0) {
        d = Math.min(d, out[i - W] + 1);
        if (x > 0) d = Math.min(d, out[i - W - 1] + D);
        if (x < W - 1) d = Math.min(d, out[i - W + 1] + D);
      }
      out[i] = d;
    }
  for (let y = H - 1; y >= 0; y--)
    for (let x = W - 1; x >= 0; x--) {
      const i = y * W + x;
      let d = out[i];
      if (!d) continue;
      if (x < W - 1) d = Math.min(d, out[i + 1] + 1);
      if (y < H - 1) {
        d = Math.min(d, out[i + W] + 1);
        if (x < W - 1) d = Math.min(d, out[i + W + 1] + D);
        if (x > 0) d = Math.min(d, out[i + W - 1] + D);
      }
      out[i] = d;
    }
}

/** A box blur of radius `n` cells in place (along x, then z; the edges held), `tmp` the scratch. A field's straight
 *  edges stay where they are (the blur keeps a linear ramp), its corners and kinks round off. */
function blur(a: Float32Array, tmp: Float32Array, n: number, H: number): void {
  const k = 1 / (2 * n + 1);
  for (let y = 0; y < H; y++) {
    const o = y * W;
    let s = a[o] * (n + 1);
    for (let i = 1; i <= n; i++) s += a[o + Math.min(W - 1, i)];
    for (let x = 0; x < W; x++) {
      tmp[o + x] = s * k;
      s += a[o + Math.min(W - 1, x + n + 1)] - a[o + Math.max(0, x - n)];
    }
  }
  for (let x = 0; x < W; x++) {
    let s = tmp[x] * (n + 1);
    for (let i = 1; i <= n; i++) s += tmp[Math.min(H - 1, i) * W + x];
    for (let y = 0; y < H; y++) {
      a[y * W + x] = s * k;
      s += tmp[Math.min(H - 1, y + n + 1) * W + x] - tmp[Math.max(0, y - n) * W + x];
    }
  }
}

const circle = (du: number, dv: number, R: number) => (R - du) ** 2 + (R - dv) ** 2 <= R * R;

/** A smooth minimum of two distances (k u of blend): a river's curve meets a pond or a broad reach without a crease. */
const smin = (a: number, b: number, k: number) => {
  const h = Math.max(k - Math.abs(a - b), 0) / k;
  return Math.min(a, b) - (h * h * k) / 4;
};

/** The fields' rasters (pure: the codes and the bridges are all it reads), `rows` tile rows deep (the tests: the
 *  whole grid's, the same numbers where both reach). */
export function computeFields(layout: Pick<Layout, 'codes' | 'objects'>, rows = rasterRows(layout.codes)): RawFields {
  const ms = masks(layout as Layout);
  // the rivers' main stems are drawn from their curves (river.ts), not their tiles
  const stems = riverStems(layout as Layout);
  const onStem = new Set(stems.flatMap((s) => s.tiles));
  const freshTiles = ms[Ch.fresh];
  if (onStem.size) ms[Ch.fresh] = (c, r) => freshTiles(c, r) && !(onGrid(c, r) && onStem.has(idx(c, r)));
  const ch: Float32Array[] = [];
  const H = rows * PER;
  const inside = new Uint8Array(W * H), outside = new Uint8Array(W * H);
  const dIn = new Float32Array(W * H), dOut = new Float32Array(W * H);
  // each mask on the tiles once, with a ring of sea round the grid
  const TW = GRID.cols + 2, TH = GRID.rows + 2;
  const tiles = new Uint8Array(TW * TH);
  const tier = (c: number, r: number) => (onGrid(c, r) ? tierOf(layout.codes[idx(c, r)]) : 0);
  for (let k = 0; k < CHANNELS; k++) {
    const m = ms[k];
    // (the fresh water's: 2 where the sea is, so a river runs out to it square, its mouth not rounded off)
    for (let r = -1; r <= GRID.rows; r++) for (let c = -1; c <= GRID.cols; c++) tiles[(r + 1) * TW + c + 1] = m(c, r) ? 1 : k === Ch.fresh && !ms[Ch.land](c, r) ? 2 : 0;
    const t = (c: number, r: number) => (c < -1 || r < -1 || c > GRID.cols || r > GRID.rows ? tiles[(Math.max(-1, Math.min(GRID.rows, r)) + 1) * TW + Math.max(-1, Math.min(GRID.cols, c)) + 1] : tiles[(r + 1) * TW + c + 1]);
    const soft = k < SOFT_CH, R = soft ? SOFT_ROUND : ROUND;
    for (let r = 0; r < rows; r++)
      for (let c = 0; c < GRID.cols; c++) {
        const own = t(c, r) === 1 ? 1 : 0;
        for (let j = 0; j < PER; j++) {
          const v = (j + 0.5) / PER, sz = v < 0.5 ? -1 : 1, dv = sz < 0 ? v : 1 - v;
          for (let i = 0; i < PER; i++) {
            const u = (i + 0.5) / PER, sx = u < 0.5 ? -1 : 1, du = sx < 0 ? u : 1 - u;
            let inn = own;
            if (du < R && dv < R) {
              const h = t(c + sx, r), vv = t(c, r + sz);
              // soft on one level; where a tier's wall stands (a cliff to the sea) its exact corner, as the wall's
              const lv = tier(c, r), sf = soft && tier(c + sx, r) === lv && tier(c, r + sz) === lv, Rc = sf ? SOFT_ROUND : ROUND;
              if (du >= Rc || dv >= Rc) {
                // outside this corner's rounding
              } else if (own && !h && !vv) inn = sf && t(c + sx, r - sz) && t(c - sx, r + sz) ? (du + dv >= Rc ? 1 : 0) : circle(du, dv, Rc) ? 1 : 0;
              else if (!own && t(c, r) !== 2 && h && vv) inn = sf && !t(c + sx, r - sz) && !t(c - sx, r + sz) ? (du + dv >= Rc ? 0 : 1) : circle(du, dv, Rc) ? 0 : 1;
            }
            const q = (r * PER + j) * W + c * PER + i;
            inside[q] = inn;
            outside[q] = inn ? 0 : 1;
          }
        }
      }
    // distance to the region (from outside) and to its outside (from inside); the edge lies half a cell between
    chamfer(inside, dOut, H);
    chamfer(outside, dIn, H);
    const out = new Float32Array(W * H);
    for (let i = 0; i < W * H; i++) {
      const d = inside[i] ? -(dIn[i] - 0.5) * STEP : (dOut[i] - 0.5) * STEP;
      out[i] = d < -FAR ? -FAR : d > FAR ? FAR : d;
    }
    if (soft) for (let pass = 0; pass < 2; pass++) blur(out, dIn, SOFT, H);
    ch.push(out);
  }
  const sf = stems.length ? stemField(stems, W, H, STEP, FAR) : null;
  if (sf) {
    const fr = ch[Ch.fresh];
    for (let i = 0; i < W * H; i++) fr[i] = Math.max(-FAR, Math.min(FAR, smin(fr[i], sf.d[i], 10)));
  }
  return { ch, sf };
}

function wrap({ ch, sf }: RawFields): Fields {
  const H = ch[0].length / W, Z1 = GRID.z0 + H * STEP;
  return {
    w: W,
    h: H,
    ch,
    at(k: Ch, x: number, z: number): number {
      const fx = Math.max(0, Math.min(W - 1.001, (x - GRID.x0) / STEP - 0.5)), fz = Math.max(0, Math.min(H - 1.001, (z - GRID.z0) / STEP - 0.5));
      const x0 = Math.floor(fx), z0 = Math.floor(fz), tx = fx - x0, tz = fz - z0;
      const a = ch[k], i = z0 * W + x0;
      const top = a[i] + (a[i + 1] - a[i]) * tx, bot = a[i + W] + (a[i + W + 1] - a[i + W]) * tx;
      let d = top + (bot - top) * tz;
      // off the raster: farther out still (the sea beyond the grid, or behind the land's back)
      const ox = Math.max(GRID.x0 - x, x - (GRID.x0 + GRID.cols * TILE), 0), oz = Math.max(GRID.z0 - z, z - Z1, 0);
      if (ox || oz) d = k === Ch.land || k === Ch.sandy ? (k === Ch.land ? Math.max(d, 0) + Math.hypot(ox, oz) : -FAR) : d + Math.hypot(ox, oz);
      return Math.max(-FAR, Math.min(FAR, d));
    },
    flow(x: number, z: number): [number, number] | null {
      if (!sf) return null;
      const i = Math.floor((x - GRID.x0) / STEP), j = Math.floor((z - GRID.z0) / STEP);
      if (i < 0 || j < 0 || i >= W || j >= H) return null;
      const q = j * W + i;
      return sf.fx[q] || sf.fz[q] ? [sf.fx[q], sf.fz[q]] : null;
    },
    along(x: number, z: number): [number, number] | null {
      if (!sf) return null;
      const fx = Math.max(0, Math.min(W - 1.001, (x - GRID.x0) / STEP - 0.5)), fz = Math.max(0, Math.min(H - 1.001, (z - GRID.z0) / STEP - 0.5));
      const x0 = Math.floor(fx), z0 = Math.floor(fz), tx = fx - x0, tz = fz - z0, i = z0 * W + x0;
      const on = (q: number) => sf.fx[q] !== 0 || sf.fz[q] !== 0;
      const near = Math.round(fz) * W + Math.round(fx);
      const qs = [i, i + 1, i + W, i + W + 1];
      // (the four cells on one stretch of one stem: bilinear; else the nearest cell's)
      if (qs.every(on) && Math.max(...qs.map((q) => sf.s[q])) - Math.min(...qs.map((q) => sf.s[q])) < 4 * STEP) {
        const bl = (a: Float32Array) => (a[i] * (1 - tx) + a[i + 1] * tx) * (1 - tz) + (a[i + W] * (1 - tx) + a[i + W + 1] * tx) * tz;
        return [bl(sf.s), bl(sf.across)];
      }
      return on(near) ? [sf.s[near], sf.across[near]] : null;
    }
  };
}
