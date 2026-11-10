// NH's own 2D icons from the game files (the export's `Layout_*` folders: docs/world3d-assets.md "How they're made"), in
// place of the downloaded ones: the balloon catalogue's (static/art/finds/{items,recipes}/<id>.webp), the critters'
// (static/art/critters/) and the beach finds' (static/art/finds/<id>.webp: fossils, shells, star fragments, goods). Each
// file keeps its path and its pixel size (the art manifest's, 96 px squares but a few trimmed finds), so nothing that
// shows one changes.
// Usage (from app/): NH_MODELS=~/Downloads/acnh-2.0.0-models/Model npm run icons:nh [-- --only=critters/,finds/items/]
//
// Which icon: the ACNH spreadsheet (Norviah/animal-crossing, as scripts/catalog.ts reads it) names each item's icon by
// its acnhcdn URL, `…/latest/<Kind>/<File>.png`, and the export holds the same picture as `Layout_<Kind>_<File>`:
// - catalogue furniture and umbrellas: the first variation's `image` / `storageImage` (Layout_FtrIcon_…);
// - catalogue clothing: the first variation's `closetImage` (Layout_ClosetIcon_…: the closet's look);
// - recipes: `image` (Layout_DIYRecipeIcon_…: the item at NH's recipe tilt);
// - critters: `iconImage` (Layout_MenuIcon_…: the pocket icon, the look the app had; the critterpedia's
//   Layout_Book*Icon are 1024 × 512 photos);
// - fossils: `image` (Layout_FtrIcon_…, the assessed piece); shells, fragments, goods: Other's `inventoryImage`
//   (Layout_MenuIcon_…), the junk a line pulls up and the mushrooms its `storageImage` (Layout_FtrIcon_…); the shovel and the watering can: Tools-Goods' `image`.
// A catch new to the island (i18n/catch.en.json) gets its key here. What the spreadsheet can't name keeps its file
// (the run lists them).
//
// The model folder is untrusted input: only a folder's PNG is read (by cwebp and dwebp); nothing in it is run.
// Requires cwebp/dwebp (brew install webp).
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { slug } from './catalog.ts';

const APP = join(import.meta.dirname, '..');
const ART = join(APP, 'static', 'art');
const MANIFEST = join(ART, 'manifest.json');
const CATALOG = join(APP, 'src', 'lib', 'components', 'island', 'catalog.json');
const SHEET = 'https://raw.githubusercontent.com/Norviah/animal-crossing/master/json/data/';
const CACHE = join(tmpdir(), 'island-catalog-src');
const only = (process.argv.find((a) => a.startsWith('--only='))?.slice(7) ?? '').split(',').filter(Boolean);

const MODELS = process.env.NH_MODELS?.replace(/^~(?=\/)/, process.env.HOME ?? '~');
if (!MODELS || !existsSync(MODELS)) {
  console.error('Set NH_MODELS to the folder of NH model folders, e.g. NH_MODELS=~/Downloads/acnh-2.0.0-models/Model npm run icons:nh');
  process.exit(1);
}
const ROOT: string = MODELS;
const SAFE = /^[A-Za-z0-9_]+$/;

type Raw = Record<string, unknown> & { name: string; variations?: Record<string, unknown>[] };
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

/** An acnhcdn icon URL → the export's folder of that picture, if it has it. */
function layoutOf(url: unknown): string | null {
  const m = typeof url === 'string' ? /\/latest\/([A-Za-z]+)\/([A-Za-z0-9_]+?)(?:\.png)?$/.exec(url) : null;
  return m ? `Layout_${m[1]}_${m[2]}` : null;
}
/** The folder's PNG (the folder named exactly, its name safe), or null. */
function pngOf(folder: string | null): string | null {
  if (!folder || !SAFE.test(folder)) return null;
  const dir = join(ROOT, `${folder}.Nin_NX_NVN`);
  if (!existsSync(dir)) return null;
  const png = readdirSync(dir).find((n) => /^[A-Za-z0-9_]+\.png$/.test(n) && statSync(join(dir, n)).isFile());
  return png ? join(dir, png) : null;
}

/** Alpha bounding box (a lossless webp → PAM round trip, as scripts/fetch-assets.ts trims), padded 2 px. */
function alphaBox(src: string, tmp: string): [number, number, number, number] {
  const lossless = join(tmp, 'trim.webp'), pam = join(tmp, 'trim.pam');
  execFileSync('cwebp', ['-quiet', '-lossless', '-exact', src, '-o', lossless]);
  execFileSync('dwebp', ['-quiet', lossless, '-pam', '-o', pam]);
  const buf = readFileSync(pam);
  const head = buf.subarray(0, 200).toString('latin1');
  const end = head.indexOf('ENDHDR\n') + 7;
  const W = Number(/WIDTH (\d+)/.exec(head)![1]), H = Number(/HEIGHT (\d+)/.exec(head)![1]);
  let x0 = W, y0 = H, x1 = -1, y1 = -1;
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++)
      if (buf[end + (y * W + x) * 4 + 3] > 8) {
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
        if (y < y0) y0 = y;
        if (y > y1) y1 = y;
      }
  if (x1 < 0) return [0, 0, W, H];
  x0 = Math.max(0, x0 - 2); y0 = Math.max(0, y0 - 2); x1 = Math.min(W - 1, x1 + 2); y1 = Math.min(H - 1, y1 + 2);
  return [x0, y0, x1 - x0 + 1, y1 - y0 + 1];
}

interface Job { key: string; folder: string | null; w: number; h: number; trim: boolean; q: [string, string] }

async function main() {
  const manifest = JSON.parse(readFileSync(MANIFEST, 'utf8')) as { version: number; files: Record<string, { path: string; w: number; h: number; source: string }> };
  const jobs: Job[] = [];
  const CAT_Q: [string, string] = ['75', '80'], ART_Q: [string, string] = ['86', '100'];

  // the catalogue (scripts/catalog.ts: furniture, clothing, umbrellas; recipes)
  /** The catalogue's category (catalog.json) → its spreadsheet tab: an id is the item's only within its category (the
   *  housewares' tank and the tops' tank, a wall's butterfly-fish model and the toy). */
  const TABS: Record<string, string> = {
    housewares: 'Housewares', misc: 'Miscellaneous', wall: 'Wall-mounted', ceiling: 'Ceiling Decor', tops: 'Tops', bottoms: 'Bottoms',
    dress: 'Dress-Up', headwear: 'Headwear', accessories: 'Accessories', socks: 'Socks', shoes: 'Shoes', umbrellas: 'Umbrellas'
  };
  const byName = new Map<string, unknown>();
  for (const [c, tab] of Object.entries(TABS)) for (const r of await sheet(tab)) {
    const icon = ['housewares', 'misc', 'wall', 'ceiling'].includes(c) ? field(r, 'image') : c === 'umbrellas' ? field(r, 'storageImage') : field(r, 'closetImage');
    if (!byName.has(`${c} ${slug(r.name)}`)) byName.set(`${c} ${slug(r.name)}`, icon);
  }
  const recipes = new Map((await sheet('Recipes')).map((r) => [slug(r.name), r]));
  const cat = JSON.parse(readFileSync(CATALOG, 'utf8')) as { items: string[]; recipes: string[] };
  for (const row of cat.items) {
    const [id, c] = row.split(' ');
    jobs.push({ key: `finds/items/${id}`, folder: layoutOf(byName.get(`${c} ${id}`)), w: 96, h: 96, trim: false, q: CAT_Q });
  }
  for (const row of cat.recipes) {
    const id = row.split(' ')[0];
    jobs.push({ key: `finds/recipes/${id}`, folder: layoutOf(recipes.get(id)?.image), w: 96, h: 96, trim: false, q: CAT_Q });
  }

  // the critters and the beach finds: every manifest key of theirs, at its size
  const critters = new Map<string, Raw>();
  for (const tab of ['Fish', 'Insects', 'Sea Creatures']) for (const r of await sheet(tab)) critters.set(slug(r.name), r);
  /** The island's ids the spreadsheet spells otherwise. */
  const ALIAS: Record<string, string> = { clownfish: 'clown-fish', weeds: 'clump-of-weeds' };
  const finds = new Map<string, unknown>();
  for (const r of await sheet('Fossils')) finds.set(slug(r.name), r.image);
  /** Shown as their storage picture (the app's look: the junk, the mushrooms), not the pocket's. */
  const STORAGE = /^(boot|empty-can|old-tire|.*-mushroom)$/;
  for (const r of await sheet('Other')) if (!finds.has(slug(r.name))) finds.set(slug(r.name), STORAGE.test(slug(r.name)) ? r.storageImage : r.inventoryImage);
  for (const r of await sheet('Tools-Goods')) if (!finds.has(slug(r.name))) finds.set(slug(r.name), field(r, 'image'));
  // every catch the island has (i18n/catch.en.json) has its icon: a new one's key made here
  const catches = JSON.parse(readFileSync(join(APP, 'src', 'lib', 'i18n', 'catch.en.json'), 'utf8')) as Record<string, string>;
  for (const k of Object.keys(catches)) {
    const id = /^(?:critter|sea)\.name\.([a-z0-9-]+)$/.exec(k)?.[1];
    if (id && !manifest.files[`critters/${id}`]) manifest.files[`critters/${id}`] = { path: `critters/${id}.webp`, w: 96, h: 96, source: '' };
  }
  const trims = (k: string) => /^finds\/(rock|.*-mushroom)$/.test(k);
  for (const [key, e] of Object.entries(manifest.files)) {
    const m = /^(critters|finds)\/([a-z0-9-]+)$/.exec(key);
    if (!m) continue;
    const id = ALIAS[m[2]] ?? m[2];
    // (the junk on a line, a boot or a can, is Other's)
    const url = (m[1] === 'critters' && critters.get(id)?.iconImage) || finds.get(id);
    jobs.push({ key, folder: layoutOf(url), w: e.w, h: e.h, trim: trims(key), q: ART_Q });
  }

  const todo = jobs.filter((j) => !only.length || only.some((o) => j.key.startsWith(o)));
  const tmp = join(tmpdir(), `nh-icons-${process.pid}`);
  mkdirSync(tmp, { recursive: true });
  const kept: string[] = [];
  let n = 0;
  for (const j of todo) {
    const png = pngOf(j.folder);
    if (!png) {
      kept.push(`${j.key}${j.folder ? ` (no ${j.folder})` : ''}`);
      continue;
    }
    const dest = join(ART, `${j.key}.webp`);
    mkdirSync(join(dest, '..'), { recursive: true });
    const crop = j.trim ? ['-crop', ...alphaBox(png, tmp).map(String)] : [];
    execFileSync('cwebp', ['-quiet', '-q', j.q[0], '-alpha_q', j.q[1], '-m', '6', ...crop, '-resize', String(j.w), String(j.h), png, '-o', dest]);
    const e = manifest.files[j.key];
    if (e) e.source = `nh:${j.folder}`;
    if (++n % 200 === 0) console.log(`  ${n}`);
  }
  rmSync(tmp, { recursive: true, force: true });
  for (const [k, e] of Object.entries(manifest.files)) if (!e.source) delete manifest.files[k];
  manifest.files = Object.fromEntries(Object.entries(manifest.files).sort(([a], [b]) => a.localeCompare(b)));
  manifest.version += n ? 1 : 0;
  writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2) + '\n');
  console.log(`${n} icons from the game files; ${kept.length} kept as they were${kept.length ? `:\n  ${kept.join('\n  ')}` : ''}`);
}

if (import.meta.main)
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
