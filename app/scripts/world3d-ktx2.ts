// The island's model textures as GPU-compressed KTX2 (world3d/ktx2.ts): each image embedded in
// the island's GLBs (static/room/world3d/, homes/, structures/, villagers3d/, the players' packs: a WebP) encoded with Basis
// Universal (UASTC, its mipmaps built here), a model's in one pack (world3d/ktx2Pack.ts: static/room/tex/<id>.ktx2p,
// its id from its images' hashes, world3d/texHash.ts: the same images in two models are one pack); and each loose WebP
// those models wear (texHash.ts looseTextures: a home's other colours, a pack a colour; a player's face or garment, a
// KTX2 beside it, in the players' packs: scripts/player-packs.ts, run at the end), its WebP's hash in
// scripts/ktx2-loose.json to tell when it changed. Packs, not a file a texture:
// static/ stays under Cloudflare Pages' file cap (src/lib/static-files.test.ts). The phone transcodes a texture (ASTC
// 4x4 on an iPhone: a quarter of the WebP's RGBA in GPU memory, no decode, no mipmap pass) and keeps the result
// (world3d/texCache.ts). Then the island's models give up their WebPs (scripts/glb-webp.ts: into each model's WebP
// pack, static/room/tex/<id>.webpp, read only where no KTX2 is drawn; the players' keep theirs), the rooms' own
// models are left as they are. Also copies three's Basis transcoder (its wasm) to
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
import { join, relative } from 'node:path';
import { createRequire } from 'node:module';
import { promisify } from 'node:util';
import { glbTextures, looseTextures, texHash, texKey, type Loose } from '../src/lib/components/world3d/texHash.ts';
import { strip } from './glb-webp.ts';
import { entries, pack, packId } from '../src/lib/components/world3d/ktx2Pack.ts';
import homes from '../src/lib/layout/homes.json' with { type: 'json' };
import structures from '../src/lib/layout/structures.json' with { type: 'json' };
import parts from '../src/lib/components/player3d/parts.json' with { type: 'json' };
import { packPlayer, playerFiles } from './player-packs.ts';

const run = promisify(execFile);
const APP = join(import.meta.dirname, '..');
const ROOM = join(APP, 'static', 'room');
/** The model folders whose GLBs' images are encoded. */
const SRC = ['world3d', 'homes', 'structures', 'villagers3d'].map((d) => join(ROOM, d));
/** The players' files (their packs': path under room/player/ → bytes), and the KTX2s made for them (packed at the end). */
const PLAYER = playerFiles();
const playerOut = new Map<string, Uint8Array>();
const inPlayer = (path: string) => path.startsWith('player/');
/** A file under static/room (a player's from its pack). */
const readRoom = (path: string): Uint8Array | null => (inPlayer(path) ? (PLAYER.get(path.slice(7)) ?? null) : existsSync(join(ROOM, path)) ? new Uint8Array(readFileSync(join(ROOM, path))) : null);
const OUT = join(ROOM, 'tex');
const LOOSE = join(APP, 'scripts', 'ktx2-loose.json');
const BASIS = join(APP, 'static', 'room', 'basis');
const META = join(APP, 'src', 'lib', 'components', 'world3d', 'ktx2.json');
/** basisu's settings: UASTC (ETC1S lost too much colour: the autumn leaves greyed, a median 34 dB against the WebP over
 *  the drawn pixels; UASTC 38), rate-distortion optimised and zstd-packed for size, mipmaps (sRGB-filtered), the sRGB
 *  transfer function. */
const ENC = ['-ktx2', '-mipmap', '-srgb', '-uastc', '-uastc_level', '2', '-uastc_rdo_l', '2', '-ktx2_zstandard_level', '18'];
/** Embedded textures whose KTX2 is capped smaller than its WebP (px, the larger side): its top mip levels dropped
 *  (what's left is the same file's smaller levels, no re-encode). The building exteriors at 512, seen only from the
 *  island's camera (review 11/10: 1.86 → 0.60 MB of the first launch's KTX2 for all 12, a 256 cap's
 *  PSNR against the 512 ≥ 36.5 dB for these). By model and image index; a capped image is its every pack's, so each
 *  model carrying it is listed (the script fails on one that isn't: a model seen up close keeps the full size).
 *  Held back for a look at full pinch zoom on the phone (28.7-38.7 dB): shop.glb #6, tent.glb #0 #2 (campsite-winter's
 *  too), bridge-stone.glb #0. */
const CAPS: [model: string, px: number, images: number[]][] = [
  ['world3d/shop.glb', 256, [2, 3, 10]],
  ['world3d/museum.glb', 256, [0, 2, 3]],
  ['structures/stairs-stone-stair.glb', 256, [0]],
  ['world3d/deco/bulletin-board.glb', 256, [0]],
  ['world3d/deco/bulletin-board-winter.glb', 256, [0]]
];

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
  for (const l of loose) {
    const b = l.entry ? null : readRoom(l.out);
    if (b) done.set(l.path, b);
  }
}

// the packs: a model's images (by key: hash, capped or not); a home colour's albedos (by material); the players' loose files
const models = [...SRC.flatMap(walk).map((f): [string, Uint8Array] => [relative(ROOM, f), new Uint8Array(readFileSync(f))]), ...[...PLAYER].filter(([p]) => p.endsWith('.glb')).map(([p, b]): [string, Uint8Array] => [`player/${p}`, b])];
const texOf = new Map(models.map(([p, b]) => [p, glbTextures(b)]));
const hashesOf = new Map([...texOf].map(([p, ts]) => [p, ts.map((t) => t.hash)]));
// the WebPs the island's models no longer carry (their WebP packs: scripts/glb-webp.ts)
const webps = new Map<string, Uint8Array>();
for (const f of readdirSync(OUT)) if (f.endsWith('.webpp')) readPack(join(OUT, f), (id, b) => webps.set(id, b));
const caps: Record<string, number> = {};
for (const [m, px, ims] of CAPS) for (const i of ims) {
  const h = hashesOf.get(m)?.[i];
  if (!h) throw new Error(`world3d-ktx2: CAPS: no image ${i} in ${m}`);
  caps[h] = px;
}
for (const [p, hs] of hashesOf) hs.forEach((h, i) => {
  if (caps[h] && !CAPS.some(([m, px, ims]) => m === p && px === caps[h] && ims.includes(i))) throw new Error(`world3d-ktx2: ${p} #${i} is a capped image (CAPS): cap it there too, or nowhere`);
});
const images = new Map<string, Uint8Array>(), packs = new Map<string, string[]>();
for (const [p, ts] of texOf) {
  if (!ts.length) continue;
  for (const t of ts) {
    const webp = t.webp ?? webps.get(t.hash);
    if (!webp) throw new Error(`world3d-ktx2: ${p}'s ${t.hash} has no WebP (in the model or its WebP pack)`);
    images.set(t.hash, webp);
  }
  const ks = ts.map((t) => texKey(t.hash, caps));
  packs.set(packId(ks), [...new Set(ks)]);
}
/** Each texture to encode: its WebP's bytes, flipped or not, and the key it's kept under. */
type Job = { webp: Uint8Array; flip: boolean; key: string };
// (a capped one is cut from its full encoding, encoded first if there's none)
const jobs: Job[] = [...images].filter(([h]) => !done.has(texKey(h, caps)) && !done.has(h)).map(([h, webp]) => ({ webp, flip: false, key: h }));
const looseHash: Record<string, string> = {};
for (const l of loose) {
  const webp = readRoom(l.path);
  if (!webp) throw new Error(`world3d-ktx2: no ${l.path}`);
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
for (const h of Object.keys(caps)) if (!done.has(texKey(h, caps))) done.set(texKey(h, caps), capKtx2(done.get(h)!, caps[h]));

/** `ktx2` without its levels larger than `px` (a side): the header's size and the level index cut to the rest, the
 *  descriptors and levels copied (a supercompressed file's levels are unaligned, smallest first). */
function capKtx2(ktx2: Uint8Array, px: number): Uint8Array {
  const dv = new DataView(ktx2.buffer, ktx2.byteOffset, ktx2.byteLength), u32 = (o: number) => dv.getUint32(o, true), u64 = (o: number) => Number(dv.getBigUint64(o, true));
  const w = u32(20), h = u32(24), n = u32(40);
  if (u32(44) === 0 || u64(72) !== 0) throw new Error('world3d-ktx2: capKtx2 takes a zstd-supercompressed UASTC file');
  let k = 0;
  while (Math.max(w >> k, h >> k) > px) k++;
  if (!k) return ktx2;
  const lv = Array.from({ length: n - k }, (_, i) => [u64(80 + 24 * (i + k)), u64(88 + 24 * (i + k)), u64(96 + 24 * (i + k))]);
  const dfd = ktx2.subarray(u32(48), u32(48) + u32(52)), kvd = ktx2.subarray(u32(56), u32(56) + u32(60));
  const head = 80 + 24 * lv.length, size = head + dfd.length + kvd.length + lv.reduce((s, [, l]) => s + l, 0);
  const out = new Uint8Array(size), o = new DataView(out.buffer);
  out.set(ktx2.subarray(0, 48));
  o.setUint32(20, Math.max(1, w >> k), true);
  o.setUint32(24, Math.max(1, h >> k), true);
  o.setUint32(40, lv.length, true);
  o.setUint32(48, head, true);
  o.setUint32(52, dfd.length, true);
  o.setUint32(56, kvd.length ? head + dfd.length : 0, true);
  o.setUint32(60, kvd.length, true);
  out.set(dfd, head);
  out.set(kvd, head + dfd.length);
  let at = head + dfd.length + kvd.length;
  for (let i = lv.length - 1; i >= 0; i--) {
    const [off, len, raw] = lv[i];
    out.set(ktx2.subarray(off, off + len), at);
    o.setBigUint64(80 + 24 * i, BigInt(at), true);
    o.setBigUint64(88 + 24 * i, BigInt(len), true);
    o.setBigUint64(96 + 24 * i, BigInt(raw), true);
    at += len;
  }
  return out;
}

// write them (what changed), and delete what's no longer wanted
const want = new Map<string, Uint8Array>();
for (const [id, hs] of packs) want.set(join(OUT, `${id}.ktx2p`), pack(hs.map((h) => [h, done.get(h)!])));
const byPack = new Map<string, [string, Uint8Array][]>();
for (const l of loose) {
  if (inPlayer(l.out)) playerOut.set(l.out.slice(7), done.get(l.path)!);
  else if (!l.entry) want.set(join(ROOM, l.out), done.get(l.path)!);
  else byPack.set(l.out, [...(byPack.get(l.out) ?? []), [l.entry, done.get(keyOf(l))!]]);
}
for (const [out, es] of byPack) want.set(join(ROOM, out), pack(es));
let removed = 0, bytes = 0;
for (const [f, b] of want) {
  bytes += b.length;
  if (!existsSync(f) || !Buffer.from(b).equals(readFileSync(f))) writeFileSync(f, b);
}
for (const d of new Set([OUT, ...loose.filter((l) => !inPlayer(l.out)).map((l) => join(ROOM, l.out, '..'))]))
  for (const f of readdirSync(d)) if (/\.ktx2p?$/.test(f) && !want.has(join(d, f))) rmSync(join(d, f)), removed++;
// the island's models without their WebPs (scripts/glb-webp.ts): a model's in its WebP pack (by its images' hashes, as
// its KTX2 pack by their keys), drawn only where no KTX2 is; the players' keep theirs (their packs, player-packs.ts)
const webpWant = new Set<string>();
let stripped = 0, freed = 0;
for (const [p, b] of models) {
  const hs = hashesOf.get(p)!;
  if (inPlayer(p) || !hs.length) continue;
  const f = join(OUT, `${packId(hs)}.webpp`), w = pack([...new Set(hs)].map((h) => [h, images.get(h)!]));
  webpWant.add(f);
  if (!existsSync(f) || !Buffer.from(w).equals(readFileSync(f))) writeFileSync(f, w);
  const s = strip(b, hs);
  if (s) writeFileSync(join(ROOM, p), s), stripped++, (freed += b.length - s.length);
}
for (const f of readdirSync(OUT)) if (f.endsWith('.webpp') && !webpWant.has(join(OUT, f))) rmSync(join(OUT, f)), removed++;
// the players' KTX2s into their packs (each file's place into the part tables)
const packed = packPlayer({ extra: playerOut });
writeFileSync(LOOSE, `${JSON.stringify(Object.fromEntries(Object.entries(looseHash).sort(([a], [b]) => a.localeCompare(b))), null, 1)}\n`);

// the transcoder's wasm (its JS is bundled into the worker: vite.config.ts basisModule)
const wasm = createRequire(import.meta.url).resolve('three/examples/jsm/libs/basis/basis_transcoder.wasm');
mkdirSync(BASIS, { recursive: true });
copyFileSync(wasm, join(BASIS, 'basis_transcoder.wasm'));
const v = createHash('sha256').update(readFileSync(wasm)).digest('hex').slice(0, 8);
writeFileSync(META, `${JSON.stringify({ _: 'scripts/world3d-ktx2.ts: the island models\' textures as KTX2 (static/room/tex/<id>.ktx2p, the loose ones\' beside them), basisu\'s settings, the transcoder\'s content hash (static/room/basis/), the capped textures\' sizes (texHash.ts texKey)', enc, wasm: v, caps: Object.fromEntries(Object.entries(caps).sort(([a], [b]) => a.localeCompare(b))) }, null, 2)}\n`);
console.log(`${images.size} embedded textures in ${packs.size} packs, ${loose.length} loose (${jobs.length} encoded, ${removed} files removed): ${want.size} files, ${(bytes / 1024).toFixed(0)} KB; ${webpWant.size} WebP packs, ${stripped} models stripped of theirs (${(freed / 1024).toFixed(0)} KB); the players' ${playerOut.size} in their ${packed.packs} packs (${packed.written} written); transcoder ${v}`);
