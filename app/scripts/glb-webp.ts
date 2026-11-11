// The island's models without their WebPs (scripts/world3d-ktx2.ts): a GLB's embedded images are only its fallback once
// their KTX2s exist (world3d/ktx2.ts draws those), so they go to the model's WebP pack (static/room/tex/<id>.webpp,
// ktx2Pack.ts's container, by hash) and the GLB keeps each image's hash (`extras.tex`, texHash.ts glbTextures); the
// page reads a WebP out of the pack only when it draws no KTX2. `unstrip` puts them back, for the tools that load a
// model with three's own GLTFLoader (scripts/world3d-sheet.ts, seat-anchors.ts). A model's `v` and `kb` in its
// manifest stay its converter's (the GLB as converted: villager3d.test compares them so).
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { entries, packId } from '../src/lib/components/world3d/ktx2Pack.ts';
import { glbTextures, type GlbImage } from '../src/lib/components/world3d/texHash.ts';

type View = { buffer: number; byteOffset?: number; byteLength: number; extensions?: { EXT_meshopt_compression?: { buffer: number; byteOffset?: number; byteLength: number } } };
type Gltf = { buffers: { byteLength: number; uri?: string }[]; bufferViews: View[]; images?: GlbImage[] } & Record<string, unknown>;

function read(b: Uint8Array): { j: Gltf; bin: Uint8Array } {
  const dv = new DataView(b.buffer, b.byteOffset, b.byteLength);
  if (dv.getUint32(0, true) !== 0x46546c67 || dv.getUint32(16, true) !== 0x4e4f534a) throw new Error('glb-webp: not a GLB');
  const jl = dv.getUint32(12, true);
  const j = JSON.parse(new TextDecoder().decode(b.subarray(20, 20 + jl))) as Gltf;
  const bl = 28 + jl <= b.length ? dv.getUint32(20 + jl, true) : 0;
  return { j, bin: b.subarray(28 + jl, 28 + jl + bl) };
}
function write(j: Gltf, bin: Uint8Array): Uint8Array {
  const pad = (n: number) => (4 - (n % 4)) % 4;
  let js = new TextEncoder().encode(JSON.stringify(j));
  js = new Uint8Array([...js, ...new Array(pad(js.length)).fill(0x20)]);
  const bl = bin.length + pad(bin.length);
  const out = new Uint8Array(12 + 8 + js.length + 8 + bl), dv = new DataView(out.buffer);
  dv.setUint32(0, 0x46546c67, true);
  dv.setUint32(4, 2, true);
  dv.setUint32(8, out.length, true);
  dv.setUint32(12, js.length, true);
  dv.setUint32(16, 0x4e4f534a, true);
  out.set(js, 20);
  dv.setUint32(20 + js.length, bl, true);
  dv.setUint32(24 + js.length, 0x004e4942, true);
  out.set(bin, 28 + js.length);
  return out;
}
/** The GLB's own buffer (the one without a uri: its BIN chunk). */
const own = (j: Gltf) => j.buffers.findIndex((x) => x.uri === undefined);
/** Every `bufferView` index in the JSON (accessors, sparse, images, extensions), renumbered by `f`. */
function renumber(x: unknown, f: (i: number) => number): void {
  if (Array.isArray(x)) for (const y of x) renumber(y, f);
  else if (x && typeof x === 'object') for (const [k, v] of Object.entries(x)) {
    if (k === 'bufferView' && typeof v === 'number') (x as Record<string, number>)[k] = f(v);
    else renumber(v, f);
  }
}

/** `glb` without its embedded images' bytes (`hashes`: each image's, in order, kept as `extras.tex`); null when it has
 *  none to strip. The other bytes keep their order, each range 4-aligned. */
export function strip(glb: Uint8Array, hashes: string[]): Uint8Array | null {
  const { j, bin } = read(glb);
  const ims = j.images ?? [];
  if (!ims.some((im) => im.bufferView !== undefined)) return null;
  if (hashes.length !== ims.length) throw new Error('glb-webp: a hash for each image');
  const b0 = own(j), gone = new Set(ims.flatMap((im) => (im.bufferView === undefined ? [] : [im.bufferView])));
  // the ranges of the BIN chunk in use, but the images': the views', and meshopt's compressed data
  const ranges: { off: number; len: number; set: (o: number) => void }[] = [];
  j.bufferViews.forEach((v, i) => {
    if (v.buffer === b0 && !gone.has(i)) ranges.push({ off: v.byteOffset ?? 0, len: v.byteLength, set: (o) => (v.byteOffset = o) });
    const m = v.extensions?.EXT_meshopt_compression;
    if (m && m.buffer === b0) ranges.push({ off: m.byteOffset ?? 0, len: m.byteLength, set: (o) => (m.byteOffset = o) });
  });
  ranges.sort((a, b) => a.off - b.off);
  const out = new Uint8Array(bin.length);
  let at = 0;
  const moved = new Map<number, number>();
  for (const r of ranges) {
    let o = moved.get(r.off);
    if (o === undefined) {
      at = (at + 3) & ~3;
      o = at;
      out.set(bin.subarray(r.off, r.off + r.len), o);
      moved.set(r.off, o);
      at = o + r.len;
    } else at = Math.max(at, o + r.len);
    r.set(o);
  }
  const index = new Map<number, number>();
  let n = 0;
  j.bufferViews.forEach((_, i) => gone.has(i) || index.set(i, n++));
  j.bufferViews = j.bufferViews.filter((_, i) => !gone.has(i));
  ims.forEach((im, i) => {
    delete im.bufferView;
    im.extras = { ...im.extras, tex: hashes[i] };
  });
  renumber(j, (i) => index.get(i)!);
  const body = out.subarray(0, at);
  j.buffers[b0].byteLength = body.length;
  return write(j, body);
}

/** A GLB as served to a tool's page (three's own GLTFLoader): an island model's WebPs back in from its WebP pack
 *  (`tex`: static/room/tex/). */
export function withWebps(glb: Uint8Array, tex: string): Uint8Array {
  const ts = glbTextures(glb);
  if (!ts.some((t) => !t.webp)) return glb;
  const pak = new Uint8Array(readFileSync(join(tex, `${packId(ts.map((t) => t.hash))}.webpp`))), es = entries(pak);
  return unstrip(glb, (h) => {
    const at = es?.get(h);
    return at && pak.subarray(at[0], at[0] + at[1]);
  });
}

/** `glb` with its stripped images' WebPs back in (`webp`: by hash), each a new view at the BIN chunk's end. */
export function unstrip(glb: Uint8Array, webp: (hash: string) => Uint8Array | undefined): Uint8Array {
  const { j, bin } = read(glb);
  const ims = j.images ?? [];
  if (!ims.some((im) => im.extras?.tex && im.bufferView === undefined)) return glb;
  const b0 = own(j), parts: Uint8Array[] = [bin];
  let at = bin.length;
  for (const im of ims) {
    const h = im.extras?.tex;
    if (!h || im.bufferView !== undefined) continue;
    const w = webp(h);
    if (!w) throw new Error(`glb-webp: no WebP for ${h}`);
    const o = (at + 3) & ~3;
    parts.push(new Uint8Array(o - at), w);
    j.bufferViews.push({ buffer: b0, byteOffset: o, byteLength: w.length });
    im.bufferView = j.bufferViews.length - 1;
    at = o + w.length;
  }
  const body = new Uint8Array(at);
  let p = 0;
  for (const x of parts) body.set(x, p), (p += x.length);
  j.buffers[b0].byteLength = body.length;
  return write(j, body);
}
