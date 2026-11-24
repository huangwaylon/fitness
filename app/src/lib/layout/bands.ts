// The ground's bands as arrays (world3d/terrain.ts draws them): a band is one row of chunks across the island
// (mesh.ts chunkMesh), joined into one top, one set of walls, of falls and of water, the top with its uvs (its bake's
// texture) and its normals. Built where the fields are (the fields' worker, fields.worker.ts, and kept with them for
// the next launch: fieldsCache.ts) or here when that isn't had, and kept page-wide for one layout (meshKeyOf: its tiles,
// pieces and homes): the launch's ground, and a mount back from a room, take them instead of building every chunk,
// joining them and working out the top's normals (~25 ms of the island's mount at 4x CPU, Chromium, 11-24). Also the
// fields' rasters as the ground's two textures take them (sdfBytes), made with them. No three.js here (the worker's).
import { CHUNK, CHUNKS_X, CHUNKS_Z, GRID, TILE } from './grid.ts';
import { chunkMesh, meshKeyOf, openSeaRow, type Part, type WallPart, type WaterPart } from './mesh.ts';
import { FAR, STEP, type Fields } from './fields.ts';
import type { Layout } from './model.ts';

/** A band's built ground: its top with its uvs and normals, its walls, falls and water; null for open sea. */
export interface BandArrays { top: Part & { uv: Float32Array; normal: Float32Array }; walls: WallPart; falls: WallPart; water: WaterPart }
/** The fields' rasters as the ground's textures take them: RGBA bytes, sdfA the first four channels, sdfB the next three. */
export interface SdfBytes { a: Uint8Array<ArrayBuffer>; b: Uint8Array<ArrayBuffer> }

const GW = GRID.cols * TILE, FW = GW / STEP;
/** A band's depth (u): a chunk's rows. */
export const BAND_D = CHUNK * TILE;

/** Parts joined into one (their indices offset). */
function join<P extends Part>(parts: P[], extra: (keyof P)[]): P {
  const cat = (arrs: ArrayLike<number>[], T: Float32ArrayConstructor | Uint32ArrayConstructor) => {
    const out = new T(arrs.reduce((n, a) => n + a.length, 0));
    let o = 0;
    for (const a of arrs) {
      out.set(a, o);
      o += a.length;
    }
    return out;
  };
  let base = 0;
  const idx = parts.map((p) => {
    const shifted = new Uint32Array(p.index.length);
    for (let k = 0; k < p.index.length; k++) shifted[k] = p.index[k] + base;
    base += p.pos.length / 3;
    return shifted;
  });
  const r: Record<string, unknown> = { pos: cat(parts.map((p) => p.pos), Float32Array), index: cat(idx, Uint32Array) };
  for (const k of extra) r[k as string] = cat(parts.map((p) => p[k] as unknown as Float32Array), Float32Array);
  return r as unknown as P;
}

/** An indexed mesh's vertex normals as three's BufferGeometry.computeVertexNormals makes them (r170: each face's
 *  (c − b) × (a − b) added to its corners, summed in the Float32 attribute, then each normalised), the same numbers. */
export function vertexNormals(pos: Float32Array, index: Uint32Array): Float32Array {
  const n = new Float32Array(pos.length);
  for (let i = 0; i < index.length; i += 3) {
    const a = index[i] * 3, b = index[i + 1] * 3, c = index[i + 2] * 3;
    const bx = pos[b], by = pos[b + 1], bz = pos[b + 2];
    const cbx = pos[c] - bx, cby = pos[c + 1] - by, cbz = pos[c + 2] - bz;
    const abx = pos[a] - bx, aby = pos[a + 1] - by, abz = pos[a + 2] - bz;
    const x = cby * abz - cbz * aby, y = cbz * abx - cbx * abz, z = cbx * aby - cby * abx;
    for (const v of [a, b, c]) (n[v] += x), (n[v + 1] += y), (n[v + 2] += z);
  }
  for (let v = 0; v < n.length; v += 3) {
    // (three's Vector3 normalize: × 1 / length)
    const x = n[v], y = n[v + 1], z = n[v + 2], s = 1 / (Math.sqrt(x * x + y * y + z * z) || 1);
    (n[v] = x * s), (n[v + 1] = y * s), (n[v + 2] = z * s);
  }
  return n;
}

/** Band `row`'s arrays built now (null: open sea). */
export function buildBand(layout: Layout, row: number): BandArrays | null {
  if (openSeaRow(layout.codes, row)) return null;
  const ms = Array.from({ length: CHUNKS_X }, (_, cx) => chunkMesh(layout, row * CHUNKS_X + cx));
  const top = join(ms.map((m) => m.top), []), z0 = GRID.z0 + row * BAND_D;
  const n = top.pos.length / 3, uv = new Float32Array(n * 2);
  for (let k = 0; k < n; k++) (uv[k * 2] = (top.pos[k * 3] - GRID.x0) / GW), (uv[k * 2 + 1] = (-top.pos[k * 3 + 2] - z0) / BAND_D);
  return {
    top: { ...top, uv, normal: vertexNormals(top.pos, top.index) },
    walls: join(ms.map((m) => m.walls), ['nrm', 'uv']),
    falls: join(ms.map((m) => m.falls), ['nrm', 'uv']),
    water: join(ms.map((m) => m.water), ['flow', 'path'])
  };
}

/** Every band's arrays (the worker's: its answer and the cache's). */
export const buildBands = (layout: Layout): (BandArrays | null)[] => Array.from({ length: CHUNKS_Z }, (_, row) => buildBand(layout, row));

/** The bands kept page-wide for one layout (another layout's build, an editor stroke's, a もようがえ, replaces the set). */
let kept: { key: string; rows: (BandArrays | null | undefined)[] } | null = null;

/** Band `row`'s arrays for `layout`: kept (adopted from the worker or the cache, or built on an earlier mount), else
 *  built now and kept. */
export function bandOf(layout: Layout, row: number): BandArrays | null {
  const key = meshKeyOf(layout);
  if (kept?.key !== key) kept = { key, rows: [] };
  const had = kept.rows[row];
  return had !== undefined ? had : (kept.rows[row] = buildBand(layout, row));
}
/** The bands built elsewhere (the worker, the cache) taken for `layout` (all CHUNKS_Z of them, in order). */
export function adoptBands(layout: Layout, rows: (BandArrays | null)[]): void {
  if (rows.length === CHUNKS_Z) kept = { key: meshKeyOf(layout), rows: rows.slice() };
}
/** The kept set's size (bytes: the tests'). */
export const keptBytes = (): number =>
  (kept?.rows ?? []).reduce((n, b) => n + (b ? [b.top, b.walls, b.falls, b.water].reduce((m, p) => m + Object.values(p).reduce((k, a: ArrayLike<number> & { byteLength: number }) => k + a.byteLength, 0), 0) : 0), 0);
/** Tests: forget the kept set. */
export const forgetBands = (): void => void (kept = null);

/** The fields' rasters as bytes, once a set of fields page-wide (the textures' own data, never written to). */
const sdfs = new WeakMap<Fields, SdfBytes>();
/** `f`'s rasters as the ground's textures take them (made with the fields in the worker, else here, once). */
export function sdfBytes(f: Pick<Fields, 'h' | 'ch'>): SdfBytes {
  let e = sdfs.get(f as Fields);
  if (e) return e;
  const a = new Uint8Array(FW * f.h * 4), b = new Uint8Array(FW * f.h * 4);
  const enc = (d: number) => Math.max(0, Math.min(255, Math.round((d / FAR) * 127.5 + 127.5)));
  for (let i = 0; i < FW * f.h; i++) {
    for (let k = 0; k < 4; k++) a[i * 4 + k] = enc(f.ch[k][i]);
    for (let k = 0; k < 3; k++) b[i * 4 + k] = enc(f.ch[4 + k][i]);
    b[i * 4 + 3] = 255;
  }
  sdfs.set(f as Fields, (e = { a, b }));
  return e;
}
/** `f`'s rasters made elsewhere (the worker, the cache) taken (their size checked: else made here when asked). */
export function adoptSdf(f: Fields, e: SdfBytes): void {
  if (e.a.length === FW * f.h * 4 && e.b.length === FW * f.h * 4) sdfs.set(f, e);
}
