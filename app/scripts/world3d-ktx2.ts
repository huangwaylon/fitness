// The island's model textures as GPU-compressed KTX2 (world3d/ktx2.ts): each image embedded in
// the island's GLBs (static/room/world3d/, homes/, structures/, villagers3d/, player/: a WebP) encoded with Basis
// Universal (UASTC, its mipmaps built here), a model's in one pack (world3d/ktx2Pack.ts: static/room/tex/<id>.ktx2p,
// its id from its images' hashes, world3d/texHash.ts: the same images in two models are one pack); and each loose WebP
// those models wear (texHash.ts looseTextures: a home's other colours, a pack a colour; a player's face or garment, a
// KTX2 beside it), its WebP's hash in scripts/ktx2-loose.json to tell when it changed. Packs, not a file a texture:
// static/ stays under Cloudflare Pages' file cap (src/lib/static-files.test.ts). The phone transcodes a texture (ASTC
// 4x4 on an iPhone: a quarter of the WebP's RGBA in GPU memory, no decode, no mipmap pass) and keeps the result
// (world3d/texCache.ts). The GLBs and WebPs aren't touched: a loader without the plugin (the museum's own models', the
// tent's furniture's) draws their WebPs as before. Also copies three's Basis transcoder (its wasm) to
// static/room/basis/: fetched by the transcoding worker on first use only (under /room/: the service worker keeps it
// once used, never at install). Writes src/lib/components/world3d/ktx2.json (the encoder's settings, the transcoder's
// hash). New images are encoded (what's encoded already is read back out of the packs), unused files deleted; a
// settings change re-encodes all. world3d/ktx2.test.ts checks it's current.
//
// Usage (from app/): npm run world3d-ktx2      (needs basisu: `brew install basis_universal`, and dwebp)
import { execFile } from 'node:child_process';
import { createHash } from 'node:crypto';
import { cpus, tmpdir } from 'node:os';
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { createRequire } from 'node:module';
import { promisify } from 'node:util';
import { glbImages, looseTextures, texHash, type Loose } from '../src/lib/components/world3d/texHash.ts';
import { entries, pack, packId } from '../src/lib/components/world3d/ktx2Pack.ts';
import homes from '../src/lib/layout/homes.json' with { type: 'json' };
import structures from '../src/lib/layout/structures.json' with { type: 'json' };
import parts from '../src/lib/components/player3d/parts.json' with { type: 'json' };

const run = promisify(execFile);
const APP = join(import.meta.dirname, '..');
const ROOM = join(APP, 'static', 'room');
/** The model folders whose GLBs' images are encoded. */
const SRC = ['world3d', 'homes', 'structures', 'villagers3d', 'player'].map((d) => join(ROOM, d));
const OUT = join(ROOM, 'tex');
const LOOSE = join(APP, 'scripts', 'ktx2-loose.json');
const BASIS = join(APP, 'static', 'room', 'basis');
const META = join(APP, 'src', 'lib', 'components', 'world3d', 'ktx2.json');
/** basisu's settings: UASTC (ETC1S lost too much colour: the autumn leaves greyed, a median 34 dB against the WebP over
 *  the drawn pixels; UASTC 38), rate-distortion optimised and zstd-packed for size, mipmaps (sRGB-filtered), the sRGB
 *  transfer function. */
const ENC = ['-ktx2', '-mipmap', '-srgb', '-uastc', '-uastc_level', '2', '-uastc_rdo_l', '2', '-ktx2_zstandard_level', '18'];

const walk = (d: string): string[] => readdirSync(d).flatMap((f) => (statSync(join(d, f)).isDirectory() ? walk(join(d, f)) : f.endsWith('.glb') ? [join(d, f)] : []));
const old = existsSync(META) ? (JSON.parse(readFileSync(META, 'utf8')) as { enc?: string }) : {};
const enc = ENC.join(' ');
const same = old.enc === enc;
mkdirSync(OUT, { recursive: true });
const loose = looseTextures(homes, structures, parts);
const kept = (same && existsSync(LOOSE) ? JSON.parse(readFileSync(LOOSE, 'utf8')) : {}) as Record<string, string>;
const readPack = (f: string, into: (id: string, b: Uint8Array) => void) => {
  const b = new Uint8Array(readFileSync(f));
  for (const [id, [o, l]] of entries(b) ?? []) into(id, b.slice(o, o + l));
};
/** A texture's key in `done`: an embedded one's WebP hash; a loose one's pack and entry, or its path. */
const keyOf = (l: Loose) => (l.entry ? `${l.out}#${l.entry}` : l.path);

// what's encoded already (with these settings)
const done = new Map<string, Uint8Array>();
if (same) {
  for (const f of readdirSync(OUT)) {
    if (f.endsWith('.ktx2p')) readPack(join(OUT, f), (id, b) => done.set(id, b));
    else if (f.endsWith('.ktx2')) done.set(f.slice(0, -5), new Uint8Array(readFileSync(join(OUT, f))));
  }
  for (const out of new Set(loose.filter((l) => l.entry).map((l) => l.out))) if (existsSync(join(ROOM, out))) readPack(join(ROOM, out), (id, b) => done.set(`${out}#${id}`, b));
  for (const l of loose) if (!l.entry && existsSync(join(ROOM, l.out))) done.set(l.path, new Uint8Array(readFileSync(join(ROOM, l.out))));
}

// the packs: a model's images (by hash); a home colour's albedos (by material); the players' loose files
const images = new Map<string, Uint8Array>(), packs = new Map<string, string[]>();
for (const f of SRC.flatMap(walk)) {
  const ims = glbImages(readFileSync(f));
  if (!ims.length) continue;
  const hs = ims.map((im) => texHash(im));
  ims.forEach((im, i) => images.set(hs[i], im));
  packs.set(packId(hs), [...new Set(hs)]);
}
/** Each texture to encode: its WebP's bytes, flipped or not, and the key it's kept under. */
type Job = { webp: Uint8Array; flip: boolean; key: string };
const jobs: Job[] = [...images].filter(([h]) => !done.has(h)).map(([h, webp]) => ({ webp, flip: false, key: h }));
const looseHash: Record<string, string> = {};
for (const l of loose) {
  const webp = readFileSync(join(ROOM, l.path));
  looseHash[l.path] = texHash(webp);
  if (kept[l.path] !== looseHash[l.path]) done.delete(keyOf(l));
  if (!done.has(keyOf(l))) jobs.push({ webp, flip: l.flip, key: keyOf(l) });
}
const tmp = mkdtempSync(join(tmpdir(), 'world3d-ktx2-'));
let count = 0, n = 0;
async function one(j: Job) {
  const webp = join(tmp, `${++n}.webp`), png = join(tmp, `${n}.png`), out = join(tmp, `${n}.ktx2`);
  writeFileSync(webp, j.webp);
  await run('dwebp', ['-quiet', webp, '-o', png]);
  await run('basisu', [...ENC, ...(j.flip ? ['-y_flip'] : []), '-no_multithreading', '-file', png, '-output_file', out], { maxBuffer: 1 << 26 });
  done.set(j.key, new Uint8Array(readFileSync(out)));
  if (++count % 100 === 0) console.log(`${count} / ${jobs.length}`);
}
try {
  const queue = [...jobs];
  await Promise.all(Array.from({ length: Math.max(1, cpus().length - 2) }, async () => {
    for (let j = queue.shift(); j; j = queue.shift()) await one(j);
  }));
} finally {
  rmSync(tmp, { recursive: true, force: true });
}

// write them (what changed), and delete what's no longer wanted
const want = new Map<string, Uint8Array>();
for (const [id, hs] of packs) want.set(join(OUT, `${id}.ktx2p`), pack(hs.map((h) => [h, done.get(h)!])));
const byPack = new Map<string, [string, Uint8Array][]>();
for (const l of loose) {
  if (!l.entry) want.set(join(ROOM, l.out), done.get(l.path)!);
  else byPack.set(l.out, [...(byPack.get(l.out) ?? []), [l.entry, done.get(keyOf(l))!]]);
}
for (const [out, es] of byPack) want.set(join(ROOM, out), pack(es));
let removed = 0, bytes = 0;
for (const [f, b] of want) {
  bytes += b.length;
  if (!existsSync(f) || !Buffer.from(b).equals(readFileSync(f))) writeFileSync(f, b);
}
for (const d of new Set([OUT, ...loose.map((l) => join(ROOM, l.out, '..'))]))
  for (const f of readdirSync(d)) if (/\.ktx2p?$/.test(f) && !want.has(join(d, f))) rmSync(join(d, f)), removed++;
writeFileSync(LOOSE, `${JSON.stringify(Object.fromEntries(Object.entries(looseHash).sort(([a], [b]) => a.localeCompare(b))), null, 1)}\n`);

// the transcoder's wasm (its JS is bundled into the worker: vite.config.ts basisModule)
const wasm = createRequire(import.meta.url).resolve('three/examples/jsm/libs/basis/basis_transcoder.wasm');
mkdirSync(BASIS, { recursive: true });
copyFileSync(wasm, join(BASIS, 'basis_transcoder.wasm'));
const v = createHash('sha256').update(readFileSync(wasm)).digest('hex').slice(0, 8);
writeFileSync(META, `${JSON.stringify({ _: 'scripts/world3d-ktx2.ts: the island models\' textures as KTX2 (static/room/tex/<id>.ktx2p, the loose ones\' beside them), basisu\'s settings, the transcoder\'s content hash (static/room/basis/)', enc, wasm: v }, null, 2)}\n`);
console.log(`${images.size} embedded textures in ${packs.size} packs, ${loose.length} loose (${jobs.length} encoded, ${removed} files removed): ${want.size} files, ${(bytes / 1024).toFixed(0)} KB; transcoder ${v}`);
