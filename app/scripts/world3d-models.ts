// The 3D island POC's models (/world3d, src/lib/components/world3d): NH's own trees, bushes, flowers, rocks, the
// bridge, the campsite's tent, the lamps and the outdoor furniture, from the game files the user supplied (the same
// `<Model>.Nin_NX_NVN` folders scripts/models.ts and scripts/room-models.ts read), converted the tent's way
// (scripts/world3d-page.js: NH's materials baked into one WebP each, merged per material; gltfpack quantises and
// meshopt-compresses) into static/room/world3d/<name>.glb (under /room/: the service worker caches it on first use,
// never at install), plus src/lib/components/world3d/models.json (each model's bounds and bytes).
//
// Usage (from app/): NH_MODELS=~/Downloads/Model npm run world3d-models [-- --only=oak,cedar]
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
import { ASSETS, POC_USES, writeAssets, writeDoc, type Use } from './world3d-assets.ts';
import { fxGltf, type Fx } from './world3d-fx.ts';

const APP = join(import.meta.dirname, '..');
/** Try a list of jobs from a JSON file instead (`--probe=jobs.json --out=dir`): GLBs only, the manifests untouched. */
const probe = process.argv.find((a) => a.startsWith('--probe='))?.slice(8);
const OUT = probe ? resolve(process.argv.find((a) => a.startsWith('--out='))?.slice(6) ?? join(tmpdir(), 'world3d-probe')) : join(APP, 'static', 'room', 'world3d');
const META = join(APP, 'src', 'lib', 'components', 'world3d', 'models.json');
const arg = (k: string) => process.argv.find((a) => a.startsWith(`--${k}=`))?.slice(k.length + 3);
const only = (arg('only') ?? '').split(',').filter(Boolean);
/** Triangles over this are simplified (gltfpack -si). */
const TRIS = 5000;

interface Job {
  name: string;
  /** [folder, .dae, where it sits: [up (model units), scale, across, nearer]] (a snowboy's face on its body). */
  parts: ([folder: string, dae: string] | [folder: string, dae: string, at: [number, number] | [number, number, number, number]])[];
  /** Colour folders (a furniture's <Ftr>ReBody<n>). */
  tex?: string[];
  grdRow?: number;
  grdRows?: Record<string, number>;
  grdBlock?: [number, number];
  /** Longest texture side (px). */
  maxTex?: number;
  hide?: string[];
  tris?: number;
  /** A material's textures by another name. */
  alias?: Record<string, string>;
  /** Where the GLB goes under static/room/world3d/ (default: its name): a subfolder per kind (`critters/koi`). */
  file?: string;
  /** Untextured materials drawn as one flat colour [rgb, opacity] (a fish's shadow) instead of a glass pane. */
  flat?: [number, number];
  /** The pose's joints turned (degrees about x, y, z), as scripts/models.ts poses them. */
  pose?: Record<string, [number, number, number]>;
  /** A material's gradient by name (regex of the material → regex of the gradient's file): a flower's petals and stem. */
  grdFile?: Record<string, string>;
  /** Its textures' variant (`<mat>_Alb.<n>.png`: a balloon's colours). */
  variant?: number;
  /** The winter look: the snow meshes (mWinterSnow) drawn. */
  snow?: boolean;
  /** No occlusion baked in (the snowboy: NH's snow is white). */
  noAo?: boolean;
  /** Not NH's: one of scripts/world3d-fx.ts's stylised effects (a sparkle, a splash). */
  fx?: Fx;
  /** The art keys it serves (scripts/world3d-assets.ts: the island's things, into assets.json; not the POC's models.json). */
  uses?: Use[];
}
const ftr = (name: string, model: string, body = 0, extra: Partial<Job> = {}): Job => ({ name, parts: [[model, model]], tex: [`${model}ReBody${body}`, `${model}ReFabric0`], ...extra });

const JOBS: Job[] = [
  // trees (stage 4: grown), the gradient's row the time of year (scripts/models.ts ROW)
  { name: 'oak-summer', parts: [['PltTreeOak', 'PltTreeOak4']], grdRow: 0.5 },
  { name: 'oak-fall', parts: [['PltTreeOak', 'PltTreeOak4']], grdRow: 0.9 },
  { name: 'oak-spring', parts: [['PltTreeOakSakura', 'PltTreeOak4Sakura']], grdRow: 0.3 },
  { name: 'cedar', parts: [['PltTreeCedar', 'PltTreeCedar4']], grdRow: 0.3 },
  { name: 'palm', parts: [['PltTreePalm', 'PltTreePalm4']], grdRow: 0.5 },
  { name: 'bamboo', parts: [['PltTreeBamboo', 'PltTreeBamboo4']], grdRow: 0.5 },
  // bushes in bloom (stage 3); the plumeria isn't in the files: NH's azaleas stand in, white and pink
  { name: 'bush-holly', parts: [['PltBushHolly', 'PltBushHolly3']], grdRows: { Flow: 0.03 } },
  { name: 'bush-white-azalea', parts: [['PltBushAzalea', 'PltBushAzalea3']], grdRows: { Petal: 0.03 } },
  { name: 'bush-pink-azalea', parts: [['PltBushAzalea', 'PltBushAzalea3']], grdRows: { Petal: 0.09 } },
  { name: 'bush-red-hibiscus', parts: [['PltBushHibiscus', 'PltBushHibiscus3']], grdRows: { Flow: 0.03 } },
  { name: 'bush-orange-tea-olive', parts: [['PltBushOsmanthus', 'PltBushOsmanthus3']], grdRows: { Flow: 0.09 } },
  // wild flowers in bloom (stage 2): the petals' lightest row, tinted per instance at runtime
  ...(['Tulip', 'Hyacinth', 'Yuri', 'Rose', 'Cosmos', 'Mum', 'Pansy', 'Anemone'] as const).map((k): Job => ({ name: `flower-${k.toLowerCase()}`, parts: [[`PltFlw${k}`, `PltFlw${k}2`]], grdRow: 0.02, grdRows: { Body: 0.75, Leaf: 0.75 }, maxTex: 128 })),
  // rocks, the bridge, the campsite
  { name: 'rock', parts: [['StoneA', 'stoneA']] },
  { name: 'garden-rock', parts: [['FtrGardenrock', 'FtrGardenrock']] },
  { name: 'flat-rock', parts: [['FtrGardenrockLow', 'FtrGardenrockLow']] },
  { name: 'bridge-stone', parts: [['BridgeStone', 'BridgeStone03']], tris: 8000 },
  { name: 'tent', parts: [['StrcCampsiteTentA00', 'StrcCampsiteTentA00'], ['StrcCampsiteTentA00', 'StrcCampsiteTentA00Door0']], maxTex: 512, tris: 8000 },
  // the lamps (their _Emi lights at night), the campfire, the furniture
  ftr('streetlamp', 'FtrStreetlamp'),
  ftr('garden-lantern', 'FtrLampGarden'),
  ftr('garden-lantern-white', 'FtrLampGarden', 1),
  ftr('campfire', 'FtrCampfire'),
  ftr('log-stool', 'FtrLogStoolS'),
  ftr('campsite-sign', 'FtrCompassSignCamp'),
  ftr('park-bench', 'FtrParkbenche'),
  ftr('log-bench', 'FtrLogSofaL'),
  ftr('rod-stand', 'FtrRodstand'),
  ftr('hammock', 'FtrHammock'),
  ftr('firewood', 'FtrFirewood'),
  ftr('pullup', 'FtrPullupstand', 1),
  ftr('pump', 'FtrHandpump'),
  ftr('shishiodoshi', 'FtrShishiodoshi'),
  ftr('tape-deck', 'FtrRadicase'),
  // the goal trees' fruit (NH's dropped-fruit models)
  ...(['Pear', 'Peach', 'Cherry', 'Apple'] as const).map((k): Job => ({
    name: `fruit-${k.toLowerCase()}`, parts: [[`UnitIconPltFruit${k}`, `UnitIconPltFruit${k}`]], maxTex: 128,
    alias: { mPear: 'mPltFruitFruitPear', mPltFruitPeach: 'mUnitIconPltFruitPeach', mPltFruitCherry02: 'mUnitIconPltFruitCherry02' }
  }))
];

const MODELS = process.env.NH_MODELS?.replace(/^~(?=\/)/, process.env.HOME ?? '~');
if (!MODELS || !existsSync(MODELS)) {
  console.error('Set NH_MODELS to the folder of NH model folders (<Model>.Nin_NX_NVN), e.g. NH_MODELS=~/Downloads/Model node scripts/world3d-models.ts');
  process.exit(1);
}
const ROOT: string = MODELS;
const F = (n: string) => `${n}.Nin_NX_NVN`;
const SAFE = /^[A-Za-z0-9_]+$/;
const has = (folder: string) => SAFE.test(folder) && existsSync(join(ROOT, F(folder)));

if (probe) JOBS.splice(0, JOBS.length, ...(JSON.parse(readFileSync(probe, 'utf8')) as Job[]));
else JOBS.push(...ASSETS);
const todo = JOBS.filter((j) => !only.length || only.some((o) => j.name.includes(o)));
const scratch = mkdtempSync(join(tmpdir(), 'nh-world3d-'));
const work = mkdtempSync(join(tmpdir(), 'nh-world3d-out-'));
const copy = (folder: string) => {
  const dst = join(scratch, F(folder));
  if (existsSync(dst)) return;
  mkdirSync(dst);
  const src = join(ROOT, F(folder));
  for (const n of readdirSync(src)) if (/^[A-Za-z0-9_]+(\.[0-9]+)?\.(dae|png)$/.test(n) && statSync(join(src, n)).isFile()) cpSync(join(src, n), join(dst, n));
};
for (const j of todo) {
  for (const [f, d] of j.parts) if (!has(f) || !SAFE.test(d)) throw new Error(`${j.name}: no model ${f}/${d}`);
  j.tex = (j.tex ?? []).filter(has);
  for (const f of [...j.parts.map((p) => p[0]), ...j.tex]) copy(f);
}
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

interface Meta { min: number[]; max: number[]; tris: number; kb: number; v: string; lit?: 1 }
const metas: Record<string, Meta> = existsSync(META) ? (JSON.parse(readFileSync(META, 'utf8')) as { models: Record<string, Meta> }).models : {};
const ASSET_META = join(dirname(META), 'assets.json');
/** The island's things' models (assets.json `models`; the POC's stay in models.json too). */
const assetMetas: Record<string, Meta> = existsSync(ASSET_META) ? (JSON.parse(readFileSync(ASSET_META, 'utf8')) as { models: Record<string, Meta> }).models : {};
let total = 0;
for (const j of todo) {
  const files = [...j.tex!, ...new Set(j.parts.map((p) => p[0]))].map((f) => [F(f), readdirSync(join(scratch, F(f)))]);
  const r = j.fx ? { ...fxGltf(j.fx), lit: j.fx === 'flame' } : await page.evaluate((o) => (window as unknown as { convert: (o: unknown) => Promise<{ gltf: string; box: [number[], number[]]; tris: number; lit: boolean }> }).convert(o), {
    parts: j.parts.map(([f, d, at]) => ({ folder: F(f), dae: `${d}.dae`, at })), files, maxTex: j.maxTex ?? 256, maxEmi: 128,
    grdRow: j.grdRow, grdRows: j.grdRows, grdBlock: j.grdBlock, hide: j.hide, alias: j.alias, flat: j.flat, pose: j.pose, grdFile: j.grdFile, snow: j.snow, variant: j.variant, noAo: j.noAo
  });
  const g = JSON.parse(r.gltf) as { buffers: { uri: string }[]; images?: { uri?: string; mimeType?: string }[]; textures?: { source?: number; extensions?: object }[]; extensionsUsed?: string[]; extensionsRequired?: string[] };
  const dir = join(work, j.name);
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });
  g.buffers.forEach((b, i) => {
    writeFileSync(join(dir, `b${i}.bin`), Buffer.from(b.uri.split(',')[1], 'base64'));
    b.uri = `b${i}.bin`;
  });
  (g.images ?? []).forEach((im, i) => {
    const png = join(dir, `i${i}.png`);
    writeFileSync(png, Buffer.from(im.uri!.split(',')[1], 'base64'));
    webp(png, join(dir, `i${i}.webp`), 78);
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
  const out = join(OUT, `${j.name}.glb`);
  mkdirSync(dirname(out), { recursive: true });
  const max = j.tris ?? TRIS;
  const si = r.tris > max ? ['-si', (max / r.tris).toFixed(3)] : [];
  execFileSync('node', [GLTFPACK, '-i', join(dir, 'm.gltf'), '-o', out, '-cc', '-ce', 'ext', ...si]);
  const bytes = statSync(out).size;
  total += bytes;
  const v = createHash('sha256').update(readFileSync(out)).digest('hex').slice(0, 8);
  (j.uses ? assetMetas : metas)[j.name] = { min: r.box[0].map((n) => +n.toFixed(2)), max: r.box[1].map((n) => +n.toFixed(2)), tris: Math.min(r.tris, max), kb: +(bytes / 1024).toFixed(1), v, ...(r.lit ? { lit: 1 as const } : {}) };
  if (process.env.PARTS) console.log(JSON.stringify((r as unknown as { parts: unknown }).parts));
  console.log(`${j.name}: ${(bytes / 1024).toFixed(1)} KB, ${r.tris} tris${si.length ? ` → ${max}` : ''}${r.lit ? ', lit' : ''}, h ${(r.box[1][1] - r.box[0][1]).toFixed(1)}`);
}
await browser.close();
if (probe) {
  // the scratch copies of NH's files never outlive the run
  rmSync(scratch, { recursive: true, force: true });
  rmSync(work, { recursive: true, force: true });
  console.log(`${todo.length} models, ${(total / 1024 / 1024).toFixed(2)} MB → ${OUT}`);
  process.exit(0);
}
for (const k of Object.keys(assetMetas)) if (!JOBS.some((j) => j.name === k && j.uses)) delete assetMetas[k];
writeAssets(ASSET_META, assetMetas, metas, POC_USES, JOBS.filter((j) => j.uses).map((j) => [j.name, j.uses!] as const));
writeDoc(join(APP, '..', 'docs', 'world3d-assets.md'), ASSET_META);
const sorted = Object.fromEntries(Object.entries(metas).sort(([a], [b]) => a.localeCompare(b)));
writeFileSync(META, `{\n  "_": "scripts/world3d-models.ts: the 3D island POC's models (bounds in model units, triangles, KB, content hash)",\n  "models": {\n${Object.entries(sorted).map(([k, m]) => `    ${JSON.stringify(k)}: ${JSON.stringify(m)}`).join(',\n')}\n  }\n}\n`);
console.log(`${todo.length} models, ${(total / 1024 / 1024).toFixed(2)} MB`);
rmSync(scratch, { recursive: true, force: true });
rmSync(work, { recursive: true, force: true });
