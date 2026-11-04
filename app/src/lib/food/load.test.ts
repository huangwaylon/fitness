// The shipped data (static/food/, scripts/food-data.ts) as loadFoodDb reads it: every file index.json lists is there
// and nothing else, every item makes a snapshot the record accepts, and the PoC's searches still find their food.
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { createHash } from 'node:crypto';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { foodOp } from '#lib/contract/food.ts';
import { loadFoodDb } from './load.ts';
import { addDataset, credits, emptyDb, searchFoods, SLICE, verifyOf, type FoodDb } from './db.ts';
import { portionsOf, toSnap } from './nutrition.ts';
import type { Dataset, FoodIndex, Item } from './types.ts';
import type { Entry } from './search.ts';
import { searchKey } from './text.ts';

const DIR = join(import.meta.dirname, '../../../static/food');
const index = JSON.parse(readFileSync(join(DIR, 'index.json'), 'utf8')) as FoodIndex;
const fetched: string[] = [];

let db: FoodDb;
beforeAll(async () => {
  vi.stubGlobal('fetch', async (href: string) => {
    fetched.push(href);
    const file = href.match(/\/food\/([\w-]+\.json)/)?.[1];
    return file ? new Response(readFileSync(join(DIR, file))) : new Response(null, { status: 404 });
  });
  db = await loadFoodDb();
  await db.more;
});
afterAll(() => {
  vi.unstubAllGlobals();
});

describe('static/food', () => {
  it('holds index.json, verify.json and exactly the datasets index.json lists (no barcode shards)', () => {
    expect(readdirSync(DIR).sort()).toEqual(['index.json', 'verify.json', ...index.datasets.map((d) => d.file)].sort());
    expect(index.version).toMatch(/^[0-9a-f]{12}$/);
    expect(index.datasets.filter((d) => d.lazy).map((d) => d.file)).toEqual(['products.json']);
  });

  it('versions the files as shipped (scripts/food-data.ts): a change to any of them is a new ?v= for every phone', () => {
    const hash = createHash('sha256');
    for (const f of ['verify.json', ...index.datasets.map((d) => d.file)]) hash.update(`${f}\0`).update(readFileSync(join(DIR, f))).update('\0');
    expect(index.version).toBe(hash.digest('hex').slice(0, 12));
  });

  it('every item makes a snapshot the record accepts, and has a 100 g portion to pick', () => {
    const bad: string[] = [];
    for (const d of index.datasets) {
      for (const it of (JSON.parse(readFileSync(join(DIR, d.file), 'utf8')) as Dataset).items) {
        const [first] = portionsOf(it);
        const op = foodOp({ id: 'f0000000', at: 1.8e12, d: '2026-11-03', m: 'l', g: first.g, f: toSnap(it, first.label) });
        if (!op || op.rm || op.f.n !== toSnap(it).n) bad.push(it.id);
      }
    }
    expect(bad).toEqual([]);
  });
});

describe('loadFoodDb', () => {
  it('fetches index.json bare and every data file under its version, from the app’s base', () => {
    expect(fetched[0]).toMatch(/\/food\/index\.json$/);
    expect(fetched.slice(1).every((h) => h.endsWith(`?v=${index.version}`))).toBe(true);
    expect(fetched.at(-1)).toMatch(/\/food\/products\.json\?v=/);
    expect(db.sets.length).toBe(index.datasets.length);
  });

  it('finds the PoC’s foods: the core item first, confirmed ones with their sources', () => {
    expect(searchFoods(db, 'ごはん', 5)[0].id).toBe('mext:01088');
    expect(searchFoods(db, 'なっとう').length).toBeGreaterThan(0);
    const mabo = searchFoods(db, 'マーボー豆腐', 3)[0];
    expect(mabo.id.startsWith('dishes:') || mabo.id.startsWith('eatout:') || mabo.id.startsWith('mext:')).toBe(true);
    expect(verifyOf(db, mabo.id)?.n).toBeGreaterThanOrEqual(2);
  });

  it('searches exactly as with keys built on load (the shipped `keys`, a product’s barcode from its id)', async () => {
    const ref = emptyDb(index);
    for (const d of index.datasets) {
      const data = JSON.parse(readFileSync(join(DIR, d.file), 'utf8')) as Dataset;
      expect(data.items.every((it) => typeof it.keys === 'string')).toBe(true);
      // the data as it was: no keys, every barcode
      const items = data.items.map(({ keys: _k, ...it }) => (it.id.startsWith('off:') ? { ...it, jan: it.id.slice(4) } : it));
      await addDataset(ref, d, { ...data, items });
    }
    ref.verify = db.verify;
    // the same order as loadFoodDb's (datasets in the order they came): the same ties
    const order = new Map(db.entries.map((e, i) => [e.it.id, i]));
    ref.entries.sort((a, b) => order.get(a.it.id)! - order.get(b.it.id)!);
    expect(ref.entries.map((e) => [e.n, e.al, e.h.replaceAll(' ', '|')])).toEqual(db.entries.map((e) => [e.n, e.al, e.h.replaceAll(' ', '|')]));
    for (const q of ['ご', 'ごはん', 'と', 'とりむね', 'らーめん', 'パン', 'k', 'kara', 'カレー', 'コーヒー', '牛乳', 'ん', 'chicken', 'ごはん 大盛', '4901777', 'natto', 'ﾗｰﾒﾝ']) {
      expect(searchFoods(db, q, 40).map((x) => x.id), q).toEqual(searchFoods(ref, q, 40).map((x) => x.id));
    }
    expect(searchFoods(db, '4902102', 5).length).toBeGreaterThan(0); // a barcode prefix still finds products
  });

  it('ranks a score at a time exactly as one sort of every hit did (search.ts before the top-n ranking)', () => {
    const tierOf = (e: Entry, q: string): number =>
      e.n === q ? 0 : e.n.startsWith(q) ? 1 : e.n.includes(q) ? 2 : e.al.includes(q) ? 3 : e.al.some((a) => a.startsWith(q)) ? 4 : e.al.some((a) => a.includes(q)) ? 5 : 6;
    const groupOf = (id: string) => db.verify?.byId[id];
    const sortAll = (query: string, limit: number): Item[] => {
      const tokens = query.trim().split(/[\s　]+/).map(searchKey).filter(Boolean);
      const q = tokens.join('');
      const hits: { e: Entry; s: number }[] = [];
      for (const e of db.entries) if (tokens.every((t) => e.h.includes(t))) hits.push({ e, s: tierOf(e, q) + e.pen - e.pop * 0.6 });
      hits.sort((a, b) => a.s - b.s || b.e.pop - a.e.pop || a.e.n.length - b.e.n.length);
      const rep = new Map<number, Entry>();
      for (const { e } of hits) {
        const g = groupOf(e.it.id);
        if (g === undefined) continue;
        const r = rep.get(g);
        if (!r || (r.pen > 0 && e.pen <= 0)) rep.set(g, e);
      }
      const seen = new Set<string | number>();
      const out: Item[] = [];
      for (const h of hits) {
        const g = groupOf(h.e.it.id);
        const e = g === undefined ? h.e : rep.get(g)!;
        const k = `${e.n}|${e.it.kcal}`;
        if (seen.has(k) || (g !== undefined && seen.has(g))) continue;
        seen.add(k);
        if (g !== undefined) seen.add(g);
        if (out.push(e.it) >= limit) break;
      }
      return out;
    };
    const kana = Array.from({ length: 0x3093 - 0x3041 + 1 }, (_, i) => String.fromCharCode(0x3041 + i));
    // (sortAll's list stops at `limit` and is otherwise the same: its top 5 and 40 are its top 60's first, one sort a query;
    // mismatches collected, one expect)
    const fails: { q: string; limit: number; got: string[]; want: string[] }[] = [];
    for (const q of [...kana, ...'abcdefghijklmnopqrstuvwxyz', 'ごはん', 'とりむね', 'らーめん', 'カレー', '牛乳', '豆腐', 'ごはん 大盛', 'chicken', '49']) {
      const all = sortAll(q, 60).map((x) => x.id);
      for (const limit of [5, 40, 60]) {
        const got = searchFoods(db, q, limit).map((x) => x.id), want = all.slice(0, limit);
        if (got.length !== want.length || got.some((id, i) => id !== want[i])) fails.push({ q, limit, got, want });
      }
    }
    expect(fails.slice(0, 3)).toEqual([]);
  });

  it('indexes a dataset a slice at a time, pausing in between', async () => {
    const d = emptyDb(index);
    const items = Array.from({ length: 2 * SLICE + 1 }, (_, i) => ({ id: `x:${i}`, name: `しょくひん${i}`, kcal: 1 }));
    let pauses = 0;
    await addDataset(d, index.datasets[0], { source: 'x', items }, async () => {
      pauses++;
      expect(d.entries.length).toBe(pauses * SLICE);
    });
    expect([pauses, d.entries.length]).toEqual([2, 2 * SLICE + 1]);
  });

  it('credits every dataset and the verify-only sources (USDA), each with its attribution', () => {
    const c = credits(db);
    expect(c.length).toBeGreaterThanOrEqual(index.datasets.length + 1);
    expect(c.find((x) => x.label === 'Open Food Facts')?.attribution).toContain('Open Food Facts');
    expect(c.filter((x) => !x.attribution)).toEqual([]);
  });
});
