// The shipped data (static/food/, scripts/food-data.ts) as loadFoodDb reads it: every file index.json lists is there
// and nothing else, every item makes a snapshot the record accepts, and the PoC's searches still find their food.
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { foodOp } from '#lib/contract/food.ts';
import { loadFoodDb } from './load.ts';
import { credits, searchFoods, verifyOf, type FoodDb } from './db.ts';
import { portionsOf, toSnap } from './nutrition.ts';
import type { Dataset, FoodIndex } from './types.ts';

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

  it('credits every dataset and the verify-only sources (USDA), each with its attribution', () => {
    const c = credits(db);
    expect(c.length).toBeGreaterThanOrEqual(index.datasets.length + 1);
    expect(c.find((x) => x.label === 'Open Food Facts')?.attribution).toContain('Open Food Facts');
    expect(c.filter((x) => !x.attribution)).toEqual([]);
  });
});
