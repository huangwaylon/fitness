// scripts/food-data.ts --only kalori (kalori-scrape.yml's update job): kalori.json alone into a static dir, the other
// files untouched, `files` and `version` as the full path computes them (load.test.ts's check, here on a copy).
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

const APP = join(import.meta.dirname, '../../..');
const STATIC = join(APP, 'static/food');
const KALORI = { file: 'kalori.json', source: 'kalori', badge: '店', secondary: true, lazy: true };
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
    expect(run('--only', 'products', src, '--to', to).stderr).toContain('only kalori');
    expect(run('--only', 'kalori', tmp(), '--to', to).stderr).toContain('no kalori.json');
    rmSync(join(to, 'a.json'));
    const r = run('--only', 'kalori', src, '--to', to);
    expect([r.status, r.stderr.includes('missing in')]).toEqual([1, true]);
  });

  it('reproduces the shipped index.json from the shipped kalori.json (the same algorithm as the full path)', () => {
    const to = join(tmp(), 'food'), src = tmp();
    cpSync(STATIC, to, { recursive: true });
    mkdirSync(src, { recursive: true });
    cpSync(join(STATIC, 'kalori.json'), join(src, 'kalori.json'));
    expect(run('--only', 'kalori', src, '--to', to).status).toBe(0);
    expect(readFileSync(join(to, 'index.json'), 'utf8')).toBe(readFileSync(join(STATIC, 'index.json'), 'utf8'));
    // (Buffer.equals: toEqual walks a 10 MB buffer byte by byte, ~15 s under verify's load)
    expect(readFileSync(join(to, 'kalori.json')).equals(readFileSync(join(STATIC, 'kalori.json')))).toBe(true);
  });
});
