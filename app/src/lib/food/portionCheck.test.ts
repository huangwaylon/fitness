import { describe, expect, it } from 'vitest';
import { portionCheck } from './portionCheck.ts';
import type { Item } from './types.ts';

// the 2026-11-19 cone as Open Food Facts had it (jan/05.json before the fix): P 36 (3.6 typed 36) a 100 g, one cone 140 g
const CONE: Item = { id: 'off:4901005312005', name: 'Giant - Cookies And Chocolate', brand: 'Glico', cat: '菓子・デザート', kcal: 176, p: 36, f: 9.3, c: 19.7, salt: 0.1, portions: [{ label: '1袋', g: 140 }] };
const FIXED: Item = { ...CONE, p: 2.6 };
const of = (x: Partial<Item>): Item => ({ id: 'off:4900000000001', name: '商品', kcal: 100, p: 5, f: 3, c: 13, salt: 0.5, ...x });

describe('表示値を確認: an amount a label rarely says', () => {
  it('the cone: 50 g of protein, 58 % of its energy, energy far from 4P+9F+4C; fixed, nothing', () => {
    expect(portionCheck(CONE, 140)).toEqual(['p', 'pshare', 'energy']);
    expect(portionCheck(FIXED, 140)).toEqual([]);
  });
  it('protein over 40 g, not for a protein food (its category or name)', () => {
    expect(portionCheck(of({ kcal: 400, p: 25, f: 20, c: 25 }), 200)).toEqual(['p']);
    expect(portionCheck(of({ name: 'サラダチキン', kcal: 110, p: 24, f: 1.2, c: 0.5 }), 200)).toEqual([]);
    expect(portionCheck(of({ cat: '肉', kcal: 400, p: 25, f: 20, c: 25 }), 200)).toEqual([]);
    expect(portionCheck(of({ name: 'WPC ホエイ', cat: '菓子・デザート', kcal: 385, p: 61.4, f: 4.6, c: 22.3 }), 35)).toEqual([]);
  });
  it('protein over 35 % of the energy only where it is a surprise (sweets, drinks, bread, staples, noodles)', () => {
    expect(portionCheck(of({ cat: '飲料', kcal: 50, p: 5, f: 1, c: 5 }), 200)).toEqual(['pshare']);
    expect(portionCheck(of({ cat: 'その他', kcal: 50, p: 5, f: 1, c: 5 }), 200)).toEqual([]);
    expect(portionCheck(of({ name: 'いかせんべい', cat: '菓子・デザート', kcal: 350, p: 35, f: 2, c: 47 }), 30)).toEqual([]);
    // (under 30 kcal in the amount: too few to tell)
    expect(portionCheck(of({ cat: '飲料', kcal: 20, p: 2, f: 0.2, c: 2.5 }), 100)).toEqual([]);
  });
  it('kcal over 1500, salt over 6 g (not a soup, sauce or noodles)', () => {
    expect(portionCheck(of({ kcal: 600, p: 10, f: 40, c: 50, salt: 1 }), 300)).toEqual(['kcal']);
    expect(portionCheck(of({ salt: 4 }), 200)).toEqual(['salt']);
    expect(portionCheck(of({ cat: '麺', salt: 2.5 }), 300)).toEqual([]);
    expect(portionCheck(of({ salt: null }), 200)).toEqual([]);
  });
  it('energy more than 35 % from 4P+9F+4C (fibre 2, alcohol 7 when known); not for drinks with alcohol, sweeteners', () => {
    expect(portionCheck(of({ kcal: 300, p: 5, f: 3, c: 13 }), 100)).toEqual(['energy']);
    expect(portionCheck(of({ kcal: 40, p: 0.3, f: 0, c: 3 }), 350)).toEqual(['energy']);
    expect(portionCheck(of({ name: 'プレミアムビール', kcal: 40, p: 0.3, f: 0, c: 3 }), 350)).toEqual([]);
    expect(portionCheck(of({ cat: '酒', kcal: 40, p: 0.3, f: 0, c: 3 }), 350)).toEqual([]);
    expect(portionCheck(of({ name: 'シュガーレスキャンディ', kcal: 230, p: 0, f: 0, c: 98 }), 20)).toEqual([]);
    expect(portionCheck(of({ c: null }), 100)).toEqual([]);
  });
  it('only packaged products: never a reference food, a chain menu, a custom food or recipe; nothing at 0 g', () => {
    for (const id of ['mext:01088', 'dishes:x', 'kal:1', 'custom:mabc1234', 'recipe:cabc1234']) expect(portionCheck({ ...CONE, id }, 140)).toEqual([]);
    expect(portionCheck({ ...CONE, id: 'jbfd:1' }, 140)).toEqual(['p', 'pshare', 'energy']);
    expect(portionCheck(CONE, 0)).toEqual([]);
  });
});
