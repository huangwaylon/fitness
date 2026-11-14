// Copy the meal log's food data (food-data/out/, built by `python3 -I food-data/scripts/build.py all` from the repo
// root; docs/food-data.md) into static/food/: index.json, verify.json and every dataset index.json lists. Not the barcode shards (jan/): no barcode
// scanning in v1. The app fetches them at runtime (lib/food/load.ts), never precached, each under its own `?v=`
// (index.json's `files`).
// Usage (from app/): npm run food:data   [-- <data dir>, default ../food-data/out]
//   npm run food:data -- --only kalori [<data dir>]   ships the data dir's kalori.json alone into the committed
//   static/food/ (CI's weekly refresh, kalori-scrape.yml, has no other out/ files): the other files untouched, the
//   kalori entry kept (or added as build.py writes it), kalori.json written and `files` and `version` recomputed as
//   below, so the result is what the full path gives. (`--to <dir>`: another static dir, for the tests.)
// Checks: index.json lists only files that are there, and every dataset file there is listed (a stray or missing
// file fails, nothing is copied). static/food/ is replaced whole, so a dropped dataset goes too.
// Each core item gets its search keys (`keys`: lib/food/search.ts keysOf), so the first search builds none; a lazy
// dataset's (products: 239 KB gzipped of keys) are built on load, in db.ts's slices. A product's barcode is dropped
// when the id has it (`off:<jan>`: load.ts puts it back).
// index.json is written last: `files`, each shipped file's own version (a hash of its bytes, keys included), so a
// Kalori refresh refetches kalori.json alone, while a change here (keys, a dropped field) is a new version of
// every file it touches; and `version`, that of them all (an older app's or worker's `?v=`, the fallback for an index
// without `files`). out/'s index keeps the pipeline's own hash.
import { createHash } from 'node:crypto';
import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { keysOf } from '../src/lib/food/search.ts';
import type { Dataset } from '../src/lib/food/types.ts';

const APP = join(import.meta.dirname, '..');
const args = process.argv.slice(2);
const ONLY = option('--only');
const TO = option('--to');
const SRC = resolve(APP, args[0] ?? '../food-data/out');
const OUT = TO ? resolve(APP, TO) : join(APP, 'static', 'food');
/** Beside the datasets: the index and the cross-source verify groups. */
const SIDECARS = ['index.json', 'verify.json'];
/** Kalori's index entry, as build.py's build_index writes it. */
const KALORI = { file: 'kalori.json', source: 'kalori', badge: '店', secondary: true, lazy: true };

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

function readDataset(path: string, f: string): Dataset {
  const d = JSON.parse(readFileSync(path, 'utf8')) as { items?: unknown; label?: unknown };
  if (!Array.isArray(d.items) || typeof d.label !== 'string') fail(`${f} is not a dataset ({label, items, …})`);
  return d as Dataset;
}

if (ONLY !== undefined) {
  if (ONLY !== 'kalori') fail('--only: only kalori ships alone (lazy, and in no verify.json group)');
  if (!existsSync(join(OUT, 'index.json'))) fail(`no index.json in ${OUT}`);
  if (!existsSync(join(SRC, KALORI.file))) fail(`no ${KALORI.file} in ${SRC}`);
  const index = JSON.parse(readFileSync(join(OUT, 'index.json'), 'utf8')) as { version?: unknown; datasets?: { file?: unknown; lazy?: unknown }[] };
  const datasets = index.datasets ?? [];
  const at = datasets.find((d) => d.file === KALORI.file);
  if (at && at.lazy !== true) fail(`${OUT}/index.json lists ${KALORI.file} as not lazy`);
  if (!at) datasets.push(KALORI);
  const files = datasets.map((d) => d.file as string);
  const missing = ['verify.json', ...files].filter((f) => f !== KALORI.file && !existsSync(join(OUT, f)));
  if (missing.length) fail(`missing in ${OUT}: ${missing.join(', ')}`);
  writeFileSync(join(OUT, KALORI.file), JSON.stringify(ship(KALORI.file, readDataset(join(SRC, KALORI.file), KALORI.file), true)));
  const version = writeIndex({ ...index, datasets }, files);
  console.log(`food:data: ${KALORI.file} alone (${(statSync(join(OUT, KALORI.file)).size / 1e6).toFixed(1)} MB) from ${SRC}, version ${version}`);
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
for (const [f, d] of data) writeFileSync(join(OUT, f), JSON.stringify(ship(f, d, lazy.has(f))));
const version = writeIndex(index, files);
for (const f of [...SIDECARS, ...files]) bytes += statSync(join(OUT, f)).size;
console.log(`food:data: ${files.length} datasets + ${SIDECARS.join(', ')} (${(bytes / 1e6).toFixed(1)} MB), version ${version} (out/: ${index.version}), from ${SRC}`);
