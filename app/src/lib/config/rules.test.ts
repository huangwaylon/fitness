// The rules as data: the order of the fruits, the two rewards and their lookup.
import { describe, expect, it } from 'vitest';
import { PEOPLE, RING_FRUITS, SHOP, shopPrice } from './rules.ts';
import { PREF_KEYS } from '#lib/contract/api.ts';

describe('rules', () => {
  it('lists the fruits in Apple\'s ring order, then steps', () => {
    expect(RING_FRUITS).toEqual(['pear', 'peach', 'cherry', 'apple']);
  });

  it('has exactly two rewards, おやつ 6 and 外食 20; shopPrice knows nothing else', () => {
    expect(SHOP.map((x) => [x.id, x.bells])).toEqual([['snack', 6], ['dinner', 20]]);
    expect(shopPrice('snack')).toBe(6);
    expect(shopPrice('dinner')).toBe(20);
    for (const v of ['cafe', 'trip', '', null, undefined, 6, {}]) expect(shopPrice(v)).toBeUndefined();
  });

  it('the Move goal defaults per person; there is no menu to edit', () => {
    expect([PEOPLE.A.moveGoal, PEOPLE.B.moveGoal]).toEqual([600, 400]);
    expect(PREF_KEYS).not.toContain('menu');
  });
});
