// Copy the meal log's food data (food-data/out/, built by `python3 -I food-data/scripts/build.py all` from the repo
// root; docs/food-data.md) into static/food/: index.json, verify.json and every dataset index.json lists. Not the barcode shards (jan/): no barcode
// scanning in v1. The app fetches them at runtime (lib/food/load.ts), never precached, under `?v=<index.version>`.
// Usage (from app/): npm run food:data   [-- <data dir>, default ../food-data/out]
// Checks: index.json lists only files that are there, and every dataset file there is listed (a stray or missing
// file fails, nothing is copied). static/food/ is replaced whole, so a dropped dataset goes too.
// Each item gets its search keys (`keys`: lib/food/search.ts keysOf), so the app builds none while the user types; a
// product's barcode is then dropped when the id has it (`off:<jan>`: the app reads it from `keys` only).
// index.json is written last, its `version` that of the files as shipped (fileVersion: their names and bytes, keys
// included), so a change here (keys, a dropped field) is a new version too and every phone refetches; out/'s index
// keeps the pipeline's own hash.
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
for (const [f, d] of data) {
  d.items = d.items.map((it) => {
    const keys = keysOf(it);
    if (keys.some((k) => k.includes(' '))) fail(`${f}: ${it.id}'s search keys hold a space`);
    const { jan, ...rest } = it;
    return { ...(jan !== undefined && it.id.endsWith(`:${jan}`) ? rest : it), keys: keys.join(' ') };
  });
  writeFileSync(join(OUT, f), JSON.stringify(d));
}
/** The first 12 hex digits of the sha256 of each shipped file's name and bytes, verify.json then the datasets in
 * index order (load.test.ts recomputes it). */
const hash = createHash('sha256');
for (const f of ['verify.json', ...files]) hash.update(`${f}\0`).update(readFileSync(join(OUT, f))).update('\0');
const version = hash.digest('hex').slice(0, 12);
const indexText = readFileSync(join(SRC, 'index.json'), 'utf8');
if (!indexText.includes(`"${index.version}"`)) fail('index.json: its version is not where it is expected');
writeFileSync(join(OUT, 'index.json'), indexText.replace(`"${index.version}"`, `"${version}"`));
for (const f of [...SIDECARS, ...files]) bytes += statSync(join(OUT, f)).size;
console.log(`food:data: ${files.length} datasets + ${SIDECARS.join(', ')} (${(bytes / 1e6).toFixed(1)} MB), version ${version} (out/: ${index.version}), from ${SRC}`);
