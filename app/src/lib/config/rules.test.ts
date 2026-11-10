// The rules as data: the order of the fruits, the two rewards and their lookup.
import { describe, expect, it } from 'vitest';
import { RING_FRUITS } from './rules.ts';
import { SHOP, shopPrice, PRICE_HALVED_MS } from '../contract/rules.ts';

describe('rules', () => {
  it('lists the fruits in Apple\'s ring order, then steps', () => {
    expect(RING_FRUITS).toEqual(['pear', 'peach', 'cherry', 'apple']);
  });

  it('has exactly two rewards, おやつ 20 and 外食 35 (40 and 70 before PRICE_HALVED_MS); shopPrice knows nothing else', () => {
    expect(PRICE_HALVED_MS).toBe(Date.parse('2026-11-10T15:00:00Z')); // 2026-11-11 00:00 Tokyo
    expect(SHOP.map((x) => [x.id, x.bells])).toEqual([['snack', 20], ['dinner', 35]]);
    expect([shopPrice('snack', PRICE_HALVED_MS), shopPrice('dinner', PRICE_HALVED_MS)]).toEqual([20, 35]);
    expect([shopPrice('snack', PRICE_HALVED_MS - 1), shopPrice('dinner', 0)]).toEqual([40, 70]);
    for (const v of ['cafe', 'trip', '', null, undefined, 6, {}]) for (const t of [0, PRICE_HALVED_MS]) expect(shopPrice(v, t)).toBeUndefined();
  });

});
