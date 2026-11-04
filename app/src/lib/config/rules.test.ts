// The rules as data: the order of the fruits, the two rewards and their lookup.
import { describe, expect, it } from 'vitest';
import { PEOPLE, RING_FRUITS, SHOP, shopPrice } from './rules.ts';

describe('rules', () => {
  it('lists the fruits in Apple\'s ring order, then steps', () => {
    expect(RING_FRUITS).toEqual(['pear', 'peach', 'cherry', 'apple']);
  });

  it('has exactly two rewards, おやつ 40 and 外食 70; shopPrice knows nothing else', () => {
    expect(SHOP.map((x) => [x.id, x.bells])).toEqual([['snack', 40], ['dinner', 70]]);
    expect(shopPrice('snack')).toBe(40);
    expect(shopPrice('dinner')).toBe(70);
    for (const v of ['cafe', 'trip', '', null, undefined, 6, {}]) expect(shopPrice(v)).toBeUndefined();
  });

});
