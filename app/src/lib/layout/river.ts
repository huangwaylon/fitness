// The rivers drawn curved (docs/island-layout.md "Derived, never hand-made"), pure: each river's main stem (its tiles
// from the far end down to the sea, a fall or a pond) as a smooth centreline, the drawn water a band round it of a
// breadth that swells and narrows, the line meandering a little either side; fields.ts takes its signed distance as
// the fresh water's where the stem runs (so the banks, the bed, the bank's sand and grass in the bake and the water's
// edge all follow the curve), and its tangent as the flow (the streaks run along the bends). The data stays on tiles:
// the line is smoothed only within a tile's middle (a staircase of tiles drawn a straight diagonal, a corner rounded),
// the meander a few units, so the drawn water stays on its tiles near enough for the rules (nav, fish, casts: tiles).
// Pinned straight on a tile's middle: the ends (a fall's lip, the mouth, a pond's edge) and the tiles under and beside
// a bridge (its deck stays across the water). A river that is mostly not one stem (painted broad, a delta) keeps its
// tiles (fields.ts's own soft edge).
import { GRID, TILE, idx, kindOf, onGrid, tierOf, tileMid } from './grid.ts';
import type { Layout } from './model.ts';
import { footprintOf, kindDef } from './catalog.ts';

/** A stem's samples: world (x, z), the band's half-breadth (u), the downstream direction (unit). */
export interface Stem {
  tiles: number[];
  x: Float32Array;
  z: Float32Array;
  hw: Float32Array;
  fx: Float32Array;
  fz: Float32Array;
}

/** How far a smoothed point may leave its tile's middle (u). */
const SLACK = 9;
/** The meander's sway either side (u) and its wavelength along the stream (u); the breadth's mean half and its swing
 *  (narrow where it sways out, broad where it crosses its tiles' middle: the water's edge stays near its tiles). */
const SWAY = 5, SWAY_L = 230;
const HALF = 13.5, SWING = 2.5;
/** A sample every this along the line (u). */
const EVERY = 3;
const N4 = [[1, 0], [-1, 0], [0, 1], [0, -1]] as const;

const smooth = (a: number, b: number, v: number) => {
  const t = Math.max(0, Math.min(1, (v - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

/** The bridges' boxes (world u). */
function bridges(l: Layout): { x0: number; z0: number; x1: number; z1: number }[] {
  const out: { x0: number; z0: number; x1: number; z1: number }[] = [];
  const def = kindDef('bridge');
  if (!def) return out;
  for (const o of l.objects.values()) {
    if (o.k !== 'bridge') continue;
    const [w, d] = footprintOf(def, o.f);
    out.push({ x0: GRID.x0 + o.x * TILE, z0: GRID.z0 + o.z * TILE, x1: GRID.x0 + (o.x + w) * TILE, z1: GRID.z0 + (o.z + d) * TILE });
  }
  return out;
}
const boxDist = (b: { x0: number; z0: number; x1: number; z1: number }, x: number, z: number) =>
  Math.hypot(Math.max(b.x0 - x, 0, x - b.x1), Math.max(b.z0 - z, 0, z - b.z1));

/** Every river's main stem. */
export function riverStems(l: Layout): Stem[] {
  const kind = (c: number, r: number) => (onGrid(c, r) ? kindOf(l.codes[idx(c, r)]) : 'sea');
  const tier = (c: number, r: number) => (onGrid(c, r) ? tierOf(l.codes[idx(c, r)]) : 0);
  const fresh = (c: number, r: number) => kind(c, r) === 'river' || kind(c, r) === 'pond';
  const boxes = bridges(l);
  const seen = new Uint8Array(GRID.cols * GRID.rows);
  const out: Stem[] = [];
  for (let r0 = 0; r0 < GRID.rows; r0++)
    for (let c0 = 0; c0 < GRID.cols; c0++) {
      if (seen[idx(c0, r0)] || kind(c0, r0) !== 'river') continue;
      // the piece: its river tiles on one tier
      const t0 = tier(c0, r0), comp: [number, number][] = [[c0, r0]];
      seen[idx(c0, r0)] = 1;
      for (let h = 0; h < comp.length; h++)
        for (const [dc, dr] of N4) {
          const c = comp[h][0] + dc, r = comp[h][1] + dr;
          if (onGrid(c, r) && !seen[idx(c, r)] && kind(c, r) === 'river' && tier(c, r) === t0) {
            seen[idx(c, r)] = 1;
            comp.push([c, r]);
          }
        }
      const stem = stemOf(comp, t0);
      if (stem) out.push(stem);
    }
  return out;

  function stemOf(comp: [number, number][], t0: number): Stem | null {
    const inComp = new Set(comp.map(([c, r]) => idx(c, r)));
    // its downstream end: by the sea, else over a fall (fresh a tier down), else into a pond
    const outlet = (c: number, r: number, p: (c: number, r: number) => boolean) => N4.find(([dc, dr]) => p(c + dc, r + dr));
    const toSea = (c: number, r: number) => kind(c, r) === 'sea';
    const toFall = (c: number, r: number) => fresh(c, r) && tier(c, r) < t0;
    const toPond = (c: number, r: number) => kind(c, r) === 'pond';
    let ends = comp.filter(([c, r]) => outlet(c, r, toSea));
    let mouth = true;
    if (!ends.length) (ends = comp.filter(([c, r]) => outlet(c, r, toFall))), (mouth = false);
    if (!ends.length) ends = comp.filter(([c, r]) => outlet(c, r, toPond));
    if (!ends.length) return null;
    const dist = new Map<number, number>();
    const q = [...ends];
    for (const [c, r] of ends) dist.set(idx(c, r), 0);
    for (let h = 0; h < q.length; h++) {
      const [c, r] = q[h];
      for (const [dc, dr] of N4) {
        const k = idx(c + dc, r + dr);
        if (onGrid(c + dc, r + dr) && inComp.has(k) && !dist.has(k)) {
          dist.set(k, dist.get(idx(c, r))! + 1);
          q.push([c + dc, r + dr]);
        }
      }
    }
    // the far end, then down the distances to the sea, keeping straight where it can
    let far = q[0];
    for (const p of q) if (dist.get(idx(...p))! > dist.get(idx(...far))!) far = p;
    if (dist.get(idx(...far))! < 2) return null;
    const path: [number, number][] = [far];
    let dir: readonly [number, number] = [0, 0];
    while (dist.get(idx(...path.at(-1)!))! > 0) {
      const [c, r] = path.at(-1)!, d = dist.get(idx(c, r))!;
      const steps = N4.filter(([dc, dr]) => dist.get(idx(c + dc, r + dr)) === d - 1 && inComp.has(idx(c + dc, r + dr)));
      const s = steps.find(([dc, dr]) => dc === dir[0] && dr === dir[1]) ?? steps[0];
      dir = s;
      path.push([c + s[0], r + s[1]]);
    }
    // mostly not one stem (painted broad, a delta): its tiles as they are
    if (comp.length - path.length > comp.length * 0.3) return null;
    path.reverse();
    // its points, from the mouth up: the tiles' middles, and past the ends to the water it meets
    const pts: { x: number; z: number; fixed: boolean }[] = [];
    const [ec, er] = path[0];
    const out0 = outlet(ec, er, mouth ? toSea : toFall) ?? outlet(ec, er, toPond)!;
    const [mx, mz] = tileMid(ec, er);
    if (mouth) pts.push({ x: mx + out0[0] * TILE * 1.5, z: mz + out0[1] * TILE * 1.5, fixed: true });
    pts.push({ x: mx + out0[0] * TILE * 0.5, z: mz + out0[1] * TILE * 0.5, fixed: true });
    const nearBridge = (c: number, r: number) => {
      const [x, z] = tileMid(c, r);
      return boxes.some((b) => boxDist(b, x, z) < TILE);
    };
    path.forEach(([c, r], i) => {
      const [x, z] = tileMid(c, r);
      pts.push({ x, z, fixed: i === 0 || i === path.length - 1 || nearBridge(c, r) });
    });
    // its source: into the water it comes from (a pond, a fall from above), else a little on
    const [sc, sr] = path.at(-1)!, [px, pz] = path.at(-2)!;
    const from = N4.find(([dc, dr]) => fresh(sc + dc, sr + dr) && !inComp.has(idx(sc + dc, sr + dr)));
    const [sx, sz] = tileMid(sc, sr);
    if (from) pts.push({ x: sx + from[0] * TILE * 0.5, z: sz + from[1] * TILE * 0.5, fixed: true });
    else pts.push({ x: sx + (sc - px) * TILE * 0.3, z: sz + (sr - pz) * TILE * 0.3, fixed: true });
    // smoothed within each tile's middle
    const ox = pts.map((p) => p.x), oz = pts.map((p) => p.z);
    const X = [...ox], Z = [...oz];
    for (let it = 0; it < 40; it++)
      for (let i = 1; i < pts.length - 1; i++) {
        if (pts[i].fixed) continue;
        const tx = (X[i - 1] + X[i + 1]) / 2, tz = (Z[i - 1] + Z[i + 1]) / 2;
        X[i] = Math.max(ox[i] - SLACK, Math.min(ox[i] + SLACK, X[i] + (tx - X[i]) * 0.6));
        Z[i] = Math.max(oz[i] - SLACK, Math.min(oz[i] + SLACK, Z[i] + (tz - Z[i]) * 0.6));
      }
    // a Catmull-Rom spline through them, sampled every EVERY u
    const sx_: number[] = [], sz_: number[] = [];
    const P = (i: number) => [X[Math.max(0, Math.min(X.length - 1, i))], Z[Math.max(0, Math.min(Z.length - 1, i))]];
    for (let i = 0; i < X.length - 1; i++) {
      const [ax, az] = P(i - 1), [bx, bz] = P(i), [cx, cz] = P(i + 1), [dx, dz] = P(i + 2);
      const n = Math.max(1, Math.ceil(Math.hypot(cx - bx, cz - bz) / EVERY));
      for (let k = 0; k < n; k++) {
        const t = k / n, t2 = t * t, t3 = t2 * t;
        const cr = (a: number, b: number, c: number, d: number) => 0.5 * (2 * b + (c - a) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (3 * b - a - 3 * c + d) * t3);
        sx_.push(cr(ax, bx, cx, dx));
        sz_.push(cr(az, bz, cz, dz));
      }
    }
    sx_.push(X.at(-1)!);
    sz_.push(Z.at(-1)!);
    // the meander and the breadth, along the line from the mouth (tapered to nothing at the ends and at a bridge)
    const n = sx_.length, len = new Float32Array(n);
    for (let i = 1; i < n; i++) len[i] = len[i - 1] + Math.hypot(sx_[i] - sx_[i - 1], sz_[i] - sz_[i - 1]);
    const L = len[n - 1];
    const sea = mouth ? TILE * 1.5 : 0;
    const stem: Stem = { tiles: path.map(([c, r]) => idx(c, r)), x: new Float32Array(n), z: new Float32Array(n), hw: new Float32Array(n), fx: new Float32Array(n), fz: new Float32Array(n) };
    for (let i = 0; i < n; i++) {
      const a = Math.max(0, i - 1), b = Math.min(n - 1, i + 1);
      let tx = sx_[b] - sx_[a], tz = sz_[b] - sz_[a];
      const tl = Math.hypot(tx, tz) || 1;
      tx /= tl;
      tz /= tl;
      const s = len[i];
      const bridge = boxes.reduce((m, bx) => Math.min(m, boxDist(bx, sx_[i], sz_[i])), Infinity);
      const taper = Math.min(smooth(sea, sea + 50, s), smooth(0, 50, L - s), smooth(8, 50, bridge));
      const ph = Math.sin((2 * Math.PI * s) / SWAY_L + 0.7);
      const o = SWAY * ph * taper;
      stem.x[i] = sx_[i] - tz * o;
      stem.z[i] = sz_[i] + tx * o;
      // broader where it meets the sea
      stem.hw[i] = HALF + SWING * (1 - 2 * Math.abs(ph)) * taper + (mouth ? Math.max(0, sea + 15 - s) * 0.45 : 0);
      // downstream: toward the mouth
      stem.fx[i] = -tx;
      stem.fz[i] = -tz;
    }
    return stem;
  }
}

/** The stems' signed distance (u, negative in the water, clamped to ±far) on a raster of `step` u from the grid's
 *  corner, `w` × `h` cells, and each cell's downstream direction (the nearest stem point's; 0 where no stem is near). */
export function stemField(stems: readonly Stem[], w: number, h: number, step: number, far: number): { d: Float32Array; fx: Float32Array; fz: Float32Array } {
  const d = new Float32Array(w * h).fill(far), fx = new Float32Array(w * h), fz = new Float32Array(w * h);
  const best = new Float32Array(w * h).fill(Infinity);
  for (const s of stems)
    for (let i = 0; i < s.x.length - 1; i++) {
      const ax = s.x[i], az = s.z[i], bx = s.x[i + 1], bz = s.z[i + 1];
      const ex = bx - ax, ez = bz - az, ee = ex * ex + ez * ez || 1;
      const reach = Math.max(s.hw[i], s.hw[i + 1]) + far;
      const i0 = Math.max(0, Math.floor((Math.min(ax, bx) - reach - GRID.x0) / step)), i1 = Math.min(w - 1, Math.ceil((Math.max(ax, bx) + reach - GRID.x0) / step));
      const j0 = Math.max(0, Math.floor((Math.min(az, bz) - reach - GRID.z0) / step)), j1 = Math.min(h - 1, Math.ceil((Math.max(az, bz) + reach - GRID.z0) / step));
      for (let j = j0; j <= j1; j++) {
        const z = GRID.z0 + (j + 0.5) * step;
        for (let k = i0; k <= i1; k++) {
          const x = GRID.x0 + (k + 0.5) * step;
          const t = Math.max(0, Math.min(1, ((x - ax) * ex + (z - az) * ez) / ee));
          const dd = Math.hypot(x - ax - ex * t, z - az - ez * t) - (s.hw[i] + (s.hw[i + 1] - s.hw[i]) * t);
          const q = j * w + k;
          if (dd < best[q]) {
            best[q] = dd;
            fx[q] = s.fx[i];
            fz[q] = s.fz[i];
          }
        }
      }
    }
  for (let q = 0; q < w * h; q++) {
    if (best[q] === Infinity) continue;
    d[q] = Math.max(-far, Math.min(far, best[q]));
    if (best[q] > 12) fx[q] = fz[q] = 0;
  }
  return { d, fx, fz };
}
