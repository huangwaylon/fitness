// scripts/food-data.ts --only kalori|products (kalori-scrape.yml's update job; `build.py off`): one lazy dataset alone
// into a static dir, the other files untouched, `files` and `version` as the full path computes them (load.test.ts's
// check, here on a copy).
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { cpSync, existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { decodeItems, toColumns } from './db.ts';
import type { Dataset, Item } from './types.ts';

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

/** A shipped file's items as build.py's file has them (its header, `items`). */
function rowsOf(path: string) {
  const { cols: _c, idPrefix: _p, ...head } = JSON.parse(readFileSync(path, 'utf8'));
  return { ...head, items: decodeItems(JSON.parse(readFileSync(path, 'utf8'))) };
}

const item = (i: number, name: string) => ({ id: `kal:${i}`, name, shop: 'tako-ya', cat: '丼・定食', kcal: 500, p: 20.0, f: 10.5, c: null, salt: 2.3 });
const dataset = (items: object[]): Dataset => ({ source: 'kalori', label: 'kalori.jp', shops: { 'tako-ya': { name: 'たこ屋' } }, items: items as Item[] });

/** A shipped core dataset (by column, its keys built). */
const A = JSON.stringify(toColumns({ source: 'a', label: 'a', items: [{ id: 'a:1', name: 'たこ', kcal: 1, p: 1, f: 1, c: 1, salt: 0, keys: 'たこ' }] }));

/** A static dir (index.json, verify.json, a core a.json, maybe an old kalori.json) and a data dir with a new kalori.json. */
function fixture(withKalori: boolean) {
  const to = tmp(), src = tmp();
  const datasets = [{ file: 'a.json', source: 'a', badge: 'A', secondary: false, lazy: false }, ...(withKalori ? [KALORI] : [])];
  writeFileSync(join(to, 'verify.json'), '{"groups":[]}');
  writeFileSync(join(to, 'a.json'), A);
  if (withKalori) writeFileSync(join(to, 'kalori.json'), JSON.stringify(toColumns(dataset([item(1, 'old')]))));
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
    // by column (types.ts Shipped), its ids without kal:, decoding to the converter's items exactly
    const { items, ...head } = JSON.parse(readFileSync(join(src, 'kalori.json'), 'utf8'));
    const d = JSON.parse(k);
    // (its ids delta-coded: 1, then 2)
    expect([d.items, d.idPrefix, d.cols.id, d.delta, d.label, d.shops]).toEqual([undefined, 'kal:', [1, 1], ['id'], head.label, head.shops]);
    expect(decodeItems(d)).toStrictEqual(items);
    expect(k).not.toContain('"keys"');
    expect(readFileSync(join(to, 'a.json'))).toEqual(a);
    const index = JSON.parse(readFileSync(join(to, 'index.json'), 'utf8'));
    expect(Object.keys(index)).toEqual(['version', 'datasets', 'files', 'drop', 'schema']);
    expect(index.schema).toBe(3);
    expect(index.datasets.map((d: { file: string }) => d.file)).toEqual(['a.json', 'kalori.json']);
    expect({ files: index.files, version: index.version }).toEqual(hashes(to, ['a.json', 'kalori.json']));
  });

  it('ships every kind of field by column and back (update-merge runs it with node alone)', () => {
    const { to, src } = fixture(true);
    // (every kind of field: unknown P/F/C/salt, absent fibre, flags, groups, aliases, the first item without some)
    const rows = [
      { ...item(3, 'カツ丼'), salt: null, est: 'e', img: 12 },
      { ...item(4, 'カツ丼 大盛'), fib: 2.1, vg: 'kal:4', st: '大盛', aliases: ['かつどん'], ended: true, pop: 1 },
      { ...item(5, 'みそ汁'), p: null, f: null, est: 'p', vg: 'kal:4', st: '並盛' }
    ];
    writeFileSync(join(src, 'kalori.json'), JSON.stringify(dataset(rows)));
    expect(run('--only', 'kalori', src, '--to', to).status).toBe(0);
    const shipped = readFileSync(join(to, 'kalori.json'), 'utf8');
    expect(decodeItems(JSON.parse(shipped))).toStrictEqual(rows);
    // (its items in again, decoded: the same bytes out; the shipped file itself, by column, is no input)
    cpSync(join(to, 'kalori.json'), join(src, 'kalori.json'));
    expect(run('--only', 'kalori', src, '--to', to).stderr).toContain('is not a dataset');
    writeFileSync(join(src, 'kalori.json'), JSON.stringify(rowsOf(join(to, 'kalori.json'))));
    expect(run('--only', 'kalori', src, '--to', to).status).toBe(0);
    expect(readFileSync(join(to, 'kalori.json'), 'utf8')).toBe(shipped);
    // and a null its column couldn't keep: refused
    writeFileSync(join(src, 'kalori.json'), JSON.stringify(dataset([{ ...item(6, 'x'), img: null }])));
    expect(run('--only', 'kalori', src, '--to', to).stderr).toContain("kal:6 has a null its column can't keep");
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

  it.each(['kalori', 'products'])('reproduces the shipped index.json from the shipped %s.json’s items (the same algorithm as the full path)', (name) => {
    const to = join(tmp(), 'food'), src = tmp(), f = `${name}.json`;
    cpSync(STATIC, to, { recursive: true });
    mkdirSync(src, { recursive: true });
    writeFileSync(join(src, f), JSON.stringify(rowsOf(join(STATIC, f))));
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
    writeFileSync(join(to, 'a.json'), A);
    writeFileSync(join(to, 'kalori.json'), JSON.stringify(toColumns(dataset([item(1, 'タコ丼')]))));
    const datasets = [{ file: 'a.json', source: 'a', badge: 'A', secondary: false, lazy: false }, KALORI];
    writeFileSync(join(to, 'index.json'), JSON.stringify({ version: '000000000000', datasets, files: {} }));
    const doc = { source: 'off', label: 'Open Food Facts', license: 'ODbL 1.0', dumped: '2026-11-02', items: [product('4901234567894'), product('0012345678905', 'off:x')] };
    writeFileSync(join(src, 'products.json'), JSON.stringify(doc));
    return { to, src };
  }

  it('writes products.json alone (by column, no keys, a barcode its id has dropped), its entry added before kalori, the rest untouched', () => {
    const { to, src } = fixture();
    const before = ['a.json', 'kalori.json'].map((f) => readFileSync(join(to, f)));
    const r = run('--only', 'products', src, '--to', to);
    expect([r.status, r.stderr]).toEqual([0, '']);
    const p = JSON.parse(readFileSync(join(to, 'products.json'), 'utf8'));
    expect(p.dumped).toBe('2026-11-02');
    // by column (types.ts Shipped), its ids without off:, decoding to build.py's items less a barcode the id has
    expect([p.items, p.idPrefix, p.cols.id]).toEqual([undefined, 'off:', ['4901234567894', 'x']]);
    const { jan: _j, ...first } = product('4901234567894');
    expect(decodeItems(p)).toEqual([first, product('0012345678905', 'off:x')]);
    expect(['a.json', 'kalori.json'].map((f) => readFileSync(join(to, f)))).toEqual(before);
    const index = JSON.parse(readFileSync(join(to, 'index.json'), 'utf8'));
    expect(index.datasets).toEqual([expect.objectContaining({ file: 'a.json' }), PRODUCTS, KALORI]);
    expect({ files: index.files, version: index.version }).toEqual(hashes(to, ['a.json', 'products.json', 'kalori.json']));
  });

  it('regroups build.py’s barcode shards (last 3 digits) by the last 2, sorted, the products’ codes and store codes left out', () => {
    const { to, src } = fixture();
    mkdirSync(join(src, 'jan'));
    const code = (jan: string) => [jan, product(jan)] as const;
    writeFileSync(join(src, 'jan', '981.json'), JSON.stringify(Object.fromEntries([code('4607001771981')])));
    writeFileSync(join(src, 'jan', '881.json'), JSON.stringify(Object.fromEntries([code('4607001771881'), code('2012345678881')])));
    writeFileSync(join(src, 'jan', '894.json'), JSON.stringify(Object.fromEntries([code('4901234567894')])));
    expect(run('--only', 'products', src, '--to', to).status).toBe(0);
    expect(readdirSync(join(to, 'jan'))).toEqual(['81.json']);
    const shard = JSON.parse(readFileSync(join(to, 'jan', '81.json'), 'utf8'));
    expect(shard.cols.id).toEqual(['4607001771881', '4607001771981']);
  });
});

describe('food:data, the full path, and the barcode shards', () => {
  const src = () => {
    const d = tmp();
    writeFileSync(join(d, 'index.json'), JSON.stringify({ version: 'abcdefabcdef', datasets: [{ file: 'a.json', source: 'a', badge: 'A', secondary: false, lazy: false }] }));
    writeFileSync(join(d, 'verify.json'), '{"groups":[]}');
    writeFileSync(join(d, 'a.json'), JSON.stringify({ source: 'a', label: 'a', items: [{ id: 'a:1', name: 'たこ', kcal: 1 }] }));
    return d;
  };
  it('a data dir without jan/ keeps the shipped shards (and their `jan`); one with them ships its own', () => {
    const from = src(), to = join(tmp(), 'food');
    mkdirSync(join(to, 'jan'), { recursive: true });
    writeFileSync(join(to, 'jan', '83.json'), 'kept');
    expect(run(from, '--to', to).status).toBe(0);
    expect(readFileSync(join(to, 'jan', '83.json'), 'utf8')).toBe('kept');
    expect(JSON.parse(readFileSync(join(to, 'index.json'), 'utf8')).jan).toMatch(/^[0-9a-f]{12}$/);
    // (a data dir with jan/ is build.py's: the shipped shards replaced by its, here none)
    mkdirSync(join(from, 'jan'));
    expect(run(from, '--to', to).status).toBe(0);
    expect(existsSync(join(to, 'jan', '83.json'))).toBe(false);
  });
});

describe('food:data --reship (static/food through the data checks again, from itself)', () => {
  it('leaves the committed data as it is: every fix and rule already applied', () => {
    const to = join(tmp(), 'food');
    cpSync(STATIC, to, { recursive: true });
    const r = run('--reship', '--to', to);
    expect([r.stderr, r.status]).toEqual(['', 0]);
    for (const f of [...readdirSync(STATIC).filter((f) => f.endsWith('.json')), ...readdirSync(join(STATIC, 'jan')).map((f) => `jan/${f}`)])
      expect(readFileSync(join(to, f)).equals(readFileSync(join(STATIC, f))), f).toBe(true);
  });
  it('changes only the rows a fix (data_src/food_fixes.json) or rule touches, the shards too; the index recomputed', () => {
    const to = tmp();
    const tofu = { id: 'off:4979475011735', name: '木綿とうふ', cat: 'その他', kcal: 61, p: 5.6, f: 3.1, c: 20, salt: 0 };
    const other = { id: 'off:4900000000001', name: 'たこ', kcal: 100, p: 10, f: 1, c: 12, salt: 1 };
    const kj = { id: 'off:4600000000002', name: 'Viande', kcal: 801, p: 19, f: 14, c: null, salt: null };
    writeFileSync(join(to, 'verify.json'), '{"groups":[]}');
    writeFileSync(join(to, 'a.json'), A);
    writeFileSync(join(to, 'products.json'), JSON.stringify(toColumns({ source: 'off', label: 'OFF', items: [tofu, other] as Item[] })));
    mkdirSync(join(to, 'jan'));
    writeFileSync(join(to, 'jan', '02.json'), JSON.stringify(toColumns({ source: 'off', items: [kj] as Item[] })));
    const datasets = [{ file: 'a.json', source: 'a', badge: 'A', secondary: false, lazy: false }, PRODUCTS];
    writeFileSync(join(to, 'index.json'), JSON.stringify({ version: '000000000000', datasets, files: {} }));
    const r = run('--reship', '--to', to);
    expect([r.stderr, r.status]).toEqual(['', 0]);
    expect(r.stdout).toContain('checks: fix:set 1, kj_as_kcal 1');
    expect(rowsOf(join(to, 'a.json')).items).toMatchObject([{ id: 'a:1', name: 'たこ', kcal: 1, p: 1, f: 1, c: 1, salt: 0 }]);
    expect(rowsOf(join(to, 'products.json')).items).toEqual([{ ...tofu, c: 2 }, other]);
    expect(rowsOf(join(to, 'jan', '02.json')).items).toEqual([{ ...kj, kcal: 191 }]);
    const index = JSON.parse(readFileSync(join(to, 'index.json'), 'utf8'));
    expect({ files: index.files, version: index.version }).toEqual(hashes(to, ['a.json', 'products.json']));
    expect(run('--reship', 'somewhere', '--to', to).status).toBe(1);
  });
});
