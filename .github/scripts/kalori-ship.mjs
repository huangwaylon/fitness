// kalori-ship.mjs <converted kalori.json> <food dir>: <food dir>/kalori.json and index.json as app/scripts/food-data.ts
// `--only kalori` writes them (ship() for a lazy dataset: JSON.stringify, a jan in an off:<jan> id dropped; writeIndex:
// each file's sha256 and the version over verify.json then the datasets), with no npm: kalori-scrape.yml's update-merge
// makes the bytes it commits itself and compares update-build's with them.
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const [src, dir] = process.argv.slice(2);
const d = JSON.parse(readFileSync(src, 'utf8'));
if (!Array.isArray(d.items) || typeof d.label !== 'string') throw new Error(`${src} is not a dataset`);
d.items = d.items.map((it) => {
  const { jan, ...rest } = it;
  return jan !== undefined && it.id === `off:${jan}` ? rest : it;
});
writeFileSync(join(dir, 'kalori.json'), JSON.stringify(d));
const index = JSON.parse(readFileSync(join(dir, 'index.json'), 'utf8'));
const KALORI = { file: 'kalori.json', source: 'kalori', badge: '店', secondary: true, lazy: true };
const datasets = index.datasets ?? [];
if (!datasets.some((x) => x.file === KALORI.file)) datasets.push(KALORI);
const hex = (h) => h.digest('hex').slice(0, 12);
const hash = createHash('sha256');
const files = {};
for (const f of ['verify.json', ...datasets.map((x) => x.file)]) {
  if (!/^[a-z0-9_-]+\.json$/.test(f)) throw new Error(`odd file ${f}`);
  const b = readFileSync(join(dir, f));
  hash.update(`${f}\0`).update(b).update('\0');
  files[f] = hex(createHash('sha256').update(b));
}
writeFileSync(join(dir, 'index.json'), JSON.stringify({ ...index, datasets, version: hex(hash), files }));
