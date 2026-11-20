// Copy the meal log's food data (food-data/out/, built by `python3 -I food-data/scripts/build.py all` from the repo
// root; docs/food-data.md) into static/food/: index.json, verify.json, every dataset index.json lists and the barcode
// shards beyond the products (jan/: shipJan). The app fetches them at runtime (lib/food/load.ts), never precached, each
// under its own `?v=` (index.json's `files`; a shard's, `jan`).
// Usage (from app/): npm run food:data   [-- <data dir>, default ../food-data/out]. Runs on node alone, no npm
// (kalori-scrape.yml's update-merge: `node app/scripts/food-data.ts --only kalori`): only node: and relative imports
// (lib/food/nodeAlone.test.ts).
//   npm run food:data -- --only kalori|products [<data dir>]   ships the data dir's kalori.json (or products.json) alone
//   into the committed static/food/ (CI's weekly refresh, kalori-scrape.yml, has no other out/ files; `build.py off`
//   neither): the other files untouched, its entry kept (or added as build.py writes it), the file written and `files`
//   and `version` recomputed as below, so the result is what the full path gives. (`--to <dir>`: another static dir,
//   for the tests.)
//   npm run food:data -- --reship   static/food/ shipped again from itself (decoded, through the checks below, written
//   as above): a fix or rule changes only the rows it touches, without food-data/out/ (stale against the products and
//   shards, which were re-shipped from static/food/ since).
// Checks: index.json lists only files that are there, and every dataset file there is listed (a stray or missing
// file fails, nothing is copied). static/food/ is replaced whole, so a dropped dataset goes too. Every item of every
// file, the shards' too, goes through food-data/data_src/food_fixes.json's reviewed correction for its id, then
// lib/food/plausible.ts's rules (docs/food-data.md "Data checks"); what each fired is printed.
// No dataset ships its search keys (lib/food/search.ts keysOf: the parsing worker builds them, ~20 ms for the core
// sets; shipped, they were 132 KB of the core's 448 KB gzipped); each item's are checked here. A product's barcode is dropped
// when the id has it (`off:<jan>`: load.ts puts it back). Every dataset ships by column (`cols`, types.ts Shipped;
// db.ts decodeItems), its ids without the prefix they share (`idPrefix`): 30k products 4.1 MB, 0.8 MB gzipped, against
// 5.8 MB and 1.1 MB as objects; Kalori's 54k items 7.4 MB, 1.19 MB gzipped, against 10.0 MB and 1.62 MB.
// index.json is written last, with `schema` (db.ts FOOD_SCHEMA: the layout; an app that reads an older one refuses
// the index): `files`, each shipped file's own version (a hash of its bytes, keys included), so a
// Kalori refresh refetches kalori.json alone, while a change here (keys, a dropped field) is a new version of
// every file it touches; and `version`, that of them all; `at`, when that version first shipped (ms: kept while it
// stays; a いつもの's own update reads it, components/food/fresh.ts repeatPlan). out/'s index keeps the pipeline's own hash.
import { createHash } from 'node:crypto';
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, renameSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { keysOf } from '../src/lib/food/search.ts';
import { janShard, janShips } from '../src/lib/food/jan.ts';
import { applyFix, plausible, type Fix } from '../src/lib/food/plausible.ts';
import { FOOD_SCHEMA, countOf, decodeItems, deltaCode, headerOf, toColumns } from '../src/lib/food/db.ts';
import type { Dataset, Item, Shipped } from '../src/lib/food/types.ts';

const APP = join(import.meta.dirname, '..');
const args = process.argv.slice(2);
const RESHIP = args.includes('--reship') ? (args.splice(args.indexOf('--reship'), 1), true) : false;
const ONLY = option('--only');
const TO = option('--to');
const SRC = resolve(APP, args[0] ?? '../food-data/out');
const OUT = TO ? resolve(APP, TO) : join(APP, 'static', 'food');
/** The shipped index's `version` and `at` before this run (read first: the full path replaces OUT whole). */
const PREV = ((): { version?: unknown; at?: unknown } => {
  try {
    return JSON.parse(readFileSync(join(OUT, 'index.json'), 'utf8')) as { version?: unknown; at?: unknown };
  } catch {
    return {};
  }
})();
/** Beside the datasets: the index and the cross-source verify groups. */
const SIDECARS = ['index.json', 'verify.json'];
/** Kalori's and the products' index entries, as build.py's build_index writes them. */
const KALORI = { file: 'kalori.json', source: 'kalori', badge: '店', secondary: true, lazy: true };
const PRODUCTS = { file: 'products.json', source: 'off', badge: '商品', secondary: true, lazy: true };

/** The reviewed corrections by item id (docs/food-data.md "Data checks"). */
const FIXES = JSON.parse(readFileSync(join(APP, '..', 'food-data', 'data_src', 'food_fixes.json'), 'utf8')) as Record<string, Fix>;
/** The barcodes the fixes drop (index.json `drop`: the scanner's not found, never live OFF's same values), sorted. */
const dropCodes = (fixes: Record<string, Fix>): string[] =>
  Object.keys(fixes).flatMap((id) => (fixes[id].drop ? /^off:(\d{8,14})$/.exec(id)?.[1] ?? [] : [])).sort();
/** What the checks did, by fix or rule: printed at the end. */
const tally: Record<string, number> = {};

/** An item through its fix and the rules; null: dropped. */
function checked(raw: Item): Item | null {
  const fix = FIXES[raw.id];
  const fixed = applyFix(raw, fix);
  if (fix) tally[fix.drop ? 'fix:drop' : 'fix:set'] = (tally[fix.drop ? 'fix:drop' : 'fix:set'] ?? 0) + 1;
  if (!fixed) return null;
  const { item, flags } = plausible(fixed);
  for (const f of flags) tally[f] = (tally[f] ?? 0) + 1;
  return item;
}

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

/** A dataset's items as shipped (checked; their search keys, built on load, hold no space); a product's barcode dropped
 * when its id has it; no alcohol. */
function ship(f: string, d: Dataset): Dataset {
  d.items = d.items.flatMap((raw) => checked(raw) ?? []).map((it) => {
    if (keysOf(it).some((k) => k.includes(' '))) fail(`${f}: ${it.id}'s search keys hold a space`);
    // (alcohol, no longer tracked (2026-11-19): never shipped, an older build's `alc` dropped here)
    if ('alc' in it) delete (it as Item & { alc?: unknown }).alc;
    const { jan, ...rest } = it;
    return jan !== undefined && it.id === `off:${jan}` ? rest : it;
  });
  return d;
}

/** The columns delta-coded, by dataset source (db.ts deltaCode): the chain menus' ids and picture ids. */
const DELTA: Record<string, (keyof Item)[]> = { kalori: ['id', 'img'] };

/** A dataset file's bytes as shipped: by column (db.ts toColumns), its DELTA columns delta-coded. */
function shipped(f: string, d: Dataset): string {
  try {
    const s = toColumns(ship(f, d));
    return JSON.stringify(DELTA[d.source] && countOf(s) ? deltaCode(s, DELTA[d.source]) : s);
  } catch (e) {
    fail(`${f}: ${(e as Error).message}`);
  }
}

/** The barcode shards (`<src>/jan/<k>.json`, build.py's `{code: ITEM}` by the last 3 digits) into OUT/jan/ by column,
 * regrouped by lib/food/jan.ts janShard (the last 2: 100 files), each of the codes janShips (beyond `products`, no
 * store code or weak name), sorted, its barcode in its id, no aliases; none written for a shard left empty. OUT/jan/
 * replaced whole. Returns how many codes. */
function shipJan(src: string, products: Dataset): number {
  const have = new Set(products.items.map((it) => it.jan ?? it.id.slice(4)));
  const groups = new Map<string, Item[]>();
  for (const f of readdirSync(join(src, 'jan')).filter((f) => /^\d+\.json$/.test(f))) {
    const shard = JSON.parse(readFileSync(join(src, 'jan', f), 'utf8')) as Record<string, Item>;
    for (const it of Object.values(shard).filter((it) => janShips(it, have))) {
      const k = janShard(it.jan!);
      if (!groups.has(k)) groups.set(k, []);
      groups.get(k)!.push(it);
    }
  }
  rmSync(join(OUT, 'jan'), { recursive: true, force: true });
  mkdirSync(join(OUT, 'jan'));
  let n = 0;
  for (const [k, items] of groups) {
    items.sort((a, b) => (a.jan! < b.jan! ? -1 : 1));
    n += items.length;
    writeFileSync(join(OUT, 'jan', `${k}.json`), shipped(`jan/${k}.json`, { source: 'off', items: items.map(({ aliases: _a, ...it }) => it) }));
  }
  return n;
}

/** OUT/jan/'s version (index.json `jan`, every shard's `?v=`): the first 12 hex digits of a sha256 over each shard's
 * name and bytes, in name order; none without shards. */
function janVersion(): string | undefined {
  const dir = join(OUT, 'jan');
  const fs = existsSync(dir) ? readdirSync(dir).filter((f) => f.endsWith('.json')).sort() : [];
  if (!fs.length) return undefined;
  const h = createHash('sha256');
  for (const f of fs) h.update(`jan/${f}\0`).update(readFileSync(join(dir, f))).update('\0');
  return h.digest('hex').slice(0, 12);
}

/** The first 12 hex digits of a sha256: each shipped file's of its bytes (`files`), and `version`'s of each one's name
 * and bytes, verify.json then the datasets in index order (load.test.ts recomputes both); `jan`, the shards'
 * (janVersion). Writes index.json, once every dataset there is by column (`--only`'s untouched files too). */
function writeIndex(index: object, files: string[]): string {
  const hex = (h: ReturnType<typeof createHash>) => h.digest('hex').slice(0, 12);
  const hash = createHash('sha256');
  const versions: Record<string, string> = {};
  for (const f of ['verify.json', ...files]) {
    const b = readFileSync(join(OUT, f));
    if (f !== 'verify.json' && !(JSON.parse(b.toString('utf8')) as { cols?: unknown }).cols) fail(`${OUT}/${f} is not by column (schema ${FOOD_SCHEMA})`);
    hash.update(`${f}\0`).update(b).update('\0');
    versions[f] = hex(createHash('sha256').update(b));
  }
  const version = hex(hash);
  const { jan: _j, drop: _d, schema: _s, at: _a, ...head } = index as { jan?: unknown; drop?: unknown; schema?: unknown; at?: unknown };
  const jan = janVersion();
  const drop = dropCodes(FIXES);
  // `at`: when this version first shipped, kept while it stays (a re-run that changes nothing writes the same index)
  const at = PREV.version === version && typeof PREV.at === 'number' ? PREV.at : Date.now();
  writeFileSync(join(OUT, 'index.json'), JSON.stringify({ ...head, version, at, files: versions, ...(jan ? { jan } : {}), ...(drop.length ? { drop } : {}), schema: FOOD_SCHEMA }));
  return version;
}

/** build.py's dataset file (by item: out/'s layout; a shipped file is not one). */
function readDataset(path: string, f: string): Dataset {
  const d = JSON.parse(readFileSync(path, 'utf8')) as { items?: unknown; label?: unknown };
  if (!Array.isArray(d.items) || typeof d.label !== 'string') fail(`${f} is not a dataset ({label, items, …})`);
  return d as Dataset;
}

/** What the checks did (tally), one line. */
const checks = (): string => `checks: ${Object.entries(tally).sort().map(([k, n]) => `${k} ${n}`).join(', ') || 'none fired'}`;

/** A shipped file back to build.py's layout (its items as objects). */
function unship(path: string): Dataset {
  const s = JSON.parse(readFileSync(path, 'utf8')) as Shipped;
  if (!s.cols) fail(`${path} is not by column (schema ${FOOD_SCHEMA})`);
  return { ...headerOf(s), items: decodeItems(s) } as Dataset;
}

if (RESHIP) {
  if (ONLY !== undefined || args.length) fail('--reship takes no data dir and no --only');
  if (!existsSync(join(OUT, 'index.json'))) fail(`no index.json in ${OUT}`);
  const index = JSON.parse(readFileSync(join(OUT, 'index.json'), 'utf8')) as { datasets: { file: string; lazy?: boolean }[] };
  const files = index.datasets.map((d) => d.file);
  for (const d of index.datasets) writeFileSync(join(OUT, d.file), shipped(d.file, unship(join(OUT, d.file))));
  for (const f of existsSync(join(OUT, 'jan')) ? readdirSync(join(OUT, 'jan')).filter((f) => f.endsWith('.json')) : []) {
    const d = unship(join(OUT, 'jan', f));
    const bytes = shipped(`jan/${f}`, d);
    if (d.items.length) writeFileSync(join(OUT, 'jan', f), bytes);
    else rmSync(join(OUT, 'jan', f));
  }
  console.log(`food:data: ${OUT} shipped again from itself, version ${writeIndex(index, files)}; ${checks()}`);
  process.exit(0);
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
  // (the files it keeps by column, before anything is written: writeIndex's check, early)
  const rows = files.filter((f) => f !== entry.file && !(JSON.parse(readFileSync(join(OUT, f), 'utf8')) as { cols?: unknown }).cols);
  if (rows.length) fail(`not by column in ${OUT} (schema ${FOOD_SCHEMA}): ${rows.join(', ')}`);
  const data = readDataset(join(SRC, entry.file), entry.file);
  writeFileSync(join(OUT, entry.file), shipped(entry.file, data));
  // (the products' shards with them, when the data dir has them: which codes ship depends on products.json)
  if (ONLY === 'products' && existsSync(join(SRC, 'jan'))) console.log(`food:data: ${shipJan(SRC, data)} barcodes beyond the products into jan/`);
  const version = writeIndex({ ...index, datasets }, files);
  console.log(`food:data: ${entry.file} alone (${(statSync(join(OUT, entry.file)).size / 1e6).toFixed(1)} MB) from ${SRC}, version ${version}; ${checks()}`);
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

// (a data dir without shards keeps the shipped ones: built by `build.py off` only, from the raw OFF dump)
const keptJan = !existsSync(join(SRC, 'jan')) && existsSync(join(OUT, 'jan')) ? mkdtempSync(join(tmpdir(), 'food-jan-')) : null;
if (keptJan) renameSync(join(OUT, 'jan'), join(keptJan, 'jan'));
rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });
if (keptJan) renameSync(join(keptJan, 'jan'), join(OUT, 'jan')), rmSync(keptJan, { recursive: true });
let bytes = 0;
copyFileSync(join(SRC, 'verify.json'), join(OUT, 'verify.json'));
for (const [f, d] of data) writeFileSync(join(OUT, f), shipped(f, d));
const products = data.get(PRODUCTS.file);
if (products && existsSync(join(SRC, 'jan'))) console.log(`food:data: ${shipJan(SRC, products)} barcodes beyond the products into jan/`);
const version = writeIndex(index, files);
for (const f of [...SIDECARS, ...files]) bytes += statSync(join(OUT, f)).size;
console.log(`food:data: ${files.length} datasets + ${SIDECARS.join(', ')} (${(bytes / 1e6).toFixed(1)} MB), version ${version} (out/: ${index.version}), from ${SRC}; ${checks()}`);
