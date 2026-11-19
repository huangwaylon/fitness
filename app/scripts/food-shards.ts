// After `vite build` (npm run build runs it): the chain menus' id shards (lib/food/kal.ts) into build-pages/food/kal/,
// made from build-pages/food/kalori.json as shipped: `<n>.json` each run's items and `at.json` the runs' first ids, all
// fetched under kalori.json's own `?v=` (load.ts wantIds), so a Kalori refresh (kalori-scrape.yml commits kalori.json
// and index.json alone) needs nothing else. None without kalori.json (the dev server: the app falls back to the file).
//   node scripts/food-shards.ts [<food dir>, default build-pages/food]
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { kalShards } from '../src/lib/food/kal.ts';
import type { Shipped } from '../src/lib/food/types.ts';

const dir = resolve(process.argv[2] ?? join(import.meta.dirname, '..', 'build-pages', 'food'));
const out = join(dir, 'kal');
rmSync(out, { recursive: true, force: true });
if (!existsSync(join(dir, 'kalori.json'))) {
  console.log(`food/kal/: no kalori.json in ${dir}, no shards`);
  process.exit(0);
}
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
