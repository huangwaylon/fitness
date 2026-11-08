// The island's model textures as GPU-compressed KTX2 (docs/perf-plan.md C1, world3d/ktx2.ts): each image embedded in
// static/room/world3d/**/*.glb (a WebP) encoded with Basis Universal (UASTC, its mipmaps built here) into
// static/room/tex/<hash>.ktx2, named by the WebP's hash (world3d/texHash.ts: the same image in two models is one
// file); the phone transcodes it (ASTC 4x4 on an iPhone: a quarter of the WebP's RGBA in GPU memory, no decode, no mipmap
// pass) and keeps the result (world3d/texCache.ts). The GLBs aren't touched: a loader without the plugin (the museum's,
// the tent's) draws their WebPs as before. Also copies three's Basis transcoder (its wasm) to static/room/basis/:
// fetched by the transcoding worker on first use only (under /room/: the service worker keeps it once used, never at
// install). Writes src/lib/components/world3d/ktx2.json (the encoder's settings, the transcoder's hash). New images
// are encoded, unused files deleted; a settings change re-encodes all. world3d/ktx2.test.ts checks it's current.
//
// Usage (from app/): npm run world3d-ktx2      (needs basisu: `brew install basis_universal`, and dwebp)
import { execFile } from 'node:child_process';
import { createHash } from 'node:crypto';
import { cpus, tmpdir } from 'node:os';
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { createRequire } from 'node:module';
import { promisify } from 'node:util';
import { glbImages, texHash } from '../src/lib/components/world3d/texHash.ts';

const run = promisify(execFile);
const APP = join(import.meta.dirname, '..');
const SRC = join(APP, 'static', 'room', 'world3d');
const OUT = join(APP, 'static', 'room', 'tex');
const BASIS = join(APP, 'static', 'room', 'basis');
const META = join(APP, 'src', 'lib', 'components', 'world3d', 'ktx2.json');
/** basisu's settings: UASTC (ETC1S lost too much colour: the autumn leaves greyed, a median 34 dB against the WebP over
 *  the drawn pixels; UASTC 38), rate-distortion optimised and zstd-packed for size, mipmaps (sRGB-filtered), the sRGB
 *  transfer function. */
const ENC = ['-ktx2', '-mipmap', '-srgb', '-uastc', '-uastc_level', '2', '-uastc_rdo_l', '2', '-ktx2_zstandard_level', '18'];

const walk = (d: string): string[] => readdirSync(d).flatMap((f) => (statSync(join(d, f)).isDirectory() ? walk(join(d, f)) : f.endsWith('.glb') ? [join(d, f)] : []));
const old = existsSync(META) ? (JSON.parse(readFileSync(META, 'utf8')) as { enc?: string }) : {};
const enc = ENC.join(' ');
mkdirSync(OUT, { recursive: true });
if (old.enc !== enc) for (const f of readdirSync(OUT)) rmSync(join(OUT, f));

const images = new Map<string, Uint8Array>();
for (const f of walk(SRC)) for (const im of glbImages(readFileSync(f))) images.set(texHash(im), im);
const todo = [...images.keys()].filter((h) => !existsSync(join(OUT, `${h}.ktx2`)));
const tmp = mkdtempSync(join(tmpdir(), 'world3d-ktx2-'));
let done = 0;
async function one(h: string) {
  const webp = join(tmp, `${h}.webp`), png = join(tmp, `${h}.png`);
  writeFileSync(webp, images.get(h)!);
  await run('dwebp', ['-quiet', webp, '-o', png]);
  await run('basisu', [...ENC, '-no_multithreading', '-file', png, '-output_file', join(OUT, `${h}.ktx2`)], { maxBuffer: 1 << 26 });
  if (++done % 50 === 0) console.log(`${done} / ${todo.length}`);
}
try {
  const queue = [...todo];
  await Promise.all(Array.from({ length: Math.max(1, cpus().length - 2) }, async () => {
    for (let h = queue.shift(); h; h = queue.shift()) await one(h);
  }));
} finally {
  rmSync(tmp, { recursive: true, force: true });
}
let removed = 0, bytes = 0;
for (const f of readdirSync(OUT)) {
  if (images.has(f.replace(/\.ktx2$/, ''))) bytes += statSync(join(OUT, f)).size;
  else rmSync(join(OUT, f)), removed++;
}

// the transcoder's wasm (its JS is bundled into the worker: vite.config.ts basisModule)
const wasm = createRequire(import.meta.url).resolve('three/examples/jsm/libs/basis/basis_transcoder.wasm');
mkdirSync(BASIS, { recursive: true });
copyFileSync(wasm, join(BASIS, 'basis_transcoder.wasm'));
const v = createHash('sha256').update(readFileSync(wasm)).digest('hex').slice(0, 8);
writeFileSync(META, `${JSON.stringify({ _: 'scripts/world3d-ktx2.ts: the island models\' textures as KTX2 (static/room/tex/<hash>.ktx2), basisu\'s settings, the transcoder\'s content hash (static/room/basis/)', enc, wasm: v }, null, 2)}\n`);
console.log(`${images.size} textures (${todo.length} encoded, ${removed} removed), ${(bytes / 1024).toFixed(0)} KB; transcoder ${v}`);
