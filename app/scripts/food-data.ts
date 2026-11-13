// Copy the meal log's food data (food-data/out/, built by `python3 -I food-data/scripts/build.py all` from the repo
// root; docs/food-data.md) into static/food/: index.json, verify.json and every dataset index.json lists. Not the barcode shards (jan/): no barcode
// scanning in v1. The app fetches them at runtime (lib/food/load.ts), never precached, each under its own `?v=`
// (index.json's `files`).
// Usage (from app/): npm run food:data   [-- <data dir>, default ../food-data/out]
// Checks: index.json lists only files that are there, and every dataset file there is listed (a stray or missing
// file fails, nothing is copied). static/food/ is replaced whole, so a dropped dataset goes too.
// Each core item gets its search keys (`keys`: lib/food/search.ts keysOf), so the first search builds none; a lazy
// dataset's (products: 239 KB gzipped of keys) are built on load, in db.ts's slices. A product's barcode is dropped
// when the id has it (`off:<jan>`: load.ts puts it back).
// index.json is written last: `files`, each shipped file's own version (a hash of its bytes, keys included), so a
// weekly Kalori refresh refetches kalori.json alone, while a change here (keys, a dropped field) is a new version of
// every file it touches; and `version`, that of them all (an older app's or worker's `?v=`, the fallback for an index
// without `files`). out/'s index keeps the pipeline's own hash.
import { createHash } from 'node:crypto';
import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { keysOf } from '../src/lib/food/search.ts';
import type { Dataset } from '../src/lib/food/types.ts';

const APP = join(import.meta.dirname, '..');
const SRC = resolve(APP, process.argv[2] ?? '../food-data/out');
const OUT = join(APP, 'static', 'food');
/** Beside the datasets: the index and the cross-source verify groups. */
const SIDECARS = ['index.json', 'verify.json'];

function fail(msg: string): never {
  console.error(`food:data: ${msg}`);
  process.exit(1);
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
for (const f of files) {
  const d = JSON.parse(readFileSync(join(SRC, f), 'utf8')) as { items?: unknown; label?: unknown };
  if (!Array.isArray(d.items) || typeof d.label !== 'string') fail(`${f} is not a dataset ({label, items, …})`);
  data.set(f, d as Dataset);
}

rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });
let bytes = 0;
copyFileSync(join(SRC, 'verify.json'), join(OUT, 'verify.json'));
const lazy = new Set((index.datasets ?? []).filter((d) => (d as { lazy?: unknown }).lazy === true).map((d) => d.file));
for (const [f, d] of data) {
  d.items = d.items.map((it) => {
    const keys = keysOf(it);
    if (keys.some((k) => k.includes(' '))) fail(`${f}: ${it.id}'s search keys hold a space`);
    const { jan, ...rest } = it;
    const item = jan !== undefined && it.id === `off:${jan}` ? rest : it;
    return lazy.has(f) ? item : { ...item, keys: keys.join(' ') };
  });
  writeFileSync(join(OUT, f), JSON.stringify(d));
}
/** The first 12 hex digits of a sha256: each shipped file's of its bytes (`files`), and `version`'s of each one's name
 * and bytes, verify.json then the datasets in index order (load.test.ts recomputes both). */
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
for (const f of [...SIDECARS, ...files]) bytes += statSync(join(OUT, f)).size;
console.log(`food:data: ${files.length} datasets + ${SIDECARS.join(', ')} (${(bytes / 1e6).toFixed(1)} MB), version ${version} (out/: ${index.version}), from ${SRC}`);
