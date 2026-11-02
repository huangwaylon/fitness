// The tent's 3D models (docs/design.md "The tent"): NH's furniture, rugs, wallpapers and floors from the game files
// the user supplied (the same `<Model>.Nin_NX_NVN` folders scripts/models.ts renders), converted to compact files the
// tent loads at runtime from GitHub Pages:
//   static/room/models/<code>.glb   one piece of furniture or a rug: NH's materials baked into one WebP texture each
//                                   (≤ 256 px), the geometry quantised and meshopt-compressed (gltfpack)
//   static/room/wall/<code>.webp    a wallpaper (2 tiles wide, the wall's height), floor/<code>.webp a floor (4 × 4 tiles)
//   static/room/icons/<code>.webp   NH's own catalogue icon (96 px), where the ずかん has none of its own
//   src/lib/components/tent/items.json   every item: its footprint (tiles, from the model's bounds), height, bytes
//   src/lib/i18n/tent.{ja,en}.json       the game's names
// A <code> is NH's internal item id with a kind letter (f: furniture or a rug, w: a wallpaper, g: a floor): short, and
// stable across reruns. What goes in: the starter set below (a cosy campsite tent), and every housewares or
// miscellaneous item a balloon can bring (the ずかん's カタログ: island/catalog.json) that NH has a model of here, so a
// find can always be placed.
//
// Usage (from app/): NH_MODELS=~/Downloads/Model npm run room-models [-- --only=f1234,w5678 --data]
//   --only   just these codes (or names' substrings), and keep everything else in items.json as it is
//   --data   rewrite items.json and the names only (no conversion)
// The model folder is untrusted input and never part of the repo: only the folders the list names are copied into a
// scratch dir (only their .dae and .png files; nothing in them is run, three.js reads them in the page), and only the
// converted files are written. Needs Google Chrome (Playwright's channel 'chrome') and cwebp (brew install webp);
// gltfpack is a dev dependency (wasm). The ACNH spreadsheet's JSON (Norviah/animal-crossing) gives the names, the
// models' file names and NH's sizes (a cross-check of the footprints), cached in the OS temp dir like
// scripts/catalog.ts.
import { chromium } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, extname, join, resolve, sep } from 'node:path';
import { createRequire } from 'node:module';
import { createHash } from 'node:crypto';

const APP = join(import.meta.dirname, '..');
const OUT = join(APP, 'static', 'room');
const ITEMS = join(APP, 'src', 'lib', 'components', 'tent', 'items.json');
const NAMES = (l: string) => join(APP, 'src', 'lib', 'i18n', `tent.${l}.json`);
const CATALOG = join(APP, 'src', 'lib', 'components', 'island', 'catalog.json');
const FIND_ICONS = join(APP, 'static', 'art', 'finds', 'items');
const SHEET = 'https://raw.githubusercontent.com/Norviah/animal-crossing/master/json/data/';
const CACHE = join(tmpdir(), 'island-catalog-src');
const arg = (k: string) => process.argv.find((a) => a.startsWith(`--${k}=`))?.slice(k.length + 3);
const only = (arg('only') ?? '').split(',').filter(Boolean);
const dataOnly = process.argv.includes('--data');

/** Bytes a model may take: over TARGET it goes again with smaller textures; over MAX the run says so. */
const TARGET = 40_000;
const MAX = 80_000;
/** Texture sizes (px, the longer side): the first try, then the second. */
const TEX = [256, 128] as const;
/** More triangles than this are simplified (a phone's room holds up to 40 pieces). */
const TRIS = 6000;
/** One tile in model units (RoomMdlFloor8x8 is 80 across: 8 tiles). */
const TILE = 10;

// ---- what goes in --------------------------------------------------------------------------------------------------

/** The starter set (the spreadsheet's English names): a cosy campsite tent's furniture and rugs. */
const STARTER = [
  'camping cot', 'lantern', 'sleeping bag', 'log bed', 'log dining table', 'log round table', 'log chair', 'log stool',
  'log bench', 'log extra-long sofa', 'log decorative shelves', 'wooden-block bookshelf', 'wooden chest', 'wooden wardrobe',
  'rattan armchair', 'rattan low table', 'rattan end table', 'rattan table lamp', 'rocking chair', 'fireplace', 'hammock',
  'monstera', 'cooler box', 'camp stove', 'campfire cookware', 'kettle', 'tea set', 'ukulele', 'cushion',
  'folding floor lamp', 'tea table', 'futon',
  // rugs (a layer of their own: furniture stands on them)
  'brown shaggy rug', 'brown argyle rug', 'botanical rug', 'ivory medium round mat', 'light bamboo rug', 'brown kitchen mat',
  // on the walls (NH's wall-mounted things: on a wall's grid)
  'log wall-mounted clock', 'cuckoo clock', 'pendulum clock', 'ironwood clock', 'iron wall lamp', 'iron wall rack',
  'wall-mounted tool board', 'corkboard', 'tree branch wreath', 'mushroom wreath'
];
/** Wallpapers and floors (NH's file names), the tent's own first: the default look. */
const WALLS = [
  'Log00', 'Common00', 'Straw00', 'Bamboo00', 'Cedar00', 'Mixwood00', 'MixPlankWood00', 'MixPlankWood01', 'PaintWood00',
  'PaintWood01', 'PaintWood02', 'PaintWood03', 'SolidWood00', 'WoodTile00', 'Country00', 'Country01', 'Country02', 'Country03',
  'Rattan00', 'Brick00', 'Brick01', 'Stucco00', 'Plaster00', 'Mud00', 'Flower00', 'Flower01', 'Dot00', 'Stripe01', 'Jungle00',
  'Chikurin00', 'MushForest00', 'Jukai00', 'SnowCrystal00', 'Ivy00', 'Library00', 'Cherry00', 'FireWood00', 'Simple00',
  'Simple02', 'Fusuma00', 'BlueSheet00', 'First00'
].map((n) => `RoomTexWall${n}`);
const FLOORS = [
  'Common00', 'Mixwood00', 'SolidWood00', 'Parquet00', 'Parquet01', 'SimpleParquet00', 'SimpleParquet01', 'ColorfulWood00',
  'DecoWood00', 'PaintWood00', 'PaintWood01', 'Birch00', 'Cedar00', 'Bamboo00', 'Tatami00', 'Rush00', 'Rattan00', 'Cork00',
  'Lawn00', 'Grassland00', 'Moss00', 'Sand00', 'Gravel00', 'FlagStone00', 'Brick00', 'TileTerracotta00', 'Tile00',
  'TileChecker00', 'SimpleCarpet00', 'SimpleCarpet01', 'Simple00', 'Sakura00', 'Autumun00', 'MushForest00', 'Herringbone00',
  'Country00', 'Country01', 'HempTile00', 'Kitchen00', 'First00'
].map((n) => `RoomTexFloor${n}`);

// ---- the spreadsheet -----------------------------------------------------------------------------------------------

type Raw = Record<string, unknown> & { name: string; internalId?: number; filename?: string; size?: string; variations?: Record<string, unknown>[]; translations?: Record<string, string> | null };
async function sheet(name: string): Promise<Raw[]> {
  mkdirSync(CACHE, { recursive: true });
  const file = join(CACHE, `${name}.json`);
  if (!existsSync(file)) {
    const res = await fetch(SHEET + encodeURIComponent(name) + '.json', { signal: AbortSignal.timeout(120_000) });
    if (!res.ok) throw new Error(`${res.status} ${name}`);
    writeFileSync(file, Buffer.from(await res.arrayBuffer()));
  }
  return JSON.parse(readFileSync(file, 'utf8')) as Raw[];
}
const field = (i: Raw, k: string): unknown => i[k] ?? i.variations?.[0]?.[k];
/** scripts/catalog.ts's id (the ずかん's): the English name in kebab case, a leading number last. */
const slug = (en: string): string =>
  en.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/&/g, ' and ').replace(/['’.]/g, '').replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '').replace(/^(\d[a-z0-9]*)-(.+)$/, '$2-$1');
const names = (r: Raw) => ({ ja: r.translations?.jPja ?? r.name, en: r.translations?.uSen ?? r.name });

const MODELS = process.env.NH_MODELS?.replace(/^~(?=\/)/, process.env.HOME ?? '~');
if (!MODELS || !existsSync(MODELS)) {
  console.error('Set NH_MODELS to the folder of NH model folders (<Model>.Nin_NX_NVN), e.g. NH_MODELS=~/Downloads/Model npm run room-models');
  process.exit(1);
}
const ROOT: string = MODELS;
const F = (n: string) => `${n}.Nin_NX_NVN`;
const SAFE = /^[A-Za-z0-9_]+$/;
const has = (folder: string) => SAFE.test(folder) && existsSync(join(ROOT, F(folder)));

interface Piece {
  code: string;
  folder: string;
  /** The colour folders (the first body and fabric: NH's catalogue colour, its icon _Remake_0_0). */
  tex: string[];
  icon: string | null;
  ja: string;
  en: string;
  /** The ずかん's id, when a balloon can bring it. */
  cat?: string;
  starter?: true;
  rug?: true;
  /** NH's size (tiles, "2x1"): the footprint's cross-check. */
  size?: string;
  /** NH's "surface": small things may stand on it (a table, a desk, a counter, a shelf…). */
  surface?: true;
  /** A small thing (the spreadsheet's Miscellaneous: what NH lets stand on a surface). */
  small?: true;
  /** NH's interaction: sit on it (a chair, a sofa, a stool) or lie on it (a bed); how many at once. */
  use?: 's' | 'l';
  seats?: number;
  /** It gives light (NH's lighting type, the fireplace): a switch. */
  light?: true;
  /** On a wall (NH's wall-mounted things): its model stands out of the wall from its back, its middle at its origin. */
  wall?: true;
}

const furniture = [...(await sheet('Housewares')), ...(await sheet('Miscellaneous'))];
const rugs = await sheet('Rugs');
const walled = await sheet('Wall-mounted');
const pool = new Set((JSON.parse(readFileSync(CATALOG, 'utf8')) as { items: string[] }).items.map((r) => r.split(' ')).filter(([, c]) => c === 'housewares' || c === 'misc' || c === 'wall').map(([id]) => id));
const bySlug = new Map([...furniture, ...walled].map((r) => [slug(names(r).en), r]));
const byName = new Map([...furniture, ...rugs, ...walled].map((r) => [r.name.toLowerCase(), r]));

function piece(r: Raw, extra: Partial<Piece>): Piece | null {
  const fn = String(field(r, 'filename') ?? '');
  const folder = fn.replace(/_Remake_\d+_\d+$/, '');
  if (!has(folder)) return null;
  const tex = [`${folder}ReBody0`, `${folder}ReFabric0`].filter(has);
  const icon = [`Layout_FtrIcon_${folder}_Remake_0_0`, `Layout_FtrIcon_${fn}`, `Layout_FtrIcon_${folder}`].find(has) ?? null;
  const id = Number(field(r, 'internalId'));
  if (!Number.isInteger(id)) return null;
  const surface = field(r, 'surface') === true, small = r.sourceSheet === 'Miscellaneous';
  // NH's own interaction (the spreadsheet's `interact`): a Chair is sat on, a Bed lain on; a sofa seats one a tile, a
  // double bed two
  const it = field(r, 'interact'), use = it === 'Chair' ? 's' : it === 'Bed' ? 'l' : undefined;
  const [sw, sd] = String(r.size ?? '1x1').split('x').map((n) => Math.max(1, Math.round(Number(n) || 1)));
  const seats = use === 's' && r.tag === 'Sofa' ? sw : use === 'l' && sw >= 2 && sd >= 2 ? 2 : use ? 1 : undefined;
  const light = !!field(r, 'lightingType') || r.tag === 'Fireplace';
  return {
    code: `f${id}`, folder, tex, icon, ...names(r), size: r.size, ...(surface ? { surface: true as const } : {}), ...(small ? { small: true as const } : {}),
    ...(use ? { use, seats } : {}), ...(light ? { light: true as const } : {}), ...extra
  };
}

const pieces = new Map<string, Piece>();
for (const n of STARTER) {
  const r = byName.get(n);
  const p = r && piece(r, { starter: true, ...(r.sourceSheet === 'Rugs' ? { rug: true as const } : {}), ...(r.sourceSheet === 'Wall-mounted' ? { wall: true as const } : {}) });
  if (!p) throw new Error(`starter ${n}: no row or no model`);
  const cat = slug(names(r).en);
  pieces.set(p.code, { ...p, ...(pool.has(cat) ? { cat } : {}) });
}
let poolMissing = 0;
for (const id of pool) {
  const r = bySlug.get(id);
  const p = r && piece(r, { cat: id, ...(r.sourceSheet === 'Wall-mounted' ? { wall: true as const } : {}) });
  if (!p) {
    poolMissing++;
    continue;
  }
  if (!pieces.has(p.code)) pieces.set(p.code, p);
}

interface Tex { code: string; file: string; icon: string | null; ja: string; en: string }
const texOf = async (tab: string, files: string[], k: string): Promise<Tex[]> => {
  const rows = await sheet(tab);
  return files.map((file) => {
    const r = rows.find((x) => field(x, 'filename') === file);
    if (!r || !has(file)) throw new Error(`${tab} ${file}: no row or no texture`);
    return { code: `${k}${field(r, 'internalId')}`, file, icon: has(`Layout_FtrIcon_${file}`) ? `Layout_FtrIcon_${file}` : null, ...names(r) };
  });
};
const walls = await texOf('Wallpaper', WALLS, 'w');
const floors = await texOf('Floors', FLOORS, 'g');
console.log(`${pieces.size} pieces (${STARTER.length} starter, ${pool.size - poolMissing} of the ずかん's ${pool.size} furniture with a model), ${walls.length} wallpapers, ${floors.length} floors`);

const wanted = (code: string, n: { ja: string; en: string }) => !only.length || only.some((o) => o === code || n.en.includes(o));

// ---- the names -----------------------------------------------------------------------------------------------------

for (const l of ['ja', 'en'] as const) {
  const out: Record<string, string> = {};
  for (const p of pieces.values()) out[`tent.item.${p.code}`] = p[l];
  for (const w of walls) out[`tent.wall.${w.code}`] = w[l];
  for (const g of floors) out[`tent.floor.${g.code}`] = g[l];
  writeFileSync(NAMES(l), JSON.stringify(out, null, 0).replace(/","/g, '",\n"').replace(/^\{/, '{\n').replace(/\}$/, '\n}') + '\n');
}

// ---- items.json (kept for what this run doesn't convert) -----------------------------------------------------------

interface Meta {
  /** Footprint in tiles (its own facing: w across, d deep). */
  w: number;
  d: number;
  /** Height (model units). */
  h: number;
  kb: number;
  /** The file's content hash (the URL's ?v=: a re-converted model is a new URL to the service worker's cache). */
  v: string;
  cat?: string;
  starter?: 1;
  rug?: 1;
  /** It has an emissive map (lit at night). */
  lit?: 1;
  /** Its icon is NH's (static/room/icons), not the ずかん's. */
  icon?: 1;
  /** NH's surface: small things stand on its top (at h). */
  s?: 1;
  /** Small: may stand on a surface. */
  sm?: 1;
  /** Sat on (s) or lain on (l), by n at once. */
  u?: 's' | 'l';
  n?: number;
  /** A light (a switch). */
  lt?: 1;
  /** On a wall: w tiles across it, h high (its middle at its origin). */
  wl?: 1;
}
const prev = (existsSync(ITEMS) ? JSON.parse(readFileSync(ITEMS, 'utf8')) : { items: {} }) as { items: Record<string, Meta> };
const metas: Record<string, Meta> = {};
for (const p of pieces.values()) if (prev.items[p.code]) metas[p.code] = prev.items[p.code];

function writeItems() {
  // NH's surface and small flags come from the spreadsheet each run (a --data run brings them up to date)
  const flags = (p: Piece, m: Meta): Meta => {
    const { s: _s, sm: _sm, u: _u, n: _n, lt: _lt, ...rest } = m;
    return {
      ...rest, ...(p.surface ? { s: 1 as const } : {}), ...(p.small ? { sm: 1 as const } : {}),
      ...(p.use ? { u: p.use, n: p.seats ?? 1 } : {}), ...(p.light ? { lt: 1 as const } : {}), ...(p.wall ? { wl: 1 as const } : {})
    };
  };
  const items = Object.fromEntries([...pieces.values()].filter((p) => metas[p.code]).map((p) => [p.code, flags(p, metas[p.code])]));
  const json = {
    _: 'scripts/room-models.ts (npm run room-models): the tent\'s items (footprint w × d tiles, height h, kb), wallpapers and floors',
    wall: walls[0].code, floor: floors[0].code,
    walls: walls.map((w) => w.code), floors: floors.map((g) => g.code),
    items
  };
  writeFileSync(ITEMS, `{\n${Object.entries(json).map(([k, v]) => k === 'items'
    ? `  "items": {\n${Object.entries(v as Record<string, Meta>).map(([c, m]) => `    ${JSON.stringify(c)}: ${JSON.stringify(m)}`).join(',\n')}\n  }`
    : `  ${JSON.stringify(k)}: ${JSON.stringify(v)}`).join(',\n')}\n}\n`);
}
if (dataOnly) {
  writeItems();
  process.exit(0);
}

// ---- the conversion ------------------------------------------------------------------------------------------------

const todo = [...pieces.values()].filter((p) => wanted(p.code, p));
const scratch = mkdtempSync(join(tmpdir(), 'nh-room-'));
const work = mkdtempSync(join(tmpdir(), 'nh-room-out-'));
const copy = (folder: string) => {
  const dst = join(scratch, F(folder));
  if (existsSync(dst)) return;
  mkdirSync(dst);
  const src = join(ROOT, F(folder));
  for (const n of readdirSync(src)) if (/^[A-Za-z0-9_]+\.(dae|png)$/.test(n) && statSync(join(src, n)).isFile()) cpSync(join(src, n), join(dst, n));
};
for (const d of ['models', 'wall', 'floor', 'icons']) mkdirSync(join(OUT, d), { recursive: true });

const webp = (png: string, out: string, q: number, extra: string[] = []) =>
  execFileSync('cwebp', ['-quiet', '-q', String(q), '-alpha_q', '90', '-m', '6', '-sharp_yuv', ...extra, png, '-o', out]);
const GLTFPACK = join(dirname(createRequire(import.meta.url).resolve('gltfpack/package.json')), 'cli.js');

/** NH's icon (128 px) as the tent's (96 px), unless the ずかん has one. */
function icon(code: string, folder: string | null, cat?: string): boolean {
  if (cat && existsSync(join(FIND_ICONS, `${cat}.webp`))) return false;
  if (!folder) return false;
  const src = join(ROOT, F(folder));
  const png = readdirSync(src).find((n) => /^[A-Za-z0-9_]+\.png$/.test(n));
  if (!png) return false;
  webp(join(src, png), join(OUT, 'icons', `${code}.webp`), 80, ['-resize', '96', '96']);
  return true;
}

if (todo.length) {
  for (const p of todo) for (const f of [p.folder, ...p.tex]) copy(f);
  const three = join(dirname(createRequire(import.meta.url).resolve('three')), '..');
  const PAGE = join(import.meta.dirname, 'room-models-page.js');
  const MIME: Record<string, string> = { '.js': 'text/javascript', '.png': 'image/png', '.dae': 'model/vnd.collada+xml' };
  const browser = await chromium.launch({ channel: 'chrome', args: ['--enable-gpu', '--ignore-gpu-blocklist'] });
  const page = await browser.newPage();
  page.on('pageerror', (e) => console.error('[page]', e.message));
  await page.route('http://room.local/**', (route) => {
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
  await page.goto('http://room.local/');
  await page.waitForFunction(() => (window as unknown as { ready?: boolean }).ready);

  let total = 0;
  const over: string[] = [], mismatch: string[] = [];
  for (const p of todo) {
    const files = [...p.tex, p.folder].map((f) => [F(f), readdirSync(join(scratch, F(f)))]);
    let bytes = 0, box: [number[], number[]] = [[0, 0, 0], [0, 0, 0]], tris = 0, lit = false;
    for (const [n, maxTex] of TEX.entries()) {
      const r = await page.evaluate((o) => (window as unknown as { convert: (o: unknown) => Promise<{ gltf: string; box: [number[], number[]]; tris: number; lit: boolean }> }).convert(o), {
        parts: [{ folder: F(p.folder), dae: `${p.folder}.dae` }], files, maxTex, maxEmi: 128
      });
      ({ box, tris, lit } = r);
      // the images: PNG → WebP files (EXT_texture_webp), the buffer a file; then gltfpack
      const g = JSON.parse(r.gltf) as { buffers: { uri: string }[]; images?: { uri?: string; mimeType?: string }[]; textures?: { source?: number; sampler?: number; extensions?: object }[]; materials?: { emissiveTexture?: { index: number } }[]; extensionsUsed?: string[]; extensionsRequired?: string[] };
      const dir = join(work, p.code);
      rmSync(dir, { recursive: true, force: true });
      mkdirSync(dir);
      g.buffers.forEach((b, i) => {
        writeFileSync(join(dir, `b${i}.bin`), Buffer.from(b.uri.split(',')[1], 'base64'));
        b.uri = `b${i}.bin`;
      });
      const emissive = new Set((g.materials ?? []).flatMap((m) => (m.emissiveTexture ? [g.textures![m.emissiveTexture.index].source] : [])));
      (g.images ?? []).forEach((im, i) => {
        const png = join(dir, `i${i}.png`);
        writeFileSync(png, Buffer.from(im.uri!.split(',')[1], 'base64'));
        webp(png, join(dir, `i${i}.webp`), emissive.has(i) ? 70 : 80);
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
      const out = join(OUT, 'models', `${p.code}.glb`);
      const si = tris > TRIS ? ['-si', (TRIS / tris).toFixed(3)] : [];
      execFileSync('node', [GLTFPACK, '-i', join(dir, 'm.gltf'), '-o', out, '-cc', '-ce', 'ext', ...si]);
      bytes = statSync(out).size;
      if (bytes <= TARGET || n === TEX.length - 1) break;
    }
    if (bytes > MAX) over.push(`${p.code} ${p.en} ${(bytes / 1024).toFixed(0)} KB`);
    total += bytes;
    // the footprint from the bounds (whole tiles, at least one: a piece may overhang its tiles a little), checked
    // against NH's own size, which wins where they differ (a model with empty room round it, a slide's ladder)
    const [[x0, y0, z0], [x1, y1, z1]] = box;
    let w = Math.max(1, Math.ceil((x1 - x0) / TILE - 0.35)), d = Math.max(1, Math.ceil((z1 - z0) / TILE - 0.35));
    // (a wall-mounted thing's size is across and up the wall: its depth off the wall is one)
    const nh = p.size?.split('x').map((s) => Math.max(1, Math.ceil(Number(s))));
    if (p.wall && nh) [w, d] = [nh[0], 1];
    else if (nh && nh.length === 2 && nh.every(Number.isFinite) && (nh[0] !== w || nh[1] !== d)) {
      mismatch.push(`${p.code} ${p.en}: bounds ${w}x${d} (${(x1 - x0).toFixed(1)} × ${(z1 - z0).toFixed(1)}), NH ${p.size}`);
      [w, d] = nh;
    }
    const ic = icon(p.code, p.icon, p.cat);
    metas[p.code] = {
      w, d, h: +(y1 - Math.min(0, y0)).toFixed(1), kb: +(bytes / 1024).toFixed(1),
      v: createHash('sha256').update(readFileSync(join(OUT, 'models', `${p.code}.glb`))).digest('hex').slice(0, 8),
      ...(p.cat ? { cat: p.cat } : {}), ...(p.starter ? { starter: 1 as const } : {}), ...(p.rug ? { rug: 1 as const } : {}),
      ...(lit ? { lit: 1 as const } : {}), ...(ic ? { icon: 1 as const } : {})
    };
    console.log(`${p.code} ${p.en}: ${w}x${d} (NH ${p.size}), ${(bytes / 1024).toFixed(1)} KB, ${tris} tris${lit ? ', lit' : ''}`);
  }
  await browser.close();
  console.log(`${todo.length} models, ${(total / 1024 / 1024).toFixed(2)} MB`);
  if (over.length) console.log(`over ${MAX / 1000} KB:\n  ${over.join('\n  ')}`);
  if (mismatch.length) console.log(`footprints unlike NH's size:\n  ${mismatch.join('\n  ')}`);
}

// ---- wallpapers and floors -----------------------------------------------------------------------------------------

let texBytes = 0;
for (const [list, kind, w, h] of [[walls, 'wall', 256, 512], [floors, 'floor', 512, 512]] as const) {
  for (const t of list) {
    if (!wanted(t.code, t)) continue;
    const src = join(ROOT, F(t.file), `${t.file}_Alb.png`);
    const out = join(OUT, kind, `${t.code}.webp`);
    webp(src, out, 78, ['-resize', String(w), String(h), '-noalpha']);
    texBytes += statSync(out).size;
    icon(t.code, t.icon);
  }
}
if (texBytes) console.log(`wallpapers and floors: ${(texBytes / 1024 / 1024).toFixed(2)} MB`);

writeItems();
rmSync(scratch, { recursive: true, force: true });
rmSync(work, { recursive: true, force: true });
