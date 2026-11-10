// The tent's 3D models (docs/design.md "The tent"): NH's furniture, rugs, wallpapers and floors from the game files
// the user supplied (the same `<Model>.Nin_NX_NVN` folders scripts/models.ts renders), converted to compact files the
// tent loads at runtime from GitHub Pages:
//   static/room/models/<code>.glb   one piece of furniture or a rug: NH's materials baked into one WebP texture each
//                                   (≤ 256 px), the geometry quantised and meshopt-compressed (gltfpack)
//   static/room/wall/<code>.webp    a wallpaper (2 tiles wide, the wall's height), floor/<code>.webp a floor (4 × 4 tiles)
//   static/room/icons/<code>.webp   NH's own catalogue icon (96 px), where the ずかん has none of its own
//   src/lib/components/tent/items.json   every item: its footprint (tiles, from the model's bounds), height, bytes;
//                                        a surface's top (scripts/room-surfaces.ts: its height, rectangle and slots)
//   src/lib/i18n/tent.{ja,en}.json       the game's names
// A <code> is NH's internal item id with a kind letter (f: furniture or a rug, w: a wallpaper, g: a floor): short, and
// stable across reruns. What goes in: the starter set below (a cosy campsite tent), and every housewares or
// miscellaneous item a balloon can bring (the ずかん's カタログ: island/catalog.json) that NH has a model of here, so a
// find can always be placed.
//
// Usage (from app/): NH_MODELS=~/Downloads/Model npm run room-models [-- --only=f1234,w5678 | --new | --data | --surfaces | --emitters]
//   --only      just these codes (or names' substrings), and keep everything else in items.json as it is
//   --new       just what isn't converted yet (as --only for those)
//   --data      rewrite items.json and the names only (no conversion)
//   --surfaces  as --data, and find every surface's top again from its converted model (static/room/models)
//   --emitters  as --data, and find every light's emitter again (NH's light locator, else its model's glow)
// The model folder is untrusted input and never part of the repo: only the folders the list names are copied into a
// scratch dir (only their .dae and .png files; nothing in them is run, three.js reads them in the page), and only the
// converted files are written. Needs Google Chrome (Playwright's channel 'chrome') and cwebp (brew install webp);
// gltfpack is a dev dependency (wasm). The ACNH spreadsheet's JSON (Norviah/animal-crossing) gives the names, the
// models' file names and NH's sizes (a cross-check of the footprints), cached in the OS temp dir like
// scripts/catalog.ts.
import { chromium, type Page } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, extname, join, resolve, sep } from 'node:path';
import { createRequire } from 'node:module';
import { createHash } from 'node:crypto';
import { topOf, type Sample, type Top } from './room-surfaces.ts';
import { packRoom } from './room-packs.ts';
import { nhFolders } from './nh-folders.ts';

const APP = join(import.meta.dirname, '..');
const OUT = join(APP, 'static', 'room');
const ITEMS = join(APP, 'src', 'lib', 'components', 'tent', 'items.json');
const MORE = join(APP, 'src', 'lib', 'components', 'tent', 'more.json');
/** The packed pieces' and textures' converted files before they're packed (gitignored): scripts/room-packs.ts packs them. */
const WORK = join(APP, '.cache', 'room');
const HHA = join(APP, 'src', 'lib', 'components', 'tent', 'hha.json');
const NAMES = (l: string) => join(APP, 'src', 'lib', 'i18n', `tent.${l}.json`);
const CATALOG = join(APP, 'src', 'lib', 'components', 'island', 'catalog.json');
const FIND_ICONS = join(APP, 'static', 'art', 'finds', 'items');
const SHEET = 'https://raw.githubusercontent.com/Norviah/animal-crossing/master/json/data/';
const CACHE = join(tmpdir(), 'island-catalog-src');
const arg = (k: string) => process.argv.find((a) => a.startsWith(`--${k}=`))?.slice(k.length + 3);
const only = (arg('only') ?? '').split(',').filter(Boolean);
const newOnly = process.argv.includes('--new');
const surfacesOnly = process.argv.includes('--surfaces');
const emittersOnly = process.argv.includes('--emitters');
const dataOnly = process.argv.includes('--data') || surfacesOnly || emittersOnly;

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
const FOLDERS = nhFolders(ROOT);
const has = (folder: string) => SAFE.test(folder) && FOLDERS.has(folder);
/** The spreadsheet's file names that the export spells in another case (macOS's disk found them all the same; a
 *  case-sensitive one doesn't): the sheet's → the export's. FOLDERS.assertExact fails the run on any other. */
const SHEET_CASE: Record<string, string> = {
  FtrPressbench: 'FtrPressBench', FtrWashingmachine: 'FtrWashingMachine', FtrMountainbike: 'FtrMountainBike',
  FtrDigitalclock: 'FtrDigitalClock', FtrKatakatatoy: 'FtrKatakataToy'
};
const exportCase = (fn: string) => fn.replace(/^[A-Za-z0-9]+/, (b) => SHEET_CASE[b] ?? b);

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
  /** Hung from the ceiling (NH's ceiling decor): a layer of its own over the floor's. */
  ceiling?: true;
  /** A gyroid (NH's Haniwa): it bobs when tapped. */
  gyroid?: true;
  /** A critter's tank (NH's caught fish, bug or sea creature placed indoors): the ずかん find (`kind:id`) it comes with. */
  critter?: string;
  /** Packed (scripts/room-packs.ts): every piece but the starter set and the ずかん's (the 2026-11-10 catalogue), its
   *  model in a pack of its group (`home`), never a loose file. */
  home?: string;
  hha: Hha;
}

/** What the HHA counts (the spreadsheet's): its base points, its series, its catalogue colours (the first variation's,
 *  the one converted), its themes (NH's concepts) and its HHA category (lighting, a clock…). */
interface Hha { p: number; s?: string; c?: string[]; t?: string[]; k?: string }
/** The series' names (NH's own, the spreadsheet's HHA Themes). */
const seriesNames = new Map<string, { ja: string; en: string }>();
function hhaOf(r: Raw): Hha {
  const strs = (v: unknown) => (Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : []);
  const series = typeof r.series === 'string' ? r.series : undefined;
  const st = r.seriesTranslations as Record<string, string> | null | undefined;
  if (series && !seriesNames.has(series)) seriesNames.set(series, { ja: st?.jPja ?? series, en: st?.uSen ?? series });
  const c = strs(field(r, 'colors')), t = strs(field(r, 'concepts')), k = field(r, 'hhaCategory');
  return {
    p: Math.max(0, Math.round(Number(r.hhaBasePoints) || 0)), ...(series ? { s: series } : {}), ...(c.length ? { c } : {}), ...(t.length ? { t } : {}),
    ...(typeof k === 'string' && k ? { k } : {})
  };
}

const furniture = [...(await sheet('Housewares')), ...(await sheet('Miscellaneous'))];
const rugs = await sheet('Rugs');
const walled = await sheet('Wall-mounted');
const ceilings = await sheet('Ceiling Decor');
const gyroids = await sheet('Gyroids');
const pool = new Set((JSON.parse(readFileSync(CATALOG, 'utf8')) as { items: string[] }).items.map((r) => r.split(' ')).filter(([, c]) => c === 'housewares' || c === 'misc' || c === 'wall' || c === 'ceiling').map(([id]) => id));
const bySlug = new Map([...furniture, ...walled, ...ceilings].map((r) => [slug(names(r).en), r]));
const byName = new Map([...furniture, ...rugs, ...walled].map((r) => [r.name.toLowerCase(), r]));

function piece(r: Raw, extra: Partial<Piece>): Piece | null {
  const fn = exportCase(String(field(r, 'filename') ?? ''));
  const folder = fn.replace(/_Remake_\d+_\d+$/, '');
  if (!has(folder)) return null;
  const tex = [`${folder}ReBody0`, `${folder}ReFabric0`].filter(has);
  // (the icons' folders are spelled as the sheet does, the models' as the export: either)
  const raw = String(field(r, 'filename') ?? ''), rawFolder = raw.replace(/_Remake_\d+_\d+$/, '');
  const icon = [...new Set([folder, rawFolder])].flatMap((f) => [`Layout_FtrIcon_${f}_Remake_0_0`, `Layout_FtrIcon_${f}`])
    .concat([`Layout_FtrIcon_${fn}`, `Layout_FtrIcon_${raw}`]).find((f) => SAFE.test(f) && FOLDERS.peek(f)) ?? null;
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
    ...(use ? { use, seats } : {}), ...(light ? { light: true as const } : {}), hha: hhaOf(r), ...extra
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
  const p = r && piece(r, { cat: id, ...(r.sourceSheet === 'Wall-mounted' ? { wall: true as const } : {}), ...(r.sourceSheet === 'Ceiling Decor' ? { ceiling: true as const } : {}) });
  if (!p) {
    poolMissing++;
    continue;
  }
  if (!pieces.has(p.code)) pieces.set(p.code, p);
}

// Everything else NH has a model of (the user, 2026-11-10: the whole catalogue but character customisation): every
// housewares, miscellaneous, wall-mounted and ceiling piece (DIY, events, Nook Miles, Nook Shopping, the special
// characters' and the rest: the shop sells them), every rug and every gyroid; and each critter's tank (NH's caught fish,
// bug or sea creature put down indoors), the ずかん's catches'. Packed (scripts/room-packs.ts), a pack a group.
const sheetOf = (r: Raw): string => String(r.sourceSheet ?? '');
const homeOf = (r: Raw, extra: Partial<Piece>): string =>
  extra.rug ? 'rug' : extra.ceiling ? 'ceiling' : extra.gyroid ? 'gyroid' : extra.critter ? 'critter' : extra.wall ? 'wall' : /model$/.test(r.name) ? 'model' : sheetOf(r) === 'Miscellaneous' ? 'misc' : 'housewares';
let more = 0;
const addMore = (r: Raw, extra: Partial<Piece>) => {
  const p = piece(r, extra);
  if (!p || pieces.has(p.code)) return;
  pieces.set(p.code, { ...p, home: homeOf(r, extra) });
  more++;
};
for (const r of [...furniture, ...walled, ...ceilings, ...rugs, ...gyroids])
  addMore(r, { ...(sheetOf(r) === 'Wall-mounted' ? { wall: true as const } : {}), ...(sheetOf(r) === 'Ceiling Decor' ? { ceiling: true as const } : {}),
    ...(sheetOf(r) === 'Rugs' ? { rug: true as const } : {}), ...(sheetOf(r) === 'Gyroids' ? { gyroid: true as const } : {}) });
// the critters' tanks: the island's catch ids (i18n/catch.en.json, as scripts/shop-prices.ts matches them)
{
  const catchNames = JSON.parse(readFileSync(join(APP, 'src', 'lib', 'i18n', 'catch.en.json'), 'utf8')) as Record<string, string>;
  const ALIAS: Record<string, string> = { clownfish: 'clown-fish' };
  const island = new Map<string, string>();
  for (const k of Object.keys(catchNames)) {
    const m = /^(critter|sea)\.name\.([a-z0-9-]+)$/.exec(k);
    if (m) island.set(`${m[1] === 'sea' ? 'sea' : 'critter'} ${ALIAS[m[2]] ?? m[2]}`, m[2]);
  }
  for (const [tab, kind] of [['Fish', 'fish'], ['Insects', 'bug'], ['Sea Creatures', 'sea']] as const)
    for (const r of await sheet(tab)) {
      const id = island.get(`${kind === 'sea' ? 'sea' : 'critter'} ${slug(r.name)}`);
      if (!id) continue;
      // (the sheet's filename is the critter's own; its tank is furnitureFilename; "surface" here: it may stand on one)
      addMore({ ...r, filename: String(r.furnitureFilename), surface: false }, { critter: `${kind}:${id}`, ...(r.surface === true ? { small: true as const } : {}) });
    }
}

/** A wallpaper or a floor: its folder's albedo, and its layers over it (NH's: a vista's clouds `AlbOry`, a railing in
 *  front `AlbEx`) flattened into one picture, the static look of NH's moving ones (docs/world3d-assets.md "Wallpapers
 *  and floors"); its glow (`Emi`: lit in the dark) where it has one. `packed`: every one past the tent's first set. */
interface Tex { code: string; file: string; icon: string | null; ja: string; en: string; hha: Hha; packed?: true }
const texOf = async (tab: string, files: string[], k: string): Promise<Tex[]> => {
  const rows = await sheet(tab);
  const tex = (r: Raw, file: string, packed: boolean): Tex =>
    ({ code: `${k}${field(r, 'internalId')}`, file, icon: has(`Layout_FtrIcon_${file}`) ? `Layout_FtrIcon_${file}` : null, ...names(r), hha: hhaOf(r), ...(packed ? { packed: true as const } : {}) });
  const first = files.map((file) => {
    const r = rows.find((x) => field(x, 'filename') === file);
    if (!r || !has(file)) throw new Error(`${tab} ${file}: no row or no texture`);
    return tex(r, file, false);
  });
  const rest = rows.filter((r) => !files.includes(String(field(r, 'filename'))) && has(String(field(r, 'filename'))))
    .map((r) => tex(r, String(field(r, 'filename')), true));
  return [...first, ...rest];
};
const walls = await texOf('Wallpaper', WALLS, 'w');
const floors = await texOf('Floors', FLOORS, 'g');
FOLDERS.assertExact('room-models');
console.log(`${pieces.size} pieces (${STARTER.length} starter, ${pool.size - poolMissing} of the ずかん's ${pool.size} furniture with a model, ${more} more), ${walls.length} wallpapers, ${floors.length} floors`);

/** --new: only what isn't converted yet (a piece with no entry, a wallpaper or floor with no texture loose or packed). */
const fresh = (code: string): boolean => {
  if (code[0] === 'f') return !metas[code];
  const kind = code[0] === 'w' ? 'wall' : 'floor', packed = (readItems(MORE) as { tex?: Record<string, unknown> }).tex ?? {};
  return !existsSync(join(OUT, kind, `${code}.webp`)) && !existsSync(join(WORK, kind, `${code}.webp`)) && !packed[code];
};
const wanted = (code: string, n: { ja: string; en: string }) =>
  newOnly ? fresh(code) : !only.length || only.some((o) => o === code || n.en.includes(o));

// ---- the names -----------------------------------------------------------------------------------------------------

for (const l of ['ja', 'en'] as const) {
  const out: Record<string, string> = {};
  for (const p of pieces.values()) out[`tent.item.${p.code}`] = p[l];
  for (const w of walls) out[`tent.wall.${w.code}`] = w[l];
  for (const g of floors) out[`tent.floor.${g.code}`] = g[l];
  for (const [k, n] of [...seriesNames].sort(([a], [b]) => (a < b ? -1 : 1))) out[`tent.series.${k}`] = n[l];
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
  /** NH's surface: small things stand on its top. */
  s?: 1;
  /** Its top (scripts/room-surfaces.ts): how high, the rectangle (its own frame, model units), the tiles that hold. */
  sy?: number;
  st?: Top['st'];
  sl?: Top['sl'];
  /** Small: may stand on a surface. */
  sm?: 1;
  /** Sat on (s) or lain on (l), by n at once. */
  u?: 's' | 'l';
  n?: number;
  /** A light (a switch). */
  lt?: 1;
  /** A light's emitter, its point light (model units): NH's light locator (el), else its emissive map's lit middle. */
  e?: [number, number, number];
  el?: 1;
  /** On a wall: w tiles across it, h high (its middle at its origin). */
  wl?: 1;
  /** Hung from the ceiling: its model's top at the ceiling. */
  cl?: 1;
  /** A gyroid. */
  gy?: 1;
  /** A critter's tank: the ずかん find (`kind:id`) that brings it. */
  cr?: string;
  /** Packed: its pack's group (scripts/room-packs.ts), and where its model is in it ([pack, offset, bytes]). */
  g?: string;
  pk?: [string, number, number];
}
const readItems = (f: string) => (existsSync(f) ? JSON.parse(readFileSync(f, 'utf8')) : { items: {} }) as { items: Record<string, Meta> };
const prev = { items: { ...readItems(ITEMS).items, ...readItems(MORE).items } };
const metas: Record<string, Meta> = {};
for (const p of pieces.values()) if (prev.items[p.code]) metas[p.code] = prev.items[p.code];

function writeItems() {
  // NH's surface and small flags come from the spreadsheet each run (a --data run brings them up to date)
  const flags = (p: Piece, m: Meta): Meta => {
    const { s: _s, sy, st, sl, sm: _sm, u: _u, n: _n, lt: _lt, cl: _cl, gy: _gy, cr: _cr, g: _g, ...all } = m;
    // (a packed piece's size and version are its place in its pack: pk, the pack's name its content's hash)
    const { kb: _kb, v: _v, ...packed } = all, rest = p.home ? packed : all;
    return {
      // (a surface whose top the rays can't find is none: nothing would stand on it)
      ...(rest as Meta), ...(p.surface && sl ? { s: 1 as const, sy, st, sl } : {}), ...(p.small ? { sm: 1 as const } : {}),
      ...(p.use ? { u: p.use, n: p.seats ?? 1 } : {}), ...(p.light ? { lt: 1 as const } : {}), ...(p.wall ? { wl: 1 as const } : {}),
      ...(p.ceiling ? { cl: 1 as const } : {}), ...(p.gyroid ? { gy: 1 as const } : {}), ...(p.critter ? { cr: p.critter } : {}), ...(p.home ? { g: p.home } : {})
    };
  };
  const all = [...pieces.values()].filter((p) => metas[p.code]).map((p) => [p.code, flags(p, metas[p.code])] as const);
  // items.json: the starter set and the ずかん's pieces (island/catalog.ts reads it: lazy, but the presents' chunk);
  // more.json: the packed rest (items.ts joins them; scripts/room-packs.ts writes each one's `pk`)
  const items = Object.fromEntries(all.filter(([c]) => !pieces.get(c)!.home));
  const moreItems = Object.fromEntries(all.filter(([c]) => pieces.get(c)!.home));
  // the HHA's (tent/hha.ts, loaded only for a rating): each item's, wallpaper's and floor's
  const hha = [...[...pieces.values()].filter((p) => metas[p.code]), ...walls, ...floors].map((p) => `  ${JSON.stringify(p.code)}: ${JSON.stringify(p.hha)}`);
  writeFileSync(HHA, `{\n${hha.join(',\n')}\n}\n`);
  const json = {
    _: 'scripts/room-models.ts (npm run room-models): the tent\'s items (footprint w × d tiles, height h, kb), wallpapers and floors',
    wall: walls[0].code, floor: floors[0].code,
    walls: walls.filter((w) => !w.packed).map((w) => w.code), floors: floors.filter((g) => !g.packed).map((g) => g.code),
    items
  };
  writeJson(ITEMS, json);
  // (the packs' places, kept: room-packs.ts writes them)
  const was = (existsSync(MORE) ? JSON.parse(readFileSync(MORE, 'utf8')) : {}) as { tex?: Record<string, unknown>; icons?: Record<string, unknown> };
  writeJson(MORE, {
    _: 'scripts/room-models.ts (npm run room-models) and room-packs.ts: the packed pieces (as items.json\'s, with g their pack\'s group and pk [pack, offset, bytes]), wallpapers and floors (tex: their texture\'s place, and its glow\'s as <code>.e), and the packed icons',
    walls: walls.filter((w) => w.packed).map((w) => w.code), floors: floors.filter((g) => g.packed).map((g) => g.code),
    tex: was.tex ?? {}, icons: was.icons ?? {},
    items: moreItems
  });
}
/** A table as the room's JSON files are written: one entry a line in its objects of entries (a diff shows what changed). */
function writeJson(f: string, json: Record<string, unknown>): void {
  const block = (k: string, v: unknown) => ['items', 'tex', 'icons'].includes(k) && v && typeof v === 'object'
    ? `  ${JSON.stringify(k)}: {\n${Object.entries(v as Record<string, unknown>).map(([c, m]) => `    ${JSON.stringify(c)}: ${JSON.stringify(m)}`).join(',\n')}\n  }`
    : `  ${JSON.stringify(k)}: ${JSON.stringify(v)}`;
  writeFileSync(f, `{\n${Object.entries(json).map(([k, v]) => block(k, v)).join(',\n')}\n}\n`);
}

// ---- the surfaces' tops: rays down over each converted model (scripts/room-surfaces-page.js, the Node half's rules
//      in scripts/room-surfaces.ts) ------------------------------------------------------------------------------

const three = join(dirname(createRequire(import.meta.url).resolve('three')), '..');
/** scripts/room-surfaces-page.js in the installed Chrome: the converted models (/models/), and a piece's Collada from
 *  the game files (/src/<folder>/<folder>.dae, only that file: untrusted input, read by three.js in the page). */
async function modelPage<T>(run: (page: Page) => Promise<T>): Promise<T> {
  const PAGE = join(import.meta.dirname, 'room-surfaces-page.js'), MODELS_OUT = join(OUT, 'models');
  const browser = await chromium.launch({ channel: 'chrome' });
  const page = await browser.newPage();
  page.on('pageerror', (e) => console.error('[page]', e.message));
  await page.route('http://room.local/**', (route) => {
    const u = decodeURIComponent(new URL(route.request().url()).pathname);
    const within = (root: string, rel: string) => {
      const f = resolve(root, rel);
      return f.startsWith(root + sep) ? f : null;
    };
    if (u === '/') return route.fulfill({ contentType: 'text/html', body: '<!doctype html><script type="importmap">{"imports":{"three":"/three/build/three.module.js","three/addons/":"/three/examples/jsm/"}}</script><script type="module" src="/page.js"></script>' });
    const dae = /^\/src\/([A-Za-z0-9_]+)\/\1\.dae$/.exec(u);
    // (a packed piece's converted model is in the work folder: room-packs.ts --unpack puts it there again)
    const model = (rel: string) => [within(MODELS_OUT, rel), within(join(WORK, 'models'), rel)].find((x) => x && existsSync(x)) ?? null;
    const f = u === '/page.js' ? PAGE : u.startsWith('/three/') ? within(three, u.slice(7)) : u.startsWith('/models/') ? model(u.slice(8))
      : dae && has(dae[1]) ? join(ROOT, F(dae[1]), `${dae[1]}.dae`) : null;
    if (!f || !existsSync(f)) return route.fulfill({ status: 404, body: '' });
    return route.fulfill({ body: readFileSync(f), contentType: extname(f) === '.js' ? 'text/javascript' : 'application/octet-stream' });
  });
  await page.goto('http://room.local/');
  await page.waitForFunction(() => (window as unknown as { ready?: boolean }).ready);
  try {
    return await run(page);
  } finally {
    await browser.close();
  }
}
async function surfaceTops(codes: readonly string[]): Promise<void> {
  if (!codes.length) return;
  const STEP = 0.5;
  await modelPage(async (page) => {
    for (const code of codes) {
      const m = metas[code];
      if (!m) continue;
      const s = await page.evaluate((o) => (window as unknown as { sample: (o: unknown) => Promise<Sample> }).sample(o), { url: `/models/${code}.glb`, W: m.w * TILE, D: m.d * TILE, step: STEP });
      const top = topOf(s, m.w, m.d, STEP);
      const { sy: _sy, st: _st, sl: _sl, ...rest } = m;
      metas[code] = top ? { ...rest, ...top } : rest;
      const p = pieces.get(code)!;
      console.log(`${code} ${p.en}: ${top ? `top ${top.sy} (bounds ${m.h}), ${top.sl.length}/${m.w * m.d} tiles` : 'no top'}`);
    }
  });
}

// ---- the lights' emitters: where a lamp's point light stands (scripts/room-surfaces-page.js locator, emitter) -----

/** Lights with neither NH's light locator nor a lit emissive map: their glow's spot, checked by eye (model units). */
const EMITTERS: Record<string, [number, number, number]> = {
  // the stage flame machine's nozzle, the cartoonist's set's light table
  f13467: [0, 7.5, 0], f4122: [0, 1.6, 0]
};
/** Each light's emitter (items.json e): NH's own light locator in the game's model (el: a lamp's bulb, a TV's
 *  screen) when it is within the model, else the middle of its emissive map's lit texels (the converted model's
 *  glow), else EMITTERS. */
async function emitters(codes: readonly string[]): Promise<void> {
  if (!codes.length) return;
  const r1 = (n: number) => Math.round(n * 10) / 10 || 0;
  await modelPage(async (page) => {
    for (const code of codes) {
      const m = metas[code], p = pieces.get(code)!;
      const { e: _e, el: _el, ...rest } = m;
      const loc = await page.evaluate((o) => (window as unknown as { locator: (o: unknown) => Promise<number[] | null> }).locator(o), { url: `/src/${p.folder}/${p.folder}.dae` });
      const glow = await page.evaluate((o) => (window as unknown as { emitter: (o: unknown) => Promise<{ at: number[] | null; box: number[][] }> }).emitter(o), { url: `/models/${code}.glb` });
      // (the fortune-telling set's floats over its crystal ball)
      const within = loc && loc.every((v, i) => v >= glow.box[0][i] - 0.3 && v <= glow.box[1][i] + 0.3) ? loc : null;
      // (else its model's middle: a disco ball, a monitor, a tank lit from inside, with neither)
      const mid = glow.box.length === 2 ? glow.box[0].map((v, i) => (v + glow.box[1][i]) / 2) : null;
      const at = within ?? glow.at ?? EMITTERS[code] ?? mid;
      metas[code] = at ? { ...rest, e: at.map(r1) as [number, number, number], ...(within ? { el: 1 as const } : {}) } : rest;
      console.log(`${code} ${p.en}: ${at ? `${within ? 'NH locator' : glow.at ? 'glow' : EMITTERS[code] ? 'by eye' : 'its middle'} ${metas[code].e!.join(', ')} (height ${m.h})` : 'no emitter'}`);
    }
  });
}
const emitterCodes = (list: Iterable<Piece>) => [...list].filter((p) => p.light && metas[p.code]).map((p) => p.code);
const surfaceCodes = (list: Iterable<Piece>) => [...list].filter((p) => p.surface && !p.rug && !p.wall && metas[p.code]).map((p) => p.code);

if (dataOnly) {
  if (surfacesOnly) await surfaceTops(surfaceCodes([...pieces.values()].filter((p) => wanted(p.code, p))));
  if (emittersOnly) await emitters(emitterCodes([...pieces.values()].filter((p) => wanted(p.code, p))));
  writeItems();
  packRoom();
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
for (const d of ['models', 'wall', 'floor', 'icons']) mkdirSync(join(OUT, d), { recursive: true }), mkdirSync(join(WORK, d), { recursive: true });
/** Where a piece's converted model goes: a packed one's into the work folder. */
const modelOut = (p: Piece) => join(p.home ? WORK : OUT, 'models', `${p.code}.glb`);
/** Icons packed by their tray tab (browsed a tab at a time): the rugs', the critters', the wallpapers' and floors'; the
 *  shop's pieces keep loose ones (a day's stock is any 24 of them). */
const PACKED_ICONS = new Set(['rug', 'critter']);

const webp = (png: string, out: string, q: number, extra: string[] = []) =>
  execFileSync('cwebp', ['-quiet', '-q', String(q), '-alpha_q', '90', '-m', '6', '-sharp_yuv', ...extra, png, '-o', out]);
const GLTFPACK = join(dirname(createRequire(import.meta.url).resolve('gltfpack/package.json')), 'cli.js');

/** NH's icon (128 px) as the tent's (96 px), unless the ずかん has one; `packed`: into the work folder, for a pack. */
function icon(code: string, folder: string | null, cat?: string, packed = false): boolean {
  if (cat && existsSync(join(FIND_ICONS, `${cat}.webp`))) return false;
  if (!folder) return false;
  const src = join(ROOT, F(folder));
  const png = readdirSync(src).find((n) => /^[A-Za-z0-9_]+\.png$/.test(n));
  if (!png) return false;
  webp(join(src, png), join(packed ? WORK : OUT, 'icons', `${code}.webp`), 80, ['-resize', '96', '96']);
  return true;
}

if (todo.length) {
  for (const p of todo) for (const f of [p.folder, ...p.tex]) copy(f);
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
        // (a gray albedo's colour from its gradient's first row: NH's first colour, the catalogue's and the icon's)
        parts: [{ folder: F(p.folder), dae: `${p.folder}.dae` }], files, maxTex, maxEmi: 128, grdRow: 0,
        // (a critter's tank: NH's water and its glass's inner faces are its shader's, drawn white they hid the fish; the critter fitted in
        // it: room-models-page.js fitCritter)
        ...(p.critter ? { hide: ['mWater', 'mGlassBack'], fit: true } : {})
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
      const out = modelOut(p);
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
    const ic = icon(p.code, p.icon, p.cat, PACKED_ICONS.has(p.home ?? ''));
    metas[p.code] = {
      w, d, h: +(y1 - Math.min(0, y0)).toFixed(1), kb: +(bytes / 1024).toFixed(1),
      v: createHash('sha256').update(readFileSync(modelOut(p))).digest('hex').slice(0, 8),
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
/** A texture's layer from its folder (an animated one's first frame: NH's flipbooks are `_Alb.0`, `_Alb.1`…), or null. */
const layer = (t: Tex, name: string): string | null =>
  [`${t.file}${name}.png`, `${t.file}${name}.0.png`].map((n) => join(ROOT, F(t.file), n)).find((f) => existsSync(f)) ?? null;
/** The layers over each other into one PNG (ffmpeg: alpha over, or the lighter of the two for a glow's). */
function flatten(files: string[], out: string, mode: 'over' | 'lighten'): string {
  if (files.length === 1) return files[0];
  const chain = files.slice(1).map((_, i) => `[${i ? `l${i}` : '0'}][${i + 1}]${mode === 'over' ? 'overlay=format=auto' : 'blend=all_mode=lighten'}${i === files.length - 2 ? '' : `[l${i + 1}]`}`).join(';');
  execFileSync('ffmpeg', ['-loglevel', 'error', '-y', ...files.flatMap((f) => ['-i', f]), '-filter_complex', chain, '-frames:v', '1', out]);
  return out;
}
for (const [list, kind, w, h] of [[walls, 'wall', 256, 512], [floors, 'floor', 512, 512]] as const) {
  for (const t of list) {
    if (!wanted(t.code, t)) continue;
    const dir = t.packed ? WORK : OUT;
    // NH's moving ones still: the albedo with its overlays (a vista's clouds, a railing in front) flattened over it
    const alb = [layer(t, '_Alb'), layer(t, '_AlbOry'), layer(t, '_AlbEx')].filter((f): f is string => !!f);
    if (!alb.length) throw new Error(`${t.code} ${t.en}: no albedo`);
    const out = join(dir, kind, `${t.code}.webp`);
    webp(flatten(alb, join(work, `${t.code}.png`), 'over'), out, 78, ['-resize', String(w), String(h), '-noalpha']);
    texBytes += statSync(out).size;
    // its glow (lit in the dark): the emissive map, its overlay's lighter over it
    const emi = [layer(t, '_Emi'), layer(t, '_EmiOry')].filter((f): f is string => !!f);
    const glow = join(dir, kind, `${t.code}.e.webp`);
    rmSync(glow, { force: true });
    if (emi.length && t.packed) webp(flatten(emi, join(work, `${t.code}.e.png`), 'lighten'), glow, 70, ['-resize', String(w), String(h), '-noalpha']);
    icon(t.code, t.icon, undefined, t.packed);
  }
}
if (texBytes) console.log(`wallpapers and floors: ${(texBytes / 1024 / 1024).toFixed(2)} MB`);

await surfaceTops(surfaceCodes(todo));
await emitters(emitterCodes(todo));
writeItems();
{
  const r = packRoom();
  console.log(`packs: ${r.packs}, ${(r.bytes / 1e6).toFixed(2)} MB (${r.written} written, ${r.removed} removed)${r.missing.length ? `; not converted: ${r.missing.length}` : ''}`);
}
rmSync(scratch, { recursive: true, force: true });
rmSync(work, { recursive: true, force: true });
