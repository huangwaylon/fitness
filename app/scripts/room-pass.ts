// The pieces one walks through (docs/design.md "The tent"; an arch, a gate, a torii): from each room model's geometry at
// a villager's height, the half-tile cells of its footprint that make a way through it, front to back or side to side
// (items.json and more.json `pa`, the piece's own frame); every other piece's footprint blocks whole, as before. The
// walk (tent/grid.ts blocked, layout/nav.ts) goes through those cells; where a piece may be put still takes its whole
// footprint (nothing stands under an arch).
//   - only a piece taller than a villager (h ≥ HEAD), not a small thing (sm: it may stand on a table);
//   - its triangles clipped to FOOT…HEAD (a base one steps over … a villager's height: rooms/view.ts VILLAGER_H, its
//     hair's tip brushing a wedding arch's flowers) and sampled every SAMPLE units seen from above: a sample more than
//     EDGE inside a half-tile cell fills it (a post a hair over a cell's line isn't in the next cell); one within EDGE
//     of a line between two cells, in the middle of the line's length, is a wall on it (a net or a bar along the line);
//   - a way through: lines of cells (columns front to back, rows side to side) with every cell open and no wall across
//     them, in runs of WAY_MIN or more side by side with no wall between (a villager's width);
//   - OVERRIDE: what the geometry can't tell, by eye.
// room-models.ts runs it at its end (every piece it converted, and our own); alone, it finds them again from the
// models as they are (loose or packed): every floor piece, or --only=f1234,f5678.
//   npm run room-pass [-- --only=f13543,f90002]
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { modelOf, trianglesOf } from './room-own.ts';

type V3 = readonly [number, number, number];
const TILE = 10, CELL = TILE / 2;
const FOOT = 1, HEAD = 15;
const EDGE = 0.4, SAMPLE = 0.25, WAY_MIN = 2;

/** A footprint seen at walking height: [i across][j deep] over its 2w × 2d half tiles (its middle at 0, its back −z):
 *  each cell open or filled, and the walls on the lines between cells, its edges' too (`zw[i][j]`, j 0…2d: on the
 *  line in front of row j, in column i; `xw[i][j]`, i 0…2w: on the line left of column i, in row j). */
export interface Cells {
  open: boolean[][];
  zw: boolean[][];
  xw: boolean[][];
}

export function cellsOf(tris: readonly (readonly [V3, V3, V3])[], w: number, d: number): Cells {
  const nx = w * 2, nz = d * 2, X0 = -w * CELL, Z0 = -d * CELL, e = EDGE / CELL;
  const grid = (a: number, b: number, v: boolean) => Array.from({ length: a }, () => Array<boolean>(b).fill(v));
  const c: Cells = { open: grid(nx, nz, true), zw: grid(nx, nz + 1, false), xw: grid(nx + 1, nz, false) };
  const mark = (x: number, z: number) => {
    const fx = (x - X0) / CELL, fz = (z - Z0) / CELL;
    if (fx < -e || fz < -e || fx > nx + e || fz > nz + e) return;
    const i = Math.min(nx - 1, Math.max(0, Math.floor(fx))), j = Math.min(nz - 1, Math.max(0, Math.floor(fz)));
    const inX = fx - i >= e && i + 1 - fx >= e, inZ = fz - j >= e && j + 1 - fz >= e;
    if (inX && inZ) return void (c.open[i][j] = false);
    // on a line (between two cells, or the footprint's edge), along its length's middle: a wall on it
    if (inX && !inZ) c.zw[i][Math.round(fz)] = true;
    else if (inZ && !inX) c.xw[Math.round(fx)][j] = true;
  };
  for (const t of tris) {
    const poly = clipY(t, FOOT, HEAD);
    // the clipped polygon as a fan, each triangle sampled every SAMPLE units (its corners and edges too)
    for (let k = 1; k + 1 < poly.length; k++) {
      const a = poly[0], b = poly[k], q = poly[k + 1];
      const n = Math.max(1, Math.ceil(Math.max(dist(a, b), dist(b, q), dist(a, q)) / SAMPLE));
      for (let u = 0; u <= n; u++) for (let v = 0; u + v <= n; v++) {
        const s = u / n, r = v / n, o = 1 - s - r;
        mark(a[0] * o + b[0] * s + q[0] * r, a[2] * o + b[2] * s + q[2] * r);
      }
    }
  }
  return c;
}
const dist = (a: V3, b: V3) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
/** A triangle clipped to lo ≤ y ≤ hi (Sutherland–Hodgman on the two planes). */
function clipY(t: readonly V3[], lo: number, hi: number): V3[] {
  const cut = (poly: readonly V3[], inside: (p: V3) => boolean, y: number): V3[] => {
    const out: V3[] = [];
    for (let k = 0; k < poly.length; k++) {
      const p = poly[k], q = poly[(k + 1) % poly.length], pi = inside(p), qi = inside(q);
      if (pi) out.push(p);
      if (pi !== qi) {
        const s = (y - p[1]) / (q[1] - p[1]);
        out.push([p[0] + (q[0] - p[0]) * s, y, p[2] + (q[2] - p[2]) * s]);
      }
    }
    return out;
  };
  return cut(cut(t, (p) => p[1] >= lo, lo), (p) => p[1] <= hi, hi);
}

/** The cells that make a way through ([i, j], the piece's own frame), or null: none (the footprint blocks whole, as a
 *  piece with no filled cell at all: flat, or floating over the floor, is no arch). */
export function passOf({ open, zw, xw }: Cells): [number, number][] | null {
  const nx = open.length, nz = open[0]?.length ?? 0;
  if (open.every((col) => col.every(Boolean))) return null;
  /** Lines `a` of `n`, `len` cells long: those clear all along (`clear`: its cell b, and the wall in front of it, the
   *  line past the last one's too), in runs of WAY_MIN with no wall between neighbours. */
  const way = (n: number, len: number, clear: (a: number, b: number) => boolean, between: (a: number, b: number) => boolean): Set<number> => {
    const through = Array.from({ length: n }, (_, a) => Array.from({ length: len + 1 }, (_, b) => clear(a, b)).every(Boolean));
    const keep = new Set<number>();
    for (let a = 0; a < n; ) {
      let b = a + 1;
      if (through[a]) while (b < n && through[b] && Array.from({ length: len }, (_, k) => !between(b, k)).every(Boolean)) b++;
      if (through[a] && b - a >= WAY_MIN) for (let k = a; k < b; k++) keep.add(k);
      a = b;
    }
    return keep;
  };
  const cols = way(nx, nz, (i, j) => (j === nz || open[i][j]) && !zw[i][j], (i, j) => xw[i][j]);
  const rows = way(nz, nx, (j, i) => (i === nx || open[i][j]) && !xw[i][j], (j, i) => zw[i][j]);
  if (!cols.size && !rows.size) return null;
  const out: [number, number][] = [];
  for (let i = 0; i < nx; i++) for (let j = 0; j < nz; j++) if (cols.has(i) || rows.has(j)) out.push([i, j]);
  return out;
}

type Meta = Record<string, unknown> & { w: number; d: number; h: number; rug?: 1; wl?: 1; cl?: 1; sm?: 1; pa?: [number, number][] };
/** A piece's way through by eye, over its model's (null: blocks whole): none yet, every arch's geometry tells. */
const OVERRIDE: Record<string, [number, number][] | null> = {};
const TENT = join(import.meta.dirname, '..', 'src', 'lib', 'components', 'tent');
const FILES = [join(TENT, 'items.json'), join(TENT, 'more.json')];

/** A piece's way through from its model (null: its footprint blocks whole). */
async function passOfModel(glb: Buffer, m: Pick<Meta, 'w' | 'd' | 'h' | 'sm'>): Promise<[number, number][] | null> {
  if (m.h < HEAD || m.sm) return null;
  return passOf(cellsOf(await trianglesOf(glb), m.w, m.d));
}

/** Each floor piece's way through (`codes`: just these) into items.json and more.json; the pieces that have one. */
export async function roomPass(codes?: readonly string[]): Promise<string[]> {
  const found: string[] = [];
  for (const f of FILES) {
    if (!existsSync(f)) continue;
    const json = JSON.parse(readFileSync(f, 'utf8')) as { items: Record<string, Meta> } & Record<string, unknown>;
    for (const [code, m] of Object.entries(json.items)) {
      if ((codes && !codes.includes(code)) || m.rug || m.wl || m.cl) continue;
      const { pa: _pa, ...rest } = m;
      let pa: [number, number][] | null = null;
      try {
        pa = code in OVERRIDE ? OVERRIDE[code] : await passOfModel(modelOf(code), m);
      } catch {
        // (a model not converted yet: its footprint blocks whole)
      }
      json.items[code] = pa ? { ...rest, pa } : rest;
      if (pa) found.push(code);
    }
    writeTable(f, json);
  }
  return found;
}
/** A table as the room's JSON files are written (scripts/room-models.ts writeJson): one entry a line in its objects. */
function writeTable(f: string, json: Record<string, unknown>): void {
  const block = (k: string, v: unknown) => ['items', 'tex', 'icons'].includes(k) && v && typeof v === 'object'
    ? `  ${JSON.stringify(k)}: {\n${Object.entries(v as Record<string, unknown>).map(([c, m]) => `    ${JSON.stringify(c)}: ${JSON.stringify(m)}`).join(',\n')}\n  }`
    : `  ${JSON.stringify(k)}: ${JSON.stringify(v)}`;
  writeFileSync(f, `{\n${Object.entries(json).map(([k, v]) => block(k, v)).join(',\n')}\n}\n`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const only = process.argv.find((a) => a.startsWith('--only='))?.slice(7).split(',').filter(Boolean);
  const found = await roomPass(only?.length ? only : undefined);
  console.log(`a way through: ${found.length} pieces\n${found.join(' ')}`);
}
