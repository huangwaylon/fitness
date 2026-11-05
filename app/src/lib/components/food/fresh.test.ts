import { describe, expect, it } from 'vitest';
import { addDataset, emptyDb } from '#lib/food/db.ts';
import type { FoodCustom, FoodSnap } from '#lib/contract/food.ts';
import { latestSnap, snapDiffers } from './fresh.ts';

const RICE: FoodSnap = { id: 'mext:01088', n: 'ごはん（精白米）', k: 156, p: 2.5, fa: 0.3, c: 37.1, s: 0, u: '茶碗1杯' };
const REIMEN: FoodSnap = { id: 'dishes:reimen', n: '冷麺', k: 89.9, p: 3.1, fa: 1, c: 17, s: 0.6, u: '1人前' };

async function dbOf(items: object[]) {
  const db = emptyDb({ version: 'x', datasets: [] });
  await addDataset(db, { file: 'f.json', source: 'mext', badge: 'MEXT', secondary: false, lazy: false }, { source: 'mext', items: items as never });
  return db;
}

describe('最新の値にする: an entry’s food as it is now', () => {
  it('a snapshot differs beyond rounding: kcal, P/F/C/salt (known ↔ unknown too), fibre and alcohol only when both know them', () => {
    const got = [
      snapDiffers(RICE, { ...RICE }), snapDiffers(RICE, { ...RICE, k: 156.4 }), snapDiffers(RICE, { ...RICE, k: 157 }),
      snapDiffers(RICE, { ...RICE, p: 2.54 }), snapDiffers(RICE, { ...RICE, p: 2.6 }), snapDiffers(RICE, { ...RICE, s: null }),
      snapDiffers({ ...RICE, s: null }, RICE), snapDiffers(RICE, { ...RICE, fi: 1.5 }), snapDiffers({ ...RICE, fi: 1.5 }, { ...RICE, fi: 1.6 }),
      snapDiffers(RICE, { ...RICE, n: 'ごはん', u: undefined })
    ];
    expect(got).toEqual([false, false, true, false, true, true, true, false, true, false]);
  });
  it('from the catalogue, the recipe or the custom food now, its label kept; none when gone, the same, or not loaded', async () => {
    const db = await dbOf([
      { id: 'mext:01088', name: 'ごはん（精白米）', kcal: 156, p: 2.5, f: 0.3, c: 37.1, salt: 0, fib: 1.5 },
      { id: 'dishes:reimen', name: '冷麺', kcal: 114, p: 3.5, f: 1.2, c: 21.5, salt: 1.0, fib: 0.9 }
    ]);
    const recipe = { id: 'cabc1234', n: 'おうち丼', sv: 2, it: [{ g: 300, f: RICE }] };
    const custom: FoodCustom = { id: 'mabc1234', at: 1, who: 'A', n: '弁当', u: '1食', k: 650, p: 20, fa: null, c: null, s: null };
    const src = { db, recipes: [recipe], customs: [custom] };
    const oldRecipe: FoodSnap = { id: 'recipe:cabc1234', n: 'おうち丼', k: 150, p: 2.5, fa: 0.3, c: 37.1, s: 0, u: '1人前' };
    const oldCustom: FoodSnap = { id: 'custom:mabc1234', n: '弁当', k: 600, p: 20, fa: null, c: null, s: null, u: '1食', sv: true };
    expect([
      latestSnap(RICE, src), latestSnap({ ...REIMEN, u: '1人前×2' }, src), latestSnap(REIMEN, { ...src, db: null }), latestSnap({ ...RICE, id: 'mext:99999' }, src),
      latestSnap(oldRecipe, src), latestSnap(oldCustom, src), latestSnap({ ...oldCustom, sv: undefined }, src)
    ]).toEqual([
      null, { id: 'dishes:reimen', n: '冷麺', k: 114, p: 3.5, fa: 1.2, c: 21.5, s: 1, fi: 0.9, u: '1人前×2' }, null, null,
      { id: 'recipe:cabc1234', n: 'おうち丼', k: 156, p: 2.5, fa: 0.3, c: 37.1, s: 0, u: '1人前' },
      { id: 'custom:mabc1234', n: '弁当', k: 650, p: 20, fa: null, c: null, s: null, u: '1食', sv: true }, null
    ]);
  });
});
