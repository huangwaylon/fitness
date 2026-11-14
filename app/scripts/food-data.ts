// Copy the meal log's food data (food-data/out/, built by `python3 -I food-data/scripts/build.py all` from the repo
// root; docs/food-data.md) into static/food/: index.json, verify.json and every dataset index.json lists. Not the barcode shards (jan/): no barcode
// scanning in v1. The app fetches them at runtime (lib/food/load.ts), never precached, each under its own `?v=`
// (index.json's `files`).
// Usage (from app/): npm run food:data   [-- <data dir>, default ../food-data/out]
//   npm run food:data -- --only kalori|products [<data dir>]   ships the data dir's kalori.json (or products.json) alone
//   into the committed static/food/ (CI's weekly refresh, kalori-scrape.yml, has no other out/ files; `build.py off`
//   neither): the other files untouched, its entry kept (or added as build.py writes it), the file written and `files`
//   and `version` recomputed as below, so the result is what the full path gives. (`--to <dir>`: another static dir,
//   for the tests.)
// Checks: index.json lists only files that are there, and every dataset file there is listed (a stray or missing
// file fails, nothing is copied). static/food/ is replaced whole, so a dropped dataset goes too.
// Each core item gets its search keys (`keys`: lib/food/search.ts keysOf), so the first search builds none; a lazy
// dataset's (products: 239 KB gzipped of keys) are built on load, in db.ts's slices. A product's barcode is dropped
// when the id has it (`off:<jan>`: load.ts puts it back). The products and the chain menus ship by column (`cols`,
// types.ts Shipped; db.ts decodeItems): 30k products 4.1 MB, 0.8 MB gzipped, against 5.8 MB and 1.1 MB as objects;
// Kalori's 54k items 7.4 MB, 1.19 MB gzipped, against 10.0 MB and 1.62 MB.
// index.json is written last: `files`, each shipped file's own version (a hash of its bytes, keys included), so a
// Kalori refresh refetches kalori.json alone, while a change here (keys, a dropped field) is a new version of
// every file it touches; and `version`, that of them all (an older app's or worker's `?v=`, the fallback for an index
// without `files`). out/'s index keeps the pipeline's own hash.
import { createHash } from 'node:crypto';
import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { decodeItems, headerOf } from '../src/lib/food/db.ts';
import { keysOf } from '../src/lib/food/search.ts';
import type { Dataset, Item, Shipped } from '../src/lib/food/types.ts';

const APP = join(import.meta.dirname, '..');
const args = process.argv.slice(2);
const ONLY = option('--only');
const TO = option('--to');
const SRC = resolve(APP, args[0] ?? '../food-data/out');
const OUT = TO ? resolve(APP, TO) : join(APP, 'static', 'food');
/** Beside the datasets: the index and the cross-source verify groups. */
const SIDECARS = ['index.json', 'verify.json'];
/** Kalori's and the products' index entries, as build.py's build_index writes them. */
const KALORI = { file: 'kalori.json', source: 'kalori', badge: '店', secondary: true, lazy: true };
const PRODUCTS = { file: 'products.json', source: 'off', badge: '商品', secondary: true, lazy: true };
/** The datasets shipped by column (types.ts Shipped), each with the id prefix its ids share. .github/scripts/
 * kalori-ship.mjs ships kalori.json the same way (kalori-scrape.yml's update-merge: no npm). */
const COLUMNAR: Record<string, string> = { 'products.json': 'off:', 'kalori.json': 'kal:' };
/** The fields whose null a column keeps (unknown: db.ts decodeItems); another field's null would be lost. */
const NULLS = new Set(['p', 'f', 'c', 'salt']);
/** The columns' order: the rest after these, as the items first have them. */
const COLS = ['id', 'name', 'brand', 'cat', 'kcal', 'p', 'f', 'c', 'salt', 'portions'];

/** The datasets that ship alone (lazy, and in no verify.json group), in build_index's order. */
const ALONE = { products: PRODUCTS, kalori: KALORI };

function fail(msg: string): never {
  console.error(`food:data: ${msg}`);
  process.exit(1);
}

/** `--name value`, taken out of args. */
function option(name: string): string | undefined {
  const i = args.indexOf(name);
  if (i < 0) return undefined;
  const [, v] = args.splice(i, 2);
  return v ?? fail(`${name} needs a value`);
}

/** A dataset's items as shipped: a core one's with their search keys, a lazy one's without; a product's barcode
 * dropped when its id has it. */
function ship(f: string, d: Dataset, lazy: boolean): Dataset {
  d.items = d.items.map((it) => {
    const keys = keysOf(it);
    if (keys.some((k) => k.includes(' '))) fail(`${f}: ${it.id}'s search keys hold a space`);
    const { jan, ...rest } = it;
    const item = jan !== undefined && it.id === `off:${jan}` ? rest : it;
    return lazy ? item : { ...item, keys: keys.join(' ') };
  });
  return d;
}

/** A dataset by column: each field's values in item order, `null` where an item has none; ids without `prefix`. */
function columnar(f: string, d: Dataset, prefix: string): Shipped {
  const { items, ...head } = d;
  const keys = [...new Set([...COLS, ...items.flatMap((it) => Object.keys(it))])].filter((k) => items.some((it) => k in it)) as (keyof Item)[];
  const cols: Partial<Record<keyof Item, unknown[]>> = {};
  for (const k of keys) cols[k] = items.map((it) => (k === 'id' ? it.id.slice(prefix.length) : (it[k] ?? null)));
  if (items.some((it) => !it.id.startsWith(prefix))) fail(`${f}: an id without ${prefix}`);
  const lost = items.find((it) => Object.entries(it).some(([k, v]) => v === null && !NULLS.has(k)));
  if (lost) fail(`${f}: ${lost.id} has a null its column can't keep`);
  return { ...head, idPrefix: prefix, cols };
}

/** A dataset file's bytes as shipped (by column for COLUMNAR's). */
const shipped = (f: string, d: Dataset, lazy: boolean): string => {
  const s = ship(f, d, lazy);
  return JSON.stringify(f in COLUMNAR ? columnar(f, s, COLUMNAR[f]) : s);
};

/** The first 12 hex digits of a sha256: each shipped file's of its bytes (`files`), and `version`'s of each one's name
 * and bytes, verify.json then the datasets in index order (load.test.ts recomputes both). Writes index.json. */
function writeIndex(index: object, files: string[]): string {
  const hex = (h: ReturnType<typeof createHash>) => h.digest('hex').slice(0, 12);
  const hash = createHash('sha256');
  const versions: Record<string, string> = {};
  for (const f of ['verify.json', ...files]) {
    const b = readFileSync(join(OUT, f));
    hash.update(`${f}\0`).update(b).update('\0');
    versions[f] = hex(createHash('sha256').update(b));
  }
  const version = hex(hash);
  writeFileSync(join(OUT, 'index.json'), JSON.stringify({ ...index, version, files: versions }));
  return version;
}

/** build.py's dataset file, or one shipped by column (static/'s products.json, shipped again: decoded as it was). */
function readDataset(path: string, f: string): Dataset {
  const d = JSON.parse(readFileSync(path, 'utf8')) as { items?: unknown; cols?: unknown; label?: unknown };
  if (d.cols && typeof d.cols === 'object' && !d.items) return { ...headerOf(d as Shipped), items: decodeItems(d as Shipped) };
  if (!Array.isArray(d.items) || typeof d.label !== 'string') fail(`${f} is not a dataset ({label, items, …})`);
  return d as Dataset;
}

if (ONLY !== undefined) {
  if (!Object.hasOwn(ALONE, ONLY)) fail(`--only: only ${Object.keys(ALONE).join(' or ')} ships alone (lazy, and in no verify.json group)`);
  const entry = ALONE[ONLY as keyof typeof ALONE];
  if (!existsSync(join(OUT, 'index.json'))) fail(`no index.json in ${OUT}`);
  if (!existsSync(join(SRC, entry.file))) fail(`no ${entry.file} in ${SRC}`);
  const index = JSON.parse(readFileSync(join(OUT, 'index.json'), 'utf8')) as { version?: unknown; datasets?: { file?: unknown; lazy?: unknown }[] };
  const datasets = index.datasets ?? [];
  const at = datasets.find((d) => d.file === entry.file);
  if (at && at.lazy !== true) fail(`${OUT}/index.json lists ${entry.file} as not lazy`);
  if (!at) {
    // where build.py puts it: before an alone dataset that comes after it
    const order: unknown[] = Object.values(ALONE).map((e) => e.file);
    const i = datasets.findIndex((d) => order.indexOf(d.file) > order.indexOf(entry.file));
    datasets.splice(i < 0 ? datasets.length : i, 0, entry);
  }
  const files = datasets.map((d) => d.file as string);
  const missing = ['verify.json', ...files].filter((f) => f !== entry.file && !existsSync(join(OUT, f)));
  if (missing.length) fail(`missing in ${OUT}: ${missing.join(', ')}`);
  writeFileSync(join(OUT, entry.file), shipped(entry.file, readDataset(join(SRC, entry.file), entry.file), true));
  const version = writeIndex({ ...index, datasets }, files);
  console.log(`food:data: ${entry.file} alone (${(statSync(join(OUT, entry.file)).size / 1e6).toFixed(1)} MB) from ${SRC}, version ${version}`);
  process.exit(0);
}

if (!existsSync(join(SRC, 'index.json'))) fail(`no index.json in ${SRC}`);
const index = JSON.parse(readFileSync(join(SRC, 'index.json'), 'utf8')) as { version?: unknown; datasets?: { file?: unknown }[] };
if (typeof index.version !== 'string' || !/^[0-9a-f]{12}$/.test(index.version)) fail('index.json has no 12-hex version');
const listed = (index.datasets ?? []).map((d) => d.file);
if (!listed.length || listed.some((f) => typeof f !== 'string' || !/^[\w-]+\.json$/.test(f))) fail('index.json lists no datasets, or a bad file name');
const files = listed as string[];
if (new Set(files).size !== files.length) fail('index.json lists a file twice');

const missing = [...files, ...SIDECARS].filter((f) => !existsSync(join(SRC, f)));
if (missing.length) fail(`missing in ${SRC}: ${missing.join(', ')}`);
const stray = readdirSync(SRC).filter((f) => f.endsWith('.json') && !files.includes(f) && !SIDECARS.includes(f));
if (stray.length) fail(`not in index.json: ${stray.join(', ')}`);
const data = new Map<string, Dataset>();
for (const f of files) data.set(f, readDataset(join(SRC, f), f));

rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });
let bytes = 0;
copyFileSync(join(SRC, 'verify.json'), join(OUT, 'verify.json'));
const lazy = new Set((index.datasets ?? []).filter((d) => (d as { lazy?: unknown }).lazy === true).map((d) => d.file));
for (const [f, d] of data) writeFileSync(join(OUT, f), shipped(f, d, lazy.has(f)));
const version = writeIndex(index, files);
for (const f of [...SIDECARS, ...files]) bytes += statSync(join(OUT, f)).size;
console.log(`food:data: ${files.length} datasets + ${SIDECARS.join(', ')} (${(bytes / 1e6).toFixed(1)} MB), version ${version} (out/: ${index.version}), from ${SRC}`);
