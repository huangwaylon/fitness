// kalori-ship.mjs <converted kalori.json> <food dir>: <food dir>/kalori.json and index.json as app/scripts/food-data.ts
// `--only kalori` writes them (ship() for a lazy dataset, a jan in an off:<jan> id dropped; columnar(): by column, the
// ids without kal:, COLS first then each field as the items first have it, a null only P/F/C/salt's; writeIndex: each
// file's sha256 and the version over verify.json then the datasets), with no npm: kalori-scrape.yml's update-merge
// makes the bytes it commits itself and compares update-build's with them. (A file already by column, the committed
// one in test_kalori_status.py: its items decoded first, as food-data.ts's readDataset does.)
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const PREFIX = 'kal:';
const COLS = ['id', 'name', 'brand', 'cat', 'kcal', 'p', 'f', 'c', 'salt', 'portions'];
const NULLS = new Set(['p', 'f', 'c', 'salt']);
const [src, dir] = process.argv.slice(2);
const { items, cols, idPrefix, ...head } = JSON.parse(readFileSync(src, 'utf8'));
const rows = cols && !items
  ? cols.id.map((_, i) => Object.fromEntries(Object.entries(cols).flatMap(([k, c]) => (c[i] !== null && c[i] !== undefined ? [[k, k === 'id' ? (idPrefix ?? '') + c[i] : c[i]]] : NULLS.has(k) ? [[k, null]] : []))))
  : items;
if (!Array.isArray(rows) || typeof head.label !== 'string') throw new Error(`${src} is not a dataset`);
const shipped = rows.map((it) => {
  const { jan, ...rest } = it;
  return jan !== undefined && it.id === `off:${jan}` ? rest : it;
});
const keys = [...new Set([...COLS, ...shipped.flatMap((it) => Object.keys(it))])].filter((k) => shipped.some((it) => k in it));
for (const it of shipped) {
  if (!it.id.startsWith(PREFIX)) throw new Error(`${it.id}: an id without ${PREFIX}`);
  if (Object.entries(it).some(([k, v]) => v === null && !NULLS.has(k))) throw new Error(`${it.id} has a null its column can't keep`);
}
const out = Object.fromEntries(keys.map((k) => [k, shipped.map((it) => (k === 'id' ? it.id.slice(PREFIX.length) : (it[k] ?? null)))]));
writeFileSync(join(dir, 'kalori.json'), JSON.stringify({ ...head, idPrefix: PREFIX, cols: out }));
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
