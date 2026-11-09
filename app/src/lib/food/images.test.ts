// ごはん's pictures (lib/food/images.ts): imgOf's cells, and what static/food-img/ ships (food-data/images/fi.py pack)
// against its budget: a few hundred files at most (Cloudflare Pages takes 20,000 a deploy, the site's other files most of
// them), sheets small enough for a phone, every sheet index.json names there and nothing else, every cell inside its
// sheet, every id a shipped generic food's.
import { describe, expect, it, vi } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { imgOf, loadFoodImages, type FoodImageIndex } from './images.ts';
import { addDataset, emptyDb, searchFoods } from './db.ts';
import type { Dataset, FoodIndex } from './types.ts';
import { STATIC_MAX_FILES } from '../static-budget.ts';

const STATIC = join(import.meta.dirname, '../../../static');
const DIR = join(STATIC, 'food-img');
/** The budget: files in food-img/, its bytes, one sheet's bytes, and static/'s file cap (lib/static-budget.ts). */
const MAX_FILES = 1_100; // ~5,000 pictures: 3 × 3 detail sheets (~560) and 4 × 4 thumbnail sheets (~350)
const MAX_BYTES = 90_000_000;
const MAX_SHEET = 400_000;

/** A webp's canvas size from its header (VP8, VP8L or VP8X). */
function webpSize(b: Buffer): [number, number] {
  if (b.toString('ascii', 0, 4) !== 'RIFF' || b.toString('ascii', 8, 12) !== 'WEBP') throw new Error('not a webp');
  const kind = b.toString('ascii', 12, 16);
  if (kind === 'VP8 ') return [b.readUInt16LE(26) & 0x3fff, b.readUInt16LE(28) & 0x3fff];
  if (kind === 'VP8L') {
    const v = b.readUInt32LE(21);
    return [(v & 0x3fff) + 1, ((v >> 14) & 0x3fff) + 1];
  }
  if (kind === 'VP8X') return [b.readUIntLE(24, 3) + 1, b.readUIntLE(27, 3) + 1];
  throw new Error(`webp chunk ${kind}`);
}

const fixture: FoodImageIndex = { v: 1, t: 128, d: 384, sheets: ['t-a-0-00000000.webp', 'd-a-0-00000000.webp'], keys: [[0, 256, 128, 1, 384, 0]], ids: { 'mext:01088': 0, 'dishes:nikujaga': 0 } };

describe('imgOf', () => {
  it('gives a row the thumbnail cell and the amount the detail cell', () => {
    expect(imgOf(fixture, 'mext:01088', 48)).toEqual({ url: '/food-img/t-a-0-00000000.webp', x: 256, y: 128, size: 128 });
    expect(imgOf(fixture, 'dishes:nikujaga', 160)).toEqual({ url: '/food-img/d-a-0-00000000.webp', x: 384, y: 0, size: 384 });
  });
  it('gives none for a food without one, an old snapshot id or no index (the tile)', () => {
    expect([imgOf(fixture, 'off:4902705126558', 48), imgOf(fixture, 'mext:99999', 48), imgOf(null, 'mext:01088', 48)]).toEqual([null, null, null]);
  });
});

describe('loadFoodImages', () => {
  it('fetches the index once, and again after a failure (till then every food keeps its tile)', async () => {
    const fetch = vi.fn<(href: string) => Promise<Response>>().mockResolvedValueOnce(new Response(null, { status: 503 })).mockResolvedValue(new Response(JSON.stringify(fixture)));
    vi.stubGlobal('fetch', fetch);
    try {
      expect(await loadFoodImages()).toBeNull();
      expect(await loadFoodImages()).toEqual(fixture);
      expect(await loadFoodImages()).toEqual(fixture);
      expect(fetch.mock.calls.map(([href]) => href)).toEqual(['/food-img/index.json', '/food-img/index.json']);
    } finally {
      vi.unstubAllGlobals();
    }
  });
});

describe('static/food-img', () => {
  const files = readdirSync(DIR);
  const index = JSON.parse(readFileSync(join(DIR, 'index.json'), 'utf8')) as FoodImageIndex;

  it('ships the sheets index.json names and nothing else, within the budget', () => {
    expect(files.filter((f) => f !== 'index.json').sort()).toEqual([...index.sheets].sort());
    expect(new Set(index.sheets).size).toBe(index.sheets.length);
    expect(files.length).toBeLessThanOrEqual(MAX_FILES);
    const bytes = files.map((f) => statSync(join(DIR, f)).size);
    expect(bytes.reduce((a, b) => a + b, 0)).toBeLessThanOrEqual(MAX_BYTES);
    for (const f of index.sheets) expect(statSync(join(DIR, f)).size, f).toBeLessThanOrEqual(MAX_SHEET);
  });

  it('keeps every cell inside its sheet', () => {
    const size = new Map(index.sheets.map((f) => [f, webpSize(readFileSync(join(DIR, f)))]));
    for (const [ts, tx, ty, ds, dx, dy] of index.keys) {
      for (const [s, x, y, px, tag] of [[ts, tx, ty, index.t, 't'], [ds, dx, dy, index.d, 'd']] as const) {
        const f = index.sheets[s];
        expect(f?.startsWith(`${tag}-`), `${f}`).toBe(true);
        const [w, h] = size.get(f)!;
        expect(x % px === 0 && y % px === 0 && x + px <= w && y + px <= h, `${f} ${x},${y}`).toBe(true);
      }
    }
  });

  it("maps only shipped generic foods' ids, each to a picture", () => {
    const food = join(STATIC, 'food');
    const fi = JSON.parse(readFileSync(join(food, 'index.json'), 'utf8')) as FoodIndex;
    const ids = new Set(fi.datasets.filter((d) => !d.lazy).flatMap((d) => (JSON.parse(readFileSync(join(food, d.file), 'utf8')) as Dataset).items.map((it) => it.id)));
    const stray = Object.keys(index.ids).filter((id) => !ids.has(id));
    expect(stray).toEqual([]);
    for (const k of Object.values(index.ids)) expect(index.keys[k]).toBeDefined();
  });

  it("fits the whole table's pictures in static/'s file cap (projected from what is shipped)", () => {
    const count = (d: string): number => readdirSync(d, { withFileTypes: true }).reduce((n, e) => n + (e.isDirectory() ? count(join(d, e.name)) : e.name === '.DS_Store' ? 0 : 1), 0);
    const tdir = join(import.meta.dirname, '../../../../food-data/images/table');
    const rows = readdirSync(tdir).filter((f) => f.endsWith('.json')).reduce((n, f) => n + (JSON.parse(readFileSync(join(tdir, f), 'utf8')) as unknown[]).length, 0);
    const now = files.length;
    const projected = Math.ceil((now * rows) / index.keys.length) + 60; // (+ the families' and categories' part-filled last sheets)
    expect(projected).toBeLessThanOrEqual(MAX_FILES);
    expect(count(STATIC) - now + projected).toBeLessThanOrEqual(STATIC_MAX_FILES);
  });
});

describe('sheet locality', () => {
  /** Common searches: the thumbnail sheets their top 20 touch, and those sheets' bytes. */
  const QUERIES = ['豚', '鶏', '牛', 'ごはん', 'うどん', 'そば', 'ラーメン', 'さけ', 'まぐろ', 'さば', '卵', '豆腐', '納豆', 'キャベツ', 'トマト', 'たまねぎ', 'にんじん',
    'カレー', '丼', '味噌汁', 'サラダ', 'パン', 'りんご', 'バナナ', '牛乳', 'ヨーグルト', 'チーズ', 'おにぎり', '寿司', 'ビール', 'スープ', 'サンド', 'えび'];
  /** A search's top 20's thumbnail download (the sheets they touch, 4 × 4 cells each): on average, and at most. */
  const MEAN_KB = 120;
  const MAX_KB = 350;

  it('keeps a common search\'s thumbnail download small', async () => {
    const food = join(STATIC, 'food');
    const fi = JSON.parse(readFileSync(join(food, 'index.json'), 'utf8')) as FoodIndex;
    const db = emptyDb(fi);
    for (const d of fi.datasets) await addDataset(db, d, JSON.parse(readFileSync(join(food, d.file), 'utf8')) as Dataset);
    const index = JSON.parse(readFileSync(join(DIR, 'index.json'), 'utf8')) as FoodImageIndex;
    const rows = QUERIES.map((q) => {
      const urls = new Set(searchFoods(db, q, 20).flatMap((it) => imgOf(index, it.id, 48)?.url ?? []));
      const bytes = [...urls].reduce((n, u) => n + statSync(join(STATIC, u)).size, 0);
      return { q, sheets: urls.size, kb: Math.round(bytes / 1000) };
    });
    const avg = (k: 'sheets' | 'kb') => (rows.reduce((n, r) => n + r[k], 0) / rows.length).toFixed(1);
    console.log(`thumbnail sheets per search (top 20): mean ${avg('sheets')}, ${avg('kb')} KB; ${rows.map((r) => `${r.q} ${r.sheets}/${r.kb}KB`).join(', ')}`);
    expect(Number(avg('kb'))).toBeLessThanOrEqual(MEAN_KB);
    expect(rows.filter((r) => r.kb > MAX_KB)).toEqual([]);
  });
});

describe('the picture table (food-data/images/table)', () => {
  it('names every generic food, so a new catalogue item is never silently left without a row', () => {
    const tdir = join(import.meta.dirname, '../../../../food-data/images/table');
    const inTable = new Set(readdirSync(tdir).filter((f) => f.endsWith('.json')).flatMap((f) => (JSON.parse(readFileSync(join(tdir, f), 'utf8')) as { items: string[] }[]).flatMap((r) => r.items)));
    const food = join(STATIC, 'food');
    const fi = JSON.parse(readFileSync(join(food, 'index.json'), 'utf8')) as FoodIndex;
    const ids = fi.datasets.filter((d) => !d.lazy).flatMap((d) => (JSON.parse(readFileSync(join(food, d.file), 'utf8')) as Dataset).items.map((it) => it.id));
    expect(ids.filter((id) => !inTable.has(id))).toEqual([]);
  });
});
