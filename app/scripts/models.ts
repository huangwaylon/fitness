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
  /** [model folder (without .Nin_NX_NVN), .dae name (without .dae), and where it sits: [up (model units), scale]]. */
  parts: ([string, string] | [string, string, [number, number]])[];
  /** Joints turned (degrees about their x, y, z): a pose (the shishi-odoshi's tube tipped). */
  pose?: Record<string, [number, number, number]>;
  /** Folders whose textures it also reads (a furniture body's colour: <Ftr>ReBody<n>; a sign's language). */
  tex?: string[];
  outputs: Out[];
  /** Measured only (its feet point and box into models.json: a DOM tap area's place and width), no art written: what
   *  only the 3D island draws (a decoration's turned facings). */
  placeOnly?: boolean;
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
  /** A material's textures by another name (NH's fruit icons). */
  alias?: Record<string, string>;
  /** The albedos' alpha isn't an opacity (NH's item icons): drawn solid. */
  opaque?: boolean;
}
interface Job {
  looks: Look[];
  /** Image height in px (the day look's crop; the rest share it). About 3 px per world unit of the sprite's height. */
  px: number;
  /** Or a fixed scale, px per model unit (a decoration's four facings: one size whatever its crop). */
  ppu?: number;
  /** Camera pitch (degrees down): 30 for the upright sprites, 90 for ground pieces seen from above. */
  pitch?: number;
  rotY?: number;
  /** The point the sprite stands on: the door's foot (DoorModel0) or the model's origin on the ground. */
  anchor?: 'door' | 'origin';
  /** The lit pass's weight per material (NH lights a whole tent's canvas a little, a lamp's glass fully). */
  emiW?: Record<string, number>;
  emiDefault?: number;
  halo?: number;
  /** An icon: the image centred on a pad × pad square (px). */
  pad?: number;
  /** An icon's dark rim [px, CSS colour]. */
  outline?: [number, string];
  /** The lights' strengths (scripts/models-page.js: hemi, key, fill, amb). */
  light?: { hemi?: number; key?: number; fill?: number; amb?: number };
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
    looks: [{ key: 'deco/campsite', parts: [['StrcCampsiteTentA00', 'StrcCampsiteTentA00'], ['StrcCampsiteTentA00', 'StrcCampsiteTentA00Door0']], outputs: ['day'] }]
  },
  // trees: the oak's four seasons (spring: NH's cherry blossom model) as trunk and canopy layers, the cedar, palm, bamboo
  { ...tree('PltTreeOak', 'PltTreeOak', { spring: 'trees/oak-spring', summer: 'trees/oak-summer', fall: 'trees/oak-fall', winter: 'trees/oak-winter' }, ['day', 'trunk', 'canopy'], 420) },
  // the cedar's summer row is a dark blue-green: its spring row is NH's familiar cedar green
  tree('PltTreeCedar', 'PltTreeCedar', { summer: 'trees/cedar', winter: 'trees/cedar-winter' }, ['day'], 450, { summer: 0.3 }),
  tree('PltTreePalm', 'PltTreePalm', { summer: 'trees/palm', winter: 'trees/palm-winter' }, ['day'], 360),
  tree('PltTreeBamboo', 'PltTreeBamboo', { summer: 'trees/bamboo', winter: 'trees/bamboo-winter' }, ['day'], 220),
  // lamps: the head's glass is all that lights
  prop('deco/streetlamp', 'FtrStreetlamp', 'FtrStreetlampReBody0', ['day'], 150, { halo: 1.4 }),
  prop('deco/garden-lantern', 'FtrLampGarden', 'FtrLampGardenReBody0', ['day'], 90, { halo: 1.4 }),
  prop('deco/garden-lantern-white', 'FtrLampGarden', 'FtrLampGardenReBody1', ['day'], 90, { halo: 1.4 }),
  // the campfire by the tent (its flames are the model's emissive: the lit look) and its log stools
  // (at the decor's scale: island/world.ts DECOR_U)
  prop('deco/campfire', 'FtrCampfire', null, ['day'], 0, { halo: 1.2, ppu: 9 }),
  prop('deco/log-stool', 'FtrLogStoolS', 'FtrLogStoolSReBody0', ['day'], 0, { ppu: 9 }),
  // rocks
  prop('deco/garden-rock', 'FtrGardenrock', null, ['day'], 80),
  prop('deco/flat-rock', 'FtrGardenrockLow', null, ['day'], 60),
  // the stone bridge (NH's BridgeStone03, three tiles long) seen level: the layout tray's and the editor's icon
  { px: 120, anchor: 'origin', pitch: 0, rotY: 90, looks: [{ key: 'bridges/stone-front', parts: [['BridgeStone', 'BridgeStone03']], outputs: ['day'] }] },
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

// the decorations (island/decor.ts DECOR_ART; docs/design.md "Decorating"): NH's outdoor furniture, each in its four
// facings (f × 90° about the up axis: toward the camera, its right, away, its left), at one scale (px per model unit:
// DECOR_U u per unit × 3 px per u) so the facings stand the same size, its body's first colour. Facing 0 is art (the
// tray's icon); the others are only measured (models.json: the tap area's width over the 3D island's model)
const DECOR_PPU = 3 * 3;
const DECOR: [string, string][] = [
  ['stone-lantern', 'FtrStonelantern'], ['birdbath', 'FtrBirdbus'], ['garden-wagon', 'FtrGardenwagon'], ['iron-table', 'FtrIrongardenTable'],
  ['iron-chair', 'FtrIrongardenChair'], ['brick-well', 'FtrWellBrick'], ['tanuki', 'FtrOrnamentTanuki'], ['monstera', 'FtrPlantMonstera'],
  ['signpost', 'FtrSignpost'], ['wheelbarrow', 'FtrHandcart']
];
JOBS.push(...DECOR.flatMap(([id, model]) => [0, 1, 2, 3].map((f): Job => ({
  px: 0, ppu: DECOR_PPU, anchor: 'origin', rotY: f * 90,
  looks: [{ key: `decor/${id}-${f}`, parts: [[model, model]], tex: [`${model}ReBody0`, `${model}ReFabric0`], outputs: ['day'], placeOnly: f !== 0 }]
}))));

// the fixed decor (island/world.ts DECOR, docs/design.md "Decor"): NH's outdoor furniture at the decorations' scale
// (one family: DECOR_U u per model unit, 3 px per u), each in its first colour unless a later one suits the spot
const FIX: Partial<Job> = { ppu: DECOR_PPU };
const fixed = (key: string, model: string, tex: string[], outputs: Out[] = ['day'], extra: Partial<Job> = {}): Job => ({
  px: 0, anchor: 'origin', ...FIX, ...extra, looks: [{ key, parts: [[model, model]], tex, outputs }]
});
JOBS.push(
  fixed('deco/park-bench', 'FtrParkbenche', ['FtrParkbencheReBody0']),
  fixed('deco/log-bench', 'FtrLogSofaL', ['FtrLogSofaLReBody0', 'FtrLogSofaLReFabric0']),
  fixed('deco/rod-stand', 'FtrRodstand', ['FtrRodstandReBody0']),
  fixed('deco/hammock', 'FtrHammock', ['FtrHammockReBody0', 'FtrHammockReFabric0']),
  fixed('deco/firewood', 'FtrFirewood', []),
  fixed('deco/pullup', 'FtrPullupstand', ['FtrPullupstandReBody1']),
  fixed('deco/pump', 'FtrHandpump', ['FtrHandpumpReBody0']),
  // the shishi-odoshi at rest and tipped (its tube's joint turned): one camera, so the two frames line up
  {
    px: 0, anchor: 'origin', ...FIX,
    looks: [
      { key: 'deco/shishiodoshi', parts: [['FtrShishiodoshi', 'FtrShishiodoshi']], tex: ['FtrShishiodoshiReBody0'], outputs: ['day'] },
      { key: 'deco/shishiodoshi-tip', parts: [['FtrShishiodoshi', 'FtrShishiodoshi']], tex: ['FtrShishiodoshiReBody0'], outputs: ['day'], pose: { Shishiodoshi: [35, 0, 0] } }
    ]
  },
  // the seasons' pieces
  fixed('deco/pond-stone-sakura', 'FtrStonewaterbowlSakura', []),
  fixed('deco/pond-stone-maple', 'FtrStonewaterbowlAutumun', []),
  fixed('deco/picnic-set', 'FtrSakuraPicnicset', []),
  fixed('deco/bamboo-shoot-lamp', 'FtrBambooshootLamp', [], ['day'], { halo: 1.2 }),
  fixed('deco/mushroom-lamp', 'FtrMushroomLamp', ['FtrMushroomLampReBody0'], ['day'], { halo: 1.2 }),
  fixed('deco/nut-lamp', 'FtrNutLamp', ['FtrNutLampReBody0'], ['day'], { halo: 1.2 }),
  fixed('deco/beach-chair', 'FtrBeachbed', ['FtrBeachbedReBody2']),
  fixed('deco/sandcastle', 'FtrSandcastle', ['FtrSandcastleReBody0']),
  fixed('deco/illumi-tree', 'FtrIllumiTree', ['FtrIllumiTreeReBody0'], ['day'], { halo: 1 }),
  fixed('deco/kadomatsu', 'FtrKadomatsu', []),
  // the bulletin board (docs/board.md: NH's EvtobjBbs, at the 3D board's scale, 3.5 u a model unit), in winter its snow
  fixed('deco/bulletin-board', 'EvtobjBbs', [], ['day', 'winter'], { ppu: 3.5 * 3 }),
  fixed('deco/egg-arch', 'FtrEggArch', []),
  // the snowboy (NH's snowball body and its face on top) and its three days of melting: one camera for the four
  {
    px: 0, anchor: 'origin', ...FIX,
    looks: ([['SnowBall', 8.5, 0.75], ['SnowBall1Day', 7.5, 0.7], ['SnowBall2Day', 5.5, 0.62], ['SnowBall3Day', 3, 0.5]] as const).map(([body, up, s], i) => ({
      key: `deco/snowboy-${i}`, parts: [[body, body], ['SnowBallFaceC', 'SnowBallFaceC', [up, s]]] as Look['parts'], outputs: ['day'] as Out[]
    }))
  }
);

// the goal trees' fruit as icons (art.ts fruitArt: the tree's popup, けんこう's かつどう cards, きろく): NH's 3D fruit
// (its dropped-fruit models) seen a little from above and turned, like NH's own item icons, on a square canvas with the
// flat icons' margin (fruit/*: the same size wherever they're drawn), a dark rim so they read on a dark panel too,
// lit a little brighter than the island's renders (the panels are flat paper, not the island's ground)
const FRUIT_ALIAS = { mPear: 'mPltFruitFruitPear', mPltFruitPeach: 'mUnitIconPltFruitPeach', mPltFruitCherry02: 'mUnitIconPltFruitCherry02' };
JOBS.push(...([['pear', 'Pear', 96, -30], ['peach', 'Peach', 84, 0], ['cherry', 'Cherry', 92, -30], ['apple', 'Apple', 92, -30]] as const).map(([id, m, px, rotY]): Job => ({
  px, pad: 128, pitch: 20, rotY, anchor: 'origin', outline: [3, 'rgba(70,38,22,.9)'], light: { hemi: 2.8, key: 3.0, amb: 1.0 },
  looks: [{ key: `fruit3d/${id}`, parts: [[`UnitIconPltFruit${m}`, `UnitIconPltFruit${m}`]], outputs: ['day'], alias: FRUIT_ALIAS, opaque: true }]
})));

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
/** Colour folders a model may lack (a decoration's fabric): skipped when missing. */
const OPTIONAL = /Re(Body|Fabric)\d$/;
for (const f of [...folders, ...SHARED]) {
  const src = join(MODELS, F(f));
  if (!existsSync(src)) {
    if (SHARED.includes(f) || OPTIONAL.test(f)) continue;
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
    return { name: l.key, parts: l.parts.map(([f, d, at]) => ({ folder: F(f), dae: `${d}.dae`, at })), pose: l.pose, files: fs.map((f) => [F(f), readdirSync(join(scratch, F(f)))]), outputs: l.outputs, grdRow: l.grdRow ?? ROW.summer, grdRows: l.grdRows, grdBlock: l.grdBlock, snowAlways: l.snowAlways, hide: l.hide, alias: l.alias, opaque: l.opaque };
  });
  const r = await page.evaluate((o) => (window as unknown as { renderSet: (o: unknown) => Promise<{ images: Record<string, string>; opaque: Record<string, number[]>; w: number; h: number; anchor: [number, number]; units: [number, number]; tris: number[]; ms: { total: number } }> }).renderSet(o), {
    looks, pitch: j.pitch ?? 30, rotY: j.rotY, targetH: j.ppu ? undefined : j.px, ppu: j.ppu, nrm: 0.6, aoI: 0.6, anchor: j.anchor ?? 'origin', emiW: j.emiW, emiDefault: j.emiDefault, halo: j.halo, pad: j.pad, outline: j.outline, light: j.light
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
    const inset = r.opaque[id]?.map((f) => +(f * 100).toFixed(1)) as [number, number, number, number] | undefined;
    places[key] = { ax: +(r.anchor[0] / r.w).toFixed(4), ay: +(r.anchor[1] / r.h).toFixed(4), mu: [+r.units[0].toFixed(1), +r.units[1].toFixed(1)], ...(inset && { inset }) };
    if (look.placeOnly) continue;
    const dest = join(ART, `${key}.webp`);
    mkdirSync(dirname(dest), { recursive: true });
    execFileSync('cwebp', ['-quiet', '-q', '86', '-alpha_q', '90', '-m', '6', '-sharp_yuv', png, '-o', dest]);
    bytes += statSync(dest).size;
    manifest.files[key] = { path: `${key}.webp`, w: r.w, h: r.h, source: `rendered from NH's model ${look.parts.map((p) => p[1]).join(' + ')} (scripts/models.ts)` };
  }
  report.push(`${j.looks.map((l) => l.key).join(', ')}: ${r.w}×${r.h} px (${r.units.map((u) => u.toFixed(1)).join(' × ')} model units), ${Object.keys(r.images).length} images, ${(bytes / 1024).toFixed(1)} KB, ${r.tris.join('/')} tris, ${r.ms.total} ms`);
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
