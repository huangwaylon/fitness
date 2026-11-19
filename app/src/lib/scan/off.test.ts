import { describe, expect, it, vi } from 'vitest';
import { gramsOf, offItem, offLookup, offUrl, partialScaling, type OffProduct } from './off.ts';

const NO = 'Open Food Factsの値（オンライン）';
const cola: OffProduct = {
  product_name: 'Coca-Cola', product_name_ja: '', brands: 'Coca-Cola, The Coca-Cola Company', serving_size: '500 ml',
  nutriments: { 'energy-kcal_100g': 45, 'energy-kcal_serving': 225, proteins_100g: 0, fat_100g: 0, carbohydrates_100g: 11.3, salt_100g: 0 }
};

describe('offItem: an Open Food Facts product as our item', () => {
  it('per 100 g as OFF has it, the serving a 1食分 portion (its label read), the trust line its note', () => {
    expect(offItem('4902102072618', cola, NO)).toEqual({ id: 'off:4902102072618', name: 'Coca-Cola', kcal: 45, p: 0, f: 0, c: 11.3, salt: 0, portions: [{ label: '1食分', g: 500 }], note: NO });
  });
  it('the Japanese name first, the brand kept beside it, serving_quantity over the label, fibre when known', () => {
    const it = offItem('4901234567894', { product_name_ja: 'ポテトチップス うすしお', product_name: 'Potato chips', brands: 'カルビー', serving_size: '1袋 (28g)', serving_quantity: 30, nutriments: { 'energy-kcal_100g': 554, proteins_100g: 4.73, fat_100g: 35.1, carbohydrates_100g: 53.66, salt_100g: 1.04, fiber_100g: 4.2 } }, NO);
    expect(it).toEqual({ id: 'off:4901234567894', name: 'ポテトチップス うすしお', brand: 'カルビー', kcal: 554, p: 4.7, f: 35.1, c: 53.7, salt: 1, fib: 4.2, portions: [{ label: '1食分', g: 30 }], note: NO });
  });
  it('no serving weight: no portions (100 g only); the generic name when it has no other', () => {
    expect(offItem('1', { generic_name: '緑茶', nutriments: { 'energy-kcal_100g': 0 } }, NO)).toEqual({ id: 'off:1', name: '緑茶', kcal: 0, p: null, f: null, c: null, salt: null, note: NO });
  });
  it('names and brands cleaned as the record cleans them; a name of only zero-width or bidi characters is none', () => {
    const n = { 'energy-kcal_100g': 100 };
    expect(offItem('1', { product_name_ja: '\u200b\u202e', product_name: ' お\u200bちゃ\n ', brands: '\u2066伊藤園\u2069, X', nutriments: n }, NO)).toMatchObject({ name: 'おちゃ', brand: '伊藤園' });
    expect(offItem('1', { product_name: 'あ'.repeat(80), nutriments: n }, NO)!.name).toHaveLength(60);
    expect(offItem('1', { product_name: '\u200b\u200f', generic_name: '\u202a\u202c', nutriments: n }, NO)).toBeNull();
  });
  it('fields part per serving (off.py partial_scaling, its test cases): not found, as the shipped data drops it', () => {
    const cone: OffProduct = { serving_quantity: 140, nutriments: { salt_100g: 0.18, sodium_100g: 0.18 / 2.5 / 1.4 } };
    expect(partialScaling(cone, 247, 36, 13, 19.71)).toBe(true);
    expect(partialScaling(cone, 176, 2.6, 9.3, 19.7)).toBe(false); // the energy fits: no evidence
    const kj: OffProduct = { serving_quantity: '80', nutriments: { 'energy-kcal_100g': 677.5, 'energy-kj_100g': 677.5 * 4.184 * 0.8 } };
    expect(partialScaling(kj, 677.5, 9, 27, 66)).toBe(true);
    expect(partialScaling({ ...kj, serving_quantity: 100 }, 677.5, 9, 27, 66)).toBe(false); // no factor
    const n = { 'energy-kcal_100g': 247, proteins_100g: 36, fat_100g: 13, carbohydrates_100g: 19.71, ...cone.nutriments };
    expect(offItem('4901234567894', { product_name: 'Giant Cone', serving_quantity: 140, nutriments: n }, NO)).toBeNull();
    expect(offItem('4901234567894', { product_name: 'Giant Cone', serving_quantity: 140, nutriments: { ...n, 'energy-kcal_100g': 176, proteins_100g: 2.6, fat_100g: 9.3 } }, NO)).not.toBeNull();
  });
  it('kcal from kJ when only that; salt from sodium when only that; a missing nutrient unknown (null)', () => {
    const it = offItem('1', { product_name: 'X', nutriments: { energy_100g: 1000, sodium_100g: 0.4, proteins_100g: 5 } }, NO)!;
    expect([it.kcal, it.salt, it.p, it.f, it.c]).toEqual([239, 1, 5, null, null]);
  });
  it('per serving with its weight: per 100 g; without one: a serving (`sv`), its values as they are', () => {
    const w = offItem('1', { product_name: 'Bar', serving_size: '40 g', nutriments: { 'energy-kcal_serving': 200, proteins_serving: 10 } }, NO)!;
    expect([w.kcal, w.p, w.sv, w.portions]).toEqual([500, 25, undefined, [{ label: '1食分', g: 40 }]]);
    const s = offItem('1', { product_name: 'Meal', serving_size: '1 pack', nutriments: { 'energy-kcal_serving': 1200, proteins_serving: 40 } }, NO)!;
    expect([s.kcal, s.p, s.sv, s.portions]).toEqual([1200, 40, true, undefined]);
  });
  it('a value out of a snapshot\'s range is unknown, never clamped; no energy, or impossible energy: no item', () => {
    expect(offItem('1', { product_name: 'X', nutriments: { 'energy-kcal_100g': 100, proteins_100g: 140, fat_100g: -1 } }, NO)).toMatchObject({ p: null, f: null });
    expect(offItem('1', { product_name: 'X', nutriments: { proteins_100g: 5 } }, NO)).toBeNull();
    expect(offItem('1', { product_name: 'X', nutriments: { 'energy-kcal_100g': 4000 } }, NO)).toBeNull();
    expect(offItem('1', { product_name: 'X' }, NO)).toBeNull();
  });
  it('a product with no name (a brand only): no item, as not found; a number as text read', () => {
    expect(offItem('1', { brands: 'Suntory', nutriments: { 'energy-kcal_100g': 120 } }, NO)).toBeNull();
    expect(offItem('1', { product_name: 'X', nutriments: { 'energy-kcal_100g': '120' } }, NO)).toMatchObject({ kcal: 120 });
  });
  it('through the shipped data\'s rules (lib/food/plausible.ts), never dropped: kJ as kcal fixed, a copied salt or impossible macros unknown, a serving of the kcal\'s grams gone', () => {
    const kj = offItem('1', { product_name: 'Viande hachée', nutriments: { 'energy-kcal_100g': 801, proteins_100g: 19, fat_100g: 14 } }, NO)!;
    expect(kj.kcal).toBe(191);
    const udon = offItem('1', { product_name: 'さぬきうどん', serving_quantity: 180, nutriments: { 'energy-kcal_100g': 129, proteins_100g: 2.5, fat_100g: 0.4, carbohydrates_100g: 29.1, salt_100g: 28.6 } }, NO)!;
    expect([udon.salt, udon.c, udon.portions]).toEqual([null, 29.1, [{ label: '1食分', g: 180 }]]);
    expect(offItem('1', { product_name: 'X', nutriments: { 'energy-kcal_100g': 45, proteins_100g: 10, fat_100g: 15, carbohydrates_100g: 20 } }, NO)).toMatchObject({ kcal: 45, p: null, f: null, c: null });
    expect(offItem('1', { product_name: 'Oil', serving_quantity: 899, nutriments: { 'energy-kcal_100g': 899, fat_100g: 99.9 } }, NO)!.portions).toBeUndefined();
  });
});

describe('gramsOf', () => {
  it('reads g and ml in a label, whatever surrounds them', () => {
    expect([gramsOf('30 g'), gramsOf('500ml'), gramsOf('1本 (350 ml)'), gramsOf('２８ｇ'), gramsOf('1 pack'), gramsOf(undefined), gramsOf('0 g'), gramsOf('9000 g')]).toEqual([30, 500, 350, 28, null, null, null, null]);
  });
});

describe('offLookup: the API asked for the code only', () => {
  const answer = (status: number, body: unknown) => vi.fn(async (..._a: Parameters<typeof fetch>) => new Response(JSON.stringify(body), { status }));
  it('asks the product URL with the fields, no credentials or referrer', async () => {
    const f = answer(200, { status: 1, product: cola });
    const a = await offLookup('4902102072618', NO, f);
    expect(a).toMatchObject({ k: 'item', item: { id: 'off:4902102072618', kcal: 45 } });
    expect(f.mock.calls[0][0]).toBe(offUrl('4902102072618'));
    expect(String(f.mock.calls[0][0])).toBe('https://world.openfoodfacts.org/api/v2/product/4902102072618.json?fields=product_name,product_name_ja,generic_name,brands,nutriments,serving_size,serving_quantity');
    expect(f.mock.calls[0][1]).toMatchObject({ credentials: 'omit', referrerPolicy: 'no-referrer' });
  });
  it('none for a 404 or a product with nothing usable; off (unreached) for a network error or a 5xx', async () => {
    expect(await offLookup('1', NO, answer(404, { status: 0 }))).toEqual({ k: 'none' });
    expect(await offLookup('1', NO, answer(200, { status: 1, product: { product_name: 'X' } }))).toEqual({ k: 'none' });
    expect(await offLookup('1', NO, answer(503, {}))).toEqual({ k: 'off' });
    expect(await offLookup('1', NO, vi.fn(async () => { throw new TypeError('Load failed'); }))).toEqual({ k: 'off' });
  });
});
