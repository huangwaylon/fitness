// NH's homes (docs/island-layout.md "Homes"): the campsite tent, the move-in tents and NH's modular houses (a wall, a
// roof and a door, each a style and a colour), from the game files the user supplied (the same `<Model>.Nin_NX_NVN`
// folders scripts/world3d-models.ts reads), converted its way (scripts/world3d-page.js: NH's materials baked into one
// WebP each; gltfpack quantises and meshopt-compresses) into static/room/homes/:
//   <family>.glb                    one per shape and material (a wall NA in brick, a roof NC thatched, a door's style
//                                   and shape): the geometry is the same in every colour, so it ships once, in its
//                                   first colour
//   <family>.<colour>.<mat>.webp    a colour's own baked albedo for each material that differs from the first's
// plus src/lib/layout/homes.json: each family's bounds, triangles, KB, hash and colours (with the materials each
// swaps). layout/homes.ts names them; components/world3d/home.ts puts them together.
//
// Usage (from app/): NH_MODELS=~/Downloads/Model npm run home-models [-- --only=wall-na,door-simple]
// The model folder is untrusted input and never part of the repo: only the named folders' .dae and .png files are
// copied into a scratch dir (three.js reads them in the page; nothing in them is run). Needs Google Chrome
// (Playwright's channel 'chrome') and cwebp.
import { chromium } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, extname, join, resolve, sep } from 'node:path';
import { createRequire } from 'node:module';
import { createHash } from 'node:crypto';

const APP = join(import.meta.dirname, '..');
const OUT = join(APP, 'static', 'room', 'homes');
const META = join(APP, 'src', 'lib', 'layout', 'homes.json');
const arg = (k: string) => process.argv.find((a) => a.startsWith(`--${k}=`))?.slice(k.length + 3);
const only = (arg('only') ?? '').split(',').filter(Boolean);
const TRIS = 6000;

const MODELS = process.env.NH_MODELS?.replace(/^~(?=\/)/, process.env.HOME ?? '~');
if (!MODELS || !existsSync(MODELS)) {
  console.error('Set NH_MODELS to the folder of NH model folders (<Model>.Nin_NX_NVN), e.g. NH_MODELS=~/Downloads/Model npm run home-models');
  process.exit(1);
}
const ROOT: string = MODELS;
const F = (n: string) => `${n}.Nin_NX_NVN`;
const SAFE = /^[A-Za-z0-9_]+$/;

/** A family: one shape in every colour (`colours`: the colour's letter → its folders, the first the GLB's). */
interface Family {
  name: string;
  kind: 'wall' | 'roof' | 'door' | 'tent';
  colours: [string, string[]][];
  maxTex: number;
}
const kebab = (s: string) => s.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
const folders = readdirSync(ROOT).filter((d) => d.endsWith('.Nin_NX_NVN')).map((d) => d.slice(0, -11)).filter((d) => SAFE.test(d) && d.startsWith('House'));
const fams = new Map<string, Family>();
const add = (name: string, kind: Family['kind'], colour: string, parts: string[], maxTex: number) => {
  const f = fams.get(name) ?? fams.set(name, { name, kind, colours: [], maxTex }).get(name)!;
  f.colours.push([colour, parts]);
};
for (const d of folders.sort()) {
  let m: RegExpExecArray | null;
  if ((m = /^HouseWall(N[A-D]|PA04)([A-Z][a-z]+)([A-J])$/.exec(d))) add(`wall-${m[1].toLowerCase()}-${kebab(m[2])}`, 'wall', m[3], [d], 256);
  else if ((m = /^HouseRoof(N[A-D]|PA04)([A-Z][a-z]+)([A-J])$/.exec(d))) add(`roof-${m[1].toLowerCase()}-${kebab(m[2])}`, 'roof', m[3], [d], 256);
  else if ((m = /^HouseDoor([A-Z][A-Za-z]*?)([A-J])([RS])$/.exec(d))) add(`door-${kebab(m[1])}-${m[3].toLowerCase()}`, 'door', m[2], [d], 128);
}
// the move-in tents: NA and NB are one tent in two colours; PA the player's own
for (const [c, t] of [['A', 'HouseTentNA'], ['B', 'HouseTentNB']] as const) add('tent-n', 'tent', c, [t, `${t}Door`], 512);
add('tent-p', 'tent', 'A', ['HouseTentPA', 'HouseTentPADoor'], 512);

const todo = [...fams.values()].filter((f) => !only.length || only.some((o) => f.name.startsWith(o)));
const scratch = mkdtempSync(join(tmpdir(), 'nh-homes-'));
const work = mkdtempSync(join(tmpdir(), 'nh-homes-out-'));
const copy = (folder: string) => {
  const dst = join(scratch, F(folder));
  if (existsSync(dst)) return;
  mkdirSync(dst);
  const src = join(ROOT, F(folder));
  for (const n of readdirSync(src)) if (/^[A-Za-z0-9_]+\.(dae|png)$/.test(n) && statSync(join(src, n)).isFile()) cpSync(join(src, n), join(dst, n));
};
for (const f of todo) for (const [, parts] of f.colours) for (const p of parts) copy(p);
mkdirSync(OUT, { recursive: true });
mkdirSync(dirname(META), { recursive: true });

const webp = (png: string, out: string, q: number) => execFileSync('cwebp', ['-quiet', '-q', String(q), '-alpha_q', '90', '-m', '6', '-sharp_yuv', png, '-o', out]);
const GLTFPACK = join(dirname(createRequire(import.meta.url).resolve('gltfpack/package.json')), 'cli.js');
const three = join(dirname(createRequire(import.meta.url).resolve('three')), '..');
const PAGE = join(import.meta.dirname, 'world3d-page.js');
const MIME: Record<string, string> = { '.js': 'text/javascript', '.png': 'image/png', '.dae': 'model/vnd.collada+xml' };

const browser = await chromium.launch({ channel: 'chrome', args: ['--enable-gpu', '--ignore-gpu-blocklist'] });
const page = await browser.newPage();
page.on('pageerror', (e) => console.error('[page]', e.message));
await page.route('http://w3d.local/**', (route) => {
  const u = decodeURIComponent(new URL(route.request().url()).pathname);
  const within = (root: string, rel: string) => {
    const f = resolve(root, rel);
    return f.startsWith(root + sep) ? f : null;
  };
  const f = u === '/page.js' ? PAGE : u.startsWith('/three/') ? within(three, u.slice(7)) : u.startsWith('/src/') ? within(scratch, u.slice(5)) : null;
  if (u === '/') return route.fulfill({ contentType: 'text/html', body: '<!doctype html><script type="importmap">{"imports":{"three":"/three/build/three.module.js","three/addons/":"/three/examples/jsm/"}}</script><script type="module" src="/page.js"></script>' });
  if (!f || !existsSync(f)) return route.fulfill({ status: 404, body: '' });
  return route.fulfill({ body: readFileSync(f), contentType: MIME[extname(f)] ?? 'application/octet-stream' });
});
await page.goto('http://w3d.local/');
await page.waitForFunction(() => (window as unknown as { ready?: boolean }).ready);

interface GltfJson {
  buffers: { uri: string }[];
  images?: { uri?: string; mimeType?: string }[];
  textures?: { source?: number; extensions?: object }[];
  materials?: { name?: string; pbrMetallicRoughness?: { baseColorTexture?: { index: number } } }[];
  extensionsUsed?: string[];
  extensionsRequired?: string[];
}
type Converted = { gltf: string; box: [number[], number[]]; tris: number; lit: boolean };
const convert = (f: Family, parts: string[]) => {
  const files = parts.map((p) => [F(p), readdirSync(join(scratch, F(p)))]);
  return page.evaluate((o) => (window as unknown as { convert: (o: unknown) => Promise<Converted> }).convert(o), {
    parts: parts.map((p) => ({ folder: F(p), dae: `${p}.dae` })), files, maxTex: f.maxTex, maxEmi: 128
  });
};
/** Each material's base colour image (its data URI), by name. */
const albedos = (g: GltfJson): Map<string, string> => {
  const out = new Map<string, string>();
  for (const m of g.materials ?? []) {
    const t = m.pbrMetallicRoughness?.baseColorTexture?.index;
    const src = t !== undefined ? g.textures?.[t]?.source : undefined;
    const uri = src !== undefined ? g.images?.[src]?.uri : undefined;
    if (m.name && uri) out.set(m.name, uri);
  }
  return out;
};

interface Meta { kind: Family['kind']; min: number[]; max: number[]; tris: number; kb: number; v: string; lit?: 1; colours: Record<string, string[]> }
const metas: Record<string, Meta> = existsSync(META) ? (JSON.parse(readFileSync(META, 'utf8')) as { families: Record<string, Meta> }).families : {};
let total = 0;
for (const f of todo) {
  const [[first, parts], ...rest] = f.colours;
  const r = await convert(f, parts);
  const g = JSON.parse(r.gltf) as GltfJson;
  const base = albedos(g);
  const dir = join(work, f.name);
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir);
  g.buffers.forEach((b, i) => {
    writeFileSync(join(dir, `b${i}.bin`), Buffer.from(b.uri.split(',')[1], 'base64'));
    b.uri = `b${i}.bin`;
  });
  (g.images ?? []).forEach((im, i) => {
    const png = join(dir, `i${i}.png`);
    writeFileSync(png, Buffer.from(im.uri!.split(',')[1], 'base64'));
    webp(png, join(dir, `i${i}.webp`), 80);
    im.uri = `i${i}.webp`;
    im.mimeType = 'image/webp';
  });
  if (g.images?.length) {
    for (const t of g.textures ?? []) {
      t.extensions = { EXT_texture_webp: { source: t.source } };
      delete t.source;
    }
    g.extensionsUsed = [...new Set([...(g.extensionsUsed ?? []), 'EXT_texture_webp'])];
    g.extensionsRequired = [...new Set([...(g.extensionsRequired ?? []), 'EXT_texture_webp'])];
  }
  writeFileSync(join(dir, 'm.gltf'), JSON.stringify(g));
  const out = join(OUT, `${f.name}.glb`);
  const si = r.tris > TRIS ? ['-si', (TRIS / r.tris).toFixed(3)] : [];
  // -km: keep the materials apart (a colour swaps one by its name)
  execFileSync('node', [GLTFPACK, '-i', join(dir, 'm.gltf'), '-o', out, '-cc', '-ce', 'ext', '-km', ...si]);
  let bytes = statSync(out).size;
  const colours: Record<string, string[]> = { [first]: [] };
  // each other colour: only its albedos that differ from the first's
  for (const [c, cparts] of rest) {
    const rc = await convert(f, cparts);
    const own = albedos(JSON.parse(rc.gltf) as GltfJson);
    colours[c] = [];
    for (const [mat, uri] of own) {
      if (base.get(mat) === uri) continue;
      const png = join(dir, `${c}-${mat}.png`), w = join(OUT, `${f.name}.${c}.${mat}.webp`);
      writeFileSync(png, Buffer.from(uri.split(',')[1], 'base64'));
      webp(png, w, 80);
      bytes += statSync(w).size;
      colours[c].push(mat);
    }
  }
  total += bytes;
  const v = createHash('sha256').update(readFileSync(out)).digest('hex').slice(0, 8);
  metas[f.name] = {
    kind: f.kind, min: r.box[0].map((n) => +n.toFixed(2)), max: r.box[1].map((n) => +n.toFixed(2)), tris: Math.min(r.tris, TRIS),
    kb: +(bytes / 1024).toFixed(1), v, ...(r.lit ? { lit: 1 as const } : {}), colours
  };
  console.log(`${f.name}: ${(bytes / 1024).toFixed(1)} KB (${f.colours.length} colours), ${r.tris} tris, box ${r.box[0].map((n) => n.toFixed(1))} … ${r.box[1].map((n) => n.toFixed(1))}`);
}
await browser.close();
const sorted = Object.fromEntries(Object.entries(metas).sort(([a], [b]) => a.localeCompare(b)));
writeFileSync(META, `{\n  "_": "scripts/home-models.ts: NH's homes' parts (bounds in model units, triangles, KB with the colours' textures, content hash, each colour's swapped materials)",\n  "families": {\n${Object.entries(sorted).map(([k, m]) => `    ${JSON.stringify(k)}: ${JSON.stringify(m)}`).join(',\n')}\n  }\n}\n`);
console.log(`${todo.length} families, ${(total / 1024 / 1024).toFixed(2)} MB`);
rmSync(scratch, { recursive: true, force: true });
rmSync(work, { recursive: true, force: true });
