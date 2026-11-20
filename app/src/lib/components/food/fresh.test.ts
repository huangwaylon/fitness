import { afterEach, describe, expect, it, vi } from 'vitest';
import { addDataset, emptyDb, toColumns } from '#lib/food/db.ts';
import { forgetShards } from '#lib/food/load.ts';
import '#lib/i18n/food.ts';
import { customSnap, type FoodCustom, type FoodSnap } from '#lib/contract/food.ts';
import { bigChange, freshChange, freshText, latestFood, latestIngredient, resolveItems, shardsFor, snapDiffers, type FoodSources } from './fresh.ts';
import { weighItem } from './portions.ts';

const RICE: FoodSnap = { id: 'mext:01088', n: 'ごはん（精白米）', k: 156, p: 2.5, fa: 0.3, c: 37.1, s: 0, u: '茶碗1杯' };
const REIMEN: FoodSnap = { id: 'dishes:reimen', n: '冷麺', k: 89.9, p: 3.1, fa: 1, c: 17, s: 0.6, u: '1人前' };

async function dbOf(items: object[]) {
  const db = emptyDb({ version: 'x', datasets: [] });
  await addDataset(db, { file: 'f.json', source: 'mext', badge: 'MEXT', secondary: false, lazy: false }, { source: 'mext', items: items as never });
  return db;
}

describe('最新の値にする: an entry’s food as it is now', () => {
  /** An entry's food now, at `g` grams (its snapshot only). */
  const latestSnap = (f: FoodSnap, src: FoodSources, g = 100) => latestFood({ g, f }, src)?.f ?? null;
  it('a snapshot differs beyond rounding: kcal, P/F/C/salt/fibre (known ↔ unknown too: fibre newly known counts, not as 0)', () => {
    const got = [
      snapDiffers(RICE, { ...RICE }), snapDiffers(RICE, { ...RICE, k: 156.4 }), snapDiffers(RICE, { ...RICE, k: 157 }),
      snapDiffers(RICE, { ...RICE, p: 2.54 }), snapDiffers(RICE, { ...RICE, p: 2.6 }), snapDiffers(RICE, { ...RICE, s: null }),
      snapDiffers({ ...RICE, s: null }, RICE), snapDiffers(RICE, { ...RICE, fi: 1.5 }), snapDiffers({ ...RICE, fi: 1.5 }, { ...RICE, fi: 1.6 }),
      snapDiffers(RICE, { ...RICE, n: 'ごはん', u: undefined }), snapDiffers({ ...RICE, fi: null }, RICE), snapDiffers(RICE, { ...RICE, est: 'e' }),
      snapDiffers(RICE, { ...RICE, fi: 0 }), snapDiffers(RICE, { ...RICE, fi: 0.04 }), snapDiffers({ ...RICE, fi: 0 }, { ...RICE, fi: 0.1 })
    ];
    expect(got).toEqual([false, false, true, false, true, true, true, true, true, false, false, false, false, false, true]);
  });
  it('from the catalogue, the recipe or the custom food now, its label kept; none when gone, the same, or not loaded', async () => {
    const db = await dbOf([
      { id: 'mext:01088', name: 'ごはん（精白米）', kcal: 156, p: 2.5, f: 0.3, c: 37.1, salt: 0 },
      { id: 'dishes:reimen', name: '冷麺', kcal: 114, p: 3.5, f: 1.2, c: 21.5, salt: 1.0, fib: 0.9 }
    ]);
    const recipe = { id: 'cabc1234', n: 'おうち丼', sv: 2, it: [{ g: 300, f: RICE }] };
    const custom: FoodCustom = { id: 'mabc1234', at: 1, who: 'A', n: '弁当', u: '1食', k: 650, p: 20, fa: null, c: null, s: null };
    const src = { db, recipes: [recipe], customs: [custom] };
    const oldRecipe: FoodSnap = { id: 'recipe:cabc1234', n: 'おうち丼', k: 150, p: 2.5, fa: 0.3, c: 37.1, s: 0, u: '1人前' };
    const oldCustom: FoodSnap = { id: 'custom:mabc1234', n: '弁当', k: 600, p: 20, fa: null, c: null, s: null, u: '1食', sv: true };
    expect([
      latestSnap(RICE, src), latestSnap({ ...REIMEN, u: '1人前×2' }, src), latestSnap(REIMEN, { ...src, db: null }), latestSnap({ ...RICE, id: 'mext:99999' }, src),
      latestSnap(oldRecipe, src, 150), latestSnap(oldCustom, src), latestSnap({ ...oldCustom, sv: undefined, u: undefined }, src)
    ]).toEqual([
      null, { id: 'dishes:reimen', n: '冷麺', k: 114, p: 3.5, fa: 1.2, c: 21.5, s: 1, fi: 0.9, u: '1人前×2' }, null, null,
      { id: 'recipe:cabc1234', n: 'おうち丼', k: 156, p: 2.5, fa: 0.3, c: 37.1, s: 0, u: '1人前' },
      { id: 'custom:mabc1234', n: '弁当', k: 650, p: 20, fa: null, c: null, s: null, u: '1食', sv: true }, null
    ]);
  });
  it('fibre newly known is fresher values; a portion whose weight changed takes its grams now (冷麺 1杯 606 → 556 g)', async () => {
    const db = await dbOf([
      { id: 'mext:01088', name: 'ごはん（精白米）', kcal: 156, p: 2.5, f: 0.3, c: 37.1, salt: 0, fib: 1.5 },
      { id: 'eatout:reimen', name: '冷麺', kcal: 94, p: 3.4, f: 1.1, c: 17.8, salt: 1.1, fib: 0.6, portions: [{ label: '1杯', g: 556 }] }
    ]);
    const src = { db, recipes: [], customs: [] };
    const REI: FoodSnap = { id: 'eatout:reimen', n: '冷麺', k: 94, p: 3.4, fa: 1.1, c: 17.8, s: 1.1, fi: 0.6, u: '1杯' };
    expect([
      latestFood({ g: 150, f: RICE }, src), latestFood({ g: 606, f: REI }, src), latestFood({ g: 1212, f: { ...REI, u: '1杯×2' } }, src),
      latestFood({ g: 556, f: REI }, src), latestFood({ g: 606, f: { ...REI, u: undefined } }, src), latestFood({ g: 606, f: { ...REI, u: '大盛' } }, src)
    ]).toEqual([{ g: 150, f: { ...RICE, fi: 1.5 } }, { g: 556, f: REI }, { g: 1112, f: { ...REI, u: '1杯×2' } }, null, null, null]);
  });
  it('a recipe now by weight that was by the serving (or back): its grams its 1人前’s now, with the label; without, none', () => {
    const SALT_KOMBU: FoodSnap = { id: 'custom:mkombu01', n: 'しおこんぶ', k: 10, p: 0.8, fa: 0, c: 1.9, s: 1, fi: 0.6, u: '1食', sv: true };
    const OATS: FoodSnap = { id: 'mext:01004', n: 'オートミール', k: 350, p: 13.7, fa: 5.7, c: 69.1, s: 0, fi: 9.4 };
    // logged while the しおこんぶ had no weight (by the serving), weighed since (a pinch, 5 g: recipeFlow weighItem)
    const r = { id: 'cmix0001', n: '朝のオート', sv: 1, it: [{ g: 45, f: OATS }, weighItem({ g: 100, f: SALT_KOMBU }, 5)!] };
    const src = { db: null, recipes: [r], customs: [] };
    const was: FoodSnap = { id: 'recipe:cmix0001', n: '朝のオート', k: 167.5, p: 7, fa: 2.6, c: 33, s: 1, fi: 4.8, u: '1人前', sv: true };
    expect(latestFood({ g: 100, f: was }, src)).toEqual({ g: 50, f: { id: 'recipe:cmix0001', n: '朝のオート', k: 335, p: 13.93, fa: 5.13, c: 65.99, s: 2, fi: 9.66, u: '1人前' } });
    expect(latestFood({ g: 100, f: { ...was, u: undefined } }, src)).toBeNull();
    // still unweighed: by the serving, as logged
    expect(latestFood({ g: 100, f: was }, { ...src, recipes: [{ ...r, it: [{ g: 45, f: OATS }, { g: 100, f: SALT_KOMBU }] }] })).toBeNull();
  });
  it('スープ半分 (`hs`) is kept: never offered as a change, carried onto the food now', async () => {
    const db = await dbOf([{ id: 'dishes:reimen', name: '冷麺', kcal: 114, p: 3.5, f: 1.2, c: 21.5, salt: 1.0, fib: 0.9 }]);
    const src = { db, recipes: [], customs: [] };
    const same: FoodSnap = { ...REIMEN, k: 114, p: 3.5, fa: 1.2, c: 21.5, s: 1, fi: 0.9, hs: 0.5 };
    expect([latestSnap(same, src), latestSnap({ ...REIMEN, hs: 0.5 }, src)?.hs, latestSnap(REIMEN, src)?.hs]).toEqual([null, 0.5, undefined]);
  });
  it('a catalog item by the serving (sv, a chain menu’s): its snapshot per serving, kept so, updated as one', async () => {
    const db = await dbOf([{ id: 'kal:1', name: '牛丼', kcal: 733, p: 22.9, f: 25, c: 104.1, salt: 2.9, sv: true, est: 'e', portions: [{ label: '1食', g: 100 }] }]);
    const old: FoodSnap = { id: 'kal:1', n: '牛丼', k: 700, p: 22.9, fa: 25, c: 104.1, s: 2.9, u: '1食', sv: true };
    const src = { db, recipes: [], customs: [] };
    expect([latestSnap(old, src), latestSnap({ ...old, k: 733 }, src), latestSnap({ ...old, sv: undefined, u: undefined }, src)]).toEqual([{ ...old, k: 733, est: 'e' }, null, null]);
  });
  describe('a barcode-only product (a shard’s, not in products.json): its shard fetched for it', () => {
    afterEach(() => (vi.unstubAllGlobals(), forgetShards()));
    // the cone as logged on 11-19 (P 36 a 100 g) and as its shard has it now
    const CONE: FoodSnap = { id: 'off:4901005312005', n: 'Giant - Cookies And Chocolate', k: 176, p: 36, fa: 9.3, c: 19.7, s: 0.1, u: '1袋' };
    const shard = JSON.stringify(toColumns({ source: 'off', items: [{ id: CONE.id, name: CONE.n, kcal: 176, p: 2.6, f: 9.3, c: 19.7, salt: 0.1, portions: [{ label: '1袋', g: 140 }] }] }));
    it('after the products, once: offered its values now; a product OFF gave online (in no shard) or offline: none', async () => {
      const asked: string[] = [];
      vi.stubGlobal('fetch', async (href: string) => (asked.push(href.replace(/^.*\/food\//, '')), href.includes('/05.json') ? new Response(shard) : new Response(null, { status: 404 })));
      const db = emptyDb({ version: 'x', datasets: [], jan: 'j1' });
      let products = 0;
      db.wantMore = async () => void products++;
      const src = { db, recipes: [], customs: [] };
      expect(latestSnap(CONE, src)).toBeNull();
      expect(await shardsFor(db, [CONE.id, 'off:4902102072618', 'mext:01088', 'custom:mabc1234'])).toBe(true);
      expect(products).toBe(1);
      expect(latestSnap(CONE, src)).toEqual({ ...CONE, p: 2.6 });
      // (asked again, as each render of the day may: nothing fetched twice, nothing new)
      expect(await shardsFor(db, [CONE.id, 'off:4902102072618'])).toBe(false);
      expect(asked).toEqual(['jan/05.json?v=j1', 'jan/18.json?v=j1']);
      vi.stubGlobal('fetch', async () => { throw new TypeError('offline'); });
      const off = emptyDb({ version: 'x', datasets: [], jan: 'j2' });
      expect(await shardsFor(off, [CONE.id])).toBe(false);
      expect(await shardsFor(emptyDb({ version: 'x', datasets: [] }), [CONE.id])).toBe(false);
    });
  });
});

describe('材料を最新の値にする: a recipe’s ingredient as it is now (latestIngredient)', () => {
  const KOMBU: FoodCustom = { id: 'mkombu01', at: 1, who: 'A', n: 'しおこんぶ', u: 'ひとつまみ', k: 10, p: 0.8, fa: 0, c: 1.9, s: 1 };
  const now = { ...KOMBU, k: 12, fi: 0.4 };
  it('one weighed in the editor: its serving now at the same weight a serving, its grams kept (×2 too); unchanged: none', () => {
    const src = { db: null, recipes: [], customs: [now] };
    const one = weighItem({ g: 100, f: customSnap(KOMBU, 'ひとつまみ') }, 5)!;
    const two = weighItem({ g: 200, f: customSnap(KOMBU, 'ひとつまみ×2') }, 5)!;
    expect([one.g, one.f.k, two.g]).toEqual([5, 200, 10]);
    expect(latestIngredient(one, src)).toEqual({ g: 5, f: { id: 'custom:mkombu01', n: 'しおこんぶ', k: 240, p: 16, fa: 0, c: 38, s: 20, fi: 8, u: 'ひとつまみ' } });
    expect(latestIngredient(two, src)).toMatchObject({ g: 10, f: { k: 240, u: 'ひとつまみ×2' } });
    expect(latestIngredient(one, { ...src, customs: [KOMBU] })).toBeNull();
    // still by the serving: as an entry's (latestFood), a serving's values now
    expect(latestIngredient({ g: 100, f: customSnap(KOMBU, 'ひとつまみ') }, src)).toMatchObject({ g: 100, f: { k: 12, sv: true } });
  });
  it('any other: as an entry’s, typed grams kept; gone or not loaded: none', async () => {
    const db = await dbOf([{ id: 'mext:01088', name: 'ごはん（精白米）', kcal: 168, p: 2.5, f: 0.3, c: 37.1, salt: 0, fib: 1.5 }]);
    const x = { g: 210, f: { ...RICE, u: undefined } };
    expect(latestIngredient(x, { db, recipes: [], customs: [] })).toEqual({ g: 210, f: { ...RICE, u: undefined, k: 168, fi: 1.5 } });
    expect(latestIngredient(x, { db: null, recipes: [], customs: [] })).toBeNull();
    // picked by a portion: its grams still the user's (what went in the pot), never the label's (茶碗1杯 is 150 g)
    expect(latestIngredient({ g: 600, f: RICE }, { db, recipes: [], customs: [] })).toMatchObject({ g: 600, f: { k: 168, u: '茶碗1杯' } });
  });
  it('the link says what changes most, as an entry’s', () => {
    expect([freshText('food.fresh.act', { k: 'fi', from: null, to: 4.2 }), freshText('food.fresh.act', { k: 'k', from: 480, to: 520 }), freshText('food.fresh.act', null)])
      .toEqual(['最新の値にする（食物繊維 4.2 g）', '最新の値にする（480→520 kcal）', '最新の値にする']);
  });
});

describe('a recipe’s ingredients resolved at use (resolveItems, bigChange)', () => {
  const ONION: FoodSnap = { id: 'mext:06153', n: 'たまねぎ 生', k: 33, p: 1, fa: 0.1, c: 8.4, s: 0, fi: 1.5 };
  const ROUX: FoodSnap = { id: 'mext:17051', n: 'カレールウ', k: 474, p: 6.5, fa: 34.1, c: 44.7, s: 10.6, fi: 6.4 };
  const SAUCE: FoodCustom = { id: 'msauce01', at: 1, who: 'B', n: 'たれ', u: '大さじ1', g: 18, k: 40, p: 0.5, fa: 0, c: 8, s: 1.6 };
  const IT = [{ g: 400, f: ONION }, { g: 80, f: ROUX }, { g: 36, f: customSnap(SAUCE, '大さじ1×2') }, { g: 100, f: { ...ONION, id: 'mext:99999' } }];
  const row = (id: string, kcal: number, salt: number, fib: number) => ({ id, name: 'x', kcal, p: 1, f: 0.1, c: 8.4, salt, fib });
  it('loaded: each as its food is now, the grams kept; not loaded, gone or the same: as kept', async () => {
    const db = await dbOf([row('mext:06153', 40, 0, 1.5), { ...row('mext:17051', 474, 10.6, 6.4), p: 6.5, f: 34.1, c: 44.7 }]);
    const r = resolveItems(IT, { db, recipes: [], customs: [SAUCE] });
    expect([r.auto, r.big.every((x) => x === null), r.it.map((x) => [x.g, x.f.k])]).toEqual([1, true, [[400, 40], [80, 474], [36, customSnap(SAUCE).k], [100, 33]]]);
    expect(r.it[0].f).toMatchObject({ id: 'mext:06153', n: 'x', p: 1, c: 8.4 }) // (the catalogue's name now too);
    expect(resolveItems(IT, { db: null, recipes: [], customs: [] })).toEqual({ it: IT, auto: 0, big: [null, null, null, null] });
  });
  it('a custom food its owner edited: its serving now, at the user’s grams (2 tablespoons)', () => {
    const r = resolveItems(IT, { db: null, recipes: [], customs: [{ ...SAUCE, k: 46 }] });
    expect([r.auto, r.it[2]]).toEqual([1, { g: 36, f: customSnap({ ...SAUCE, k: 46 }, '大さじ1×2') }]);
  });
  it('a change past 30 % of the ingredient’s kcal or 1 g of its salt is kept as it was, offered', async () => {
    const db = await dbOf([row('mext:06153', 44, 0, 1.5), { ...row('mext:17051', 474, 12, 6.4), p: 6.5, f: 34.1, c: 44.7 }]);
    const r = resolveItems(IT, { db, recipes: [], customs: [SAUCE] });
    // たまねぎ 132 → 176 kcal (+33 %), the roux's salt 8.5 → 9.6 g (+1.1 g)
    expect([r.auto, r.it, r.big.map((x) => x && [x.g, x.f.k, x.f.s])]).toEqual([0, IT, [[400, 44, 0], [80, 474, 12], null, null]]);
    expect([bigChange({ g: 400, f: ONION }, { g: 400, f: { ...ONION, k: 42.9 } }), bigChange({ g: 80, f: ROUX }, { g: 80, f: { ...ROUX, s: 11.8 } })]).toEqual([false, false]);
  });
});

describe('freshChange: what an update’s button says', () => {
  const OATS: FoodSnap = { id: 'mext:01004', n: 'オートミール', k: 350, p: 13.7, fa: 5.7, c: 69.1, s: 6.2 };
  it('kcal from 5 % on, else salt, else fibre (newly known: from null), else kcal at all; nothing shown: none', () => {
    const one = (f: FoodSnap, g = 50) => [{ g, f }];
    expect([
      freshChange(one(OATS), one({ ...OATS, k: 380 })), // 175 → 190: 8.6 %
      freshChange(one(OATS), one({ ...OATS, k: 360, s: 2.8 })), // 175 → 180 under 5 %: the salt, 3.1 → 1.4 g
      freshChange(one(OATS), one({ ...OATS, fi: 9.4 })), // fibre newly known
      freshChange(one(OATS), one({ ...OATS, k: 352 })), // 175 → 176, nothing else
      freshChange(one(OATS), one({ ...OATS, p: 14 })), // protein only: plain
      freshChange([{ g: 50, f: OATS }, { g: 100, f: RICE }], [{ g: 40, f: OATS }, { g: 100, f: RICE }]) // a いつもの's items
    ]).toEqual([
      { k: 'k', from: 175, to: 190 }, { k: 's', from: 3.1, to: 1.4 }, { k: 'fi', from: null, to: 4.7 }, { k: 'k', from: 175, to: 176 }, null,
      { k: 'k', from: 331, to: 296 }
    ]);
  });
});
