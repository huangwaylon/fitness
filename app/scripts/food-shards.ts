// After `vite build` (npm run build runs it), the food data's build-time cuts, from the files as committed:
// - the chain menus' id shards (lib/food/kal.ts) into build-pages/food/kal/, from build-pages/food/kalori.json:
//   `<n>.json` each run's items and `at.json` the runs' first ids, all fetched under kalori.json's own `?v=` (load.ts
//   wantIds), so a Kalori refresh (kalori-scrape.yml commits kalori.json and index.json alone) needs nothing else;
// - the pictures' index (build-pages/food-img/index.json, food-data/images/fi.py) without the products' ids, which go
//   to `off.json` (the index's `off`: its `?v=`; lib/food/images.ts loadProductImages): a day's open reads ~6k ids,
//   not ~25k.
// Neither without its file (the dev server: the app falls back to the whole file).
//   node scripts/food-shards.ts [<build dir>, default build-pages]
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { kalShards } from '../src/lib/food/kal.ts';
import type { FoodImageIndex } from '../src/lib/food/images.ts';
import type { Shipped } from '../src/lib/food/types.ts';

const build = resolve(process.argv[2] ?? join(import.meta.dirname, '..', 'build-pages'));

const dir = join(build, 'food');
const out = join(dir, 'kal');
rmSync(out, { recursive: true, force: true });
if (existsSync(join(dir, 'kalori.json'))) {
  const { at, shards } = kalShards(JSON.parse(readFileSync(join(dir, 'kalori.json'), 'utf8')) as Shipped);
  mkdirSync(out);
  let bytes = 0;
  shards.forEach((s, i) => {
    const b = JSON.stringify(s);
    bytes += Buffer.byteLength(b);
    writeFileSync(join(out, `${i}.json`), b);
  });
  writeFileSync(join(out, 'at.json'), JSON.stringify({ at }));
  console.log(`food/kal/: ${shards.length} id shards of the chain menus, ${(bytes / 1e6).toFixed(1)} MB`);
} else console.log(`food/kal/: no kalori.json in ${dir}, no shards`);

const img = join(build, 'food-img', 'index.json');
if (existsSync(img)) {
  const whole = readFileSync(img);
  const ix = JSON.parse(whole.toString('utf8')) as FoodImageIndex;
  const ids = Object.entries(ix.ids);
  const offText = JSON.stringify({ ids: Object.fromEntries(ids.filter(([id]) => id.startsWith('off:'))) });
  const off = createHash('sha256').update(offText).digest('hex').slice(0, 12);
  const indexText = JSON.stringify({ ...ix, ids: Object.fromEntries(ids.filter(([id]) => !id.startsWith('off:'))), off });
  writeFileSync(img, indexText);
  writeFileSync(join(build, 'food-img', 'off.json'), offText);
  const kb = (s: string | Buffer) => (Buffer.byteLength(s) / 1e3).toFixed(0);
  console.log(`food-img/index.json: ${kb(whole)} → ${kb(indexText)} KB, the products' ids in off.json (${kb(offText)} KB)`);
}
