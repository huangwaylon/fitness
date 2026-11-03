// The rivers drawn with round turns (docs/island-layout.md "The river's turns"), pure: each river's main stem (its
// tiles from the far end down to the sea, a fall or a pond) as a centreline of straights and circular arcs, the drawn
// water a band of one breadth round it; fields.ts takes its signed distance as the fresh water's where the stem runs (so
// the banks, the bed, the bank's sand and grass in the bake and the water's edge all follow it), its tangent as the flow
// and its length as the streaks' way along (mesh.ts). The user (2026-11-03): "for the straight parts, keep it straight
// … if I have a straight line down, then go 45 degree down and left, then straight left, I want the 45 degree down to
// be a quarter circle curve". So:
// - a straight is a run of MIN_RUN+ tile steps one way (and the run at either end): drawn exactly on its tiles' middles;
// - between two straights, the tiles that turn (a staircase, a jog's step, or none: a plain L) are a turn: a line
//   through the staircase's middle, and each corner where the lines meet is filleted with a circular arc tangent to
//   both, the two arcs taking half the staircase's line each, so a staircase between a straight down and a straight
//   left is one quarter circle through its middle (a long staircase: an arc, a straight diagonal, an arc); a plain L
//   (two straights meeting on a tile) gets a small fillet (R_L);
// - an arc's radius shrinks until the drawn water stays on the river's own tiles (its edge within EDGE_TOL of them)
//   and clear of a bridge (whose tiles stay straight, its deck square across the water).
// The data stays on tiles (nav, fish, casts: tiles); only the drawn water is round. Pinned at the ends (a fall's lip,
// the mouth, a pond's edge). A river that is mostly not one stem (painted broad, a delta) keeps its tiles (fields.ts's
// own soft edge). The editor marks the line and its arcs on its plan (editor/plan.ts drawRiver).
import { GRID, TILE, idx, kindOf, onGrid, tierOf, tileMid } from './grid.ts';
import type { Layout } from './model.ts';
import { footprintOf, kindDef } from './catalog.ts';

/** A turn's arc (world u): its centre, its radius, where it leaves the line before and meets the line after, and how
 *  far it turns (degrees). */
export interface StemArc {
  cx: number;
  cz: number;
  r: number;
  x0: number;
  z0: number;
  x1: number;
  z1: number;
  deg: number;
}

/** A stem's samples, from the mouth up: world (x, z), the band's half-breadth (u), the downstream direction (unit),
 *  the length along it from the mouth (u); and its turns' arcs. */
export interface Stem {
  tiles: number[];
  x: Float32Array;
  z: Float32Array;
  hw: Float32Array;
  fx: Float32Array;
  fz: Float32Array;
  s: Float32Array;
  arcs: StemArc[];
}

/** The band's half-breadth (u): a tile less a bank either side. */
const HALF = 13.5;
/** A sample every this along the line (u). */
const EVERY = 3;
/** A straight: this many tile steps one way, or more. */
const MIN_RUN = 3;
/** A plain L's fillet (u), and the least an arc shrinks to (u). */
const R_L = TILE * 0.75;
const R_MIN = 6;
/** How far the drawn water's edge may stand off its tiles (u). */
export const EDGE_TOL = TILE * 0.3;
/** How far an arc may stand off its straight where it passes a bridge (u): its deck stays square across the water. */
const BRIDGE_OFF = 3;
const N4 = [[1, 0], [-1, 0], [0, 1], [0, -1]] as const;

type V2 = [number, number];
/** A line the stem runs on: a point on it, its direction (unit, from the mouth up), whether it's a straight's. */
interface Leg {
  px: number;
  pz: number;
  dx: number;
  dz: number;
  straight: boolean;
}

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

/** The lines through a stem's points (the tiles' middles, and past either end): each straight's, and between two a
 *  turn's line across its tiles' middle (none for a plain L). */
function legsOf(P: readonly V2[]): Leg[] {
  const runs: { dx: number; dz: number; i0: number; i1: number }[] = [];
  for (let i = 0; i < P.length - 1; i++) {
    const ex = P[i + 1][0] - P[i][0], ez = P[i + 1][1] - P[i][1], el = Math.hypot(ex, ez) || 1;
    const dx = Math.round(ex / el), dz = Math.round(ez / el), last = runs.at(-1);
    if (last && last.dx === dx && last.dz === dz) last.i1 = i + 1;
    else runs.push({ dx, dz, i0: i, i1: i + 1 });
  }
  const straights = runs.filter((r, k) => k === 0 || k === runs.length - 1 || r.i1 - r.i0 >= MIN_RUN);
  const legs: Leg[] = [];
  straights.forEach((r, k) => {
    const prev = straights[k - 1];
    if (prev && prev.i1 < r.i0) {
      // the turn's tiles, from the straight before's last to the next's first: a line across them, through their middle
      const a = P[prev.i1], b = P[r.i0], vl = Math.hypot(b[0] - a[0], b[1] - a[1]);
      const vx = (b[0] - a[0]) / vl, vz = (b[1] - a[1]) / vl;
      if (Math.abs(vx * prev.dz - vz * prev.dx) > 0.2 && Math.abs(vx * r.dz - vz * r.dx) > 0.2) {
        let lo = Infinity, hi = -Infinity;
        for (let i = prev.i1; i <= r.i0; i++) {
          const o = (P[i][0] - a[0]) * -vz + (P[i][1] - a[1]) * vx;
          lo = Math.min(lo, o);
          hi = Math.max(hi, o);
        }
        const o = (lo + hi) / 2;
        legs.push({ px: a[0] - vz * o, pz: a[1] + vx * o, dx: vx, dz: vz, straight: false });
      }
    }
    legs.push({ px: P[r.i0][0], pz: P[r.i0][1], dx: r.dx, dz: r.dz, straight: true });
  });
  // two lines one way, one after the other (a turn's tiles that make no line): one straight on, or a step across
  for (let k = 1; k < legs.length; k++) {
    const A = legs[k - 1], B = legs[k];
    if (Math.abs(A.dx * B.dz - A.dz * B.dx) > 1e-3) continue;
    const off = (B.px - A.px) * -A.dz + (B.pz - A.pz) * A.dx, sg = Math.sign(off) || 1;
    if (Math.abs(off) < 1 && A.dx * B.dx + A.dz * B.dz > 0) legs.splice(k--, 1);
    else legs.splice(k, 0, { px: B.px, pz: B.pz, dx: -A.dz * sg, dz: A.dx * sg, straight: false });
  }
  return legs;
}

/** Where two lines cross (null: parallel). */
function meet(A: Leg, B: Leg): V2 | null {
  const den = A.dx * B.dz - A.dz * B.dx;
  if (Math.abs(den) < 1e-6) return null;
  const t = ((B.px - A.px) * B.dz - (B.pz - A.pz) * B.dx) / den;
  return [A.px + A.dx * t, A.pz + A.dz * t];
}

/** A corner's arc: its centre and radius, its ends (on the line before, on the line after), its start angle and its
 *  sweep (radians, signed). */
interface Fillet {
  r: number;
  cx: number;
  cz: number;
  a: V2;
  b: V2;
  a0: number;
  sweep: number;
}

/** The arc at corner V from line A to line B, leaving each `t` u from the corner (tangent to both). */
function fillet(V: V2, A: Leg, B: Leg, t: number): Fillet | null {
  const d = Math.acos(Math.max(-1, Math.min(1, A.dx * B.dx + A.dz * B.dz)));
  if (d < 0.02 || t <= 0) return null;
  const r = t / Math.tan(d / 2), sg = Math.sign(A.dx * B.dz - A.dz * B.dx);
  const a: V2 = [V[0] - A.dx * t, V[1] - A.dz * t], b: V2 = [V[0] + B.dx * t, V[1] + B.dz * t];
  const cx = a[0] - A.dz * sg * r, cz = a[1] + A.dx * sg * r;
  return { r, cx, cz, a, b, a0: Math.atan2(a[1] - cz, a[0] - cx), sweep: sg * d };
}

function arcPoints(f: Fillet): V2[] {
  const n = Math.max(2, Math.ceil((f.r * Math.abs(f.sweep)) / EVERY));
  return Array.from({ length: n + 1 }, (_, i) => {
    const th = f.a0 + (f.sweep * i) / n;
    return [f.cx + f.r * Math.cos(th), f.cz + f.r * Math.sin(th)] as V2;
  });
}

/** A stem's points as a line of straights and arcs (sampled every EVERY u), each arc as big as its turn's tiles
 *  allow: `fits` says whether a point of an arc (`n` its normal, for the banks; `off` how far it is off the straights
 *  it joins) may be drawn. */
function roundTurns(P: readonly V2[], fits: (x: number, z: number, nx: number, nz: number, off: number) => boolean): { pts: V2[]; arcs: StemArc[] } {
  let legs = legsOf(P);
  let V: V2[] = [];
  const corners = () => {
    V = [];
    for (let k = 0; k < legs.length - 1; k++) V.push(meet(legs[k], legs[k + 1]) ?? [legs[k + 1].px, legs[k + 1].pz]);
  };
  const ok = (f: Fillet | null, A: Leg, B: Leg) =>
    !!f &&
    arcPoints(f).every(([x, z]) => {
      const off = Math.min(Math.abs((x - A.px) * -A.dz + (z - A.pz) * A.dx), Math.abs((x - B.px) * -B.dz + (z - B.pz) * B.dx));
      return fits(x, z, (x - f.cx) / f.r, (z - f.cz) / f.r, off);
    });
  // the corners; a turn's line that comes out backward (too few tiles to make a line) dropped
  for (let it = 0; it < 8; it++) {
    corners();
    const bad = legs.findIndex((L, k) => {
      const s = k ? V[k - 1] : P[0], e = k < legs.length - 1 ? V[k] : P.at(-1)!;
      return !L.straight && (e[0] - s[0]) * L.dx + (e[1] - s[1]) * L.dz < -1;
    });
    if (bad < 0) break;
    legs = legs.filter((_, k) => k !== bad);
  }
  // a turn between two straights as one circle where it can: tangent to both, through the middle of the turn's tiles
  // (its line), a little smaller if the tiles or a bridge say (a staircase between a straight down and a straight
  // left: a quarter circle); else (a long staircase) an arc at each end of its line
  const want = new Map<Leg, number>();
  for (let k = 1; k < legs.length - 1; k++) {
    const A = legs[k - 1], D = legs[k], B = legs[k + 1], C = meet(A, B);
    if (D.straight || !A.straight || !B.straight || !C) continue;
    const d = Math.acos(Math.max(-1, Math.min(1, A.dx * B.dx + A.dz * B.dz)));
    const R0 = Math.abs((C[0] - D.px) * -D.dz + (C[1] - D.pz) * D.dx) / (1 / Math.cos(d / 2) - 1);
    for (let r = R0; r >= R0 * 0.75; r *= 0.96)
      if (ok(fillet(C, A, B, r * Math.tan(d / 2)), A, B)) {
        want.set(A, r * Math.tan(d / 2));
        legs.splice(k--, 1);
        break;
      }
  }
  corners();
  const m = legs.length;
  const len = legs.map((L, k) => {
    const s = k ? V[k - 1] : P[0], e = k < m - 1 ? V[k] : P.at(-1)!;
    return Math.max(0, (e[0] - s[0]) * L.dx + (e[1] - s[1]) * L.dz);
  });
  // what a corner may take of each line: half of one between two corners, most of one to an end
  const share = (k: number) => (k > 0 && k < m - 1 ? len[k] / 2 : len[k] * 0.9);
  const fs: (Fillet | null)[] = [];
  for (let k = 0; k < m - 1; k++) {
    const A = legs[k], B = legs[k + 1];
    const d = Math.acos(Math.max(-1, Math.min(1, A.dx * B.dx + A.dz * B.dz)));
    let t = Math.min(share(k), share(k + 1));
    if (want.has(A)) t = Math.min(want.get(A)!, len[k] * (k ? 0.5 : 0.9), len[k + 1] * (k + 1 < m - 1 ? 0.5 : 0.9));
    else if (A.straight && B.straight) t = Math.min(t, R_L * Math.tan(d / 2));
    let f = fillet(V[k], A, B, t);
    // smaller until it (and its banks) stay on the river's tiles
    while (f && f.r > R_MIN && !ok(f, A, B)) {
      t *= 0.88;
      f = fillet(V[k], A, B, t);
    }
    fs.push(f);
  }
  // the line: each leg's straight piece, then its corner's arc
  const pts: V2[] = [];
  const push = (p: V2) => {
    const q = pts.at(-1);
    if (!q || Math.hypot(p[0] - q[0], p[1] - q[1]) > 0.3) pts.push(p);
  };
  for (let k = 0; k < m; k++) {
    const s = k ? (fs[k - 1]?.b ?? V[k - 1]) : P[0], e = k < m - 1 ? (fs[k]?.a ?? V[k]) : P.at(-1)!;
    const n = Math.max(1, Math.ceil(Math.hypot(e[0] - s[0], e[1] - s[1]) / EVERY));
    for (let i = 0; i <= n; i++) push([s[0] + ((e[0] - s[0]) * i) / n, s[1] + ((e[1] - s[1]) * i) / n]);
    const f = fs[k];
    if (f) for (const p of arcPoints(f)) push(p);
  }
  // the arcs; two that meet on a staircase's middle are one circle
  const arcs: StemArc[] = [];
  let prev: Fillet | null = null;
  for (const f of fs) {
    const last = arcs.at(-1);
    if (!f) prev = null;
    else if (last && prev && Math.hypot(prev.b[0] - f.a[0], prev.b[1] - f.a[1]) < 0.5 && Math.abs(prev.r - f.r) < 1 && Math.sign(prev.sweep) === Math.sign(f.sweep)) {
      last.x1 = f.b[0];
      last.z1 = f.b[1];
      last.deg += (Math.abs(f.sweep) * 180) / Math.PI;
      prev = f;
    } else {
      arcs.push({ cx: f.cx, cz: f.cz, r: f.r, x0: f.a[0], z0: f.a[1], x1: f.b[0], z1: f.b[1], deg: (Math.abs(f.sweep) * 180) / Math.PI });
      prev = f;
    }
  }
  return { pts, arcs };
}

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
    // its points, from the mouth up: past the end into the water it meets, the tiles' middles, on into its source
    const [ec, er] = path[0];
    const out0 = outlet(ec, er, mouth ? toSea : toFall) ?? outlet(ec, er, toPond)!;
    const [mx, mz] = tileMid(ec, er), past = mouth ? TILE * 1.5 : TILE * 0.5;
    const P: V2[] = [[mx + out0[0] * past, mz + out0[1] * past]];
    for (const [c, r] of path) P.push(tileMid(c, r));
    // (its source: into the water it comes from, a pond or a fall from above, else a little on)
    const [sc, sr] = path.at(-1)!, [pc, pr] = path.at(-2)!;
    const from = N4.find(([dc, dr]) => fresh(sc + dc, sr + dr) && !inComp.has(idx(sc + dc, sr + dr)));
    const [sx, sz] = tileMid(sc, sr);
    P.push(from ? [sx + from[0] * TILE * 0.5, sz + from[1] * TILE * 0.5] : [sx + (sc - pc) * TILE * 0.3, sz + (sr - pr) * TILE * 0.3]);
    // what an arc may cover: its middle on water (the river's tiles, a pond, the sea), its banks within EDGE_TOL of
    // water, clear of a bridge
    const wetNear = (x: number, z: number, tol: number) => {
      const c0 = Math.floor((x - tol - GRID.x0) / TILE), c1 = Math.floor((x + tol - GRID.x0) / TILE);
      const r0 = Math.floor((z - tol - GRID.z0) / TILE), r1 = Math.floor((z + tol - GRID.z0) / TILE);
      for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) if (fresh(c, r) || kind(c, r) === 'sea') return true;
      return false;
    };
    const fits = (x: number, z: number, nx: number, nz: number, off: number) =>
      wetNear(x, z, 1) &&
      wetNear(x + nx * HALF, z + nz * HALF, EDGE_TOL) &&
      wetNear(x - nx * HALF, z - nz * HALF, EDGE_TOL) &&
      boxes.every((b) => boxDist(b, x, z) >= TILE / 2 || off < BRIDGE_OFF);
    const { pts, arcs } = roundTurns(P, fits);
    // the breadth (broader where it meets the sea), the flow (toward the mouth), the length along
    const n = pts.length;
    const stem: Stem = {
      tiles: path.map(([c, r]) => idx(c, r)),
      x: new Float32Array(n),
      z: new Float32Array(n),
      hw: new Float32Array(n),
      fx: new Float32Array(n),
      fz: new Float32Array(n),
      s: new Float32Array(n),
      arcs
    };
    const sea = mouth ? TILE * 1.5 : 0;
    for (let i = 0; i < n; i++) {
      if (i) stem.s[i] = stem.s[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
      const a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 1)];
      const tl = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
      stem.x[i] = pts[i][0];
      stem.z[i] = pts[i][1];
      stem.hw[i] = HALF + (mouth ? Math.max(0, sea + 15 - stem.s[i]) * 0.45 : 0);
      stem.fx[i] = -(b[0] - a[0]) / tl;
      stem.fz[i] = -(b[1] - a[1]) / tl;
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
