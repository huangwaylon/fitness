// The island's 3D-rendered art (docs/design.md "Official art: the 3D renders"): NH's own models (Collada .dae with
// PNG textures, one folder per model, named `<Model>.Nin_NX_NVN`) rendered to WebP sprites at the world's view angle,
// under the art keys the scene already uses (static/art/<key>.webp and static/art/manifest.json, source "rendered"),
// plus where each sprite stands (src/lib/components/island/models.json: its feet or door point as fractions of the
// image, and its size in model units for NH's proportions).
//
// Usage (from app/): NH_MODELS=~/Downloads/Model npm run models [-- --only=trees/,deco/campsite --png=/tmp/x]
// The model folder is untrusted input and never part of the repo: only the folders the list below names are copied
// into a scratch dir first (nothing in them is run; textures and .dae are only read by three.js in the page), and only
// the rendered WebPs are written. Needs Google Chrome (Playwright's channel 'chrome') and cwebp (brew install webp).
// The page (scripts/models-page.js) does the rendering: see there for the materials and the light.
import { chromium } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, extname, join, resolve, sep } from 'node:path';
import { createRequire } from 'node:module';

const APP = join(import.meta.dirname, '..');
const ART = join(APP, 'static', 'art');
const MANIFEST = join(ART, 'manifest.json');
const PLACES = join(APP, 'src', 'lib', 'components', 'island', 'models.json');
const arg = (k: string) => process.argv.find((a) => a.startsWith(`--${k}=`))?.slice(k.length + 3);
const only = (arg('only') ?? '').split(',').filter(Boolean);
const pngDir = arg('png');
/** Try a list of jobs from a JSON file instead (`--probe=jobs.json`): only PNGs (to --png), nothing in static/. */
const probe = arg('probe');

type Out = 'day' | 'winter' | 'lit' | 'trunk' | 'canopy';
interface Look {
  /** The art key of its day image; the others add -winter, -lit, -trunk, -canopy. */
  key: string;
  /** [model folder (without .Nin_NX_NVN), .dae name (without .dae)]. */
  parts: [string, string][];
  /** Folders whose textures it also reads (a furniture body's colour: <Ftr>ReBody<n>; a sign's language). */
  tex?: string[];
  outputs: Out[];
  /** The _Grd gradient's row (0 top … 1 bottom): the time of year NH tints leaves and trunks by. */
  grdRow?: number;
  /** Rows for some materials instead (regex of the material name → row): a bush's flower colour. */
  grdRows?: Record<string, number>;
  /** The gradient's columns to read [u0, width] (a gradient holding two ramps side by side). */
  grdBlock?: [number, number];
  /** Snow meshes on in every output (a *Snow model). */
  snowAlways?: boolean;
  /** Mesh or material names left out. */
  hide?: string[];
}
interface Job {
  looks: Look[];
  /** Image height in px (the day look's crop; the rest share it). About 3 px per world unit of the sprite's height. */
  px: number;
  /** Camera pitch (degrees down): 30 for the upright sprites, 90 for ground pieces seen from above. */
  pitch?: number;
  rotY?: number;
  /** The point the sprite stands on: the door's foot (DoorModel0) or the model's origin on the ground. */
  anchor?: 'door' | 'origin';
  /** The lit pass's weight per material (NH lights a whole tent's canvas a little, a lamp's glass fully). */
  emiW?: Record<string, number>;
  emiDefault?: number;
  halo?: number;
}

// NH's rows of the time of year in a tree's gradient (48 rows: 12 months × 4): spring green, summer, the fall colours.
const ROW = { spring: 0.3, summer: 0.5, fall: 0.9 } as const;
const tree = (base: string, model: string, seasons: { spring?: string; summer: string; fall?: string; winter?: string }, outputs: Out[], px: number, rows: Partial<Record<keyof typeof ROW, number>> = {}): Job => ({
  px,
  anchor: 'origin',
  looks: [
    ...(seasons.spring ? [{ key: seasons.spring, parts: [[model + 'Sakura', `${base}4Sakura`]] as [string, string][], outputs, grdRow: rows.spring ?? ROW.spring }] : []),
    { key: seasons.summer, parts: [[model, `${base}4`]], outputs, grdRow: rows.summer ?? ROW.summer },
    ...(seasons.fall ? [{ key: seasons.fall, parts: [[model, `${base}4`]] as [string, string][], outputs, grdRow: rows.fall ?? ROW.fall }] : []),
    ...(seasons.winter ? [{ key: seasons.winter, parts: [[model + 'Snow', `${base}4Snow`]] as [string, string][], outputs, snowAlways: true }] : [])
  ]
});
const prop = (key: string, model: string, body: string | null, outputs: Out[], px: number, extra: Partial<Job> = {}): Job => ({
  px, anchor: 'origin', ...extra, looks: [{ key, parts: [[model, model]], tex: body ? [body] : [], outputs }]
});

export const JOBS: Job[] = [
  // the campsite (the tent and its deck; the door is the tent's): the canvas glows faintly at night, the door and lantern fully
  {
    px: 220, anchor: 'door', emiW: { mTent: 0.18, mDoortent: 1, mWoodDeck: 1 }, halo: 0.6,
    looks: [{ key: 'deco/campsite', parts: [['StrcCampsiteTentA00', 'StrcCampsiteTentA00'], ['StrcCampsiteTentA00', 'StrcCampsiteTentA00Door0']], outputs: ['day', 'winter', 'lit'] }]
  },
  // trees: the oak's four seasons (spring: NH's cherry blossom model) as trunk and canopy layers, the cedar, palm, bamboo
  { ...tree('PltTreeOak', 'PltTreeOak', { spring: 'trees/oak-spring', summer: 'trees/oak-summer', fall: 'trees/oak-fall', winter: 'trees/oak-winter' }, ['day', 'trunk', 'canopy'], 420) },
  // the cedar's summer row is a dark blue-green: its spring row is NH's familiar cedar green
  tree('PltTreeCedar', 'PltTreeCedar', { summer: 'trees/cedar', winter: 'trees/cedar-winter' }, ['day'], 450, { summer: 0.3 }),
  tree('PltTreePalm', 'PltTreePalm', { summer: 'trees/palm', winter: 'trees/palm-winter' }, ['day'], 360),
  tree('PltTreeBamboo', 'PltTreeBamboo', { summer: 'trees/bamboo', winter: 'trees/bamboo-winter' }, ['day'], 220),
  // lamps: the head's glass is all that lights
  prop('deco/streetlamp', 'FtrStreetlamp', 'FtrStreetlampReBody0', ['day', 'lit'], 150, { halo: 1.4 }),
  prop('deco/garden-lantern', 'FtrLampGarden', 'FtrLampGardenReBody0', ['day', 'lit'], 90, { halo: 1.4 }),
  prop('deco/garden-lantern-white', 'FtrLampGarden', 'FtrLampGardenReBody1', ['day', 'lit'], 90, { halo: 1.4 }),
  // rocks
  prop('deco/garden-rock', 'FtrGardenrock', null, ['day'], 80),
  prop('deco/flat-rock', 'FtrGardenrockLow', null, ['day'], 60),
  // bushes in bloom (stage 3), the colour a row of the flowers' gradient; winter: NH's snowy bush
  ...([
    ['white-azalea', 'Azalea', 'Petal', 0.03, 2], ['pink-azalea', 'Azalea', 'Petal', 0.09, 2],
    ['red-hibiscus', 'Hibiscus', 'Flow', 0.03, 2], ['yellow-hibiscus', 'Hibiscus', 'Flow', 0.09, 2],
    ['blue-hydrangea', 'Hydrangea', 'Petal', 0.03, 2], ['pink-hydrangea', 'Hydrangea', 'Petal', 0.09, 2],
    ['yellow-tea-olive', 'Osmanthus', 'Flow', 0.03, 2], ['orange-tea-olive', 'Osmanthus', 'Flow', 0.09, 2],
    ['red-camellia', 'Camellia', 'Flow', 0.03, 2], ['pink-camellia', 'Camellia', 'Flow', 0.09, 2],
    ['holly', 'Holly', 'Flow', 0.03, 4]
  ] as const).map(([id, sp, part, row, snow]): Job => ({
    px: 120, anchor: 'origin',
    looks: [
      { key: `bushes/${id}`, parts: [[`PltBush${sp}`, `PltBush${sp}3`]], outputs: ['day'], grdRows: { [part]: row } },
      { key: `bushes/${id}-winter`, parts: [[`PltBush${sp}Snow`, `PltBush${sp}${snow}Snow`]], outputs: ['day'], snowAlways: true }
    ]
  }))
];

// ---- the run ------------------------------------------------------------------------------------------------------

const MODELS = process.env.NH_MODELS?.replace(/^~(?=\/)/, process.env.HOME ?? '~');
if (!MODELS || !existsSync(MODELS)) {
  console.error('Set NH_MODELS to the folder of NH model folders (<Model>.Nin_NX_NVN), e.g. NH_MODELS=~/Downloads/Model npm run models');
  process.exit(1);
}
const jobs = (probe ? (JSON.parse(readFileSync(probe, 'utf8')) as Job[]) : JOBS).filter((j) => !only.length || j.looks.some((l) => only.some((o) => l.key.startsWith(o))));
const F = (n: string) => `${n}.Nin_NX_NVN`;
const SAFE = /^[A-Za-z0-9_]+$/;
const folders = [...new Set(jobs.flatMap((j) => j.looks.flatMap((l) => [...l.parts.map((p) => p[0]), ...(l.tex ?? [])])))];
for (const f of [...folders, ...jobs.flatMap((j) => j.looks.flatMap((l) => l.parts.map((p) => p[1])))]) if (!SAFE.test(f)) throw new Error(`bad model name ${f}`);

// copy only the named folders (only their .dae and .png files) into a scratch dir
const scratch = mkdtempSync(join(tmpdir(), 'nh-models-'));
const SHARED = ['StrcShareTexture', 'PltShareTexture', 'BridgeShareTexture', 'FenceShareTexture'];
for (const f of [...folders, ...SHARED]) {
  const src = join(MODELS, F(f));
  if (!existsSync(src)) {
    if (SHARED.includes(f)) continue;
    throw new Error(`missing model folder ${src}`);
  }
  mkdirSync(join(scratch, F(f)));
  for (const n of readdirSync(src)) if (/^[A-Za-z0-9_]+\.(dae|png)$/.test(n) && statSync(join(src, n)).isFile()) cpSync(join(src, n), join(scratch, F(f), n));
}

const three = join(dirname(createRequire(import.meta.url).resolve('three')), '..');
const PAGE = join(import.meta.dirname, 'models-page.js');
const MIME: Record<string, string> = { '.js': 'text/javascript', '.png': 'image/png', '.dae': 'model/vnd.collada+xml' };
const browser = await chromium.launch({ channel: 'chrome', args: ['--enable-gpu', '--ignore-gpu-blocklist'] });
const page = await browser.newPage();
page.on('pageerror', (e) => console.error('[page]', e.message));
await page.route('http://models.local/**', (route) => {
  const u = decodeURIComponent(new URL(route.request().url()).pathname);
  const within = (root: string, rel: string) => {
    const f = resolve(root, rel);
    return f.startsWith(root + sep) ? f : null;
  };
  const f = u === '/page.js' ? PAGE : u.startsWith('/three/') ? within(three, u.slice(7)) : u.startsWith('/src/') ? within(scratch, u.slice(5)) : null;
  if (u === '/') return route.fulfill({ contentType: 'text/html', body: '<!doctype html><script type="importmap">{"imports":{"three":"/three/build/three.module.js","three/addons/":"/three/examples/jsm/"}}</script><style>body{margin:0}</style><script type="module" src="/page.js"></script>' });
  if (!f || !existsSync(f)) return route.fulfill({ status: 404, body: '' });
  return route.fulfill({ body: readFileSync(f), contentType: MIME[extname(f)] ?? 'application/octet-stream' });
});
await page.goto('http://models.local/');
await page.waitForFunction(() => (window as unknown as { ready?: boolean }).ready);

const SUFFIX: Record<Out, string> = { day: '', winter: '-winter', lit: '-lit', trunk: '-trunk', canopy: '-canopy' };
const manifest = JSON.parse(readFileSync(MANIFEST, 'utf8')) as { version: number; files: Record<string, { path: string; w: number; h: number; source: string }> };
const places = (existsSync(PLACES) ? JSON.parse(readFileSync(PLACES, 'utf8')) : {}) as Record<string, { ax: number; ay: number; mu: [number, number]; inset?: [number, number, number, number] }>;
const tmp = mkdtempSync(join(tmpdir(), 'nh-renders-'));
const t0 = Date.now();
const report: string[] = [];
for (const j of jobs) {
  const looks = j.looks.map((l) => {
    const fs = [...(l.tex ?? []), ...l.parts.map((p) => p[0]), ...SHARED].filter((f, i, a) => a.indexOf(f) === i && existsSync(join(scratch, F(f))));
    return { name: l.key, parts: l.parts.map(([f, d]) => ({ folder: F(f), dae: `${d}.dae` })), files: fs.map((f) => [F(f), readdirSync(join(scratch, F(f)))]), outputs: l.outputs, grdRow: l.grdRow ?? ROW.summer, grdRows: l.grdRows, grdBlock: l.grdBlock, snowAlways: l.snowAlways, hide: l.hide };
  });
  const r = await page.evaluate((o) => (window as unknown as { renderSet: (o: unknown) => Promise<{ images: Record<string, string>; opaque: Record<string, number[]>; w: number; h: number; anchor: [number, number]; units: [number, number]; tris: number[]; ms: { total: number } }> }).renderSet(o), {
    looks, pitch: j.pitch ?? 30, rotY: j.rotY, targetH: j.px, nrm: 0.6, aoI: 0.6, anchor: j.anchor ?? 'origin', emiW: j.emiW, emiDefault: j.emiDefault, halo: j.halo
  });
  let bytes = 0;
  for (const [id, url] of Object.entries(r.images)) {
    const [lk, out] = id.split('|') as [string, Out];
    const key = lk + SUFFIX[out];
    const look = j.looks.find((l) => l.key === lk)!;
    const png = join(tmp, `${key.replace(/\//g, '__')}.png`);
    writeFileSync(png, Buffer.from(url.split(',')[1], 'base64'));
    if (pngDir) { mkdirSync(pngDir, { recursive: true }); cpSync(png, join(pngDir, `${key.replace(/\//g, '__')}.png`)); }
    if (probe) continue;
    const dest = join(ART, `${key}.webp`);
    mkdirSync(dirname(dest), { recursive: true });
    execFileSync('cwebp', ['-quiet', '-q', '86', '-alpha_q', '90', '-m', '6', '-sharp_yuv', png, '-o', dest]);
    bytes += statSync(dest).size;
    manifest.files[key] = { path: `${key}.webp`, w: r.w, h: r.h, source: `rendered from NH's model ${look.parts.map((p) => p[1]).join(' + ')} (scripts/models.ts)` };
    const inset = r.opaque[id]?.map((f) => +(f * 100).toFixed(1)) as [number, number, number, number] | undefined;
    places[key] = { ax: +(r.anchor[0] / r.w).toFixed(4), ay: +(r.anchor[1] / r.h).toFixed(4), mu: [+r.units[0].toFixed(1), +r.units[1].toFixed(1)], ...(inset && { inset }) };
  }
  report.push(`${j.looks.map((l) => l.key).join(', ')}: ${r.w}×${r.h}, ${Object.keys(r.images).length} images, ${(bytes / 1024).toFixed(1)} KB, ${r.tris.join('/')} tris, ${r.ms.total} ms`);
  console.log(report[report.length - 1]);
}
await browser.close();
if (probe) {
  rmSync(scratch, { recursive: true, force: true });
  rmSync(tmp, { recursive: true, force: true });
  process.exit(0);
}
manifest.files = Object.fromEntries(Object.entries(manifest.files).sort(([a], [b]) => a.localeCompare(b)));
manifest.version += 1;
writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2) + '\n');
writeFileSync(PLACES, `{\n${Object.entries(places).sort(([a], [b]) => a.localeCompare(b)).map(([k, v]) => `  ${JSON.stringify(k)}: ${JSON.stringify(v)}`).join(',\n')}\n}\n`);
rmSync(scratch, { recursive: true, force: true });
rmSync(tmp, { recursive: true, force: true });
console.log(`${jobs.length} models, ${((Date.now() - t0) / 1000).toFixed(1)} s`);
