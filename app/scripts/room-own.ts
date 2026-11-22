// Our own room pieces (docs/world3d-assets.md "Our own pieces"): NH's piece with a picture of ours, a loose model in
// static/room/models/ and its icon in static/room/icons/, in items.json with the base's footprint and flags, their names
// in i18n/tent.*.json and their HHA in hha.json. The wedding sign (the user, 2026-11-22): NH's birthday sign whose
// banner reads HAPPY WEDDING♥ (the letters painted by scripts/room-own-letters.py into design/room/<code>.png, the
// albedo, and <code>-icon.png). room-models.ts runs this at its end (its rewrite of items.json, the names and the HHA
// would drop them); alone, it builds them again from the base's model as packed.
//   node scripts/room-own.ts           the models, icons and entries
//   node scripts/room-own.ts --base    each base's albedo and icon as PNGs into /tmp/room-own/ (room-own-letters.py's input)
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

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
}
/** Our own pieces: codes past NH's ids (its highest ~16,000). */
const OWN: readonly Own[] = [{ code: 'f90001', base: 'f3594', ja: 'ハッピーウェディングボード', en: 'happy wedding sign', hha: { s: 'wedding' } }];

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
  bufferViews: { buffer: number; byteOffset?: number; byteLength: number; extensions?: { EXT_meshopt_compression?: { buffer: number; byteOffset?: number; byteLength: number } } }[];
  buffers: { byteLength: number }[];
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
export function buildOwn(): void {
  const itemsFile = join(TENT, 'items.json'), hhaFile = join(TENT, 'hha.json');
  const items = readJson<{ items: Record<string, Meta> } & Record<string, unknown>>(itemsFile);
  const more = readJson<{ items: Record<string, Meta> }>(join(TENT, 'more.json')).items;
  const hha = readJson<Record<string, Record<string, unknown>>>(hhaFile);
  const names = { ja: readJson<Record<string, string>>(join(APP, 'src', 'lib', 'i18n', 'tent.ja.json')), en: readJson<Record<string, string>>(join(APP, 'src', 'lib', 'i18n', 'tent.en.json')) };
  for (const o of OWN) {
    const base = items.items[o.base] ?? more[o.base];
    const glb = withPicture(modelOf(o.base), webp(join(DESIGN, `${o.code}.png`)));
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

/** Each base's albedo and icon as PNGs (room-own-letters.py's input). */
function bases(dir = '/tmp/room-own'): void {
  mkdirSync(dir, { recursive: true });
  for (const o of OWN) {
    png(pictureOf(modelOf(o.base)), join(dir, `${o.base}.png`));
    const icon = join(STATIC, 'icons', `${o.base}.webp`);
    if (existsSync(icon)) png(readFileSync(icon), join(dir, `${o.base}-icon.png`));
    console.log(`${dir}/${o.base}.png, ${o.base}-icon.png`);
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  if (process.argv.includes('--base')) bases();
  else buildOwn();
}
