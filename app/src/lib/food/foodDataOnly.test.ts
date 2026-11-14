// scripts/food-data.ts --only kalori|products (kalori-scrape.yml's update job; `build.py off`): one lazy dataset alone
// into a static dir, the other files untouched, `files` and `version` as the full path computes them (load.test.ts's
// check, here on a copy).
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

const APP = join(import.meta.dirname, '../../..');
const STATIC = join(APP, 'static/food');
const KALORI = { file: 'kalori.json', source: 'kalori', badge: '店', secondary: true, lazy: true };
const PRODUCTS = { file: 'products.json', source: 'off', badge: '商品', secondary: true, lazy: true };
const dirs: string[] = [];
afterEach(() => dirs.splice(0).forEach((d) => rmSync(d, { recursive: true, force: true })));

function tmp(): string {
  const d = mkdtempSync(join(tmpdir(), 'food-only-'));
  dirs.push(d);
  return d;
}

function run(...args: string[]) {
  return spawnSync(process.execPath, ['scripts/food-data.ts', ...args], { cwd: APP, encoding: 'utf8' });
}

/** load.test.ts's recomputation: each file's hash, and `version` over verify.json then the datasets in index order. */
function hashes(dir: string, files: string[]) {
  const own = (b: Buffer) => createHash('sha256').update(b).digest('hex').slice(0, 12);
  const all = createHash('sha256');
  const out: Record<string, string> = {};
  for (const f of ['verify.json', ...files]) {
    const b = readFileSync(join(dir, f));
    all.update(`${f}\0`).update(b).update('\0');
    out[f] = own(b);
  }
  return { files: out, version: all.digest('hex').slice(0, 12) };
}

const item = (i: number, name: string) => ({ id: `kal:${i}`, name, shop: 'tako-ya', cat: '丼・定食', kcal: 500, p: 20.0, f: 10.5, c: null, salt: 2.3 });
const dataset = (items: object[]) => ({ source: 'kalori', label: 'kalori.jp', shops: { 'tako-ya': { name: 'たこ屋' } }, items });

/** A static dir (index.json, verify.json, a core a.json, maybe an old kalori.json) and a data dir with a new kalori.json. */
function fixture(withKalori: boolean) {
  const to = tmp(), src = tmp();
  const datasets = [{ file: 'a.json', source: 'a', badge: 'A', secondary: false, lazy: false }, ...(withKalori ? [KALORI] : [])];
  writeFileSync(join(to, 'verify.json'), '{"groups":[]}');
  writeFileSync(join(to, 'a.json'), '{"label":"a","items":[{"id":"a:1","name":"たこ","keys":"たこ"}]}');
  if (withKalori) writeFileSync(join(to, 'kalori.json'), JSON.stringify(dataset([item(1, 'old')])));
  writeFileSync(join(to, 'index.json'), JSON.stringify({ version: '000000000000', datasets, files: {} }));
  writeFileSync(join(src, 'kalori.json'), `${JSON.stringify(dataset([item(1, 'タコ丼'), item(2, 'イカ丼 大盛')]), null, 1)}\n`);
  return { to, src };
}

describe('food:data --only kalori', () => {
  it('writes kalori.json as the full path would (lazy: no keys) and recomputes files and version; the rest untouched', () => {
    const { to, src } = fixture(true);
    const a = readFileSync(join(to, 'a.json'));
    const r = run('--only', 'kalori', src, '--to', to);
    expect(r.stderr).toBe('');
    expect(r.status).toBe(0);
    const k = readFileSync(join(to, 'kalori.json'), 'utf8');
    expect(k).toBe(JSON.stringify(JSON.parse(readFileSync(join(src, 'kalori.json'), 'utf8'))));
    expect(k).not.toContain('"keys"');
    expect(readFileSync(join(to, 'a.json'))).toEqual(a);
    const index = JSON.parse(readFileSync(join(to, 'index.json'), 'utf8'));
    expect(Object.keys(index)).toEqual(['version', 'datasets', 'files']);
    expect(index.datasets.map((d: { file: string }) => d.file)).toEqual(['a.json', 'kalori.json']);
    expect({ files: index.files, version: index.version }).toEqual(hashes(to, ['a.json', 'kalori.json']));
  });

  it('adds the kalori entry, as build.py writes it, to an index without one', () => {
    const { to, src } = fixture(false);
    expect(run('--only', 'kalori', src, '--to', to).status).toBe(0);
    const index = JSON.parse(readFileSync(join(to, 'index.json'), 'utf8'));
    expect(index.datasets.at(-1)).toEqual(KALORI);
    expect(index.version).toBe(hashes(to, ['a.json', 'kalori.json']).version);
  });

  it('refuses another dataset, a missing input, or a static file the index lists missing', () => {
    const { to, src } = fixture(true);
    expect(run('--only', 'foods', src, '--to', to).stderr).toContain('only products or kalori');
    expect(run('--only', 'kalori', tmp(), '--to', to).stderr).toContain('no kalori.json');
    rmSync(join(to, 'a.json'));
    const r = run('--only', 'kalori', src, '--to', to);
    expect([r.status, r.stderr.includes('missing in')]).toEqual([1, true]);
  });

  it.each(['kalori', 'products'])('reproduces the shipped index.json from the shipped %s.json (the same algorithm as the full path)', (name) => {
    const to = join(tmp(), 'food'), src = tmp(), f = `${name}.json`;
    cpSync(STATIC, to, { recursive: true });
    mkdirSync(src, { recursive: true });
    cpSync(join(STATIC, f), join(src, f));
    expect(run('--only', name, src, '--to', to).status).toBe(0);
    expect(readFileSync(join(to, 'index.json'), 'utf8')).toBe(readFileSync(join(STATIC, 'index.json'), 'utf8'));
    // (Buffer.equals: toEqual walks a 10 MB buffer byte by byte, ~15 s under verify's load)
    expect(readFileSync(join(to, f)).equals(readFileSync(join(STATIC, f)))).toBe(true);
  });
});

describe('food:data --only products', () => {
  const product = (jan: string, id = `off:${jan}`) => ({ id, name: 'ミルクティー', brand: 'X', jan, cat: '飲料', kcal: 40, p: 1, f: 1, c: 7, salt: 0.1 });

  /** A static dir with a core a.json and kalori.json (no products entry) and a data dir with build.py's products.json. */
  function fixture() {
    const to = tmp(), src = tmp();
    writeFileSync(join(to, 'verify.json'), '{"groups":[]}');
    writeFileSync(join(to, 'a.json'), '{"label":"a","items":[{"id":"a:1","name":"たこ","keys":"たこ"}]}');
    writeFileSync(join(to, 'kalori.json'), JSON.stringify(dataset([item(1, 'タコ丼')])));
    const datasets = [{ file: 'a.json', source: 'a', badge: 'A', secondary: false, lazy: false }, KALORI];
    writeFileSync(join(to, 'index.json'), JSON.stringify({ version: '000000000000', datasets, files: {} }));
    const doc = { source: 'off', label: 'Open Food Facts', license: 'ODbL 1.0', dumped: '2026-11-02', items: [product('4901234567894'), product('0012345678905', 'off:x')] };
    writeFileSync(join(src, 'products.json'), JSON.stringify(doc));
    return { to, src };
  }

  it('writes products.json alone (no keys, a barcode its id has dropped), its entry added before kalori, the rest untouched', () => {
    const { to, src } = fixture();
    const before = ['a.json', 'kalori.json'].map((f) => readFileSync(join(to, f)));
    const r = run('--only', 'products', src, '--to', to);
    expect([r.status, r.stderr]).toEqual([0, '']);
    const p = JSON.parse(readFileSync(join(to, 'products.json'), 'utf8'));
    expect(p.dumped).toBe('2026-11-02');
    expect(p.items.map((it: { jan?: string; keys?: string }) => [it.jan, it.keys])).toEqual([[undefined, undefined], ['0012345678905', undefined]]);
    expect(['a.json', 'kalori.json'].map((f) => readFileSync(join(to, f)))).toEqual(before);
    const index = JSON.parse(readFileSync(join(to, 'index.json'), 'utf8'));
    expect(index.datasets).toEqual([expect.objectContaining({ file: 'a.json' }), PRODUCTS, KALORI]);
    expect({ files: index.files, version: index.version }).toEqual(hashes(to, ['a.json', 'products.json', 'kalori.json']));
  });
});
