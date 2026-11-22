// Our own room pieces (docs/world3d-assets.md "Our own pieces"): NH's piece with a picture or a digit of ours, a loose
// model in static/room/models/ and its icon in static/room/icons/, in items.json with the base's footprint and flags,
// their names in i18n/tent.*.json and their HHA in hha.json. The wedding sign (the user, 2026-11-22): NH's birthday sign
// whose banner reads HAPPY WEDDING♥ (the letters painted by scripts/room-own-letters.py into design/room/<code>.png, the
// albedo, and <code>-icon.png). The 2026 and 2027 arches (the same day): NH's 2021 celebratory arch, its 1 a 6 or a 7
// (NH's digits are shapes in the mesh: the new one's mesh design/room/<code>.json and its icon by
// scripts/room-own-digits.py). room-models.ts runs this at its end (its rewrite of items.json, the names and the HHA
// would drop them); alone, it builds them again from the base's model as packed.
//   node scripts/room-own.ts           the models, icons and entries
//   node scripts/room-own.ts --base    each base's albedo and icon as PNGs into /tmp/room-own/ (the painters' input)
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';

const APP = join(import.meta.dirname, '..');
const TENT = join(APP, 'src', 'lib', 'components', 'tent');
const STATIC = join(APP, 'static', 'room');
const DESIGN = join(APP, 'design', 'room');

interface Own {
  code: string;
  /** NH's piece it's made from. */
  base: string;
  ja: string;
  en: string;
  /** Its HHA over the base's (its series: it goes with that set). */
  hha?: { s?: string };
  /** A digit of ours in place of one of the base's: that digit's patch of the albedo (texels of 256: x0, y0, x1, y1;
   *  NH's digits are shapes in the mesh, each UV-mapped onto its own colour's patch), the new one design/room/<code>.json
   *  (scripts/room-own-digits.py). The picture stays the base's. */
  digit?: readonly [number, number, number, number];
}
/** Our own pieces: codes past NH's ids (its highest ~16,000). */
const OWN: readonly Own[] = [
  { code: 'f90001', base: 'f3594', ja: 'ハッピーウェディングボード', en: 'happy wedding sign', hha: { s: 'wedding' } },
  // (the 2021 arch's 1, green, a 6 and a 7: the user, 2026-11-22)
  { code: 'f90002', base: 'f13543', ja: '2026ねんのアーチ', en: '2026 celebratory arch', digit: [165, 0, 194, 128] },
  { code: 'f90003', base: 'f13543', ja: '2027ねんのアーチ', en: '2027 celebratory arch', digit: [165, 0, 194, 128] }
];

type Meta = Record<string, unknown> & { pk?: [string, number, number]; icon?: 1 | string };
const readJson = <T>(f: string): T => JSON.parse(readFileSync(f, 'utf8')) as T;

/** A piece's model: its loose file, or its cut of its pack. */
function modelOf(code: string): Buffer {
  const items = readJson<{ items: Record<string, Meta> }>(join(TENT, 'items.json')).items, more = readJson<{ items: Record<string, Meta> }>(join(TENT, 'more.json')).items;
  const m = items[code] ?? more[code];
  if (!m) throw new Error(`room-own: no piece ${code}`);
  if (!m.pk) return readFileSync(join(STATIC, 'models', `${code}.glb`));
  const [stem, off, n] = m.pk;
  return readFileSync(join(STATIC, 'pack', `${stem}.pak`)).subarray(off, off + n);
}

interface Gltf {
  images: { bufferView: number; mimeType: string }[];
  bufferViews: { buffer: number; byteOffset?: number; byteLength: number; byteStride?: number; extensions?: { EXT_meshopt_compression?: { buffer: number; byteOffset?: number; byteLength: number; byteStride: number; count: number; mode: string; filter?: string } } }[];
  buffers: { byteLength: number }[];
  accessors: { bufferView: number; byteOffset?: number; componentType: number; count: number; type: string; normalized?: boolean }[];
  meshes: { primitives: { attributes: Record<string, number>; indices: number; material: number }[] }[];
  nodes: { mesh?: number; translation?: number[]; rotation?: number[]; scale?: number[] }[];
  materials: { pbrMetallicRoughness?: { baseColorTexture?: { index: number; extensions?: { KHR_texture_transform?: { offset?: number[]; scale?: number[] } } } } }[];
  samplers?: unknown[];
}
const pad4 = (n: number) => (n + 3) & ~3;
function parse(glb: Buffer): { j: Gltf; bin: Buffer } {
  const jl = glb.readUInt32LE(12);
  const j = JSON.parse(glb.subarray(20, 20 + jl).toString()) as Gltf;
  const bl = glb.readUInt32LE(20 + jl);
  return { j, bin: glb.subarray(28 + jl, 28 + jl + bl) };
}
/** A GLB's one picture (gltfpack's: its WebP in the binary chunk). */
function pictureOf(glb: Buffer): Buffer {
  const { j, bin } = parse(glb);
  if (j.images.length !== 1) throw new Error(`room-own: ${j.images.length} pictures`);
  const v = j.bufferViews[j.images[0].bufferView];
  return bin.subarray(v.byteOffset ?? 0, (v.byteOffset ?? 0) + v.byteLength);
}
/** The GLB with its one picture swapped: the binary chunk laid out again, each range in it (a view, a meshopt view's
 *  compressed bytes) moved along. */
function withPicture(glb: Buffer, webp: Buffer): Buffer {
  const { j, bin } = parse(glb);
  const pic = j.images[0].bufferView;
  type Range = { off: number; len: number; set: (o: number) => void; bytes: Buffer };
  const ranges: Range[] = [];
  j.bufferViews.forEach((v, i) => {
    if (v.buffer === 0) ranges.push({ off: v.byteOffset ?? 0, len: v.byteLength, set: (o) => ((v.byteOffset = o), i === pic && (v.byteLength = webp.length)), bytes: i === pic ? webp : Buffer.alloc(0) });
    const mo = v.extensions?.EXT_meshopt_compression;
    if (mo?.buffer === 0) ranges.push({ off: mo.byteOffset ?? 0, len: mo.byteLength, set: (o) => (mo.byteOffset = o), bytes: Buffer.alloc(0) });
  });
  ranges.sort((a, b) => a.off - b.off);
  const parts: Buffer[] = [];
  let at = 0;
  for (const r of ranges) {
    const bytes = r.bytes.length ? r.bytes : bin.subarray(r.off, r.off + r.len);
    r.set(at);
    parts.push(bytes, Buffer.alloc(pad4(bytes.length) - bytes.length));
    at += pad4(bytes.length);
  }
  const newBin = Buffer.concat(parts);
  j.buffers[0].byteLength = newBin.length;
  let json = Buffer.from(JSON.stringify(j));
  json = Buffer.concat([json, Buffer.alloc(pad4(json.length) - json.length, 0x20)]);
  const head = Buffer.alloc(12), jh = Buffer.alloc(8), bh = Buffer.alloc(8);
  head.writeUInt32LE(0x46546c67, 0), head.writeUInt32LE(2, 4), head.writeUInt32LE(12 + 8 + json.length + 8 + newBin.length, 8);
  jh.writeUInt32LE(json.length, 0), jh.writeUInt32LE(0x4e4f534a, 4);
  bh.writeUInt32LE(newBin.length, 0), bh.writeUInt32LE(0x004e4942, 4);
  return Buffer.concat([head, jh, json, bh, newBin]);
}

type V3 = [number, number, number];
/** A meshopt-compressed, quantised GLB's one mesh (gltfpack's: one node, one primitive) as plain numbers: its positions
 *  (the node's scale and offset applied), normals, UVs (the texture transform applied: 0–1 over the picture), triangles. */
async function meshOf(glb: Buffer): Promise<{ pos: V3[]; nor: V3[]; uv: [number, number][]; tri: number[] }> {
  await MeshoptDecoder.ready;
  const { j, bin } = parse(glb);
  const view = (i: number): Buffer => {
    const v = j.bufferViews[i], m = v.extensions?.EXT_meshopt_compression;
    if (!m) return bin.subarray(v.byteOffset ?? 0, (v.byteOffset ?? 0) + v.byteLength);
    const out = new Uint8Array(m.count * m.byteStride);
    MeshoptDecoder.decodeGltfBuffer(out, m.count, m.byteStride, bin.subarray(m.byteOffset ?? 0, (m.byteOffset ?? 0) + m.byteLength), m.mode, m.filter);
    return Buffer.from(out);
  };
  const SIZE: Record<number, number> = { 5120: 1, 5121: 1, 5122: 2, 5123: 2, 5125: 4, 5126: 4 };
  const read = (i: number): number[][] => {
    const a = j.accessors[i], b = view(a.bufferView), n = ({ SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4 } as Record<string, number>)[a.type], sz = SIZE[a.componentType];
    const stride = j.bufferViews[a.bufferView].byteStride ?? n * sz, t = a.componentType;
    const one = (o: number): number => {
      const x = t === 5126 ? b.readFloatLE(o) : t === 5125 ? b.readUInt32LE(o) : t === 5123 ? b.readUInt16LE(o) : t === 5122 ? b.readInt16LE(o) : t === 5121 ? b.readUInt8(o) : b.readInt8(o);
      if (!a.normalized) return x;
      return t === 5120 ? Math.max(x / 127, -1) : t === 5122 ? Math.max(x / 32767, -1) : t === 5121 ? x / 255 : x / 65535;
    };
    return Array.from({ length: a.count }, (_, k) => Array.from({ length: n }, (_, c) => one((a.byteOffset ?? 0) + k * stride + c * sz)));
  };
  if (j.meshes.length !== 1 || j.meshes[0].primitives.length !== 1 || j.nodes.length !== 1 || j.nodes[0].rotation) throw new Error('room-own: not one plain mesh');
  const p = j.meshes[0].primitives[0], node = j.nodes[0], s = node.scale ?? [1, 1, 1], o = node.translation ?? [0, 0, 0];
  const tt = j.materials[p.material].pbrMetallicRoughness?.baseColorTexture?.extensions?.KHR_texture_transform, ts = tt?.scale ?? [1, 1], to = tt?.offset ?? [0, 0];
  return {
    pos: read(p.attributes.POSITION).map((q) => q.map((x, c) => x * s[c] + o[c]) as V3),
    nor: read(p.attributes.NORMAL).map((q) => q as V3),
    uv: read(p.attributes.TEXCOORD_0).map(([u, v]) => [u * ts[0] + to[0], v * ts[1] + to[1]]),
    tri: read(p.indices).map((r) => r[0])
  };
}

const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const dot = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const unit = (a: V3): V3 => {
  const l = Math.hypot(...a) || 1;
  return [a[0] / l, a[1] / l, a[2] / l];
};
/** Least squares: the x minimising |Ax − b| (its normal equations, by elimination). */
function lsq(A: number[][], b: number[]): number[] {
  const n = A[0].length, M = Array.from({ length: n }, () => new Array<number>(n + 1).fill(0));
  A.forEach((r, i) => {
    for (let a = 0; a < n; a++) {
      for (let c = 0; c < n; c++) M[a][c] += r[a] * r[c];
      M[a][n] += r[a] * b[i];
    }
  });
  for (let i = 0; i < n; i++) for (let r = 0; r < n; r++) if (r !== i) {
    const f = M[r][i] / M[i][i];
    for (let c = i; c <= n; c++) M[r][c] -= f * M[i][c];
  }
  return M.map((r, i) => r[n] / r[i]);
}

const GLTFPACK = join(dirname(createRequire(import.meta.url).resolve('gltfpack/package.json')), 'cli.js');
/** The base with one of its digits made another: the old one's triangles (their UVs in `box`) dropped, the new one
 *  (design/room/<code>.json: in its own plane, x right, y up, z out of the front, centred) set in the old one's plane,
 *  centred where it was, every vertex on the old one's colour; smooth normals; packed again as room-models packs
 *  (gltfpack -cc), the picture as it was. */
async function withDigit(glb: Buffer, box: readonly number[], digit: { pos: V3[]; tris: number[][] }): Promise<Buffer> {
  const m = await meshOf(glb), { j } = parse(glb);
  const inBox = (i: number) => {
    const [u, v] = m.uv[i].map((x) => x * 256);
    return u >= box[0] && u < box[2] && v >= box[1] && v < box[3];
  };
  const old = m.pos.map((_, i) => i).filter(inBox);
  if (!old.length) throw new Error('room-own: no digit in the box');
  // the old digit's plane: its UVs (its shape, drawn on its colour's patch) fitted to its rim (the outline, where front
  // and back meet: each UV there used twice) by least squares, position = O + u U + v V
  const key = (i: number) => m.uv[i].join(), uses = new Map<string, number>();
  for (const i of old) uses.set(key(i), (uses.get(key(i)) ?? 0) + 1);
  const rim = old.filter((i) => uses.get(key(i)) === 2);
  const fit = [0, 1, 2].map((c) => lsq(rim.map((i) => [1, m.uv[i][0], m.uv[i][1]]), rim.map((i) => m.pos[i][c])));
  const O = fit.map((f) => f[0]) as V3, U = unit(fit.map((f) => f[1]) as V3), N0 = unit(cross(U, fit.map((f) => f[2]) as V3));
  // (UV v may run down the digit: up is the plane's way nearest the world's, the front the side the old one bulged to)
  const V0 = cross(N0, U), up: V3 = dot(V0, [0, 1, 0]) < 0 ? [-V0[0], -V0[1], -V0[2]] : V0;
  const bulge = old.reduce((s, i) => s + dot(sub(m.pos[i], O), N0), 0), N: V3 = bulge < 0 ? [-N0[0], -N0[1], -N0[2]] : N0;
  const R: V3 = cross(up, N);
  const along = old.map((i) => dot(sub(m.pos[i], O), R)), high = old.map((i) => dot(sub(m.pos[i], O), up));
  const x0 = (Math.min(...along) + Math.max(...along)) / 2, y0 = (Math.min(...high) + Math.max(...high)) / 2;
  const C = [0, 1, 2].map((c) => O[c] + x0 * R[c] + y0 * up[c]) as V3;
  const colour = [0, 1].map((c) => old.reduce((s, i) => s + m.uv[i][c], 0) / old.length) as [number, number];

  const gone = new Set(old), keep: number[] = [], remap = new Map<number, number>();
  m.pos.forEach((_, i) => {
    if (!gone.has(i)) remap.set(i, keep.push(i) - 1);
  });
  const pos: V3[] = keep.map((i) => m.pos[i]), nor: V3[] = keep.map((i) => m.nor[i]), uv = keep.map((i) => m.uv[i]), tri: number[] = [];
  for (let t = 0; t < m.tri.length; t += 3) {
    const a = m.tri.slice(t, t + 3);
    if (!a.some((i) => gone.has(i))) tri.push(...a.map((i) => remap.get(i)!));
  }
  const first = pos.length, dn = digit.pos.map((): V3 => [0, 0, 0]);
  for (const [x, y, z] of digit.pos) pos.push([0, 1, 2].map((c) => C[c] + x * R[c] + y * up[c] + z * N[c]) as V3), uv.push(colour);
  for (const [a, b, c] of digit.tris) {
    tri.push(first + a, first + b, first + c);
    const f = cross(sub(pos[first + b], pos[first + a]), sub(pos[first + c], pos[first + a]));
    for (const i of [a, b, c]) dn[i] = [dn[i][0] + f[0], dn[i][1] + f[1], dn[i][2] + f[2]];
  }
  nor.push(...dn.map(unit));

  // a plain glTF (floats, the picture a file) for gltfpack
  const dir = join(tmpdir(), `room-own-${process.pid}`);
  mkdirSync(dir, { recursive: true });
  const f32 = (rows: number[][]) => Buffer.from(new Float32Array(rows.flat()).buffer);
  const parts = [f32(pos), f32(nor), f32(uv), Buffer.from(new Uint32Array(tri).buffer)];
  let off = 0;
  const bufferViews = parts.map((b, i) => {
    const v = { buffer: 0, byteOffset: off, byteLength: b.length, target: i < 3 ? 34962 : 34963 };
    off += b.length;
    return v;
  });
  writeFileSync(join(dir, 'b.bin'), Buffer.concat(parts));
  writeFileSync(join(dir, 'i.webp'), pictureOf(glb));
  const lo = [0, 1, 2].map((c) => Math.min(...pos.map((p) => p[c]))), hi = [0, 1, 2].map((c) => Math.max(...pos.map((p) => p[c])));
  const mat = structuredClone(j.materials[0]);
  delete mat.pbrMetallicRoughness?.baseColorTexture?.extensions;
  writeFileSync(join(dir, 'm.gltf'), JSON.stringify({
    asset: { version: '2.0' }, scene: 0, scenes: [{ nodes: [0] }], nodes: [{ mesh: 0 }],
    meshes: [{ primitives: [{ attributes: { POSITION: 0, NORMAL: 1, TEXCOORD_0: 2 }, indices: 3, material: 0 }] }],
    accessors: [
      { bufferView: 0, componentType: 5126, count: pos.length, type: 'VEC3', min: lo, max: hi },
      { bufferView: 1, componentType: 5126, count: pos.length, type: 'VEC3' },
      { bufferView: 2, componentType: 5126, count: pos.length, type: 'VEC2' },
      { bufferView: 3, componentType: 5125, count: tri.length, type: 'SCALAR' }
    ],
    bufferViews, buffers: [{ uri: 'b.bin', byteLength: off }],
    materials: [mat], samplers: j.samplers, textures: [{ sampler: 0, extensions: { EXT_texture_webp: { source: 0 } } }],
    images: [{ uri: 'i.webp', mimeType: 'image/webp' }],
    extensionsUsed: ['EXT_texture_webp'], extensionsRequired: ['EXT_texture_webp']
  }));
  execFileSync('node', [GLTFPACK, '-i', join(dir, 'm.gltf'), '-o', join(dir, 'out.glb'), '-cc', '-ce', 'ext']);
  return readFileSync(join(dir, 'out.glb'));
}

/** A PNG as the room's WebP (scripts/room-models.ts's settings: a model's texture q80, an icon q80 at 96 px). */
function webp(png: string, extra: string[] = []): Buffer {
  const out = join(tmpdir(), `room-own-${process.pid}.webp`);
  execFileSync('cwebp', ['-quiet', '-q', '80', '-alpha_q', '90', '-m', '6', '-sharp_yuv', ...extra, png, '-o', out]);
  return readFileSync(out);
}
/** A WebP as a PNG. */
function png(webpBytes: Buffer, out: string): void {
  const src = join(tmpdir(), `room-own-${process.pid}.webp`);
  writeFileSync(src, webpBytes);
  execFileSync('dwebp', ['-quiet', src, '-o', out]);
}

/** A JSON table written as the room's are (scripts/room-models.ts writeJson): one entry a line in its objects. */
function writeTable(f: string, json: Record<string, unknown>, blocks: readonly string[]): void {
  const block = (k: string, v: unknown) => blocks.includes(k) && v && typeof v === 'object'
    ? `  ${JSON.stringify(k)}: {\n${Object.entries(v as Record<string, unknown>).map(([c, m]) => `    ${JSON.stringify(c)}: ${JSON.stringify(m)}`).join(',\n')}\n  }`
    : `  ${JSON.stringify(k)}: ${JSON.stringify(v)}`;
  writeFileSync(f, `{\n${Object.entries(json).map(([k, v]) => block(k, v)).join(',\n')}\n}\n`);
}

/** Each own piece's model, icon, items.json entry, names and HHA (again from its base and its pictures). */
export async function buildOwn(): Promise<void> {
  const itemsFile = join(TENT, 'items.json'), hhaFile = join(TENT, 'hha.json');
  const items = readJson<{ items: Record<string, Meta> } & Record<string, unknown>>(itemsFile);
  const more = readJson<{ items: Record<string, Meta> }>(join(TENT, 'more.json')).items;
  const hha = readJson<Record<string, Record<string, unknown>>>(hhaFile);
  const names = { ja: readJson<Record<string, string>>(join(APP, 'src', 'lib', 'i18n', 'tent.ja.json')), en: readJson<Record<string, string>>(join(APP, 'src', 'lib', 'i18n', 'tent.en.json')) };
  for (const o of OWN) {
    const base = items.items[o.base] ?? more[o.base];
    const glb = o.digit
      ? await withDigit(modelOf(o.base), o.digit, readJson(join(DESIGN, `${o.code}.json`)))
      : withPicture(modelOf(o.base), webp(join(DESIGN, `${o.code}.png`)));
    writeFileSync(join(STATIC, 'models', `${o.code}.glb`), glb);
    writeFileSync(join(STATIC, 'icons', `${o.code}.webp`), webp(join(DESIGN, `${o.code}-icon.png`), ['-resize', '96', '96']));
    // the base's footprint, surface, seat, light and emitter; its own file, version and icon
    const { pk: _pk, g: _g, cat: _cat, starter: _s, ...rest } = base as Meta & { g?: string; cat?: string; starter?: 1 };
    items.items[o.code] = { ...rest, kb: Math.round(glb.length / 102.4) / 10, v: createHash('sha256').update(glb).digest('hex').slice(0, 8), icon: 1 };
    hha[o.code] = { ...hha[o.base], ...o.hha };
    names.ja[`tent.item.${o.code}`] = o.ja;
    names.en[`tent.item.${o.code}`] = o.en;
    console.log(`${o.code} ${o.en}: ${(glb.length / 1024).toFixed(1)} KB (from ${o.base})`);
  }
  writeTable(itemsFile, items, ['items']);
  writeFileSync(hhaFile, `{\n${Object.entries(hha).map(([c, m]) => `  ${JSON.stringify(c)}: ${JSON.stringify(m)}`).join(',\n')}\n}\n`);
  for (const l of ['ja', 'en'] as const)
    writeFileSync(join(APP, 'src', 'lib', 'i18n', `tent.${l}.json`), JSON.stringify(names[l], null, 0).replace(/","/g, '",\n"').replace(/^\{/, '{\n').replace(/\}$/, '\n}') + '\n');
}
/** Each base's albedo and icon as PNGs (room-own-letters.py's and room-own-digits.py's input). */
/** Each base's albedo and icon as PNGs (room-own-letters.py's input). */
function bases(dir = '/tmp/room-own'): void {
  mkdirSync(dir, { recursive: true });
  for (const b of new Set(OWN.map((o) => o.base))) {
    png(pictureOf(modelOf(b)), join(dir, `${b}.png`));
    const icon = join(STATIC, 'icons', `${b}.webp`);
    if (existsSync(icon)) png(readFileSync(icon), join(dir, `${b}-icon.png`));
    console.log(`${dir}/${b}.png, ${b}-icon.png`);
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  if (process.argv.includes('--base')) bases();
  else await buildOwn();
}
