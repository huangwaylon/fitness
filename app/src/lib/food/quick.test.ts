import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { decodeItems } from './db.ts';
import type { Shipped } from './types.ts';
import type { FoodEntry, FoodSnap, Meal } from '#lib/contract/food.ts';
import { kindOf, QUICK_GENERIC, quickKinds, usualOf, type CatOf } from './quick.ts';

const TODAY = '2026-11-24';
const snap = (id: string, n: string, u?: string): FoodSnap => ({ id, n, k: 40, p: 0, fa: 0, c: 3, s: 0, ...(u ? { u } : {}) });
let seq = 0;
/** An entry of A's: `d` its day, `at` when logged (default: noon that day, in order made). */
const ent = (f: FoodSnap, g: number, d = TODAY, m: Meal = 'd', at = Date.parse(`${d}T03:00:00Z`) + seq++): FoodEntry =>
  ({ id: `f${seq}`, who: 'A', at, d, m, g, f });
const CATS: Record<string, string> = { 'mext:16006': '酒', 'eatout:highball': '酒', 'mext:16055': '飲料', 'mext:17116': '調味料', 'mext:13003': '乳製品', 'mext:01088': '主食' };
const cat: CatOf = (id) => CATS[id];
const beer = (u = '350ml缶') => snap('mext:16006', 'ビール', u);
const hb = snap('eatout:highball', 'ハイボール', '1杯');

describe('kindOf', () => {
  it('maps the catalog categories, name rules where a category is broad or unknown', () => {
    expect(kindOf('酒', 'ビール')).toBe('alcohol');
    expect(kindOf('酒', 'ノンアルコールビール')).toBe('drink');
    expect(kindOf('飲料', '麦茶')).toBe('drink');
    expect(kindOf('油脂', 'サラダ油（調合油）')).toBe('oil');
    expect(kindOf('調味料', 'ごまドレッシング')).toBe('oil');
    expect(kindOf('調味料', 'こいくちしょうゆ')).toBeNull();
    expect(kindOf('乳製品', '牛乳')).toBe('drink');
    expect(kindOf('乳製品', 'ヨーグルト（無糖）')).toBeNull();
    expect(kindOf('菓子・デザート', 'しょうゆせんべい')).toBe('snack');
    expect(kindOf('ナッツ・種', 'アーモンド（素焼き・無塩）')).toBe('snack');
    expect(kindOf('主食', 'ごはん（精白米）')).toBeNull();
    expect(kindOf('野菜', '緑茶')).toBeNull(); // a category that says otherwise wins
  });
  it('by name alone for a custom food, クイック or the catalog not in', () => {
    expect(kindOf(undefined, '家のコーヒー')).toBe('drink');
    expect(kindOf(undefined, 'レモンサワー')).toBe('alcohol');
    expect(kindOf(undefined, 'オリーブオイル')).toBe('oil');
    expect(kindOf(undefined, 'チョコ1かけ')).toBe('snack');
    expect(kindOf(undefined, '抹茶アイス')).toBe('snack');
    expect(kindOf(undefined, '茶碗蒸し')).toBeNull();
    expect(kindOf('コンビニ', 'ペットボトルの緑茶')).toBe('drink');
    expect(kindOf(undefined, '社食の日替わり定食')).toBeNull();
  });
});

describe('usualOf', () => {
  it('the most-logged food of the kind, at its most-logged amount, its latest snapshot', () => {
    const es = [ent(hb, 350, '2026-11-23'), ent(beer(), 353, '2026-11-20'), ent(beer('500ml缶'), 504, '2026-11-21'), ent(beer(), 353, '2026-11-10')];
    const u = usualOf(es, 'alcohol', cat, TODAY)!;
    expect(u.f.id).toBe('mext:16006');
    expect(u).toMatchObject({ g: 353, f: { u: '350ml缶', n: 'ビール' } });
  });
  it('a tie in count goes to the latest; an amount tie too', () => {
    const es = [ent(beer(), 353, '2026-11-20'), ent(hb, 350, '2026-11-22')];
    expect(usualOf(es, 'alcohol', cat, TODAY)!.f.id).toBe('eatout:highball');
    const amt = [ent(beer('500ml缶'), 504, '2026-11-20'), ent(beer(), 353, '2026-11-22')];
    expect(usualOf(amt, 'alcohol', cat, TODAY)!.g).toBe(353);
    // same day: the one logged later
    const day = [ent(beer(), 353, '2026-11-22', 'd', 2000), ent(beer('500ml缶'), 504, '2026-11-22', 'd', 1000)];
    expect(usualOf(day, 'alcohol', cat, TODAY)!.g).toBe(353);
  });
  it('only the window (today and QUICK_DAYS − 1 before), no future day, no いつもの’s virtual entry', () => {
    const old = Array.from({ length: 5 }, () => ent(hb, 350, '2026-08-01'));
    const es = [...old, ent(beer(), 353, '2026-11-01'), ent(hb, 350, '2026-11-25'), { ...ent(hb, 350), rep: 'r1' }];
    expect(usualOf(es, 'alcohol', cat, TODAY)!.f.id).toBe('mext:16006');
    expect(usualOf(es, 'alcohol', cat, TODAY, 200)!.f.id).toBe('eatout:highball');
  });
  it('none of the kind: null (the caller takes QUICK_GENERIC)', () => {
    expect(usualOf([ent(snap('mext:01088', 'ごはん（精白米）'), 150)], 'drink', cat, TODAY)).toBeNull();
    expect(usualOf([], 'oil', cat, TODAY)).toBeNull();
  });
  it('a food with no portion label keeps none', () => {
    const custom = snap('custom:x', '家のコーヒー');
    expect(usualOf([ent(custom, 180)], 'drink', cat, TODAY)).toEqual({ f: custom, g: 180 });
  });
});

describe('quickKinds', () => {
  it('each meal its own, plus any the person logged in it', () => {
    expect(quickKinds('b', [], cat, TODAY)).toEqual(['drink', 'oil']);
    expect(quickKinds('d', [], cat, TODAY)).toEqual(['drink', 'oil', 'alcohol']);
    expect(quickKinds('s', [], cat, TODAY)).toEqual(['drink', 'snack']);
    expect(quickKinds('s', [ent(beer(), 353, '2026-11-20', 's')], cat, TODAY)).toEqual(['drink', 'snack', 'alcohol']);
    expect(quickKinds('b', [ent(beer(), 353, '2026-11-20', 's')], cat, TODAY)).toEqual(['drink', 'oil']);
  });
});

describe('QUICK_GENERIC', () => {
  it('each a catalog food of its own kind, its portion as the food data has it', () => {
    const path = fileURLToPath(new URL('../../../static/food/foods.json', import.meta.url));
    const items = new Map(decodeItems(JSON.parse(readFileSync(path, 'utf8')) as Shipped).map((it) => [it.id, it]));
    for (const [k, g] of Object.entries(QUICK_GENERIC)) {
      const it = items.get(g.id)!;
      expect(it.name, g.id).toBe(g.n);
      expect(kindOf(it.cat, it.name)).toBe(k);
      expect(it.portions?.find((p) => p.label === g.u)?.g).toBe(g.g);
    }
  });
});
